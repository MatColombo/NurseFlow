import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { setupBuilder, readBuilder } from '../fixtures/builder';
import { cancelGraphTarget, graphNode, graphSurface, locateGraphNode, openGraph, pickGraphNode } from '../fixtures/graph';
import { expectNoBleeding, setScale } from '../fixtures/ui';
const sheet = (page: Page) => page.getByRole('dialog');
const outline = (page: Page) => page.getByRole('toolbar', { name: 'Strumenti Builder', exact: true }).getByRole('button', { name: 'Outline', exact: true });
async function apply(page: Page) { const dialog = page.getByRole('dialog', { name: 'Anteprima della modifica', exact: true }); await dialog.getByRole('button', { name: 'Applica modifica', exact: true }).click(); await expect(dialog).not.toBeVisible(); }
async function capture(page: Page, info: TestInfo, name: string) { const path = info.outputPath(name + '.png'); await page.screenshot({ path }); await info.attach(name, { path, contentType: 'image/png' }); }
async function startChangeA(page: Page) {
  await locateGraphNode(page, 'Scelta dimostrativa'); await graphNode(page, 'decision').getByRole('button', { name: 'A · Percorso A', exact: true }).click();
  await sheet(page).getByRole('button', { name: 'Cambia collegamento', exact: true }).click();
}

test('Graph legge lo stesso DAG: shared una volta, due frecce dirette, selezione nodo/outcome/edge', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page); await openGraph(page);
  const identities = await page.locator('[data-graph-node]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-graph-node')).sort());
  expect(identities).toEqual(before.revision.graph.nodes.map((node) => node.id).sort()); await expect(graphNode(page, 'shared')).toHaveCount(1);
  const arrows = page.locator('[data-graph-edge][data-target="shared"]'); await expect(arrows).toHaveCount(2);
  expect(new Set(await arrows.evaluateAll((edges) => edges.map((edge) => edge.getAttribute('d')))).size).toBe(2);
  await locateGraphNode(page, 'Revisione comune'); await graphNode(page, 'shared').getByRole('button', { name: 'Revisione comune', exact: true }).click();
  await expect(sheet(page)).toContainText('più percorsi'); await sheet(page).getByRole('button', { name: 'Chiudi', exact: true }).last().click();
  await locateGraphNode(page, 'Scelta dimostrativa'); await graphNode(page, 'decision').getByRole('button', { name: 'B · Percorso B', exact: true }).click();
  await expect(sheet(page)).toContainText('Scelta dimostrativa / B'); await sheet(page).getByRole('button', { name: 'Annulla', exact: true }).click();
  const edge = page.locator('[data-graph-edge][data-source="a-step"][data-target="shared"]');
  await edge.focus(); await edge.press('Enter'); await expect(edge).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page)).toHaveCount(0); await expect(page.locator('foreignObject[data-edge-focus="active"]')).toHaveCount(2);
  expect((await readBuilder(page)).revision.graph).toEqual(before.revision.graph); expect((await readBuilder(page)).history.past).toEqual([]);
});

