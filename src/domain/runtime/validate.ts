import { executionRunSchema, ROOT_TOKEN, activityTokenId, requireRun, type ExecutionRun } from './model';
import { children, compileRevision, currentVisit, destinationAt, exitEdge, groupAt, nodeAt, tokenAt, visitAt, type RuntimeGraph } from './topology';

/** Validate persisted references, route provenance and gates before any command can mutate a run. */
export function validateRun(input: unknown, graph: RuntimeGraph): ExecutionRun {
  const parsed = executionRunSchema.safeParse(input); requireRun(parsed.success, 'invalid-session'); const run = parsed.data;
  const check = (value: unknown) => requireRun(value, 'invalid-session');
  check(run.procedureId === graph.revision.procedureId && run.pinnedRevisionId === graph.revision.id);
  check(new Set(run.visits.map((v) => v.id)).size === run.visits.length);
  check(new Set(run.tokens.map((t) => t.id)).size === run.tokens.length);
  check(new Set(run.groups.map((g) => g.visitId)).size === run.groups.length);
  check(run.visits.every((v, i) => v.id < run.nextVisitId && (i === 0 || v.id > run.visits[i - 1]!.id)));
  check(run.journal.every((e, i) => e.sequence < run.nextSequence && (i === 0 || e.sequence > run.journal[i - 1]!.sequence)));
  const root = tokenAt(run, ROOT_TOKEN); check(root.groupVisitId === undefined && root.activityId === undefined && !root.completed);
  const owned = new Set<number>();
  for (const token of run.tokens) {
    check(token.cursor < token.path.length && (token.path.length === 0 ? token.cursor === -1 && !token.completed : token.cursor >= 0));
    check(new Set(token.path).size === token.path.length);
    let first = graph.start.next;
    if (token.id !== ROOT_TOKEN) {
      check(token.groupVisitId !== undefined && token.activityId !== undefined);
      check(token.id === activityTokenId(token.groupVisitId!, token.activityId!));
      const parent = visitAt(run, token.groupVisitId!); groupAt(run, parent.id);
      first = destinationAt(graph, { nodeId: parent.nodeId, slot: 'activity', itemId: token.activityId! });
      let ancestor = token; const seen = new Set<string>();
      while (ancestor.groupVisitId !== undefined) { check(!seen.has(ancestor.id)); seen.add(ancestor.id); ancestor = tokenAt(run, visitAt(run, ancestor.groupVisitId).tokenId); }
      check(ancestor.id === ROOT_TOKEN);
    }
    for (const [index, id] of token.path.entries()) {
      const visit = visitAt(run, id); check(visit.tokenId === token.id && !owned.has(id)); owned.add(id);
      const node = nodeAt(graph, visit.nodeId); check(node.kind !== 'start');
      if (visit.outcomeId !== undefined) check(node.kind === 'decision' && node.outcomes.some((o) => o.id === visit.outcomeId));
      const incoming = index === 0 ? first : destinationAt(graph, exitEdge(graph, visitAt(run, token.path[index - 1]!)));
      check(incoming.kind === 'node' && incoming.nodeId === node.id);
      if (node.kind === 'end' && token.id !== ROOT_TOKEN) check(incoming.kind === 'node' && incoming.terminateProcedure === true && ['stopped', 'escalation'].includes(node.endKind));
      if (visit.fromVisitId !== undefined) { const previous = visitAt(run, visit.fromVisitId); check(previous.id !== visit.id); }
    }
    if (token.completed) {
      check(token.id !== ROOT_TOKEN && token.path.length > 0);
      const last = visitAt(run, token.path[token.path.length - 1]!);
      check(destinationAt(graph, exitEdge(graph, last)).kind === 'activity-complete');
    }
  }
  check(owned.size === run.visits.length);
  for (const visit of run.visits) if (nodeAt(graph, visit.nodeId).kind === 'multitask') groupAt(run, visit.id);
  for (const group of run.groups) {
    const node = nodeAt(graph, visitAt(run, group.visitId).nodeId); check(node.kind === 'multitask');
    if (node.kind !== 'multitask') continue;
    const activities = children(run, group.visitId);
    check(activities.length === node.activities.length && node.activities.every((a) => activities.some((t) => t.activityId === a.id)));
    check(node.activities.some((a) => a.id === group.focusedActivityId));
    check(!group.released || activities.every((t) => t.completed));
    const parent = tokenAt(run, visitAt(run, group.visitId).tokenId);
    check(parent.path.indexOf(group.visitId) === parent.path.length - 1 || group.released);
  }
  for (const entry of run.journal) { tokenAt(run, entry.tokenId); if (entry.visitId !== undefined) visitAt(run, entry.visitId); }
  const current = currentVisit(run); check(run.currentNodeId === current.nodeId);
  let focused = tokenAt(run, run.focusTokenId);
  while (focused.groupVisitId !== undefined) {
    const fork = visitAt(run, focused.groupVisitId); const parent = tokenAt(run, fork.tokenId);
    check(currentVisit(run, parent).id === fork.id && groupAt(run, fork.id).focusedActivityId === focused.activityId); focused = parent;
  }
  if (run.interruption) {
    check(nodeAt(graph, current.nodeId).kind !== 'end');
    const destination = destinationAt(graph, run.interruption.edge);
    check(destination.kind === 'broken' && destination.formerNodeId === run.interruption.formerNodeId ||
      destination.kind === 'node' && !graph.nodes.has(destination.nodeId) && destination.nodeId === run.interruption.formerNodeId);
    check(run.status === 'interrupted' && run.terminalEndNodeId === undefined);
    const edge = run.interruption.edge;
    if (edge.slot === 'next' || edge.slot === 'outcome' || edge.slot === 'activity') {
      check(current.nodeId === edge.nodeId);
      if (edge.slot === 'outcome') check(current.outcomeId === edge.itemId);
      if (edge.slot === 'activity') check(nodeAt(graph, current.nodeId).kind === 'multitask');
    } else {
      const group = run.groups.find((g) => visitAt(run, g.visitId).nodeId === edge.nodeId);
      check(group?.released && children(run, group.visitId).every((t) => t.completed));
    }
  } else {
    const node = nodeAt(graph, current.nodeId);
    check(node.kind === 'end' ? run.status === 'ended' && run.terminalEndNodeId === node.id : run.status === 'active' && run.terminalEndNodeId === undefined);
  }
  return run;
}
export function checkedRun(input: unknown, revision: unknown) { const graph = compileRevision(revision); return { run: validateRun(input, graph), graph }; }
