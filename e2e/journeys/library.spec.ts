import { expect, test } from '@playwright/test';
import { attachLibraryHarness, completeSetup, seedLibrary } from '../fixtures/library';
import { expectNoBleeding, setScale } from '../fixtures/ui';

test('First Launch una volta sola, lingua persistente e link alla futura 11B', async ({ page }) => {
  await page.goto('./'); await expect(page).toHaveURL(/#\/setup$/);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('link', { name: 'Import Backup', exact: true }).click();
  await expect(page).toHaveURL(/#\/data\/app$/);
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Procedures', exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Procedures', exact: true })).toBeVisible();
  await page.goto('./#/setup'); await expect(page).toHaveURL(/#\/library$/);
});

test('Start non attende la permission di persistenza e non promette conservazione', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'storage', { value: { persist: () => new Promise<boolean>(() => {}), persisted: () => Promise.resolve(false) } });
  });
  await completeSetup(page);
  await expect(page.getByText(/concessa|sicuro|garantit/i)).toHaveCount(0);
  await expect(page.getByTestId('recent-strip')).toHaveCount(0);
});

for (const outcome of ['granted', 'denied', 'unsupported', 'error'] as const) test(`persistenza ${outcome}: navigazione e stato veritiero`, async ({ page }) => {
  await page.addInitScript((outcome) => {
    // Replace the manager, rather than one transient WebKit StorageManager wrapper.
    Object.defineProperty(navigator, 'storage', { value: {
      persist: outcome === 'unsupported' ? undefined : () => outcome === 'error' ? Promise.reject(new Error('Denied')) : Promise.resolve(outcome === 'granted'),
      persisted: outcome === 'unsupported' ? undefined : () => outcome === 'error' ? Promise.reject(new Error('Unavailable')) : Promise.resolve(outcome === 'granted'),
    } });
  }, outcome);
  await completeSetup(page); await page.goto('./#/settings');
  await page.getByRole('button', { name: /^Protezione archivio/ }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toHaveText(outcome === 'granted' ? 'Concessa' : outcome === 'denied' ? 'Non concessa' : outcome === 'error' ? 'Non disponibile' : 'Non supportata');
});

test('browser locale non supportato usa English', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'languages', { value: ['fr-FR'] }); });
  await page.goto('./'); await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
});

