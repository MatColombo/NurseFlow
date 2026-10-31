// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { NurseFlowDatabase } from './db';
import { createCommands } from './commands';
import { createRepositories } from './repositories';
import { outlineGraph } from '@test/fixtures/builder';
import { exampleRecords } from '@test/fixtures/domain';
import { Dexie } from 'dexie';
import { schemaV4 } from './migrations/schema';
let db: NurseFlowDatabase; let commands: ReturnType<typeof createCommands>;
beforeEach(async () => { db = new NurseFlowDatabase(`preview-${crypto.randomUUID()}`); await db.open(); commands = createCommands(db); });
afterEach(async () => { await db.delete(); });
it('Draft Preview pins a separate snapshot, survives reload and never creates Ready/runSessions', async () => {
  const draft = await commands.createDraft({ metadata: { title: 'Cartoncini' }, graph: outlineGraph() });
  const session = await commands.startDraftPreview(draft.procedure.id, draft.draft.id); const before = await db.revisions.toArray();
  const run = (await commands.transitionDraftPreview(session.id, session.run.saveVersion, { type: 'choose-outcome', outcomeId: 'a' }))!;
  db.close(); await db.open(); expect((await createRepositories(db).preview.get(session.id)).run).toEqual(run);
  const changed = outlineGraph(); const choice = changed.nodes.find((n) => n.kind === 'decision')!; if (choice.kind === 'decision') choice.question = 'Altra domanda';
  await commands.updateDraft({ procedureId: draft.procedure.id, draftId: draft.draft.id, expectedEditVersion: draft.draft.editVersion, graph: changed });
  expect((await createRepositories(db).preview.get(session.id)).revision).toEqual(session.snapshot); expect(await db.runSessions.count()).toBe(0);
  expect(before.every((r) => r.state === 'working-draft')).toBe(true);
  await commands.transitionDraftPreview(session.id, run.saveVersion, { type: 'exit', confirmed: true }); expect(await db.previewSessions.count()).toBe(0);
});
it('incomplete Draft shows unknown total and cannot silently advance an unassigned edge', async () => {
  const graph = outlineGraph(); const step = graph.nodes.find((n) => n.id === 'a-step')!; if (step.kind === 'instruction') step.next = { kind: 'unassigned' };
  const draft = await commands.createDraft({ metadata: { title: 'Incompleta' }, graph }); const session = await commands.startDraftPreview(draft.procedure.id, draft.draft.id);
  expect((await createRepositories(db).preview.get(session.id)).view.progress.total).toEqual({ kind: 'unknown' });
  const run = (await commands.transitionDraftPreview(session.id, 1, { type: 'choose-outcome', outcomeId: 'a' }))!;
  await expect(commands.transitionDraftPreview(session.id, run.saveVersion, { type: 'continue' })).rejects.toThrow('invalid-revision');
  expect((await db.previewSessions.get(session.id))?.run).toEqual(run);
});
it('quota rolls back preview navigation, and procedure deletion cannot orphan its session', async () => {
  const draft = await commands.createDraft({ metadata: { title: 'Cartoncini' }, graph: outlineGraph() }); const session = await commands.startDraftPreview(draft.procedure.id, draft.draft.id);
  db.previewSessions.hook('updating', () => { throw new Error('quota'); });
  await expect(commands.transitionDraftPreview(session.id, 1, { type: 'choose-outcome', outcomeId: 'a' })).rejects.toThrow('quota'); expect(await db.previewSessions.get(session.id)).toEqual(session);
  await expect(commands.deleteProcedure(draft.procedure.id)).rejects.toThrow('saved sessions');
});
it('preview End handoff removes only the preview and preserves the independent Ready run', async () => {
  const records = exampleRecords(outlineGraph()); await db.groups.bulkAdd(records.groups); await db.revisions.bulkAdd(records.revisions); await db.procedures.bulkAdd(records.procedures);
  const readyRun = await commands.startOrResumeReady('procedure', 'ready'); const draft = await commands.createDraft({ procedureId: 'procedure' });
  const session = await commands.startDraftPreview('procedure', draft.draft.id); let run = session.run;
  for (const event of [{ type: 'choose-outcome', outcomeId: 'a' }, { type: 'continue' }, { type: 'continue' }]) run = (await commands.transitionDraftPreview(session.id, run.saveVersion, event))!;
  await commands.finishDraftPreview(session.id, run.saveVersion); expect(await db.previewSessions.count()).toBe(0);
  expect(await db.runSessions.get(readyRun.id)).toEqual(readyRun); expect(await db.revisions.get('ready')).toEqual(records.revisions[0]);
});
it('v4→v5 only adds an empty preview store, preserving existing Ready records exactly', async () => {
  const name = `old-${crypto.randomUUID()}`; const old = new Dexie(name); old.version(4).stores(schemaV4); await old.open();
  const records = exampleRecords(); await old.table('procedures').bulkAdd(records.procedures); await old.table('revisions').bulkAdd(records.revisions); old.close();
  const current = new NurseFlowDatabase(name);
  try { await current.open(); expect(current.verno).toBe(5); expect(await current.previewSessions.count()).toBe(0); expect(await current.revisions.toArray()).toEqual(records.revisions); }
  finally { await current.delete(); }
});
