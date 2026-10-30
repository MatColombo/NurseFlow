// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dexie } from 'dexie';
import { draftRevisionSchema, mediaAssetSchema, revisionSchema, settingsSchema } from '@domain/model';
import { assertImportedReferences } from '@domain/portability/records';
import { convergenceGraph, exampleRecords, exampleRun, fixtureDate, mediaGraph, multitaskGraph } from '@test/fixtures/domain';
import { NurseFlowDatabase } from './db';
import { createCommands, type ReadyValidator } from './commands';
import { createRepositories } from './repositories';
import { schemaV1, schemaV4 } from './migrations/schema';

// Test double only: F01 tests the unit of work, never claims structural validation.
const acceptFixture: ReadyValidator = () => ({ validatorSchemaVersion: 1, problems: [], warnings: [] });
let db: NurseFlowDatabase;
let commands: ReturnType<typeof createCommands>;
let repositories: ReturnType<typeof createRepositories>;
let sequence = 0;
beforeEach(async () => {
  db = new NurseFlowDatabase(`NurseFlow-F01-test-${crypto.randomUUID()}`);
  commands = createCommands(db, { newId: () => `new-${++sequence}`, now: () => fixtureDate });
  repositories = createRepositories(db);
  await db.open();
});
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });

async function snapshot() {
  return Promise.all(db.tables.map(async (table) => [table.name, await table.toArray()]));
}
async function createReady() {
  const created = await commands.createDraft({ metadata: { title: 'Esempio non clinico' }, graph: convergenceGraph() });
  const ready = await commands.markReadyUnitOfWork({ procedureId: created.procedure.id, draftId: created.draft.id,
    expectedEditVersion: 1, confirmedForPersonalUse: true }, acceptFixture);
  return { ...created, ready };
}
function asset() {
  const blob = new Blob(['fixture'], { type: 'image/png' });
  return mediaAssetSchema.parse({ id: 'asset', blob, sha256: 'a'.repeat(64), mime: blob.type, bytes: blob.size, width: 1, height: 1 });
}

describe('schema, default e persistenza', () => {
  it('crea otto tabelle e default senza fixture di produzione', async () => {
    expect(db.tables.map((table) => table.name).sort()).toEqual(Object.keys(schemaV4).sort());
    expect(await repositories.settings.get()).toEqual(settingsSchema.parse({}));
    expect((await repositories.uiPreferences.get()).recentProcedureIds).toEqual([]);
    expect(await repositories.procedures.list()).toEqual([]);
    expect(db.verno).toBe(4);
  });
  it('crea una Draft incompleta e la ritrova dopo close/open', async () => {
    const { procedure, draft } = await commands.createDraft({ metadata: { title: 'Bozza esempio' } });
    expect(procedure.readyRevisionId).toBeUndefined();
    expect(draft.graph.nodes).toEqual([{ id: expect.any(String), kind: 'start', next: { kind: 'unassigned' } }]);
    db.close(); await db.open();
    expect(await repositories.revisions.get(draft.id)).toEqual(draft);
    expect(await repositories.procedures.get(procedure.id)).toEqual(procedure);
  });
  it('esegue rollback di createDraft dopo inserimento media e revisione', async () => {
    const before = await snapshot();
    db.procedures.hook('creating', () => { throw new Error('Injected transaction failure'); });
    await expect(commands.createDraft({ metadata: { title: 'Esempio' }, mediaAssets: [asset()] })).rejects.toThrow('Injected');
    expect(await snapshot()).toEqual(before);
  });
  it('non espone tabelle nei repository e restituisce valori separati', async () => {
    const { draft } = await commands.createDraft({ metadata: { title: 'Esempio' } });
    const read = await repositories.revisions.get(draft.id);
    if (read) read.graph.nodes.length = 0;
    expect(await repositories.revisions.get(draft.id)).toEqual(draft);
    expect(repositories.revisions).not.toHaveProperty('put');
    expect(repositories.procedures).not.toHaveProperty('table');
  });
  it('genera ID e timestamp soltanto fuori da transazioni IndexedDB', async () => {
    const outside = () => { expect(Dexie.currentTransaction).toBeNull(); };
    const isolated = createCommands(db, {
      newId: () => { outside(); return crypto.randomUUID(); },
      now: () => { outside(); return fixtureDate; },
    });
    const { procedure, draft } = await isolated.createDraft({ metadata: { title: 'Esempio' }, graph: convergenceGraph() });
    await isolated.updateDraft({ procedureId: procedure.id, draftId: draft.id, expectedEditVersion: 1, graph: convergenceGraph() });
    await isolated.markReadyUnitOfWork({ procedureId: procedure.id, draftId: draft.id, expectedEditVersion: 2, confirmedForPersonalUse: true }, acceptFixture);
    await isolated.addImportedRecords([exampleRecords()], acceptFixture);
  });
});

