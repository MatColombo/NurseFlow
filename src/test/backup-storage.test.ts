// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { NurseFlowDatabase } from '../storage/db';
import { createNurseFlowStorage } from '../storage';
import { createCommands } from '../storage/commands';
import { createAppBackupService } from '@features/portability/app-service';
import { createPackage, parsePackage } from '@features/portability/codec';
import { settingsSchema } from '@domain/model';
import { settingsToken } from '@domain/portability/settings';
import { createRun, resumeRun, unwrap, reduceRun } from '@domain/runtime';
import { assertImportedReferences } from '@domain/portability/records';
import { fullBackupRecords, importedSettings } from './fixtures/backup';
import { fixtureDate } from './fixtures/domain';
let db: NurseFlowDatabase; let storage: ReturnType<typeof createNurseFlowStorage>; let service: ReturnType<typeof createAppBackupService>;
beforeEach(async () => { const name = 'F14-' + crypto.randomUUID(); db = new NurseFlowDatabase(name); await db.open(); storage = createNurseFlowStorage(name); await storage.open(); service = createAppBackupService(storage);
  const records = await fullBackupRecords(); await db.groups.bulkAdd(records.groups); await db.mediaAssets.bulkAdd(records.mediaAssets); await db.revisions.bulkAdd(records.revisions); await db.procedures.bulkAdd(records.procedures); await db.runSessions.bulkAdd(records.runSessions);
});
afterEach(async () => { storage.close(); await db.delete(); });
const context = { packageId: 'F14', exportedAt: fixtureDate, appVersion: '0.0.0' };
const state = () => Promise.all(db.tables.map((table) => table.toArray()));
async function incoming(kind: 'settings' | 'full' = 'full') { const records = kind === 'full' ? await fullBackupRecords() : { procedures: [], groups: [], revisions: [], mediaAssets: [], runSessions: [] }; return parsePackage(await createPackage(records, kind, context, importedSettings()), ['settings', 'full']); }
it('I05 settings-only snapshot/roundtrip contains no library/run/Blob/permissions; selection/cancel writes nothing, explicit replacement changes only Settings', async () => {
  const before = await state(); const exported = await service.prepareExport('settings'); const parsed = await parsePackage(exported.blob, ['settings']);
  expect(parsed.records.procedures).toEqual([]); expect(parsed.records.runSessions).toEqual([]); expect(parsed.manifest.counts.media).toBe(0); expect(parsed.settings).toEqual(settingsSchema.parse({})); expect(await state()).toEqual(before);
  const staged = await incoming('settings'); await expect(service.commit(staged, { additions: false })).rejects.toThrow();
  const current = await service.currentSettings(); await expect(service.commit(staged, { additions: false, replacement: { current, confirmed: false } })).rejects.toThrow(); expect(await state()).toEqual(before);
  const saved = await service.commit(staged, { additions: false, replacement: { current, confirmed: true } }); expect(saved.procedureIds).toEqual([]); expect(await db.settings.get('main')).toEqual(importedSettings());
  for (const table of db.tables.filter((table) => table.name !== 'settings')) expect(await table.toArray()).toEqual(before[db.tables.indexOf(table)]);
});
it('I06/I20 full snapshot includes historical pinned Ready, incomplete Draft, empty groups, exact Blob and all independent OR/AND/broken sessions; OFF preserves Settings', async () => {
  const before = await state(); const exported = await service.prepareExport('full'); const staged = await parsePackage(exported.blob, ['full']); expect(staged.records.runSessions).toHaveLength(3); expect(staged.records.groups).toHaveLength(3); expect(staged.records.revisions).toHaveLength(6);
  expect(await state()).toEqual(before); await expect(service.commit(staged, { additions: false })).rejects.toThrow(); const saved = await service.commit(staged, { additions: true }); expect(saved.settings).toBeNull(); expect(await db.settings.get('main')).toEqual(settingsSchema.parse({}));
  const procedures = await db.procedures.bulkGet(saved.procedureIds); const ids = new Set(saved.procedureIds); const revisions = (await db.revisions.toArray()).filter((revision) => ids.has(revision.procedureId));
  const groups = (await db.groups.toArray()).filter((group) => !['g-a', 'g-b', 'empty'].includes(group.id)); const runs = (await db.runSessions.bulkGet(saved.runIds)).map((run) => run!);
  assertImportedReferences({ procedures: procedures.map((procedure) => procedure!), groups, revisions, mediaAssets: [], runSessions: runs }); expect(groups).toHaveLength(3);
  for (const run of runs) { const revision = revisions.find((revision) => revision.id === run.pinnedRevisionId)!; const resumed = unwrap(resumeRun(run, revision)); expect(resumed).toEqual(run); expect(run.id).not.toMatch(/^run-/); }
  const parallel = runs.find((run) => 'runtimeVersion' in run && run.groups.length > 0)!; if (!('runtimeVersion' in parallel)) throw new Error('fixture');
  expect(parallel.tokens.filter((token) => token.completed)).toHaveLength(1); expect(parallel.currentNodeId).not.toBe('task-3'); const pinned = revisions.find((revision) => revision.id === parallel.pinnedRevisionId)!;
  expect(unwrap(reduceRun(parallel, pinned, { type: 'finish-activity' }, fixtureDate))).not.toBeNull();
  const broken = runs.find((run) => run.status === 'interrupted')!; expect('runtimeVersion' in broken && broken.interruption?.formerNodeId).toBe('removed-card');
  for (const table of db.tables) for (const row of before[db.tables.indexOf(table)]!) expect(await table.toArray()).toContainEqual(row);
});
it('I07/I16 full + separately authorized Settings is one tx: failure of the last Settings write rolls back groups/assets/revisions/procedures/runs; Retry succeeds', async () => {
  const staged = await incoming(); const current = await service.currentSettings(); const before = await state(); const quota = () => { throw new DOMException('F14 quota', 'QuotaExceededError'); }; db.settings.hook('updating', quota);
  storage.close(); service = createAppBackupService({ ...storage, commands: createCommands(db) });
  const consent = { additions: true, replacement: { current, confirmed: true } }; await expect(service.commit(staged, consent)).rejects.toThrow('quota'); expect(await state()).toEqual(before);
  db.settings.hook('updating').unsubscribe(quota); const saved = await service.commit(staged, consent); expect(saved.runIds).toHaveLength(3); expect(await db.settings.get('main')).toEqual(importedSettings());
});
it('stale Settings consent rejects before adding anything; new Current→Imported review is required', async () => {
  const staged = await incoming(); const current = await service.currentSettings(); await db.settings.put(settingsSchema.parse({ uiScalePt: 30 })); const before = await state();
  await expect(service.commit(staged, { additions: true, replacement: { current, confirmed: true } })).rejects.toMatchObject({ code: 'stale' }); expect(await state()).toEqual(before);
  expect(settingsToken(await service.currentSettings())).not.toBe(settingsToken(current));
});
it('I20 multiple runs for one procedure retain their different pinned revisions across repeated full restores', async () => {
  const records = await fullBackupRecords(); const latest = records.revisions.find((revision) => revision.id === 'r-0-latest')!;
  records.runSessions.push(unwrap(createRun(latest, 'second-run-same-procedure', fixtureDate)));
  const staged = await parsePackage(await createPackage(records, 'full', context, importedSettings()), ['full']);
  const first = await service.commit(staged, { additions: true }); const second = await service.commit(staged, { additions: true }); expect(new Set([...first.runIds, ...second.runIds]).size).toBe(8);
  for (const saved of [first, second]) { const runs = (await db.runSessions.bulkGet(saved.runIds)).map((run) => run!); const same = runs.filter((run) => run.procedureId === runs.find((run) => 'runtimeVersion' in run && run.groups.length === 0 && run.status === 'active')!.procedureId);
    expect(same).toHaveLength(2); expect(new Set(same.map((run) => run.pinnedRevisionId)).size).toBe(2);
    for (const run of same) expect(unwrap(resumeRun(run, await db.revisions.get(run.pinnedRevisionId)))).toEqual(run);
  }
});
it('empty installation exports/imports a full backup with empty groups; strict Settings reject unknown browser permissions and out-of-range scale', async () => {
  const empty = { procedures: [], groups: [{ id: 'empty', name: 'Vuoto', order: 0, createdAt: fixtureDate }], revisions: [], mediaAssets: [], runSessions: [] };
  const parsed = await parsePackage(await createPackage(empty, 'full', context, importedSettings()), ['full']); const saved = await service.commit(parsed, { additions: true }); expect(saved.runIds).toEqual([]); expect(await db.groups.count()).toBe(4);
  expect(() => settingsSchema.parse({ ...importedSettings(), browserPermissions: 'granted' })).toThrow(); expect(() => settingsSchema.parse({ uiScalePt: 49 })).toThrow();
});
