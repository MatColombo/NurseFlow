// @vitest-environment node
import { expect, it } from 'vitest';
import { activitiesGraph } from '@test/fixtures/builder';
import { fixtureDate } from '@test/fixtures/domain';
import { runtimeReady } from '@test/fixtures/runtime';
import { createRun, reduceRun, resumeRun, unwrap, type ExecutionRun } from '../runtime';
import { applyEdit } from './edits';
import { destinationAt, nodeAt } from './structure';
import { projectMap } from '../map/projection';
import { mapScene } from '../map/scene';
import { validateGraph } from '../validation/validator';

it.each([2, 3, 32])('%i new activity arms finish into one external successor, independently after reload', (count) => {
  let graph = activitiesGraph(count); let sequence = 0; const id = () => 'new-' + ++sequence;
  const group = nodeAt(graph, 'tasks'); if (group.kind !== 'multitask') throw new Error('fixture');
  for (const activity of group.activities) activity.first = { kind: 'unassigned' };
  graph.nodes = graph.nodes.filter((node) => !node.id.startsWith('task-'));
  const after = applyEdit(graph, { type: 'create', edge: { nodeId: 'tasks', slot: 'afterAll' }, kind: 'instruction' }, id);
  graph = after.graph;
  for (let index = 1; index <= count; index++) {
    const result = applyEdit(graph, { type: 'create', edge: { nodeId: 'tasks', slot: 'activity', itemId: 'activity-' + index }, kind: 'instruction' }, id);
    const followup = applyEdit(result.graph, { type: 'create', edge: { nodeId: result.createdId!, slot: 'next' }, kind: 'alert' }, id);
    graph = followup.graph;
    expect(destinationAt(graph, { nodeId: followup.createdId!, slot: 'next' })).toEqual({ kind: 'activity-complete' });
  }
  for (const node of graph.nodes) if ('text' in node) { node.text = 'Fixture'; node.title = node.id; }
  const before = structuredClone(graph); const revision = runtimeReady(graph);
  let run = unwrap(createRun(revision, 'run', fixtureDate));
  for (let index = count; index > 0; index--) {
    run = unwrap(reduceRun(run, revision, { type: 'switch-activity', activityId: 'activity-' + index }, fixtureDate))!;
    run = unwrap(reduceRun(run, revision, { type: 'continue' }, fixtureDate))!;
    run = unwrap(resumeRun(JSON.parse(JSON.stringify(run)) as ExecutionRun, revision));
    run = unwrap(reduceRun(run, revision, { type: 'finish-activity' }, fixtureDate))!;
    expect(run.currentNodeId === after.createdId).toBe(index === 1);
  }
  expect(run.tokens.filter((token) => token.completed)).toHaveLength(count);
  expect(run.journal.filter((item) => item.kind === 'after-all')).toHaveLength(1);
  const projection = projectMap(graph); const scene = mapScene(graph, projection, 13, 768);
  const completions = scene.edges.filter((edge) => edge.destination.kind === 'activity-complete');
  expect(completions).toHaveLength(count); expect(completions.every((edge) => edge.targetId === after.createdId)).toBe(true);
  for (const edge of scene.edges) expect(edge.end.x).toBeGreaterThan(edge.start.x);
  expect(graph).toEqual(before);
  // Deletion retains the old End as an orphan; explicitly remove it for this Ready fixture.
  const removed = applyEdit(applyEdit(graph, { type: 'delete', nodeId: after.createdId! }, id).graph, { type: 'delete', nodeId: 'end' }, id).graph;
  expect(destinationAt(removed, { nodeId: 'tasks', slot: 'afterAll' })).toMatchObject({ kind: 'broken', formerNodeId: after.createdId });
  expect(validateGraph(removed).problems).toEqual([]);
  const brokenReady = runtimeReady(removed); let broken = unwrap(createRun(brokenReady, 'broken', fixtureDate));
  for (let index = count; index > 0; index--) {
    broken = unwrap(reduceRun(broken, brokenReady, { type: 'switch-activity', activityId: 'activity-' + index }, fixtureDate))!;
    broken = unwrap(reduceRun(broken, brokenReady, { type: 'continue' }, fixtureDate))!;
    broken = unwrap(reduceRun(broken, brokenReady, { type: 'finish-activity' }, fixtureDate))!;
  }
  expect(broken.status).toBe('interrupted'); expect(broken.interruption).toMatchObject({ code: 'W08', formerNodeId: after.createdId });
  expect(unwrap(resumeRun(run, revision)).currentNodeId).toBe(after.createdId); // old Ready/run stays intact
});
