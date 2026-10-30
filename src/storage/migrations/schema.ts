import type { Dexie, Transaction } from 'dexie';

// v1 is retained verbatim for reproducible migration tests and future upgrades.
export const schemaV1 = {
  procedures: 'id, groupId, lastOpenedAt, priority',
  groups: 'id, order, name',
  revisions: 'id, procedureId, state, [procedureId+revisionNumber]',
  mediaAssets: 'id, sha256',
  runSessions: 'id, procedureId, pinnedRevisionId, status',
  settings: 'id',
  uiPreferences: 'id',
};
export const DATABASE_VERSION = 4;
export const schemaV4 = { ...schemaV1, builderStates: 'id, revisionId' };

export async function addVersionTokens(transaction: Transaction): Promise<void> {
  await transaction.table('revisions').toCollection().modify((record: { editVersion?: number }) => {
    record.editVersion ??= 1;
  });
  await transaction.table('runSessions').toCollection().modify((record: { saveVersion?: number }) => {
    record.saveVersion ??= 1;
  });
}

export function configureMigrations(db: Dexie): void {
  db.version(1).stores(schemaV1);
  db.version(2).stores(schemaV1).upgrade(addVersionTokens);
  db.version(3).stores(schemaV1).upgrade(async (transaction) => {
    // Preserve the language already chosen in F02 databases. Fresh databases detect it once.
    await transaction.table('uiPreferences').toCollection().modify({ initialLocaleSet: true });
  });
  db.version(4).stores(schemaV4);
}
