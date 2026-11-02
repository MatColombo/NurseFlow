import { Dexie } from 'dexie';
import { NurseFlowDatabase } from '../../src/storage/db';
import { schemaV1, schemaV5 } from '../../src/storage/migrations/schema';
import { settingsSchema } from '../../src/domain/model';
import { exampleRecords, fixtureDate } from '../../src/test/fixtures/domain';
import { storageLifecycle } from '../../src/storage/lifecycle';
export const lifecycle = storageLifecycle.getSnapshot;
let connection: Dexie | undefined;
export async function legacy(name: string) {
  connection = new Dexie(name); connection.version(1).stores(schemaV1);
  connection.on('versionchange', () => false); await connection.open();
  const records = exampleRecords();
  await connection.table('procedures').bulkAdd(records.procedures);
  await connection.table('revisions').bulkAdd(records.revisions.map((revision) => { const old = { ...revision }; delete (old as { editVersion?: number }).editVersion; return old; }));
  await connection.table('settings').add(settingsSchema.parse({ locale: 'en', theme: 'dark' }));
  await connection.table('uiPreferences').add({ id: 'main', firstLaunchComplete: true, recentProcedureIds: [records.procedures[0]!.id] });
  return { revisions: records.revisions.length, procedure: records.procedures[0]!.id, date: fixtureDate };
}
export async function migrate(name: string) { connection = new NurseFlowDatabase(name); await connection.open(); return inspect(); }
export async function inspect() {
  if (!connection) throw new Error('Database not opened');
  return { version: connection.verno, procedures: await connection.table('procedures').toArray(), revisions: await connection.table('revisions').toArray(), settings: await connection.table('settings').get('main'), view: await connection.table('uiPreferences').get('main'), tables: connection.tables.map((table) => table.name) };
}
export function close() { connection?.close(); }
export async function nextVersion(name: string) {
  connection = new Dexie(name); connection.version(5).stores(schemaV5); connection.version(6).stores({ ...schemaV5, groups: 'id, order, name, createdAt' }); await connection.open();
  return inspect();
}
