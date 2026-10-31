import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands } from '../../src/storage/commands';
import { createRepositories } from '../../src/storage/repositories';
import { exampleRecords, fixtureDate, multitaskGraph } from '../../src/test/fixtures/domain';
import { activityChoiceGraph, nestedActivitiesGraph } from '../../src/test/fixtures/runtime';
import { outlineGraph } from '../../src/test/fixtures/builder';
import type { RunEvent } from '../../src/domain/runtime';

const dbName = 'NurseFlowF09-browser';
async function using<T>(operation: (db: NurseFlowDatabase, commands: ReturnType<typeof createCommands>) => Promise<T>) {
  const db = new NurseFlowDatabase(dbName); await db.open();
  try { return await operation(db, createCommands(db, { newId: () => crypto.randomUUID(), now: () => fixtureDate })); }
  finally { db.close(); }
}
export async function initialize(kind: 'or' | 'and' | 'nested' | 'stop' | 'broken' = 'and') {
  return using(async (db, commands) => {
    const graph = kind === 'or' ? outlineGraph() : kind === 'nested' ? nestedActivitiesGraph() : kind === 'stop' ? multitaskGraph(true) : activityChoiceGraph();
    if (kind === 'stop') {
      const node = graph.nodes.find((n) => n.kind === 'decision')!;
      if (node.kind === 'decision' && node.outcomes[1]!.destination.kind === 'node') node.outcomes[1]!.destination.terminateProcedure = true;
    }
    if (kind === 'broken') {
      const node = graph.nodes.find((n) => n.id === 'extra')!;
      if (node.kind === 'instruction') node.next = { kind: 'broken', formerNodeId: 'missing', formerTitle: 'Carta rimossa' };
    }
    const records = exampleRecords(graph);
    await db.transaction('rw', [db.groups, db.procedures, db.revisions], async () => {
      await db.groups.bulkAdd(records.groups); await db.procedures.bulkAdd(records.procedures); await db.revisions.bulkAdd(records.revisions);
    });
    return commands.startOrResumeReady('procedure', 'ready');
  });
}
export const act = (id: string, version: number, event: RunEvent) => using((_db, commands) => commands.transitionRun(id, version, event));
export const inspect = (id: string) => using((db) => createRepositories(db).runtime.get(id));
export const resume = (id: string) => using((_db, commands) => commands.resumeRunSession(id));
export const finish = (id: string, version: number) => using((_db, commands) => commands.finishRun(id, version));
export async function failedAction(id: string, version: number, event: RunEvent, quota = false) {
  return using(async (db, commands) => {
    if (quota) db.runSessions.hook('updating', () => { throw new DOMException('quota-F09', 'QuotaExceededError'); });
    try { await commands.transitionRun(id, version, event); return { failed: false }; }
    catch (error) { return { failed: true, message: error instanceof Error ? error.message : String(error) }; }
  });
}
export async function duplicateTap(id: string, version: number, event: RunEvent) {
  return using(async (_db, commands) => (await Promise.allSettled([commands.transitionRun(id, version, event), commands.transitionRun(id, version, event)])).map((r) => r.status));
}
export async function newReady() {
  return using(async (_db, commands) => {
    const draft = await commands.createDraft({ procedureId: 'procedure' });
    const graph = outlineGraph(); const choice = graph.nodes.find((n) => n.kind === 'decision')!;
    if (choice.kind === 'decision') choice.question = 'Nuova domanda authored';
    await commands.updateDraft({ procedureId: 'procedure', draftId: draft.draft.id, expectedEditVersion: draft.draft.editVersion, graph });
    const checked = await commands.checkDraft('procedure'); return commands.markCheckedReady(checked, true);
  });
}
export const allRuns = () => using((db) => db.runSessions.toArray());
