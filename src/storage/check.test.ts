// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NurseFlowDatabase } from './db';
import { createCommands } from './commands';
import { outlineGraph } from '@test/fixtures/builder';
import { exampleRun, fixtureDate } from '@test/fixtures/domain';

let db: NurseFlowDatabase; let commands: ReturnType<typeof createCommands>;
beforeEach(async () => { db = new NurseFlowDatabase('F08-' + crypto.randomUUID()); commands = createCommands(db); await db.open(); });
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });
async function draft() { return commands.createDraft({ metadata: { title: 'Cartoncini fittizi' }, graph: outlineGraph() }); }
async function snapshot() { return Promise.all(db.tables.map(async (table) => [table.name, await table.toArray()])); }
async function firstReady() { const created = await draft(); const checked = await commands.checkDraft(created.procedure.id); const ready = await commands.markCheckedReady(checked, true); return { ...created, ready }; }
describe('F08 E06 controllo durabile e commit Ready', () => {
  it('non restituisce un risultato già stale se la Draft cambia durante la lettura Blob', async () => {
    const { procedure, draft: revision } = await draft(); const graph = structuredClone(revision.graph); const node = graph.nodes.find((node) => node.id === 'shared');
    if (node && 'media' in node) node.media = [{ id: 'photo', order: 0, slot: 'after-note', source: { kind: 'local', assetId: 'asset', mime: 'image/png' } }];
    const blob = new Blob(['corrupt'], { type: 'image/png' });
    await commands.updateDraft({ procedureId: procedure.id, draftId: revision.id, expectedEditVersion: 1, graph, mediaAssets: [{ id: 'asset', blob, bytes: blob.size, mime: 'image/png', width: 1, height: 1, sha256: 'a'.repeat(64) }] });
    const original = Blob.prototype.arrayBuffer;
    vi.spyOn(Blob.prototype, 'arrayBuffer').mockImplementationOnce(async function (this: Blob) {
      await commands.updateDraft({ procedureId: procedure.id, draftId: revision.id, expectedEditVersion: 2, graph }); return original.call(this);
    });
    await expect(commands.checkDraft(procedure.id)).rejects.toHaveProperty('name', 'ConflictError'); expect(await db.revisions.where('state').equals('ready').count()).toBe(0);
  });
  it('check ripetibile e read-only, conserva ID/timestamp e non crea revisioni', async () => { const { procedure, draft: revision } = await draft(); const before = await snapshot(); const checked = await commands.checkDraft(procedure.id); const repeated = await commands.checkDraft(procedure.id); expect(checked.result.problems).toEqual([]); expect(checked.draftId).toBe(revision.id); expect(checked.editVersion).toBe(1); expect(checked.checkedAt).toMatch(/^20/); expect(repeated.token).toBe(checked.token); expect(repeated.result).toEqual(checked.result); expect(await snapshot()).toEqual(before); });
  it('nuova Ready v2 atomica, Draft indipendente, vecchia Ready/run immutati dopo reload', async () => {
    const { procedure, draft: revision, ready } = await firstReady(); const run = exampleRun(procedure.id, ready.id); await commands.saveRun(run, null);
    const graph = outlineGraph(); const step = graph.nodes.find((node) => node.id === 'shared'); if (step?.kind === 'instruction') step.text = 'Contenuto editoriale aggiornato.';
    const updated = await commands.updateDraft({ procedureId: procedure.id, draftId: revision.id, expectedEditVersion: 1, graph });
    const checked = await commands.checkDraft(procedure.id); expect(checked.previousReadyVersion).toBe(1); expect(checked.nextReadyVersion).toBe(2);
    const next = await commands.markCheckedReady(checked, true); db.close(); await db.open();
    expect(next.revisionNumber).toBe(2); expect(next.graph).toEqual(updated.graph); expect(await db.revisions.get(ready.id)).toEqual(ready); expect(await db.runSessions.get(run.id)).toEqual(run);
    expect(await db.revisions.get(revision.id)).toEqual(updated); expect((await db.procedures.get(procedure.id))?.readyRevisionId).toBe(next.id);
  });
  it('checkbox obbligatoria e risultato UI alterato non aggira il validator', async () => { const { procedure } = await commands.createDraft({ metadata: { title: 'Vuota' } }); const checked = await commands.checkDraft(procedure.id); expect(checked.result.problems.length).toBeGreaterThan(0); const before = await snapshot(); await expect(commands.markCheckedReady(checked, false)).rejects.toThrow('review'); checked.result.problems = []; await expect(commands.markCheckedReady(checked, true)).rejects.toThrow('blocking'); expect(await snapshot()).toEqual(before); });
  it('blocca Draft cambiata anche con stesso timestamp e non crea Ready vecchia', async () => {
    const { procedure, draft: revision, ready } = await firstReady(); const checked = await commands.checkDraft(procedure.id);
    const graph = outlineGraph(); const node = graph.nodes.find((node) => node.kind === 'decision'); if (node?.kind === 'decision') node.question = ' ';
    await commands.updateDraft({ procedureId: procedure.id, draftId: revision.id, expectedEditVersion: 1, graph });
    const before = await snapshot(); await expect(commands.markCheckedReady(checked, true)).rejects.toHaveProperty('name', 'ConflictError'); expect(await snapshot()).toEqual(before);
    const current = await commands.checkDraft(procedure.id); expect(current.result.problems.some((issue) => issue.code === 'P10')).toBe(true); expect((await db.procedures.get(procedure.id))?.readyRevisionId).toBe(ready.id);
  });
  it('rileva modifica raw anche senza incremento editVersion', async () => { const { procedure, draft: revision } = await draft(); const checked = await commands.checkDraft(procedure.id); const graph = structuredClone(revision.graph); graph.nodes.reverse(); await db.revisions.update(revision.id, { graph }); await expect(commands.markCheckedReady(checked, true)).rejects.toHaveProperty('name', 'ConflictError'); });
  it('due conferme concorrenti pubblicano una sola Ready', async () => { const { procedure } = await draft(); const checked = await commands.checkDraft(procedure.id); const result = await Promise.allSettled([commands.markCheckedReady(checked, true), commands.markCheckedReady(checked, true)]); expect(result.map((item) => item.status).sort()).toEqual(['fulfilled', 'rejected']); expect(await db.revisions.where('state').equals('ready').count()).toBe(1); });
  it.each(['QuotaExceededError', 'AbortError', 'TransactionInactiveError'])('rollback completo dopo inserimento Ready e fallimento pointer: %s', async (name) => {
    const { procedure } = await firstReady(); const checked = await commands.checkDraft(procedure.id); const before = await snapshot();
    const fail = () => { throw new DOMException('Injected after Ready insert', name); }; db.procedures.hook('updating', fail);
    await expect(commands.markCheckedReady(checked, true)).rejects.toHaveProperty('name', name); expect(await snapshot()).toEqual(before);
    db.procedures.hook('updating').unsubscribe(fail); const ready = await commands.markCheckedReady(checked, true); expect(ready.revisionNumber).toBe(2);
  });
  it('ID collision non sovrascrive vecchia Ready', async () => { const { procedure, ready } = await firstReady(); const checked = await commands.checkDraft(procedure.id); const before = await snapshot(); const collision = createCommands(db, { newId: () => ready.id, now: () => fixtureDate }); await expect(collision.markCheckedReady(checked, true)).rejects.toHaveProperty('name', 'ConstraintError'); expect(await snapshot()).toEqual(before); });
  it.each(['broken', 'dangling'] as const)('W08 %s consente Ready senza P11 artificiale', async (kind) => {
    const graph = outlineGraph(); const node = graph.nodes.find((node) => node.id === 'shared'); if (node?.kind === 'instruction') node.next = { kind: 'broken', formerNodeId: 'gone' }; graph.nodes = graph.nodes.filter((node) => node.kind !== 'end');
    const created = await commands.createDraft({ metadata: { title: 'Riferimento storico' }, graph });
    if (kind === 'dangling') { if (node?.kind === 'instruction') node.next = { kind: 'node', nodeId: 'gone' }; await db.revisions.update(created.draft.id, { graph }); }
    const checked = await commands.checkDraft(created.procedure.id); expect(checked.result.problems).toEqual([]); const ready = await commands.markCheckedReady(checked, true);
    expect(ready.warningsAtConfirmation.some((warning) => warning.rule === 'W08')).toBe(true); expect(ready.graph).toEqual(graph);
  });
  it('W01/W02/W07 non bloccano Ready e nessun Blob fittizio viene generato', async () => { const graph = outlineGraph(); const node = graph.nodes.find((node) => node.id === 'shared'); if (node && 'media' in node) node.media = [{ id: 'local', order: 0, slot: 'after-note', source: { kind: 'local', assetId: 'missing', mime: 'image/png' } }, { id: 'remote', order: 1, slot: 'before-note', source: { kind: 'remote', httpsUrl: 'https://example.com/offline.gif' } }]; const created = await commands.createDraft({ metadata: { title: 'Media mancanti' }, graph }); const checked = await commands.checkDraft(created.procedure.id); expect(checked.result.problems).toEqual([]); expect(checked.result.warnings.map((issue) => issue.code)).toEqual(expect.arrayContaining(['W01', 'W02', 'W07'])); await commands.markCheckedReady(checked, true); expect(await db.mediaAssets.count()).toBe(0); });
  it('Blob corrotto è W07, non P12, senza perdere il contenuto authored', async () => {
    const graph = outlineGraph(); const node = graph.nodes.find((node) => node.id === 'shared'); if (node && 'media' in node) node.media = [{ id: 'local', order: 0, slot: 'after-note', source: { kind: 'local', assetId: 'asset', mime: 'image/png' } }];
    const created = await commands.createDraft({ metadata: { title: 'Immagine corrotta' }, graph }); const blob = new Blob(['not an image'], { type: 'image/png' }); await db.mediaAssets.add({ id: 'asset', blob, bytes: blob.size, mime: 'image/png', width: 1, height: 1, sha256: 'a'.repeat(64) }); const checked = await commands.checkDraft(created.procedure.id); expect(checked.result.problems).toEqual([]); expect(checked.result.warnings.map((issue) => issue.code)).toContain('W07'); const ready = await commands.markCheckedReady(checked, true); expect(ready.graph).toEqual(graph);
  });
  it('P12 corruzione raw leggibile da Check ma mai Ready', async () => { const { procedure, draft: revision } = await draft(); const graph = structuredClone(revision.graph); const node = graph.nodes.find((node) => node.id === 'shared'); if (node && 'media' in node) node.media = [{ id: 'x', order: 0, slot: 'after-note', source: { kind: 'remote', httpsUrl: 'javascript:alert(1)' } }]; await db.revisions.update(revision.id, { graph }); const checked = await commands.checkDraft(procedure.id); expect(checked.result.problems.some((issue) => issue.code === 'P12')).toBe(true); await expect(commands.markCheckedReady(checked, true)).rejects.toThrow('blocking'); });
});