describe('Draft, Ready e run pinned', () => {
  it('apre una nuova Draft da Ready-only importata senza alterare Ready o run', async () => {
    const source = exampleRecords(); source.runSessions = [exampleRun('procedure', 'ready')];
    const result = await commands.addImportedRecords([source], acceptFixture);
    const { procedure, draft } = await commands.createDraft({ procedureId: result.procedureIds[0] ?? '' });
    const ready = await repositories.revisions.get(procedure.readyRevisionId ?? '');
    const run = await repositories.runSessions.get(result.runIds[0] ?? '');
    expect(draft.graph).toEqual(ready?.graph); expect(draft.id).not.toBe(ready?.id);
    const graph = structuredClone(draft.graph);
    const instruction = graph.nodes.find((node) => node.kind === 'instruction');
    if (instruction?.kind === 'instruction') instruction.text = 'Modifica soltanto alla bozza.';
    await commands.updateDraft({ procedureId: procedure.id, draftId: draft.id, expectedEditVersion: 1, graph });
    expect(await repositories.revisions.get(ready?.id ?? '')).toEqual(ready);
    expect(await repositories.runSessions.get(run?.id ?? '')).toEqual(run);
    expect((await commands.createDraft({ procedureId: procedure.id })).draft.id).toBe(draft.id);
    expect(await repositories.revisions.list()).toHaveLength(2);
  });
  it('modifica Draft e pubblica nuove Ready senza mutare Ready/run precedenti', async () => {
    const { procedure, draft, ready } = await createReady();
    const run = exampleRun(procedure.id, ready.id);
    await commands.saveRun(run, null);
    const graph = convergenceGraph();
    const step = graph.nodes.find((node) => node.kind === 'instruction');
    if (step?.kind === 'instruction') step.text = 'Testo aggiornato.';
    const edited = await commands.updateDraft({ procedureId: procedure.id, draftId: draft.id, expectedEditVersion: 1, graph });
    const next = await commands.markReadyUnitOfWork({ procedureId: procedure.id, draftId: draft.id,
      expectedEditVersion: 2, confirmedForPersonalUse: true }, acceptFixture);
    expect(next.id).not.toBe(ready.id); expect(next.revisionNumber).toBe(2);
    expect(edited.editVersion).toBe(2);
    expect(await repositories.revisions.get(ready.id)).toEqual(ready);
    expect(await repositories.runSessions.get(run.id)).toEqual(run);
    expect((await repositories.procedures.get(procedure.id))?.workingDraftId).toBe(draft.id);
    expect((await repositories.procedures.get(procedure.id))?.readyRevisionId).toBe(next.id);
  });
  it('rifiuta modifica, put e cancellazione di Ready e sovrascrittura asset', async () => {
    const { procedure, ready } = await createReady();
    await expect(commands.updateDraft({ procedureId: procedure.id, draftId: ready.id,
      expectedEditVersion: 1, graph: convergenceGraph() })).rejects.toThrow('Cannot edit');
    await expect(db.revisions.put({ ...ready, revisionNumber: 8 })).rejects.toThrow('write-once');
    await expect(db.revisions.delete(ready.id)).rejects.toThrow('cannot be deleted');
    await db.mediaAssets.add(asset());
    await expect(db.mediaAssets.put(asset())).rejects.toThrow('write-once');
    await expect(db.mediaAssets.delete('asset')).rejects.toThrow('GC');
    expect(await repositories.revisions.get(ready.id)).toEqual(ready);
  });
  it('un commit con ID Ready già esistente fallisce senza sovrascriverla', async () => {
    const { procedure, draft, ready } = await createReady(); const before = await snapshot();
    const collision = createCommands(db, { newId: () => ready.id, now: () => fixtureDate });
    await expect(collision.markReadyUnitOfWork({ procedureId: procedure.id, draftId: draft.id,
      expectedEditVersion: 1, confirmedForPersonalUse: true }, acceptFixture)).rejects.toHaveProperty('name', 'ConstraintError');
    expect(await snapshot()).toEqual(before);
  });
  it('rifiuta autosave e validazione obsoleti anche con timestamp identici', async () => {
    const { procedure, draft } = await commands.createDraft({ metadata: { title: 'Esempio' } });
    const update = { procedureId: procedure.id, draftId: draft.id, expectedEditVersion: 1, graph: convergenceGraph() };
    await commands.updateDraft(update);
    await expect(commands.updateDraft(update)).rejects.toThrow('Draft changed');
    await expect(commands.markReadyUnitOfWork({ procedureId: procedure.id, draftId: draft.id,
      expectedEditVersion: 1, confirmedForPersonalUse: true }, acceptFixture)).rejects.toThrow('stale');
  });
  it('rifiuta Problems, mancato consenso e validator assente o asincrono', async () => {
    const { procedure, draft } = await commands.createDraft({ metadata: { title: 'Esempio' } });
    const input = { procedureId: procedure.id, draftId: draft.id, expectedEditVersion: 1, confirmedForPersonalUse: true as const };
    const before = await snapshot();
    await expect(commands.markReadyUnitOfWork(input, () => ({ validatorSchemaVersion: 1, problems: ['P01'], warnings: [] }))).rejects.toThrow('blocking');
    await expect(commands.markReadyUnitOfWork({ ...input, confirmedForPersonalUse: false } as never, acceptFixture)).rejects.toThrow();
    await expect(commands.markReadyUnitOfWork(input, undefined as never)).rejects.toThrow('required');
    await expect(commands.markReadyUnitOfWork(input, (async () => acceptFixture(draft, new Set())) as never)).rejects.toThrow();
    expect(await snapshot()).toEqual(before);
  });
  it('ricalcola dal Draft durabile senza consentire al validator di mutarlo', async () => {
    const { procedure, draft } = await commands.createDraft({ metadata: { title: 'Esempio' }, graph: convergenceGraph() });
    const ready = await commands.markReadyUnitOfWork({ procedureId: procedure.id, draftId: draft.id,
      expectedEditVersion: 1, confirmedForPersonalUse: true }, (snapshot) => {
      snapshot.graph.nodes.length = 0;
      return { validatorSchemaVersion: 1, problems: [], warnings: [{ rule: 'W07', locationId: 'shared' }, { rule: 'W08' }] };
    });
    expect(ready.graph).toEqual(draft.graph); expect(ready.warningsAtConfirmation).toHaveLength(2);
  });
  it.each(['QuotaExceededError', 'TransactionInactiveError', 'AbortError'])('rollback Ready dopo add snapshot se pointer fallisce: %s', async (name) => {
    const { procedure, draft } = await createReady();
    const before = await snapshot();
    db.procedures.hook('updating', () => { throw new DOMException('Injected storage error', name); });
    await expect(commands.markReadyUnitOfWork({ procedureId: procedure.id, draftId: draft.id,
      expectedEditVersion: 1, confirmedForPersonalUse: true }, acceptFixture)).rejects.toHaveProperty('name', name);
    expect(await snapshot()).toEqual(before);
  });
  it('rollback updateDraft con media dopo failure sul puntatore procedura', async () => {
    const { procedure, draft } = await createReady(); const before = await snapshot();
    vi.spyOn(db.procedures, 'update').mockRejectedValue(new DOMException('Full', 'QuotaExceededError'));
    await expect(commands.updateDraft({ procedureId: procedure.id, draftId: draft.id,
      expectedEditVersion: 1, graph: convergenceGraph(), mediaAssets: [asset()] })).rejects.toThrow('Full');
    expect(await snapshot()).toEqual(before);
  });
  it('serializza due autosave concorrenti: uno solo può scrivere lo stesso token', async () => {
    const { procedure, draft } = await createReady();
    const input = { procedureId: procedure.id, draftId: draft.id, expectedEditVersion: 1, graph: convergenceGraph() };
    const results = await Promise.allSettled([commands.updateDraft(input), commands.updateDraft(input)]);
    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
  });
  it('salva/rilegge run, rifiuta cambio snapshot, cursori estranei e stato obsoleto', async () => {
    const { procedure, ready, draft } = await createReady();
    const run = exampleRun(procedure.id, ready.id);
    await commands.saveRun(run, null); db.close(); await db.open();
    expect(await repositories.runSessions.get(run.id)).toEqual(run);
    const next = await commands.markReadyUnitOfWork({ procedureId: procedure.id, draftId: draft.id,
      expectedEditVersion: 1, confirmedForPersonalUse: true }, acceptFixture);
    await expect(commands.saveRun({ ...run, pinnedRevisionId: next.id, saveVersion: 2 }, 1)).rejects.toThrow('cannot change');
    await expect(commands.saveRun({ ...run, currentNodeId: 'unknown', saveVersion: 2 }, 1)).rejects.toThrow('cursor');
    await expect(commands.saveRun({ ...run, pinnedRevisionId: draft.id }, 1)).rejects.toThrow('Ready');
    await commands.saveRun({ ...run, saveVersion: 2 }, 1);
    await expect(commands.saveRun({ ...run, saveVersion: 2 }, 1)).rejects.toThrow('Run changed');
  });
  it('rollback salvataggio run su quota simulata', async () => {
    const { procedure, ready } = await createReady(); const run = exampleRun(procedure.id, ready.id);
    await commands.saveRun(run, null); const before = await snapshot();
    db.runSessions.hook('updating', () => { throw new DOMException('Full', 'QuotaExceededError'); });
    await expect(commands.saveRun({ ...run, saveVersion: 2 }, 1)).rejects.toThrow('Full');
    expect(await snapshot()).toEqual(before);
  });
});