test('tap-to-target: preview e Cancel non scrivono; Apply cambia solo A; Undo/Redo tra Graph e Outline', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page); await openGraph(page); await startChangeA(page);
  await pickGraphNode(page, 'Revisione comune'); const preview = sheet(page);
  await expect(preview).toContainText('Prima: Percorso A'); await expect(preview).toContainText('Dopo: Revisione comune'); await expect(preview).toContainText('Passo non raggiungibile: Percorso A');
  expect((await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await preview.getByRole('button', { name: 'Annulla', exact: true }).click(); await cancelGraphTarget(page);
  await sheet(page).getByRole('button', { name: 'Annulla', exact: true }).click();
  await startChangeA(page); await pickGraphNode(page, 'Esempio terminato'); await apply(page);
  const changed = await readBuilder(page); expect(changed.revision.graph.nodes.find((node) => node.id === 'decision')).toMatchObject({ outcomes: [
    { id: 'a', destination: { kind: 'node', nodeId: 'end' } }, { id: 'b', destination: { kind: 'node', nodeId: 'b-step' } },
  ] }); expect(changed.ready).toEqual(before.ready); expect(changed.history.past).toHaveLength(1);
  await outline(page).click(); await expect(page.locator('[data-outline-node="decision"]').getByRole('button', { name: 'A · Esempio terminato', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click(); await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await openGraph(page); await page.getByRole('button', { name: 'Ripeti modifica', exact: true }).click(); await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(changed.revision.graph);
  await expect(page.locator('[data-graph-edge][data-source="decision"][data-target="end"]')).toHaveCount(1);
});

test('ciclo e cross-arm rifiutati prima del commit; ricerca focalizza senza assegnare', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page); await openGraph(page); await startChangeA(page);
  await locateGraphNode(page, 'Scelta dimostrativa'); const cycle = graphNode(page, 'decision').getByRole('button', { name: 'Scegli destinazione: Scelta dimostrativa', exact: true });
  await expect(cycle).toBeDisabled(); await expect(cycle).toHaveAttribute('data-target-reason', /ciclo/); expect((await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await cancelGraphTarget(page); await sheet(page).getByRole('button', { name: 'Annulla', exact: true }).click();
  await page.goto('./#/build/multi'); await expect(page.getByRole('heading', { name: 'Esempio multi', exact: true })).toBeVisible(); await expect(graphSurface(page)).toBeVisible();
  await locateGraphNode(page, 'Operazione 1'); await graphNode(page, 'task-1').getByRole('button', { name: 'Passo successivo · Attività terminata', exact: true }).click();
  await sheet(page).getByRole('button', { name: 'Cambia collegamento', exact: true }).click();
  const multi = await readBuilder(page, 'multi'); await locateGraphNode(page, 'Operazione 2');
  await expect(graphSurface(page).getByRole('button', { name: 'Scegli destinazione: Operazione 2', exact: true })).toBeDisabled();
  expect((await readBuilder(page, 'multi')).revision.graph).toEqual(multi.revision.graph); expect((await readBuilder(page, 'multi')).history.past).toEqual([]);
});

test('delete condiviso: W08 distinti dagli outlet vuoti, nessuna freccia sana verso il nodo perso, Undo ripristina ID', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page); await openGraph(page); await locateGraphNode(page, 'Revisione comune');
  await graphNode(page, 'shared').getByRole('button', { name: 'Revisione comune', exact: true }).click(); await sheet(page).getByRole('button', { name: 'Elimina passo', exact: true }).click();
  await expect(sheet(page)).toContainText('2 collegamenti in ingresso'); await apply(page);
  await expect(graphNode(page, 'shared')).toHaveCount(0); await expect(page.locator('[data-graph-edge][data-target="shared"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Centra selezione', exact: true })).toBeDisabled();
  await expect(page.locator('.nf-graph-broken')).toHaveCount(2); await expect(page.locator('[data-empty-outlet]')).toHaveCount(0);
  const deleted = await readBuilder(page); for (const id of ['a-step', 'b-step']) expect(deleted.revision.graph.nodes.find((node) => node.id === id)).toMatchObject({ next: { kind: 'broken', formerNodeId: 'shared' } });
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click(); await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await expect(graphNode(page, 'shared')).toHaveCount(1); await expect(page.locator('[data-graph-edge][data-target="shared"]')).toHaveCount(2);
});

test('pan, zoom e Fit cambiano solo la camera; overview richiede focus leggibile; mode e camera dopo reload', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page); await openGraph(page); const viewport = graphSurface(page);
  const firstX = Number(await viewport.getAttribute('data-camera-x')); const firstY = Number(await viewport.getAttribute('data-camera-y')); const box = (await viewport.boundingBox())!;
  await page.mouse.move(box.x + 8, box.y + 8); await page.mouse.down(); await page.mouse.move(box.x + 70, box.y + 50, { steps: 6 }); await page.mouse.up();
  await expect.poll(async () => Number(await viewport.getAttribute('data-camera-x'))).toBeCloseTo(firstX + 62, 1);
  await expect.poll(async () => Number(await viewport.getAttribute('data-camera-y'))).toBeCloseTo(firstY + 42, 1);
  await page.getByRole('button', { name: 'Aumenta zoom', exact: true }).click(); await expect(viewport).toHaveAttribute('data-camera-zoom', '1.25');
  await page.getByRole('button', { name: 'Adatta', exact: true }).click(); await expect.poll(async () => Number(await viewport.getAttribute('data-camera-zoom'))).toBeLessThan(1);
  await graphNode(page, 'decision').getByRole('button', { name: 'Scelta dimostrativa', exact: true }).click(); await expect(viewport).toHaveAttribute('data-camera-zoom', '1'); await expect(sheet(page)).toHaveCount(0);
  await viewport.focus(); const x = Number(await viewport.getAttribute('data-camera-x')); await viewport.press('ArrowRight');
  await expect(viewport).toHaveAttribute('data-camera-x', String(x - 64));
  await expect.poll(async () => (await readBuilder(page)).history.view.canvas.x).toBe(x - 64);
  const saved = (await readBuilder(page)).history.view.canvas; await page.reload(); await expect(viewport).toHaveAttribute('data-camera-x', String(saved.x));
  await expect(viewport).toHaveAttribute('data-camera-zoom', String(saved.zoom)); const after = await readBuilder(page);
  expect(after.editorMode).toBe('graph'); expect(after.revision.graph).toEqual(before.revision.graph); expect(after.history.past).toEqual([]);
});

