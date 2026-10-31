import type { Destination } from '../model/graph';
import { activityTokenId, requireRun, type ExecutionRun, type RunEdge, type RunToken } from './model';
import { children, currentVisit, destinationAt, groupAt, groupNode, nodeAt, tokenAt, visitAt, type RuntimeGraph } from './topology';

export function journal(run: ExecutionRun, kind: ExecutionRun['journal'][number]['kind'], tokenId: string, visitId?: number) {
  run.journal.push({ sequence: run.nextSequence++, kind, tokenId, ...(visitId !== undefined ? { visitId } : {}) });
}
export function focus(run: ExecutionRun, token: RunToken) {
  run.focusTokenId = token.id;
  let current = token;
  while (current.groupVisitId !== undefined) {
    const group = groupAt(run, current.groupVisitId); requireRun(current.activityId, 'invalid-session'); group.focusedActivityId = current.activityId;
    const parentVisit = visitAt(run, current.groupVisitId); const parent = tokenAt(run, parentVisit.tokenId);
    parent.cursor = parent.path.indexOf(parentVisit.id); requireRun(parent.cursor >= 0, 'invalid-session'); current = parent;
  }
}
/** Remove only the selected token's future and groups spawned by that future. */
export function truncate(run: ExecutionRun, token: RunToken, after: number) {
  const removed = new Set(token.path.slice(after + 1)); token.path = token.path.slice(0, after + 1); token.cursor = Math.min(token.cursor, after);
  const removedTokens = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const child of run.tokens) if (child.groupVisitId !== undefined && removed.has(child.groupVisitId) && !removedTokens.has(child.id)) {
      removedTokens.add(child.id); child.path.forEach((id) => removed.add(id)); changed = true;
    }
  }
  run.tokens = run.tokens.filter((item) => !removedTokens.has(item.id));
  run.visits = run.visits.filter((visit) => !removed.has(visit.id)); run.groups = run.groups.filter((group) => !removed.has(group.visitId));
  run.journal = run.journal.filter((entry) => !removedTokens.has(entry.tokenId) && (entry.visitId === undefined || !removed.has(entry.visitId)));
}
export function invalidateParents(run: ExecutionRun, token: RunToken) {
  token.completed = false;
  if (token.groupVisitId === undefined) return;
  const group = groupAt(run, token.groupVisitId); group.released = false;
  run.journal = run.journal.filter((entry) => !(entry.kind === 'after-all' && entry.visitId === group.visitId));
  const parentVisit = visitAt(run, group.visitId); const parent = tokenAt(run, parentVisit.tokenId);
  truncate(run, parent, parent.path.indexOf(parentVisit.id)); invalidateParents(run, parent);
}
function enter(run: ExecutionRun, graph: RuntimeGraph, token: RunToken, nodeId: string, fromVisitId?: number) {
  const next = token.path[token.cursor + 1]; let visit = next === undefined ? undefined : visitAt(run, next);
  if (visit && visit.nodeId !== nodeId) { truncate(run, token, token.cursor); visit = undefined; }
  if (!visit) {
    visit = { id: run.nextVisitId++, nodeId, tokenId: token.id, ...(fromVisitId !== undefined ? { fromVisitId } : {}) };
    run.visits.push(visit); token.path.push(visit.id); journal(run, 'enter', token.id, visit.id);
  } else { if (fromVisitId !== undefined) visit.fromVisitId = fromVisitId; else delete visit.fromVisitId; }
  token.cursor++; focus(run, token);
  const node = nodeAt(graph, nodeId);
  if (node.kind === 'multitask') {
    let group = run.groups.find((item) => item.visitId === visit.id);
    const activities = [...node.activities].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1));
    if (!group) {
      requireRun(activities[0], 'invalid-revision'); group = { visitId: visit.id, focusedActivityId: activities[0].id, released: false }; run.groups.push(group);
      for (const activity of activities) run.tokens.push({ id: activityTokenId(visit.id, activity.id), groupVisitId: visit.id,
        activityId: activity.id, path: [], cursor: -1, completed: false });
    }
    if (children(run, group.visitId).every((child) => child.completed)) release(run, graph, group.visitId);
    else activate(run, graph, unfinished(run, group.visitId, group.focusedActivityId));
  }
}
export function activate(run: ExecutionRun, graph: RuntimeGraph, token: RunToken) {
  requireRun(!token.completed, 'confirmation-required');
  if (token.path.length === 0) {
    requireRun(token.groupVisitId !== undefined && token.activityId, 'invalid-session');
    const parentVisit = visitAt(run, token.groupVisitId); const edge: RunEdge = { nodeId: parentVisit.nodeId, slot: 'activity', itemId: token.activityId };
    follow(run, graph, token, edge, parentVisit.id);
  } else {
    focus(run, token); const visit = currentVisit(run, token); const node = nodeAt(graph, visit.nodeId);
    if (node.kind === 'multitask') {
      const group = groupAt(run, visit.id);
      if (children(run, visit.id).every((child) => child.completed)) release(run, graph, visit.id);
      else activate(run, graph, unfinished(run, group.visitId, group.focusedActivityId));
    }
  }
}
function unfinished(run: ExecutionRun, groupId: number, preferred: string) {
  const target = tokenAt(run, activityTokenId(groupId, preferred));
  return target.completed ? children(run, groupId).find((child) => !child.completed)! : target;
}
export function release(run: ExecutionRun, graph: RuntimeGraph, groupVisitId: number, fromVisitId?: number) {
  const group = groupAt(run, groupVisitId); requireRun(children(run, groupVisitId).every((child) => child.completed));
  const parentVisit = visitAt(run, groupVisitId); const parent = tokenAt(run, parentVisit.tokenId);
  requireRun(currentVisit(run, parent).id === groupVisitId);
  if (!group.released) { group.released = true; journal(run, 'after-all', parent.id, groupVisitId); }
  let last = tokenAt(run, activityTokenId(groupVisitId, group.focusedActivityId));
  while (nodeAt(graph, currentVisit(run, last).nodeId).kind === 'multitask') {
    const nested = groupAt(run, currentVisit(run, last).id); last = tokenAt(run, activityTokenId(nested.visitId, nested.focusedActivityId));
  }
  follow(run, graph, parent, { nodeId: parentVisit.nodeId, slot: 'afterAll' }, fromVisitId ?? currentVisit(run, last).id);
}
function complete(run: ExecutionRun, graph: RuntimeGraph, token: RunToken, fromVisitId: number) {
  requireRun(token.groupVisitId !== undefined); token.completed = true;
  const latest = run.journal[run.journal.length - 1];
  if (latest?.kind !== 'finish' || latest.tokenId !== token.id || latest.visitId !== fromVisitId) journal(run, 'finish', token.id, fromVisitId);
  const groupId = token.groupVisitId; const group = groupAt(run, groupId); const node = groupNode(graph, run, groupId);
  const next = [...node.activities].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1))
    .map((activity) => tokenAt(run, activityTokenId(groupId, activity.id))).find((child) => !child.completed);
  if (next) { group.focusedActivityId = next.activityId!; activate(run, graph, next); }
  else release(run, graph, groupId, fromVisitId);
}
export function follow(run: ExecutionRun, graph: RuntimeGraph, token: RunToken, edge: RunEdge, fromVisitId?: number) {
  const destination: Destination = destinationAt(graph, edge);
  if (destination.kind === 'broken' || destination.kind === 'node' && !graph.nodes.has(destination.nodeId)) {
    const source = fromVisitId !== undefined ? visitAt(run, fromVisitId) : undefined;
    if (source) focus(run, tokenAt(run, source.tokenId));
    run.interruption = { code: 'W08', edge, formerNodeId: destination.kind === 'broken' ? destination.formerNodeId : destination.nodeId,
      ...(destination.kind === 'broken' && destination.formerTitle !== undefined ? { formerTitle: destination.formerTitle } : {}) };
    journal(run, 'interrupt', run.focusTokenId, source?.id); return;
  }
  requireRun(destination.kind !== 'unassigned', 'invalid-revision');
  if (destination.kind === 'activity-complete') { requireRun(fromVisitId !== undefined); complete(run, graph, token, fromVisitId); return; }
  const target = nodeAt(graph, destination.nodeId);
  if (target.kind === 'end' && token.groupVisitId !== undefined) requireRun(destination.terminateProcedure === true && ['stopped', 'escalation'].includes(target.endKind), 'invalid-revision');
  enter(run, graph, token, target.id, fromVisitId);
}
export function summarize(run: ExecutionRun, graph: RuntimeGraph) {
  const node = nodeAt(graph, currentVisit(run).nodeId); run.currentNodeId = node.id;
  run.status = run.interruption ? 'interrupted' : node.kind === 'end' ? 'ended' : 'active';
  if (run.status === 'ended') run.terminalEndNodeId = node.id; else delete run.terminalEndNodeId;
}
