import { selectionSchema, type Selection } from '@domain/builder/model';
import type { Issue } from '@domain/validation/validator';
import type { Graph } from '@domain/model';
import { destinationAt } from '@domain/builder/structure';
export type CheckReturn = { issue: string; top: number };
export function readCheckReturn(params: URLSearchParams): CheckReturn | undefined {
  try {
    const raw = JSON.parse(params.get('checkReturn') ?? 'null') as Partial<CheckReturn> | null;
    if (raw && typeof raw.issue === 'string' && raw.issue.length <= 10000 && typeof raw.top === 'number' && Number.isFinite(raw.top) && raw.top >= 0 && raw.top <= 10000000) return { issue: raw.issue, top: raw.top };
  } catch { /* Malformed route context never becomes an arbitrary navigation target. */ }
  return;
}
export function checkPath(id: string, context?: CheckReturn) {
  return '/build/' + encodeURIComponent(id) + '/check' + (context ? '?' + new URLSearchParams({ issue: context.issue, top: String(context.top) }).toString() : '');
}
export function carryCheck(params: URLSearchParams, target: URLSearchParams) {
  const context = readCheckReturn(params); if (context) target.set('checkReturn', JSON.stringify(context));
}
export function readCheckSelection(params: URLSearchParams, graph: Graph): Selection | undefined {
  try {
    const result = selectionSchema.safeParse(JSON.parse(params.get('checkSelection') ?? 'null')); if (!result.success) return;
    const selection = result.data; const node = graph.nodes.find((node) => node.id === (selection.kind === 'edge' ? selection.edge.nodeId : selection.nodeId)); if (!node) return;
    if (selection.kind === 'edge') destinationAt(graph, selection.edge);
    if (selection.kind === 'activity' && (node.kind !== 'multitask' || !node.activities.some((item) => item.id === selection.activityId))) return;
    return selection;
  } catch { return; }
}
export function issuePath(id: string, revisionId: string, issue: Issue, top: number) {
  const base = '/build/' + encodeURIComponent(id); const query = new URLSearchParams({ revision: revisionId, checkReturn: JSON.stringify({ issue: issue.id, top }) });
  const editor = issue.editor && issue.nodeId && !issue.edge && ['P03', 'P10', 'P12', 'W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07'].includes(issue.code) && issue.field !== 'storage' && issue.field !== 'activities';
  if (editor) {
    if (issue.field) query.set('focusField', issue.field);
    if (issue.itemId) query.set('focusItem', issue.itemId);
    if (issue.field === 'outcomes' && issue.itemId) query.set('outcome', issue.itemId);
    return base + '/step/' + encodeURIComponent(issue.nodeId!) + '?' + query.toString();
  }
  const selection: Selection | undefined = issue.edge?.slot === 'activity' && issue.field === 'name' ? { kind: 'activity', nodeId: issue.edge.nodeId, activityId: issue.edge.itemId! } : issue.edge ? { kind: 'edge', edge: issue.edge } : issue.nodeId ? { kind: 'node', nodeId: issue.nodeId } : undefined;
  if (selection) query.set('checkSelection', JSON.stringify(selection));
  return base + '?' + query.toString();
}
