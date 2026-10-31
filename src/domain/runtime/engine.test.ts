import { describe, expect, it } from 'vitest';
import type { Graph, ReadyRevision } from '../model';
import { activitiesGraph, outlineGraph } from '@test/fixtures/builder';
import { exampleRecords, fixtureDate, multitaskGraph } from '@test/fixtures/domain';
import { createRun, reduceRun, resumeRun } from './engine';
import { unwrap, type ExecutionRun, type RunEvent } from './model';

export const ready = (graph: Graph = outlineGraph()) => exampleRecords(graph).revisions[0] as ReadyRevision;
export const start = (revision = ready()) => unwrap(createRun(revision, 'run', fixtureDate));
export function step(run: ExecutionRun, revision: ReadyRevision, event: RunEvent): ExecutionRun {
  const next = unwrap(reduceRun(run, revision, event, fixtureDate)); if (!next) throw new Error('Unexpected exit'); return next;
}
describe('F09 pure pinned execution', () => {
  it('OR requires one explicit authored outcome; serializes, resumes and follows the real route', () => {
    const revision = ready(); const initial = start(revision); const bytes = JSON.stringify(initial);
    expect(initial.currentNodeId).toBe('decision'); expect(reduceRun(initial, revision, { type: 'continue' }, fixtureDate).ok).toBe(false);
    expect(reduceRun(initial, revision, { type: 'choose-outcome', outcomeId: 'other' }, fixtureDate).ok).toBe(false);
    const chosen = step(initial, revision, { type: 'choose-outcome', outcomeId: 'b' });
    expect(chosen.currentNodeId).toBe('b-step'); expect(JSON.stringify(initial)).toBe(bytes);
    expect(unwrap(resumeRun(JSON.parse(JSON.stringify(chosen)), revision))).toEqual(chosen);
    const shared = step(chosen, revision, { type: 'continue' }); const end = step(shared, revision, { type: 'continue' });
    expect(end).toMatchObject({ status: 'ended', terminalEndNodeId: 'end' });
    expect(step(end, revision, { type: 'back' }).currentNodeId).toBe('shared');
    const back = step(step(shared, revision, { type: 'back' }), revision, { type: 'back' });
    const changed = step(back, revision, { type: 'choose-outcome', outcomeId: 'a' });
    expect(changed.visits.map((v) => v.nodeId)).toEqual(['decision', 'a-step']);
    expect(changed.visits[0]?.outcomeId).toBe('a'); expect(changed.journal.filter((j) => j.kind === 'choose')).toHaveLength(1);
    expect(unwrap(resumeRun(changed, revision))).toEqual(changed);
  });
  it('AND switches/resumes independently, requires explicit Finish and gates continuation (E05/E14)', () => {
    const revision = ready(activitiesGraph()); let run = start(revision);
    const groupVisitId = run.groups[0]!.visitId;
    expect(run.currentNodeId).toBe('task-1');
    expect(reduceRun(run, revision, { type: 'continue' }, fixtureDate).ok).toBe(false);
    expect(reduceRun(run, revision, { type: 'after-all', groupVisitId }, fixtureDate).ok).toBe(false);
    run = step(run, revision, { type: 'switch-activity', activityId: 'activity-3' });
    run = step(run, revision, { type: 'finish-activity' }); expect(run.currentNodeId).toBe('task-1');
    expect(reduceRun(run, revision, { type: 'switch-activity', activityId: 'activity-3' }, fixtureDate)).toMatchObject({ ok: false, error: { code: 'confirmation-required' } });
    run = step(run, revision, { type: 'switch-activity', activityId: 'activity-2' });
    run = step(run, revision, { type: 'finish-activity' }); run = step(run, revision, { type: 'finish-activity' });
    expect(run.status).toBe('ended'); expect(run.tokens.filter((t) => t.completed)).toHaveLength(3);
    expect(run.journal.filter((j) => j.kind === 'after-all')).toHaveLength(1);
    run = step(run, revision, { type: 'back' }); expect(run.currentNodeId).toBe('task-1');
    run = step(run, revision, { type: 'finish-activity' }); expect(run.status).toBe('ended');
    expect(run.journal.filter((j) => j.kind === 'after-all')).toHaveLength(1);
  });
  it('authorized Stop/Escalation terminates the whole run without completing other arms (E07)', () => {
    const graph = multitaskGraph(true); const choice = graph.nodes.find((n) => n.kind === 'decision')!;
    if (choice.kind === 'decision' && choice.outcomes[1]?.destination.kind === 'node') choice.outcomes[1].destination.terminateProcedure = true;
    const revision = ready(graph); let run = start(revision); run = step(run, revision, { type: 'continue' });
    run = step(run, revision, { type: 'choose-outcome', outcomeId: 'stop-all' });
    expect(run).toMatchObject({ status: 'ended', terminalEndNodeId: 'escalation' }); expect(run.tokens.some((t) => t.completed)).toBe(false);
    delete (choice.kind === 'decision' ? choice.outcomes[1]!.destination as { terminateProcedure?: true } : {}).terminateProcedure;
    expect(createRun(ready(graph), 'bad', fixtureDate).ok).toBe(false);
  });
  it('W08 is an interruption, never End, never a silent skip (E08)', () => {
    const graph = outlineGraph(); const shared = graph.nodes.find((n) => n.id === 'shared')!;
    if (shared.kind === 'instruction') shared.next = { kind: 'broken', formerNodeId: 'deleted', formerTitle: 'Passo rimosso' };
    graph.nodes = graph.nodes.filter((n) => n.id !== 'end');
    const revision = ready(graph); let run = start(revision);
    run = step(run, revision, { type: 'choose-outcome', outcomeId: 'a' }); run = step(run, revision, { type: 'continue' });
    run = step(run, revision, { type: 'continue' });
    expect(run).toMatchObject({ status: 'interrupted', currentNodeId: 'shared', interruption: { code: 'W08', formerNodeId: 'deleted' } });
    expect(run.terminalEndNodeId).toBeUndefined(); expect(run.visits.some((v) => v.nodeId === 'deleted')).toBe(false);
    expect(step(run, revision, { type: 'back' })).toMatchObject({ status: 'active', currentNodeId: 'shared' });
  });
  it('Restart/Exit require confirmation; invalid events and corrupt snapshots are rejected atomically', () => {
    const revision = ready(); const run = start(revision); const original = structuredClone(run);
    expect(reduceRun(run, revision, { type: 'restart', confirmed: false }, fixtureDate)).toMatchObject({ ok: false, error: { code: 'confirmation-required' } });
    expect(reduceRun(run, revision, { type: 'exit', confirmed: false }, fixtureDate).ok).toBe(false);
    expect(unwrap(reduceRun(run, revision, { type: 'exit', confirmed: true }, fixtureDate))).toBeNull();
    expect(reduceRun(run, revision, { type: 'back' }, fixtureDate)).toMatchObject({ ok: false, error: { code: 'first-step' } });
    const restarted = step(run, revision, { type: 'restart', confirmed: true }); expect(restarted.saveVersion).toBe(2); expect(restarted.startedAt).toBe(run.startedAt);
    expect(resumeRun({ ...run, currentNodeId: 'end', status: 'ended', terminalEndNodeId: 'end' }, revision).ok).toBe(false);
    expect(run).toEqual(original);
  });
});
