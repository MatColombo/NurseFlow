import { z } from 'zod';

export const idSchema = z.string().min(1);
export const isoDateSchema = z.iso.datetime();
export const positiveInteger = z.number().int().positive();
export const endKindSchema = z.enum(['completed', 'stopped', 'escalation', 'neutral']);
export type ID = z.infer<typeof idSchema>;
export type ISODate = z.infer<typeof isoDateSchema>;
export type EndKind = z.infer<typeof endKindSchema>;

export const warningSchema = z.strictObject({
  rule: z.enum(['W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08']),
  locationId: idSchema.optional(),
});
export type Warning = z.infer<typeof warningSchema>;
