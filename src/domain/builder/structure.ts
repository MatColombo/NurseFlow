import { graphSchema, type Destination, type Graph, type Node } from '../model';
import { assertGraphReferences } from '../model/integrity';
import { requireEdit, type EdgeRef } from './model';

export function edgeKey(edge: EdgeRef) { return JSON.stringify([edge.nodeId, edge.slot, edge.itemId ?? null]); }
export function activityScopeKey(nodeId: string, activityId: string) { return JSON.stringify([nodeId, activityId]); }
export function outlets(node: Node): { edge: EdgeRef; destination: Destination }[] {
  if ('next' in node) return [{ edge: { nodeId: node.id, slot: 'next' }, destination: node.next }];
  if (node.kind === 'decision') return [...node.outcomes].sort((a, b) => a.order - b.order).map((item) => ({
    edge: { nodeId: node.id, slot: 'outcome' as const, itemId: item.id }, destination: item.destination,
  }));
  if (node.kind === 'multitask') return [...[...node.activities].sort((a, b) => a.order - b.order).map((item) => ({
    edge: { nodeId: node.id, slot: 'activity' as const, itemId: item.id }, destination: item.first,
  })), { edge: { nodeId: node.id, slot: 'afterAll' as const }, destination: node.afterAll }];
  return [];
}
export function nodeAt(graph: Graph, id: string) { const node = graph.nodes.find((item) => item.id === id); requireEdit(node); return node; }
export function destinationAt(graph: Graph, edge: EdgeRef) {
  const outlet = outlets(nodeAt(graph, edge.nodeId)).find((item) => edgeKey(item.edge) === edgeKey(edge));
  requireEdit(outlet); return outlet.destination;
}
export function setDestination(graph: Graph, edge: EdgeRef, destination: Destination) {
  const node = nodeAt(graph, edge.nodeId);
  if (edge.slot === 'next' && 'next' in node) node.next = destination;
  else if (edge.slot === 'afterAll' && node.kind === 'multitask') node.afterAll = destination;
  else if (edge.slot === 'outcome' && node.kind === 'decision') {
    const item = node.outcomes.find((item) => item.id === edge.itemId); requireEdit(item); item.destination = destination;
  } else if (edge.slot === 'activity' && node.kind === 'multitask') {
    const item = node.activities.find((item) => item.id === edge.itemId); requireEdit(item); item.first = destination;
  } else requireEdit(false);
}
export function incoming(graph: Graph, id: string) {
  return graph.nodes.flatMap(outlets).filter((item) => item.destination.kind === 'node' && item.destination.nodeId === id);
}
export function nodeLabel(node: Node) {
  return ('title' in node && node.title?.trim()) || (node.kind === 'decision' ? node.question :
    node.kind === 'end' ? node.heading : 'text' in node ? node.text : '') || '';
}
export function edgeLabel(graph: Graph, edge: EdgeRef) {
  const node = nodeAt(graph, edge.nodeId);
  const item = node.kind === 'decision' ? node.outcomes.find((item) => item.id === edge.itemId)?.label :
    node.kind === 'multitask' ? node.activities.find((item) => item.id === edge.itemId)?.name : undefined;
  return [nodeLabel(node) || node.kind, item || edge.slot].join(' / ');
}
export function reachable(graph: Graph) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node])); const found = new Set<string>();
  const pending = graph.nodes.filter((node) => node.kind === 'start').map((node) => node.id);
  while (pending.length) {
    const id = pending.pop()!; if (found.has(id)) continue; found.add(id);
    const node = nodes.get(id); if (node) for (const { destination } of outlets(node)) if (destination.kind === 'node') pending.push(destination.nodeId);
  }
  return found;
}
/** Draft completeness is deliberately NOT checked here. Topology and scope always are. */
export function assertEditableGraph(input: Graph) {
  const graph = graphSchema.parse(input); assertGraphReferences(graph);
  requireEdit(graph.nodes.filter((node) => node.kind === 'start').length === 1);
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const state = new Map<string, number>();
  function acyclic(id: string) {
    requireEdit(state.get(id) !== 1, 'cycle'); if (state.get(id) === 2) return;
    state.set(id, 1);
    for (const { destination } of outlets(nodes.get(id)!)) if (destination.kind === 'node') {
      requireEdit(nodes.get(destination.nodeId)?.kind !== 'start', 'cycle'); acyclic(destination.nodeId);
    }
    state.set(id, 2);
  }
  for (const node of graph.nodes) {
    if (node.kind === 'decision') requireEdit(node.outcomes.length <= 32, 'limit');
    if (node.kind === 'multitask') requireEdit(node.activities.length <= 32, 'limit');
    acyclic(node.id);
  }
  const owners = new Map<string, string[]>();
  function visit(id: string, scope: string[], detached = false) {
    const prior = owners.get(id);
    if (prior) { requireEdit(JSON.stringify(prior) === JSON.stringify(scope), 'scope'); return; }
    owners.set(id, scope); const node = nodes.get(id)!;
    for (const { edge, destination } of outlets(node)) {
      const nextScope = edge.slot === 'activity' ? [...scope, activityScopeKey(edge.nodeId, edge.itemId!)] : scope;
      if (destination.kind === 'activity-complete') requireEdit((nextScope.length > 0 || detached) && edge.slot !== 'activity', 'scope');
      if (destination.kind !== 'node') continue;
      const target = nodes.get(destination.nodeId)!;
      if (destination.terminateProcedure) requireEdit((nextScope.length > 0 || detached) && target.kind === 'end' &&
        (target.endKind === 'stopped' || target.endKind === 'escalation'), 'scope');
      if (target.kind === 'end' && nextScope.length) requireEdit(destination.terminateProcedure, 'scope');
      // Explicit whole-procedure exits may be shared by several activities.
      if (target.kind === 'end') owners.set(target.id, ['$terminal']);
      else visit(target.id, nextScope, detached);
    }
  }
  visit(graph.nodes.find((node) => node.kind === 'start')!.id, []);
  // Detached task groups still have independent, checked activity boundaries.
  for (const node of graph.nodes) if (node.kind === 'multitask' && !owners.has(node.id)) visit(node.id, [], true);
  return owners;
}
export function outletScope(graph: Graph, edge: EdgeRef) {
  const owners = assertEditableGraph(graph); const owner = owners.get(edge.nodeId);
  return edge.slot === 'activity' ? [...(owner ?? []), activityScopeKey(edge.nodeId, edge.itemId!)] : owner ?? [];
}

