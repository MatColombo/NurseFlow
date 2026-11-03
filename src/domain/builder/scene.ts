import type { Graph, Node } from '../model';
import { activityScopeKey, assertEditableGraph, edgeKey, outlets, reachable } from './structure';
import type { EdgeRef } from './model';

export type Point = { x: number; y: number };
export type SceneMetrics = { width: number; header: number; row: number; gap: number; ratio: number };
export type SceneNode = Point & { id: string; width: number; height: number; ports: ReturnType<typeof outlets>; total: number };
export type SceneEdge = { edge: EdgeRef; targetId: string; completion: boolean; draw: boolean; path: string; start: Point; end: Point };
export type Scene = { nodes: SceneNode[]; edges: SceneEdge[]; width: number; height: number; capacity: number };

/** All views share right-to-left-face anchors and horizontal terminal tangents. */
export function horizontalPath(start: Point, end: Point, gap: number) {
  // Keep long completion edges inside their activity lane until the final column gap.
  const turn = Math.max(start.x, end.x - gap * 3);
  const bend = (end.x - turn) / 2;
  return `M${start.x},${start.y} L${turn},${start.y} C${turn + bend},${start.y} ${end.x - bend},${end.y} ${end.x},${end.y}`;
}

/** Tolerant view-only scopes also support an incomplete or cyclic Draft in Map. */
export function layoutScopes(graph: Graph) {
  const scopes = new Map<string, string[]>(); const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  function visit(id: string, scope: string[]) {
    const node = byId.get(id); if (!node || scopes.has(id)) return;
    scopes.set(id, node.kind === 'end' ? [] : scope);
    for (const { edge, destination } of outlets(node)) if (destination.kind === 'node') {
      visit(destination.nodeId, edge.slot === 'activity' ? [...scope, activityScopeKey(id, edge.itemId!)] : scope);
    }
  }
  for (const node of graph.nodes.filter((node) => node.kind === 'start')) visit(node.id, []);
  for (const node of graph.nodes) visit(node.id, []);
  return scopes;
}

/** Rank columns progress left to right; parallel branches occupy separate vertical lanes. */
export function layoutColumns(boxes: SceneNode[], ranks: ReadonlyMap<string, number>, metrics: SceneMetrics, scopes: ReadonlyMap<string, string[]>) {
  const layers = new Map<number, SceneNode[]>();
  for (const box of boxes) { const rank = ranks.get(box.id) ?? 0; const layer = layers.get(rank) ?? []; layer.push(box); layers.set(rank, layer); }
  const heightOf = (layer: SceneNode[]) => layer.reduce((height, box) => height + box.height + metrics.gap * 2, 0);
  const laneOf = (box: SceneNode) => {
    const scope = scopes.get(box.id) ?? [];
    return JSON.stringify(scope[0] === '$terminal' ? [] : scope);
  };
  const lanes = new Map<string, number>();
  for (const layer of layers.values()) for (const box of layer) {
    const lane = laneOf(box); if (lane === '[]') continue;
    lanes.set(lane, Math.max(lanes.get(lane) ?? 0, heightOf(layer.filter((other) => laneOf(other) === lane))));
  }
  const laneTop = new Map<string, number>(); let laneHeight = 0;
  for (const [lane, height] of lanes) { laneTop.set(lane, laneHeight); laneHeight += height; }
  const height = Math.max(laneHeight, 0, ...[...layers.values()].map((layer) => heightOf(layer.filter((box) => laneOf(box) === '[]'))));
  let x = metrics.gap;
  for (const [, layer] of [...layers].sort(([a], [b]) => a - b)) {
    const pending = new Set(layer);
    for (const first of layer) {
      if (!pending.has(first)) continue;
      const lane = laneOf(first); const members = layer.filter((box) => laneOf(box) === lane);
      let y = metrics.gap + (lane === '[]' ? (height - heightOf(members)) / 2 :
        (height - laneHeight) / 2 + laneTop.get(lane)! + (lanes.get(lane)! - heightOf(members)) / 2);
      for (const box of members) { box.x = x; box.y = y; y += box.height + metrics.gap * 2; pending.delete(box); }
    }
    // An unrelated root branch may share this rank with activity nodes.
    for (const box of layer.filter((box) => laneOf(box) === '[]')) {
      const others = layer.filter((other) => other !== box);
      while (others.some((other) => box.y < other.y + other.height + metrics.gap && box.y + box.height + metrics.gap > other.y)) {
        box.y = Math.max(...others.map((other) => other.y + other.height)) + metrics.gap * 2;
      }
    }
    x += metrics.width + metrics.gap * 4;
  }
}

