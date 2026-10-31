import { describe, expect, it } from 'vitest';
import type { Graph } from '../model';
import { fixtureDate, galleries } from '@test/fixtures/domain';
import { activityChoiceGraph, nestedActivitiesGraph, runtimeReady } from '@test/fixtures/runtime';
import { createRun, reduceRun, progressOf, unwrap, viewRun, type RunEvent } from './index';

function unequalGraph(a: number, b: number): Graph {
  const graph: Graph = { schemaVersion: 1, phases: [], nodes: [
    { id: 'start', kind: 'start', next: { kind: 'node', nodeId: 'decision' } },
    { id: 'decision', kind: 'decision', question: 'Cartoncino A o B?', media: [], galleries, outcomes: [
      { id: 'a', label: 'A', order: 0, destination: { kind: 'node', nodeId: a ? 'a-0' : 'shared' } },
      { id: 'b', label: 'B', order: 1, destination: { kind: 'node', nodeId: b ? 'b-0' : 'shared' } },
    ] },
    { id: 'shared', kind: 'instruction', title: 'Riordino', text: 'Ordinare le carte.', media: [], galleries, next: { kind: 'node', nodeId: 'end' } },
    { id: 'end', kind: 'end', endKind: 'completed', heading: 'Fine', message: 'Fine esempio.' },
  ] };
  for (const [arm, count] of [['a', a], ['b', b]] as const) for (let i = 0; i < count; i++) graph.nodes.push({ id: `${arm}-${i}`, kind: 'instruction',
    title: `Carta ${arm} ${i}`, text: 'Leggere la carta.', media: [], galleries, next: { kind: 'node', nodeId: i === count - 1 ? 'shared' : `${arm}-${i + 1}` } });
  return graph;
}
describe('route-aware counts and previous cue', () => {
  it('bounds agree with exhaustive route lengths over 16 acyclic shared-destination graphs', () => {
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
      const revision = runtimeReady(unequalGraph(a, b)); const initial = unwrap(createRun(revision, 'run', fixtureDate));
      expect(progressOf(initial, revision)).toMatchObject({ n: 1, total: a === b ? { kind: 'exact', value: a + 2 } : { kind: 'range', min: Math.min(a, b) + 2, max: Math.max(a, b) + 2 } });
      for (const [outcomeId, length] of [['a', a], ['b', b]] as const) {
        let run = unwrap(reduceRun(initial, revision, { type: 'choose-outcome', outcomeId }, fixtureDate))!;
        for (let index = 2; index <= length + 2; index++) {
          expect(progressOf(run, revision)).toMatchObject({ n: index, total: { kind: 'exact', value: length + 2 } });
          run = unwrap(reduceRun(run, revision, { type: 'continue' }, fixtureDate))!;
        }
        expect(progressOf(run, revision)).toEqual({ actualVisibleCount: length + 2, total: { kind: 'exact', value: length + 2 } });
      }
    }
  });
  it('global ordinals reuse known steps; all required pending activities contribute to bounds', () => {
    const revision = runtimeReady(activityChoiceGraph()); let run = unwrap(createRun(revision, 'run', fixtureDate));
    const act = (event: RunEvent) => { run = unwrap(reduceRun(run, revision, event, fixtureDate))!; };
    expect(progressOf(run, revision)).toMatchObject({ n: 1, total: { kind: 'range', min: 3, max: 4 } });
    expect(viewRun(run, revision).previous?.kind).toBe('multitask');
    act({ type: 'switch-activity', activityId: 'activity-2' }); expect(progressOf(run, revision).n).toBe(2);
    act({ type: 'finish-activity' }); expect(progressOf(run, revision).n).toBe(1);
    act({ type: 'continue' }); expect(progressOf(run, revision).n).toBe(3);
    act({ type: 'choose-outcome', outcomeId: 'red' });
    expect(progressOf(run, revision)).toMatchObject({ n: 4, total: { kind: 'exact', value: 4 } });
    expect(viewRun(run, revision).previous).toMatchObject({ nodeId: 'choice', outcomeId: 'red' });
    act({ type: 'back' }); expect(progressOf(run, revision)).toMatchObject({ n: 3, total: { kind: 'range', min: 3, max: 4 } });
    act({ type: 'choose-outcome', outcomeId: 'blue' });
    expect(progressOf(run, revision)).toEqual({ actualVisibleCount: 3, total: { kind: 'exact', value: 3 } });
  });
  it('counts nested required work without structural nodes', () => {
    const revision = runtimeReady(nestedActivitiesGraph()); let run = unwrap(createRun(revision, 'run', fixtureDate));
    expect(progressOf(run, revision)).toMatchObject({ n: 1, total: { kind: 'exact', value: 4 } });
    run = unwrap(reduceRun(run, revision, { type: 'continue' }, fixtureDate))!;
    expect(progressOf(run, revision)).toMatchObject({ n: 2, total: { kind: 'exact', value: 4 } });
  });
  it('W08 has unknown total even before choosing it; a safe alternative recomputes a real total', () => {
    const graph = unequalGraph(0, 0); const decision = graph.nodes.find((n) => n.kind === 'decision')!;
    if (decision.kind === 'decision') decision.outcomes[0]!.destination = { kind: 'broken', formerNodeId: 'missing' };
    const revision = runtimeReady(graph); const run = unwrap(createRun(revision, 'run', fixtureDate));
    expect(progressOf(run, revision).total).toEqual({ kind: 'unknown' });
    const safe = unwrap(reduceRun(run, revision, { type: 'choose-outcome', outcomeId: 'b' }, fixtureDate))!;
    expect(progressOf(safe, revision)).toMatchObject({ n: 2, total: { kind: 'exact', value: 2 } });
  });
});