test('AND 32: attività 27 con Browse, massimo tre corsie, freccia diretta alla continuazione senza gate', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await setupBuilder(page, 'many'); const before = await readBuilder(page, 'many'); await openGraph(page);
  await locateGraphNode(page, 'Lavori dimostrativi'); await graphNode(page, 'tasks').getByRole('button', { name: 'Sfoglia attività (32)', exact: true }).click();
  const browse = page.getByRole('dialog', { name: 'Sfoglia attività', exact: true }); await browse.getByRole('searchbox', { name: 'Cerca', exact: true }).fill('Attività 27');
  await browse.locator('[data-browse-item="activity-27"]').click();
  await expect(graphNode(page, 'tasks')).toContainText('Attività 27 di 32'); await expect(graphNode(page, 'tasks')).toContainText('1 visibili di 32');
  await expect(page.locator('[data-graph-node^="task-"]')).toHaveCount(1); await expect(graphNode(page, 'task-27')).toHaveCount(1);
  await expect(page.locator('[data-graph-edge][data-source="task-27"][data-target="end"][data-completion="true"]')).toHaveCount(1);
  expect((await readBuilder(page, 'many')).revision.graph).toEqual(before.revision.graph);
  await page.setViewportSize({ width: 1280, height: 844 }); await expect(page.locator('[data-graph-node^="task-"]')).toHaveCount(3);
  await expect(graphNode(page, 'end')).toHaveCount(1); await expect(page.getByText(/Join-All|ALL complete|Automatic ·/)).toHaveCount(0);
});

test('32 outcome: Browse 19, + vero, creazione automaticamente collegata e riletta in Outline', async ({ page }) => {
  const { decisionsId } = await setupBuilder(page); await page.goto('./#/build/' + decisionsId); await openGraph(page); await locateGraphNode(page, 'Scelta dimostrativa');
  await graphNode(page, 'decision').getByRole('button', { name: 'Sfoglia esiti (32)', exact: true }).click();
  const browse = page.getByRole('dialog', { name: 'Sfoglia esiti', exact: true }); await browse.getByRole('searchbox', { name: 'Cerca', exact: true }).fill('Esito 19');
  await browse.locator('[data-browse-item="outcome-19"]').click();
  await graphNode(page, 'decision').getByRole('button', { name: 'Esito 19 · +', exact: true }).click();
  await sheet(page).getByRole('button', { name: 'Crea il prossimo passo', exact: true }).click(); await sheet(page).getByRole('button', { name: 'Istruzione', exact: true }).click();
  await expect(page).toHaveURL(/\/step\//); const saved = await readBuilder(page, decisionsId); const decision = saved.revision.graph.nodes.find((node) => node.kind === 'decision');
  if (decision?.kind !== 'decision') throw new Error('Decision missing');
  expect(decision.outcomes.filter((item) => item.destination.kind === 'node')).toEqual([expect.objectContaining({ id: 'outcome-19' })]);
  await page.getByRole('button', { name: 'Fine', exact: true }).click(); await outline(page).click();
  await expect(page.locator('[data-outline-node="decision"]').getByRole('button', { name: 'Esito 19 · Istruzione', exact: true })).toBeVisible();
});

test('Auto layout è persistito e undoable, mode/pan non creano Draft Ready-only', async ({ page }) => {
  await setupBuilder(page, 'ready-only'); const before = await readBuilder(page, 'ready-only'); await openGraph(page);
  expect((await readBuilder(page, 'ready-only')).procedure.workingDraftId).toBeUndefined();
  await page.getByRole('button', { name: 'Azioni Builder', exact: true }).click(); await sheet(page).getByRole('button', { name: 'Layout automatico', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page, 'ready-only')).history.past.length).toBe(1);
  const changed = await readBuilder(page, 'ready-only'); expect(changed.revision.state).toBe('working-draft'); expect(changed.ready).toEqual(before.ready); expect(changed.revision.graph.nodes).toEqual(before.revision.graph.nodes);
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click(); await expect.poll(async () => (await readBuilder(page, 'ready-only')).revision.graph).toEqual(before.revision.graph);
});

