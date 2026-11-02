import { z } from 'zod';
import { assetReferences, importedRecordsSchema, prepareImportedRecords, type ImportedRecords } from '@domain/portability/records';
import { settingsSchema } from '@domain/model';
import { assertSettingsUnchanged } from '@domain/portability/settings';
import { invariant } from '@domain/model/integrity';
import type { NurseFlowDatabase } from '../db';
import { validateForReady, type CommandEnvironment, type ReadyValidator } from './context';

async function insertBatches(db: NurseFlowDatabase, batches: ImportedRecords[], validateReady?: ReadyValidator) {
  for (const records of batches) {
    const assetIds = [...new Set(records.revisions.flatMap((revision) => assetReferences(revision.graph)))];
    invariant((await db.mediaAssets.bulkGet(assetIds)).every((asset) => asset === undefined), 'Imported asset identity collides with local data');
    await db.groups.bulkAdd(records.groups); await db.mediaAssets.bulkAdd(records.mediaAssets);
    for (const revision of records.revisions) if (revision.state === 'ready') await validateForReady(db, revision, validateReady);
    await db.revisions.bulkAdd(records.revisions); await db.procedures.bulkAdd(records.procedures); await db.runSessions.bulkAdd(records.runSessions);
  }
  return { procedureIds: batches.flatMap((batch) => batch.procedures.map((record) => record.id)), runIds: batches.flatMap((batch) => batch.runSessions.map((record) => record.id)) };
}
const appImportSchema = z.strictObject({ kind: z.enum(['settings', 'full']), records: importedRecordsSchema, confirmed: z.literal(true),
  replacement: z.strictObject({ value: settingsSchema, expectedToken: z.string().min(1), confirmed: z.literal(true) }).optional() });

export function importCommands(db: NurseFlowDatabase, environment: CommandEnvironment) {
  return {
    async addImportedRecords(input: unknown, validateReady?: ReadyValidator) {
      // Parsing, remapping, UUIDs and any upstream file/crypto work happen before tx.
      const batches = prepareImportedRecords(input, environment.newId);
      return db.transaction('rw', [db.groups, db.procedures, db.revisions, db.mediaAssets, db.runSessions], () => insertBatches(db, batches, validateReady));
    },
    async importAppPackage(input: unknown, validateReady?: ReadyValidator) {
      const plan = appImportSchema.parse(input);
      invariant(plan.kind !== 'settings' || plan.replacement && Object.values(plan.records).every((items) => items.length === 0), 'Settings scope requires separate replacement consent and no library data');
      const batches = prepareImportedRecords([plan.records], environment.newId, true);
      return db.transaction('rw', [db.groups, db.procedures, db.revisions, db.mediaAssets, db.runSessions, db.settings], async () => {
        if (plan.replacement) assertSettingsUnchanged(settingsSchema.parse(await db.settings.get('main')), plan.replacement.expectedToken);
        const saved = await insertBatches(db, batches, validateReady);
        // A failing final Settings write rolls back every preceding library/run addition.
        if (plan.replacement) await db.settings.put(plan.replacement.value);
        return { ...saved, settings: plan.replacement?.value ?? null };
      });
    },
  };
}
