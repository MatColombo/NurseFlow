import type { Destination, Graph, Node, Revision, RunSession } from './index';
import { IntegrityError } from './errors';

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new IntegrityError(message);
}

export function uniqueIds(records: readonly { id: string }[]): Set<string> {
  const ids = new Set(records.map((record) => record.id));
  invariant(ids.size === records.length, 'Duplicate identities');
  return ids;
}

export function destinations(node: Node): Destination[] {
  switch (node.kind) {
    case 'start': case 'instruction': case 'alert': return [node.next];
    case 'decision': return node.outcomes.map((outcome) => outcome.destination);
    case 'multitask': return [node.afterAll, ...node.activities.map((activity) => activity.first)];
    case 'end': return [];
  }
}

// Reference integrity only; completeness, DAG semantics and P/W rules belong to F08.
export function assertGraphReferences(graph: Graph): void {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const phaseIds = new Set(graph.phases.map((phase) => phase.id));
  uniqueIds([...graph.nodes, ...graph.phases,
    ...graph.nodes.flatMap((node) => node.kind === 'decision' ? node.outcomes : []),
    ...graph.nodes.flatMap((node) => node.kind === 'multitask' ? node.activities : []),
    ...graph.nodes.flatMap((node) => 'media' in node ? node.media : []),
  ]);
  for (const node of graph.nodes) {
    if ('phaseId' in node && node.phaseId != null) invariant(phaseIds.has(node.phaseId), 'Unknown phase');
    for (const destination of destinations(node)) {
      if (destination.kind === 'node') invariant(nodeIds.has(destination.nodeId), 'Unknown live destination; use explicit broken metadata');
    }
  }
  for (const id of Object.keys(graph.layout?.positions ?? {})) invariant(nodeIds.has(id), 'Unknown layout node');
}

export function assertRunReferences(run: RunSession, revision: Revision): void {
  invariant(revision.state === 'ready' && revision.id === run.pinnedRevisionId &&
    revision.procedureId === run.procedureId, 'Run must pin its own Ready snapshot');
  const nodes = new Map(revision.graph.nodes.map((node) => [node.id, node]));
  const activityIds = new Set(revision.graph.nodes.flatMap((node) =>
    node.kind === 'multitask' ? node.activities.map((activity) => activity.id) : []));
  invariant(nodes.has(run.currentNodeId), 'Unknown run cursor');
  for (const visit of run.visited) {
    const node = nodes.get(visit.nodeId);
    invariant(node, 'Unknown visited node');
    if (visit.outcomeId !== undefined) invariant(node.kind === 'decision' &&
      node.outcomes.some((outcome) => outcome.id === visit.outcomeId), 'Unknown visited outcome');
    if (visit.previousActivityId !== undefined) invariant(activityIds.has(visit.previousActivityId), 'Unknown previous activity');
  }
  for (const [id, progress] of Object.entries(run.multitaskProgress)) {
    const node = nodes.get(id);
    invariant(node?.kind === 'multitask', 'Unknown multitask');
    const ids = new Set(node.activities.map((activity) => activity.id));
    invariant(new Set(progress.completedActivityIds).size === progress.completedActivityIds.length, 'Duplicate completed activity');
    for (const activityId of progress.completedActivityIds) invariant(ids.has(activityId), 'Unknown completed activity');
    for (const [activityId, cursor] of Object.entries(progress.cursorByActivityId)) {
      invariant(ids.has(activityId) && nodes.has(cursor), 'Unknown activity cursor');
    }
    for (const [activityId, path] of Object.entries(progress.pathByActivityId)) {
      invariant(ids.has(activityId) && path.every((id) => nodes.has(id)), 'Unknown activity path');
    }
  }
  if (run.terminalEndNodeId !== undefined) invariant(nodes.get(run.terminalEndNodeId)?.kind === 'end', 'Unknown terminal End');
  invariant(run.status !== 'ended' || run.terminalEndNodeId === run.currentNodeId, 'Ended run must point at its authored End');
  invariant(run.status === 'ended' || run.terminalEndNodeId === undefined, 'Only an ended run has a terminal End');
}
