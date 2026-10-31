import type { Graph, GalleryPrefs, LegacyRunSession } from '@domain/model';
import { procedureSchema, readyRevisionSchema } from '@domain/model';
import type { ImportedRecords } from '@domain/portability/records';

export const fixtureDate = '2026-10-29T10:00:00.000Z';
export const galleries: GalleryPrefs = {
  beforeNote: { layout: 'stacked-thumbnails', imageSpace: 'compact' },
  afterNote: { layout: 'full-width', imageSpace: 'natural' },
};
export function convergenceGraph(): Graph {
  return { schemaVersion: 1, phases: [{ id: 'phase', name: 'Fase esempio', order: 0 }], nodes: [
    { id: 'start', kind: 'start', next: { kind: 'node', nodeId: 'decision' } },
    { id: 'decision', kind: 'decision', question: 'Percorso A o B?', phaseId: 'phase', media: [], galleries,
      outcomes: [
        { id: 'a', order: 0, label: 'A', destination: { kind: 'node', nodeId: 'shared' } },
        { id: 'b', order: 1, label: 'B', destination: { kind: 'node', nodeId: 'shared' } },
      ] },
    { id: 'shared', kind: 'instruction', text: 'Annotare il colore del cartoncino.', phaseId: 'phase',
      media: [], galleries, next: { kind: 'node', nodeId: 'end' } },
    { id: 'end', kind: 'end', endKind: 'completed', heading: 'Esempio terminato', message: 'Fine del percorso dimostrativo.' },
  ], layout: { positions: { shared: { x: 1, y: 2 } } } };
}
export function earlyEndGraph(): Graph {
  const graph = convergenceGraph();
  const decision = graph.nodes.find((node) => node.kind === 'decision');
  if (decision?.kind === 'decision' && decision.outcomes[1]) {
    decision.outcomes[1].destination = { kind: 'node', nodeId: 'stop' };
  }
  graph.nodes.push({ id: 'stop', kind: 'end', endKind: 'stopped', heading: 'Esempio interrotto', message: 'Interruzione scelta.' });
  return graph;
}
export function multitaskGraph(earlyStop = false): Graph {
  const graph: Graph = { schemaVersion: 1, phases: [], nodes: [
    { id: 'start', kind: 'start', next: { kind: 'node', nodeId: 'tasks' } },
    { id: 'tasks', kind: 'multitask', title: 'Tre attività dimostrative', afterAll: { kind: 'node', nodeId: 'end' },
      activities: [1, 2, 3].map((number) => ({ id: `activity-${number}`, name: `Attività ${number}`,
        order: number - 1, required: true, first: { kind: 'node', nodeId: `task-${number}` } })) },
    ...[1, 2, 3].map((number) => ({ id: `task-${number}`, kind: 'instruction' as const,
      text: `Ordinare il cartoncino ${number}.`, media: [], galleries, next: { kind: 'activity-complete' as const } })),
    { id: 'end', kind: 'end', endKind: 'neutral', heading: 'Fine esempio', message: 'Attività terminate.' },
    ...(earlyStop ? [
      { id: 'choice', kind: 'decision' as const, question: 'Continuare la dimostrazione?', media: [], galleries, outcomes: [
        { id: 'continue', order: 0, label: 'Continua', destination: { kind: 'activity-complete' as const } },
        { id: 'stop-all', order: 1, label: 'Termina intero esempio', destination: { kind: 'node' as const, nodeId: 'escalation' } },
      ] },
      { id: 'escalation', kind: 'end' as const, endKind: 'escalation' as const, heading: 'Interruzione esplicita', message: 'Altre attività non completate.' },
    ] : []),
  ] };
  if (earlyStop) for (const node of graph.nodes) {
    if (node.id === 'task-1' && node.kind === 'instruction') node.next = { kind: 'node', nodeId: 'choice' };
  }
  return graph;
}
export function incompleteGraph(): Graph {
  const graph = convergenceGraph();
  for (const node of graph.nodes) if (node.kind === 'decision') {
    if (node.outcomes[0]) node.outcomes[0].destination = { kind: 'unassigned' };
    if (node.outcomes[1]) node.outcomes[1].destination = { kind: 'broken', formerNodeId: 'deleted', formerTitle: 'Vecchio cartoncino' };
  }
  return graph;
}
export function mediaGraph(): Graph {
  const graph = convergenceGraph();
  const step = graph.nodes.find((node) => node.kind === 'instruction');
  if (step?.kind === 'instruction') {
    step.media = Array.from({ length: 32 }, (_, index) => ({ id: `media-${index}`, order: index,
      slot: index % 2 === 0 ? 'before-note' : 'after-note',
      source: index === 0 ? { kind: 'remote', httpsUrl: 'https://example.com/card.gif', expectedMime: 'image/gif' } :
        { kind: 'local', assetId: 'missing-asset', mime: 'image/png' },
    }));
  }
  return graph;
}
export function exampleRecords(graph = convergenceGraph()): ImportedRecords {
  const procedure = procedureSchema.parse({ id: 'procedure', title: 'Procedura esempio non clinica', groupId: 'group',
    readyRevisionId: 'ready', createdAt: fixtureDate, updatedAt: fixtureDate });
  const ready = readyRevisionSchema.parse({ id: 'ready', procedureId: procedure.id, state: 'ready', revisionNumber: 1,
    editVersion: 1, graph, createdAt: fixtureDate, updatedAt: fixtureDate, validatorSchemaVersion: 1,
    confirmedForPersonalUseAt: fixtureDate, warningsAtConfirmation: [] });
  return { procedures: [procedure], groups: [{ id: 'group', name: 'Esempi', order: 0, createdAt: fixtureDate }],
    revisions: [ready], mediaAssets: [], runSessions: [] };
}
export function exampleRun(procedureId: string, pinnedRevisionId: string): LegacyRunSession {
  return { id: 'run', procedureId, pinnedRevisionId, saveVersion: 1, status: 'active', currentNodeId: 'shared',
    visited: [{ nodeId: 'start' }, { nodeId: 'decision', outcomeId: 'a' }], multitaskProgress: {},
    startedAt: fixtureDate, updatedAt: fixtureDate };
}
