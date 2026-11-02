import { expect, test as base, type Page } from '@playwright/test';
import { attachBuilderHarness, readBuilder, setupBuilder } from '../fixtures/builder';
import { graphNode, graphSurface, locateGraphNode, pickGraphNode } from '../fixtures/graph';
import { expectNoBleeding, setScale } from '../fixtures/ui';
// Same disk-backed isolation as storage.spec: Windows WebKit's private context
// rejects even native IDB Blob writes (F01). No application storage workaround.
const test = base.extend({
  context: async ({ playwright, browserName, baseURL, headless, locale }, use) => {
    const context = await playwright[browserName].launchPersistentContext('', { headless,
      ...(baseURL ? { baseURL } : {}), ...(locale ? { locale } : {}),
    });
    try { await use(context); } finally { await context.close(); }
  },
});
const dialog = (page: Page) => page.getByRole('dialog');
async function openEditor(page: Page, node = 'shared', id = 'procedure') {
  await page.goto('./#/build/' + id + '/step/' + node); await expect(page.getByRole('heading', { name: 'Editor passaggio', exact: true })).toBeVisible();
  await expect(page.locator('[data-node-id]')).toHaveAttribute('data-node-id', node);
}
async function records(page: Page, id = 'procedure') { await attachBuilderHarness(page); return page.evaluate((id) => window.NurseFlowF05.readEditor(id), id); }
async function done(page: Page) { await page.getByRole('button', { name: 'Fine', exact: true }).click(); await expect(page.getByRole('toolbar', { name: 'Strumenti Builder', exact: true })).toBeVisible(); }
async function expand(page: Page, label: RegExp) { const summary = page.locator('summary').filter({ hasText: label }); if (!(await summary.locator('..').evaluate((element) => (element as HTMLDetailsElement).open))) await summary.click(); }
async function softLimit(page: Page, enabled: boolean) {
  await page.goto('./#/settings'); await page.getByRole('button', { name: /^Limite nuove aggiunte/ }).click(); const checkbox = page.getByRole('checkbox', { name: 'Limita nuovi media per passaggio', exact: true });
  await expect(checkbox).toBeVisible(); if (await checkbox.isChecked() !== enabled) await checkbox.click(); await expect.poll(async () => (await records(page)).settings?.mediaAddSoftLimit.enabled).toBe(enabled);
  await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click();
}
async function addPhoto(page: Page, slot: 'before-note' | 'after-note', caption: string) {
  await expand(page, /^Media/); await page.locator(`[data-editor-gallery="${slot}"]`).getByRole('button', { name: 'Aggiungi foto', exact: true }).click();
  const png = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 2600; canvas.height = 800; const context = canvas.getContext('2d')!;
    context.fillStyle = '#f3f8fa'; context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = '#076e79'; context.font = '80px sans-serif'; context.fillText('Cartoncino dimostrativo 123', 80, 200); return canvas.toDataURL('image/png').split(',')[1]!; });
  await dialog(page).getByLabel('Scegli immagine locale', { exact: true }).setInputFiles({ name: caption + '.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(dialog(page).locator('output')).toContainText('1280 × 394'); await expectNoBleeding(page); await dialog(page).getByRole('textbox', { name: 'Didascalia', exact: true }).fill(caption);
  await dialog(page).getByRole('textbox', { name: 'Descrizione alternativa', exact: true }).fill('Testo ' + caption);
  await dialog(page).getByRole('button', { name: 'Aggiungi', exact: true }).click(); await expect(dialog(page)).toHaveCount(0);
}

test('Instruction: testo, nota, fase e Done attende il commit; reload e Ready indipendente', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page); await openEditor(page);
  await page.getByRole('textbox', { name: 'Titolo breve', exact: true }).fill('Titolo autore'); await page.getByRole('textbox', { name: 'Testo istruzione', exact: true }).fill('Prima riga\nSeconda riga');
  await expand(page, /^Nota del passaggio/); await page.getByRole('textbox', { name: 'Testo della nota', exact: true }).fill('Nota personale'); await page.getByRole('combobox', { name: 'Nota del passaggio', exact: true }).selectOption('always-visible');
  await page.getByRole('button', { name: '+ Nuova fase', exact: true }).click(); await dialog(page).getByRole('textbox', { name: 'Nome fase', exact: true }).fill('Fase autore'); await dialog(page).getByRole('button', { name: 'Fine', exact: true }).click();
  await expect(dialog(page)).toHaveCount(0); await expect(page.getByRole('button', { name: /^Salva/ })).toHaveCount(0); await done(page);
  const saved = await readBuilder(page); expect(saved.ready).toEqual(before.ready); expect(saved.procedure.lastOpenedAt).toBe(before.procedure.lastOpenedAt);
  await openEditor(page); await page.reload(); await expect(page.getByRole('textbox', { name: 'Testo istruzione', exact: true })).toHaveValue('Prima riga\nSeconda riga');
  await expect(page.getByRole('textbox', { name: 'Testo della nota', exact: true })).toHaveValue('Nota personale'); await expect(page.getByRole('combobox', { name: 'Fase', exact: true })).toHaveValue(saved.revision.graph.phases.at(-1)!.id);
});

