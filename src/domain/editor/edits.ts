import { z } from 'zod';
import { galleryStyleSchema, nodeSchema, stepMediaSchema, stepNoteSchema, type Graph, type Node, type Settings } from '../model';
import { applyEdit } from '../builder/edits';
import { nodeAt, assertEditableGraph } from '../builder/structure';
import { requireEdit } from '../builder/model';

export type EditableStep = Exclude<Node, { kind: 'start' | 'multitask' }>;
export function editableStep(node: Node): EditableStep { requireEdit(node.kind !== 'start' && node.kind !== 'multitask'); return node; }
const content = z.strictObject({ title: z.string().optional(), text: z.string().optional(), question: z.string().optional(),
  context: z.string().optional(), additionalText: z.string().optional(), heading: z.string().optional(), message: z.string().optional(),
  endKind: z.enum(['completed', 'stopped', 'escalation', 'neutral']).optional(), phaseId: z.string().nullable().optional(), note: stepNoteSchema.optional() });
export type StepEdit =
  | { type: 'content'; patch: z.input<typeof content> }
  | { type: 'outcome'; id: string; label: string; note?: z.infer<typeof stepNoteSchema> }
  | { type: 'add-outcome' }
  | { type: 'remove-outcome'; id: string }
  | { type: 'arrange'; id: string; delta: -1 | 1 }
  | { type: 'new-phase'; name: string; id: string }
  | { type: 'change-type'; kind: EditableStep['kind'] }
  | { type: 'add-media'; media: z.infer<typeof stepMediaSchema> }
  | { type: 'replace-media'; id: string; source: z.infer<typeof stepMediaSchema>['source']; caption?: string; altText?: string }
  | { type: 'media-text'; id: string; caption: string; altText: string }
  | { type: 'remove-media'; id: string }
  | { type: 'move-media'; id: string; slot: 'before-note' | 'after-note' }
  | { type: 'reorder-media'; id: string; delta: -1 | 1 }
  | { type: 'gallery'; slot: 'before-note' | 'after-note'; style: z.infer<typeof galleryStyleSchema> };

export function effectiveMediaLimit(settings: Pick<Settings, 'mediaAddSoftLimit'>) {
  return settings.mediaAddSoftLimit.enabled ? settings.mediaAddSoftLimit.max : 32;
}
export function editStep(source: Graph, nodeId: string, edit: StepEdit, settings: Pick<Settings, 'mediaAddSoftLimit'>, newId: () => string): Graph {
  const graph = structuredClone(source); const node = editableStep(nodeAt(graph, nodeId));
  if (edit.type === 'add-outcome' || edit.type === 'remove-outcome' || edit.type === 'arrange') {
    requireEdit(node.kind === 'decision');
    return applyEdit(graph, edit.type === 'add-outcome' ? { type: 'add-item', nodeId } : edit.type === 'remove-outcome' ?
      { type: 'remove-item', nodeId, itemId: edit.id } : { type: 'reorder-item', nodeId, itemId: edit.id, delta: edit.delta }, newId).graph;
  }
  if (edit.type === 'content') {
    const patch = content.parse(edit.patch);
    const allowed = new Set(['phaseId', 'note', ...(node.kind === 'end' ? ['heading', 'message', 'endKind'] : node.kind === 'decision' ?
      ['title', 'question', 'context'] : node.kind === 'alert' ? ['title', 'text', 'additionalText'] : ['title', 'text'])]);
    requireEdit(Object.keys(patch).every((key) => allowed.has(key))); Object.assign(node, patch);
  } else if (edit.type === 'outcome') {
    requireEdit(node.kind === 'decision'); const outcome = node.outcomes.find((item) => item.id === edit.id); requireEdit(outcome);
    outcome.label = edit.label; if (edit.note !== undefined) outcome.note = stepNoteSchema.parse(edit.note);
  } else if (edit.type === 'new-phase') {
    requireEdit(edit.name.trim().length > 0); graph.phases.push({ id: edit.id, name: edit.name, order: graph.phases.length }); node.phaseId = edit.id;
  } else if (edit.type === 'change-type') {
    requireEdit(node.kind !== edit.kind);
    const common = { id: node.id, ...('phaseId' in node ? { phaseId: node.phaseId } : {}), ...(node.note ? { note: node.note } : {}) };
    const title = node.kind === 'end' ? node.heading : node.title ?? '';
    const body = node.kind === 'end' ? node.message : node.kind === 'decision' ? node.context ?? '' : node.text;
    const media = 'media' in node ? { media: node.media, galleries: node.galleries } : { media: [], galleries: {
      beforeNote: { layout: 'stacked-thumbnails', imageSpace: 'compact' }, afterNote: { layout: 'full-width', imageSpace: 'natural' } } };
    const changed = nodeSchema.parse(edit.kind === 'end' ? { ...common, kind: 'end', endKind: 'neutral', heading: title, message: body } :
      edit.kind === 'decision' ? { ...common, ...media, kind: 'decision', title, question: '', context: body, outcomes: [0, 1].map((order) => ({ id: newId(), order, label: '', destination: { kind: 'unassigned' } })) } :
        { ...common, ...media, kind: edit.kind, title, text: body, next: 'next' in node ? node.next : { kind: 'unassigned' } });
    graph.nodes[graph.nodes.findIndex((item) => item.id === node.id)] = changed;
  } else {
    requireEdit('media' in node);
    if (edit.type === 'gallery') node.galleries[edit.slot === 'before-note' ? 'beforeNote' : 'afterNote'] = galleryStyleSchema.parse(edit.style);
    else if (edit.type === 'add-media') {
      requireEdit(node.media.length < Math.min(32, effectiveMediaLimit(settings)), 'limit');
      const item = stepMediaSchema.parse(edit.media); item.order = node.media.filter((other) => other.slot === item.slot).length; node.media.push(item);
    } else {
      const item = node.media.find((item) => item.id === edit.id); requireEdit(item);
      if (edit.type === 'replace-media') { item.source = stepMediaSchema.shape.source.parse(edit.source); if (edit.caption !== undefined) item.caption = edit.caption; if (edit.altText !== undefined) item.altText = edit.altText; }
      else if (edit.type === 'media-text') { item.caption = edit.caption; item.altText = edit.altText; }
      else if (edit.type === 'remove-media') node.media = node.media.filter((other) => other.id !== item.id);
      else if (edit.type === 'move-media') {
        item.order = node.media.filter((other) => other.slot === edit.slot && other.id !== item.id).length; item.slot = edit.slot;
      } else if (edit.type === 'reorder-media') {
        const items = node.media.filter((other) => other.slot === item.slot).sort((a, b) => a.order - b.order); const index = items.indexOf(item);
        const other = items[index + edit.delta]; requireEdit(other); [item.order, other.order] = [other.order, item.order];
      }
      for (const slot of ['before-note', 'after-note'] as const) node.media.filter((item) => item.slot === slot).sort((a, b) => a.order - b.order).forEach((item, order) => { item.order = order; });
    }
  }
  assertEditableGraph(graph); return graph;
}
