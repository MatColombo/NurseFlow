import { z } from 'zod';
import { draftRevisionSchema, graphSchema, idSchema, mediaAssetSchema, positiveInteger, procedureSchema, revisionSchema, settingsSchema, uiPreferencesSchema } from '@domain/model';
import { builderStateSchema, builderViewSchema, requireEdit, type BuilderState } from '@domain/builder/model';
import { assertEditableGraph } from '@domain/builder/structure';
import { ConflictError } from '@domain/model/errors';
import type { NurseFlowDatabase } from '../db';
import type { CommandEnvironment } from './context';

const baseInput = z.strictObject({
  procedureId: idSchema, sourceRevisionId: idSchema, expectedEditVersion: positiveInteger,
});
const commitInput = baseInput.extend({
  expectedGraph: graphSchema, graph: graphSchema, label: z.string(), view: builderViewSchema,
  mediaAssets: z.array(mediaAssetSchema).default([]), mediaAdditionFor: idSchema.optional(),
});
export type CommitBuilderInput = z.input<typeof commitInput>;
function historyFor(raw: unknown, id: string, revisionId: string, editVersion: number): BuilderState {
  const parsed = raw === undefined ? undefined : builderStateSchema.parse(raw);
  if (parsed?.revisionId === revisionId && parsed.editVersion === editVersion) return parsed;
  return { id, revisionId, editVersion, past: [], future: [], view: parsed?.view ?? builderViewSchema.parse({}) };
}
export function builderCommands(db: NurseFlowDatabase, environment: CommandEnvironment) {
  return {
    async setBuilderMode(mode: 'outline' | 'graph') {
      const value = z.enum(['outline', 'graph']).parse(mode);
      await db.transaction('rw', db.uiPreferences, async () => {
        const current = uiPreferencesSchema.parse(await db.uiPreferences.get('main'));
        await db.uiPreferences.put({ ...current, builderMode: value });
      });
    },
    async commitBuilderEdit(input: CommitBuilderInput) {
      const data = commitInput.parse(input); assertEditableGraph(data.graph);
      const now = environment.now(); const draftId = environment.newId();
      return db.transaction('rw', [db.procedures, db.revisions, db.builderStates, db.mediaAssets, db.settings], async () => {
        const procedure = procedureSchema.parse(await db.procedures.get(data.procedureId));
        const source = revisionSchema.parse(await db.revisions.get(data.sourceRevisionId));
        requireEdit(!procedure.archived && source.procedureId === procedure.id);
        if (source.editVersion !== data.expectedEditVersion || JSON.stringify(source.graph) !== JSON.stringify(data.expectedGraph) ||
          (source.state === 'working-draft' ? procedure.workingDraftId !== source.id :
            procedure.readyRevisionId !== source.id || procedure.workingDraftId !== undefined)) throw new ConflictError('Draft changed; reload before saving');
        requireEdit(JSON.stringify(source.graph) !== JSON.stringify(data.graph));
        if (data.mediaAdditionFor) {
          const node = data.graph.nodes.find((node) => node.id === data.mediaAdditionFor); const settings = settingsSchema.parse(await db.settings.get('main'));
          requireEdit(node && 'media' in node && node.media.length <= (settings.mediaAddSoftLimit.enabled ? settings.mediaAddSoftLimit.max : 32), 'limit');
        }
        for (const asset of data.mediaAssets) requireEdit(data.graph.nodes.some((node) => 'media' in node && node.media.some((item) => item.source.kind === 'local' && item.source.assetId === asset.id && item.source.mime === asset.mime)));
        const history = historyFor(await db.builderStates.get(procedure.id), procedure.id, source.id, source.editVersion);
        const draft = draftRevisionSchema.parse({ id: source.state === 'ready' ? draftId : source.id, procedureId: source.procedureId,
          state: 'working-draft', revisionNumber: source.revisionNumber + (source.state === 'ready' ? 1 : 0),
          editVersion: source.state === 'ready' ? 1 : source.editVersion + 1, graph: data.graph,
          createdAt: source.state === 'ready' ? now : source.createdAt, updatedAt: now, validatorSchemaVersion: 0,
        });
        const saved = draft;
        await db.mediaAssets.bulkAdd(data.mediaAssets);
        if (source.state === 'ready') await db.revisions.add(saved); else await db.revisions.put(saved);
        await db.builderStates.put(builderStateSchema.parse({ id: procedure.id, revisionId: saved.id, editVersion: saved.editVersion,
          past: [...history.past, { graph: source.graph, label: data.label }].slice(-30), future: [], view: data.view }));
        await db.procedures.put({ ...procedure, workingDraftId: saved.id, updatedAt: now }); return saved;
      });
    },
    async travelBuilderHistory(input: z.input<typeof baseInput> & { direction: 'undo' | 'redo' }) {
      const data = baseInput.extend({ direction: z.enum(['undo', 'redo']) }).parse(input); const now = environment.now();
      return db.transaction('rw', [db.procedures, db.revisions, db.builderStates], async () => {
        const procedure = procedureSchema.parse(await db.procedures.get(data.procedureId));
        const draft = draftRevisionSchema.parse(await db.revisions.get(data.sourceRevisionId));
        if (procedure.archived || procedure.workingDraftId !== draft.id || draft.procedureId !== procedure.id ||
          draft.editVersion !== data.expectedEditVersion) throw new ConflictError('Draft changed; reload before history');
        const history = historyFor(await db.builderStates.get(procedure.id), procedure.id, draft.id, draft.editVersion);
        const from = data.direction === 'undo' ? history.past : history.future;
        const to = data.direction === 'undo' ? history.future : history.past;
        const entry = from.pop(); requireEdit(entry); assertEditableGraph(entry.graph);
        to.push({ graph: draft.graph, label: entry.label });
        const saved = { ...draft, graph: entry.graph, editVersion: draft.editVersion + 1, updatedAt: now };
        await db.revisions.put(saved);
        await db.builderStates.put({ ...history, editVersion: saved.editVersion, past: history.past.slice(-30), future: history.future.slice(-30) });
        await db.procedures.put({ ...procedure, updatedAt: now }); return saved;
      });
    },
    async saveBuilderView(input: z.input<typeof baseInput> & { view: z.input<typeof builderViewSchema> }) {
      const data = baseInput.extend({ view: builderViewSchema }).parse(input);
      await db.transaction('rw', [db.procedures, db.revisions, db.builderStates], async () => {
        const procedure = procedureSchema.parse(await db.procedures.get(data.procedureId));
        const revision = revisionSchema.parse(await db.revisions.get(data.sourceRevisionId));
        requireEdit(revision.procedureId === procedure.id);
        if (revision.editVersion !== data.expectedEditVersion ||
          (revision.state === 'working-draft' ? procedure.workingDraftId !== revision.id : procedure.readyRevisionId !== revision.id || procedure.workingDraftId !== undefined)) return;
        const state = historyFor(await db.builderStates.get(procedure.id), procedure.id, revision.id, revision.editVersion);
        await db.builderStates.put({ ...state, view: data.view });
      });
    },
  };
}
