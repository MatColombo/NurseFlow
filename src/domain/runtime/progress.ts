import type { Destination } from '../model/graph';
import { ROOT_TOKEN, activityTokenId, type ExecutionRun, type RunToken } from './model';
import { actionable, currentVisit, nodeAt, tokenAt, visitAt, type RuntimeGraph, type RuntimeMode } from './topology';
import { checkedRun } from './validate';

type Range = { min: number; max: number };
type Cost = { normal?: Range | undefined; stop?: Range | undefined; unknown: boolean; committed: number };
export type RunProgress = { n?: number; total: { kind: 'exact'; value: number } | { kind: 'range'; min: number; max: number } | { kind: 'unknown' }; actualVisibleCount: number };
const zero = (): Cost => ({ normal: { min: 0, max: 0 }, unknown: false, committed: 0 });
const add = (a: Range, b: Range): Range => ({ min: a.min + b.min, max: a.max + b.max });
const union = (values: (Range | undefined)[]): Range | undefined => {
  const ranges = values.filter((r): r is Range => r !== undefined);
  return ranges.length ? { min: Math.min(...ranges.map((r) => r.min)), max: Math.max(...ranges.map((r) => r.max)) } : undefined;
};
function plus(cost: Cost, count: number): Cost {
  const range = { min: count, max: count };
  return { ...cost, ...(cost.normal ? { normal: add(cost.normal, range) } : {}), ...(cost.stop ? { stop: add(cost.stop, range) } : {}), committed: cost.committed + count };
}
function alternatives(costs: Cost[]): Cost { return { normal: union(costs.map((c) => c.normal)), stop: union(costs.map((c) => c.stop)), unknown: costs.some((c) => c.unknown), committed: 0 }; }
function sequence(first: Cost, next: () => Cost): Cost {
  if (!first.normal) return first;
  const after = next();
  return { normal: after.normal && add(first.normal, after.normal),
    stop: union([first.stop, after.stop && add(first.normal, after.stop)]), unknown: first.unknown || after.unknown, committed: first.committed };
}

