// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createRun, reduceRun, unwrap, type RunEvent } from '../runtime';
import { edgeKey } from '../builder/structure';
import { fixtureDate, multitaskGraph } from '@test/fixtures/domain';
import { activitiesGraph, outlineGraph, outcomesGraph } from '@test/fixtures/builder';
import { activityChoiceGraph, nestedActivitiesGraph, runtimeReady } from '@test/fixtures/runtime';
import { projectMap, projectRoute } from './projection';
import { mapScene } from './scene';
import { fitViewport } from '../builder/viewport';
function execution(graph = outlineGraph()) {
  const revision = runtimeReady(graph); let run = unwrap(createRun(revision, 'run', fixtureDate));
  return { get run() { return run; }, step(event: RunEvent) { run = unwrap(reduceRun(run, revision, event, fixtureDate))!; },
    route() { return projectRoute(graph, projectMap(graph), run); } };
}
describe('F11 immutable Map/List projections', () => {
  it('shared destinations have one canonical row, deterministic references and direct incoming arrows', () => {
    const graph = outlineGraph(); const before = JSON.stringify(graph); const map = projectMap(graph);
    expect(map.order.filter((id) => id === 'shared')).toHaveLength(1);
    expect(map.order.indexOf('shared')).toBeGreaterThan(map.order.indexOf('a-step'));
    expect(map.order.indexOf('shared')).toBeGreaterThan(map.order.indexOf('b-step'));
    expect([...projectMap(graph).references]).toEqual([...map.references]);
    const scene = mapScene(graph, map, 13, 320); expect(scene.edges.filter((edge) => edge.targetId === 'shared')).toHaveLength(2);
    expect(scene.nodes).toHaveLength(graph.nodes.length); expect(JSON.stringify(graph)).toBe(before);
  });
  it('incomplete, dangling, broken, detached, missing Start and cyclic Drafts remain inspectable without fabricated destinations', () => {
    const graph = outcomesGraph(); graph.nodes = graph.nodes.filter((node) => node.kind !== 'start');
    const choice = graph.nodes.find((node) => node.kind === 'decision')!; if (choice.kind !== 'decision') throw new Error();
    choice.outcomes[0]!.destination = { kind: 'node', nodeId: 'deleted' }; choice.outcomes[1]!.destination = { kind: 'broken', formerNodeId: 'old' };
    const before = JSON.stringify(graph); const map = projectMap(graph);
    expect(map.order).toHaveLength(graph.nodes.length); expect(map.edges.filter((edge) => edge.edge.nodeId === choice.id).slice(0, 2).every((edge) => edge.targetId === undefined)).toBe(true);
    expect(mapScene(graph, map, 48, 320).nodes).toHaveLength(graph.nodes.length); expect(JSON.stringify(graph)).toBe(before);
    choice.outcomes[2]!.destination = { kind: 'node', nodeId: choice.id }; const cycle = projectMap(graph);
    expect(cycle.cyclic).toBe(true); expect(new Set(cycle.order).size).toBe(graph.nodes.length);
  });
  it('no run context invents a Current, visited edge or activity state', () => {
    const graph = activityChoiceGraph(); const route = projectRoute(graph, projectMap(graph));
    expect([...route.visitedNodes, ...route.visitedEdges, ...route.activities]).toEqual([]);
  });
  it('Back hides cached future; changing an answer never combines alternative histories at convergence', () => {
    const example = execution(); example.step({ type: 'choose-outcome', outcomeId: 'a' }); example.step({ type: 'continue' });
    expect([...example.route().visitedNodes]).toContain('shared'); example.step({ type: 'back' }); example.step({ type: 'back' });
    expect(example.run.visits.some((visit) => visit.nodeId === 'shared')).toBe(true);
    expect([...example.route().visitedNodes]).not.toContain('shared');
    expect([...example.route().visitedEdges]).not.toContain(edgeKey({ nodeId: 'decision', slot: 'outcome', itemId: 'a' }));
    example.step({ type: 'choose-outcome', outcomeId: 'b' }); example.step({ type: 'continue' });
    expect(example.route().visitedNodes.has('b-step')).toBe(true); expect(example.route().visitedNodes.has('a-step')).toBe(false);
    expect(example.route().visitedEdges.has(edgeKey({ nodeId: 'decision', slot: 'outcome', itemId: 'b' }))).toBe(true);
  });
  it('parallel statuses use saved tokens; pending activity never highlights its edge or the unreleased continuation', () => {
    const example = execution(activityChoiceGraph()); const map = projectMap(activityChoiceGraph());
    expect(example.route().activities.get(edgeKey({ nodeId: 'tasks', slot: 'activity', itemId: 'activity-2' }))).toBe('pending');
    example.step({ type: 'continue' }); example.step({ type: 'choose-outcome', outcomeId: 'blue' });
    expect(example.route().counts.get('tasks')).toEqual({ completed: 1, total: 2 });
    expect(example.route().visitedNodes.has('end')).toBe(false);
    const completion = map.edges.find((edge) => edge.destination.kind === 'activity-complete')!;
    expect(example.route().visitedEdges.has(completion.key)).toBe(false);
    example.step({ type: 'finish-activity' }); expect(example.route().visitedNodes.has('end')).toBe(true);
    expect(example.route().counts.get('tasks')).toEqual({ completed: 2, total: 2 });
  });
  it('nested AND completion arrows end at the actual common destination without a synthetic gate', () => {
    const graph = nestedActivitiesGraph(); const map = projectMap(graph); const scene = mapScene(graph, map, 13, 390);
    expect(scene.nodes.map((node) => node.id).sort()).toEqual(graph.nodes.map((node) => node.id).sort());
    expect(scene.edges.filter((edge) => edge.edge.nodeId.startsWith('inner-step')).every((edge) => edge.targetId === 'end')).toBe(true);
    expect(scene.edges.some((edge) => edge.edge.slot === 'afterAll')).toBe(false);
  });
  it('an authorized Stop sharing the common End never highlights an unreleased AND completion route', () => {
    const graph = multitaskGraph(true); const tasks = graph.nodes.find((node) => node.kind === 'multitask')!;
    if (tasks.kind === 'multitask') tasks.afterAll = { kind: 'node', nodeId: 'escalation' };
    graph.nodes = graph.nodes.filter((node) => node.id !== 'end'); const choice = graph.nodes.find((node) => node.kind === 'decision')!;
    if (choice.kind === 'decision' && choice.outcomes[1]!.destination.kind === 'node') choice.outcomes[1]!.destination.terminateProcedure = true;
    const example = execution(graph); example.step({ type: 'switch-activity', activityId: 'activity-2' }); example.step({ type: 'finish-activity' });
    example.step({ type: 'continue' }); example.step({ type: 'choose-outcome', outcomeId: 'stop-all' });
    expect(example.run.status).toBe('ended'); expect(example.route().visitedNodes.has('escalation')).toBe(true);
    expect(example.route().visitedEdges.has(edgeKey({ nodeId: 'task-2', slot: 'next' }))).toBe(false);
    expect(example.route().visitedEdges.has(edgeKey({ nodeId: 'choice', slot: 'outcome', itemId: 'stop-all' }))).toBe(true);
    expect(example.route().counts.get('tasks')).toEqual({ completed: 1, total: 3 });
  });
  it.each([4, 48])('32 activities and 32 outcomes keep original font geometry and all List references at %ipt', (scale) => {
    for (const graph of [activitiesGraph(32), outcomesGraph()]) {
      const before = JSON.stringify(graph); const map = projectMap(graph); const scene = mapScene(graph, map, scale, 320);
      expect(scene.nodes).toHaveLength(graph.nodes.length); expect(scene.metrics.row).toBeGreaterThanOrEqual(48);
      expect(scene.edges.every((edge) => !edge.path.includes('NaN'))).toBe(true);
      const camera = fitViewport({ x: 0, y: 0, zoom: 1, initialized: false, focusItems: {} }, scene, 320, 300, .001);
      expect(scene.width * camera.zoom).toBeLessThanOrEqual(320); expect(scene.height * camera.zoom).toBeLessThanOrEqual(300);
      expect(mapScene(graph, map, scale, 320)).toEqual(scene); expect(JSON.stringify(graph)).toBe(before);
    }
  });
});
