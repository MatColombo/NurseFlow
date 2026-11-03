import { expect, test, type Page } from '@playwright/test';
import { attachSettingsHarness, settingsData, setupSettings } from '../fixtures/settings';
import { expectNoBleeding, setScale } from '../fixtures/ui';
import { seedLibrary } from '../fixtures/library';
import { version } from '../../package.json';
const sheet = (page: Page) => page.getByRole('dialog');
async function close(page: Page) { await sheet(page).getByRole('button', { name: 'Chiudi', exact: true }).click(); }
async function advanced(page: Page) { await page.getByRole('button', { name: /^Avanzate/ }).click(); }
async function openClear(page: Page) {
  await advanced(page); await page.getByRole('button', { name: 'Cancella dati locali', exact: true }).click(); await expect(sheet(page)).toHaveAccessibleName('Cancella dati locali');
}
test('F12 one scale, IT/EN and dark/System persist while authored content, Ready and saved run stay unchanged', async ({ page }) => {
  const seeded = await setupSettings(page); await page.reload(); const before = await settingsData(page);
  await expect(page.getByText('Anteprima tecnica F02', { exact: true })).toHaveCount(0); await expect(page.getByRole('button', { name: /^Salva$/ })).toHaveCount(0);
  await setScale(page, 48); await expect(page.getByRole('slider')).toHaveCount(1); await close(page); await expectNoBleeding(page);
  await page.getByRole('button', { name: 'Tema Chiaro', exact: true }).click(); await page.getByRole('radio', { name: 'Scuro', exact: true }).check(); await close(page);
  await page.getByRole('button', { name: 'Lingua Italiano', exact: true }).click(); await page.getByRole('radio', { name: 'English', exact: true }).check(); await sheet(page).getByRole('button', { name: 'Close', exact: true }).click();
  await expect.poll(async () => (await settingsData(page)).settings).toMatchObject({ locale: 'en', theme: 'dark', uiScalePt: 48 });
  await page.reload(); await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark'); await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto(`./#/run/${seeded.runId}`); await expect(page.getByRole('heading', { name: 'Domanda authored invariata?', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exit', exact: true })).toBeVisible(); const after = await settingsData(page); expect(after.revisions).toEqual(before.revisions); expect(after.runs).toEqual(before.runs);
  await page.goto('./#/settings'); await page.getByRole('button', { name: 'Reset to 13 pt', exact: true }).click();
  await page.getByRole('button', { name: 'Theme Dark', exact: true }).click(); await page.getByRole('radio', { name: 'System', exact: true }).check(); await sheet(page).getByRole('button', { name: 'Close', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'dark' }); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' }); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(async () => (await settingsData(page)).settings?.uiScalePt).toBe(13);
});

test('F12 future media On/Off retains max; compression and cap changes preserve all five existing media and pinned snapshots', async ({ page }) => {
  await setupSettings(page); const before = await settingsData(page);
  await page.getByRole('button', { name: /^Limite nuove aggiunte/ }).click(); await sheet(page).getByRole('combobox').selectOption('32');
  await expect.poll(async () => (await settingsData(page)).settings?.mediaAddSoftLimit.max).toBe(32);
  await sheet(page).getByRole('checkbox').click(); await expect(sheet(page).getByRole('checkbox')).not.toBeChecked(); await expect(sheet(page).getByRole('combobox')).toHaveCount(0); await close(page); await page.reload();
  await page.getByRole('button', { name: /^Limite nuove aggiunte Off/ }).click(); await sheet(page).getByRole('checkbox').click(); await expect(sheet(page).getByRole('checkbox')).toBeChecked(); await expect(sheet(page).getByRole('combobox')).toHaveValue('32');
  await sheet(page).getByRole('combobox').selectOption('2'); await close(page);
  await page.getByRole('button', { name: /^Compressione per le prossime foto/ }).click(); await page.getByRole('radio', { name: 'Originale', exact: true }).click();
  await expect.poll(async () => (await settingsData(page)).settings?.photoPreset).toBe('original'); await close(page);
  const after = await settingsData(page); expect(after.revisions).toEqual(before.revisions); expect(after.runs).toEqual(before.runs); expect(after.assets).toEqual(before.assets);
  await page.goto('./#/build/procedure/step/shared'); await expect(page.getByRole('heading', { name: 'Editor passaggio', exact: true })).toBeVisible();
  await expect(page.locator('[data-editor-field="media"]')).toHaveAttribute('open', ''); await expect(page.locator('[data-media-row]')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Aggiungi foto', exact: true }).first()).toBeDisabled();
});

test('F12 quota preferences roll back their displayed value and Retry commits exactly the requested change', async ({ page }) => {
  await setupSettings(page); await page.evaluate(() => { const original = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) { if (this.name === 'settings') { IDBObjectStore.prototype.put = original; throw new DOMException('F12 quota', 'QuotaExceededError'); } return original.apply(this, args); }; });
  await page.getByRole('button', { name: /^Compressione per le prossime foto/ }).click(); await page.getByRole('radio', { name: 'Alta', exact: true }).click();
  await expect(sheet(page).getByRole('alert')).toContainText('Impostazioni non salvate'); await expect(page.getByRole('radio', { name: 'Medio', exact: true })).toBeChecked(); expect((await settingsData(page)).settings?.photoPreset).toBe('medium');
  await sheet(page).getByRole('button', { name: 'Riprova' }).click(); await expect(page.getByRole('radio', { name: 'Alta', exact: true })).toBeChecked(); await close(page); await page.reload();
  await expect(page.getByRole('button', { name: /^Compressione per le prossime foto Alta/ })).toBeVisible();
});

