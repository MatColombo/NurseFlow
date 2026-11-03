import { expect, test, type Page } from '@playwright/test';
import { attachRunHarness, runState, setupRun } from '../fixtures/run';
import { expectNoBleeding, setScale } from '../fixtures/ui';
const step = (page: Page) => page.locator('[data-step-content]');
const back = (page: Page) => page.locator('.nf-run-header').getByRole('button', { name: 'Indietro', exact: true });
async function chooseA(page: Page) { await page.getByRole('button', { name: 'A', exact: true }).click(); await expect(step(page)).toHaveAttribute('data-step-content', 'a-step'); }
async function reachEnd(page: Page) { await chooseA(page); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await expect(step(page)).toHaveAttribute('data-step-content', 'shared'); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await expect(page).toHaveURL(/\/end$/); await expect(page.getByText('Messaggio finale scritto dall’autore. Nessun risultato clinico automatico.', { exact: true })).toBeVisible(); }
test.setTimeout(90_000);

test('F10 one step, phase, dual galleries, independent notes and explicit decision; reload restores path', async ({ page }) => {
  await setupRun(page); await expect(page.getByText('PASSO 1 / 3', { exact: true })).toBeVisible(); await expect(page.getByText('Fase esempio', { exact: true })).toBeVisible();
  await expect(page.getByText('Avviso B essenziale authored', { exact: true })).toBeVisible(); await expect(page.getByText('W07 · Immagine non disponibile', { exact: true })).toHaveCount(2);
  const before = await runState(page); await page.getByRole('button', { name: 'Nota per: A', exact: true }).click(); await expect(page.getByText('Informazione A authored', { exact: true })).toBeVisible();
  await expect(page.getByText('Nota del passo authored', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nascondi nota', exact: true }).click(); await expect(page.getByText('Nota del passo authored', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mostra nota', exact: true }).click(); await expect(page.getByText('Nota del passo authored', { exact: true })).toBeVisible(); expect((await runState(page)).runs).toEqual(before.runs);
  await expect(step(page).locator('figcaption').first()).toHaveText(/^fig\.1 - /);
  await expect(step(page).locator('figcaption').last()).toHaveText(/^fig\.2 - /);
  expect(await step(page).locator('figcaption').first().evaluate((element) => getComputedStyle(element).fontStyle)).toBe('italic');
  expect(await page.locator('.nf-step-content').evaluate((element) => { const first = element.querySelector('[data-media-id="before"]')!; const note = [...element.querySelectorAll('p')].find((p) => p.textContent === 'Nota del passo authored')!; const last = element.querySelector('[data-media-id="after"]')!; return Boolean(first.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING) && Boolean(note.compareDocumentPosition(last) & Node.DOCUMENT_POSITION_FOLLOWING); })).toBe(true);
  await chooseA(page); await expect(page.getByRole('complementary', { name: 'PASSO PRECEDENTE' })).toContainText('Percorso A o B? · A'); await expect(step(page)).toHaveCount(1);
  const chosen = await runState(page); await page.reload(); await expect(step(page)).toHaveAttribute('data-step-content', 'a-step'); expect((await runState(page)).runs).toEqual(chosen.runs);
});
for (const [kind, label] of [['completed', 'Completata'], ['stopped', 'Interrotta'], ['escalation', 'Escalation'], ['neutral', 'Fine']] as const) test(`F10 ${kind} authored End, reload, Back, Restart confirmation and exact cleanup`, async ({ page }) => {
  await setupRun(page, 'or', kind); await reachEnd(page); await expect(page.locator('[data-end-kind]')).toHaveText(label); await expect(page.getByText('FINE · 3 passi', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Titolo finale authored', exact: true })).toBeFocused();
  await expect(page.getByText('Nota finale authored', { exact: true })).toBeVisible();
  const before = await runState(page); await page.reload(); await expect(page.locator('[data-end-kind]')).toHaveText(label); expect((await runState(page)).runs).toEqual(before.runs);
  await page.getByRole('button', { name: 'Ricomincia', exact: true }).click(); await page.getByRole('button', { name: 'Annulla', exact: true }).click(); expect((await runState(page)).runs).toEqual(before.runs);
  await back(page).click(); await expect(step(page)).toHaveAttribute('data-step-content', 'shared'); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await expect(page).toHaveURL(/\/end$/);
  await page.getByRole('button', { name: 'Torna alla libreria', exact: true }).click(); await expect(page).toHaveURL(/#\/library$/); const after = await runState(page); expect(after.runs).toEqual([]); expect(after.revisions).toEqual(before.revisions);
});
test('F10 AND switches independently, Done requires Reopen confirmation, and finish gates End', async ({ page }) => {
  await setupRun(page, 'and'); await page.getByRole('button', { name: /Cambia attività/ }).click();
  const before = await runState(page); await page.getByRole('button', { name: 'Chiudi', exact: true }).click(); expect((await runState(page)).runs).toEqual(before.runs);
  await page.getByRole('button', { name: /Cambia attività/ }).click(); await page.getByRole('button', { name: /Attività 2.*Non iniziata/ }).click(); await expect(step(page)).toHaveAttribute('data-step-content', 'task-2');
  await page.getByRole('button', { name: 'Termina questa attività', exact: true }).click(); await expect(step(page)).toHaveAttribute('data-step-content', 'task-1');
  await page.reload(); await expect(page.getByRole('button', { name: /Cambia attività/ })).toContainText('1/2 completate');
  await page.getByRole('button', { name: /Cambia attività/ }).click(); await page.getByRole('button', { name: /Attività 2.*Riapri attività/ }).click(); await expect(page.getByRole('dialog', { name: 'Riaprire l’attività?' })).toBeVisible();
  await page.getByRole('button', { name: 'Riapri attività', exact: true }).click(); await expect(step(page)).toHaveAttribute('data-step-content', 'task-2'); await page.getByRole('button', { name: 'Termina questa attività', exact: true }).click();
  await page.getByRole('button', { name: 'Continua', exact: true }).click(); await page.getByRole('button', { name: /^Blu(?:.*Termina questa attività)?$/ }).click(); await expect(page).toHaveURL(/\/end$/);
  const state = await runState(page); expect('tokens' in state.runs[0]! && state.runs[0].tokens.filter((t) => t.completed)).toHaveLength(2);
});
test('F10 authorized whole-procedure Stop and distinct W08 interruption', async ({ page }) => {
  await setupRun(page, 'stop'); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await page.getByRole('button', { name: /Termina intero esempio.*Termina l’intera procedura/ }).click();
  await expect(page).toHaveURL(/\/end$/); await expect(page.locator('[data-end-kind="escalation"]')).toBeVisible();
});
test('F10 W08 cannot become End or silently skip; reload and Back keep its provenance', async ({ page }) => {
  await setupRun(page, 'broken'); await chooseA(page); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await page.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Percorso interrotto', exact: true })).toBeFocused(); await expect(page.getByRole('alert')).toContainText('W08'); await expect(page.locator('[data-end-kind]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continua', exact: true })).toHaveCount(0); const before = await runState(page); await page.reload(); await expect(page.getByRole('alert')).toContainText('W08'); expect((await runState(page)).runs).toEqual(before.runs);
  await back(page).click(); await expect(step(page)).toHaveAttribute('data-step-content', 'shared');
});
test('F10 browser Back follows real route; first-step Back and Exit always confirm with Stay default', async ({ page }) => {
  await setupRun(page); await page.goBack(); await expect(page.getByRole('dialog', { name: 'Uscire dall’esecuzione?' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Resta', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Resta', exact: true }).click(); await chooseA(page); await page.goBack(); await expect(step(page)).toHaveAttribute('data-step-content', 'decision');
  await page.getByRole('button', { name: 'Esci', exact: true }).click(); const before = await runState(page); await page.keyboard.press('Escape'); expect((await runState(page)).runs).toEqual(before.runs);
  await page.getByRole('button', { name: 'Esci', exact: true }).click(); await page.getByRole('button', { name: 'Esci dall’esecuzione', exact: true }).click(); await expect(page).toHaveURL(/#\/procedure\/procedure$/); expect((await runState(page)).runs).toEqual([]);
});
test('F10 Map returns to pinned context and confirmed Restart uses the old Ready', async ({ page }) => {
  await setupRun(page); await reachEnd(page); const before = await runState(page); await attachRunHarness(page); await page.evaluate(() => window.NurseFlowF10.publishNewReady());
  await page.getByRole('button', { name: 'Mappa', exact: true }).click(); await expect(page.locator('[data-current-node="end"]')).toBeVisible(); await page.getByRole('link', { name: 'Indietro alla fine', exact: true }).click(); await expect(page).toHaveURL(/\/end$/); expect((await runState(page)).runs).toEqual(before.runs);
  await expect(page.getByRole('button', { name: 'Mappa', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Ricomincia', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Ricomincia', exact: true }).click();
  await expect(step(page)).toHaveAttribute('data-step-content', 'decision'); await expect(page.getByRole('heading', { name: 'Percorso A o B?', exact: true })).toBeVisible(); expect((await runState(page)).runs[0]?.pinnedRevisionId).toBe('ready');
});
test('F10 quota keeps the saved card and End; Retry commits once without false cleanup', async ({ page }) => {
  await setupRun(page); const before = await runState(page);
  await page.evaluate(() => { const original = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) { if (this.name === 'runSessions') { IDBObjectStore.prototype.put = original; throw new DOMException('quota-F10', 'QuotaExceededError'); } return original.apply(this, args); }; });
  await page.getByRole('button', { name: 'A', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Impossibile salvare'); await expect(step(page)).toHaveAttribute('data-step-content', 'decision'); expect((await runState(page)).runs).toEqual(before.runs);
  await page.getByRole('alert').getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(step(page)).toHaveAttribute('data-step-content', 'a-step'); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await expect(page).toHaveURL(/\/end$/);
  const ended = await runState(page); await page.evaluate(() => { const original = IDBObjectStore.prototype.delete; IDBObjectStore.prototype.delete = function (...args: Parameters<IDBObjectStore['delete']>) { if (this.name === 'runSessions') { IDBObjectStore.prototype.delete = original; throw new DOMException('quota-delete-F10', 'QuotaExceededError'); } return original.apply(this, args); }; });
  await page.getByRole('button', { name: 'Torna alla libreria', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Impossibile salvare'); expect((await runState(page)).runs).toEqual(ended.runs);
  await page.getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(page).toHaveURL(/#\/library$/); expect((await runState(page)).runs).toEqual([]);
});
test('F10 Draft Preview is explicit, separate, durable and blocks unassigned paths', async ({ page }) => {
  await setupRun(page, 'preview'); await expect(page.getByText('ANTEPRIMA BOZZA', { exact: true })).toBeVisible(); await expect(page.getByText('PASSO 1 / ?', { exact: true })).toBeVisible();
  await chooseA(page); await page.reload(); await expect(step(page)).toHaveAttribute('data-step-content', 'a-step'); const before = await runState(page);
  expect(before.runs).toEqual([]); expect(before.previews).toHaveLength(1); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('non è assegnato'); expect((await runState(page)).previews).toEqual(before.previews);
  await page.getByRole('button', { name: 'Esci', exact: true }).click(); await page.getByRole('button', { name: 'Esci dall’esecuzione', exact: true }).click();
  await expect(page).toHaveURL(/#\/procedure\/procedure$/); expect((await runState(page)).previews).toEqual([]); expect((await runState(page)).runs).toEqual([]);
});
test('F10 Alert remains visible with essential note and offline transitions in a loaded shell', async ({ page, context }) => {
  await setupRun(page, 'alert'); await context.setOffline(true); await chooseA(page); await page.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Avviso critico sempre leggibile.'); await expect(page.getByText('Nota essenziale', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continua', exact: true }).click(); await expect(page.locator('[data-end-kind]')).toBeVisible();
});
for (const scale of [13, 48]) test(`F10 320px/${scale}pt: all CTA reachable and 32 activities`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 700 }); await setupRun(page, 'many'); const runUrl = page.url();
  await page.goto('./#/settings'); await setScale(page, scale); await page.getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.goto(runUrl); await expect(step(page)).toBeVisible(); await expectNoBleeding(page);
  await page.getByRole('button', { name: /Cambia attività/ }).click(); await expectNoBleeding(page); const last = page.getByRole('button', { name: /Attività 32.*Non iniziata/ }); await last.scrollIntoViewIfNeeded(); await last.click(); await expect(step(page)).toHaveAttribute('data-step-content', 'task-32');
  await expectNoBleeding(page); const finish = page.getByRole('button', { name: 'Termina questa attività', exact: true }); await finish.scrollIntoViewIfNeeded(); expect((await finish.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await page.screenshot({ path: testInfo.outputPath('run-320.png'), fullPage: true }); await finish.click(); await expect(step(page)).toHaveAttribute('data-step-content', 'task-1');
});
test('F10 route length range becomes exact after an explicit answer', async ({ page }) => {
  await setupRun(page, 'range'); await expect(page.getByText('PASSO 1 / 2–3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'B', exact: true }).click(); await expect(page.getByText('PASSO 2 / 2', { exact: true })).toBeVisible();
});
test('F10 stale window cannot overwrite another choice; reloading restores the durable route', async ({ page }) => {
  await setupRun(page); await attachRunHarness(page); await page.evaluate(() => window.NurseFlowF10.externalChoice());
  await page.getByRole('button', { name: 'A', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('altra finestra');
  await page.getByRole('button', { name: 'Rileggi progresso', exact: true }).click(); await expect(step(page)).toHaveAttribute('data-step-content', 'b-step');
});
test('F10 long End at 320px/48pt remains complete with reachable handoff and Resume from Details', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 700 }); await setupRun(page, 'long'); const runUrl = page.url();
  await page.goto('./#/settings'); await setScale(page, 48); await page.getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.goto(runUrl);
  await chooseA(page); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await expect(page).toHaveURL(/\/end$/); await expectNoBleeding(page);
  const message = page.locator('.nf-step-content > p.nf-authored'); await expect(message).toHaveText('Messaggio finale authored completo. '.repeat(40) + 'Ultima frase authored.');
  const library = page.getByRole('button', { name: 'Torna alla libreria', exact: true }); await library.scrollIntoViewIfNeeded(); await expect(library).toBeInViewport(); expect((await library.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await page.screenshot({ path: info.outputPath('end-320-48pt.png') }); await page.goto('./#/procedure/procedure'); await page.getByRole('button', { name: 'Riprendi', exact: true }).click(); await expect(page).toHaveURL(/\/end$/); await expect(message).toHaveText('Messaggio finale authored completo. '.repeat(40) + 'Ultima frase authored.');
});
