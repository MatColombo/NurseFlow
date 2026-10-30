// @vitest-environment node
import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { libraryFixture } from '@test/fixtures/library';
import { fixtureDate, convergenceGraph } from '@test/fixtures/domain';
import { NurseFlowDatabase } from './db';
import { createCommands } from './commands';
import { createRepositories } from './repositories';
import { schemaV1 } from './migrations/schema';
import { settingsSchema, uiPreferencesSchema } from '@domain/model';

let db: NurseFlowDatabase; let commands: ReturnType<typeof createCommands>;
beforeEach(async () => {
  db = new NurseFlowDatabase(`F03-${crypto.randomUUID()}`); await db.open();
  commands = createCommands(db, { newId: () => crypto.randomUUID(), now: () => '2026-10-29T11:00:00.000Z' });
  const fixture = libraryFixture(); await db.groups.bulkAdd(fixture.groups); await db.procedures.bulkAdd(fixture.procedures);
  await db.revisions.bulkAdd(fixture.revisions);
});
afterEach(async () => { await db.delete(); });
describe('comandi F03 persistenti', () => {
  it('primo avvio e lingua vengono conservati; rilevamento eseguito una volta sola', async () => {
    await commands.initializeLocale(['en-GB']); await commands.completeFirstLaunch();
    await commands.initializeLocale(['it-IT']); db.close(); await db.open();
    expect((await createRepositories(db).settings.get()).locale).toBe('en');
    expect((await createRepositories(db).uiPreferences.get()).firstLaunchComplete).toBe(true);
  });
  it('filtri, vista, gruppi chiusi, recenti chiusi e scroll sopravvivono alla riapertura', async () => {
    const patch = { sortMode: 'recent' as const, searchText: 'cartoncino', filters: { tags: ['blu'] }, collapsedGroupIds: ['materials'], recentCollapsed: true, scrollTop: 172 };
    await commands.saveLibraryView(patch); db.close(); await db.open();
    expect(await createRepositories(db).uiPreferences.get()).toMatchObject(patch);
  });
  it('apertura vera aggiorna storia max20, metadata e autosave non la cambiano', async () => {
    await commands.recordProcedureOpen('fixture-0');
    const before = await db.uiPreferences.get('main');
    await commands.toggleFavorite('fixture-0'); await commands.saveLibraryView({ searchText: 'alfa' });
    await commands.updateDraft({ procedureId: 'fixture-0', draftId: 'fixture-0-draft', expectedEditVersion: 1, graph: convergenceGraph() });
    expect((await db.procedures.get('fixture-0'))?.lastOpenedAt).toBe('2026-10-29T11:00:00.000Z');
    expect((await db.uiPreferences.get('main'))?.recentProcedureIds).toEqual(before?.recentProcedureIds);
    expect(before?.recentProcedureIds[0]).toBe('fixture-0'); expect(before?.recentProcedureIds).toHaveLength(20);
    await commands.recordProcedureOpen('fixture-0'); expect(new Set((await db.uiPreferences.get('main'))?.recentProcedureIds).size).toBe(20);
  });
  it('non registra aperture per record mancanti o archiviati', async () => {
    const before = await db.uiPreferences.toArray();
    await expect(commands.recordProcedureOpen('missing')).rejects.toThrow(); await expect(commands.recordProcedureOpen('fixture-25')).rejects.toThrow();
    expect(await db.uiPreferences.toArray()).toEqual(before);
  });
  it('gruppi trim, duplicati, rinomina con ID stabile e ordine anche con gruppi vuoti', async () => {
    const group = await commands.saveGroup({ name: '  Nuovo   gruppo  ' }); expect(group.name).toBe('Nuovo gruppo'); expect(group.order).toBe(3);
    await expect(commands.saveGroup({ name: ' NUOVO gruppo ' })).rejects.toThrow('Duplicate');
    expect((await commands.saveGroup({ id: group.id, name: 'Rinominato' })).id).toBe(group.id);
    await commands.moveGroup(group.id, -1); expect((await db.groups.get(group.id))?.order).toBe(2);
    expect((await db.groups.get('empty'))?.order).toBe(3);
  });
  it('cancellazione sposta membri in Ungrouped senza modificare revisioni o procedure', async () => {
    const before = await db.revisions.toArray(); const count = await db.procedures.count();
    await commands.deleteGroup('materials');
    expect(await db.groups.get('materials')).toBeUndefined(); expect(await db.procedures.count()).toBe(count);
    expect((await db.procedures.get('fixture-0'))?.groupId).toBeNull(); expect(await db.revisions.toArray()).toEqual(before);
  });
  it('errore quota nella cancellazione annulla riassegnazione, gruppo e preferenze', async () => {
    const before = await db.procedures.toArray();
    db.groups.hook('deleting', () => { throw new DOMException('quota simulata', 'QuotaExceededError'); });
    await expect(commands.deleteGroup('materials')).rejects.toThrow('quota');
    expect(await db.procedures.toArray()).toEqual(before); expect(await db.groups.get('materials')).toBeDefined();
  });
  it('fallimento storia annulla anche il timestamp di apertura', async () => {
    const before = await db.procedures.get('fixture-0');
    db.uiPreferences.hook('updating', () => { throw new Error('write failed'); });
    await expect(commands.recordProcedureOpen('fixture-0')).rejects.toThrow('write failed');
    expect(await db.procedures.get('fixture-0')).toEqual(before);
  });
  it('Retry di un preferito è idempotente e un errore non anticipa il risultato', async () => {
    const before = await db.procedures.get('fixture-0');
    const fail = () => { throw new DOMException('quota', 'QuotaExceededError'); };
    db.procedures.hook('updating', fail);
    await expect(commands.setFavorite('fixture-0', false)).rejects.toThrow('quota');
    expect(await db.procedures.get('fixture-0')).toEqual(before);
    db.procedures.hook('updating').unsubscribe(fail);
    await commands.setFavorite('fixture-0', false); await commands.setFavorite('fixture-0', false);
    expect(await db.procedures.get('fixture-0')).toEqual({ ...before, favorite: false });
  });
  it('un vecchio snapshot UI non può azzerare primo avvio, lingua o persistenza', async () => {
    const stale = uiPreferencesSchema.parse({});
    await commands.completeFirstLaunch(); await commands.initializeLocale(['en']); await commands.savePersistenceStatus('granted');
    await commands.saveLibraryView(stale);
    expect(await createRepositories(db).uiPreferences.get()).toMatchObject({ firstLaunchComplete: true, initialLocaleSet: true, persistenceStatus: 'granted' });
  });
  it('snapshot coerente carica i passaggi salvati prima di ripristinare lo scroll', async () => {
    const repository = createRepositories(db).library;
    expect((await repository.getSnapshot()).revisions).toEqual([]);
    await commands.saveLibraryView({ filters: { includeSteps: true }, scrollTop: 200 });
    const snapshot = await repository.getSnapshot();
    expect(snapshot.revisions.length).toBeGreaterThan(0); expect(snapshot.view.scrollTop).toBe(200);
    expect((await repository.getSnapshot(false)).revisions).toEqual([]);
  });
  it('migrazione v2→v3 mantiene lingua e dati già salvati', async () => {
    const name = `F03-v2-${crypto.randomUUID()}`; const legacy = new Dexie(name); legacy.version(2).stores(schemaV1);
    await legacy.table('settings').add(settingsSchema.parse({ locale: 'it' }));
    await legacy.table('uiPreferences').add({ id: 'main', sortMode: 'priority', collapsedGroupIds: ['materials'], recentProcedureIds: ['p'] });
    await legacy.table('groups').add({ id: 'g', name: 'Salvato', order: 0, createdAt: fixtureDate }); legacy.close();
    const upgraded = new NurseFlowDatabase(name);
    try {
      await upgraded.open(); await createCommands(upgraded).initializeLocale(['en-US']);
      expect((await upgraded.settings.get('main'))?.locale).toBe('it');
      expect(uiPreferencesSchema.parse(await upgraded.uiPreferences.get('main'))).toMatchObject({ sortMode: 'priority', collapsedGroupIds: ['materials'], initialLocaleSet: true });
      expect(await upgraded.groups.count()).toBe(1);
    } finally { await upgraded.delete(); }
  });
});
