import { z } from 'zod';
import { positiveInteger, revisionSchema, warningSchema, type Revision } from '@domain/model';
import { invariant } from '@domain/model/integrity';
import type { NurseFlowDatabase } from '../db';

export interface CommandEnvironment {
  newId(): string;
  now(): string;
}
export const defaultEnvironment: CommandEnvironment = {
  newId: () => crypto.randomUUID(), now: () => new Date().toISOString(),
};
const validationSchema = z.strictObject({
  validatorSchemaVersion: positiveInteger, problems: z.array(z.string()), warnings: z.array(warningSchema),
});
export type ReadyValidation = z.infer<typeof validationSchema>;
/** Explicit pure/synchronous adapter for archive staging. Page09 uses checkDraft/markCheckedReady. */
export type ReadyValidator = (revision: Revision, availableAssetIds: ReadonlySet<string>) => ReadyValidation;

export async function validateForReady(db: NurseFlowDatabase, revision: Revision, validate?: ReadyValidator) {
  invariant(typeof validate === 'function', 'Ready validator is required (F08); no default approval');
  const assetIds = new Set(await db.mediaAssets.toCollection().primaryKeys());
  // Pass a detached copy so even an erroneous validator cannot change the commit snapshot.
  const result = validationSchema.parse(validate(revisionSchema.parse(revision), assetIds));
  invariant(result.problems.length === 0, 'Ready validation has blocking problems');
  return result;
}
