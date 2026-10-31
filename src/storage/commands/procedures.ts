import { draftRevisionSchema, procedureSchema, revisionSchema, runSessionSchema } from '@domain/model';
import { assertRevisionOwner, cloneProcedureGraph, metadataOf, parseMetadata, type ProcedureMetadata } from '@domain/procedures';
import { invariant } from '@domain/model/integrity';
import { createRun, restoreRun, unwrap } from '@domain/runtime';
import type { NurseFlowDatabase } from '../db';
import { authorizeProcedureRemoval } from '../procedure-removal';
import type { CommandEnvironment } from './context';

export function procedureCommands(db: NurseFlowDatabase, environment: CommandEnvironment) {
  return {
    async updateProcedureMetadata(id: string, input: ProcedureMetadata) {
      const metadata = parseMetadata(input); const now = environment.now();
      return db.transaction('rw', [db.procedures, db.groups], async () => {
        const current = procedureSchema.parse(await db.procedures.get(id));
        if (metadata.groupId) invariant(await db.groups.get(metadata.groupId), 'Group unavailable');
        const next = procedureSchema.parse({ ...current, ...metadata, updatedAt: now });
        await db.procedures.put(next); return next;
      });
    },
    async setArchived(id: string, archived: boolean) {
      await db.transaction('rw', [db.procedures, db.uiPreferences], async () => {
        const current = procedureSchema.parse(await db.procedures.get(id));
        await db.procedures.put(procedureSchema.parse({ ...current, archived }));
        if (archived) {
          const view = await db.uiPreferences.get('main');
          if (view) await db.uiPreferences.put({ ...view, recentProcedureIds: view.recentProcedureIds.filter((value) => value !== id) });
        }
      });
    },
    async duplicateProcedure(id: string, copySuffix: string) {
      // Prepare identifiers outside transactions. Re-read the snapshot in the write transaction.
      const source = await db.transaction('r', [db.procedures, db.revisions], async () => {
        const procedure = procedureSchema.parse(await db.procedures.get(id));
        const revision = revisionSchema.parse(await db.revisions.get(procedure.workingDraftId ?? procedure.readyRevisionId ?? ''));
        invariant(revision.procedureId === id, 'Revision belongs to another procedure');
        return { procedure, revision };
      });
      const now = environment.now(); const draftId = environment.newId(); const procedureId = environment.newId();
      const procedure = procedureSchema.parse({ ...metadataOf(source.procedure), id: procedureId, workingDraftId: draftId,
        title: `${source.procedure.title} ${copySuffix}`, createdAt: now, updatedAt: now });
      const draft = draftRevisionSchema.parse({ id: draftId, procedureId, state: 'working-draft', revisionNumber: 1,
        editVersion: 1, graph: cloneProcedureGraph(source.revision.graph, environment.newId), createdAt: now, updatedAt: now, validatorSchemaVersion: 0 });
      return db.transaction('rw', [db.procedures, db.groups, db.revisions], async () => {
        const current = await db.procedures.get(id); const revision = await db.revisions.get(source.revision.id);
        invariant(JSON.stringify(current) === JSON.stringify(source.procedure) && JSON.stringify(revision) === JSON.stringify(source.revision), 'Procedure changed; retry copy');
        if (procedure.groupId) invariant(await db.groups.get(procedure.groupId), 'Group unavailable');
        await db.revisions.add(draft); await db.procedures.add(procedure); return procedure;
      });
    },
    async startOrResumeReady(id: string, expectedRevisionId: string) {
      const runId = environment.newId(); const now = environment.now();
      return db.transaction('rw', [db.procedures, db.revisions, db.runSessions], async () => {
        const procedure = procedureSchema.parse(await db.procedures.get(id));
        invariant(!procedure.archived && procedure.readyRevisionId === expectedRevisionId, 'Ready changed; reopen Details');
        const revision = assertRevisionOwner(procedure, await db.revisions.get(expectedRevisionId), 'ready');
        const existing = (await db.runSessions.where('procedureId').equals(id).toArray())
          .filter((run) => run.pinnedRevisionId === revision.id)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
        if (existing) {
          const stored = runSessionSchema.parse(existing); const run = unwrap(restoreRun(stored, revision, now));
          if (!('runtimeVersion' in stored)) await db.runSessions.put(run); return run;
        }
        const run = unwrap(createRun(revision, runId, now)); await db.runSessions.add(run); return run;
      });
    },
    async deleteProcedure(id: string) {
      await db.transaction('rw', [db.procedures, db.revisions, db.runSessions, db.uiPreferences, db.builderStates], async (transaction) => {
        invariant(await db.procedures.get(id), 'Procedure unavailable');
        invariant(await db.runSessions.where('procedureId').equals(id).count() === 0, 'Procedure has saved sessions');
        authorizeProcedureRemoval(transaction, id);
        await db.revisions.where('procedureId').equals(id).delete(); await db.procedures.delete(id);
        await db.builderStates.delete(id);
        const view = await db.uiPreferences.get('main');
        if (view) await db.uiPreferences.put({ ...view, recentProcedureIds: view.recentProcedureIds.filter((value) => value !== id) });
      });
    },
  };
}