/** The actual common successor, never a synthetic Join or a cross-arm edge. */
export function activityCollector(graph: Graph, edge: EdgeRef) {
  const token = outletScope(graph, edge).at(-1);
  return graph.nodes.find((node) => node.kind === 'multitask' &&
    node.activities.some((activity) => activityScopeKey(node.id, activity.id) === token));
}
export function impact(before: Graph, after: Graph) {
  const oldEdges = new Map(before.nodes.flatMap(outlets).map((item) => [edgeKey(item.edge), item]));
  const nextEdges = new Map(after.nodes.flatMap(outlets).map((item) => [edgeKey(item.edge), item]));
  const changed: { edge: EdgeRef; before?: Destination; after?: Destination }[] = [];
  const unchanged: EdgeRef[] = [];
  for (const key of new Set([...oldEdges.keys(), ...nextEdges.keys()])) {
    const a = oldEdges.get(key); const b = nextEdges.get(key);
    if (JSON.stringify(a?.destination) !== JSON.stringify(b?.destination)) changed.push({
      edge: (a ?? b)!.edge, ...(a ? { before: a.destination } : {}), ...(b ? { after: b.destination } : {}),
    }); else if (a) unchanged.push(a.edge);
  }
  const oldReachable = reachable(before); const nextReachable = reachable(after);
  return { changed, unchanged, unreachable: after.nodes.filter((node) => oldReachable.has(node.id) && !nextReachable.has(node.id)),
    removed: before.nodes.filter((node) => !after.nodes.some((next) => next.id === node.id)),
    added: after.nodes.filter((node) => !before.nodes.some((old) => old.id === node.id)) };
}
