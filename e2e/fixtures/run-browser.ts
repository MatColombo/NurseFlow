import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands } from '../../src/storage/commands';
import { exampleRecords, fixtureDate, multitaskGraph } from '../../src/test/fixtures/domain';
import { activitiesGraph, outlineGraph } from '../../src/test/fixtures/builder';
import { activityChoiceGraph } from '../../src/test/fixtures/runtime';
import { draftRevisionSchema, type EndKind } from '../../src/domain/model';

export async function seedRun(kind: 'or' | 'and' | 'stop' | 'broken' | 'many' | 'alert' | 'preview' | 'range' | 'long' = 'or', endKind: EndKind = 'completed') {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const graph = kind === 'and' ? activityChoiceGraph() : kind === 'many' ? activitiesGraph(32) : kind === 'stop' ? multitaskGraph(true) : outlineGraph();
    const end = graph.nodes.find((n) => n.kind === 'end'); if (end?.kind === 'end') { end.endKind = endKind; end.heading = 'Titolo finale authored'; end.message = 'Messaggio finale scritto dall’autore. Nessun risultato clinico automatico.'; end.note = { text: 'Nota finale authored', visibility: 'expandable' }; }
    const choice = graph.nodes.find((n) => n.kind === 'decision');
    if (kind === 'long' && end?.kind === 'end') end.message = 'Messaggio finale authored completo. '.repeat(40) + 'Ultima frase authored.';
    if (choice?.kind === 'decision') {
      choice.note = { text: 'Nota del passo authored', visibility: 'expandable' };
      choice.outcomes[0]!.note = { text: 'Informazione A authored', visibility: 'expandable' };
      choice.outcomes[1]!.note = { text: 'Avviso B essenziale authored', visibility: 'always-visible' };
      if (kind === 'stop' && choice.outcomes[1]!.destination.kind === 'node') choice.outcomes[1]!.destination.terminateProcedure = true;
      if (kind === 'or') choice.media = [
        { id: 'before', slot: 'before-note', order: 0, caption: 'Prima authored', source: { kind: 'local', assetId: 'missing-a', mime: 'image/png' } },
        { id: 'after', slot: 'after-note', order: 0, caption: 'Dopo authored', source: { kind: 'local', assetId: 'missing-b', mime: 'image/png' } },
      ];
      if (kind === 'range') { choice.outcomes[1]!.destination = { kind: 'node', nodeId: 'shared' }; graph.nodes = graph.nodes.filter((n) => n.id !== 'b-step'); }
    }
    const shared = graph.nodes.find((n) => n.id === 'shared');
    if (kind === 'broken' && shared?.kind === 'instruction') { shared.next = { kind: 'broken', formerNodeId: 'removed', formerTitle: 'Carta rimossa' }; graph.nodes = graph.nodes.filter((n) => n.id !== 'end'); }
    if (kind === 'alert' && shared?.kind === 'instruction') graph.nodes = graph.nodes.map((n) => n.id === 'shared' ? { ...shared, kind: 'alert', title: 'Avviso authored', text: 'Avviso critico sempre leggibile.', additionalText: 'Dettaglio authored.', note: { text: 'Nota essenziale', visibility: 'always-visible' } } : n);
    if (kind === 'preview') { const step = graph.nodes.find((n) => n.id === 'a-step'); if (step?.kind === 'instruction') step.next = { kind: 'unassigned' }; }
    const records = exampleRecords(graph); records.procedures[0]!.title = 'Cartoncini dimostrativi';
    if (kind === 'preview') {
      delete records.procedures[0]!.readyRevisionId; records.procedures[0]!.workingDraftId = 'draft';
      records.revisions = [draftRevisionSchema.parse({ id: 'draft', procedureId: 'procedure', state: 'working-draft', revisionNumber: 1, editVersion: 1, graph, createdAt: fixtureDate, updatedAt: fixtureDate, validatorSchemaVersion: 0 })];
    }
    await db.transaction('rw', [db.procedures, db.groups, db.revisions], async () => { await db.groups.bulkAdd(records.groups); await db.revisions.bulkAdd(records.revisions); await db.procedures.bulkAdd(records.procedures); });
    await createCommands(db).completeFirstLaunch();
  } finally { db.close(); }
}
export async function externalChoice() {
  const db = new NurseFlowDatabase(); await db.open();
  try { const run = (await db.runSessions.toArray())[0]!; return await createCommands(db).transitionRun(run.id, run.saveVersion, { type: 'choose-outcome', outcomeId: 'b' }); }
  finally { db.close(); }
}
export async function inspectRuns() {
  const db = new NurseFlowDatabase(); await db.open();
  try { return { runs: await db.runSessions.toArray(), previews: await db.previewSessions.toArray(), revisions: await db.revisions.toArray(), procedure: await db.procedures.get('procedure') }; }
  finally { db.close(); }
}
export async function publishNewReady() {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const commands = createCommands(db); const draft = await commands.createDraft({ procedureId: 'procedure' });
    const graph = outlineGraph(); const choice = graph.nodes.find((n) => n.kind === 'decision')!; if (choice.kind === 'decision') choice.question = 'Nuova domanda authored';
    await commands.updateDraft({ procedureId: 'procedure', draftId: draft.draft.id, expectedEditVersion: draft.draft.editVersion, graph });
    return await commands.markCheckedReady(await commands.checkDraft('procedure'), true);
  } finally { db.close(); }
}
export async function prepareMapDraft() {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const draft = await db.revisions.get('draft'); if (!draft || draft.state !== 'working-draft') throw new Error('Draft fixture missing');
    const choice = draft.graph.nodes.find((node) => node.kind === 'decision');
    if (choice?.kind === 'decision') {
      choice.outcomes[1]!.destination = { kind: 'broken', formerNodeId: 'removed', formerTitle: 'Carta rimossa' };
      choice.outcomes.push({ id: 'dangling', order: 2, label: 'Riferimento storico', destination: { kind: 'node', nodeId: 'absent' } });
    }
    await db.revisions.put(draft);
  } finally { db.close(); }
}
export async function prepareMapDetails() {
  const db = new NurseFlowDatabase(); await db.open();
  try { await db.procedures.update('procedure', { description: 'Descrizione authored completa. '.repeat(70), tags: ['Uno', 'Due', 'Tre', 'Quattro', 'Cinque'] }); }
  finally { db.close(); }
}
