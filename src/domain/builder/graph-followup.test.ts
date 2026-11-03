import { expect, it } from 'vitest';
import { activitiesGraph, outlineGraph } from '@test/fixtures/builder';
import { applyEdit } from './edits';
import { activityRegions, graphMetrics, makeScene } from './scene';
import { assertEditableGraph } from './structure';
import { projectMap } from '../map/projection';
import { mapScene } from '../map/scene';

it('activity and first step are one pure command; incomplete and broken activities remain explicit', () => {
  const original = activitiesGraph(); let index = 0;
  const result = applyEdit(original, { type: 'create-activity', nodeId: 'tasks', name: 'Fourth', kind: 'alert' }, () => 'new-' + ++index);
  expect(result.createdId).toBeDefined();
  const task = result.graph.nodes.find((node) => node.kind === 'multitask')!;
  if (task.kind !== 'multitask') throw new Error('fixture');
  expect(task.activities.at(-1)).toMatchObject({ name: 'Fourth', required: true, first: { kind: 'node', nodeId: result.createdId } });
  expect(result.graph.nodes.find((node) => node.id === result.createdId)).toMatchObject({ kind: 'alert', title: 'Fourth', next: { kind: 'activity-complete' } });
  expect(original).toEqual(activitiesGraph());
  expect(() => applyEdit(original, { type: 'create-activity', nodeId: 'tasks', itemId: 'activity-1', name: 'No overwrite', kind: 'instruction' }, () => 'x')).toThrow();
});

it('all End types occupy the rightmost column in type order, preserving identities in Builder and Map', () => {
  const graph = outlineGraph(); const template = graph.nodes.find((node) => node.kind === 'end')!;
  if (template.kind !== 'end') throw new Error('fixture');
  graph.nodes.push(...(['escalation', 'neutral', 'stopped'] as const).map((endKind) => ({ ...template, id: endKind, endKind })));
  for (const scene of [makeScene(graph, {}, 1280, graphMetrics(13, 1280)), mapScene(graph, projectMap(graph), 13, 1280)]) {
    const ends = scene.nodes.filter((box) => graph.nodes.find((node) => node.id === box.id)?.kind === 'end');
    expect(new Set(ends.map((box) => box.x)).size).toBe(1);
    expect(ends[0]!.x).toBe(Math.max(...scene.nodes.map((box) => box.x)));
    expect([...ends].sort((a, b) => a.y - b.y).map((box) => graph.nodes.find((node) => node.id === box.id)).map((node) => node?.kind === 'end' && node.endKind))
      .toEqual(['completed', 'neutral', 'stopped', 'escalation']);
  }
});

it('reorders a reversed parallel layer to follow source ports and avoid crossings', () => {
  const graph = outlineGraph(); graph.nodes.reverse();
  for (const scene of [makeScene(graph, {}, 1280, graphMetrics(13, 1280)), mapScene(graph, projectMap(graph), 13, 1280)]) {
    expect(scene.nodes.find((box) => box.id === 'a-step')!.y).toBeLessThan(scene.nodes.find((box) => box.id === 'b-step')!.y);
  }
});

it('reserves the entire multitask region against an unrelated parallel branch at every scale', () => {
  const graph = activitiesGraph(3); const root = outlineGraph();
  const decision = root.nodes.find((node) => node.kind === 'decision')!;
  if (decision.kind !== 'decision') throw new Error('fixture');
  decision.outcomes[0]!.destination = { kind: 'node', nodeId: 'tasks' };
  decision.outcomes[1]!.destination = { kind: 'node', nodeId: 'unrelated' };
  const start = graph.nodes.find((node) => node.kind === 'start')!; if (start.kind === 'start') start.next = { kind: 'node', nodeId: decision.id };
  const template = root.nodes.find((node) => node.id === 'a-step')!;
  graph.phases = root.phases; graph.nodes.push(decision, { ...template, id: 'unrelated' });
  // Keep the unrelated branch disconnected from the activity collector.
  const unrelated = graph.nodes.find((node) => node.id === 'unrelated')!;
  if (unrelated.kind === 'instruction') unrelated.next = { kind: 'node', nodeId: 'end' };
  for (const scale of [4, 13, 30, 48]) for (const width of [320, 1280]) {
    for (const scene of [makeScene(graph, {}, width, graphMetrics(scale, width)), mapScene(graph, projectMap(graph), scale, width)]) {
      for (const region of activityRegions(graph, scene.nodes, assertEditableGraph(graph))) for (const box of scene.nodes) {
        if (region.members.includes(box)) continue;
        expect(box.x >= region.x + region.width || box.x + box.width <= region.x || box.y >= region.y + region.height || box.y + box.height <= region.y).toBe(true);
      }
    }
  }
});