test('rewiring con quota: rollback di edge e history; Retry salva una sola modifica dopo reload', async ({ page }) => {
  await setupBuilder(page); await openGraph(page); await startChangeA(page); await pickGraphNode(page, 'Esempio terminato');
  const before = await readBuilder(page);
  await page.evaluate((version) => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'builderStates' && (args[0] as { editVersion?: number }).editVersion === version) {
        IDBObjectStore.prototype.put = original; throw new DOMException('Quota fixture', 'QuotaExceededError');
      }
      return original.apply(this, args);
    };
  }, before.revision.editVersion + 1);
  await sheet(page).getByRole('button', { name: 'Applica modifica', exact: true }).click();
  await expect(sheet(page).getByRole('alert')).toContainText('Modifica non salvata');
  const failed = await readBuilder(page); expect(failed.revision).toEqual(before.revision); expect(failed.history.past).toEqual([]);
  await sheet(page).getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(sheet(page)).toHaveCount(0);
  await page.reload(); await expect(graphSurface(page)).toBeVisible(); const saved = await readBuilder(page);
  expect(saved.history.past).toHaveLength(1); expect(saved.ready).toEqual(before.ready);
  expect(saved.revision.graph.nodes.find((node) => node.id === 'decision')).toMatchObject({ outcomes: [
    { id: 'a', destination: { kind: 'node', nodeId: 'end' } }, { id: 'b', destination: { kind: 'node', nodeId: 'b-step' } },
  ] });
});

