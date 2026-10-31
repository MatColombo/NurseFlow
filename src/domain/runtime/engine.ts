import { isoDateSchema, idSchema } from '../model/common';
import { ROOT_TOKEN, activityTokenId, requireRun, result, runEventSchema, type ExecutionRun, type RunEvent } from './model';
import { activate, focus, follow, invalidateParents, journal, release, summarize, truncate } from './state';
import { children, compileRevision, currentVisit, destinationAt, exitEdge, groupAt, groupChain, nodeAt, tokenAt, visitAt, type RuntimeGraph } from './topology';
import { checkedRun, validateRun } from './validate';

function begin(graph: RuntimeGraph, id: string, now: string): ExecutionRun {
  idSchema.parse(id); isoDateSchema.parse(now);
  const run: ExecutionRun = { runtimeVersion: 1, id, procedureId: graph.revision.procedureId, pinnedRevisionId: graph.revision.id,
    saveVersion: 1, status: 'active', currentNodeId: graph.start.id, focusTokenId: ROOT_TOKEN,
    nextVisitId: 1, nextSequence: 1, visits: [], groups: [], journal: [],
    tokens: [{ id: ROOT_TOKEN, path: [], cursor: -1, completed: false }], startedAt: now, updatedAt: now };
  journal(run, 'start', ROOT_TOKEN); follow(run, graph, tokenAt(run, ROOT_TOKEN), { nodeId: graph.start.id, slot: 'next' });
  summarize(run, graph); return validateRun(run, graph);
}
export function createRun(revision: unknown, id: string, now: string) { return result(() => begin(compileRevision(revision), id, now), 'invalid-revision'); }
export function resumeRun(input: unknown, revision: unknown) { return result(() => checkedRun(input, revision).run); }

function apply(run: ExecutionRun, graph: RuntimeGraph, event: RunEvent): boolean {
  const token = tokenAt(run, run.focusTokenId); const visit = currentVisit(run); const node = nodeAt(graph, visit.nodeId);
  if (event.type === 'back') {
    if (run.interruption) { delete run.interruption; journal(run, 'back', token.id, visit.id); return true; }
    let previous = visit.fromVisitId === undefined ? undefined : visitAt(run, visit.fromVisitId);
    const seen = new Set<number>();
    while (previous && nodeAt(graph, previous.nodeId).kind === 'multitask') {
      requireRun(!seen.has(previous.id), 'invalid-session'); seen.add(previous.id);
      previous = previous.fromVisitId === undefined ? undefined : visitAt(run, previous.fromVisitId);
    }
    requireRun(previous, 'first-step');
    const parent = tokenAt(run, previous.tokenId); parent.cursor = parent.path.indexOf(previous.id); focus(run, parent);
    journal(run, 'back', parent.id, previous.id); return true;
  }
  requireRun(run.status === 'active');
  if (event.type === 'switch-activity' || event.type === 'reopen-activity') {
    const chain = groupChain(run); const groupId = event.groupVisitId ?? chain[0]; requireRun(groupId !== undefined && chain.includes(groupId));
    const target = tokenAt(run, activityTokenId(groupId, event.activityId));
    if (event.type === 'reopen-activity') {
      requireRun(event.confirmed, 'confirmation-required'); requireRun(target.completed); invalidateParents(run, target);
      journal(run, 'reopen', target.id, target.path[target.cursor]);
      let leaf = target;
      while (nodeAt(graph, currentVisit(run, leaf).nodeId).kind === 'multitask') {
        const group = groupAt(run, currentVisit(run, leaf).id); leaf = tokenAt(run, activityTokenId(group.visitId, group.focusedActivityId));
      }
      focus(run, leaf); return true;
    } else {
      if (target.id === token.id) return false;
      requireRun(!target.completed, 'confirmation-required'); journal(run, 'switch', target.id, target.path[target.cursor]);
    }
    activate(run, graph, target); return true;
  }
  if (event.type === 'after-all') {
    requireRun(groupChain(run).includes(event.groupVisitId));
    requireRun(children(run, event.groupVisitId).every((child) => child.completed));
    release(run, graph, event.groupVisitId, visit.id); return true;
  }
  if (event.type === 'choose-outcome') {
    requireRun(node.kind === 'decision' && node.outcomes.some((outcome) => outcome.id === event.outcomeId));
    if (visit.outcomeId !== event.outcomeId) {
      truncate(run, token, token.cursor); invalidateParents(run, token);
      run.journal = run.journal.filter((entry) => !(entry.kind === 'choose' && entry.visitId === visit.id)); visit.outcomeId = event.outcomeId;
    }
    journal(run, 'choose', token.id, visit.id); follow(run, graph, token, exitEdge(graph, visit), visit.id); return true;
  }
  requireRun(event.type === 'continue' || event.type === 'finish-activity');
  requireRun(node.kind === 'instruction' || node.kind === 'alert'); const edge = exitEdge(graph, visit); const destination = destinationAt(graph, edge);
  requireRun(event.type === 'finish-activity' ? destination.kind === 'activity-complete' && token.groupVisitId !== undefined : destination.kind !== 'activity-complete');
  journal(run, event.type === 'finish-activity' ? 'finish' : 'continue', token.id, visit.id); follow(run, graph, token, edge, visit.id); return true;
}

/** No clock, randomness, database or UI. A rejected event leaves the input byte-for-byte unchanged. */
export function reduceRun(input: unknown, revision: unknown, inputEvent: unknown, now: string) {
  return result<ExecutionRun | null>(() => {
    const { run, graph } = checkedRun(input, revision); const parsed = runEventSchema.safeParse(inputEvent); requireRun(parsed.success); const event = parsed.data;
    isoDateSchema.parse(now);
    if (event.type === 'exit') { requireRun(event.confirmed, 'confirmation-required'); return null; }
    if (event.type === 'restart') {
      requireRun(event.confirmed, 'confirmation-required'); const fresh = begin(graph, run.id, now);
      return { ...fresh, saveVersion: run.saveVersion + 1, startedAt: run.startedAt };
    }
    if (!apply(run, graph, event)) return run;
    run.saveVersion++; run.updatedAt = now; summarize(run, graph); return validateRun(run, graph);
  });
}