describe('import additivo', () => {
  it('importa tre copie Ready indipendenti con titoli/gruppi uguali, mantenendo gli originali', async () => {
    const { procedure, ready } = await createReady();
    const run = exampleRun(procedure.id, ready.id); await commands.saveRun(run, null);
    const original = await snapshot();
    const source = exampleRecords(); const frozenSource = structuredClone(source);
    const first = await commands.addImportedRecords([source, source], acceptFixture);
    const second = await commands.addImportedRecords([source], acceptFixture);
    const ids = [...first.procedureIds, ...second.procedureIds];
    expect(new Set(ids).size).toBe(3);
    expect(source).toEqual(frozenSource);
    const copies = await Promise.all(ids.map((id) => repositories.procedures.get(id)));
    expect(new Set(copies.map((copy) => copy?.groupId)).size).toBe(3);
    for (const copy of copies) {
      const revision = await repositories.revisions.get(copy?.readyRevisionId ?? '');
      expect(revision?.state).toBe('ready'); expect(revision?.procedureId).toBe(copy?.id);
      expect(revision?.graph.nodes.map((node) => node.id)).not.toContain('shared');
      const decision = revision?.graph.nodes.find((node) => node.kind === 'decision');
      if (decision?.kind === 'decision') expect(decision.outcomes[0]?.destination).toEqual(decision.outcomes[1]?.destination);
    }
    for (const [tableName, records] of original) {
      for (const record of records as { id: string }[]) expect(await db.table(tableName as string).get(record.id)).toEqual(record);
    }
    expect(await repositories.settings.get()).toEqual(settingsSchema.parse({}));
  });
  it('remappa media W07, metadati W08 e layout senza creare blob mancanti', async () => {
    const records = exampleRecords(mediaGraph());
    const ready = records.revisions[0];
    if (ready?.state === 'ready') {
      const node = ready.graph.nodes.find((node) => node.kind === 'decision');
      if (node?.kind === 'decision' && node.outcomes[0]) node.outcomes[0].destination = { kind: 'broken', formerNodeId: 'deleted', formerTitle: 'Storico' };
      ready.warningsAtConfirmation = [{ rule: 'W07', locationId: 'media-1' }, { rule: 'W08', locationId: 'a' }];
    }
    const { procedureIds } = await commands.addImportedRecords([records], acceptFixture);
    const copy = await repositories.procedures.get(procedureIds[0] ?? '');
    const revision = await repositories.revisions.get(copy?.readyRevisionId ?? '');
    const decision = revision?.graph.nodes.find((node) => node.kind === 'decision');
    if (decision?.kind === 'decision') expect(decision.outcomes[0]?.destination).toEqual({ kind: 'broken', formerNodeId: 'deleted', formerTitle: 'Storico' });
    const step = revision?.graph.nodes.find((node) => node.kind === 'instruction');
    if (step?.kind === 'instruction') {
      expect(step.media).toHaveLength(32); expect(step.media[0]?.source).toEqual({ kind: 'remote', httpsUrl: 'https://example.com/card.gif', expectedMime: 'image/gif' });
      expect(step.media[1]?.source).not.toHaveProperty('assetId', 'missing-asset');
      expect(Object.keys(revision?.graph.layout?.positions ?? {})).toEqual([step.id]);
    }
    expect(await repositories.mediaAssets.list()).toEqual([]);
  });
  it('persiste Blob e riferimenti in copie importate indipendenti anche dopo riapertura', async () => {
    const source = exampleRecords(mediaGraph()); source.mediaAssets = [{ ...asset(), id: 'missing-asset' }];
    const validator: ReadyValidator = (revision, assets) => {
      for (const node of revision.graph.nodes) if ('media' in node) for (const media of node.media) {
        if (media.source.kind === 'local') expect(assets.has(media.source.assetId)).toBe(true);
      }
      return { validatorSchemaVersion: 1, problems: [], warnings: [] };
    };
    await commands.addImportedRecords([source, source], validator); db.close(); await db.open();
    const assets = await repositories.mediaAssets.list();
    expect(assets).toHaveLength(2); expect(assets[0]?.id).not.toBe(assets[1]?.id);
    for (const imported of assets) expect(await imported.blob.text()).toBe('fixture');
    for (const revision of await repositories.revisions.list()) for (const node of revision.graph.nodes) if ('media' in node) {
      for (const media of node.media) {
        const source = media.source;
        if (source.kind === 'local') expect(assets.some((asset) => asset.id === source.assetId)).toBe(true);
      }
    }
  });
  it('rimappa run pinned e stato AND completo', async () => {
    const source = exampleRecords(multitaskGraph());
    source.runSessions = [{ ...exampleRun('procedure', 'ready'), currentNodeId: 'task-3', visited: [{ nodeId: 'start' }],
      multitaskProgress: { tasks: { completedActivityIds: ['activity-1', 'activity-2'],
        cursorByActivityId: { 'activity-3': 'task-3' }, pathByActivityId: { 'activity-3': ['task-3'] } } } }];
    const { runIds } = await commands.addImportedRecords([source], acceptFixture);
    const run = await repositories.runSessions.get(runIds[0] ?? '');
    expect(run?.pinnedRevisionId).not.toBe('ready');
    expect(run?.currentNodeId).not.toBe('task-3');
    assertImportedReferences({ procedures: await repositories.procedures.list(), groups: await repositories.groups.list(),
      revisions: await repositories.revisions.list(), mediaAssets: [], runSessions: await repositories.runSessions.list() });
  });
  it('Draft importata resta Draft e non richiede validator Ready', async () => {
    const source = exampleRecords(); const ready = source.revisions[0];
    if (!ready) throw new Error('Fixture');
    source.revisions = [draftRevisionSchema.parse({ id: ready.id, procedureId: ready.procedureId, state: 'working-draft',
      revisionNumber: 1, editVersion: 1, graph: ready.graph, createdAt: fixtureDate, updatedAt: fixtureDate, validatorSchemaVersion: 0 })];
    const procedure = source.procedures[0];
    if (procedure) { delete procedure.readyRevisionId; procedure.workingDraftId = ready.id; }
    await commands.addImportedRecords([source]);
    expect((await repositories.revisions.list())[0]?.state).toBe('working-draft');
  });
  it.each(['QuotaExceededError', 'AbortError'])('rollback di tutti i file dopo inserimento revisioni/media: %s', async (name) => {
    await createReady(); const before = await snapshot(); const source = exampleRecords(mediaGraph());
    source.mediaAssets = [{ ...asset(), id: 'missing-asset' }];
    let writes = 0;
    db.procedures.hook('creating', () => { if (++writes === 2) throw new DOMException('Injected', name); });
    await expect(commands.addImportedRecords([source, source], acceptFixture)).rejects.toThrow();
    expect(writes).toBe(2); expect(await snapshot()).toEqual(before);
  });
  it('rifiuta input corrotti, impostazioni, validator mancante e collisioni senza upsert', async () => {
    const before = await snapshot();
    const invalid = exampleRecords(); if (invalid.procedures[0]) invalid.procedures[0].readyRevisionId = 'missing';
    await expect(commands.addImportedRecords([invalid], acceptFixture)).rejects.toThrow('pointer');
    await expect(commands.addImportedRecords([{ ...exampleRecords(), settings: settingsSchema.parse({}) }], acceptFixture)).rejects.toThrow();
    await expect(commands.addImportedRecords([exampleRecords()])).rejects.toThrow('required');
    expect(await snapshot()).toEqual(before);
    await commands.createDraft({ metadata: { title: 'Originale' } });
    const occupied = (await repositories.procedures.list())[0]?.id ?? '';
    let count = 0;
    const colliding = createCommands(db, { newId: () => count++ === 0 ? occupied : `collision-${count}`, now: () => fixtureDate });
    const original = await snapshot();
    await expect(colliding.addImportedRecords([exampleRecords()], acceptFixture)).rejects.toThrow();
    expect(await snapshot()).toEqual(original);
  });
  it('non collega un W07 importato a un asset locale in caso di collisione ID', async () => {
    await db.mediaAssets.add(asset()); const before = await snapshot();
    let id = 0;
    const collision = createCommands(db, { newId: () => ++id === 4 ? 'asset' : `asset-collision-${id}`, now: () => fixtureDate });
    await expect(collision.addImportedRecords([exampleRecords(mediaGraph())], acceptFixture)).rejects.toThrow('collides');
    expect(await snapshot()).toEqual(before);
  });
});

