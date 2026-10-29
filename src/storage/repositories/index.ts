import { z } from 'zod';
import type { Table } from 'dexie';
import { groupSchema, mediaAssetSchema, procedureSchema, revisionSchema, runSessionSchema,
  settingsSchema, uiPreferencesSchema } from '@domain/model';
import type { NurseFlowDatabase } from '../db';

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
