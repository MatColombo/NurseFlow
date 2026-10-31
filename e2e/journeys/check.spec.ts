import { expect, test as base, type Page } from '@playwright/test';
import { attachBuilderHarness, setupBuilder } from '../fixtures/builder';
import { graphNode, locateGraphNode, pickGraphNode } from '../fixtures/graph';
import { expectNoBleeding, setScale } from '../fixtures/ui';
// Native Blob persistence needs a disk-backed WebKit context on Windows; profiles remain isolated.
const test = base.extend({ context: async ({ playwright, browserName, baseURL, headless, locale }, use) => {
  const context = await playwright[browserName].launchPersistentContext('', { headless, ...(baseURL ? { baseURL } : {}), ...(locale ? { locale } : {}) });
  try { await use(context); } finally { await context.close(); }
} });
async function configure(page: Page, mode: Parameters<Window['NurseFlowF05']['configureCheck']>[0] = 'valid') {
  await setupBuilder(page); await attachBuilderHarness(page); await page.evaluate((mode) => window.NurseFlowF05.configureCheck(mode), mode); await openCheck(page);
}
async function openCheck(page: Page) { await page.goto('./#/build/procedure/check'); await expect(page.getByRole('heading', { name: 'Controlla procedura', exact: true })).toBeVisible(); await expect(page.getByText('Controllo locale in corso…', { exact: true })).toHaveCount(0); }
async function state(page: Page) { await attachBuilderHarness(page); return page.evaluate(() => window.NurseFlowF05.checkState()); }
const dialog = (page: Page) => page.getByRole('dialog');
async function confirmation(page: Page) { await page.getByRole('button', { name: 'Segna Ready', exact: true }).click(); await expect(dialog(page).getByRole('heading', { name: 'Segnare la versione Ready?' })).toBeVisible(); }