export function graphMetrics(scale: number, viewportWidth: number): SceneMetrics {
  const font = scale * 4 / 3; const ratio = scale / 13;
  const pad = Math.min(10 * (scale - 4) / 9, viewportWidth * .04);
  return { width: Math.max(112, 244 * ratio), header: Math.max(48, 2 * font * 1.4) + Math.max(2, scale - 2) * 4 / 3 * 1.4 + 2 * pad,
    row: Math.max(48, 48 * ratio, font * 1.4 + 2 * pad), gap: Math.max(28, 28 * ratio), ratio };
}
function windowItems<T extends { id: string }>(items: T[], selected: string | undefined, count: number) {
  const center = Math.max(0, items.findIndex((item) => item.id === selected));
  const start = Math.max(0, Math.min(items.length - count, center - Math.floor(count / 2)));
  return items.slice(start, start + count);
}
export function visiblePorts(node: Node, focus: Record<string, string>, capacity: number) {
  const all = outlets(node);
  if (node.kind === 'multitask') {
    const shown = windowItems([...node.activities].sort((a, b) => a.order - b.order), focus[node.id], capacity);
    return all.filter(({ edge }) => edge.slot === 'afterAll' || shown.some((item) => item.id === edge.itemId));
  }
  if (node.kind === 'decision' && node.outcomes.length > 3) {
    const shown = windowItems([...node.outcomes].sort((a, b) => a.order - b.order), focus[node.id], capacity);
    return all.filter(({ edge }) => shown.some((item) => item.id === edge.itemId));
  }
  return all;
}
/** View metadata only: reveal a real node through its actual incoming path/scopes. */
export function focusPath(graph: Graph, nodeId: string, current: Record<string, string>) {
  const focus = new Map(Object.entries(current)); const parents = new Map<string, EdgeRef>();
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const pending = graph.nodes.filter((node) => node.kind === 'start').map((node) => node.id); const seen = new Set(pending);
  for (let index = 0; index < pending.length; index++) for (const { edge, destination } of outlets(nodes.get(pending[index]!)!)) {
    if (destination.kind !== 'node' || seen.has(destination.nodeId)) continue;
    seen.add(destination.nodeId); parents.set(destination.nodeId, edge); pending.push(destination.nodeId);
  }
  let cursor = nodeId;
  while (parents.has(cursor)) {
    const edge = parents.get(cursor)!; if (edge.itemId) focus.set(edge.nodeId, edge.itemId); cursor = edge.nodeId;
  }
  const scope = assertEditableGraph(graph).get(nodeId) ?? [];
  for (const node of graph.nodes) if (node.kind === 'multitask') for (const activity of node.activities) {
    if (scope.includes(activityScopeKey(node.id, activity.id))) focus.set(node.id, activity.id);
  }
  return Object.fromEntries(focus);
}

