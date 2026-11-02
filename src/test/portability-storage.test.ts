// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NurseFlowDatabase } from '../storage/db';
import { createNurseFlowStorage } from '../storage/index';
import { createCommands } from '../storage/commands';
import { createPortabilityService, stagedCandidates } from '@features/portability/service';
import { createPackage, jsonBytes, sealPackage } from '@features/portability/codec';
import { importedReadyValidation } from '@domain/portability/validation';
import { assertImportedReferences } from '@domain/portability/records';
import { settingsSchema } from '@domain/model';
import { portableRecords } from '@test/fixtures/portable';
import { fixtureDate } from '@test/fixtures/domain';
import { resumeRun, unwrap } from '@domain/runtime';
let db: NurseFlowDatabase; let storage: ReturnType<typeof createNurseFlowStorage>; let service: ReturnType<typeof createPortabilityService>;
beforeEach(async () => {
  const name = 'F13-' + crypto.randomUUID(); db = new NurseFlowDatabase(name); await db.open(); storage = createNurseFlowStorage(name); await storage.open(); service = createPortabilityService(storage);
  const records = await portableRecords(10); await db.groups.bulkAdd(records.groups); await db.mediaAssets.bulkAdd(records.mediaAssets); await db.revisions.bulkAdd(records.revisions); await db.procedures.bulkAdd(records.procedures);
  await createCommands(db).startOrResumeReady('p-0', 'r-0');
});
afterEach(async () => { storage.close(); await db.delete(); });
async function snapshot() { return Promise.all(db.tables.map((table) => table.toArray())); }
async function file(selected?: string[]) { const prepared = await service.prepareExport(selected); return new File([prepared.blob], prepared.name, { type: 'application/zip' }); }
describe('F13 durable package export and additive import I01–I04/I08–I16/E10/E11/E13/E15', () => {
  it('consistent snapshot excludes sessions/settings, respects selected IDs and full-library scope includes empty groups; reads have no mutations', async () => {
    const before = await snapshot(); const one = await service.prepareExport(['p-0']); const many = await service.prepareExport(['p-0', 'p-1']); const all = await service.prepareExport();
    expect(one.kind).toBe('procedure'); expect(many.kind).toBe('library'); expect(all.count).toBe(10); expect(await snapshot()).toEqual(before);
    await expect(service.prepareExport(['removed'])).rejects.toThrow('selection');
    const { parsePackage } = await import('@features/portability/codec'); expect((await parsePackage(all.blob)).records.groups).toHaveLength(3); expect((await parsePackage(one.blob)).records.runSessions).toEqual([]);
  });
  it('two good files plus a wrong-scope file stage read-only, start selected, subset only needed groups/media, then add three independent usable Ready copies', async () => {
    const input = await file(['p-0']); const settingsFile = await sealPackage(new Map([['settings.json', jsonBytes(settingsSchema.parse({ uiScalePt: 48 }))]]), { packageId: 'wrong-scope', exportedAt: fixtureDate, appVersion: '0.0.0', packageKind: 'settings', counts: { procedures: 0, groups: 0, revisions: 0, media: 0, runs: 0 }, missingAssets: [] });
    const before = await snapshot(); const stage = await service.stage([input, new File([settingsFile], 'settings.nflib'), input], 0, 0); expect(stage.valid).toHaveLength(2); expect(stage.rejected).toMatchObject([{ code: 'scope', kind: 'settings' }]); expect(await snapshot()).toEqual(before);
    const items = stagedCandidates(stage.valid); const first = await service.importSelected(stage.valid, new Set([items[0]!.key]), true);
    const second = await service.importSelected([stage.valid[0]!], new Set([items[0]!.key]), true); const third = await service.importSelected([stage.valid[0]!], new Set([items[0]!.key]), true);
    const ids = [...first.procedureIds, ...second.procedureIds, ...third.procedureIds]; expect(new Set(ids).size).toBe(3);
    for (const id of ids) {
      const procedure = (await db.procedures.get(id))!; expect(procedure.groupId).not.toBe('g-a'); const ready = (await db.revisions.get(procedure.readyRevisionId!))!; const draft = (await db.revisions.get(procedure.workingDraftId!))!;
      expect(ready.state).toBe('ready'); expect(draft.state).toBe('working-draft'); expect(ready.graph.nodes.some((node) => ['start', 'shared', 'decision'].includes(node.id))).toBe(false);
      expect(importedReadyValidation(ready, new Set((await db.mediaAssets.toArray()).map((asset) => asset.id))).problems).toEqual([]);
      const run = await storage.commands.startOrResumeReady(id, ready.id); expect(unwrap(resumeRun(run, ready)).pinnedRevisionId).toBe(ready.id);
    }
    const original = await snapshot(); before.forEach((rows, index) => { for (const row of rows) expect(original[index]).toContainEqual(row); });
    expect((await db.settings.get('main'))?.uiScalePt).toBe(13); expect(await db.groups.count()).toBe(6);
  });
  it('quota after groups/media/revisions were inserted rolls back every store; explicit Retry adds exactly the selection', async () => {
    const staged = await service.stage([await file(['p-0', 'p-1'])], 0, 0); const items = stagedCandidates(staged.valid); const selected = new Set(items.map((item) => item.key)); const before = await snapshot();
    const quota = () => { throw new DOMException('quota F13', 'QuotaExceededError'); }; db.procedures.hook('creating', quota);
    // Hooks belong to the service's connection too.
    storage.close(); service = createPortabilityService({ ...storage, commands: createCommands(db) });
    await expect(service.importSelected(staged.valid, selected, true)).rejects.toThrow('quota'); expect(await snapshot()).toEqual(before);
    db.procedures.hook('creating').unsubscribe(quota); const saved = await service.importSelected(staged.valid, selected, true); expect(saved.procedureIds).toHaveLength(2);
  });
  it('new sources use one complete remap for shared nodes, phases/outcomes/media and historical warnings, with no W07 collision to existing assets', async () => {
    const records = await portableRecords(1, false); const revision = records.revisions.find((revision) => revision.state === 'ready')!;
    if (revision.state !== 'ready') throw new Error('fixture'); revision.warningsAtConfirmation = [{ rule: 'W08', locationId: 'deleted-location' }];
    const decision = revision.graph.nodes.find((node) => node.kind === 'decision')!; if (decision.kind !== 'decision') throw new Error('fixture');
    decision.outcomes[0]!.destination = { kind: 'broken', formerNodeId: 'deleted-location', formerTitle: 'Rimosso' }; revision.graph.nodes = revision.graph.nodes.filter((node) => node.id !== 'a-step');
    const encoded = await createPackage(records, 'procedure', { packageId: 'history', exportedAt: fixtureDate, appVersion: '0.0.0' }); const staged = await service.stage([new File([encoded], 'history.nfproc')], 0, 0);
    const saved = await service.importSelected(staged.valid, new Set(stagedCandidates(staged.valid).map((item) => item.key)), true);
    const procedure = (await db.procedures.get(saved.procedureIds[0]!))!; const revisions = await db.revisions.where('procedureId').equals(procedure.id).toArray();
    assertImportedReferences({ procedures: [procedure], groups: [(await db.groups.get(procedure.groupId!))!], revisions, mediaAssets: [], runSessions: [] });
    const ready = revisions.find((revision) => revision.state === 'ready')!; expect(ready.graph.nodes.some((node) => node.id === 'deleted-location')).toBe(false);
    expect(ready.state === 'ready' && ready.warningsAtConfirmation[0]?.locationId).toBe('deleted-location');
  });
});
