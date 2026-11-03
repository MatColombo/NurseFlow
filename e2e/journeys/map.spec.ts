import { expect, test, type Page } from '@playwright/test';
import { attachRunHarness, runState, setupRun } from '../fixtures/run';
import { expectNoBleeding, setScale } from '../fixtures/ui';

const map = (page: Page) => page.locator('.nf-map-page');
const canvas = (page: Page) => page.getByRole('region', { name: 'Mappa della procedura', exact: true });
async function openMap(page: Page) {
  await page.getByRole('button', { name: 'Mappa', exact: true }).click(); await expect(map(page)).toBeVisible();
  await expect(canvas(page)).toHaveAttribute('data-camera-initialized', 'true');
}
async function list(page: Page) { await page.getByRole('button', { name: 'Lista', exact: true }).click(); await expect(page.getByRole('list', { name: 'Lista dei passi' })).toBeVisible(); }
async function forbidWrites(page: Page) {
  await page.evaluate(() => {
    for (const method of ['put', 'add', 'delete', 'clear'] as const) {
      const original = IDBObjectStore.prototype[method];
      Object.defineProperty(IDBObjectStore.prototype, method, { configurable: true, value: function (this: IDBObjectStore, ...args: unknown[]) {
        if (['runSessions', 'previewSessions', 'revisions', 'procedures', 'uiPreferences', 'builderStates', 'mediaAssets'].includes(this.name)) throw new Error('F11 forbidden write: ' + this.name);
        return Reflect.apply(original, this, args);
      } });
    }
  });
}
test('F11 E08 run inspection, canonical convergence, notes, List references and browser Back preserve every durable byte', async ({ page }) => {
  await setupRun(page); await page.getByRole('button', { name: 'A', exact: true }).click(); await page.getByRole('button', { name: 'Continua', exact: true }).click();
  const before = await runState(page); await forbidWrites(page); await openMap(page);
  await expect(map(page)).toHaveAttribute('data-current-node', 'shared');
  await expect(page.locator('[data-map-node="shared"]')).toHaveCount(1);
  await expect(page.locator('path[data-target="shared"]')).toHaveCount(2);
  await expect(page.locator('[data-map-node="a-step"]')).toHaveAttribute('data-route-state', 'visited');
  await expect(page.locator('[data-map-node="b-step"]')).not.toHaveAttribute('data-route-state', 'visited');
  await list(page); await expect(page.locator('[data-map-row="shared"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Riferimento a Revisione comune/ })).toHaveCount(2);
  await page.getByRole('button', { name: /Riferimento a Revisione comune/ }).first().click();
  await expect(page.getByRole('button', { name: 'Esamina Revisione comune', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Esamina Scelta dimostrativa' }).click(); const sheet = page.getByRole('dialog', { name: 'Decisione', exact: true });
  await expect(sheet.getByRole('heading', { name: 'Percorso A o B?' })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Nascondi nota' })).toHaveAttribute('aria-expanded', 'true'); await sheet.getByText('ⓘ Nota di A', { exact: true }).click();
  await expect(sheet.getByText('Informazione A authored', { exact: true })).toBeVisible(); await expect(sheet.getByText('Avviso B essenziale authored', { exact: true })).toBeVisible();
  await expect(sheet.getByRole('button', { name: /^(Continua|A|B|Modifica|Termina)/ })).toHaveCount(0);
  expect((await runState(page))).toEqual(before);
  await page.goBack(); await expect(sheet).not.toBeVisible(); await expect(page).toHaveURL(/\/map\?/);
  await expect(page.getByRole('button', { name: 'Esamina Scelta dimostrativa' })).toBeFocused();
  await page.goBack(); await expect(page.locator('[data-step-content="shared"]')).toBeVisible(); await expect(page.getByRole('button', { name: 'Mappa', exact: true })).toBeFocused();
  expect(await runState(page)).toEqual(before);
});

test('F11 Back/cambio risposta removes cached or abandoned highlights and reload keeps the exact current path', async ({ page }) => {
  await setupRun(page); await page.getByRole('button', { name: 'A', exact: true }).click(); await page.getByRole('button', { name: 'Continua', exact: true }).click();
  await page.getByRole('button', { name: 'Indietro', exact: true }).click(); await page.getByRole('button', { name: 'Indietro', exact: true }).click();
  await openMap(page); await expect(page.locator('[data-map-node="shared"]')).not.toHaveAttribute('data-route-state', 'visited');
  await expect(page.locator('path[data-source="decision"][data-visited="true"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Indietro al passo' }).click(); await page.getByRole('button', { name: 'B', exact: true }).click();
  const before = await runState(page); await openMap(page); await page.reload(); await expect(canvas(page)).toHaveAttribute('data-camera-initialized', 'true');
  await expect(page.locator('[data-map-node="b-step"]')).toHaveAttribute('data-route-state', 'current');
  await expect(page.locator('[data-map-node="a-step"]')).not.toHaveAttribute('data-route-state', 'visited');
  await expect(page.locator('path[data-source="decision"][data-target="b-step"]')).toHaveAttribute('data-visited', 'true'); expect(await runState(page)).toEqual(before);
  await page.getByRole('link', { name: 'Indietro al passo' }).click(); await page.reload(); await expect(page.locator('[data-step-content="b-step"]')).toBeVisible(); expect(await runState(page)).toEqual(before);
});

test('F11 Details Resume and Map share the old pinned Ready; confirmed Exit exposes the latest Ready over a Draft', async ({ page }) => {
  await setupRun(page); const old = await runState(page); await page.evaluate(() => window.NurseFlowF10.publishNewReady());
  const published = await runState(page); await openMap(page); await list(page); await page.getByRole('button', { name: 'Esamina Scelta dimostrativa' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Percorso A o B?' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.getByRole('link', { name: 'Indietro al passo' }).click(); expect((await runState(page)).runs).toEqual(old.runs);
  await page.goto('./#/procedure/procedure'); await page.getByRole('button', { name: 'Vedi mappa', exact: true }).click();
  await expect(map(page)).toHaveAttribute('data-revision-id', old.runs[0]!.pinnedRevisionId); await list(page);
  await expect(page.getByRole('button', { name: 'Vai al corrente' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Esamina Scelta dimostrativa' }).click(); await expect(page.getByRole('dialog').getByRole('heading', { name: 'Percorso A o B?' })).toBeVisible();
  expect((await runState(page)).runs).toEqual(old.runs);
  await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.getByRole('link', { name: 'Indietro ai dettagli', exact: true }).click();
  await page.getByRole('button', { name: 'Riprendi', exact: true }).click(); await expect(page).toHaveURL(new RegExp('/run/' + old.runs[0]!.id + '$'));
  await page.getByRole('button', { name: 'Esci', exact: true }).click(); await page.getByRole('button', { name: 'Esci dall’esecuzione', exact: true }).click();
  await page.getByRole('button', { name: 'Vedi mappa', exact: true }).click(); await expect(map(page)).toHaveAttribute('data-revision-id', published.procedure!.readyRevisionId!);
});

test('F11 incomplete Draft shows unassigned, broken and dangling paths; view creates no run or edits', async ({ page }) => {
  await page.goto('./#/settings'); await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible(); await attachRunHarness(page);
  await page.evaluate(async () => { await window.NurseFlowF10.seedRun('preview'); await window.NurseFlowF10.prepareMapDraft(); });
  await page.goto('./#/procedure/procedure/map?revision=draft');
  const before = await runState(page); await expect(map(page)).toHaveAttribute('data-revision-state', 'working-draft'); await expect(page.getByText('Bozza', { exact: true })).toBeVisible();
  await list(page); await expect(page.getByText('→ Non collegato', { exact: true })).toBeVisible();
  await expect(page.getByText(/^→ W08 · Percorso non disponibile/)).toHaveCount(2);
  await page.getByRole('button', { name: 'Esamina Percorso B' }).click(); await expect(page.getByRole('dialog').getByText('Testo fittizio B', { exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.getByRole('link', { name: 'Indietro ai dettagli' }).click();
  expect(await runState(page)).toEqual(before);
});

test('F11 AND pending/completed states inspect independently, no completion gate or branch controls', async ({ page }) => {
  await setupRun(page, 'and'); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await page.getByRole('button', { name: /^Blu/ }).click();
  const before = await runState(page); await forbidWrites(page); await openMap(page); await list(page);
  await expect(page.locator('[data-map-row="tasks"]')).toContainText('1/2 completate'); await expect(page.locator('[data-map-row="tasks"]')).toContainText('Completata');
  await page.getByRole('button', { name: 'Esamina Lavori dimostrativi' }).click(); const sheet = page.getByRole('dialog');
  await expect(sheet.getByText('Tutte le attività richieste')).toBeVisible(); await expect(sheet.getByRole('button', { name: /Cambia|Riapri|Termina|Continua|Edit|Join|ALL/ })).toHaveCount(0);
  await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.getByRole('button', { name: 'Vai al corrente' }).click(); await expect(page.getByRole('button', { name: 'Esamina Operazione 2' })).toBeFocused();
  await page.getByRole('link', { name: 'Indietro al passo' }).click(); expect(await runState(page)).toEqual(before);
});

test('F11 End and W08 interruption remain distinct across Map and context Back', async ({ page }) => {
  await setupRun(page, 'broken'); await page.getByRole('button', { name: 'A', exact: true }).click(); await page.getByRole('button', { name: 'Continua', exact: true }).click(); await page.getByRole('button', { name: 'Continua', exact: true }).click();
  const before = await runState(page); await openMap(page); await list(page); await expect(page.getByText('→ W08 · Percorso non disponibile · Carta rimossa', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Indietro al passo' }).click(); await expect(page.getByRole('alert')).toContainText('W08'); await expect(page).not.toHaveURL(/\/end$/); expect(await runState(page)).toEqual(before);
});

test('F11 fit/zoom/pan/keyboard preserve camera through inspector and List; inspection works with network disabled', async ({ page, context }) => {
  await setupRun(page); const before = await runState(page); await openMap(page);
  const initialCamera = await canvas(page).evaluate((node) => [node.getAttribute('data-camera-x'), node.getAttribute('data-camera-y'), node.getAttribute('data-camera-zoom')]);
  await canvas(page).getByRole('button', { name: 'Esamina Scelta dimostrativa' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click();
  expect(await canvas(page).evaluate((node) => [node.getAttribute('data-camera-x'), node.getAttribute('data-camera-y'), node.getAttribute('data-camera-zoom')])).toEqual(initialCamera);
  await page.getByRole('button', { name: 'Aumenta zoom' }).click(); const zoom = await canvas(page).getAttribute('data-camera-zoom');
  const box = await canvas(page).boundingBox(); if (!box) throw new Error('Canvas missing');
  await page.mouse.move(box.x + 12, box.y + 30); await page.mouse.down(); await page.mouse.move(box.x + 70, box.y + 70, { steps: 5 }); await page.mouse.up();
  await canvas(page).focus(); await page.keyboard.press('ArrowRight'); const camera = await canvas(page).evaluate((node) => [node.getAttribute('data-camera-x'), node.getAttribute('data-camera-y'), node.getAttribute('data-camera-zoom')]);
  await context.setOffline(true); await list(page); await page.getByRole('button', { name: 'Esamina Scelta dimostrativa' }).click(); await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.getByRole('button', { name: 'Mappa', exact: true }).click();
  expect(await canvas(page).evaluate((node) => [node.getAttribute('data-camera-x'), node.getAttribute('data-camera-y'), node.getAttribute('data-camera-zoom')])).toEqual(camera);
  expect(await canvas(page).getAttribute('data-camera-zoom')).toBe(zoom);
  await page.getByRole('button', { name: 'Adatta' }).click(); await expect(canvas(page)).not.toHaveAttribute('data-camera-zoom', zoom!);
  await page.getByRole('button', { name: 'Corrente', exact: true }).click(); await expect(canvas(page)).toHaveAttribute('data-camera-zoom', '1');
  await context.setOffline(false); expect(await runState(page)).toEqual(before);
});

test('F11 Draft Preview reload reads its saved snapshot even after the working Draft is republished', async ({ page }) => {
  await setupRun(page, 'preview'); const initial = await runState(page);
  await page.evaluate(() => window.NurseFlowF10.publishNewReady()); const before = await runState(page);
  await openMap(page); await expect(page.getByText('ANTEPRIMA BOZZA', { exact: true })).toBeVisible(); await page.reload();
  await expect(canvas(page)).toHaveAttribute('data-camera-initialized', 'true'); await list(page);
  await page.getByRole('button', { name: 'Esamina Scelta dimostrativa' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Percorso A o B?' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click(); await forbidWrites(page);
  await page.getByRole('link', { name: 'Indietro al passo' }).click(); await expect(page.locator('[data-step-content="decision"]')).toBeVisible();
  expect(await runState(page)).toEqual(before); expect(before.previews).toEqual(initial.previews); expect(before.runs).toEqual([]);
});

for (const scale of [4, 48]) test(`F11 320px scale ${scale} Graph, 32 activities List, inspector and CTA stay accessible`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 }); await setupRun(page, 'many');
  await page.goto('./#/settings'); await setScale(page, scale); await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click();
  const saved = await runState(page); const run = saved.runs[0]!; await page.goto(`./#/run/${run.id}`); await expect(page.locator('[data-run-id]')).toBeVisible(); await openMap(page);
  await expectNoBleeding(page); const controls = page.getByRole('group', { name: 'Controlli Graph' });
  if (testInfo.project.name === 'chromium') await page.screenshot({ path: `test-results/F11-map-${scale}-graph.png`, fullPage: true });
  for (const button of await controls.getByRole('button').all()) { const box = await button.boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(48); expect(box!.height).toBeGreaterThanOrEqual(48); }
  await list(page); await expect(page.locator('[data-map-row]')).toHaveCount(35); await expectNoBleeding(page);
  if (testInfo.project.name === 'chromium') await page.screenshot({ path: `test-results/F11-map-${scale}-list.png`, fullPage: true });
  await page.getByRole('button', { name: 'Esamina Operazione 32', exact: true }).click(); await expect(page.getByRole('dialog').getByRole('heading', { name: 'Operazione 32', exact: true })).toBeVisible();
  await expectNoBleeding(page); await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click();
  await page.getByRole('button', { name: 'Vai al corrente' }).click(); await expect(page.getByRole('button', { name: 'Esamina Operazione 1', exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Indietro al passo' }).click(); expect((await runState(page)).runs).toEqual(saved.runs);
});

test('F11 Details return restores expanded metadata, favorite, scroll and Map focus without another open', async ({ page }) => {
  await setupRun(page); await page.evaluate(() => window.NurseFlowF10.prepareMapDetails());
  await page.goto('./#/procedure/procedure'); await expect(page.getByRole('heading', { name: 'Cartoncini dimostrativi', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Aggiungi .* alle preferite/ }).click();
  await page.getByRole('button', { name: '+2', exact: true }).click(); await page.getByRole('button', { name: 'Espandi', exact: true }).click();
  await page.getByRole('button', { name: 'Vedi mappa' }).scrollIntoViewIfNeeded(); const scroll = await page.evaluate(() => scrollY); expect(scroll).toBeGreaterThan(0);
  const before = await runState(page); await forbidWrites(page); await page.getByRole('button', { name: 'Vedi mappa' }).click(); await expect(map(page)).toBeVisible();
  await list(page); const listScroll = await page.locator('.nf-map-list').evaluate((node) => { node.scrollTop = node.scrollHeight; return node.scrollTop; });
  await page.getByRole('button', { name: 'Mappa', exact: true }).click(); await list(page);
  await expect.poll(() => page.locator('.nf-map-list').evaluate((node) => node.scrollTop)).toBe(listScroll);
  await page.getByRole('link', { name: 'Indietro ai dettagli' }).click(); await expect(page.getByRole('button', { name: 'Vedi mappa' })).toBeFocused();
  await expect(page.getByRole('button', { name: /Rimuovi .* dalle preferite/ })).toHaveAttribute('aria-pressed', 'true'); await expect(page.getByRole('button', { name: '#Cinque', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Meno', exact: true }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(scroll); expect(await runState(page)).toEqual(before);
});

test('F11 two-pointer pinch changes only camera and taps on an outcome inspect without choosing', async ({ page }) => {
  await setupRun(page); const before = await runState(page); await openMap(page); const viewport = canvas(page); const box = await viewport.boundingBox(); if (!box) throw new Error('Canvas missing');
  // Synthetic PointerEvents exercise the two-pointer geometry; browser capture requires native hardware pointers.
  await viewport.evaluate((node) => {
    const original = node.setPointerCapture.bind(node);
    node.setPointerCapture = (id) => { if (id !== 10 && id !== 11) original(id); };
  });
  const point = { pointerType: 'touch', isPrimary: true, button: 0, buttons: 1, clientX: box.x + 20, clientY: box.y + 30 };
  await viewport.dispatchEvent('pointerdown', { ...point, pointerId: 10 }); await viewport.dispatchEvent('pointerdown', { ...point, isPrimary: false, pointerId: 11, clientX: box.x + 100 });
  await viewport.dispatchEvent('pointermove', { ...point, isPrimary: false, pointerId: 11, clientX: box.x + 180 });
  await viewport.dispatchEvent('pointerup', { ...point, pointerId: 10, buttons: 0 }); await viewport.dispatchEvent('pointerup', { ...point, isPrimary: false, pointerId: 11, buttons: 0 });
  await expect(viewport).toHaveAttribute('data-camera-zoom', '2');
  await page.getByRole('button', { name: 'Corrente', exact: true }).click();
  await page.locator('[data-map-node="decision"] .nf-map-graph-port').first().click(); await expect(page.getByRole('dialog', { name: 'Decisione', exact: true })).toBeVisible();
  expect(await runState(page)).toEqual(before);
});

test.describe('F11 network failure without an installed cache', () => {
test.use({ serviceWorkers: 'block' });
test('F11 graph load failure keeps List available and missing revision offers Retry without changing pin', async ({ page }) => {
  await page.route('**/MapGraph-*.js', (route) => route.abort()); await setupRun(page); const before = await runState(page); await page.getByRole('button', { name: 'Mappa', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Grafico non disponibile'); await list(page); await page.getByRole('button', { name: 'Esamina Revisione comune' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Revisione comune' })).toBeVisible(); expect(await runState(page)).toEqual(before);
  await page.goto('./#/procedure/procedure/map?revision=missing'); await expect(page.getByRole('alert')).toContainText('Impossibile aprire la mappa'); await page.getByRole('button', { name: 'Riprova' }).click(); await expect(page.getByRole('alert')).toContainText('Impossibile aprire la mappa'); expect(await runState(page)).toEqual(before);
});
});
