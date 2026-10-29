import { z } from 'zod';
import { draftRevisionSchema, idSchema, positiveInteger, procedureSchema, readyRevisionSchema } from '@domain/model';
import { ConflictError } from '@domain/model/errors';
import { assertGraphReferences, invariant } from '@domain/model/integrity';
import type { NurseFlowDatabase } from '../db';
import { validateForReady, type CommandEnvironment, type ReadyValidator } from './context';

const markReadySchema = z.strictObject({
  procedureId: idSchema, draftId: idSchema, expectedEditVersion: positiveInteger,
  confirmedForPersonalUse: z.literal(true),
});
export type MarkReadyInput = z.infer<typeof markReadySchema>;

export function readyCommands(db: NurseFlowDatabase, environment: CommandEnvironment) {
  return {
    async markReadyUnitOfWork(input: MarkReadyInput, validate: ReadyValidator) {
      const data = markReadySchema.parse(input);
      const readyId = environment.newId();
      const now = environment.now();
      return db.transaction('rw', [db.procedures, db.revisions, db.mediaAssets], async () => {
        const procedure = procedureSchema.parse(await db.procedures.get(data.procedureId));
        const draft = draftRevisionSchema.parse(await db.revisions.get(data.draftId));
        invariant(draft.procedureId === procedure.id, 'Draft belongs to another procedure');
        if (procedure.workingDraftId !== draft.id || draft.editVersion !== data.expectedEditVersion) {
          throw new ConflictError('Validation is stale; check the current Draft again');
        }
        assertGraphReferences(draft.graph);
        const result = await validateForReady(db, draft, validate);
        const revisions = await db.revisions.where('procedureId').equals(procedure.id).toArray();
        const revisionNumber = revisions.reduce((maximum, item) => item.state === 'ready' ?
          Math.max(maximum, item.revisionNumber) : maximum, 0) + 1;
        const ready = readyRevisionSchema.parse({ ...draft, id: readyId, state: 'ready', revisionNumber,
          createdAt: now, updatedAt: now, confirmedForPersonalUseAt: now,
          validatorSchemaVersion: result.validatorSchemaVersion, warningsAtConfirmation: result.warnings });
        await db.revisions.add(ready);
        await db.procedures.update(procedure.id, { readyRevisionId: ready.id, updatedAt: now });
        // Keep the independent working Draft, including on repeated/new Ready commits.
        return ready;
      });
    },
  };
}
