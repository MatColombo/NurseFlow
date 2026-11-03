import { expect, test as base, type Page, type Locator } from '@playwright/test';
import { setupBuilder, readBuilder } from '../fixtures/builder';
import { openGraph } from '../fixtures/graph';
import { expectNoBleeding } from '../fixtures/ui';

// Windows WebKit needs a disk-backed context for IndexedDB Blob writes (same as editor.spec).
const test = base.extend({
  context: async ({ playwright, browserName, baseURL, headless, locale, serviceWorkers }, use) => {
    const context = await playwright[browserName].launchPersistentContext('', { headless,
      ...(baseURL ? { baseURL } : {}), ...(locale ? { locale } : {}), ...(serviceWorkers ? { serviceWorkers } : {}),
    });
    try { await use(context); } finally { await context.close(); }
  },
});

async function clickPath(page: Page, path: Locator) {
  const point = await path.evaluate((element) => {
    const path = element as SVGPathElement; const position = path.getPointAtLength(path.getTotalLength() * .5);
    const result = position.matrixTransform(path.getScreenCTM()!); return { x: result.x, y: result.y };
  });
  await page.mouse.click(point.x, point.y);
}

test('offset arrow screenshot', async ({ page }, info) => {
  await setupBuilder(page); await openGraph(page);
  await page.getByRole('button', { name: 'Adatta', exact: true }).click();
  await expect(page.locator('[data-graph-edge]').first()).toBeAttached();
  await page.screenshot({ path: info.outputPath('offset-arrows.png') });
  // Capture an offset pair at readable size, not just the fitted overview.
  const edge = page.locator('[data-graph-edge][data-source="b-step"]');
  await clickPath(page, edge);
  await expect(edge).toHaveAttribute('aria-pressed', 'true');
  await expect(edge).toHaveCSS('outline-style', 'none');
  await expect(page.locator('foreignObject[data-edge-focus="active"]')).toHaveCount(2);
  await expect(page.locator('foreignObject[data-edge-focus="dimmed"]')).not.toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('offset-arrow-selected.png') });
  const pair = await Promise.all(['b-step', 'shared'].map((id) => page.locator(`[data-graph-node="${id}"]`).boundingBox()));
  const left = Math.min(...pair.map((box) => box!.x)) - 12; const top = Math.min(...pair.map((box) => box!.y)) - 12;
  await page.screenshot({ path: info.outputPath('offset-arrow-detail.png'), clip: { x: left, y: top,
    width: Math.max(...pair.map((box) => box!.x + box!.width)) - left + 12, height: Math.max(...pair.map((box) => box!.y + box!.height)) - top + 12 } });
  await clickPath(page, edge); await expect(edge).toHaveAttribute('aria-pressed', 'false');
  await edge.focus(); await edge.press('Enter'); await expect(edge).toHaveAttribute('aria-pressed', 'true');
  await edge.press('Escape'); await expect(edge).toHaveAttribute('aria-pressed', 'false');
  await edge.press('Enter'); await expect(edge).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.nf-graph-viewport').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('[data-edge-focus]')).toHaveCount(0);
  await page.goto('./#/procedure/procedure/map?revision=procedure-ready');
  await expect(page.locator('[data-map-node]')).not.toHaveCount(0);
  const mapEdge = page.locator('[data-graph-edge]').first(); await clickPath(page, mapEdge);
  await expect(mapEdge).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('foreignObject[data-edge-focus="active"]')).toHaveCount(2);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('activity name and first step are created together then opened, with atomic Undo/Redo', async ({ page }) => {
  await setupBuilder(page, 'multi'); const before = await readBuilder(page, 'multi');
  await page.locator('[data-outline-node="tasks"]').getByRole('button', { name: 'Lavori dimostrativi', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '+ Attività', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome dell’attività', exact: true }).fill('Nuova attività');
  await page.getByRole('combobox', { name: 'Tipo del primo passo', exact: true }).selectOption('alert');
  await page.getByRole('button', { name: 'Crea attività e compila il primo passo', exact: true }).click();
  await expect(page).toHaveURL(/\/step\//); const saved = await readBuilder(page, 'multi');
  const child = saved.revision.graph.nodes.find((node) => !before.revision.graph.nodes.some((item) => item.id === node.id))!;
  expect(child).toMatchObject({ title: 'Nuova attività', kind: 'alert', next: { kind: 'activity-complete' } });
  await page.getByRole('button', { name: 'Fine', exact: true }).click();
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page, 'multi')).revision.graph).toEqual(before.revision.graph);
  await page.getByRole('button', { name: 'Ripeti modifica', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page, 'multi')).revision.graph).toEqual(saved.revision.graph);
  expect((await readBuilder(page, 'multi')).ready).toEqual(before.ready);
});