test('E06 due problemi, Fix singolo edge, ritorno automatico e attività precisa', async ({ page }) => {
  await configure(page, 'two'); await expect(page.getByText('2 problemi', { exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Segna Ready', exact: true })).toBeDisabled(); const before = await state(page);
  await page.getByRole('button', { name: /Correggi.*P02.*No/ }).click(); await expect(dialog(page)).toContainText('No');
  await dialog(page).getByRole('button', { name: 'Vai a un passo esistente', exact: true }).click();
  await pickGraphNode(page, 'Fine esempio'); await dialog(page).getByRole('button', { name: 'Applica modifica', exact: true }).click();
  await page.getByRole('button', { name: 'Torna al controllo', exact: true }).click(); await expect(page.getByText('1 problema', { exact: true })).toBeVisible();
  const after = await state(page); const old = before.revisions.find((revision) => revision.state === 'working-draft')!; const current = after.revisions.find((revision) => revision.state === 'working-draft')!;
  const oldChoice = old.graph.nodes.find((node) => node.kind === 'decision')!; const newChoice = current.graph.nodes.find((node) => node.kind === 'decision')!;
  if (oldChoice.kind !== 'decision' || newChoice.kind !== 'decision') throw new Error('fixture'); expect(newChoice.outcomes[0]).toEqual(oldChoice.outcomes[0]);
  await page.getByRole('button', { name: /Correggi.*P06.*Attività 1/ }).click(); await expect(dialog(page)).toContainText('Attività 1'); await dialog(page).getByRole('button', { name: 'Crea il prossimo passo', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Istruzione', exact: true }).click();
  await page.getByRole('textbox', { name: 'Titolo breve', exact: true }).fill('Primo cartoncino'); await page.getByRole('textbox', { name: 'Testo istruzione', exact: true }).fill('Ordinare il cartoncino dimostrativo.');
  await page.getByRole('button', { name: 'Cambia percorso', exact: true }).click(); await page.locator('.nf-target-context').getByRole('button', { name: 'Crea il prossimo passo', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Termina questa attività', exact: true }).click();
  await page.getByRole('button', { name: 'Torna al controllo', exact: true }).click(); await expect(page.getByText('Nessun problema strutturale trovato.', { exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Segna Ready', exact: true })).toBeEnabled();
});

test('P10 Fix al campo Page08, autosave e recheck al ritorno senza cambiare Ready', async ({ page }) => {
  await configure(page, 'content'); const before = await state(page); await page.getByRole('button', { name: /Correggi.*P10/ }).click();
  const question = page.getByRole('textbox', { name: 'Domanda', exact: true }); await expect(question).toBeFocused(); await question.fill('Quale cartoncino scegliere?'); await page.getByRole('button', { name: 'Torna al controllo', exact: true }).click();
  await expect(page.getByText('Nessun problema strutturale trovato.', { exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Segna Ready', exact: true })).toBeEnabled(); const after = await state(page); expect(after.revisions.find((revision) => revision.state === 'ready')).toEqual(before.revisions.find((revision) => revision.state === 'ready'));
});

test('warning offline W01/W02/W07/W08, Inspect media e conferma rischio esplicito', async ({ page, context }) => {
  await configure(page, 'warnings'); await context.setOffline(true); await page.getByRole('button', { name: 'Controlla di nuovo' }).click();
  await expect(page.getByText('Nessun problema strutturale trovato.', { exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: /^Esamina.*W0[1278]/ })).toHaveCount(4); const before = await state(page);
  await page.getByRole('button', { name: /^Esamina.*W07/ }).click(); await expect(page.locator('[data-media-row="missing"]')).toContainText('Immagine non disponibile'); await page.getByRole('button', { name: 'Torna al controllo', exact: true }).click();
  await confirmation(page); await expect(dialog(page).getByText(/Un percorso può interrompersi/)).toBeVisible(); await expect(dialog(page).getByRole('button', { name: 'Segna Ready' })).toBeDisabled(); await dialog(page).getByRole('checkbox').check(); await dialog(page).getByRole('button', { name: 'Segna Ready' }).click();
  await expect(page).toHaveURL(/#\/procedure\/procedure$/); const after = await state(page); expect(after.revisions).toHaveLength(before.revisions.length + 1); expect(after.revisions.find((revision) => revision.id === after.procedure?.readyRevisionId)?.state).toBe('ready');
});

test('conferma personale, Cancel, nuova Ready e run pinned dopo reload', async ({ page }) => {
  await configure(page); await attachBuilderHarness(page); await page.evaluate(() => window.NurseFlowF05.pinCheckRun()); const before = await state(page);
  await confirmation(page); await expect(dialog(page).getByText('Draft → Ready v2', { exact: true })).toBeVisible(); await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click(); expect((await state(page)).revisions).toEqual(before.revisions);
  await confirmation(page); await dialog(page).getByRole('checkbox').check(); await dialog(page).getByRole('button', { name: 'Segna Ready', exact: true }).click(); await expect(page).toHaveURL(/#\/procedure\/procedure$/); await page.reload();
  const after = await state(page); expect(after.runs).toEqual(before.runs); expect(after.revisions.find((revision) => revision.id === before.procedure?.readyRevisionId)).toEqual(before.revisions.find((revision) => revision.id === before.procedure?.readyRevisionId)); expect(after.revisions.find((revision) => revision.id === after.procedure?.readyRevisionId)?.revisionNumber).toBe(2); expect(after.procedure?.workingDraftId).toBe(before.procedure?.workingDraftId);
});

test('Draft modificata dopo Check: stale disabilita Ready e serve nuovo controllo', async ({ page }) => {
  await configure(page); await confirmation(page); await attachBuilderHarness(page); await page.evaluate(() => window.NurseFlowF05.changeCheckedQuestion(''));
  await expect(dialog(page)).toHaveCount(0); await expect(page.getByRole('alert')).toContainText('sono cambiati'); await expect(page.getByRole('button', { name: 'Segna Ready', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Controlla di nuovo' }).click(); await expect(page.getByText('1 problema', { exact: true })).toBeVisible(); expect((await state(page)).revisions.filter((revision) => revision.state === 'ready')).toHaveLength(1);
});

test('quota dopo add Ready: rollback, nessun falso successo, Retry unico', async ({ page }) => {
  await configure(page); const before = await state(page); await confirmation(page); await dialog(page).getByRole('checkbox').check();
  await page.evaluate(() => { const original = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) { if (this.name === 'procedures') { IDBObjectStore.prototype.put = original; throw new DOMException('quota-F08', 'QuotaExceededError'); } return original.apply(this, args); }; });
  await dialog(page).getByRole('button', { name: 'Segna Ready', exact: true }).click(); await expect(dialog(page).getByRole('alert')).toContainText('Impossibile segnare Ready'); expect(await state(page)).toEqual(before);
  await dialog(page).getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(page).toHaveURL(/#\/procedure\/procedure$/); expect((await state(page)).revisions).toHaveLength(before.revisions.length + 1);
});

test('Preview Draft non crea Ready o run e Back conserva vista Builder', async ({ page }) => {
  await configure(page); await page.getByRole('link', { name: 'Torna al Builder' }).click(); await page.getByRole('button', { name: 'Graph', exact: true }).click(); await locateGraphNode(page, 'Revisione comune'); await graphNode(page, 'shared').getByRole('button', { name: 'Revisione comune', exact: true }).click(); await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).first().click();
  await page.getByRole('button', { name: 'Verifica', exact: true }).click(); const before = await state(page); await page.getByRole('button', { name: 'Anteprima Draft', exact: true }).click(); await expect(page).toHaveURL(/preview=draft/); expect((await state(page)).revisions).toEqual(before.revisions); expect((await state(page)).runs).toEqual(before.runs);
  await openCheck(page); await page.getByRole('link', { name: 'Torna al Builder' }).click(); const after = await state(page); expect(after.history?.view).toEqual(before.history?.view); await expect(page.getByRole('button', { name: 'Graph', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('P12 URL eseguibile resta testo, nessun successo o esecuzione', async ({ page }) => {
  let alerts = 0; page.on('dialog', async (dialog) => { alerts++; await dialog.dismiss(); }); await configure(page, 'invalid-url'); await expect(page.getByRole('button', { name: /Correggi.*P12/ })).toBeVisible(); await expect(page.getByRole('button', { name: 'Segna Ready', exact: true })).toBeDisabled(); expect(alerts).toBe(0);
});

test('Blob reale leggibile passa, digest corrotto è W07 senza P12', async ({ page }) => {
  await configure(page); await attachBuilderHarness(page); const bytes = await page.evaluate(async () => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2; const blob = await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png')); const bytes = [...new Uint8Array(await blob.arrayBuffer())]; await window.NurseFlowF05.addCheckBlob(bytes); return bytes; });
  await page.getByRole('button', { name: 'Controlla di nuovo' }).click(); await expect(page.getByRole('button', { name: 'Controlla di nuovo' })).toBeEnabled(); await expect(page.getByText('Nessun problema strutturale trovato.', { exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: /^Esamina.*W07/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Segna Ready', exact: true })).toBeEnabled();
  await page.evaluate((bytes) => window.NurseFlowF05.addCheckBlob(bytes, true), bytes); await page.getByRole('button', { name: 'Controlla di nuovo' }).click(); await expect(page.getByRole('button', { name: 'Controlla di nuovo' })).toBeEnabled(); await expect(page.getByRole('button', { name: /^Esamina.*W07/ })).toHaveCount(1); await expect(page.getByRole('button', { name: /Correggi.*P12/ })).toHaveCount(0);
  await page.evaluate((bytes) => window.NurseFlowF05.addCheckBlob(bytes.slice(0, 24)), bytes); await page.getByRole('button', { name: 'Controlla di nuovo' }).click(); await expect(page.getByRole('button', { name: 'Controlla di nuovo' })).toBeEnabled(); await expect(page.getByRole('button', { name: /^Esamina.*W07/ })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Segna Ready', exact: true })).toBeEnabled();
});

for (const scale of [4, 13, 30, 48]) test(`320px scala ${scale}: lista, conferma, tastiera senza overflow`, async ({ page }, testInfo) => {
  await configure(page, 'warnings'); await page.setViewportSize({ width: 320, height: 740 }); await page.goto('./#/settings'); await setScale(page, scale); await openCheck(page); await expectNoBleeding(page); await confirmation(page); await expectNoBleeding(page);
  await dialog(page).getByRole('checkbox').focus(); await page.keyboard.press('Space'); await expect(dialog(page).getByRole('checkbox')).toBeChecked(); await dialog(page).getByRole('button', { name: 'Segna Ready', exact: true }).focus(); await page.keyboard.press('Tab'); await expect(dialog(page).getByRole('button', { name: 'Chiudi', exact: true })).toBeFocused();
  if (scale === 13 && testInfo.project.name === 'chromium') await page.screenshot({ path: 'docs/reports/assets/F08-confirm-320px.png', fullPage: true });
  await page.keyboard.press('Escape'); await expect(dialog(page)).toHaveCount(0);
});

for (const width of [390, 768]) test(`Check ${width}px: lingua EN e testo authored invariato`, async ({ page }, testInfo) => {
  await configure(page, 'warnings'); await page.setViewportSize({ width, height: 900 }); await expectNoBleeding(page);
  if (testInfo.project.name === 'chromium') await page.screenshot({ path: `docs/reports/assets/F08-check-${width}px.png`, fullPage: true });
  await page.goto('./#/settings'); await page.getByRole('button', { name: 'Lingua Italiano', exact: true }).click(); await page.getByRole('radio', { name: 'English', exact: true }).check(); await expect(dialog(page).getByRole('heading', { name: 'Language', exact: true })).toBeVisible(); await dialog(page).getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto('./#/build/procedure/check'); await expect(page.getByRole('heading', { name: 'Check procedure', exact: true })).toBeVisible(); await expect(page.getByText(/Esempio procedure/)).toBeVisible(); await expect(page.getByRole('button', { name: /Inspect.*W08.*Revisione comune/ })).toBeVisible();
  await page.getByRole('button', { name: 'Mark Ready', exact: true }).click(); await expect(dialog(page).getByText('A path may stop if reached. A missing connection is not an authored End.', { exact: true })).toBeVisible(); await expect(dialog(page).getByRole('checkbox', { name: 'I have reviewed this procedure for my own use.', exact: true })).toBeVisible(); await expectNoBleeding(page);
});
