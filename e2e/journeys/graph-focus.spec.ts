import { expect, test } from '@playwright/test';
import { setupBuilder } from '../fixtures/builder';
import { graphNode, graphSurface, locateGraphNode, openGraph } from '../fixtures/graph';
import { setScale } from '../fixtures/ui';

test('oversized graph card exposes a clickable first outlet after Find', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 844 }); await setupBuilder(page);
  await page.goto('./#/settings'); await setScale(page, 48);
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await page.goto('./#/build/procedure'); await openGraph(page);
  await locateGraphNode(page, 'Scelta dimostrativa');
  const outlet = graphNode(page, 'decision').getByRole('button', { name: 'A · Percorso A', exact: true });
  await outlet.scrollIntoViewIfNeeded();
  const geometry = await outlet.evaluate((element) => {
    const box = element.getBoundingClientRect(); const viewport = document.querySelector('.nf-graph-viewport')!.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return { button: box.toJSON(), viewport: viewport.toJSON(), hit: hit?.outerHTML.slice(0, 300), clickable: hit === element || Boolean(hit && element.contains(hit)) };
  });
  await info.attach('geometry', { body: JSON.stringify(geometry, null, 2), contentType: 'application/json' });
  await page.screenshot({ path: info.outputPath('focused-card.png') });
  expect(geometry.clickable).toBe(true);
  await outlet.click(); await expect(page.getByRole('dialog')).toContainText('Scelta dimostrativa / A');
  await expect(graphSurface(page)).toBeAttached();
});
