import type { Graph, ReadyRevision } from '@domain/model';
import { exampleRecords, galleries } from './domain';
import { activitiesGraph, outlineGraph } from './builder';

export function runtimeReady(graph: Graph = outlineGraph()): ReadyRevision { return exampleRecords(graph).revisions[0] as ReadyRevision; }
export function activityChoiceGraph(): Graph {
  const graph = activitiesGraph(2); const task = graph.nodes.find((n) => n.id === 'task-1')!;
  if (task.kind === 'instruction') task.next = { kind: 'node', nodeId: 'choice' };
  graph.nodes.push({ id: 'choice', kind: 'decision', title: 'Scelta del cartoncino', question: 'Quale colore?', media: [], galleries, outcomes: [
    { id: 'blue', label: 'Blu', order: 0, destination: { kind: 'activity-complete' } },
    { id: 'red', label: 'Rosso', order: 1, destination: { kind: 'node', nodeId: 'extra' } },
  ] }, { id: 'extra', kind: 'instruction', title: 'Cartoncino rosso', text: 'Annotare il colore.', media: [], galleries, next: { kind: 'activity-complete' } });
  return graph;
}
export function nestedActivitiesGraph(): Graph {
  const graph = activitiesGraph(2); const task = graph.nodes.find((n) => n.id === 'task-1')!;
  if (task.kind === 'instruction') task.next = { kind: 'node', nodeId: 'inner' };
  graph.nodes.push({ id: 'inner', kind: 'multitask', title: 'Due lavori interni', afterAll: { kind: 'activity-complete' }, activities: [1, 2].map((i) => ({
    id: `inner-activity-${i}`, name: `Lavoro ${i}`, order: i - 1, required: true, first: { kind: 'node', nodeId: `inner-step-${i}` },
  })) }, ...[1, 2].map((i) => ({ id: `inner-step-${i}`, kind: 'instruction' as const, title: `Cartoncino ${i}`, text: 'Ordinare il cartoncino.',
    media: [], galleries, next: { kind: 'activity-complete' as const } })));
  return graph;
}
