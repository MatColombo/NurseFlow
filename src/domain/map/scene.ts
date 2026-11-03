import type { Graph } from '../model';
import type { MapProjection } from './projection';
import { graphMetrics, horizontalPath, layoutGraph, layoutScopes, type SceneNode } from '../builder/scene';

/** Viewer geometry only; every canonical node is available, including disconnected Draft nodes. */
export function mapScene(graph: Graph, projection: MapProjection, scale: number, viewportWidth: number) {
  const metrics = graphMetrics(scale, viewportWidth);
  const nodes: SceneNode[] = projection.order.map((id) => {
    const ports = projection.edges.filter((edge) => edge.edge.nodeId === id);
    return { id, x: 0, y: 0, width: metrics.width,
      height: metrics.header + ports.length * metrics.row + 4, ports, total: ports.length };
  });
  layoutGraph(graph, nodes, projection.ranks, metrics, layoutScopes(graph), projection.edges.flatMap((edge) => edge.targetId ? [{ source: edge.edge.nodeId, target: edge.targetId,
    port: nodes.find((node) => node.id === edge.edge.nodeId)!.ports.findIndex((port) => port.edge === edge.edge) }] : []));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges = projection.edges.filter((edge) => edge.targetId && edge.edge.slot !== 'afterAll').map((edge) => {
    const source = byId.get(edge.edge.nodeId)!; const target = byId.get(edge.targetId!)!;
    const siblings = projection.edges.filter((other) => other.targetId === edge.targetId && other.edge.slot !== 'afterAll').sort((a, b) => byId.get(a.edge.nodeId)!.y - byId.get(b.edge.nodeId)!.y);
    const index = siblings.indexOf(edge);
    const start = { x: source.x + source.width, y: source.y + metrics.header + (source.ports.indexOf(edge) + .5) * metrics.row };
    const end = { x: target.x, y: target.y + metrics.header * (index + 1) / (siblings.length + 1) };
    return { ...edge, start, end, path: horizontalPath(start, end, metrics.gap) };
  });
  return { nodes, edges, metrics, width: Math.max(200, ...nodes.map((node) => node.x + node.width + metrics.gap)),
    height: Math.max(200, ...nodes.map((node) => node.y + node.height + metrics.gap)) };
}
