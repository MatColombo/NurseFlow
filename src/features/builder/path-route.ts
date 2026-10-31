import type { Graph } from '@domain/model';
import type { EdgeRef } from '@domain/builder/model';
import { destinationAt, nodeAt } from '@domain/builder/structure';
import { requireEdit } from '@domain/builder/model';
export type PathReturn = { edge: EdgeRef; stepId: string; outcomeId?: string; top: number };
export function readPathReturn(params: URLSearchParams, graph: Graph): PathReturn | undefined {
  if (!params.has('pathNode')) return;
  const slot = params.get('pathSlot'); requireEdit(slot === 'next' || slot === 'outcome');
  const edge: EdgeRef = { nodeId: params.get('pathNode')!, slot, ...(params.has('pathItem') ? { itemId: params.get('pathItem')! } : {}) };
  destinationAt(graph, edge); const stepId = params.get('returnStep')!; const node = nodeAt(graph, stepId);
  requireEdit(node.id === edge.nodeId && node.kind !== 'start' && node.kind !== 'multitask');
  const outcomeId = params.get('returnOutcome') ?? undefined; requireEdit(!outcomeId || edge.itemId === outcomeId);
  const top = Number(params.get('editorTop') ?? 0); requireEdit(Number.isFinite(top) && top >= 0 && top <= 10_000_000);
  return { edge, stepId, ...(outcomeId ? { outcomeId } : {}), top };
}
export function editorPath(procedureId: string, revisionId: string, context: PathReturn) {
  const query = new URLSearchParams({ revision: revisionId, editorTop: String(context.top) });
  if (context.outcomeId) query.set('outcome', context.outcomeId);
  return '/build/' + encodeURIComponent(procedureId) + '/step/' + encodeURIComponent(context.stepId) + '?' + query.toString();
}
