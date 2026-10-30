import { nodeSchema, type Destination, type Graph, type Node } from '../model';
import { requireEdit, type EdgeRef } from './model';
import { assertEditableGraph, destinationAt, incoming, nodeAt, nodeLabel, outlets, outletScope, setDestination } from './structure';

export type NewKind = Exclude<Node['kind'], 'start'>;
export type Edit =
  | { type: 'create'; edge: EdgeRef; kind: NewKind; endKind?: 'completed' | 'stopped' | 'escalation' | 'neutral'; stopEntire?: true }
  | { type: 'connect'; edge: EdgeRef; destination: Destination }
  | { type: 'disconnect'; edge: EdgeRef }
  | { type: 'finish'; edge: EdgeRef }
  | { type: 'delete'; nodeId: string }
  | { type: 'rename'; nodeId: string; title: string; phaseId?: string | null }
  | { type: 'add-item'; nodeId: string }
  | { type: 'rename-item'; nodeId: string; itemId: string; text: string }
  | { type: 'remove-item'; nodeId: string; itemId: string }
  | { type: 'reorder-item'; nodeId: string; itemId: string; delta: -1 | 1 }
  | { type: 'phase'; id?: string; name: string; remove?: true; delta?: -1 | 1 };

const galleries = { beforeNote: { layout: 'stacked-thumbnails', imageSpace: 'compact' },
  afterNote: { layout: 'full-width', imageSpace: 'natural' } } as const;
