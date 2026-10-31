import { z } from 'zod';
import { idSchema, isoDateSchema, positiveInteger, warningSchema } from './common';
import { graphSchema } from './graph';
import { executionRunSchema } from '../runtime/model';

export const procedureFieldsSchema = z.strictObject({
  title: z.string().trim().min(1), description: z.string().optional(), groupId: idSchema.nullable().default(null),
  tags: z.array(z.string()).default([]), aliases: z.array(z.string()).default([]),
  priority: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
  ribbon: z.strictObject({ colorKey: z.string(), iconKey: z.string() }).default({ colorKey: 'neutral', iconKey: 'procedure' }),
  favorite: z.boolean().default(false), archived: z.boolean().optional(),
});
export const procedureSchema = procedureFieldsSchema.extend({
  id: idSchema, createdAt: isoDateSchema, updatedAt: isoDateSchema,
  lastOpenedAt: isoDateSchema.optional(), workingDraftId: idSchema.optional(), readyRevisionId: idSchema.optional(),
});
export const groupSchema = z.strictObject({
  id: idSchema, name: z.string(), order: z.number().int().nonnegative(), createdAt: isoDateSchema,
});
const revisionFields = {
  id: idSchema, procedureId: idSchema, revisionNumber: positiveInteger,
  editVersion: positiveInteger, graph: graphSchema,
  createdAt: isoDateSchema, updatedAt: isoDateSchema, validatorSchemaVersion: z.number().int().nonnegative(),
};
export const draftRevisionSchema = z.strictObject({ ...revisionFields, state: z.literal('working-draft') });
export const readyRevisionSchema = z.strictObject({
  ...revisionFields, state: z.literal('ready'), confirmedForPersonalUseAt: isoDateSchema,
  validatorSchemaVersion: positiveInteger,
  warningsAtConfirmation: z.array(warningSchema),
});
export const revisionSchema = z.discriminatedUnion('state', [draftRevisionSchema, readyRevisionSchema]);
export const settingsSchema = z.strictObject({
  id: z.literal('main').default('main'), locale: z.enum(['it', 'en']).default('it'),
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  uiScalePt: z.number().int().min(4).max(48).default(13),
  mediaAddSoftLimit: z.strictObject({ enabled: z.boolean(), max: z.number().int().min(1).max(32) })
    .default({ enabled: true, max: 2 }),
  photoPreset: z.enum(['small', 'medium', 'high', 'original']).default('medium'),
});
export const uiPreferencesSchema = z.strictObject({
  builderMode: z.enum(['outline', 'graph']).default('outline'),
  id: z.literal('main').default('main'), sortMode: z.enum(['groups', 'priority', 'recent', 'az']).default('groups'),
  collapsedGroupIds: z.array(idSchema).default([]), searchText: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(), recentProcedureIds: z.array(idSchema).max(20).default([]),
  firstLaunchComplete: z.boolean().default(false), initialLocaleSet: z.boolean().default(false),
  recentCollapsed: z.boolean().default(false), scrollTop: z.number().nonnegative().default(0),
  persistenceStatus: z.enum(['not-requested', 'granted', 'denied', 'unsupported', 'error']).default('not-requested'),
});
export const legacyRunSessionSchema = z.strictObject({
  id: idSchema, procedureId: idSchema, pinnedRevisionId: idSchema,
  saveVersion: positiveInteger, status: z.enum(['active', 'ended', 'interrupted']), currentNodeId: idSchema,
  visited: z.array(z.strictObject({ nodeId: idSchema, outcomeId: idSchema.optional(), previousActivityId: idSchema.optional() })),
  multitaskProgress: z.record(idSchema, z.strictObject({
    completedActivityIds: z.array(idSchema), cursorByActivityId: z.record(idSchema, idSchema),
    pathByActivityId: z.record(idSchema, z.array(idSchema)),
  })),
  terminalEndNodeId: idSchema.optional(), startedAt: isoDateSchema, updatedAt: isoDateSchema,
});
// Existing F01–F08 records remain readable; only explicit Resume may safely upgrade them.
export const runSessionSchema = z.union([executionRunSchema, legacyRunSessionSchema]);

export type Procedure = z.infer<typeof procedureSchema>;
export type ProcedureMeta = Procedure;
export type Group = z.infer<typeof groupSchema>;
export type DraftRevision = z.infer<typeof draftRevisionSchema>;
export type ReadyRevision = z.infer<typeof readyRevisionSchema>;
export type Revision = z.infer<typeof revisionSchema>;
export type RevisionRecord = Revision;
export type Settings = z.infer<typeof settingsSchema>;
export type AppSettings = Settings;
export type LibraryViewState = z.infer<typeof uiPreferencesSchema>;
export type LegacyRunSession = z.infer<typeof legacyRunSessionSchema>;
export type RunSession = z.infer<typeof runSessionSchema>;
export type Priority = Procedure['priority'];
export type UiLocale = Settings['locale'];
export type RevisionState = Revision['state'];
export type RunStatus = RunSession['status'];
