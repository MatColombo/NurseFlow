import { procedureSchema, revisionSchema, uiPreferencesSchema } from '@domain/model';
import { builderStateSchema, builderViewSchema, requireEdit } from '@domain/builder/model';
import { assertEditableGraph } from '@domain/builder/structure';
import type { NurseFlowDatabase } from '../db';

export function builderRepository(db: NurseFlowDatabase) {
  return {
    async get(id: string, requestedRevisionId?: string) {
      return db.transaction('r', [db.procedures, db.revisions, db.builderStates, db.uiPreferences], async () => {
        const procedure = procedureSchema.parse(await db.procedures.get(id));
        const revision = revisionSchema.parse(await db.revisions.get(requestedRevisionId ?? procedure.workingDraftId ?? procedure.readyRevisionId ?? ''));
        requireEdit(!procedure.archived && revision.procedureId === procedure.id &&
          (revision.state === 'working-draft' ? procedure.workingDraftId === revision.id : procedure.readyRevisionId === revision.id && !procedure.workingDraftId), 'stale');
        assertEditableGraph(revision.graph);
        const raw = await db.builderStates.get(id); const stored = raw ? builderStateSchema.parse(raw) : undefined;
        const history = stored?.revisionId === revision.id && stored.editVersion === revision.editVersion ? stored :
          { id, revisionId: revision.id, editVersion: revision.editVersion, past: [], future: [], view: stored?.view ?? builderViewSchema.parse({}) };
        return { procedure, revision, history, editorMode: uiPreferencesSchema.parse(await db.uiPreferences.get('main')).builderMode };
      });
    },
  };
}
