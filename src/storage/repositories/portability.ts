import type { NurseFlowDatabase } from '../db';
import { importedRecordsSchema, assetReferences } from '@domain/portability/records';
import { procedureSchema, groupSchema, revisionSchema } from '@domain/model';
import { invariant } from '@domain/model/integrity';
export function portabilityRepository(db: NurseFlowDatabase) {
  return {
    async list() { return db.transaction('r', [db.procedures, db.groups, db.revisions], async () => ({
      procedures: (await db.procedures.toArray()).map((item) => procedureSchema.parse(item)),
      groups: (await db.groups.toArray()).map((item) => groupSchema.parse(item)),
      revisions: (await db.revisions.toArray()).map((item) => revisionSchema.parse(item)),
    })); },
    async snapshot(selected?: readonly string[]) {
      return db.transaction('r', [db.procedures, db.groups, db.revisions, db.mediaAssets], async () => {
        const all = await db.procedures.toArray(); const ids = new Set(selected ?? all.map((procedure) => procedure.id));
        const procedures = all.filter((procedure) => ids.has(procedure.id)); invariant(procedures.length === ids.size && ids.size > 0, 'Export selection changed or empty');
        const groups = new Set(procedures.flatMap((procedure) => procedure.groupId ? [procedure.groupId] : []));
        const revisions = (await db.revisions.toArray()).filter((revision) => ids.has(revision.procedureId));
        const assets = [...new Set(revisions.flatMap((revision) => assetReferences(revision.graph)))];
        return importedRecordsSchema.parse({ procedures, revisions, groups: (await db.groups.toArray()).filter((group) => !selected || groups.has(group.id)),
          mediaAssets: (await db.mediaAssets.bulkGet(assets)).filter((asset) => asset !== undefined), runSessions: [] });
      });
    },
  };
}
