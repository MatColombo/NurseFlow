// @vitest-environment node
import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { exampleRecords, exampleRun, fixtureDate, mediaGraph } from '@test/fixtures/domain';
import { draftRevisionSchema } from '@domain/model';
import { builderViewSchema } from '@domain/builder/model';
import { applyEdit, type Edit } from '@domain/builder/edits';
import { pasteGraph } from '@domain/builder/clipboard';
import { NurseFlowDatabase } from './db';
import { createCommands } from './commands';
import { createRepositories } from './repositories';
import { schemaV1 } from './migrations/schema';
let db: NurseFlowDatabase; let commands: ReturnType<typeof createCommands>; let repo: ReturnType<typeof createRepositories>;
beforeEach(async () => {
  db = new NurseFlowDatabase('F05-' + crypto.randomUUID()); await db.open(); commands = createCommands(db); repo = createRepositories(db);
  const fixture = exampleRecords(mediaGraph()); await db.groups.bulkAdd(fixture.groups); await db.revisions.bulkAdd(fixture.revisions); await db.procedures.bulkAdd(fixture.procedures);
});
afterEach(async () => { await db.delete(); });
async function snapshot() { return Promise.all(db.tables.map(async (table) => [table.name, await table.toArray()])); }
async function commit(edit: Edit) {
  const before = await repo.builder.get('procedure'); const next = applyEdit(before.revision.graph, edit, () => crypto.randomUUID());
  return commands.commitBuilderEdit({ procedureId: 'procedure', sourceRevisionId: before.revision.id,
    expectedEditVersion: before.revision.editVersion, expectedGraph: before.revision.graph, graph: next.graph,
    label: edit.type, view: builderViewSchema.parse({}) });
}
async function travel(direction: 'undo' | 'redo') {
  const source = await repo.builder.get('procedure'); return commands.travelBuilderHistory({ procedureId: 'procedure',
    sourceRevisionId: source.revision.id, expectedEditVersion: source.revision.editVersion, direction });
}
describe('unità atomiche Builder', () => {
  it('F06: quota sul cambio mode conserva tutte le preferenze e non crea una Draft', async () => {
    await commands.saveLibraryView({ searchText: 'autore', collapsedGroupIds: ['group'] }); const before = await snapshot();
    db.uiPreferences.hook('updating', () => { throw new DOMException('quota-mode', 'QuotaExceededError'); });
    await expect(commands.setBuilderMode('graph')).rejects.toThrow('quota-mode'); expect(await snapshot()).toEqual(before);
    expect((await repo.builder.get('procedure')).editorMode).toBe('outline');
  });
  it('F06: mode e camera persistono senza Draft, storia o falsa recenza; default legacy Outline', async () => {
    const before = await snapshot(); expect((await repo.builder.get('procedure')).editorMode).toBe('outline');
    await commands.saveLibraryView({ searchText: 'autore', collapsedGroupIds: ['group'] });
    await commands.setBuilderMode('graph');
    await commands.saveBuilderView({ procedureId: 'procedure', sourceRevisionId: 'ready', expectedEditVersion: 1,
      view: { scrollTop: 123, selection: null, canvas: { initialized: true, x: -100, y: 70, zoom: 1.25, focusItems: { tasks: 'activity-27' } } } });
    db.close(); await db.open(); const restored = await repo.builder.get('procedure');
    expect(restored.editorMode).toBe('graph'); expect(restored.procedure.workingDraftId).toBeUndefined(); expect(restored.history.past).toEqual([]);
    expect(restored.history.view.canvas).toMatchObject({ x: -100, y: 70, zoom: 1.25 });
    expect(await db.uiPreferences.get('main')).toMatchObject({ searchText: 'autore', collapsedGroupIds: ['group'], builderMode: 'graph' });
    expect(await db.revisions.toArray()).toEqual(before.find(([name]) => name === 'revisions')?.[1]);
  });
  it('F06: Auto layout è una sola transazione Undo/Redo; Ready e run rimangono invariati', async () => {
    const run = await commands.startOrResumeReady('procedure', 'ready'); const graph = (await repo.builder.get('procedure')).revision.graph;
    const saved = await commit({ type: 'layout', positions: { shared: { x: 150, y: 400 } } });
    expect((await repo.builder.get('procedure')).history.past).toHaveLength(1);
    expect((await travel('undo')).graph).toEqual(graph); expect((await travel('redo')).graph).toEqual(saved.graph);
    expect(await db.runSessions.get(run.id)).toEqual(run); expect((await db.revisions.get('ready'))?.graph).toEqual(graph);
  });
  it('apertura Ready-only e salvataggio vista non creano una Draft; primo edit lo fa atomicamente', async () => {
    const run = await commands.startOrResumeReady('procedure', 'ready'); const ready = await db.revisions.get('ready');
    const opened = await repo.builder.get('procedure');
    await commands.saveBuilderView({ procedureId: 'procedure', sourceRevisionId: 'ready', expectedEditVersion: 1, view: { scrollTop: 120, selection: null } });
    expect((await db.procedures.get('procedure'))?.workingDraftId).toBeUndefined(); expect(await db.revisions.count()).toBe(1);
    const saved = await commit({ type: 'rename', nodeId: 'shared', title: 'Titolo authored' });
    expect(saved.state).toBe('working-draft'); expect(saved.id).not.toBe('ready'); expect(saved.revisionNumber).toBe(2);
    expect((await repo.builder.get('procedure')).history.past[0]?.graph).toEqual(opened.revision.graph);
    expect(await db.revisions.get('ready')).toEqual(ready); expect(await db.runSessions.get(run.id)).toEqual(run);
  });
  it('quota al primo edit annulla revisione, cronologia e puntatore insieme', async () => {
    const before = await snapshot(); db.procedures.hook('updating', () => { throw new DOMException('quota', 'QuotaExceededError'); });
    await expect(commit({ type: 'create', edge: { nodeId: 'decision', slot: 'outcome', itemId: 'a' }, kind: 'instruction' })).rejects.toThrow('quota');
    expect(await snapshot()).toEqual(before); expect((await db.procedures.get('procedure'))?.workingDraftId).toBeUndefined();
  });
  it('Undo/Redo persistenti ripristinano esattamente ID, graph, W08 e media dopo reload', async () => {
    const before = (await repo.builder.get('procedure')).revision.graph;
    const saved = await commit({ type: 'delete', nodeId: 'shared' }); const deleted = saved.graph;
    const undone = await travel('undo'); expect(undone.graph).toEqual(before);
    db.close(); await db.open(); const reloaded = await repo.builder.get('procedure'); expect(reloaded.history.future).toHaveLength(1);
    expect((await travel('redo')).graph).toEqual(deleted); expect(await db.revisions.get('ready')).toMatchObject({ graph: before });
    expect((await repo.builder.get('procedure')).revision.id).toBe(saved.id);
  });
  it('nuovo edit dopo Undo svuota Redo; conserva almeno 30 transazioni', async () => {
    for (let i = 0; i < 35; i++) await commit({ type: 'rename', nodeId: 'shared', title: 'Testo ' + i });
    expect((await repo.builder.get('procedure')).history.past).toHaveLength(30);
    await travel('undo'); expect((await repo.builder.get('procedure')).history.future).toHaveLength(1);
    await commit({ type: 'rename', nodeId: 'shared', title: 'Ramo nuovo' });
    expect((await repo.builder.get('procedure')).history.future).toEqual([]);
  }, 15_000);
  it('errore scrivendo cronologia fa rollback anche di Undo', async () => {
    await commit({ type: 'rename', nodeId: 'shared', title: 'Testo' }); const before = await snapshot();
    db.builderStates.hook('updating', () => { throw new Error('quota-history'); });
    await expect(travel('undo')).rejects.toThrow('quota-history'); expect(await snapshot()).toEqual(before);
  });
  it('preview obsoleta viene rifiutata; view Ready obsoleta non cancella la nuova storia', async () => {
    const source = await repo.builder.get('procedure');
    const first = await commit({ type: 'rename', nodeId: 'shared', title: 'Testo A' });
    await expect(commands.commitBuilderEdit({ procedureId: 'procedure', sourceRevisionId: source.revision.id,
      expectedEditVersion: 1, expectedGraph: source.revision.graph, graph: first.graph, label: 'stale', view: builderViewSchema.parse({}) })).rejects.toThrow('Draft changed');
    await commands.saveBuilderView({ procedureId: 'procedure', sourceRevisionId: 'ready', expectedEditVersion: 1, view: { scrollTop: 999, selection: null } });
    const reloaded = await repo.builder.get('procedure'); expect(reloaded.history.revisionId).toBe(first.id); expect(reloaded.history.past).toHaveLength(1);
    expect(reloaded.history.view.scrollTop).not.toBe(999);
  });
  it('history invalidata da writer esterno non viene applicata a un grafo diverso', async () => {
    const saved = await commit({ type: 'rename', nodeId: 'shared', title: 'Testo A' });
    await commands.updateDraft({ procedureId: 'procedure', draftId: saved.id, expectedEditVersion: saved.editVersion, graph: saved.graph });
    const loaded = await repo.builder.get('procedure'); expect(loaded.history.past).toEqual([]);
    await expect(travel('undo')).rejects.toThrow();
  });
  it('rifiuta cicli prima della scrittura e conserva i dati', async () => {
    const source = await repo.builder.get('procedure'); const graph = structuredClone(source.revision.graph);
    const shared = graph.nodes.find((node) => node.id === 'shared'); if (shared?.kind === 'instruction') shared.next = { kind: 'node', nodeId: 'decision' };
    const before = await snapshot();
    await expect(commands.commitBuilderEdit({ procedureId: 'procedure', sourceRevisionId: 'ready', expectedEditVersion: 1,
      expectedGraph: source.revision.graph, graph, label: 'bad', view: builderViewSchema.parse({}) })).rejects.toThrow('cycle');
    expect(await snapshot()).toEqual(before);
  });
  it('delete esplicito rimuove la cronologia della procedura', async () => {
    await commit({ type: 'rename', nodeId: 'shared', title: 'Testo A' }); expect(await db.builderStates.count()).toBe(1);
    await commands.deleteProcedure('procedure'); expect(await db.builderStates.count()).toBe(0);
  });
  it('Cut + Paste confermato è una sola transazione Undo con sorgente e destinazione ripristinate', async () => {
    const source = await repo.builder.get('procedure');
    const moved = pasteGraph(source.revision.graph, { kind: 'edge', edge: { nodeId: 'decision', slot: 'outcome', itemId: 'a' } },
      { mode: 'cut', graph: source.revision.graph, procedureId: 'procedure', revisionId: source.revision.id, editVersion: source.revision.editVersion, selection: { kind: 'node', nodeId: 'end' } },
      { procedureId: 'procedure', revisionId: source.revision.id, editVersion: source.revision.editVersion, newId: () => crypto.randomUUID() });
    await commands.commitBuilderEdit({ procedureId: 'procedure', sourceRevisionId: source.revision.id, expectedEditVersion: source.revision.editVersion,
      expectedGraph: source.revision.graph, graph: moved, label: 'move', view: builderViewSchema.parse({}) });
    expect((await repo.builder.get('procedure')).history.past).toHaveLength(1);
    expect((await travel('undo')).graph).toEqual(source.revision.graph); expect((await travel('redo')).graph).toEqual(moved);
  });
});
it('migrazione reale v3→v4 aggiunge solo lo store editor e preserva Ready, Draft, run e preferenze', async () => {
  const name = 'F05-migration-' + crypto.randomUUID(); const legacy = new Dexie(name); legacy.version(3).stores(schemaV1);
  await legacy.open(); const records = exampleRecords();
  records.procedures[0]!.workingDraftId = 'legacy-draft';
  const draft = draftRevisionSchema.parse({ id: 'legacy-draft', procedureId: 'procedure', state: 'working-draft', revisionNumber: 2,
    editVersion: 4, graph: records.revisions[0]!.graph, createdAt: fixtureDate, updatedAt: fixtureDate, validatorSchemaVersion: 0 });
  records.revisions.push(draft); const run = exampleRun('procedure', 'ready');
  await legacy.table('procedures').bulkAdd(records.procedures); await legacy.table('revisions').bulkAdd(records.revisions);
  await legacy.table('groups').bulkAdd(records.groups); await legacy.table('runSessions').add(run);
  const view = { id: 'main', firstLaunchComplete: true, searchText: 'autore', initialLocaleSet: true };
  await legacy.table('uiPreferences').add(view);
  await legacy.table('settings').add({ id: 'main', locale: 'en', uiScalePt: 30 });
  const before = await legacy.table('revisions').toArray(); legacy.close();
  const migrated = new NurseFlowDatabase(name);
  try {
    await migrated.open(); expect(migrated.verno).toBe(4); expect(await migrated.revisions.toArray()).toEqual(before);
    expect(await migrated.uiPreferences.get('main')).toEqual(view); expect(await migrated.settings.get('main')).toEqual({ id: 'main', locale: 'en', uiScalePt: 30 });
    expect(await migrated.runSessions.get(run.id)).toEqual(run); expect((await migrated.procedures.get('procedure'))?.workingDraftId).toBe('legacy-draft');
    expect(await migrated.builderStates.count()).toBe(0); expect((await migrated.procedures.get('procedure'))?.createdAt).toBe(fixtureDate);
  } finally { await migrated.delete(); }
});
