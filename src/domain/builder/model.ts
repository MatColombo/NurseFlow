import { z } from 'zod';
import { graphSchema, idSchema, positiveInteger } from '../model';

export const edgeRefSchema = z.strictObject({
  nodeId: idSchema, slot: z.enum(['next', 'outcome', 'activity', 'afterAll']), itemId: idSchema.optional(),
});
export type EdgeRef = z.infer<typeof edgeRefSchema>;
export const selectionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('node'), nodeId: idSchema }),
  z.strictObject({ kind: z.literal('edge'), edge: edgeRefSchema }),
  z.strictObject({ kind: z.literal('activity'), nodeId: idSchema, activityId: idSchema }),
]);
export type Selection = z.infer<typeof selectionSchema>;
export const canvasViewSchema = z.strictObject({
  initialized: z.boolean().default(false),
  x: z.number().finite().default(0), y: z.number().finite().default(0),
  zoom: z.number().min(0.05).max(3).default(1),
  focusItems: z.record(z.string(), z.string()).default({}),
});
export type CanvasView = z.infer<typeof canvasViewSchema>;
export const builderViewSchema = z.strictObject({
  scrollTop: z.number().nonnegative().default(0), selection: selectionSchema.nullable().default(null),
  canvas: canvasViewSchema.prefault({}),
});
const historyEntrySchema = z.strictObject({ graph: graphSchema, label: z.string() });
export const builderStateSchema = z.strictObject({
  id: idSchema, revisionId: idSchema, editVersion: positiveInteger,
  past: z.array(historyEntrySchema).max(30), future: z.array(historyEntrySchema).max(30),
  view: builderViewSchema,
});
export type BuilderView = z.infer<typeof builderViewSchema>;
export type BuilderState = z.infer<typeof builderStateSchema>;
export class BuilderError extends Error {
  constructor(public readonly code: 'cycle' | 'scope' | 'shared' | 'stale' | 'limit' | 'invalid' | 'clipboard' | 'moveScope') {
    super(code); this.name = 'BuilderError';
  }
}
export function requireEdit(condition: unknown, code: BuilderError['code'] = 'invalid'): asserts condition {
  if (!condition) throw new BuilderError(code);
}
