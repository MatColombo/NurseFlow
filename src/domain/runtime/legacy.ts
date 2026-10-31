import { runSessionSchema } from '../model/records';
import { createRun, reduceRun } from './engine';
import { requireRun, result, unwrap, type ExecutionRun } from './model';
import { checkedRun } from './validate';
import { currentVisit, nodeAt } from './topology';

/** No migration discards legacy state. Upgrade only when every recorded choice can be replayed exactly. */
export function restoreRun(input: unknown, revision: unknown, now: string) {
  return result(() => {
    const old = runSessionSchema.parse(input);
    if ('runtimeVersion' in old) return checkedRun(old, revision).run;
    requireRun(Object.keys(old.multitaskProgress).length === 0, 'legacy-session');
    let run = unwrap(createRun(revision, old.id, old.startedAt));
    requireRun(old.procedureId === run.procedureId && old.pinnedRevisionId === run.pinnedRevisionId, 'invalid-session');
    const graph = checkedRun(run, revision).graph;
    const scaffold = old.currentNodeId === graph.start.id && old.visited.length === 0 && old.status === 'active';
    if (!scaffold) {
      const route = [...old.visited]; if (route[0]?.nodeId === graph.start.id) route.shift();
      for (const visit of route) {
        requireRun(run.currentNodeId === visit.nodeId && visit.previousActivityId === undefined, 'legacy-session');
        const node = nodeAt(graph, currentVisit(run).nodeId);
        requireRun(node.kind === 'instruction' || node.kind === 'alert' || node.kind === 'decision' && visit.outcomeId !== undefined, 'legacy-session');
        const event = node.kind === 'decision' ? { type: 'choose-outcome', outcomeId: visit.outcomeId! } : { type: 'continue' };
        const next = unwrap(reduceRun(run, revision, event, old.updatedAt)); requireRun(next, 'legacy-session'); run = next;
      }
      requireRun(run.currentNodeId === old.currentNodeId && run.status === old.status && run.terminalEndNodeId === old.terminalEndNodeId && run.groups.length === 0, 'legacy-session');
    }
    return { ...run, saveVersion: old.saveVersion + 1, updatedAt: now };
  }, 'legacy-session');
}
export function restartStoredRun(input: unknown, revision: unknown, now: string): ExecutionRun {
  const old = runSessionSchema.parse(input); const fresh = unwrap(createRun(revision, old.id, now));
  requireRun(old.procedureId === fresh.procedureId && old.pinnedRevisionId === fresh.pinnedRevisionId, 'invalid-session');
  return { ...fresh, saveVersion: old.saveVersion + 1, startedAt: old.startedAt };
}