for (const granted of [false, true]) test(`F12 storage actual grant=${granted}, approximate origin usage and no retention promise`, async ({ page }) => {
  await page.addInitScript(({ granted }) => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: { persisted: async () => false, persist: async () => granted, estimate: async () => ({ usage: 1572864, quota: 10485760 }) } });
  }, { granted });
  await page.goto('./#/settings'); await page.getByRole('button', { name: /^Protezione archivio/ }).click();
  await expect(sheet(page).getByRole('status')).toHaveText('Non concessa'); await sheet(page).getByRole('button', { name: 'Richiedi protezione' }).click();
  await expect(sheet(page).getByRole('status')).toHaveText(granted ? 'Concessa' : 'Non concessa'); await expect(sheet(page)).toContainText('backup'); await close(page);
  await page.getByRole('button', { name: /^Spazio utilizzato/ }).click(); await expect(sheet(page)).toContainText('1,5 MB'); await expect(sheet(page)).toContainText('per questa origine');
});

test('F12 unsupported storage/update and offline checks remain truthful; About is on demand and Install hidden without support', async ({ page, context }) => {
  // F15 registers a real worker in production: emulate the missing browser APIs explicitly.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: {} });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
  });
  await page.goto('./#/settings'); await page.getByRole('button', { name: /^Protezione archivio/ }).click(); await expect(sheet(page).getByRole('status')).toHaveText('Non supportata'); await expect(sheet(page).getByRole('button', { name: 'Richiedi protezione' })).toHaveCount(0); await close(page);
  await page.getByRole('button', { name: /^Spazio utilizzato/ }).click(); await expect(sheet(page)).toContainText('Non disponibile'); await close(page);
  await page.getByRole('button', { name: /^Verifica aggiornamenti/ }).click(); await expect(sheet(page).getByRole('status')).toHaveText('Aggiornamenti non disponibili in questa versione'); await close(page);
  await context.setOffline(true); await page.getByRole('button', { name: /^Verifica aggiornamenti/ }).click(); await expect(sheet(page).getByRole('status')).toHaveText('Verifica non disponibile offline'); await close(page);
  await page.getByRole('button', { name: /^Informazioni/ }).click(); await expect(sheet(page)).toContainText('NurseFlow · ' + version); await expect(sheet(page)).toContainText('Offline'); await expect(sheet(page)).toContainText('HTTPS'); await close(page);
  await expect(page.getByRole('button', { name: /^Installa app/ })).toHaveCount(0);
});

