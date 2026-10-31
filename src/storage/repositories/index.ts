import { z } from 'zod';
import { liveQuery, type Table } from 'dexie';
import { groupSchema, mediaAssetSchema, procedureSchema, revisionSchema, runSessionSchema,
  settingsSchema, uiPreferencesSchema } from '@domain/model';
import type { NurseFlowDatabase } from '../db';
import { assertRevisionOwner } from '@domain/procedures';
import { assertRunReferences, invariant } from '@domain/model/integrity';
import { builderRepository } from './builder';
import { canonical } from '@domain/validation/validator';
import { resumeRun, unwrap, viewRun } from '@domain/runtime';
import { previewSessionSchema } from '@domain/runtime/preview';

function reader<T extends { id: string }>(table: Table<T, string>, schema: z.ZodType<T>) {
  return {
    async get(id: string): Promise<T | undefined> {
      const record = await table.get(id);
      return record === undefined ? undefined : schema.parse(record);
    },
    async list(): Promise<T[]> { return z.array(schema).parse(await table.toArray()); },
  };
}

// Detached, schema-checked values only: no Table, Dexie or generic write capability.
export function createRepositories(db: NurseFlowDatabase) {
  return {
    runtime: {
      async get(id: string) {
        return db.transaction('r', [db.procedures, db.revisions, db.runSessions], async () => {
          const stored = runSessionSchema.parse(await db.runSessions.get(id)); const revision = revisionSchema.parse(await db.revisions.get(stored.pinnedRevisionId));
          const procedure = procedureSchema.parse(await db.procedures.get(stored.procedureId));
          const run = unwrap(resumeRun(stored, revision)); return { run, revision, view: viewRun(run, revision), title: procedure.title, preview: false, archived: procedure.archived === true };
        });
      },
    },
    preview: {
      async get(id: string) {
        return db.transaction('r', [db.procedures, db.previewSessions], async () => {
          const session = previewSessionSchema.parse(await db.previewSessions.get(id));
          const procedure = procedureSchema.parse(await db.procedures.get(session.procedureId));
          const run = unwrap(resumeRun(session.run, session.snapshot, 'draft-preview'));
          return { run, revision: session.snapshot, view: viewRun(run, session.snapshot, 'draft-preview'), title: procedure.title, preview: true, archived: procedure.archived === true };
        });
      },
    },
    check: {
      subscribe(id: string, changed: () => void, failed: () => void) {
        let previous: string | undefined;
        return liveQuery(() => db.transaction('r', [db.procedures, db.revisions, db.mediaAssets], async () => {
          const procedure = await db.procedures.get(id);
          const revision = procedure?.workingDraftId ? await db.revisions.get(procedure.workingDraftId) : undefined;
          const assets = (await db.mediaAssets.toArray()).map(({ blob, ...asset }) => ({ ...asset, size: blob?.size, type: blob?.type }));
          return canonical({ revision, ready: procedure?.readyRevisionId, assets });
        })).subscribe({ next(value) { if (previous !== undefined && previous !== value) changed(); previous = value; }, error: failed });
      },
    },
    builder: builderRepository(db),
    procedureDetails: {
      async get(id: string) {
        return db.transaction('r', [db.procedures, db.groups, db.revisions, db.runSessions], async () => {
          const procedure = procedureSchema.parse(await db.procedures.get(id));
          const ready = procedure.readyRevisionId ? assertRevisionOwner(procedure, await db.revisions.get(procedure.readyRevisionId), 'ready') : undefined;
          const draft = procedure.workingDraftId ? assertRevisionOwner(procedure, await db.revisions.get(procedure.workingDraftId), 'working-draft') : undefined;
          invariant(ready || draft, 'Procedure has no readable revision');
          const groups = z.array(groupSchema).parse(await db.groups.toArray()).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
          const procedures = z.array(procedureSchema).parse(await db.procedures.toArray());
          const runs = z.array(runSessionSchema).parse(await db.runSessions.where('procedureId').equals(id).toArray());
          const resume = runs.filter((run) => run.pinnedRevisionId === ready?.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
          if (resume && ready) assertRunReferences(resume, ready);
          return { procedure, ready, draft, groups, tags: procedures.flatMap((item) => item.tags), resume };
        });
      },
    },
    library: {
      async getSnapshot(includeSteps?: boolean) {
        return db.transaction('r', [db.procedures, db.groups, db.uiPreferences, db.revisions], async () => {
          const view = uiPreferencesSchema.parse(await db.uiPreferences.get('main'));
          const readSteps = includeSteps ?? view.filters?.['includeSteps'] === true;
          const [procedures, groups, revisions] = await Promise.all([
            db.procedures.toArray(), db.groups.toArray(),
            readSteps ? db.revisions.toArray() : Promise.resolve([]),
          ]);
          return { procedures: z.array(procedureSchema).parse(procedures), groups: z.array(groupSchema).parse(groups),
            view, revisions: z.array(revisionSchema).parse(revisions) };
        });
      },
    },
    procedures: reader(db.procedures, procedureSchema),
    groups: reader(db.groups, groupSchema),
    revisions: {
      ...reader(db.revisions, revisionSchema),
      async forProcedure(id: string) {
        return z.array(revisionSchema).parse(await db.revisions.where('procedureId').equals(id).toArray());
      },
    },
    mediaAssets: reader(db.mediaAssets, mediaAssetSchema),
    runSessions: reader(db.runSessions, runSessionSchema),
    settings: { async get() { return settingsSchema.parse(await db.settings.get('main')); } },
    uiPreferences: { async get() { return uiPreferencesSchema.parse(await db.uiPreferences.get('main')); } },
  };
}