/** Projection contains identities/geometry, never a second editable Graph or synthetic join. */
export function makeScene(graph: Graph, focus: Record<string, string>, viewportWidth: number, metrics: SceneMetrics): Scene {
  const capacity = Math.max(1, Math.min(3, Math.floor((viewportWidth + metrics.gap) / (metrics.width + metrics.gap))));
  const owners = assertEditableGraph(graph); const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const ports = new Map(graph.nodes.map((node) => [node.id, visiblePorts(node, focus, capacity)]));
  const shown = new Set(graph.nodes.flatMap((node) => node.kind === 'multitask' ? ports.get(node.id)!.filter(({ edge }) => edge.slot === 'activity')
    .map(({ edge }) => activityScopeKey(edge.nodeId, edge.itemId!)) : []));
  const tokens = new Map(graph.nodes.flatMap((node) => node.kind === 'multitask' ? node.activities.map((activity) => [activityScopeKey(node.id, activity.id), node.id] as const) : []));
  const visible = new Set<string>();
  function visit(id: string) {
    if (visible.has(id) || (owners.get(id) ?? []).some((token) => tokens.has(token) && !shown.has(token))) return;
    visible.add(id);
    for (const { destination } of ports.get(id)!) if (destination.kind === 'node') visit(destination.nodeId);
  }
  for (const node of graph.nodes.filter((node) => node.kind === 'start')) visit(node.id);
  const linked = reachable(graph); for (const node of graph.nodes) if (!linked.has(node.id)) visit(node.id);
  function completedTarget(sourceId: string, seen = new Set<string>()): string | undefined {
    const token = owners.get(sourceId)?.at(-1); const groupId = token ? tokens.get(token) : undefined;
    const group = groupId ? nodes.get(groupId) : undefined;
    if (group?.kind !== 'multitask' || seen.has(group.id)) return;
    seen.add(group.id);
    if (group.afterAll.kind === 'node') return group.afterAll.nodeId;
    if (group.afterAll.kind === 'activity-complete') return completedTarget(group.id, seen);
  }
  const connections = [...visible].flatMap((id) => ports.get(id)!.flatMap(({ edge, destination }) => {
    const targetId = destination.kind === 'node' ? destination.nodeId : destination.kind === 'activity-complete' ? completedTarget(id) : undefined;
    return targetId && visible.has(targetId) ? [{ edge, targetId, completion: destination.kind === 'activity-complete', draw: edge.slot !== 'afterAll' }] : [];
  }));
  const rank = new Map([...visible].map((id) => [id, 0])); const indegree = new Map([...visible].map((id) => [id, 0]));
  for (const edge of connections) indegree.set(edge.targetId, indegree.get(edge.targetId)! + 1);
  const pending = [...visible].filter((id) => indegree.get(id) === 0);
  for (let index = 0; index < pending.length; index++) for (const edge of connections.filter((item) => item.edge.nodeId === pending[index])) {
    rank.set(edge.targetId, Math.max(rank.get(edge.targetId)!, rank.get(edge.edge.nodeId)! + 1));
    indegree.set(edge.targetId, indegree.get(edge.targetId)! - 1); if (!indegree.get(edge.targetId)) pending.push(edge.targetId);
  }
  const sceneNodes: SceneNode[] = [...visible].map((id) => {
    const node = nodes.get(id)!; const visibleOutlets = ports.get(id)!;
    const total = node.kind === 'decision' ? node.outcomes.length : node.kind === 'multitask' ? node.activities.length : 0;
    const browseRows = node.kind === 'multitask' || node.kind === 'decision' && total > 3 ? 2 : 0;
    return { id, x: 0, y: 0,
      width: metrics.width, height: metrics.header + (visibleOutlets.length + browseRows) * metrics.row + 4, ports: visibleOutlets, total };
  });
  layoutColumns(sceneNodes, rank, metrics, owners);
  const byId = new Map(sceneNodes.map((node) => [node.id, node]));
  const edges = connections.map((edge) => {
    const source = byId.get(edge.edge.nodeId)!; const target = byId.get(edge.targetId)!;
    const inbound = connections.filter((item) => item.draw && item.targetId === edge.targetId);
    const index = inbound.indexOf(edge);
    const start = { x: source.x + source.width, y: source.y + metrics.header + (source.ports.findIndex((port) => edgeKey(port.edge) === edgeKey(edge.edge)) + .5) * metrics.row };
    const end = { x: target.x, y: target.y + metrics.header * (index + 1) / (inbound.length + 1) };
    const path = horizontalPath(start, end, metrics.gap);
    return { ...edge, path, start, end };
  });
  return { nodes: sceneNodes, edges, capacity, width: Math.max(metrics.width + 2 * metrics.gap, ...sceneNodes.map((node) => node.x + node.width + metrics.gap * 2)),
    height: Math.max(200, ...sceneNodes.map((node) => node.y + node.height + metrics.gap)) };
}
