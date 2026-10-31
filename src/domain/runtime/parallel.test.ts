import { describe, expect, it } from 'vitest';
import { activitiesGraph } from '@test/fixtures/builder';
import { fixtureDate } from '@test/fixtures/domain';
import { activityChoiceGraph, nestedActivitiesGraph, runtimeReady } from '@test/fixtures/runtime';
import { createRun, reduceRun, resumeRun, unwrap, viewRun, type ExecutionRun, type RunEvent } from './index';

describe('AND provenance and dependent invalidation', () => {
  it('changing a completed arm preserves independent work and removes the released future', () => {
    const revision = runtimeReady(activityChoiceGraph()); let run = unwrap(createRun(revision, 'run', fixtureDate));
    const act = (event: RunEvent) => { run = unwrap(reduceRun(run, revision, event, fixtureDate))!; };
    const outer = run.groups[0]!.visitId;
    act({ type: 'continue' }); act({ type: 'choose-outcome', outcomeId: 'blue' }); act({ type: 'finish-activity' });
    expect(run.status).toBe('ended'); act({ type: 'back' }); expect(run.currentNodeId).toBe('task-2');
    act({ type: 'reopen-activity', groupVisitId: outer, activityId: 'activity-1', confirmed: true });
    expect(run.currentNodeId).toBe('choice'); expect(run.tokens.find((t) => t.activityId === 'activity-2')?.completed).toBe(true);
    expect(run.visits.some((v) => v.nodeId === 'end')).toBe(false);
    act({ type: 'choose-outcome', outcomeId: 'red' }); expect(run.currentNodeId).toBe('extra');
    expect(run.tokens.find((t) => t.activityId === 'activity-2')?.completed).toBe(true);
    act({ type: 'finish-activity' }); expect(run.status).toBe('ended');
    expect(viewRun(run, revision).previous?.nodeId).toBe('extra'); expect(unwrap(resumeRun(run, revision))).toEqual(run);
  });
  it('Back from a shared continuation uses the last actual branch, and changed answers clear only dependent future', () => {
    const graph = activityChoiceGraph(); const fork = graph.nodes.find((n) => n.kind === 'multitask')!;
    if (fork.kind === 'multitask') fork.afterAll = { kind: 'node', nodeId: 'after' };
    const template = graph.nodes.find((n) => n.id === 'task-2')!;
    if (template.kind === 'instruction') graph.nodes.push({ ...structuredClone(template), id: 'after', next: { kind: 'node', nodeId: 'end' } });
    const revision = runtimeReady(graph); let run = unwrap(createRun(revision, 'run', fixtureDate));
    const act = (event: RunEvent) => { run = unwrap(reduceRun(run, revision, event, fixtureDate))!; };
    act({ type: 'switch-activity', activityId: 'activity-2' }); act({ type: 'finish-activity' });
    act({ type: 'continue' }); act({ type: 'choose-outcome', outcomeId: 'red' }); act({ type: 'finish-activity' });
    expect(run.currentNodeId).toBe('after'); expect(viewRun(run, revision).previous?.nodeId).toBe('extra');
    act({ type: 'back' }); act({ type: 'back' }); expect(run.currentNodeId).toBe('choice');
    act({ type: 'choose-outcome', outcomeId: 'blue' }); expect(run.currentNodeId).toBe('after');
    expect(run.visits.some((v) => v.nodeId === 'extra')).toBe(false);
    expect(run.tokens.find((t) => t.activityId === 'activity-2')?.completed).toBe(true);
  });
  it('nested groups resume independently, finish the containing arm only after every inner activity and reopen without auto-finishing', () => {
    const revision = runtimeReady(nestedActivitiesGraph()); let run = unwrap(createRun(revision, 'run', fixtureDate));
    const act = (event: RunEvent) => { run = unwrap(reduceRun(run, revision, event, fixtureDate))!; };
    const outer = run.groups[0]!.visitId; act({ type: 'continue' }); const inner = run.groups[1]!.visitId;
    expect(viewRun(run, revision).groups.map((g) => g.visitId)).toEqual([inner, outer]);
    act({ type: 'switch-activity', groupVisitId: outer, activityId: 'activity-2' });
    act({ type: 'switch-activity', groupVisitId: outer, activityId: 'activity-1' }); expect(run.currentNodeId).toBe('inner-step-1');
    act({ type: 'switch-activity', groupVisitId: inner, activityId: 'inner-activity-2' }); act({ type: 'finish-activity' });
    expect(run.currentNodeId).toBe('inner-step-1'); act({ type: 'finish-activity' }); expect(run.currentNodeId).toBe('task-2');
    act({ type: 'reopen-activity', groupVisitId: outer, activityId: 'activity-1', confirmed: true });
    expect(run.currentNodeId).toBe('inner-step-1'); expect(run.tokens.find((t) => t.activityId === 'activity-1')?.completed).toBe(false);
    act({ type: 'reopen-activity', groupVisitId: inner, activityId: 'inner-activity-1', confirmed: true });
    act({ type: 'finish-activity' }); expect(run.currentNodeId).toBe('task-2'); act({ type: 'finish-activity' }); expect(run.status).toBe('ended');
  });
  it.each([2, 3, 8, 32])('all %i activities are required, independently resumable and order invariant', (count) => {
    const revision = runtimeReady(activitiesGraph(count)); let run = unwrap(createRun(revision, 'run', fixtureDate));
    const order = Array.from({ length: count }, (_, i) => count - i);
    for (const [index, id] of order.entries()) {
      const act = (event: RunEvent) => { run = unwrap(reduceRun(run, revision, event, fixtureDate))!; };
      act({ type: 'switch-activity', activityId: `activity-${id}` }); expect(run.currentNodeId).toBe(`task-${id}`);
      run = unwrap(resumeRun(JSON.parse(JSON.stringify(run)) as ExecutionRun, revision)); act({ type: 'finish-activity' });
      expect(run.status).toBe(index === count - 1 ? 'ended' : 'active');
      expect(run.tokens.filter((t) => t.completed)).toHaveLength(index + 1);
    }
    expect(run.journal.filter((j) => j.kind === 'after-all')).toHaveLength(1);
  });
});
