import type { Graph } from '../model';
import { applyEdit } from './edits';
import { BuilderError, type EdgeRef } from './model';
import { destinationAt } from './structure';
export function connectionProblem(graph: Graph, edge: EdgeRef, nodeId: string): BuilderError['code'] | 'connected' | null {
  const current = destinationAt(graph, edge);
  if (current.kind === 'node' && current.nodeId === nodeId) return 'connected';
  try { applyEdit(graph, { type: 'connect', edge, destination: { kind: 'node', nodeId } }, () => 'unused'); return null; }
  catch (error) { return error instanceof BuilderError ? error.code : 'invalid'; }
}
