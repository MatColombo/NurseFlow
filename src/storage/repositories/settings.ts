import type { NurseFlowDatabase } from '../db';
import { canonical } from '@domain/validation/validator';
/** Called inside one transaction, including when rechecking a destructive confirmation. */
export async function localInventory(db: NurseFlowDatabase) {
  const [procedures, groups, revisions, media, runs, previews, settings, view, builder] = await Promise.all([
    db.procedures.toArray(), db.groups.toArray(), db.revisions.toArray(), db.mediaAssets.toCollection().primaryKeys(),
    db.runSessions.toArray(), db.previewSessions.toArray(), db.settings.toArray(), db.uiPreferences.toArray(), db.builderStates.toArray(),
  ]);
  const token = canonical({ procedures, groups, revisions: revisions.map((revision) => ({ id: revision.id, state: revision.state, editVersion: revision.editVersion, updatedAt: revision.updatedAt })), media, runs,
    previews: previews.map((preview) => ({ id: preview.id, run: preview.run })), settings, view, builder: builder.map((state) => ({ id: state.id, editVersion: state.editVersion, view: state.view })) });
  return { token, procedures: procedures.length, groups: groups.length, revisions: revisions.length, media: media.length, runs: runs.length + previews.length };
}
