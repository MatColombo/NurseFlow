import { z } from 'zod';
import { graphSchema, procedureFieldsSchema, type Destination, type Graph, type Procedure, type Revision } from './model';
import { normalize } from './library';
import { assertGraphReferences, destinations, invariant } from './model/integrity';

export const ribbonColors = ['neutral', 'primary', 'blue', 'purple', 'amber'] as const;
export const ribbonIcons = ['procedure', 'ready', 'draft', 'info', 'image'] as const;
export const metadataSchema = procedureFieldsSchema.pick({ title: true, description: true, groupId: true,
  tags: true, aliases: true, priority: true, ribbon: true }).extend({
  ribbon: z.strictObject({ colorKey: z.enum(ribbonColors), iconKey: z.enum(ribbonIcons) }),
});
export type ProcedureMetadata = z.infer<typeof metadataSchema>;
export function uniqueLabels(labels: readonly string[]) {
  const seen = new Set<string>();
  return labels.map((label) => label.trim().replace(/\s+/g, ' ')).filter((label) => {
    const key = normalize(label); if (!key || seen.has(key)) return false; seen.add(key); return true;
  });
}
export function metadataOf(procedure?: Procedure): ProcedureMetadata {
  return { title: procedure?.title ?? '', description: procedure?.description ?? '', groupId: procedure?.groupId ?? null,
    tags: procedure?.tags ?? [], aliases: procedure?.aliases ?? [], priority: procedure?.priority ?? 0,
    ribbon: { colorKey: ribbonColors.find((key) => key === procedure?.ribbon.colorKey) ?? 'neutral',
      iconKey: ribbonIcons.find((key) => key === procedure?.ribbon.iconKey) ?? 'procedure' } };
}
export function parseMetadata(input: unknown, creating = false) {
  const metadata = metadataSchema.parse(input);
  invariant(!creating || metadata.title.length <= 120, 'Title exceeds 120 characters');
  return { ...metadata, tags: uniqueLabels(metadata.tags), aliases: uniqueLabels(metadata.aliases) };
}
export function procedureState(procedure: Procedure) {
  if (procedure.archived) return 'archived' as const;
  if (procedure.readyRevisionId) return procedure.workingDraftId ? 'ready-draft' as const : 'ready' as const;
  return procedure.workingDraftId ? 'draft' as const : 'unavailable' as const;
}
export function assertRevisionOwner(procedure: Procedure, revision: Revision | undefined, kind: 'ready' | 'working-draft') {
  invariant(revision && revision.procedureId === procedure.id && revision.state === kind, 'Revision unavailable or belongs to another procedure');
  assertGraphReferences(revision.graph);
  return revision;
}
export function readyStart(revision: Revision) {
  invariant(revision.state === 'ready', 'Start requires Ready');
  assertGraphReferences(revision.graph);
  const starts = revision.graph.nodes.filter((node) => node.kind === 'start');
  invariant(starts.length === 1, 'Ready must have one Start');
  const start = starts[0]; invariant(start?.kind === 'start', 'Start unavailable');
  invariant(start.next.kind === 'node' || start.next.kind === 'broken', 'Ready Start has no assigned path');
  const nodes = new Map(revision.graph.nodes.map((node) => [node.id, node]));
  const visiting = new Set<string>(); const visited = new Set<string>();
  function visit(id: string) {
    invariant(!visiting.has(id), 'Ready contains a cycle'); if (visited.has(id)) return;
    visiting.add(id); const node = nodes.get(id); invariant(node, 'Ready destination unavailable');
    for (const next of destinations(node)) {
      invariant(next.kind !== 'unassigned', 'Ready has an unassigned path');
      if (next.kind === 'node') visit(next.nodeId);
    }
    visiting.delete(id); visited.add(id);
  }
  for (const node of revision.graph.nodes) visit(node.id);
  return start;
}

/** Independent editorial identities; immutable asset references remain shared locally. */
export function cloneProcedureGraph(source: Graph, newId: () => string): Graph {
  assertGraphReferences(source); const graph = graphSchema.parse(source);
  const identities = [...graph.phases.map((phase) => phase.id), ...graph.nodes.flatMap((node) => [node.id,
    ...(node.kind === 'decision' ? node.outcomes.map((outcome) => outcome.id) : []),
    ...(node.kind === 'multitask' ? node.activities.map((activity) => activity.id) : []),
    ...('media' in node ? node.media.map((media) => media.id) : []),
  ])];
  const used = new Set(identities); const ids = new Map(identities.map((id) => {
    const next = newId(); invariant(next && !used.has(next), 'Copy IDs must be fresh'); used.add(next); return [id, next];
  }));
  const mapped = (id: string) => { const value = ids.get(id); invariant(value, 'Unknown copy reference'); return value; };
  const destination = (value: Destination): Destination => value.kind === 'node' ? { ...value, nodeId: mapped(value.nodeId) } : { ...value };
  for (const phase of graph.phases) phase.id = mapped(phase.id);
  for (const node of graph.nodes) {
    node.id = mapped(node.id);
    if ('phaseId' in node && node.phaseId) node.phaseId = mapped(node.phaseId);
    if ('media' in node) for (const media of node.media) media.id = mapped(media.id);
    if ('next' in node) node.next = destination(node.next);
    if (node.kind === 'decision') for (const outcome of node.outcomes) { outcome.id = mapped(outcome.id); outcome.destination = destination(outcome.destination); }
    if (node.kind === 'multitask') {
      node.afterAll = destination(node.afterAll);
      for (const activity of node.activities) { activity.id = mapped(activity.id); activity.first = destination(activity.first); }
    }
  }
  if (graph.layout) graph.layout.positions = Object.fromEntries(Object.entries(graph.layout.positions).map(([id, position]) => [mapped(id), position]));
  assertGraphReferences(graph); return graph;
}