test('text formatting and note bullets survive reload and render safely in preview', async ({ page }, info) => {
  await setupBuilder(page); const before = await readBuilder(page);
  await page.goto('./#/build/procedure/step/shared');
  const text = page.getByRole('textbox', { name: 'Testo istruzione', exact: true }); await text.fill('Testo di esempio');
  await text.selectText();
  await page.getByRole('group', { name: 'Stile: Testo istruzione', exact: true }).getByRole('button', { name: 'Grassetto', exact: true }).click();
  await page.getByRole('group', { name: 'Stile: Testo istruzione', exact: true }).getByRole('combobox', { name: 'Colore testo', exact: true }).selectOption('info');
  const summary = page.locator('summary').filter({ hasText: /^Nota del passaggio$/ });
  if (!(await summary.locator('..').evaluate((element) => (element as HTMLDetailsElement).open))) await summary.click();
  await page.getByRole('textbox', { name: 'Testo della nota', exact: true }).fill('Uno\nDue <script>alert(1)</script>');
  await page.getByRole('group', { name: 'Stile: Testo della nota', exact: true }).getByRole('button', { name: 'Elenco puntato', exact: true }).click();
  await page.getByRole('button', { name: 'Fine', exact: true }).click();
  await expect(page.getByRole('toolbar', { name: 'Strumenti Builder', exact: true })).toBeVisible();
  await page.goto('./#/build/procedure/step/shared');
  await expect(page.getByRole('heading', { name: 'Editor passaggio', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Anteprima', exact: true }).click(); const preview = page.getByRole('dialog');
  await expect(preview.locator('.nf-step-content .nf-authored span').first()).toHaveCSS('font-weight', '700');
  await expect(preview.locator('.nf-step-content ul li')).toHaveCount(2);
  await expect(preview.locator('.nf-step-content ul')).toContainText('<script>alert(1)</script>');
  await expect(preview.locator('script')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('formatted-preview.png') });
  expect((await readBuilder(page)).ready).toEqual(before.ready);
});

test('phone fields keep a readable focus font at small UI scales without disabling browser zoom', async ({ browser, browserName, baseURL }) => {
  test.skip(browserName === 'firefox', 'Firefox desktop does not emulate hasTouch.');
  const context = await browser.newContext({ ...(baseURL ? { baseURL } : {}), hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await setupBuilder(page); await page.goto('./#/build/procedure/step/shared');
    await page.evaluate(() => document.documentElement.style.setProperty('--nf-font-base', '4pt'));
    const input = page.getByRole('textbox', { name: 'Testo istruzione', exact: true }); await input.focus();
    expect(await input.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    expect(await page.locator('meta[name="viewport"]').getAttribute('content')).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/);
    await expectNoBleeding(page);
  } finally { await context.close(); }
});

test('compact image rows wrap at 2/4 and captions share the image midpoint', async ({ page }, info) => {
  await setupBuilder(page); await page.evaluate(() => window.NurseFlowF05.seedCompactGalleries());
  await page.goto('./#/build/procedure/step/shared');
  await expect(page.getByRole('heading', { name: 'Editor passaggio', exact: true })).toBeVisible();
  const layout = page.locator('[data-editor-gallery="before-note"]').getByRole('combobox', { name: 'Layout', exact: true });
  await layout.selectOption('grid-4'); await expect(layout).toHaveValue('grid-4');
  await layout.selectOption('grid-2'); await expect(layout).toHaveValue('grid-2');
  await page.getByRole('button', { name: 'Anteprima', exact: true }).click();
  const preview = page.getByRole('dialog');
  for (const [layout, max] of [['grid-2', 2], ['grid-4', 4]] as const) {
    const gallery = preview.locator('.nf-gallery--' + layout);
    await expect(gallery.locator('img')).toHaveCount(5);
    for (const image of await gallery.locator('img').all()) { await image.scrollIntoViewIfNeeded(); await expect(image).toBeVisible(); }
    const geometry = await gallery.locator('figure').evaluateAll((elements) => elements.map((element) => {
      const figure = element.getBoundingClientRect(); const image = element.querySelector('img')!.getBoundingClientRect();
      const caption = element.querySelector('figcaption')!.getBoundingClientRect();
      return { y: figure.y, center: image.x + image.width / 2, captionCenter: caption.x + caption.width / 2 };
    }));
    for (const figure of geometry) { expect(geometry.filter((other) => Math.abs(other.y - figure.y) < 1).length).toBeLessThanOrEqual(max); expect(figure.center).toBeCloseTo(figure.captionCenter, 0); }
    expect(new Set(geometry.map((figure) => figure.y)).size).toBeGreaterThan(1);
  }
  await page.screenshot({ path: info.outputPath('compact-galleries.png') });
});
