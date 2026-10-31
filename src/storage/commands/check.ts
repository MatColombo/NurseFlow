import { draftRevisionSchema, mediaAssetSchema, procedureSchema, readyRevisionSchema } from '@domain/model';
import { ConflictError } from '@domain/model/errors';
import { invariant } from '@domain/model/integrity';
import { inspectRaster } from '@domain/editor/raster';
import { canonical, VALIDATOR_VERSION, validateGraph, type AssetFact, type ValidationResult } from '@domain/validation/validator';
import type { NurseFlowDatabase } from '../db';
import type { CommandEnvironment } from './context';
import { assertDecodable } from '../media-validation';

const envelopeSchema = draftRevisionSchema.omit({ graph: true });
export type CheckedDraft = {
  procedureId: string; title: string; draftId: string; editVersion: number; checkedAt: string;
  token: string; nextReadyVersion: number; previousReadyVersion?: number; result: ValidationResult;
};
async function read(db: NurseFlowDatabase, procedureId: string) {
  return db.transaction('r', [db.procedures, db.revisions, db.mediaAssets], async () => {
    const procedure = procedureSchema.parse(await db.procedures.get(procedureId));
    invariant(!procedure.archived && procedure.workingDraftId, 'No current working Draft');
    const raw = await db.revisions.get(procedure.workingDraftId); const envelope = envelopeSchema.parse(Object.fromEntries(Object.entries(raw ?? {}).filter(([key]) => key !== 'graph')));
    invariant(envelope.procedureId === procedure.id, 'Draft belongs to another procedure');
    const revisions = await db.revisions.where('procedureId').equals(procedure.id).toArray();
    const previous = revisions.find((revision) => revision.id === procedure.readyRevisionId && revision.state === 'ready');
    const next = revisions.reduce((maximum, revision) => revision.state === 'ready' ? Math.max(maximum, revision.revisionNumber) : maximum, 0) + 1;
    const assets = await db.mediaAssets.toArray();
    return { procedure, revision: raw!, envelope, assets, next, previous: previous?.revisionNumber };
  });
}
type Read = Awaited<ReturnType<typeof read>>;
function inventory(snapshot: Read) {
  return canonical({ validator: VALIDATOR_VERSION, revision: snapshot.revision, ready: snapshot.procedure.readyRevisionId, next: snapshot.next,
    assets: snapshot.assets.map(({ blob, ...metadata }) => ({ ...metadata, blobBytes: blob?.size, blobType: blob?.type })).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) });
}
async function inspectAssets(assets: Read['assets']) {
  const facts = new Map<string, AssetFact>(); let storageBytes = 0;
  // Blob reading/hashing is deliberately outside the IndexedDB transaction. Assets are write-once.
  for (const raw of assets) {
    storageBytes += Number.isFinite(raw.bytes) && raw.bytes >= 0 ? raw.bytes : 0;
    try {
      const asset = mediaAssetSchema.parse(raw); const bytes = new Uint8Array(await asset.blob.arrayBuffer());
      const info = inspectRaster(bytes);
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((part) => part.toString(16).padStart(2, '0')).join('');
      invariant(info.mime === asset.mime && info.width === asset.width && info.height === asset.height && digest === asset.sha256, 'Unreadable image');
      await assertDecodable(asset.blob);
      facts.set(asset.id, { status: 'available', bytes: asset.bytes, mime: asset.mime });
    } catch { facts.set(raw.id, { status: 'unreadable', bytes: raw.bytes }); }
  }
  return { assets: facts, storageBytes };
}

export function checkCommands(db: NurseFlowDatabase, environment: CommandEnvironment) {
  return {
    async checkDraft(procedureId: string): Promise<CheckedDraft> {
      const snapshot = await read(db, procedureId); const facts = await inspectAssets(snapshot.assets);
      const token = inventory(snapshot);
      if (inventory(await read(db, procedureId)) !== token) throw new ConflictError('Draft changed during checking; check again');
      return { procedureId, title: snapshot.procedure.title, draftId: snapshot.envelope.id, editVersion: snapshot.envelope.editVersion,
        checkedAt: environment.now(), token, nextReadyVersion: snapshot.next,
        ...(snapshot.previous ? { previousReadyVersion: snapshot.previous } : {}), result: validateGraph(snapshot.revision.graph, facts) };
    },
    async markCheckedReady(checked: CheckedDraft, confirmedForPersonalUse: boolean) {
      invariant(confirmedForPersonalUse === true, 'Personal review is required');
      const readyId = environment.newId(); const now = environment.now();
      const preflight = await read(db, checked.procedureId);
      if (inventory(preflight) !== checked.token) throw new ConflictError('Validation is stale; check the current Draft again');
      const facts = await inspectAssets(preflight.assets);
      return db.transaction('rw', [db.procedures, db.revisions, db.mediaAssets], async () => {
        const current = await read(db, checked.procedureId);
        if (inventory(current) !== checked.token || checked.draftId !== current.envelope.id || checked.editVersion !== current.envelope.editVersion) throw new ConflictError('Validation is stale; check the current Draft again');
        const result = validateGraph(current.revision.graph, facts);
        invariant(result.problems.length === 0, 'Ready validation has blocking problems');
        // Never trust a UI-supplied validation result. Reread, validate and insert the exact durable graph.
        const draft = draftRevisionSchema.parse(current.revision);
        const ready = readyRevisionSchema.parse({ ...draft, id: readyId, state: 'ready', revisionNumber: current.next,
          createdAt: now, updatedAt: now, confirmedForPersonalUseAt: now, validatorSchemaVersion: result.validatorSchemaVersion,
          warningsAtConfirmation: result.warnings.map((issue) => ({ rule: issue.code, locationId: issue.id })) });
        await db.revisions.add(ready);
        await db.procedures.update(current.procedure.id, { readyRevisionId: ready.id, updatedAt: now });
        return ready;
      });
    },
  };
}
