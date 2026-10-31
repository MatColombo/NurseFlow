import type { Graph } from '../model';
import { outlets, edgeKey } from '../builder/structure';
import { ROOT_TOKEN, activityTokenId, type ExecutionRun } from '../runtime/model';

/** Read-only topology index. Original node/outlet values are never rewritten, even in an incomplete Draft. */
export function projectMap(graph: Graph) {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const links = graph.nodes.flatMap(outlets);
  const completionGroups = new Map<string, string>();
  for (const group of graph.nodes) if (group.kind === 'multitask') for (const activity of group.activities) {
    const seen = new Set<string>(); const pending = activity.first.kind === 'node' ? [activity.first.nodeId] : [];
    while (pending.length) {
      const id = pending.pop()!; if (seen.has(id)) continue; seen.add(id);
      const node = byId.get(id); if (!node || node.kind === 'end') continue;
      // Nested activities have their own completion; only their common continuation belongs to this activity.
      for (const link of outlets(node).filter(({ edge }) => edge.slot !== 'activity')) {
        if (link.destination.kind === 'activity-complete') completionGroups.set(edgeKey(link.edge), group.id);
        else if (link.destination.kind === 'node') pending.push(link.destination.nodeId);
      }
    }
  }
  function completionTarget(key: string, seen = new Set<string>()): string | undefined {
    const groupId = completionGroups.get(key); if (!groupId || seen.has(groupId)) return;
    seen.add(groupId); const group = byId.get(groupId); if (group?.kind !== 'multitask') return;
    if (group.afterAll.kind === 'node' && byId.has(group.afterAll.nodeId)) return group.afterAll.nodeId;
    if (group.afterAll.kind === 'activity-complete') return completionTarget(edgeKey({ nodeId: group.id, slot: 'afterAll' }), seen);
  }
  const edges = links.map((link) => ({ ...link, key: edgeKey(link.edge),
    targetId: link.destination.kind === 'node' && byId.has(link.destination.nodeId) ? link.destination.nodeId :
      link.destination.kind === 'activity-complete' ? completionTarget(edgeKey(link.edge)) : undefined }));
  const incoming = new Map(graph.nodes.map((node) => [node.id, 0]));
  for (const edge of edges) if (edge.targetId) incoming.set(edge.targetId, incoming.get(edge.targetId)! + 1);
  const pending = graph.nodes.filter((node) => !incoming.get(node.id)).map((node) => node.id);
  const order: string[] = []; const ranks = new Map(graph.nodes.map((node) => [node.id, 0]));
  for (let index = 0; index < pending.length; index++) {
    const id = pending[index]!; order.push(id);
    for (const edge of edges.filter((edge) => edge.edge.nodeId === id && edge.targetId)) {
      const target = edge.targetId!; ranks.set(target, Math.max(ranks.get(target)!, ranks.get(id)! + 1));
      incoming.set(target, incoming.get(target)! - 1); if (!incoming.get(target)) pending.push(target);
    }
  }
  const cyclic = order.length !== graph.nodes.length;
  for (const node of graph.nodes) if (!order.includes(node.id)) order.push(node.id);
  return { byId, edges, order, ranks, cyclic, completionGroups, references: new Map(order.map((id, index) => [id, 'S' + String(index + 1).padStart(2, '0')])) };
}
export type MapProjection = ReturnType<typeof projectMap>;
export type MapLink = MapProjection['edges'][number];

/** Prefixes, not the journal or cached redo future. Independent activity cursors remain visible. */
export function projectRoute(graph: Graph, projection: MapProjection, run?: ExecutionRun) {
  const visitedNodes = new Set<string>(); const visitedEdges = new Set<string>();
  const activities = new Map<string, 'pending' | 'in-progress' | 'done'>();
  const counts = new Map<string, { completed: number; total: number }>();
  if (!run) return { visitedNodes, visitedEdges, activities, counts };
  const visits = new Map(run.visits.map((visit) => [visit.id, visit]));
  const effective = new Set<number>();
  function prefix(tokenId: string) {
    const token = run!.tokens.find((token) => token.id === tokenId); if (!token) return;
    for (const id of token.path.slice(0, token.cursor + 1)) {
      if (effective.has(id)) continue; effective.add(id); const visit = visits.get(id)!; visitedNodes.add(visit.nodeId);
      const node = projection.byId.get(visit.nodeId);
      if (node?.kind === 'multitask') {
        let completed = 0;
        for (const activity of node.activities) {
          const child = run!.tokens.find((token) => token.id === activityTokenId(id, activity.id));
          const status = child?.completed ? 'done' : child && child.cursor >= 0 ? 'in-progress' : 'pending';
          activities.set(edgeKey({ nodeId: node.id, slot: 'activity', itemId: activity.id }), status);
          if (status === 'done') completed++; if (child) prefix(child.id);
        }
        counts.set(node.id, { completed, total: node.activities.length });
      }
    }
  }
  prefix(ROOT_TOKEN);
  function completionTraversed(key: string, seen = new Set<string>()): boolean {
    const owner = projection.completionGroups.get(key); if (!owner || seen.has(owner)) return false; seen.add(owner);
    const saved = run!.groups.find((group) => effective.has(group.visitId) && visits.get(group.visitId)?.nodeId === owner);
    const node = projection.byId.get(owner); if (!saved?.released || node?.kind !== 'multitask') return false;
    const parent = run!.tokens.find((token) => token.id === visits.get(saved.visitId)?.tokenId)!;
    if (node.afterAll.kind === 'activity-complete') return parent.completed && completionTraversed(edgeKey({ nodeId: owner, slot: 'afterAll' }), seen);
    const next = visits.get(parent.path[parent.path.indexOf(saved.visitId) + 1] ?? -1);
    return node.afterAll.kind === 'node' && Boolean(next && effective.has(next.id) && next.nodeId === node.afterAll.nodeId);
  }
  for (const node of graph.nodes.filter((node) => node.kind === 'start')) {
    if (effective.size || run.currentNodeId === node.id) visitedNodes.add(node.id);
  }
  for (const link of projection.edges) {
    const source = projection.byId.get(link.edge.nodeId)!;
    let traversed = false;
    if (source.kind === 'start') traversed = Boolean(link.targetId && visitedNodes.has(link.targetId));
    for (const visit of run.visits.filter((visit) => effective.has(visit.id) && visit.nodeId === source.id)) {
      const token = run.tokens.find((token) => token.id === visit.tokenId)!;
      const next = visits.get(token.path[token.path.indexOf(visit.id) + 1] ?? -1);
      if (link.edge.slot === 'activity') traversed ||= activities.get(link.key) !== undefined && activities.get(link.key) !== 'pending';
      else if (link.destination.kind === 'activity-complete') traversed ||= token.completed && completionTraversed(link.key);
      else traversed ||= Boolean(next && effective.has(next.id) && next.nodeId === link.targetId &&
        (link.edge.slot !== 'outcome' || visit.outcomeId === link.edge.itemId));
    }
    if (run.interruption && visitedNodes.has(source.id) && edgeKey(run.interruption.edge) === link.key) traversed = true;
    if (traversed) visitedEdges.add(link.key);
  }
  return { visitedNodes, visitedEdges, activities, counts };
}
export type MapRoute = ReturnType<typeof projectRoute>;
