// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { NurseFlowDatabase } from './db';
import { createCommands } from './commands';
import { createRepositories } from './repositories';

let db: NurseFlowDatabase;
beforeEach(async () => { db = new NurseFlowDatabase(`NurseFlow-F02-${crypto.randomUUID()}`); await db.open(); });
afterEach(async () => { await db.delete(); });

it('salva solo appearance, preserva media e riapre le preferenze durabili', async () => {
  const commands = createCommands(db);
  await db.settings.update('main', { photoPreset: 'original', mediaAddSoftLimit: { enabled: false, max: 8 } });
  const draft = await commands.createDraft({ metadata: { title: 'Esempio' } });
  const before = await Promise.all([db.procedures.toArray(), db.revisions.toArray(), db.uiPreferences.toArray()]);
  await commands.saveAppearance({ locale: 'en', theme: 'dark', uiScalePt: 48 });
  db.close(); await db.open();
  expect(await createRepositories(db).settings.get()).toMatchObject({ locale: 'en', theme: 'dark', uiScalePt: 48,
    photoPreset: 'original', mediaAddSoftLimit: { enabled: false, max: 8 } });
  expect(await Promise.all([db.procedures.toArray(), db.revisions.toArray(), db.uiPreferences.toArray()])).toEqual(before);
  expect((await db.procedures.get(draft.procedure.id))?.title).toBe('Esempio');
});
it('fallimento quota annulla il salvataggio e conserva i valori precedenti', async () => {
  const before = await db.settings.get('main');
  db.settings.hook('updating', () => { throw new DOMException('Simulated quota', 'QuotaExceededError'); });
  await expect(createCommands(db).saveAppearance({ locale: 'en', theme: 'dark', uiScalePt: 30 })).rejects.toThrow('Simulated quota');
  expect(await db.settings.get('main')).toEqual(before);
});
it.each([3, 49, 13.5])('scala %s non valida non scrive', async (uiScalePt) => {
  const before = await db.settings.get('main');
  await expect(createCommands(db).saveAppearance({ locale: 'it', theme: 'light', uiScalePt })).rejects.toThrow();
  expect(await db.settings.get('main')).toEqual(before);
});
