import { activityTokenId } from './model';
import { progressOf } from './progress';
import { currentVisit, destinationAt, groupChain, groupNode, nodeAt, tokenAt, visitAt } from './topology';
import { checkedRun } from './validate';

/** Read-only projection for F10. Authored text is read directly from the pinned Ready. */
export function viewRun(input: unknown, revision: unknown) {
  const { run, graph } = checkedRun(input, revision); const visit = currentVisit(run); const node = nodeAt(graph, visit.nodeId);
  const previous = visit.fromVisitId === undefined ? undefined : visitAt(run, visit.fromVisitId);
  const groups = groupChain(run).map((id) => {
    const fork = groupNode(graph, run, id);
    const activities = [...fork.activities].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1)).map((a) => {
      const token = tokenAt(run, activityTokenId(id, a.id));
      return { id: a.id, name: a.name, status: token.completed ? 'done' as const : token.path.length ? 'in-progress' as const : 'pending' as const,
        ...(token.path.length ? { cursorNodeId: currentVisit(run, token).nodeId } : {}) };
    });
    return { visitId: id, nodeId: fork.id, title: fork.title, activities, completed: activities.filter((a) => a.status === 'done').length,
      total: activities.length, afterAllEnabled: activities.every((a) => a.status === 'done') };
  });
  const finishActivity = (node.kind === 'instruction' || node.kind === 'alert') && node.next.kind === 'activity-complete';
  const authorizedStop = node.kind === 'decision' ? node.outcomes.filter((o) => o.destination.kind === 'node' && o.destination.terminateProcedure).map((o) => o.id) : [];
  return { runId: run.id, saveVersion: run.saveVersion, status: run.status, node, groups, progress: progressOf(run, revision),
    ...(previous ? { previous: { nodeId: previous.nodeId, kind: nodeAt(graph, previous.nodeId).kind, visitId: previous.id,
      node: nodeAt(graph, previous.nodeId),
      ...(previous.outcomeId !== undefined ? { outcomeId: previous.outcomeId } : {}) } } : {}),
    ...(run.interruption ? { interruption: run.interruption } : {}),
    actions: { continue: run.status === 'active' && (node.kind === 'instruction' || node.kind === 'alert') && !finishActivity,
      finishActivity: run.status === 'active' && finishActivity, chooseOutcome: run.status === 'active' && node.kind === 'decision',
      authorizedStopOutcomeIds: authorizedStop,
      stopEntireProcedure: run.status === 'active' && (node.kind === 'instruction' || node.kind === 'alert') && destinationAt(graph, { nodeId: node.id, slot: 'next' }).kind === 'node' && node.next.kind === 'node' && node.next.terminateProcedure === true } };
}
