import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands } from '../../src/storage/commands';
import { libraryFixture } from '../../src/test/fixtures/library';
import { convergenceGraph } from '../../src/test/fixtures/domain';

export async function seedLibrary() {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const fixture = libraryFixture();
    await db.transaction('rw', [db.procedures, db.groups, db.revisions], async () => {
      await db.groups.bulkAdd(fixture.groups); await db.revisions.bulkAdd(fixture.revisions); await db.procedures.bulkAdd(fixture.procedures);
    });
    await createCommands(db).completeFirstLaunch();
  } finally { db.close(); }
}
export async function inspectLibrary() {
  const db = new NurseFlowDatabase(); await db.open();
  try { return { procedures: await db.procedures.toArray(), groups: await db.groups.toArray(), view: await db.uiPreferences.get('main') }; }
  finally { db.close(); }
}
export async function autosaveFixture() {
  const db = new NurseFlowDatabase(); await db.open();
  try { return await createCommands(db).updateDraft({ procedureId: 'fixture-0', draftId: 'fixture-0-draft', expectedEditVersion: 1, graph: convergenceGraph() }); }
  finally { db.close(); }
}
export async function setupProcedureStates() {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const readyOnly = (await db.procedures.get('fixture-3'))!; delete readyOnly.workingDraftId;
    await db.procedures.put(readyOnly); await db.revisions.delete('fixture-3-draft');
    await db.procedures.update('fixture-0', { tags: ['Blu', 'Esempio', 'Terzo', 'Quarto', 'Quinto'], description: 'Descrizione fittizia authored. '.repeat(16) });
    const draft = (await db.revisions.get('fixture-0-draft'))!;
    for (const node of draft.graph.nodes) if (node.kind === 'instruction') node.text = 'Testo della sola bozza, senza contenuto clinico.';
    await db.revisions.put(draft);
  } finally { db.close(); }
}
export async function inspectProcedureRecords() {
  const db = new NurseFlowDatabase(); await db.open();
  try { return { procedures: await db.procedures.toArray(), revisions: await db.revisions.toArray(), runSessions: await db.runSessions.toArray() }; }
  finally { db.close(); }
}
export async function corruptProcedureReference() {
  const db = new NurseFlowDatabase(); await db.open();
  try { await db.procedures.update('fixture-0', { readyRevisionId: 'fixture-3-ready' }); } finally { db.close(); }
}
export async function prepareProcedureEdgeCase(kind: 'terminal' | 'unassigned') {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    if (kind === 'terminal') {
      const commands = createCommands(db); const run = await commands.startOrResumeReady('fixture-3', 'fixture-3-ready');
      await commands.saveRun({ ...run, status: 'ended', currentNodeId: 'end', terminalEndNodeId: 'end', saveVersion: run.saveVersion + 1 }, run.saveVersion);
    } else {
      const revision = (await db.revisions.get('fixture-3-ready'))!;
      for (const node of revision.graph.nodes) if (node.kind === 'start') node.next = { kind: 'unassigned' };
      const id = 'fixture-unassigned-ready';
      await db.transaction('rw', [db.revisions, db.procedures], async () => {
        await db.revisions.add({ ...revision, id }); await db.procedures.update('fixture-3', { readyRevisionId: id });
      });
    }
  } finally { db.close(); }
}
