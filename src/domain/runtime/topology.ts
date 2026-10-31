import { revisionSchema } from '../model/records';
import type { Destination, Node, Revision } from '../model';
import { validateGraph } from '../validation/validator';
import { requireRun, type ExecutionRun, type RunEdge, type RunVisit } from './model';

export type RuntimeMode = 'ready' | 'draft-preview';
export type RuntimeGraph = { revision: Revision; nodes: ReadonlyMap<string, Node>; start: Extract<Node, { kind: 'start' }> };
export function compileRevision(input: unknown, mode: RuntimeMode = 'ready'): RuntimeGraph {
  const parsed = revisionSchema.safeParse(input); requireRun(parsed.success, 'invalid-revision');
  const revision = parsed.data;
  requireRun(revision.state === (mode === 'ready' ? 'ready' : 'working-draft'), 'invalid-revision');
  // Content validation belongs to Check. Loading an older Ready never invents or translates its text.
  const validation = validateGraph(revision.graph);
  const allowed = mode === 'ready' ? ['P10'] : ['P02', 'P03', 'P04', 'P05', 'P06', 'P09', 'P10'];
  requireRun(validation.problems.every((issue) => allowed.includes(issue.code)), 'invalid-revision');
  const nodes = new Map(revision.graph.nodes.map((node) => [node.id, node]));
  const start = revision.graph.nodes.find((node) => node.kind === 'start'); requireRun(start?.kind === 'start', 'invalid-revision');
  return { revision, nodes, start };
}
export function nodeAt(graph: RuntimeGraph, id: string) { const node = graph.nodes.get(id); requireRun(node, 'invalid-session'); return node; }
export function tokenAt(run: ExecutionRun, id: string) { const token = run.tokens.find((item) => item.id === id); requireRun(token, 'invalid-session'); return token; }
export function visitAt(run: ExecutionRun, id: number) { const visit = run.visits.find((item) => item.id === id); requireRun(visit, 'invalid-session'); return visit; }
export function currentVisit(run: ExecutionRun, token = tokenAt(run, run.focusTokenId)): RunVisit {
  const id = token.path[token.cursor]; requireRun(id !== undefined, 'invalid-session'); return visitAt(run, id);
}
export function groupAt(run: ExecutionRun, id: number) { const group = run.groups.find((item) => item.visitId === id); requireRun(group, 'invalid-session'); return group; }
export function groupNode(graph: RuntimeGraph, run: ExecutionRun, id: number) { const node = nodeAt(graph, visitAt(run, id).nodeId); requireRun(node.kind === 'multitask', 'invalid-session'); return node; }
export function children(run: ExecutionRun, id: number) { return run.tokens.filter((token) => token.groupVisitId === id); }
export function groupChain(run: ExecutionRun, token = tokenAt(run, run.focusTokenId)) {
  const chain: number[] = []; const seen = new Set<string>();
  while (token.groupVisitId !== undefined) {
    requireRun(!seen.has(token.id), 'invalid-session'); seen.add(token.id); chain.push(token.groupVisitId);
    token = tokenAt(run, visitAt(run, token.groupVisitId).tokenId);
  }
  const visit = currentVisit(run); if (run.groups.some((group) => group.visitId === visit.id)) chain.unshift(visit.id);
  return [...new Set(chain)];
}
export function destinationAt(graph: RuntimeGraph, edge: RunEdge): Destination {
  const node = nodeAt(graph, edge.nodeId);
  if (edge.slot === 'next' && 'next' in node) return node.next;
  if (edge.slot === 'outcome' && node.kind === 'decision') { const item = node.outcomes.find((item) => item.id === edge.itemId); requireRun(item); return item.destination; }
  if (edge.slot === 'activity' && node.kind === 'multitask') { const item = node.activities.find((item) => item.id === edge.itemId); requireRun(item); return item.first; }
  if (edge.slot === 'afterAll' && node.kind === 'multitask') return node.afterAll;
  requireRun(false);
}
export function exitEdge(graph: RuntimeGraph, visit: RunVisit): RunEdge {
  const node = nodeAt(graph, visit.nodeId);
  if ('next' in node) return { nodeId: node.id, slot: 'next' };
  if (node.kind === 'decision') { requireRun(visit.outcomeId); return { nodeId: node.id, slot: 'outcome', itemId: visit.outcomeId }; }
  if (node.kind === 'multitask') return { nodeId: node.id, slot: 'afterAll' };
  requireRun(false);
}
export const actionable = (node: Node) => node.kind === 'instruction' || node.kind === 'alert' || node.kind === 'decision';
