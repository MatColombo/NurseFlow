import { assetReferences, prepareImportedRecords } from '@domain/portability/records';
import { invariant } from '@domain/model/integrity';
import type { NurseFlowDatabase } from '../db';
import { validateForReady, type CommandEnvironment, type ReadyValidator } from './context';

export function importCommands(db: NurseFlowDatabase, environment: CommandEnvironment) {
  return {
    async addImportedRecords(input: unknown, validateReady?: ReadyValidator) {
      // Parsing, remapping, UUIDs and any upstream file/crypto work happen before tx.
      const batches = prepareImportedRecords(input, environment.newId);
      return db.transaction('rw', [db.groups, db.procedures, db.revisions, db.mediaAssets, db.runSessions], async () => {
        for (const records of batches) {
          const assetIds = [...new Set(records.revisions.flatMap((revision) => assetReferences(revision.graph)))];
          invariant((await db.mediaAssets.bulkGet(assetIds)).every((asset) => asset === undefined),
            'Imported asset identity collides with local data');
          await db.groups.bulkAdd(records.groups);
          await db.mediaAssets.bulkAdd(records.mediaAssets);
          for (const revision of records.revisions) {
            if (revision.state === 'ready') await validateForReady(db, revision, validateReady);
          }
          await db.revisions.bulkAdd(records.revisions);
          await db.procedures.bulkAdd(records.procedures);
          await db.runSessions.bulkAdd(records.runSessions);
        }
        return {
          procedureIds: batches.flatMap((batch) => batch.procedures.map((record) => record.id)),
          runIds: batches.flatMap((batch) => batch.runSessions.map((record) => record.id)),
        };
      });
    },
  };
}
