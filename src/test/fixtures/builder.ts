import type { Graph } from '@domain/model';
import { convergenceGraph, multitaskGraph } from './domain';
/** Editorial fixtures only; no clinical content and no production seeding. */
export function outlineGraph(): Graph {
  const graph = convergenceGraph();
  const decision = graph.nodes.find((node) => node.kind === 'decision')!;
  if (decision.kind === 'decision') {
    decision.title = 'Scelta dimostrativa'; decision.question = 'Percorso A o B?';
    decision.outcomes[0]!.label = 'A'; decision.outcomes[0]!.destination = { kind: 'node', nodeId: 'a-step' };
    decision.outcomes[1]!.label = 'B'; decision.outcomes[1]!.destination = { kind: 'node', nodeId: 'b-step' };
  }
  const shared = graph.nodes.find((node) => node.kind === 'instruction')!;
  if (shared.kind !== 'instruction') throw new Error('fixture');
  shared.title = 'Revisione comune';
  graph.nodes.push({ ...structuredClone(shared), id: 'a-step', title: 'Percorso A', text: 'Testo fittizio A', next: { kind: 'node', nodeId: 'shared' } },
    { ...structuredClone(shared), id: 'b-step', title: 'Percorso B', text: 'Testo fittizio B', next: { kind: 'node', nodeId: 'shared' } });
  return graph;
}
export function activitiesGraph(count = 3): Graph {
  const graph = multitaskGraph(); const task = graph.nodes.find((node) => node.kind === 'multitask')!;
  if (task.kind !== 'multitask') throw new Error('fixture');
  task.title = 'Lavori dimostrativi';
  const template = graph.nodes.find((node) => node.id === 'task-1')!;
  graph.nodes = graph.nodes.filter((node) => !node.id.startsWith('task-'));
  task.activities = Array.from({ length: count }, (_, index) => ({
    id: 'activity-' + (index + 1), name: 'Attività ' + (index + 1), order: index, required: true,
    first: { kind: 'node', nodeId: 'task-' + (index + 1) },
  }));
  graph.nodes.push(...task.activities.map((_, index) => ({ ...structuredClone(template), id: 'task-' + (index + 1), title: 'Operazione ' + (index + 1) })));
  return graph;
}
export function outcomesGraph(): Graph {
  const graph = outlineGraph(); const decision = graph.nodes.find((node) => node.kind === 'decision')!;
  if (decision.kind === 'decision') decision.outcomes = Array.from({ length: 32 }, (_, index) => ({
    id: 'outcome-' + (index + 1), order: index, label: 'Esito ' + (index + 1), destination: { kind: 'unassigned' },
  }));
  return graph;
}
