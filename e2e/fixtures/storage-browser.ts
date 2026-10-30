import { Dexie } from 'dexie';
import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands, type ReadyValidator } from '../../src/storage/commands';
import { createRepositories } from '../../src/storage/repositories';
import { schemaV1 } from '../../src/storage/migrations/schema';
import { convergenceGraph, exampleRecords, exampleRun, mediaGraph } from '../../src/test/fixtures/domain';

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
// This test-only validator is bundled solely by Playwright, never in the app.
const acceptFixture: ReadyValidator = () => ({ validatorSchemaVersion: 1, problems: [], warnings: [] });

export async function exerciseStorage() {
  const name = `NurseFlow-F01-browser-${crypto.randomUUID()}`;
  const db = new NurseFlowDatabase(name);
  const commands = createCommands(db); const repositories = createRepositories(db);
  await db.open();
  try {
    check(db.tables.length === 8, 'Tables not created');
    check((await repositories.settings.get()).uiScalePt === 13, 'Wrong settings defaults');
    const { procedure, draft } = await commands.createDraft({ metadata: { title: 'Esempio browser non clinico' }, graph: convergenceGraph() });
    const ready = await commands.markReadyUnitOfWork({ procedureId: procedure.id, draftId: draft.id,
      expectedEditVersion: 1, confirmedForPersonalUse: true }, acceptFixture);
    const run = exampleRun(procedure.id, ready.id); await commands.saveRun(run, null);
    await commands.updateDraft({ procedureId: procedure.id, draftId: draft.id, expectedEditVersion: 1, graph: convergenceGraph() });
    check(JSON.stringify(await repositories.revisions.get(ready.id)) === JSON.stringify(ready), 'Ready mutated');
    const source = exampleRecords(mediaGraph());
    const blob = new Blob(['non-clinical fixture'], { type: 'image/png' });
    source.mediaAssets = [{ id: 'missing-asset', blob, sha256: 'a'.repeat(64), mime: 'image/png', bytes: blob.size, width: 1, height: 1 }];
    const imported = await commands.addImportedRecords([source, source], acceptFixture);
    check(new Set(imported.procedureIds).size === 2 && await db.procedures.count() === 3, 'Add-only failed');
    const importedDraft = await commands.createDraft({ procedureId: imported.procedureIds[0] ?? '' });
    check(importedDraft.draft.id !== importedDraft.procedure.readyRevisionId &&
      importedDraft.draft.state === 'working-draft', 'Independent Draft from imported Ready failed');
    const assets = await repositories.mediaAssets.list();
    check(assets.length === 2 && assets[0]?.id !== assets[1]?.id &&
      await assets[0]?.blob.text() === 'non-clinical fixture', 'Blob round-trip failed');
    let immutable = false;
    try { await db.revisions.put({ ...ready, revisionNumber: 99 }); } catch { immutable = true; }
    check(immutable, 'Ready overwrite was allowed');
    const before = await db.procedures.count(); const revisionsBefore = await db.revisions.count(); const groupsBefore = await db.groups.count();
    let inserts = 0;
    const fail = () => { if (++inserts === 2) throw new DOMException('Simulated quota', 'QuotaExceededError'); };
    db.procedures.hook('creating', fail);
    let aborted = false;
    try { await commands.addImportedRecords([source, source], acceptFixture); } catch { aborted = true; }
    db.procedures.hook('creating').unsubscribe(fail);
    check(aborted && inserts === 2 && await db.procedures.count() === before &&
      await db.revisions.count() === revisionsBefore && await db.groups.count() === groupsBefore &&
      await db.mediaAssets.count() === 2, 'Partial import committed');
    const readyFailure = () => { throw new DOMException('Simulated Ready quota', 'QuotaExceededError'); };
    db.procedures.hook('updating', readyFailure);
    let readyAborted = false;
    try {
      await commands.markReadyUnitOfWork({ procedureId: procedure.id, draftId: draft.id,
        expectedEditVersion: 2, confirmedForPersonalUse: true }, acceptFixture);
    } catch { readyAborted = true; }
    db.procedures.hook('updating').unsubscribe(readyFailure);
    check(readyAborted && await db.revisions.count() === revisionsBefore &&
      (await repositories.procedures.get(procedure.id))?.readyRevisionId === ready.id, 'Ready rollback failed');
    return { name, draftId: draft.id, readyId: ready.id, procedureId: procedure.id, runId: run.id };
  } catch (error) { await db.delete(); throw error; }
  finally { db.close(); }
}

export async function inspectPersisted(state: Awaited<ReturnType<typeof exerciseStorage>>) {
  const db = new NurseFlowDatabase(state.name);
  const repositories = createRepositories(db);
  try {
    await db.open();
    check((await repositories.revisions.get(state.draftId))?.editVersion === 2, 'Draft lost after page reload');
    check((await repositories.revisions.get(state.readyId))?.state === 'ready', 'Ready lost');
    check((await repositories.runSessions.get(state.runId))?.pinnedRevisionId === state.readyId, 'Pinned run lost');
    check((await repositories.procedures.get(state.procedureId))?.readyRevisionId === state.readyId, 'Ready pointer lost');
    const assets = await repositories.mediaAssets.list();
    check(assets.length === 2 && await assets[0]?.blob.text() === 'non-clinical fixture', 'Blob lost after reload');
    return true;
  } finally { await db.delete(); }
}

export async function exerciseMigration() {
  const name = `NurseFlow-F01-migration-${crypto.randomUUID()}`;
  const legacy = new Dexie(name); legacy.version(1).stores(schemaV1);
  const records = exampleRecords(); const revision = records.revisions[0];
  check(revision, 'Fixture missing');
  const oldRevision: Record<string, unknown> = { ...revision }; delete oldRevision.editVersion;
  await legacy.table('revisions').add(oldRevision);
  await legacy.table('procedures').add(records.procedures[0]);
  legacy.close();
  const db = new NurseFlowDatabase(name);
  try {
    await db.open();
    check(db.verno === 4 && (await db.revisions.get(revision.id))?.editVersion === 1, 'Migration failed');
    check(JSON.stringify((await db.revisions.get(revision.id))?.graph) === JSON.stringify(revision.graph), 'Migration changed graph');
    return true;
  } finally { await db.delete(); }
}
