import { expect, test, type Page } from '@playwright/test';
import { setupBuilder, readBuilder } from '../fixtures/builder';
import { openGraph } from '../fixtures/graph';
import { runState, setupRun } from '../fixtures/run';
import { expectNoBleeding, setScale } from '../fixtures/ui';
import { setupSettings } from '../fixtures/settings';

const row = (page: Page, id: string) => page.locator(`[data-outline-node="${id}"]`);
const sheet = (page: Page) => page.getByRole('dialog');
const apply = async (page: Page) => { await sheet(page).getByRole('button', { name: 'Applica modifica', exact: true }).click(); await expect(sheet(page)).toHaveCount(0); };

test('AND follow-up and external collector persist with Undo/Redo; Ready is unchanged', async ({ page }, info) => {
  await setupBuilder(page, 'multi'); const before = await readBuilder(page, 'multi');
  await row(page, 'tasks').getByRole('button', { name: /^Dopo tutte le attività · / }).click();
  await sheet(page).getByRole('button', { name: 'Inserisci prima', exact: true }).click();
  await sheet(page).getByRole('button', { name: 'Istruzione', exact: true }).click(); await apply(page);
  await expect(page).toHaveURL(/\/step\//); const withCollector = await readBuilder(page, 'multi');
  const collector = withCollector.revision.graph.nodes.find((node) => !before.revision.graph.nodes.some((old) => old.id === node.id))!;
  await page.getByRole('button', { name: 'Fine', exact: true }).click();
  await row(page, 'task-1').getByRole('button', { name: 'Passo successivo · Attività terminata', exact: true }).click();
  await expect(sheet(page)).toContainText('stesso passo esterno');
  await sheet(page).getByRole('button', { name: 'Inserisci prima', exact: true }).click();
  await expect(sheet(page).getByRole('button', { name: 'Prendi una decisione', exact: true })).toHaveCount(0);
  await expect(sheet(page).getByRole('button', { name: 'Attività multitasking', exact: true })).toHaveCount(0);
  await sheet(page).getByRole('button', { name: 'Avviso', exact: true }).click(); await apply(page);
  await expect(page).toHaveURL(/\/step\//); const saved = await readBuilder(page, 'multi');
  const followup = saved.revision.graph.nodes.find((node) => !withCollector.revision.graph.nodes.some((old) => old.id === node.id))!;
  expect(followup).toMatchObject({ kind: 'alert', next: { kind: 'activity-complete' } });
  expect(saved.revision.graph.nodes.find((node) => node.id === 'tasks')).toMatchObject({ afterAll: { kind: 'node', nodeId: collector.id } });
  expect(saved.ready).toEqual(before.ready);
  await page.reload(); await expect(page.locator('[data-node-id]')).toHaveAttribute('data-node-id', followup.id);
  await page.getByRole('button', { name: 'Fine', exact: true }).click();
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page, 'multi')).revision.graph).toEqual(withCollector.revision.graph);
  await page.getByRole('button', { name: 'Ripeti modifica', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page, 'multi')).revision.graph).toEqual(saved.revision.graph);
  await openGraph(page);
  const edges = await page.locator('[data-graph-edge][data-completion=true]').evaluateAll((elements) => elements.map((element) => ({ target: element.getAttribute('data-target'), path: element.getAttribute('d')! })));
  expect(edges.length).toBeGreaterThan(0); expect(edges.every((edge) => edge.target === collector.id)).toBe(true);
  await page.getByRole('button', { name: 'Adatta', exact: true }).click();
  await page.screenshot({ path: info.outputPath('and-horizontal.png') });
});

