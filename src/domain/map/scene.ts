import type { Graph } from '../model';
import type { MapProjection } from './projection';
import { graphMetrics, type SceneNode } from '../builder/scene';

/** Viewer geometry only; every canonical node is available, including disconnected Draft nodes. */
export function mapScene(graph: Graph, projection: MapProjection, scale: number, viewportWidth: number) {
  const metrics = graphMetrics(scale, viewportWidth); const nodes: SceneNode[] = []; const layers = new Map<number, string[]>();
  for (const id of projection.order) { const rank = projection.ranks.get(id)!; const layer = layers.get(rank) ?? []; layer.push(id); layers.set(rank, layer); }
  let y = metrics.gap;
  for (const [, ids] of [...layers].sort(([a], [b]) => a - b)) for (let offset = 0; offset < ids.length; offset += 3) {
    let height = 0;
    for (const [index, id] of ids.slice(offset, offset + 3).entries()) {
      const ports = projection.edges.filter((edge) => edge.edge.nodeId === id);
      const box = { id, x: metrics.gap + index * (metrics.width + metrics.gap), y, width: metrics.width,
        height: metrics.header + ports.length * metrics.row + 4, ports, total: ports.length };
      const authored = graph.layout?.positions[id];
      if (authored) { box.x = Math.max(metrics.gap, authored.x * metrics.ratio); box.y = Math.max(metrics.gap, authored.y * metrics.ratio); }
      while (nodes.some((other) => box.x < other.x + other.width + metrics.gap / 2 && box.x + box.width + metrics.gap / 2 > other.x &&
        box.y < other.y + other.height + metrics.gap / 2 && box.y + box.height + metrics.gap / 2 > other.y)) box.y += metrics.row + metrics.gap;
      nodes.push(box); height = Math.max(height, box.y + box.height - y);
    }
    y += height + metrics.gap * 2;
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges = projection.edges.filter((edge) => edge.targetId && edge.edge.slot !== 'afterAll').map((edge) => {
    const source = byId.get(edge.edge.nodeId)!; const target = byId.get(edge.targetId!)!;
    const siblings = projection.edges.filter((other) => other.targetId === edge.targetId && other.edge.slot !== 'afterAll');
    const index = siblings.indexOf(edge);
    const start = { x: source.x + source.width, y: source.y + metrics.header + (source.ports.indexOf(edge) + .5) * metrics.row };
    const end = { x: target.x + target.width * (index + 1) / (siblings.length + 1), y: target.y };
    return { ...edge, path: `M${start.x},${start.y} C${start.x + metrics.gap},${start.y} ${end.x},${end.y - metrics.gap} ${end.x},${end.y}` };
  });
  return { nodes, edges, metrics, width: Math.max(200, ...nodes.map((node) => node.x + node.width + metrics.gap)),
    height: Math.max(200, ...nodes.map((node) => node.y + node.height + metrics.gap)) };
}