describe('migrazione v1 → v2 non distruttiva', () => {
  it('preserva Ready, blob, run e preferenze; aggiunge solo token ed è stabile alla riapertura', async () => {
    const name = `NurseFlow-legacy-${crypto.randomUUID()}`;
    const legacy = new Dexie(name); legacy.version(1).stores(schemaV1);
    const records = exampleRecords(); const ready = records.revisions[0];
    if (!ready) throw new Error('Fixture');
    const oldRevision: Record<string, unknown> = { ...ready }; delete oldRevision.editVersion;
    const oldRun: Record<string, unknown> = { ...exampleRun('procedure', 'ready') }; delete oldRun.saveVersion;
    await legacy.table('procedures').add(records.procedures[0]);
    await legacy.table('groups').add(records.groups[0]);
    await legacy.table('revisions').add(oldRevision);
    await legacy.table('runSessions').add(oldRun);
    await legacy.table('mediaAssets').add(asset());
    await legacy.table('settings').add(settingsSchema.parse({ uiScalePt: 48, theme: 'dark' }));
    legacy.close();
    const upgraded = new NurseFlowDatabase(name);
    try {
      await upgraded.open();
      expect(revisionSchema.parse(await upgraded.revisions.get('ready'))).toEqual(ready);
      expect(await upgraded.runSessions.get('run')).toEqual({ ...oldRun, saveVersion: 1 });
      expect(await upgraded.procedures.get('procedure')).toEqual(records.procedures[0]);
      expect((await upgraded.mediaAssets.get('asset'))?.blob.size).toBe(asset().bytes);
      expect((await upgraded.settings.get('main'))?.uiScalePt).toBe(48);
      const before = await upgraded.revisions.toArray(); upgraded.close(); await upgraded.open();
      expect(await upgraded.revisions.toArray()).toEqual(before);
    } finally { await upgraded.delete(); }
  });
  it('annulla un upgrade fallito e lascia v1 leggibile', async () => {
    const name = `NurseFlow-failed-migration-${crypto.randomUUID()}`;
    const original = new Dexie(name); original.version(1).stores(schemaV1);
    await original.table('procedures').add({ id: 'retained', title: 'Originale' }); original.close();
    const broken = new Dexie(name);
    broken.version(1).stores(schemaV1);
    broken.version(2).stores(schemaV1).upgrade(async (tx) => {
      await tx.table('procedures').update('retained', { title: 'Parziale' });
      throw new Error('Injected upgrade failure');
    });
    await expect(broken.open()).rejects.toThrow('upgrade failure'); broken.close();
    const reopened = new Dexie(name); reopened.version(1).stores(schemaV1);
    try { await reopened.open(); expect(reopened.verno).toBe(1);
      expect(await reopened.table('procedures').get('retained')).toEqual({ id: 'retained', title: 'Originale' });
    } finally { await reopened.delete(); }
  });
});