test('Decision: Outcome editor solo answer/nota/path, F06 cambia solo B e ritorna allo stesso outcome', async ({ page }) => {
  await setupBuilder(page); await openEditor(page, 'decision'); const before = await readBuilder(page);
  await page.getByRole('button', { name: 'Modifica risposta: B', exact: true }).click(); await expect(dialog(page).getByRole('textbox')).toHaveCount(2); await expect(dialog(page).getByRole('combobox')).toHaveCount(0);
  await expect(dialog(page).getByRole('button', { name: 'Riordina risposte', exact: true })).toHaveCount(0);
  await dialog(page).getByRole('textbox', { name: 'Risposta', exact: true }).fill('B autore'); await dialog(page).getByRole('textbox', { name: 'Nota della risposta', exact: true }).fill('Nota soltanto B');
  await dialog(page).getByRole('button', { name: 'Cambia percorso: B autore', exact: true }).click(); await expect(graphSurface(page)).toBeVisible();
  await locateGraphNode(page, 'Scelta dimostrativa'); await expect(graphNode(page, 'decision').getByRole('button', { name: 'Scegli destinazione: Scelta dimostrativa', exact: true })).toBeDisabled();
  await pickGraphNode(page, 'Esempio terminato'); await expect(dialog(page)).toContainText('Prima: Percorso B'); await expect(dialog(page)).toContainText('Dopo: Esempio terminato');
  await dialog(page).getByRole('button', { name: 'Applica modifica', exact: true }).click(); await expect(dialog(page).getByRole('textbox', { name: 'Risposta', exact: true })).toHaveValue('B autore');
  await expect(dialog(page)).toContainText('Percorso: Esempio terminato'); const saved = await readBuilder(page); const node = saved.revision.graph.nodes.find((node) => node.id === 'decision');
  expect(node).toMatchObject({ outcomes: [expect.objectContaining({ id: 'a', destination: { kind: 'node', nodeId: 'a-step' } }), expect.objectContaining({ id: 'b', destination: { kind: 'node', nodeId: 'end' }, note: expect.objectContaining({ text: 'Nota soltanto B' }) })] });
  expect(saved.revision.graph.nodes).toHaveLength(before.revision.graph.nodes.length); expect(saved.ready).toEqual(before.ready);
});

