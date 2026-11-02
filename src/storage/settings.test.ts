// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NurseFlowDatabase } from './db';
import { createCommands } from './commands';
import { createRepositories } from './repositories';
import { exampleRecords } from '@test/fixtures/domain';
import { outlineGraph } from '@test/fixtures/builder';
import { pendingOperations } from './activity';
let db: NurseFlowDatabase; let commands: ReturnType<typeof createCommands>;
beforeEach(async () => {
  db = new NurseFlowDatabase('F12-' + crypto.randomUUID()); await db.open(); commands = createCommands(db);
  const records = exampleRecords(outlineGraph()); await db.groups.bulkAdd(records.groups); await db.revisions.bulkAdd(records.revisions); await db.procedures.bulkAdd(records.procedures);
  await commands.startOrResumeReady('procedure', 'ready'); const draft = await commands.createDraft({ procedureId: 'procedure' }); await commands.startDraftPreview('procedure', draft.draft.id);
  await db.mediaAssets.add({ id: 'asset', blob: new Blob(['image'], { type: 'image/png' }), sha256: 'a'.repeat(64), mime: 'image/png', bytes: 5, width: 1, height: 1 });
  await db.uiPreferences.update('main', { sortMode: 'priority', collapsedGroupIds: ['group'], searchText: 'query', filters: { favoritesOnly: true }, recentProcedureIds: ['procedure'], firstLaunchComplete: true, initialLocaleSet: true, recentCollapsed: true, scrollTop: 320 });
});
afterEach(async () => { await db.delete(); });
async function content() { return Promise.all([db.procedures.toArray(), db.groups.toArray(), db.revisions.toArray(), db.mediaAssets.toArray(), db.runSessions.toArray(), db.previewSessions.toArray(), db.settings.toArray(), db.builderStates.toArray()]); }
describe('F12 destructive operations and data isolation', () => {
  it('reset changes only Library view, preserving recent activity and every authored/pinned record', async () => {
    const before = await content(); const view = (await db.uiPreferences.get('main'))!;
    await expect(commands.resetLibraryLayout(false)).rejects.toThrow('Confirmation');
    const next = await commands.resetLibraryLayout(true);
    expect(next).toEqual({ ...view, sortMode: 'groups', collapsedGroupIds: [], searchText: '', filters: {}, scrollTop: 0, recentCollapsed: false });
    db.close(); await db.open(); expect(await content()).toEqual(before); expect(await db.uiPreferences.get('main')).toEqual(next);
  });
  it('media preferences change future defaults only, retaining previous max while Off and all snapshots/Blobs', async () => {
    const before = await content();
    await commands.saveMediaPreferences({ mediaAddSoftLimit: { enabled: false, max: 32 }, photoPreset: 'original' });
    await commands.saveAppearance({ uiScalePt: 48, locale: 'en', theme: 'dark' });
    await commands.saveMediaPreferences({ mediaAddSoftLimit: { enabled: true, max: 2 }, photoPreset: 'small' });
    const after = await content(); expect(after.slice(0, 6)).toEqual(before.slice(0, 6));
    expect(await db.settings.get('main')).toMatchObject({ locale: 'en', theme: 'dark', uiScalePt: 48, photoPreset: 'small', mediaAddSoftLimit: { enabled: true, max: 2 } });
  });
  it('clear is confirmed, atomic, resets first launch and cannot weaken ordinary Ready/Blob guards', async () => {
    const inventory = await createRepositories(db).localData.inventory(); expect(inventory).toMatchObject({ procedures: 1, media: 1, runs: 2 });
    await expect(commands.clearLocalData(inventory.token, false)).rejects.toThrow('Confirmation');
    await expect(db.mediaAssets.delete('asset')).rejects.toThrow('GC'); await expect(db.revisions.delete('ready')).rejects.toThrow('cannot be deleted');
    const defaults = await commands.clearLocalData(inventory.token, true); expect(defaults).toMatchObject({ uiScalePt: 13, photoPreset: 'medium', mediaAddSoftLimit: { enabled: true, max: 2 } });
    db.close(); await db.open();
    expect(await Promise.all(db.tables.filter((table) => !['settings', 'uiPreferences'].includes(table.name)).map((table) => table.count()))).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(await db.uiPreferences.get('main')).toMatchObject({ firstLaunchComplete: false, initialLocaleSet: true, recentProcedureIds: [] }); expect(pendingOperations()).toBe(0);
  });
  it('changed data requires a fresh review; no partial deletion or false success', async () => {
    const inventory = await createRepositories(db).localData.inventory(); await commands.setFavorite('procedure', true); const before = await content();
    await expect(commands.clearLocalData(inventory.token, true)).rejects.toThrow('Local data changed'); expect(await content()).toEqual(before); expect(pendingOperations()).toBe(0);
  });
  it('quota during reset and failure after stores were cleared both roll back all affected data', async () => {
    const before = await content(); const view = await db.uiPreferences.get('main');
    const quota = () => { throw new DOMException('quota F12', 'QuotaExceededError'); }; db.uiPreferences.hook('updating', quota);
    await expect(commands.resetLibraryLayout(true)).rejects.toThrow('quota F12'); expect(await db.uiPreferences.get('main')).toEqual(view); db.uiPreferences.hook('updating').unsubscribe(quota);
    const inventory = await createRepositories(db).localData.inventory(); db.settings.hook('creating', quota);
    await expect(commands.clearLocalData(inventory.token, true)).rejects.toThrow('quota F12');
    expect(await content()).toEqual(before); expect(await db.uiPreferences.get('main')).toEqual(view); expect(pendingOperations()).toBe(0);
  });
});
