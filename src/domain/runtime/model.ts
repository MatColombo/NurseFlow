import { z } from 'zod';
import { idSchema, isoDateSchema, positiveInteger } from '../model/common';

export const ROOT_TOKEN = '$root';
export function activityTokenId(groupVisitId: number, activityId: string) { return JSON.stringify([groupVisitId, activityId]); }
export const runEdgeSchema = z.strictObject({ nodeId: idSchema, slot: z.enum(['next', 'outcome', 'activity', 'afterAll']), itemId: idSchema.optional() });
export const runEventSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('continue') }),
  z.strictObject({ type: z.literal('choose-outcome'), outcomeId: idSchema }),
  z.strictObject({ type: z.literal('switch-activity'), activityId: idSchema, groupVisitId: positiveInteger.optional() }),
  z.strictObject({ type: z.literal('finish-activity') }),
  z.strictObject({ type: z.literal('after-all'), groupVisitId: positiveInteger }),
  z.strictObject({ type: z.literal('back') }),
  z.strictObject({ type: z.literal('reopen-activity'), groupVisitId: positiveInteger, activityId: idSchema, confirmed: z.boolean() }),
  z.strictObject({ type: z.literal('restart'), confirmed: z.boolean() }),
  z.strictObject({ type: z.literal('exit'), confirmed: z.boolean() }),
]);
export type RunEvent = z.infer<typeof runEventSchema>;
const visitSchema = z.strictObject({ id: positiveInteger, nodeId: idSchema, tokenId: idSchema,
  outcomeId: idSchema.optional(), fromVisitId: positiveInteger.optional() });
const tokenSchema = z.strictObject({ id: idSchema, groupVisitId: positiveInteger.optional(), activityId: idSchema.optional(),
  path: z.array(positiveInteger), cursor: z.number().int().min(-1), completed: z.boolean() });
const groupSchema = z.strictObject({ visitId: positiveInteger, focusedActivityId: idSchema, released: z.boolean() });
const journalSchema = z.strictObject({ sequence: positiveInteger,
  kind: z.enum(['start', 'enter', 'choose', 'continue', 'finish', 'switch', 'after-all', 'back', 'reopen', 'interrupt']),
  tokenId: idSchema, visitId: positiveInteger.optional() });
export const executionRunSchema = z.strictObject({
  runtimeVersion: z.literal(1), id: idSchema, procedureId: idSchema, pinnedRevisionId: idSchema, saveVersion: positiveInteger,
  status: z.enum(['active', 'ended', 'interrupted']), currentNodeId: idSchema, terminalEndNodeId: idSchema.optional(),
  focusTokenId: idSchema, nextVisitId: positiveInteger, nextSequence: positiveInteger,
  visits: z.array(visitSchema), tokens: z.array(tokenSchema), groups: z.array(groupSchema), journal: z.array(journalSchema),
  interruption: z.strictObject({ code: z.literal('W08'), edge: runEdgeSchema, formerNodeId: idSchema, formerTitle: z.string().optional() }).optional(),
  startedAt: isoDateSchema, updatedAt: isoDateSchema,
});
export type ExecutionRun = z.infer<typeof executionRunSchema>;
export type RunVisit = z.infer<typeof visitSchema>;
export type RunToken = z.infer<typeof tokenSchema>;
export type RunGroup = z.infer<typeof groupSchema>;
export type RunEdge = z.infer<typeof runEdgeSchema>;
export type RuntimeErrorCode = 'invalid-revision' | 'invalid-session' | 'invalid-event' | 'first-step' | 'confirmation-required' | 'legacy-session';
export class RuntimeError extends Error {
  override name = 'RuntimeError';
  constructor(public readonly code: RuntimeErrorCode) { super(code); }
}
export type RuntimeResult<T> = { ok: true; value: T } | { ok: false; error: { code: RuntimeErrorCode } };
export function requireRun(condition: unknown, code: RuntimeErrorCode = 'invalid-event'): asserts condition { if (!condition) throw new RuntimeError(code); }
export function result<T>(operation: () => T, fallback: RuntimeErrorCode = 'invalid-session'): RuntimeResult<T> {
  try { return { ok: true, value: operation() }; } catch (error) { return { ok: false, error: { code: error instanceof RuntimeError ? error.code : fallback } }; }
}
export function unwrap<T>(value: RuntimeResult<T>): T { if (!value.ok) throw new RuntimeError(value.error.code); return value.value; }
export function isExecutionRun(value: { runtimeVersion?: unknown }): value is ExecutionRun { return value.runtimeVersion === 1; }