test('Arrange cambia solo ordine, Undo/Redo Builder conserva ID/note/destinazioni', async ({ page }) => {
  await setupBuilder(page); await openEditor(page, 'decision'); const before = await readBuilder(page);
  await page.getByRole('button', { name: 'Riordina risposte', exact: true }).click(); await dialog(page).locator('[data-arrange-outcome="b"]').getByRole('button', { name: 'Sposta su', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).click(); await done(page); const changed = await readBuilder(page);
  const decision = changed.revision.graph.nodes.find((node) => node.id === 'decision'); expect(decision).toMatchObject({ outcomes: [expect.objectContaining({ id: 'b', order: 0, destination: { kind: 'node', nodeId: 'b-step' } }), expect.objectContaining({ id: 'a', order: 1 })] });
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click(); await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await page.getByRole('button', { name: 'Ripeti modifica', exact: true }).click(); await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(changed.revision.graph);
});

test('media: upload reale, due gallerie, move/reorder/replace oltre soft cap; Blob e objectURL senza perdite', async ({ page }) => {
  test.setTimeout(180_000); // Four real image imports plus Blob/hash checks in Windows WebKit.
  await setupBuilder(page); await softLimit(page, false); await openEditor(page);
  await page.evaluate(() => { const active: string[] = []; Object.assign(window, { F07Urls: active }); const create = URL.createObjectURL; const revoke = URL.revokeObjectURL;
    URL.createObjectURL = (blob) => { const url = create.call(URL, blob); active.push(url); return url; }; URL.revokeObjectURL = (url) => { const index = active.indexOf(url); if (index >= 0) active.splice(index, 1); revoke.call(URL, url); }; });
  await addPhoto(page, 'before-note', 'Prima uno'); await addPhoto(page, 'before-note', 'Prima due'); await addPhoto(page, 'after-note', 'Dopo uno'); await addPhoto(page, 'after-note', 'Dopo due');
  const before = await records(page); expect(before.assets).toHaveLength(4); expect(before.assets.every((asset) => asset.sha256 === asset.actualSha && asset.width === 1280 && asset.data.length === asset.bytes)).toBe(true);
  await done(page); await softLimit(page, true); await openEditor(page); const rows = page.locator('[data-media-row]'); await expect(rows).toHaveCount(4);
  await expect(page.locator('[data-editor-gallery="before-note"]').getByRole('button', { name: 'Aggiungi foto', exact: true })).toBeDisabled();
  await rows.filter({ has: page.getByRole('textbox', { name: 'Didascalia', exact: true }).and(page.locator('input[value="Prima uno"]')) }).getByRole('button', { name: 'Sposta dopo la nota', exact: true }).click();
  const afterGallery = page.locator('[data-editor-gallery="after-note"]'); await afterGallery.locator('[data-media-row]').last().getByRole('button', { name: 'Sposta su', exact: true }).click();
  await afterGallery.getByRole('combobox', { name: 'Layout', exact: true }).selectOption('side-by-side'); await afterGallery.getByRole('combobox', { name: 'Spazio immagine', exact: true }).selectOption('large');
  const moved = await records(page); expect(moved.assets).toEqual(before.assets); const step = moved.revision.graph.nodes.find((node) => node.id === 'shared'); if (!step || !('media' in step)) throw new Error('step');
  expect(step.media.find((item) => item.caption === 'Prima uno')).toMatchObject({ slot: 'after-note', order: 1 }); expect(step.galleries.afterNote).toEqual({ layout: 'side-by-side', imageSpace: 'large' });
  await page.getByRole('button', { name: 'Anteprima', exact: true }).click(); await expect(dialog(page).locator('.nf-gallery')).toHaveCount(2); await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).click(); await done(page);
  await expect.poll(() => page.evaluate(() => (window as unknown as { F07Urls: string[] }).F07Urls.length)).toBe(0);
});

