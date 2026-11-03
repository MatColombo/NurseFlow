import { z } from 'zod';
import { endKindSchema, idSchema } from './common';
import { galleryPrefsSchema, stepMediaSchema } from './media';
import { textFormatSchema } from './text';

export const destinationSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('node'), nodeId: idSchema, terminateProcedure: z.literal(true).optional() }),
  z.strictObject({ kind: z.literal('unassigned') }),
  z.strictObject({ kind: z.literal('broken'), formerNodeId: idSchema, formerTitle: z.string().optional() }),
  z.strictObject({ kind: z.literal('activity-complete') }),
]);
export const stepNoteSchema = z.strictObject({
  text: z.string(), visibility: z.enum(['expandable', 'always-visible']),
  format: textFormatSchema.optional(), bulleted: z.boolean().optional(),
});
export const outcomeSchema = z.strictObject({
  id: idSchema, order: z.number().int().nonnegative(), label: z.string(),
  note: stepNoteSchema.optional(), destination: destinationSchema,
});
export const activitySchema = z.strictObject({
  id: idSchema, name: z.string(), order: z.number().int().nonnegative(),
  first: destinationSchema, required: z.literal(true),
});
export const phaseSchema = z.strictObject({
  id: idSchema, name: z.string(), order: z.number().int().nonnegative(),
});
const stepFields = {
  id: idSchema, title: z.string().optional(), phaseId: idSchema.nullable().optional(),
  note: stepNoteSchema.optional(), media: z.array(stepMediaSchema).max(32), galleries: galleryPrefsSchema,
};
export const nodeSchema = z.discriminatedUnion('kind', [
  z.strictObject({ id: idSchema, kind: z.literal('start'), next: destinationSchema }),
  z.strictObject({ ...stepFields, kind: z.literal('instruction'), text: z.string(), textFormat: textFormatSchema.optional(), next: destinationSchema }),
  z.strictObject({ ...stepFields, kind: z.literal('alert'), text: z.string(), textFormat: textFormatSchema.optional(), additionalText: z.string().optional(), next: destinationSchema }),
  z.strictObject({ ...stepFields, kind: z.literal('decision'), question: z.string(), context: z.string().optional(), outcomes: z.array(outcomeSchema) }),
  z.strictObject({
    id: idSchema, kind: z.literal('multitask'), title: z.string(), phaseId: idSchema.nullable().optional(),
    activities: z.array(activitySchema), afterAll: destinationSchema,
  }),
  z.strictObject({
    id: idSchema, kind: z.literal('end'), endKind: endKindSchema.default('neutral'), heading: z.string(), message: z.string(),
    note: stepNoteSchema.optional(), phaseId: idSchema.nullable().optional(),
  }),
]);
export const graphSchema = z.strictObject({
  schemaVersion: z.literal(1), phases: z.array(phaseSchema), nodes: z.array(nodeSchema),
  layout: z.strictObject({
    positions: z.record(idSchema, z.strictObject({ x: z.number().finite(), y: z.number().finite() })),
  }).optional(),
});

export type Destination = z.infer<typeof destinationSchema>;
export type StepNote = z.infer<typeof stepNoteSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;
export type DecisionOutcome = Outcome;
export type Activity = z.infer<typeof activitySchema>;
export type TaskActivity = Activity;
export type Phase = z.infer<typeof phaseSchema>;
export type Node = z.infer<typeof nodeSchema>;
export type Graph = z.infer<typeof graphSchema>;
export type GraphSnapshot = Graph;
