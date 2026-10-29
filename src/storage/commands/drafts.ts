import { z } from 'zod';
import { draftRevisionSchema, graphSchema, idSchema, mediaAssetSchema, positiveInteger,
  procedureFieldsSchema, procedureSchema, readyRevisionSchema } from '@domain/model';
import { ConflictError, ImmutableRecordError } from '@domain/model/errors';
import { assertGraphReferences, invariant } from '@domain/model/integrity';
import type { NurseFlowDatabase } from '../db';
import type { CommandEnvironment } from './context';

const createDraftSchema = z.union([z.strictObject({
  metadata: procedureFieldsSchema, graph: graphSchema.optional(), mediaAssets: z.array(mediaAssetSchema).default([]),
}), z.strictObject({ procedureId: idSchema })]);
export type CreateDraftInput = z.input<typeof createDraftSchema>;
const updateDraftSchema = z.strictObject({
  procedureId: idSchema, draftId: idSchema, expectedEditVersion: positiveInteger,
  graph: graphSchema, mediaAssets: z.array(mediaAssetSchema).default([]),
});
export type UpdateDraftInput = z.input<typeof updateDraftSchema>;

export function draftCommands(db: NurseFlowDatabase, environment: CommandEnvironment) {
  return {
    async createDraft(input: CreateDraftInput) {
      const data = createDraftSchema.parse(input);
      const now = environment.now();
      const draftId = environment.newId();
      if ('procedureId' in data) {
        return db.transaction('rw', [db.procedures, db.revisions], async () => {
          const procedure = procedureSchema.parse(await db.procedures.get(data.procedureId));
          if (procedure.workingDraftId !== undefined) {
            const draft = draftRevisionSchema.parse(await db.revisions.get(procedure.workingDraftId));
            invariant(draft.procedureId === procedure.id, 'Draft belongs to another procedure');
            return { procedure, draft };
          }
          invariant(procedure.readyRevisionId !== undefined, 'Procedure has no Ready snapshot to edit');
          const ready = readyRevisionSchema.parse(await db.revisions.get(procedure.readyRevisionId));
          invariant(ready.procedureId === procedure.id, 'Ready belongs to another procedure');
          const draft = draftRevisionSchema.parse({ id: draftId, procedureId: procedure.id, state: 'working-draft',
            revisionNumber: ready.revisionNumber + 1, editVersion: 1, graph: ready.graph,
            createdAt: now, updatedAt: now, validatorSchemaVersion: 0 });
          await db.revisions.add(draft);
          const updated = { ...procedure, workingDraftId: draft.id, updatedAt: now };
          await db.procedures.put(updated);
          return { procedure: updated, draft };
        });
      }
      const procedureId = environment.newId();
      const graph = data.graph ?? { schemaVersion: 1, phases: [], nodes: [
        { id: environment.newId(), kind: 'start', next: { kind: 'unassigned' } },
      ] };
      assertGraphReferences(graph);
      const draft = draftRevisionSchema.parse({
        id: draftId, procedureId, state: 'working-draft', revisionNumber: 1, editVersion: 1,
        graph, createdAt: now, updatedAt: now, validatorSchemaVersion: 0,
      });
      const procedure = procedureSchema.parse({ ...data.metadata, id: procedureId,
        workingDraftId: draftId, createdAt: now, updatedAt: now });
      return db.transaction('rw', [db.procedures, db.groups, db.revisions, db.mediaAssets], async () => {
        if (procedure.groupId !== null) invariant(await db.groups.get(procedure.groupId), 'Unknown group');
        await db.mediaAssets.bulkAdd(data.mediaAssets);
        await db.revisions.add(draft);
        await db.procedures.add(procedure);
        return { procedure, draft };
      });
    },
    async updateDraft(input: UpdateDraftInput) {
      const data = updateDraftSchema.parse(input);
      const now = environment.now();
      assertGraphReferences(data.graph);
      return db.transaction('rw', [db.procedures, db.revisions, db.mediaAssets], async () => {
        const record = await db.revisions.get(data.draftId);
        invariant(record, 'Draft not found');
        if (record.state === 'ready') throw new ImmutableRecordError('Cannot edit a Ready snapshot');
        const draft = draftRevisionSchema.parse(record);
        const procedure = procedureSchema.parse(await db.procedures.get(data.procedureId));
        invariant(draft.procedureId === procedure.id, 'Draft belongs to another procedure');
        if (procedure.workingDraftId !== draft.id || draft.editVersion !== data.expectedEditVersion) {
          throw new ConflictError('Draft changed; reload before saving');
        }
        const updated = draftRevisionSchema.parse({ ...draft, graph: data.graph,
          editVersion: draft.editVersion + 1, updatedAt: now });
        await db.mediaAssets.bulkAdd(data.mediaAssets);
        await db.revisions.put(updated);
        await db.procedures.update(procedure.id, { updatedAt: now });
        return updated;
      });
    },
  };
}