function calculator(run: ExecutionRun, graph: RuntimeGraph) {
  const cache = new Map<string, Cost>();
  const destination = (dest: Destination, activity: boolean): Cost => {
    if (dest.kind === 'broken' || dest.kind === 'unassigned' || dest.kind === 'node' && !graph.nodes.has(dest.nodeId)) return { unknown: true, committed: 0 };
    if (dest.kind === 'activity-complete') return zero();
    const target = nodeAt(graph, dest.nodeId);
    if (target.kind === 'end') return activity ? { stop: { min: 0, max: 0 }, unknown: false, committed: 0 } : zero();
    return abstract(target.id, activity);
  };
  const parallel = (arms: Cost[], continuation: () => Cost, initialFocusCost = 0): Cost => {
    const normal = arms.every((c) => c.normal) ? arms.reduce((sum, c) => add(sum, c.normal!), { min: 0, max: 0 }) : undefined;
    const stops = arms.map((arm, index) => arm.stop && arms.reduce((sum, other, otherIndex) => {
      if (otherIndex === index) return sum;
      return { min: sum.min + Math.max(other.committed, otherIndex === 0 ? initialFocusCost : 0),
        max: sum.max + Math.max(other.normal?.max ?? 0, other.stop?.max ?? 0, other.committed) };
    }, arm.stop));
    return sequence({ normal, stop: union(stops), unknown: arms.some((c) => c.unknown), committed: arms.reduce((sum, c) => sum + c.committed, 0) }, continuation);
  };
  const abstract = (id: string, activity: boolean): Cost => {
    const key = JSON.stringify([id, activity]); const known = cache.get(key); if (known) return known;
    const node = nodeAt(graph, id); let cost: Cost;
    switch (node.kind) {
      case 'start': cost = destination(node.next, activity); break;
      case 'end': cost = activity ? { stop: { min: 0, max: 0 }, unknown: false, committed: 0 } : zero(); break;
      case 'instruction': case 'alert': cost = plus(destination(node.next, activity), 1); break;
      case 'decision': cost = plus(alternatives(node.outcomes.map((o) => destination(o.destination, activity))), 1); break;
      case 'multitask': {
        const ordered = [...node.activities].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1));
        const arms = ordered.map((a) => destination(a.first, true));
        // Entering a fork opens its first activity before switching is available.
        const firstCost = firstVisible(ordered[0]!.first);
        cost = firstCost === 0 && !arms[0]!.normal ? arms[0]! : parallel(arms, () => destination(node.afterAll, activity), firstCost); break;
      }
    }
    cost = { ...cost, committed: 0 }; cache.set(key, cost); return cost;
  };
  const firstVisible = (dest: Destination): number => {
    if (dest.kind !== 'node' || !graph.nodes.has(dest.nodeId)) return 0;
    const node = nodeAt(graph, dest.nodeId);
    if (actionable(node)) return 1;
    if (node.kind === 'multitask') return firstVisible([...node.activities].sort((a, b) => a.order - b.order)[0]!.first);
    return 0;
  };
  const actual = (token: RunToken): number => token.path.reduce((sum, id) => {
    const visit = visitAt(run, id); const node = nodeAt(graph, visit.nodeId);
    return sum + (actionable(node) ? 1 : node.kind === 'multitask' ? node.activities.reduce((n, a) => n + actual(tokenAt(run, activityTokenId(id, a.id))), 0) : 0);
  }, 0);
  const focusedAncestors = new Set([run.focusTokenId]); let focused = tokenAt(run, run.focusTokenId);
  while (focused.groupVisitId !== undefined) { focused = tokenAt(run, visitAt(run, focused.groupVisitId).tokenId); focusedAncestors.add(focused.id); }
  const dynamic = (token: RunToken): Cost => {
    if (token.completed && !focusedAncestors.has(token.id)) return plus(zero(), actual(token));
    // Back does not erase a recorded route. While another activity is focused, its saved
    // future still contributes to the global ordinal; alternatives reopen when it is focused again.
    if (!focusedAncestors.has(token.id) && token.cursor < token.path.length - 1) token = { ...token, cursor: token.path.length - 1 };
    if (token.path.length === 0) {
      const fork = nodeAt(graph, visitAt(run, token.groupVisitId!).nodeId);
      return fork.kind === 'multitask' ? destination(fork.activities.find((a) => a.id === token.activityId)!.first, true) : { unknown: true, committed: 0 };
    }
    let prefix = 0;
    for (const id of token.path.slice(0, token.cursor)) {
      const node = nodeAt(graph, visitAt(run, id).nodeId);
      prefix += actionable(node) ? 1 : node.kind === 'multitask' ? node.activities.reduce((n, a) => n + actual(tokenAt(run, activityTokenId(id, a.id))), 0) : 0;
    }
    const visit = currentVisit(run, token); const node = nodeAt(graph, visit.nodeId); const activity = token.id !== ROOT_TOKEN;
    if (node.kind !== 'multitask') return { ...plus(abstract(node.id, activity), prefix), committed: prefix + (actionable(node) ? 1 : 0) };
    const arms = node.activities.map((a) => dynamic(tokenAt(run, activityTokenId(visit.id, a.id))));
    return plus(parallel(arms, () => destination(node.afterAll, activity)), prefix);
  };
  return dynamic(tokenAt(run, ROOT_TOKEN));
}

export function progressOf(input: unknown, revision: unknown, mode: RuntimeMode = 'ready'): RunProgress {
  const { run, graph } = checkedRun(input, revision, mode);
  const visible = run.visits.filter((v) => actionable(nodeAt(graph, v.nodeId))); const current = currentVisit(run);
  const n = actionable(nodeAt(graph, current.nodeId)) ? visible.findIndex((v) => v.id === current.id) + 1 : undefined;
  if (run.status === 'ended') return { actualVisibleCount: visible.length, total: { kind: 'exact', value: visible.length } };
  const cost = calculator(run, graph); const range = union([cost.normal, cost.stop]);
  return { ...(n !== undefined ? { n } : {}), actualVisibleCount: visible.length,
    total: run.interruption || cost.unknown || !range ? { kind: 'unknown' } : range.min === range.max ? { kind: 'exact', value: range.min } : { kind: 'range', ...range } };
}