test('F12 clear has two cautions, export before, safe cancellation; failure rolls back and confirmed Retry returns to First Launch', async ({ page }) => {
  await setupSettings(page); const before = await settingsData(page); await expect(page.getByRole('button', { name: 'Cancella dati locali', exact: true })).toHaveCount(0); await openClear(page);
  await expect(sheet(page).getByRole('button', { name: 'Annulla', exact: true })).toBeFocused();
  await sheet(page).getByRole('link', { name: /^Esporta prima/ }).click(); await expect(page).toHaveURL(/\/data\/app$/); await page.getByRole('link', { name: 'Indietro', exact: true }).click(); await expect(page).toHaveURL(/\/settings$/);
  expect(await settingsData(page)).toEqual(before); await openClear(page); await sheet(page).getByRole('button', { name: 'Prosegui alla conferma finale' }).click();
  await expect(sheet(page).getByRole('button', { name: 'Elimina definitivamente tutti i dati' })).toBeDisabled(); await sheet(page).getByRole('button', { name: 'Annulla', exact: true }).click(); expect(await settingsData(page)).toEqual(before);
  await page.getByRole('button', { name: 'Cancella dati locali', exact: true }).click(); await sheet(page).getByRole('button', { name: 'Prosegui alla conferma finale' }).click(); await sheet(page).getByRole('checkbox').check();
  await page.evaluate(() => { const original = IDBObjectStore.prototype.add; IDBObjectStore.prototype.add = function (...args: Parameters<IDBObjectStore['add']>) { if (this.name === 'settings') { IDBObjectStore.prototype.add = original; throw new DOMException('F12 clear quota', 'QuotaExceededError'); } return original.apply(this, args); }; });
  await sheet(page).getByRole('button', { name: 'Elimina definitivamente tutti i dati' }).click(); await expect(sheet(page).getByRole('alert')).toContainText('Operazione non completata'); expect(await settingsData(page)).toEqual(before);
  await sheet(page).getByRole('button', { name: 'Riprova' }).click(); await expect(page).toHaveURL(/\/setup$/); await expect(page.getByRole('button', { name: 'Inizia', exact: true })).toBeVisible();
  const after = await settingsData(page); expect(after.procedures).toEqual([]); expect(after.revisions).toEqual([]); expect(after.runs).toEqual([]); expect(after.settings?.uiScalePt).toBe(13); expect(after.view?.firstLaunchComplete).toBe(false);
});

test('F12 reset layout preserves groups, recents, authored content and run; stale clear review cannot delete new changes', async ({ page }) => {
  await setupSettings(page); await page.evaluate(() => window.NurseFlowF12.configureLayout()); const before = await settingsData(page); await advanced(page);
  await page.getByRole('button', { name: 'Ripristina vista Libreria', exact: true }).click(); await sheet(page).getByRole('button', { name: 'Ripristina vista Libreria', exact: true }).click();
  await expect.poll(async () => (await settingsData(page)).view?.sortMode).toBe('groups'); const after = await settingsData(page);
  expect(after.procedures).toEqual(before.procedures); expect(after.revisions).toEqual(before.revisions); expect(after.runs).toEqual(before.runs); expect(after.groups).toEqual(before.groups); expect(after.view?.recentProcedureIds).toEqual(before.view?.recentProcedureIds);
  await page.getByRole('button', { name: 'Cancella dati locali', exact: true }).click(); await sheet(page).getByRole('button', { name: 'Prosegui alla conferma finale' }).click(); await attachSettingsHarness(page); await page.evaluate(() => window.NurseFlowF12.touchDuringReview()); await sheet(page).getByRole('checkbox').check();
  await sheet(page).getByRole('button', { name: 'Elimina definitivamente tutti i dati' }).click(); await expect(sheet(page).getByRole('alert')).toContainText('I dati sono cambiati'); expect((await settingsData(page)).procedures).toHaveLength(1);
});

test('F12 native install prompt only on capability event; accepted prompt never promises a backup', async ({ page }) => {
  await page.goto('./#/settings'); await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'accepted' }) })));
  await page.getByRole('button', { name: /^Installa app/ }).click(); await expect(sheet(page)).toContainText('Richiesta accettata dal browser'); await expect(sheet(page)).toContainText('non crea un backup');
});

