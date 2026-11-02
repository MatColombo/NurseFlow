import { expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { attachPortable, portableFile, portableState, portableTest as test, setupPortable } from '../fixtures/portability';
const sheet = (page: Page) => page.getByRole('dialog');
async function close(page: Page) { await sheet(page).getByRole('button', { name: 'Chiudi', exact: true }).click(); }
async function importTab(page: Page) { await page.getByRole('button', { name: 'Importa', exact: true }).click(); }
async function confirm(page: Page) { await page.getByRole('button', { name: 'Importa le procedure selezionate', exact: true }).click(); await sheet(page).getByRole('button', { name: 'Aggiungi come copie', exact: true }).click(); }
async function exported(page: Page, action: string) {
  await page.getByRole('button', { name: action, exact: true }).click(); await expect(sheet(page)).toHaveAccessibleName('File preparato');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Scarica file', exact: true }).click()]);
  const path = await download.path(); if (!path) throw new Error('Download unavailable'); const bytes = [...await readFile(path)];
  await expect(sheet(page).getByRole('status')).toContainText('Download richiesto'); await close(page); await attachPortable(page);
  return { decoded: await page.evaluate((bytes) => window.NurseFlowF13.decodeBytes(bytes), bytes), bytes, name: download.suggestedFilename() };
}

test('F13 E10 export actual single/multiple/group/all; hidden selections, full-library shortcut and snapshot reads preserve every original byte', async ({ page }, info) => {
  await setupPortable(page); const before = await portableState(page); await expect(page.getByRole('checkbox')).toHaveCount(10);
  await expect(page.getByRole('button', { name: 'Esporta selezione', exact: true })).toBeDisabled(); await page.getByRole('checkbox', { name: 'Cartoncino 0', exact: true }).check();
  const one = await exported(page, 'Esporta selezione'); expect(one.name).toMatch(/\.nfproc$/); expect(one.decoded.manifest.packageKind).toBe('procedure'); expect(one.decoded.procedures.map((item) => item.id)).toEqual(['p-0']); expect(one.decoded.revisions).toHaveLength(2); expect(one.decoded.manifest.counts.runs).toBe(0);
  await page.getByRole('searchbox', { name: 'Cerca procedure e contenuti' }).fill('sinonimo 0'); await page.getByRole('button', { name: 'Seleziona tutto il gruppo: Materiali', exact: true }).click();
  await expect(page.getByText('5 selezionate / 1 visibili', { exact: true })).toBeVisible(); const group = await exported(page, 'Esporta selezione'); expect(group.decoded.manifest.packageKind).toBe('library'); expect(group.decoded.procedures).toHaveLength(5); expect(group.decoded.groups).toHaveLength(1);
  await page.getByRole('searchbox', { name: 'Cerca procedure e contenuti' }).fill(''); await page.getByRole('button', { name: 'Gruppo · Tutti', exact: true }).click(); await sheet(page).getByRole('button', { name: 'Materiali', exact: true }).click();
  await page.getByRole('button', { name: 'Etichetta · Tutti', exact: true }).click(); await sheet(page).getByRole('button', { name: 'rosso', exact: true }).click(); await page.getByRole('button', { name: 'Deseleziona visibili', exact: true }).click();
  await expect(page.getByText('3 selezionate / 2 visibili', { exact: true })).toBeVisible(); const all = await exported(page, 'Esporta tutta la libreria'); expect(all.decoded.procedures).toHaveLength(10); expect(all.decoded.groups).toHaveLength(3);
  await expect(page.getByText('3 selezionate / 2 visibili', { exact: true })).toBeVisible(); expect(await portableState(page)).toEqual(before);
  await info.attach('single.nfproc', { body: Buffer.from(one.bytes), contentType: 'application/zip' });
});

test('F13 E11/I14 valid multi-file staging, repeated filenames, deselection/preview, wrong scope and Cancel; quota rollback and Retry add only chosen copies', async ({ page }) => {
  await setupPortable(page); const before = await portableState(page); const good = await portableFile(page, 'library', 'libreria.nflib'); const single = await portableFile(page, 'single', 'singola.nfproc'); const wrong = await portableFile(page, 'settings', 'confusa.nfproc');
  await importTab(page); await page.getByLabel('Carica uno o più file').setInputFiles([good, single, wrong]); await expect(page.getByText('4 selezionate / 4 visibili', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vai a Backup app e impostazioni', exact: true })).toBeVisible(); await page.getByRole('checkbox', { name: 'Cartoncino 0', exact: true }).first().uncheck();
  await page.getByRole('button', { name: 'Anteprima: Cartoncino 0', exact: true }).first().click(); await expect(sheet(page).getByRole('heading', { name: 'Cartoncino 0', exact: true })).toBeVisible(); await close(page);
  await expect(page.getByText('3 selezionate / 4 visibili', { exact: true })).toBeVisible(); await page.getByLabel('Carica uno o più file').setInputFiles(single); await expect(page.getByText('4 selezionate / 5 visibili', { exact: true })).toBeVisible();
  expect(await portableState(page)).toEqual(before); await page.getByRole('button', { name: 'Importa le procedure selezionate', exact: true }).click(); await expect(sheet(page)).toContainText('nessun dato presente verrà sostituito'); await sheet(page).getByRole('button', { name: 'Annulla', exact: true }).click(); expect(await portableState(page)).toEqual(before);
  await page.evaluate(() => { const original = IDBObjectStore.prototype.add; IDBObjectStore.prototype.add = function (...args: Parameters<IDBObjectStore['add']>) { if (this.name === 'procedures') { IDBObjectStore.prototype.add = original; throw new DOMException('F13 quota', 'QuotaExceededError'); } return original.apply(this, args); }; });
  await confirm(page); await expect(sheet(page).getByRole('alert')).toContainText('Nessun dato è stato aggiunto'); expect(await portableState(page)).toEqual(before);
  await sheet(page).getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(page.getByRole('heading', { name: '4 procedure aggiunte', exact: true })).toBeVisible(); const after = await portableState(page);
  expect(after.procedures).toHaveLength(14); expect(after.runs).toEqual(before.runs); expect(after.settings).toEqual(before.settings); expect(after.view).toEqual(before.view);
  for (const original of before.procedures) expect(after.procedures).toContainEqual(original); for (const original of before.revisions) expect(after.revisions).toContainEqual(original);
});

test('F13 E13/I09/I18 accurate deselected preview uses staged Blob even with local ID collisions, W07 and inert authored HTML, never remote fetch', async ({ page }) => {
  await setupPortable(page); const before = await portableState(page); const foreign = await portableFile(page, 'collision'); const requests: string[] = []; page.on('request', (request) => { if (request.url().startsWith('https://')) requests.push(request.url()); });
  await importTab(page); await page.getByLabel('Carica uno o più file').setInputFiles(foreign); await expect(page.getByRole('checkbox')).toHaveCount(1); await page.getByRole('checkbox').uncheck();
  await page.getByRole('searchbox', { name: 'Cerca procedure e contenuti' }).fill('img');
  const title = '<img src=x onerror="window.F13Xss=1">'; const anchor = page.getByRole('button', { name: 'Anteprima: ' + title, exact: true }); await anchor.scrollIntoViewIfNeeded(); const top = await page.evaluate(() => scrollY); await anchor.click();
  await sheet(page).getByRole('button', { name: 'Esamina Revisione comune', exact: true }).click(); const inspector = page.getByRole('dialog', { name: 'Istruzione', exact: true });
  await expect(inspector.getByRole('img', { name: 'Cartoncino locale', exact: true })).toBeVisible(); await expect(inspector.locator('[data-media-id="m-missing"]')).toContainText('W07');
  await expect(inspector.locator('[data-media-id="m-missing"] img')).toHaveCount(0); await expect(inspector.locator('[data-media-id="m-url"]')).toContainText('Immagine non disponibile');
  expect(await page.evaluate(() => Reflect.get(window, 'F13Xss'))).toBeUndefined(); expect(requests).toEqual([]); await inspector.getByRole('button', { name: 'Chiudi', exact: true }).click(); await close(page);
  await expect(page.getByText('0 selezionate / 1 visibili', { exact: true })).toBeVisible(); await expect(page.getByRole('searchbox', { name: 'Cerca procedure e contenuti' })).toHaveValue('img'); await expect(anchor).toBeFocused(); await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(top, 0); expect(await portableState(page)).toEqual(before);
});

test('F13 I03/I04/I11/I13/I19 each rejected file is distinct, wrong scope cross-routes without writes, corrupt/future never become settings claims', async ({ page }) => {
  await setupPortable(page); const before = await portableState(page); const full = await portableFile(page, 'full', 'looks-like-library.nflib'); const bad = await portableFile(page, 'corrupt'); const future = await portableFile(page, 'future'); const single = await portableFile(page, 'single');
  await importTab(page); await page.getByLabel('Carica uno o più file').setInputFiles([full, bad, future]); await expect(page.getByRole('link', { name: 'Vai a Backup app e impostazioni', exact: true })).toHaveCount(1);
  await expect(page.getByText('Controllo di integrità non superato. Il file è corrotto.', { exact: true })).toBeVisible(); await expect(page.getByText('Versione del formato non supportata.', { exact: true })).toBeVisible(); expect(await portableState(page)).toEqual(before);
  await page.getByRole('link', { name: 'Vai a Backup app e impostazioni', exact: true }).click(); await page.getByLabel('Carica uno o più file').setInputFiles(single);
  await expect(page.getByRole('link', { name: 'Vai a Procedure e libreria', exact: true })).toBeVisible(); expect(await portableState(page)).toEqual(before);
});

test('F13 E15 same Ready package imported three times creates disjoint groups/media/graphs, stays usable Ready and original pinned run survives reload', async ({ page }) => {
  const { runId } = await setupPortable(page); const before = await portableState(page); const file = await portableFile(page, 'single'); await importTab(page);
  for (let index = 0; index < 3; index++) { await page.getByLabel('Carica uno o più file').setInputFiles(file); await expect(page.getByText('1 selezionate / 1 visibili', { exact: true })).toBeVisible(); await confirm(page); await expect(page.getByRole('heading', { name: '1 procedure aggiunte', exact: true })).toBeVisible(); }
  const after = await portableState(page); const ids = new Set(before.procedures.map((procedure) => procedure.id)); const added = after.procedures.filter((procedure) => !ids.has(procedure.id)); expect(added).toHaveLength(3);
  expect(new Set(added.map((procedure) => procedure.groupId)).size).toBe(3); expect(new Set(added.map((procedure) => procedure.readyRevisionId)).size).toBe(3); expect(after.assets).toHaveLength(4); expect(after.runs).toEqual(before.runs);
  await page.goto('./#/procedure/' + added[0]!.id); await page.getByRole('button', { name: 'Avvia Ready', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Percorso A o B?', exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Percorso A o B?', exact: true })).toBeVisible(); await page.goto('./#/run/' + runId); await expect(page.getByRole('heading', { name: 'Percorso A o B?', exact: true })).toBeVisible();
  expect((await portableState(page)).runs.find((run) => run.id === runId)).toEqual(before.runs[0]);
});

test('F13 I10 imported W08 remains Ready, warns before commit and interrupts as broken instead of End', async ({ page }) => {
  await setupPortable(page); const before = await portableState(page); const broken = await portableFile(page, 'broken'); await importTab(page); await page.getByLabel('Carica uno o più file').setInputFiles(broken);
  await page.getByRole('button', { name: 'Importa le procedure selezionate', exact: true }).click(); await expect(sheet(page)).toContainText(/un percorso può interrompersi/i); await sheet(page).getByRole('button', { name: 'Aggiungi come copie', exact: true }).click(); await expect(page.getByRole('heading', { name: '1 procedure aggiunte', exact: true })).toBeVisible();
  const after = await portableState(page); const added = after.procedures.find((procedure) => !before.procedures.some((original) => original.id === procedure.id))!;
  await page.goto('./#/procedure/' + added.id); await page.getByRole('button', { name: 'Avvia Ready', exact: true }).click(); await page.getByRole('button', { name: 'A', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('W08'); await expect(page).not.toHaveURL(/\/end$/); expect((await portableState(page)).runs.find((run) => run.id === before.runs[0]!.id)).toEqual(before.runs[0]);
});
