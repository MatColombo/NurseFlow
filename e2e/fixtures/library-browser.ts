import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands } from '../../src/storage/commands';
import { libraryFixture } from '../../src/test/fixtures/library';
import { convergenceGraph } from '../../src/test/fixtures/domain';

export async function seedLibrary() {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const fixture = libraryFixture();
    await db.transaction('rw', [db.procedures, db.groups, db.revisions], async () => {
      await db.groups.bulkAdd(fixture.groups); await db.revisions.bulkAdd(fixture.revisions); await db.procedures.bulkAdd(fixture.procedures);
    });
    await createCommands(db).completeFirstLaunch();
  } finally { db.close(); }
}
export async function inspectLibrary() {
  const db = new NurseFlowDatabase(); await db.open();
  try { return { procedures: await db.procedures.toArray(), groups: await db.groups.toArray(), view: await db.uiPreferences.get('main') }; }
  finally { db.close(); }
}
export async function autosaveFixture() {
  const db = new NurseFlowDatabase(); await db.open();
  try { return await createCommands(db).updateDraft({ procedureId: 'fixture-0', draftId: 'fixture-0-draft', expectedEditVersion: 1, graph: convergenceGraph() }); }
  finally { db.close(); }
}