test('storage indisponibile blocca il primo avvio, Retry riapre senza cancellare dati', async ({ page }) => {
  await page.addInitScript(() => {
    const original = indexedDB.open.bind(indexedDB);
    Object.defineProperty(window, 'restoreIndexedDB', { value: () => { indexedDB.open = original; } });
    indexedDB.open = () => { throw new DOMException('Storage disabled', 'SecurityError'); };
  });
  await page.goto('./'); await expect(page.getByRole('alert')).toContainText('IndexedDB deve essere accessibile');
  await expect(page.getByRole('button', { name: 'Inizia', exact: true })).toHaveCount(0);
  await page.evaluate(() => { const restore = Reflect.get(window, 'restoreIndexedDB') as () => void; restore(); });
  await page.getByRole('button', { name: 'Riprova', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Inizia', exact: true })).toBeVisible();
});

test('selezione, ricerca su alias/gruppo/tag, preferiti e priorità non alterano i recenti', async ({ page, context }) => {
  await seedLibrary(page); await attachLibraryHarness(page);
  const before = await page.evaluate(() => window.NurseFlowF03.inspectLibrary());
  const requests: string[] = []; page.on('request', (request) => requests.push(request.url()));
  await context.setOffline(true);
  await page.getByRole('searchbox', { name: 'Cerca procedure' }).fill('MATERIALI BLU sinonimo');
  await expect(page.getByTestId('library-scroll').getByRole('button', { name: 'Cartoncini àlfa', exact: true })).toBeVisible();
  await expect(page.getByTestId('library-scroll').locator('.nf-procedure-row')).toHaveCount(1);
  await expect(page.getByTestId('recent-strip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Rimuovi Cartoncini àlfa dalle preferite', exact: true }).click();
  await page.getByRole('button', { name: 'Cancella ricerca', exact: true }).click();
  await page.getByRole('button', { name: 'Preferite', exact: true }).click();
  await expect(page.getByText('Nessun risultato', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancella filtri', exact: true }).click();
  await page.getByLabel('Vista', { exact: true }).selectOption('priority');
  await expect(page.getByTestId('library-scroll').locator('.nf-procedure-row').first()).toHaveAttribute('data-procedure-id', 'fixture-20');
  await page.getByRole('button', { name: 'Filtri', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Filtri', exact: true });
  await dialog.getByRole('checkbox', { name: 'Materiali', exact: true }).check();
  await dialog.getByRole('checkbox', { name: 'blu', exact: true }).check();
  await dialog.getByRole('searchbox', { name: 'Cerca etichette', exact: true }).fill('bl');
  await expect(dialog.getByRole('checkbox', { name: 'rosso', exact: true })).toHaveCount(0);
  await dialog.getByRole('radio', { name: 'Priorità 2', exact: true }).check();
  await dialog.getByRole('button', { name: 'Fine', exact: true }).click();
  const rows = page.getByTestId('library-scroll').locator('.nf-procedure-row');
  await expect(rows).toHaveCount(4);
  const after = await page.evaluate(() => window.NurseFlowF03.inspectLibrary());
  expect(after.procedures.map((procedure) => procedure.lastOpenedAt)).toEqual(before.procedures.map((procedure) => procedure.lastOpenedAt));
  expect(requests).toEqual([]);
});

test('ritorno da Details mantiene ricerca, filtri, scroll e registra solo l’apertura vera', async ({ page }) => {
  await seedLibrary(page); await page.getByLabel('Vista', { exact: true }).selectOption('priority');
  await page.getByRole('searchbox', { name: 'Cerca procedure' }).fill('fittizia');
  const pane = page.getByTestId('library-scroll'); await pane.evaluate((element) => { element.scrollTop = 250; });
  const scroll = await pane.evaluate((element) => element.scrollTop);
  // Click one visible row without changing the preserved list scroll first.
  const id = await pane.evaluate((element) => {
    const top = element.getBoundingClientRect().top;
    return [...element.querySelectorAll<HTMLElement>('[data-procedure-id]')].find((row) => row.getBoundingClientRect().top >= top)?.dataset.procedureId;
  });
  expect(id).toBeTruthy();
  await pane.locator(`[data-procedure-id="${id}"] .nf-procedure-open`).click();
  await expect(page.getByRole('region', { name: 'Dettagli procedura', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Torna alla libreria', exact: true }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('fittizia'); await expect(page.getByLabel('Vista', { exact: true })).toHaveValue('priority');
  await expect.poll(() => pane.evaluate((element) => element.scrollTop)).toBeCloseTo(scroll, 0);
  await attachLibraryHarness(page); const state = await page.evaluate(() => window.NurseFlowF03.inspectLibrary());
  expect(state.view?.recentProcedureIds[0]).toBe(id);
  await page.evaluate(() => window.NurseFlowF03.autosaveFixture());
  expect((await page.evaluate(() => window.NurseFlowF03.inspectLibrary())).view?.recentProcedureIds).toEqual(state.view?.recentProcedureIds);
});

test('gruppi: creazione/duplicato/rinomina/ordine/collapse e cancellazione conservano i membri', async ({ page }) => {
  await seedLibrary(page);
  await page.getByLabel('Vista', { exact: true }).selectOption('priority');
  await page.getByRole('button', { name: '+ Gruppo', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Nuovo gruppo', exact: true });
  await dialog.getByRole('textbox', { name: 'Nome gruppo' }).fill(' materiali ');
  await expect(dialog.getByText('Esiste già un gruppo con questo nome.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Crea', exact: true })).toBeDisabled();
  await dialog.getByRole('textbox').fill('Nuovo gruppo'); await dialog.getByRole('button', { name: 'Crea', exact: true }).click();
  await expect(page.getByRole('button', { name: /Nuovo gruppo \(0\)/ })).toBeFocused();
  await expect(page.getByLabel('Vista', { exact: true })).toHaveValue('groups');
  await page.getByRole('button', { name: 'Gestisci gruppo Nuovo gruppo', exact: true }).click();
  await page.getByRole('button', { name: 'Sposta su', exact: true }).click();
  await page.getByRole('button', { name: 'Gestisci gruppo Nuovo gruppo', exact: true }).click();
  await page.getByRole('button', { name: 'Rinomina', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Rinomina', exact: true });
  await dialog.getByRole('textbox').fill('Rinominato'); await dialog.getByRole('button', { name: 'Applica', exact: true }).click();
  await page.getByRole('button', { name: /Materiali \(13\)/ }).click();
  await attachLibraryHarness(page); await expect.poll(() => page.evaluate(async () => (await window.NurseFlowF03.inspectLibrary()).view?.collapsedGroupIds)).toContain('materials');
  await page.reload();
  await expect(page.getByRole('button', { name: /Materiali \(13\)/ })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Gestisci gruppo Materiali', exact: true }).click();
  await page.getByRole('button', { name: 'Elimina gruppo', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Elimina gruppo', exact: true });
  await expect(dialog.getByText('13 procedure saranno spostate in Senza gruppo.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Annulla', exact: true }).click();
  await expect(page.getByRole('button', { name: /Materiali \(13\)/ })).toBeVisible();
  await page.getByRole('button', { name: 'Gestisci gruppo Materiali', exact: true }).click();
  await page.getByRole('button', { name: 'Elimina gruppo', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Elimina gruppo', exact: true }).click();
  await expect(page.getByRole('button', { name: /Senza gruppo \(13\)/ })).toBeVisible();
  await attachLibraryHarness(page); const state = await page.evaluate(() => window.NurseFlowF03.inspectLibrary());
  expect(state.procedures).toHaveLength(26); expect(state.groups.map((group) => group.name)).toContain('Rinominato');
});

test('tre recenti su una riga, max20 overflow, collapse ed espansione persistenti', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 }); await seedLibrary(page);
  const strip = page.getByTestId('recent-strip'); const tiles = strip.locator('.nf-recent-tiles > button');
  await expect(tiles).toHaveCount(3);
  const boxes = await tiles.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect(); return { top: box.top, height: box.height };
  }));
  expect(new Set(boxes.map((box) => box.top)).size).toBe(1); expect(boxes.every((box) => box.height >= 48)).toBe(true);
  await expect(strip.locator('.nf-meta, .nf-priority, .nf-favorite')).toHaveCount(0);
  const browse = (await page.getByTestId('browse-area').boundingBox())!; const recent = (await strip.boundingBox())!;
  const library = (await page.getByTestId('library-pane').boundingBox())!;
  expect(recent.height / browse.height).toBeLessThanOrEqual(.201); expect(library.height / browse.height).toBeGreaterThanOrEqual(.799);
  await expectNoBleeding(page);
  await testInfo.attach('library-320px', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await page.getByRole('button', { name: 'Mostra fino a 20 recenti', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Recenti (20)', exact: true });
  await expect(dialog.locator('.nf-procedure-row')).toHaveCount(20); await expect(dialog.getByText('Procedura fittizia 21', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await page.getByRole('button', { name: 'Comprimi recenti', exact: true }).click(); await expect(strip).toHaveCount(0);
  await page.reload(); await expect(strip).toHaveCount(0);
  await page.getByRole('button', { name: 'Espandi recenti', exact: true }).click(); await expect(strip).toBeVisible();
  await tiles.first().click(); await page.getByRole('link', { name: 'Torna alla libreria', exact: true }).click();
  await page.getByLabel('Vista', { exact: true }).selectOption('recent'); await expect(strip).toHaveCount(0);
});

for (const scale of [4, 13, 30, 48]) test(`Library 320px a ${scale}pt, controlli raggiungibili e nessun overflow`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await seedLibrary(page);
  await page.goto('./#/settings'); await setScale(page, scale);
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await page.getByRole('link', { name: 'Indietro', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Procedure', exact: true })).toBeVisible(); await expectNoBleeding(page);
  if (scale >= 30) expect(await page.locator('.nf-recent-tiles').evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await page.getByRole('button', { name: '+ Gruppo', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Nuovo gruppo', exact: true })).toBeVisible(); await expectNoBleeding(page);
});

test('ricerca nei passaggi opzionale e stato Ready con filtri persistenti dopo Details', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await seedLibrary(page); await page.getByRole('searchbox', { name: 'Cerca procedure' }).fill('colore cartoncino');
  await expect(page.getByText('Nessun risultato', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Filtri', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Filtri', exact: true });
  await dialog.getByRole('checkbox', { name: 'Includi contenuto dei passaggi', exact: true }).check();
  await dialog.getByRole('radio', { name: 'Ready', exact: true }).check();
  await dialog.getByRole('button', { name: 'Fine', exact: true }).click();
  await expect(page.getByTestId('library-scroll').locator('.nf-procedure-row')).toHaveCount(9);
  const pane = page.getByTestId('library-scroll'); await pane.evaluate((element) => { element.scrollTop = 200; });
  const scroll = await pane.evaluate((element) => element.scrollTop); expect(scroll).toBeGreaterThan(0);
  const id = await pane.evaluate((element) => {
    const top = element.getBoundingClientRect().top;
    return [...element.querySelectorAll<HTMLElement>('[data-procedure-id]')].find((row) => row.getBoundingClientRect().top >= top)?.dataset.procedureId;
  });
  await pane.locator(`[data-procedure-id="${id}"] .nf-procedure-open`).click();
  await page.getByRole('link', { name: 'Torna alla libreria', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Cerca procedure' })).toHaveValue('colore cartoncino');
  await expect(page.getByTestId('library-scroll').locator('.nf-procedure-row')).toHaveCount(9);
  await expect.poll(() => pane.evaluate((element) => element.scrollTop)).toBeCloseTo(scroll, 0);
});

test('errore quota nel preferito conserva la stella e Retry commette una sola modifica', async ({ page }) => {
  await seedLibrary(page); await page.getByRole('searchbox', { name: 'Cerca procedure' }).fill('alfa');
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'procedures') { IDBObjectStore.prototype.put = original; throw new DOMException('Quota fixture', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  });
  const star = page.getByRole('button', { name: 'Rimuovi Cartoncini àlfa dalle preferite', exact: true });
  await star.click(); await expect(page.getByRole('alert')).toContainText('Modifica non salvata'); await expect(star).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Riprova', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aggiungi Cartoncini àlfa alle preferite', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('alert')).toHaveCount(0); await page.reload();
  await expect(page.getByRole('button', { name: 'Aggiungi Cartoncini àlfa alle preferite', exact: true })).toBeVisible();
});
