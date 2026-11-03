// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NurseFlowDatabase } from './db';
import { createCommands } from './commands';
import { createRepositories } from './repositories';
import { exampleRecords, mediaGraph } from '@test/fixtures/domain';
import { metadataOf } from '@domain/procedures';

let db: NurseFlowDatabase; let commands: ReturnType<typeof createCommands>;
beforeEach(async () => {
  db = new NurseFlowDatabase(`F04-${crypto.randomUUID()}`); await db.open();
  commands = createCommands(db, { newId: () => crypto.randomUUID(), now: () => '2026-10-30T10:00:00.000Z' });
  const fixture = exampleRecords(mediaGraph());
  await db.groups.bulkAdd(fixture.groups); await db.procedures.bulkAdd(fixture.procedures); await db.revisions.bulkAdd(fixture.revisions);
});
afterEach(async () => { await db.delete(); });
async function snapshot() { return Promise.all(db.tables.map(async (table) => [table.name, await table.toArray()])); }

describe('transazioni F04', () => {
  it('metadati aggiornano solo la procedura e preservano Ready, Draft, run e recenza', async () => {
    await commands.createDraft({ procedureId: 'procedure' }); const run = await commands.startOrResumeReady('procedure', 'ready');
    const before = await db.revisions.toArray(); const procedure = (await db.procedures.get('procedure'))!;
    const next = await commands.updateProcedureMetadata('procedure', { ...metadataOf(procedure), title: 'Titolo authored', tags: ['Blu', 'blu'], priority: 2,
      aliases: ['SIGLA', 'sigla'], ribbon: { colorKey: 'amber', iconKey: 'info' } });
    expect(next).toMatchObject({ title: 'Titolo authored', tags: ['Blu'], aliases: ['SIGLA'], priority: 2, readyRevisionId: 'ready', workingDraftId: procedure.workingDraftId });
    expect(next.lastOpenedAt).toBe(procedure.lastOpenedAt); expect(await db.revisions.toArray()).toEqual(before);
    expect(await db.runSessions.get(run.id)).toEqual(run);
    db.close(); await db.open(); expect((await db.procedures.get('procedure'))?.title).toBe('Titolo authored');
  });
  it('errore quota nei metadati lascia tutti i dati invariati', async () => {
    const before = await snapshot(); db.procedures.hook('updating', () => { throw new DOMException('quota', 'QuotaExceededError'); });
    await expect(commands.updateProcedureMetadata('procedure', { ...metadataOf((await db.procedures.get('procedure'))!), title: 'Nuovo nome' })).rejects.toThrow('quota');
    expect(await snapshot()).toEqual(before);
  });
  it('Ready-only resta tale quando si legge la destinazione dell’editor', async () => {
    const before = await snapshot(); const details = await createRepositories(db).procedureDetails.get('procedure');
    expect(details.ready?.id).toBe('ready'); expect(details.draft).toBeUndefined(); expect(await snapshot()).toEqual(before);
  });
  it('Start crea e poi riprende la stessa sessione pinned senza toccare Draft/Ready', async () => {
    const before = await db.revisions.toArray(); const first = await commands.startOrResumeReady('procedure', 'ready');
    const resumed = await commands.startOrResumeReady('procedure', 'ready');
    expect(resumed).toEqual(first); expect(await db.runSessions.count()).toBe(1);
    expect(first).toMatchObject({ runtimeVersion: 1, pinnedRevisionId: 'ready', currentNodeId: 'decision' });
    expect(await db.revisions.toArray()).toEqual(before);
    await expect(commands.startOrResumeReady('procedure', 'other')).rejects.toThrow('Ready changed');
  });
  it('errore quota all’avvio non lascia sessioni parziali', async () => {
    db.runSessions.hook('creating', () => { throw new Error('quota'); });
    await expect(commands.startOrResumeReady('procedure', 'ready')).rejects.toThrow('quota'); expect(await db.runSessions.count()).toBe(0);
  });
  it('F16 Details discovers a historical pinned session after a newer Ready, and resume never creates a replacement run', async () => {
    const old = await commands.startOrResumeReady('procedure', 'ready');
    const original = (await db.revisions.get('ready'))!;
    await db.revisions.add({ ...original, id: 'ready-new', revisionNumber: 2 });
    await db.procedures.update('procedure', { readyRevisionId: 'ready-new' });
    const before = await snapshot(); const details = await createRepositories(db).procedureDetails.get('procedure');
    expect(details.ready?.id).toBe('ready-new'); expect(details.resumeReady?.id).toBe('ready');
    expect(details.resume).toEqual(old); expect(await commands.resumeRunSession(details.resume!.id)).toEqual(old);
    expect(await snapshot()).toEqual(before); expect(await db.runSessions.count()).toBe(1);
  });
  it('Resume conserva anche una sessione terminata sul suo End authored', async () => {
    const initial = await commands.startOrResumeReady('procedure', 'ready');
    const chosen = (await commands.transitionRun(initial.id, initial.saveVersion, { type: 'choose-outcome', outcomeId: 'a' }))!;
    const terminal = (await commands.transitionRun(chosen.id, chosen.saveVersion, { type: 'continue' }))!;
    const details = await createRepositories(db).procedureDetails.get('procedure');
    expect(details.resume).toEqual(terminal);
    expect(await commands.startOrResumeReady('procedure', 'ready')).toEqual(terminal);
    expect(await db.runSessions.count()).toBe(1);
  });
  it('duplicazione produce una Draft indipendente con nuovi ID e stessi asset immutabili', async () => {
    const before = await db.revisions.get('ready'); const copy = await commands.duplicateProcedure('procedure', '(copia)');
    expect(copy.id).not.toBe('procedure'); expect(copy.readyRevisionId).toBeUndefined(); expect(copy.groupId).toBe('group');
    const draft = await db.revisions.get(copy.workingDraftId!); expect(draft?.state).toBe('working-draft');
    expect(draft?.graph.nodes.every((node) => !before?.graph.nodes.some((source) => source.id === node.id))).toBe(true);
    expect(await db.revisions.get('ready')).toEqual(before);
  });
  it('duplicazione fallita annulla anche la nuova revisione', async () => {
    const before = await snapshot(); db.procedures.hook('creating', () => { throw new Error('quota'); });
    await expect(commands.duplicateProcedure('procedure', '(copia)')).rejects.toThrow('quota'); expect(await snapshot()).toEqual(before);
  });
  it('archive/restore conservano revisioni e sessioni', async () => {
    const run = await commands.startOrResumeReady('procedure', 'ready'); const before = await db.revisions.toArray();
    await commands.setArchived('procedure', true); expect((await db.procedures.get('procedure'))?.archived).toBe(true);
    await expect(commands.startOrResumeReady('procedure', 'ready')).rejects.toThrow();
    await commands.setArchived('procedure', false); expect(await db.revisions.toArray()).toEqual(before); expect(await db.runSessions.get(run.id)).toEqual(run);
  });
  it('eliminazione esplicita senza sessioni rimuove le revisioni, altre Ready restano protette', async () => {
    await expect(db.revisions.delete('ready')).rejects.toThrow('cannot be deleted');
    await commands.deleteProcedure('procedure'); expect(await db.procedures.count()).toBe(0); expect(await db.revisions.count()).toBe(0);
    expect(await db.groups.count()).toBe(1);
  });
  it('eliminazione rifiutata con sessioni pinned e rollback su errore dopo rimozione revisioni', async () => {
    const run = await commands.startOrResumeReady('procedure', 'ready'); const before = await snapshot();
    await expect(commands.deleteProcedure('procedure')).rejects.toThrow('saved sessions'); expect(await snapshot()).toEqual(before);
    await db.runSessions.delete(run.id); const clean = await snapshot();
    db.procedures.hook('deleting', () => { throw new Error('quota'); });
    await expect(commands.deleteProcedure('procedure')).rejects.toThrow('quota'); expect(await snapshot()).toEqual(clean);
  });
});