test('Graph arrows run right to left face, with horizontal arrival and one shared node', async ({ page }) => {
  await setupBuilder(page); await openGraph(page);
  const edges = await page.locator('[data-graph-edge]').evaluateAll((elements) => elements.map((element) => {
    const points = element.getAttribute('d')!.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    const target = document.querySelector(`[data-graph-node="${element.getAttribute('data-target')}"]`)!;
    const source = document.querySelector(`[data-graph-node="${element.getAttribute('data-source')}"]`)!;
    return { points, targetX: Number(target.getAttribute('x')), sourceRight: Number(source.getAttribute('x')) + Number(source.getAttribute('width')) };
  }));
  for (const { points, targetX, sourceRight } of edges) {
    const curve = points.slice(-6);
    expect(points[0]).toBe(sourceRight); expect(curve[4]).toBe(targetX); expect(curve[4]).toBeGreaterThan(points[0]!);
    expect(curve[1]).toBe(points[1]); expect(curve[3]).toBe(curve[5]); expect(curve[2]).toBeLessThan(curve[4]!);
  }
  await expect(page.locator('[data-graph-node="shared"]')).toHaveCount(1);
});

test('Light motion, reduced motion and compact default-open note preserve Run state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await setupRun(page);
  const before = await runState(page);
  const note = page.getByRole('region', { name: 'Nota del passaggio', exact: true });
  await expect(note.getByRole('button', { name: 'Nascondi nota', exact: true })).toHaveAttribute('aria-expanded', 'true');
  const metrics = await note.evaluate((element) => {
    const button = element.querySelector('button')!; const text = element.querySelector('p')!;
    const caption = document.querySelector('.nf-step-content figcaption')!;
    return { width: element.getBoundingClientRect().width, buttonWidth: button.getBoundingClientRect().width,
      body: parseFloat(getComputedStyle(text).fontSize), caption: parseFloat(getComputedStyle(caption).fontSize) };
  });
  expect(metrics.buttonWidth).toBeLessThan(metrics.width); expect(metrics.body).toBeGreaterThan(metrics.caption);
  await page.getByRole('button', { name: 'Esci', exact: true }).click();
  expect(await sheet(page).evaluate((element) => getComputedStyle(element).animationName)).toBe('nf-popup');
  await page.keyboard.press('Escape'); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Esci', exact: true }).click();
  expect(await sheet(page).evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
  expect(await page.locator('html').evaluate((element) => getComputedStyle(element).scrollBehavior)).toBe('auto');
  await page.keyboard.press('Escape'); expect((await runState(page)).runs).toEqual(before.runs);
});

for (const scale of [4, 48]) test(`Outline focus scrolls once under its toolbar at 320px/${scale}pt`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await page.emulateMedia({ reducedMotion: 'no-preference' });
  await setupBuilder(page, 'many'); const before = await readBuilder(page, 'many');
  await page.goto('./#/settings'); await setScale(page, scale); await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await page.goto('./#/build/many');
  await row(page, 'tasks').locator('button[aria-label*="Operazione 32"]').last().click();
  const target = row(page, 'task-32').getByRole('button', { name: 'Operazione 32', exact: true });
  await expect(target).toBeFocused();
  await expect.poll(async () => target.evaluate((element) => {
    const bounds = element.getBoundingClientRect(); const toolbar = document.querySelector('.nf-builder-toolbar')!.getBoundingClientRect();
    // A large authored title can be taller than the remaining viewport. It must
    // start below the sticky toolbar and expose a usable target, with natural scrolling.
    const visible = Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, toolbar.bottom);
    return bounds.top >= toolbar.bottom - 1 && visible >= 44;
  })).toBe(true);
  await target.press('Enter'); await expect(sheet(page)).toBeVisible(); await page.keyboard.press('Escape');
  const after = await readBuilder(page, 'many'); expect(after.revision.graph).toEqual(before.revision.graph); expect(after.ready).toEqual(before.ready);
});

test('Library group header reflows at 320px/48pt with wide fallback font glyphs', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await setupSettings(page, 48, 'light', true);
  await page.goto('./#/library'); await page.reload(); await expect(page.getByTestId('library-pane')).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontFamily = 'Georgia, serif'; });
  await expectNoBleeding(page);
  const group = page.getByRole('button', { name: /Esempi \(1\)/ });
  await group.click(); await expect(group).toHaveAttribute('aria-expanded', 'false');
  await group.click(); await expect(group).toHaveAttribute('aria-expanded', 'true');
  await expectNoBleeding(page);
});
