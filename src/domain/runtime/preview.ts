import { z } from 'zod';
import { idSchema, draftRevisionSchema } from '../model';
import { executionRunSchema } from './model';
export const previewSessionSchema = z.strictObject({ id: idSchema, procedureId: idSchema, mode: z.literal('draft-preview'), snapshot: draftRevisionSchema, run: executionRunSchema })
  .refine((session) => session.id === session.snapshot.id && session.run.pinnedRevisionId === session.snapshot.id &&
    session.procedureId === session.snapshot.procedureId && session.run.procedureId === session.procedureId, 'Preview must pin its own Draft snapshot');
export type PreviewSession = z.infer<typeof previewSessionSchema>;