test('E13: wire export/import conserva bytes locali, URL remoto e due gallerie offline; W07 non blocca', async ({ page, context }) => {
  await setupBuilder(page); await softLimit(page, false); await openEditor(page); await addPhoto(page, 'before-note', 'Locale autore');
  await page.locator('[data-editor-gallery="after-note"]').getByRole('button', { name: 'Aggiungi URL', exact: true }).click();
  await dialog(page).getByRole('textbox', { name: 'URL immagine HTTPS', exact: true }).fill('https://media.example.com/missing.gif'); await dialog(page).getByRole('textbox', { name: 'Didascalia', exact: true }).fill('Collegata autore');
  await dialog(page).getByRole('button', { name: 'Aggiungi', exact: true }).click(); await expect(dialog(page)).toHaveCount(0); await done(page);
  await attachBuilderHarness(page); await page.evaluate(() => window.NurseFlowF05.addMissingPhoto()); const before = await records(page); const imported = await page.evaluate(() => window.NurseFlowF05.roundTripEditor());
  const copied = await records(page, imported.procedureIds[0]!); const step = copied.revision.graph.nodes.find((node) => 'media' in node && node.media.length === 3); if (!step || !('media' in step)) throw new Error('copy');
  expect(copied.assets.filter((asset) => asset.sha256 === before.assets[0]!.sha256)).toHaveLength(2); expect(step.media.find((item) => item.caption === 'Collegata autore')?.source).toEqual({ kind: 'remote', httpsUrl: 'https://media.example.com/missing.gif' });
  await openEditor(page, step.id, imported.procedureIds[0]!); await context.setOffline(true); await expect(page.getByText(/^W07 ·/)).toBeVisible(); await expect(page.getByAltText('Testo Locale autore')).toBeVisible();
  await page.getByRole('textbox', { name: 'Testo istruzione', exact: true }).fill('Autore offline'); await done(page); await context.setOffline(false);
  expect((await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
});

test('quota autosave: Done non esce, testo resta, Retry salva una sola modifica', async ({ page }) => {
  await setupBuilder(page); await openEditor(page); const before = await readBuilder(page);
  await page.evaluate((version) => { const original = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
    if (this.name === 'builderStates' && (args[0] as { editVersion?: number }).editVersion === version) { IDBObjectStore.prototype.put = original; throw new DOMException('quota-editor', 'QuotaExceededError'); }
    return original.apply(this, args); }; }, before.revision.editVersion + 1);
  await page.getByRole('textbox', { name: 'Testo istruzione', exact: true }).fill('Da conservare'); await page.getByRole('button', { name: 'Fine', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Modifica non salvata'); await expect(page.getByRole('textbox', { name: 'Testo istruzione', exact: true })).toHaveValue('Da conservare');
  expect((await readBuilder(page)).revision.graph).toEqual(before.revision.graph); await page.getByRole('button', { name: 'Riprova', exact: true }).click(); await done(page);
  expect((await readBuilder(page)).history.past).toHaveLength(1);
});

test('quota fase: Retry crea e assegna una sola fase senza ripetere la proposta', async ({ page }) => {
  await setupBuilder(page); await openEditor(page); const before = await readBuilder(page);
  await page.getByRole('button', { name: '+ Nuova fase', exact: true }).click(); await dialog(page).getByRole('textbox', { name: 'Nome fase', exact: true }).fill('Fase da conservare');
  await page.evaluate(() => { const original = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
    if (this.name === 'builderStates' && (args[0] as { past?: unknown[] }).past?.length) { IDBObjectStore.prototype.put = original; throw new DOMException('quota-phase', 'QuotaExceededError'); } return original.apply(this, args);
  }; });
  await dialog(page).getByRole('button', { name: 'Fine', exact: true }).click(); await expect(dialog(page).getByRole('alert')).toBeVisible(); expect((await readBuilder(page)).revision.graph.phases).toEqual(before.revision.graph.phases);
  await dialog(page).getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(dialog(page)).toHaveCount(0); await done(page);
  const saved = await readBuilder(page); expect(saved.revision.graph.phases.filter((phase) => phase.name === 'Fase da conservare')).toHaveLength(1); expect(saved.history.past).toHaveLength(1);
});

test('Change path annullato conserva camera/modalità; nuovo passo collegato apre Page08 dopo il commit', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page); await openEditor(page, 'decision'); await page.getByRole('button', { name: 'Modifica risposta: A', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Cambia percorso: A', exact: true }).click(); await expect(graphSurface(page)).toBeVisible(); await page.getByRole('button', { name: 'Aumenta zoom', exact: true }).click();
  await page.getByRole('button', { name: 'Annulla', exact: true }).click(); await expect(dialog(page).getByRole('textbox', { name: 'Risposta', exact: true })).toHaveValue('A');
  const cancelled = await readBuilder(page); expect(cancelled.history.view.canvas).toEqual(before.history.view.canvas); expect(cancelled.editorMode).toBe(before.editorMode); expect(cancelled.revision.graph).toEqual(before.revision.graph);
  await dialog(page).getByRole('button', { name: 'Cambia percorso: A', exact: true }).click(); await page.getByRole('button', { name: 'Crea il prossimo passo', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Inserisci prima', exact: true }).click(); await dialog(page).getByRole('button', { name: 'Istruzione', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Applica modifica', exact: true }).click(); await expect(page.getByRole('textbox', { name: 'Testo istruzione', exact: true })).toBeVisible();
  const id = await page.locator('[data-node-id]').getAttribute('data-node-id'); const saved = await readBuilder(page);
  expect(saved.revision.graph.nodes.find((node) => node.id === 'decision')).toMatchObject({ outcomes: expect.arrayContaining([expect.objectContaining({ id: 'a', destination: { kind: 'node', nodeId: id } })]) });
  expect(saved.revision.graph.nodes.find((node) => node.id === id)).toMatchObject({ kind: 'instruction', text: '', next: { kind: 'node', nodeId: 'a-step' } });
});

test('XSS e W07: contenuti escaped; Alert sempre visibile e preview senza sessioni', async ({ page }) => {
  await setupBuilder(page); await attachBuilderHarness(page); await page.evaluate(() => window.NurseFlowF05.addMissingPhoto()); await openEditor(page);
  await page.getByRole('button', { name: 'Azioni passaggio', exact: true }).click(); await dialog(page).getByRole('button', { name: 'Cambia tipo…', exact: true }).click(); await dialog(page).getByRole('button', { name: 'Avviso', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Applica modifica', exact: true }).click(); await expect(dialog(page)).toHaveCount(0);
  const hostile = '<img src=x onerror="window.F07Xss=1">'; await page.getByRole('textbox', { name: 'Avviso sempre visibile', exact: true }).fill(hostile);
  await page.getByRole('textbox', { name: 'Testo aggiuntivo', exact: true }).fill('Dettaglio autore');
  await page.getByRole('button', { name: 'Anteprima', exact: true }).click(); await expect(dialog(page).getByRole('alert')).toHaveText(hostile); await expect(dialog(page).getByText(/^W07 ·/)).toBeVisible();
  await expect(dialog(page).getByRole('button', { name: 'Continua', exact: true })).toBeDisabled(); expect((await readBuilder(page)).runs).toEqual([]);
  expect(await page.evaluate(() => 'F07Xss' in window)).toBe(false);
  await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.getByRole('button', { name: 'Azioni passaggio', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Cambia tipo…', exact: true }).click(); await dialog(page).getByRole('button', { name: 'Istruzione', exact: true }).click();
  await expect(dialog(page)).toContainText('Testo aggiuntivo precedente: Dettaglio autore'); await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).click(); await expect(page.getByRole('textbox', { name: 'Testo aggiuntivo', exact: true })).toHaveValue('Dettaglio autore');
});

test('quota ritorno: Retry recupera la selezione senza alterare il grafo o uscire con falso successo', async ({ page }) => {
  await setupBuilder(page); await openEditor(page); const before = await readBuilder(page);
  await page.evaluate(() => { const original = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
    if (this.name === 'builderStates') { IDBObjectStore.prototype.put = original; throw new DOMException('quota-view', 'QuotaExceededError'); } return original.apply(this, args);
  }; });
  await page.getByRole('button', { name: 'Fine', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Modifica non salvata');
  await page.getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(page.getByRole('alert')).toHaveCount(0); await done(page);
  const after = await readBuilder(page); expect(after.revision).toEqual(before.revision); expect(after.history.past).toEqual(before.history.past); expect(after.history.view.selection).toEqual({ kind: 'node', nodeId: 'shared' });
});

test('Ready-only Page08: nessuna Draft per ingresso/Done; primo autosave crea Draft indipendente e regge reload', async ({ page }) => {
  await setupBuilder(page, 'ready-only'); const before = await readBuilder(page, 'ready-only'); await openEditor(page, 'shared', 'ready-only'); await done(page);
  expect((await readBuilder(page, 'ready-only')).procedure.workingDraftId).toBeUndefined(); await openEditor(page, 'shared', 'ready-only');
  await page.getByRole('textbox', { name: 'Testo istruzione', exact: true }).fill('Nuovo testo autore'); await expect.poll(async () => (await readBuilder(page, 'ready-only')).procedure.workingDraftId).toBeTruthy();
  await expect(page.locator('[data-node-id]')).toHaveAttribute('data-revision-state', 'working-draft'); await page.reload();
  await expect(page.getByRole('textbox', { name: 'Testo istruzione', exact: true })).toHaveValue('Nuovo testo autore'); await done(page);
  const after = await readBuilder(page, 'ready-only'); expect(after.ready).toEqual(before.ready); expect(after.history.past).toHaveLength(1); expect(after.procedure.lastOpenedAt).toBe(before.procedure.lastOpenedAt);
});

test('tema scuro a 320px: target form 48px, foto nei due slot e preview senza clipping', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 844 }); await page.emulateMedia({ colorScheme: 'dark' }); await setupBuilder(page); await openEditor(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const metrics = await page.getByRole('textbox', { name: 'Titolo breve', exact: true }).evaluate((input) => ({
    height: input.getBoundingClientRect().height, background: getComputedStyle(input).backgroundColor, surface: getComputedStyle(input.closest('.nf-card')!).backgroundColor,
  })); expect(metrics.height).toBeGreaterThanOrEqual(48); expect(metrics.background).toBe(metrics.surface);
  await addPhoto(page, 'before-note', 'Prima foto'); await addPhoto(page, 'after-note', 'Dopo foto'); await expectNoBleeding(page);
  await page.getByRole('button', { name: 'Anteprima', exact: true }).click(); await expect(dialog(page).locator('.nf-gallery')).toHaveCount(2); await expectNoBleeding(page);
  const path = info.outputPath('media-preview-320px-dark.png'); await page.screenshot({ path }); await info.attach('Preview media dark', { path, contentType: 'image/png' });
  await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).click(); await done(page);
});

test('End: quattro tipi, fase facoltativa e nota; reload senza media o Continue', async ({ page }) => {
  await setupBuilder(page);
  for (const endKind of ['completed', 'stopped', 'escalation', 'neutral']) {
    await openEditor(page, 'end'); await page.getByRole('combobox', { name: 'Tipo di conclusione', exact: true }).selectOption(endKind);
    await page.getByRole('textbox', { name: 'Titolo finale', exact: true }).fill('Conclusione autore'); await page.getByRole('textbox', { name: 'Messaggio finale', exact: true }).fill('Messaggio ' + endKind);
    await page.getByRole('combobox', { name: 'Fase', exact: true }).selectOption(''); await expect(page.locator('[data-editor-gallery]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Anteprima', exact: true }).click(); await expect(dialog(page).getByText('Messaggio ' + endKind, { exact: true })).toBeVisible();
    await expect(dialog(page).getByRole('button', { name: 'Continua', exact: true })).toHaveCount(0); await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).click(); await done(page);
    expect((await readBuilder(page)).revision.graph.nodes.find((node) => node.id === 'end')).toMatchObject({ endKind, heading: 'Conclusione autore', phaseId: null });
  }
  await openEditor(page, 'end'); await page.reload(); await expect(page.getByRole('combobox', { name: 'Tipo di conclusione', exact: true })).toHaveValue('neutral');
});

test('32 risposte ricercabili, rimozione separata con impatto e Undo senza perdere i passi', async ({ page }) => {
  const { decisionsId } = await setupBuilder(page); await openEditor(page, 'decision', decisionsId);
  await expect(page.getByRole('button', { name: '+ Risposta', exact: true })).toBeDisabled(); await page.getByRole('searchbox', { name: 'Cerca', exact: true }).fill('Esito 27');
  await expect(page.getByRole('button', { name: /^Modifica risposta:/ })).toHaveCount(1); await page.getByRole('button', { name: 'Modifica risposta: Esito 27', exact: true }).click();
  await dialog(page).getByRole('textbox', { name: 'Nota della risposta', exact: true }).fill('Nota 27'); await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).click();
  await page.getByRole('button', { name: 'Anteprima', exact: true }).click(); await dialog(page).getByRole('button', { name: 'Nota per: Esito 27', exact: true }).click(); await expect(dialog(page).getByText('Nota 27', { exact: true })).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.getByRole('button', { name: 'Riordina risposte', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Rimuovi risposta: Esito 27', exact: true }).click(); await expect(dialog(page)).toContainText('Prima:');
  await dialog(page).getByRole('button', { name: 'Applica modifica', exact: true }).click(); await expect(dialog(page)).toHaveCount(0); await done(page);
  const saved = await readBuilder(page, decisionsId); const decision = saved.revision.graph.nodes.find((node) => node.id === 'decision');
  expect(decision?.kind === 'decision' ? decision.outcomes.length : 0).toBe(31); expect(saved.revision.graph.nodes).toHaveLength(6);
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click(); await expect.poll(async () => {
    const node = (await readBuilder(page, decisionsId)).revision.graph.nodes.find((node) => node.id === 'decision'); return node?.kind === 'decision' ? node.outcomes.length : 0;
  }).toBe(32);
});

test('ricompressione esplicita crea Blob nuovo, default futuro non tocca il vecchio; Undo conserva entrambi', async ({ page }) => {
  await setupBuilder(page); await openEditor(page); await addPhoto(page, 'before-note', 'Originale locale'); await done(page); const before = await records(page);
  await page.goto('./#/settings'); await page.getByRole('combobox', { name: 'Compressione per le prossime foto', exact: true }).selectOption('small');
  await expect.poll(async () => (await records(page)).settings?.photoPreset).toBe('small'); expect((await records(page)).assets).toEqual(before.assets);
  await openEditor(page); const mediaId = (before.revision.graph.nodes.find((node) => node.id === 'shared') as { media: { id: string }[] }).media[0]!.id;
  await page.locator(`[data-media-row="${mediaId}"]`).getByRole('button', { name: 'Ricomprimi', exact: true }).click(); await expect(dialog(page).locator('output')).toContainText('640 × 197');
  await dialog(page).getByRole('button', { name: 'Applica', exact: true }).click(); await expect(dialog(page)).toHaveCount(0); await done(page);
  const after = await records(page); expect(after.assets).toHaveLength(2); expect(after.assets.find((asset) => asset.id === before.assets[0]!.id)).toEqual(before.assets[0]);
  expect(after.assets.find((asset) => asset.id !== before.assets[0]!.id)?.width).toBe(640);
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click(); await expect.poll(async () => (await records(page)).revision.graph).toEqual(before.revision.graph); expect((await records(page)).assets).toHaveLength(2);
});

test('quota media: rollback include Blob, Retry mantiene proposta e inserisce una sola foto', async ({ page }) => {
  await setupBuilder(page); await openEditor(page); const before = await readBuilder(page); await expand(page, /^Media/);
  await page.locator('[data-editor-gallery="before-note"]').getByRole('button', { name: 'Aggiungi foto', exact: true }).click();
  const png = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64; return canvas.toDataURL('image/png').split(',')[1]!; });
  await dialog(page).getByLabel('Scegli immagine locale', { exact: true }).setInputFiles({ name: 'cartoncino.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') }); await expect(dialog(page).locator('output')).toContainText('64 × 64');
  await page.evaluate(() => { const original = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
    if (this.name === 'builderStates' && (args[0] as { past?: unknown[] }).past?.length) { IDBObjectStore.prototype.put = original; throw new DOMException('quota-photo', 'QuotaExceededError'); } return original.apply(this, args);
  }; });
  await dialog(page).getByRole('button', { name: 'Aggiungi', exact: true }).click(); await expect(dialog(page).getByRole('alert')).toContainText('Modifica non salvata');
  expect((await records(page)).assets).toHaveLength(0); expect((await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await dialog(page).getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(dialog(page)).toHaveCount(0); await done(page); expect((await records(page)).assets).toHaveLength(1); expect((await readBuilder(page)).history.past).toHaveLength(1);
});

test('URL sicuri e GIF remota opzionale; upload SVG/GIF locale rifiutato senza Blob', async ({ page }) => {
  await setupBuilder(page); await page.route('https://media.example.com/card.gif', (route) => route.fulfill({ contentType: 'image/gif', headers: { 'access-control-allow-origin': '*' }, body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') }));
  await openEditor(page); await expand(page, /^Media/); await page.locator('[data-editor-gallery="before-note"]').getByRole('button', { name: 'Aggiungi URL', exact: true }).click();
  for (const url of ['javascript:alert(1)', 'http://media.example.com/a.png', 'https://127.0.0.1/a.png', 'https://user:secret@media.example.com/a.png', 'https://media.example.com/a.%73vg']) {
    await dialog(page).getByRole('textbox', { name: 'URL immagine HTTPS', exact: true }).fill(url); await expect(dialog(page).getByRole('button', { name: 'Aggiungi', exact: true })).toBeDisabled();
  }
  await dialog(page).getByRole('textbox', { name: 'URL immagine HTTPS', exact: true }).fill('https://media.example.com/card.gif'); await dialog(page).getByRole('textbox', { name: 'Didascalia', exact: true }).fill('GIF autore');
  await expect(dialog(page).locator('img')).toBeVisible(); await dialog(page).getByRole('button', { name: 'Aggiungi', exact: true }).click(); await expect(dialog(page)).toHaveCount(0);
  await page.locator('[data-editor-gallery="after-note"]').getByRole('button', { name: 'Aggiungi foto', exact: true }).click();
  for (const file of [{ name: 'hostile.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg onload="alert(1)"/>') }, { name: 'local.gif', mimeType: 'image/gif', buffer: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') }]) {
    await dialog(page).getByLabel('Scegli immagine locale', { exact: true }).setInputFiles(file); await expect(dialog(page).getByRole('alert')).toContainText('Immagine non valida'); await expect(dialog(page).getByRole('button', { name: 'Aggiungi', exact: true })).toBeDisabled();
  }
  await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click(); await done(page); expect((await records(page)).assets).toHaveLength(0);
});

for (const [width, scale] of [[320, 4], [320, 13], [320, 30], [320, 48], [390, 13], [768, 13]]) {
  test(`Page08 ${width}px/${scale}pt: form, outcome e preview senza overflow`, async ({ page }, info) => {
    await page.setViewportSize({ width: width!, height: 844 }); await setupBuilder(page); await page.goto('./#/settings'); await setScale(page, scale!); await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
    await openEditor(page, 'decision'); await page.getByRole('textbox', { name: 'Domanda', exact: true }).fill('Domanda autore lunga '.repeat(8)); await expectNoBleeding(page);
    if (scale === 13) { await expect(page.getByRole('status')).toHaveText('Salvato'); const path = info.outputPath(`editor-${width}px.png`); await page.screenshot({ path, fullPage: true }); await info.attach('Page08', { path, contentType: 'image/png' }); }
    await page.getByRole('button', { name: 'Modifica risposta: A', exact: true }).click(); await expectNoBleeding(page); await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).click();
    await page.getByRole('button', { name: 'Anteprima', exact: true }).click(); await expectNoBleeding(page); await expect(dialog(page).getByRole('button', { name: 'A', exact: true })).toBeDisabled();
  });
}