test('F12 11A/11B are separate real routes and Back returns to Settings', async ({ page }) => {
  await page.goto('./#/settings');
  for (const [label, suffix] of [['Procedure e libreria', 'procedures'], ['Backup app e impostazioni', 'app']]) {
    await page.getByRole('link', { name: label!, exact: true }).click(); await expect(page).toHaveURL(new RegExp('/data/' + suffix + '$'));
    await page.getByRole('link', { name: 'Indietro', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible();
  }
});

async function updater(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('F12-loads', String(Number(sessionStorage.getItem('F12-loads') ?? 0) + 1));
    const registration = Object.assign(new EventTarget(), {
      scope: new URL('.', location.href).href, installing: null, active: {},
      waiting: { postMessage: (value: unknown) => sessionStorage.setItem('F12-update-message', JSON.stringify(value)) },
      update: async () => { sessionStorage.setItem('F12-update-check', 'yes'); },
    });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: Object.assign(new EventTarget(), { getRegistration: async () => registration }) });
  });
}
test('F12 Back restores Library search, filter, sort and scroll after independent preference changes', async ({ page }) => {
  await seedLibrary(page); await page.getByLabel('Vista', { exact: true }).selectOption('priority');
  await page.getByRole('searchbox', { name: 'Cerca procedure' }).fill('fittizia');
  await page.getByRole('button', { name: 'Bozze', exact: true }).click();
  const pane = page.getByTestId('library-scroll'); await pane.evaluate((element) => { element.scrollTop = 100; }); const top = await pane.evaluate((element) => element.scrollTop);
  await page.getByRole('button', { name: 'Menu app', exact: true }).click(); await page.getByRole('link', { name: 'Impostazioni', exact: true }).click();
  await page.getByRole('button', { name: 'Tema Sistema', exact: true }).click(); await page.getByRole('radio', { name: 'Scuro', exact: true }).check(); await close(page);
  await page.getByRole('link', { name: 'Indietro', exact: true }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('fittizia'); await expect(page.getByLabel('Vista', { exact: true })).toHaveValue('priority');
  await expect(page.getByRole('button', { name: 'Bozze', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => pane.evaluate((element) => element.scrollTop)).toBeCloseTo(top, 0);
});
test('F12 deferred update preserves a saved pinned run across Settings, Run and Map; unsolicited controllerchange never reloads', async ({ page }) => {
  await updater(page); const { runId } = await setupSettings(page); const before = await settingsData(page);
  await page.getByRole('button', { name: /^Verifica aggiornamenti/ }).click(); await expect(sheet(page).getByRole('status')).toHaveText('Aggiornamento disponibile');
  await page.getByRole('button', { name: 'Aggiorna quando inattiva' }).click(); await expect(sheet(page).getByRole('status')).toHaveText('In attesa che l’app sia inattiva'); await close(page);
  await page.goto('./#/run/' + runId); await expect(page.locator('[data-step-content="decision"]')).toBeVisible();
  await page.getByRole('button', { name: 'Mappa', exact: true }).click(); await expect(page.locator('.nf-map-page')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));
  await page.getByRole('link', { name: 'Indietro al passo' }).click(); await expect(page.locator('[data-step-content="decision"]')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('F12-update-message'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('F12-loads'))).toBe('1'); expect((await settingsData(page)).runs).toEqual(before.runs);
});
test('F12 explicit update when idle activates only an actual waiting worker and reloads only after controllerchange', async ({ page }) => {
  await updater(page); await page.goto('./#/settings');
  await page.getByRole('button', { name: /^Verifica aggiornamenti/ }).click(); await expect(sheet(page).getByRole('status')).toHaveText('Aggiornamento disponibile');
  await page.getByRole('button', { name: 'Più tardi', exact: true }).click(); expect(await page.evaluate(() => sessionStorage.getItem('F12-update-message'))).toBeNull();
  await page.getByRole('button', { name: /^Verifica aggiornamenti/ }).click(); await page.getByRole('button', { name: 'Aggiorna quando inattiva' }).click();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('F12-update-message'))).toBe('{"type":"SKIP_WAITING"}');
  expect(await page.evaluate(() => sessionStorage.getItem('F12-loads'))).toBe('1');
  await Promise.all([page.waitForEvent('domcontentloaded'), page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')))]);
  await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible(); expect(await page.evaluate(() => sessionStorage.getItem('F12-loads'))).toBe('2');
});