test('target alternativo Outline e tastiera dopo pan usano lo stesso edge e conservano lo scroll', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page); const pane = page.getByTestId('builder-scroll');
  await pane.evaluate((element) => { element.scrollTop = 150; }); const top = await pane.evaluate((element) => element.scrollTop);
  await openGraph(page); const viewport = graphSurface(page); const bounds = (await viewport.boundingBox())!;
  await page.mouse.move(bounds.x + 8, bounds.y + 8); await page.mouse.down(); await page.mouse.move(bounds.x + 50, bounds.y + 20); await page.mouse.up();
  await graphNode(page, 'start').getByRole('button', { name: 'Start', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(sheet(page)).toBeVisible(); await sheet(page).getByRole('button', { name: 'Chiudi', exact: true }).last().click();
  await startChangeA(page); await outline(page).click();
  const decision = page.locator('[data-outline-node="decision"]'); await expect(decision.getByRole('button', { name: 'Scegli destinazione: Scelta dimostrativa', exact: true })).toBeDisabled();
  await page.locator('[data-outline-node="end"]').getByRole('button', { name: 'Scegli destinazione: Esempio terminato', exact: true }).click();
  await expect(sheet(page)).toContainText('Dopo: Esempio terminato'); expect((await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await sheet(page).getByRole('button', { name: 'Annulla', exact: true }).click(); await cancelGraphTarget(page);
  await sheet(page).getByRole('button', { name: 'Annulla', exact: true }).click(); await outline(page).click();
  await expect.poll(() => pane.evaluate((element) => element.scrollTop)).toBe(top);
});

test('Cut in Graph resta pending; Paste offline è atomico e Undo in Outline ripristina le identità', async ({ page, context, baseURL }) => {
  await setupBuilder(page); const before = await readBuilder(page); await openGraph(page); await locateGraphNode(page, 'Percorso A');
  await graphNode(page, 'a-step').getByRole('button', { name: 'Percorso A', exact: true }).click(); await sheet(page).getByRole('button', { name: 'Taglia', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Spostamento in sospeso' })).toHaveText('Spostamento in sospeso'); expect((await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await locateGraphNode(page, 'Percorso B'); await graphNode(page, 'b-step').getByRole('button', { name: 'Passo successivo · Revisione comune', exact: true }).click();
  const external: string[] = []; page.on('request', (request) => { if (new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url()); });
  await context.setOffline(true); await sheet(page).getByRole('button', { name: 'Incolla qui', exact: true }).click(); await apply(page);
  const saved = await readBuilder(page); expect(saved.history.past).toHaveLength(1); expect(saved.revision.graph.nodes.map((node) => node.id).sort()).toEqual(before.revision.graph.nodes.map((node) => node.id).sort());
  expect(saved.revision.graph.nodes.find((node) => node.id === 'b-step')).toMatchObject({ next: { kind: 'node', nodeId: 'a-step' } });
  await expect(page.getByRole('button', { name: 'Annulla spostamento', exact: true })).toHaveCount(0);
  await outline(page).click(); await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(before.revision.graph); expect(external).toEqual([]); await context.setOffline(false);
});

for (const [width, scale] of [[320, 4], [320, 13], [320, 30], [320, 48], [390, 13], [768, 13]]) {
  test(`Graph ${width}px/${scale}pt: viewport contenuto, controlli e target accessibili`, async ({ page }, info) => {
    await page.setViewportSize({ width: width!, height: 844 }); await setupBuilder(page); await page.goto('./#/settings'); await setScale(page, scale!);
    await page.getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.goto('./#/build/procedure'); await openGraph(page);
    await locateGraphNode(page, 'Revisione comune'); await expectNoBleeding(page); const viewport = (await graphSurface(page).boundingBox())!;
    expect(viewport.width).toBeLessThanOrEqual(width!); expect(viewport.height).toBeGreaterThanOrEqual(200);
    if (scale === 13) await capture(page, info, 'graph-' + width + 'px');
    await graphNode(page, 'shared').getByRole('button', { name: 'Revisione comune', exact: true }).click(); await expectNoBleeding(page); await sheet(page).getByRole('button', { name: 'Chiudi', exact: true }).last().click();
    await startChangeA(page); await pickGraphNode(page, 'Esempio terminato'); await expectNoBleeding(page);
    if (width === 320 && scale === 13) await capture(page, info, 'graph-impact-320px');
    await sheet(page).getByRole('button', { name: 'Annulla', exact: true }).click(); await cancelGraphTarget(page);
  });
}

test('320×568: picker e controlli Graph partecipano al layout, senza sovrapporre il footer', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 }); await setupBuilder(page); await openGraph(page); await startChangeA(page);
  await expect(page.locator('.nf-builder')).toHaveClass(/nf-builder-flow/);
  const canvas = (await graphSurface(page).boundingBox())!; const footer = (await page.locator('.nf-builder-footer').boundingBox())!;
  expect(canvas.y + canvas.height).toBeLessThanOrEqual(footer.y);
  await expect(page.getByRole('button', { name: 'Anteprima', exact: true })).toBeDisabled(); await expectNoBleeding(page);
  await pickGraphNode(page, 'Esempio terminato'); await expect(sheet(page)).toContainText('Dopo: Esempio terminato');
  await sheet(page).getByRole('button', { name: 'Annulla', exact: true }).click(); await graphSurface(page).focus(); await page.keyboard.press('Escape');
  await expect(page.locator('.nf-target-context')).toHaveCount(0); await expect(sheet(page).getByRole('button', { name: 'Cambia collegamento', exact: true })).toBeVisible();
});

test('Outline a 48pt conserva lo scroll del documento al ritorno da Graph e dal picker annullato', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await setupBuilder(page); await page.goto('./#/settings'); await setScale(page, 48);
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.goto('./#/build/procedure');
  await page.locator('[data-outline-node="b-step"]').getByRole('button', { name: 'Percorso B', exact: true }).scrollIntoViewIfNeeded();
  const toggle = page.getByRole('toolbar', { name: 'Strumenti Builder', exact: true }).getByRole('button', { name: 'Graph', exact: true });
  async function depart() {
    // Observe the actual click, after the browser has scrolled the command into view.
    await toggle.evaluate((button) => button.addEventListener('click', () => button.setAttribute('data-test-departure-scroll', String(window.scrollY)), { capture: true, once: true }));
    await openGraph(page); return Number(await toggle.getAttribute('data-test-departure-scroll'));
  }
  const top = await depart(); expect(top).toBeGreaterThan(500); await outline(page).click();
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - top)).toBeLessThanOrEqual(1);
  const pickerTop = await depart(); await startChangeA(page); await cancelGraphTarget(page); await sheet(page).getByRole('button', { name: 'Annulla', exact: true }).click();
  await outline(page).click(); await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - pickerTop)).toBeLessThanOrEqual(1);
});