export function freshNode(kind: NewKind, newId: () => string, endKind: 'completed' | 'stopped' | 'escalation' | 'neutral' = 'neutral'): Node {
  const id = newId(); const next = { kind: 'unassigned' } as const;
  const content = { id, media: [], galleries };
  if (kind === 'instruction' || kind === 'alert') return nodeSchema.parse({ ...content, kind, text: '', next });
  if (kind === 'decision') return nodeSchema.parse({ ...content, kind, question: '',
    outcomes: [0, 1].map((order) => ({ id: newId(), order, label: '', destination: next })) });
  if (kind === 'multitask') return nodeSchema.parse({ id, kind, title: '',
    activities: [0, 1].map((order) => ({ id: newId(), order, name: '', required: true, first: next })), afterAll: next });
  return nodeSchema.parse({ id, kind: 'end', endKind, heading: '', message: '' });
}
export function applyEdit(source: Graph, edit: Edit, newId: () => string): { graph: Graph; createdId?: string } {
  const graph = structuredClone(source); let createdId: string | undefined;
  if (edit.type === 'create') {
    const old = destinationAt(graph, edit.edge); const scope = outletScope(graph, edit.edge);
    if (edit.stopEntire) requireEdit(edit.kind === 'end' && scope.length > 0 &&
      (edit.endKind === 'stopped' || edit.endKind === 'escalation'), 'scope');
    else if (edit.kind === 'end') requireEdit(scope.length === 0, 'scope');
    const node = freshNode(edit.kind, newId, edit.endKind); graph.nodes.push(node); createdId = node.id;
    // A simple insertion inherits ONLY the selected edge. Other incoming edges remain intact.
    if (old.kind !== 'unassigned' && ('next' in node || node.kind === 'multitask')) {
      if ('next' in node) node.next = old; else node.afterAll = old;
    }
    setDestination(graph, edit.edge, { kind: 'node', nodeId: node.id, ...(edit.stopEntire ? { terminateProcedure: true as const } : {}) });
  } else if (edit.type === 'connect') {
    // Whole-procedure exceptions can only be authored through the explicit confirmed create action.
    requireEdit(edit.destination.kind !== 'node' || !edit.destination.terminateProcedure, 'scope');
    requireEdit(edit.destination.kind !== 'activity-complete', 'scope'); setDestination(graph, edit.edge, edit.destination);
  } else if (edit.type === 'disconnect') setDestination(graph, edit.edge, { kind: 'unassigned' });
  else if (edit.type === 'finish') {
    requireEdit(outletScope(graph, edit.edge).length > 0 && edit.edge.slot !== 'activity', 'scope');
    setDestination(graph, edit.edge, { kind: 'activity-complete' });
  } else if (edit.type === 'delete') {
    const removed = nodeAt(graph, edit.nodeId); requireEdit(removed.kind !== 'start');
    for (const item of incoming(graph, removed.id)) setDestination(graph, item.edge,
      { kind: 'broken', formerNodeId: removed.id, ...(nodeLabel(removed) ? { formerTitle: nodeLabel(removed) } : {}) });
    graph.nodes = graph.nodes.filter((node) => node.id !== removed.id);
    if (graph.layout) delete graph.layout.positions[removed.id];
    // Descendants stay canonical and recoverable. No implicit cascade.
  } else if (edit.type === 'rename') {
    const node = nodeAt(graph, edit.nodeId); requireEdit(node.kind !== 'start');
    if (node.kind === 'end') node.heading = edit.title;
    else if ('title' in node || edit.title !== '') node.title = edit.title;
    if (edit.phaseId !== undefined && (node.phaseId ?? null) !== edit.phaseId) node.phaseId = edit.phaseId;
  } else if (edit.type === 'phase') {
    if (!edit.id) graph.phases.push({ id: newId(), name: edit.name, order: graph.phases.length });
    else {
      const phase = graph.phases.find((phase) => phase.id === edit.id); requireEdit(phase);
      if (edit.remove) {
        graph.phases = graph.phases.filter((phase) => phase.id !== edit.id);
        for (const node of graph.nodes) if ('phaseId' in node && node.phaseId === edit.id) node.phaseId = null;
      } else if (edit.delta) {
        const ordered = [...graph.phases].sort((a, b) => a.order - b.order); const index = ordered.indexOf(phase);
        const other = ordered[index + edit.delta]; requireEdit(other);
        [ordered[index], ordered[index + edit.delta]] = [other, phase]; ordered.forEach((phase, order) => { phase.order = order; });
      } else phase.name = edit.name;
    }
  } else {
    const node = nodeAt(graph, edit.nodeId); requireEdit(node.kind === 'decision' || node.kind === 'multitask');
    const items = node.kind === 'decision' ? node.outcomes : node.activities;
    if (edit.type === 'add-item') {
      requireEdit(items.length < 32, 'limit');
      if (node.kind === 'decision') node.outcomes.push({ id: newId(), order: items.length, label: '', destination: { kind: 'unassigned' } });
      else node.activities.push({ id: newId(), order: items.length, name: '', required: true, first: { kind: 'unassigned' } });
    } else {
      const item = items.find((item) => item.id === edit.itemId); requireEdit(item);
      if (edit.type === 'rename-item') { if ('label' in item) item.label = edit.text; else item.name = edit.text; }
      else if (edit.type === 'remove-item') {
        if (node.kind === 'decision') node.outcomes = node.outcomes.filter((item) => item.id !== edit.itemId);
        else node.activities = node.activities.filter((item) => item.id !== edit.itemId);
      } else {
        const ordered = [...items].sort((a, b) => a.order - b.order); const index = ordered.indexOf(item);
        const other = ordered[index + edit.delta]; requireEdit(other);
        [ordered[index], ordered[index + edit.delta]] = [other, item]; ordered.forEach((item, order) => { item.order = order; });
      }
      (node.kind === 'decision' ? node.outcomes : node.activities).sort((a, b) => a.order - b.order).forEach((item, order) => { item.order = order; });
    }
  }
  assertEditableGraph(graph); return { graph, ...(createdId ? { createdId } : {}) };
}

export function detachedOutlets(node: Node, keep: ReadonlySet<string>) {
  for (const { edge, destination } of outlets(node)) if (destination.kind === 'node' && !keep.has(destination.nodeId)) {
    // Preserve historical W08 as W08; live external references become visibly unresolved.
    const tiny: Graph = { schemaVersion: 1, phases: [], nodes: [node] };
    setDestination(tiny, edge, { kind: 'unassigned' });
  }
}
