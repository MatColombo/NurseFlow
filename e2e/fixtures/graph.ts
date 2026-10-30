import { expect, type Page } from '@playwright/test';
export const graphNode = (page: Page, id: string) => page.locator('[data-graph-node="' + id + '"]');
export const graphSurface = (page: Page) => page.getByRole('region', { name: 'Canvas Graph', exact: true });
export async function openGraph(page: Page) {
  await page.getByRole('toolbar', { name: 'Strumenti Builder', exact: true }).getByRole('button', { name: 'Graph', exact: true }).click();
  await expect(graphSurface(page)).toHaveAttribute('data-camera-initialized', 'true');
}
export async function locateGraphNode(page: Page, title: string) {
  await page.getByRole('button', { name: 'Trova nel grafo', exact: true }).click();
  const find = page.getByRole('dialog', { name: 'Trova nel grafo', exact: true });
  await find.getByRole('searchbox', { name: 'Cerca', exact: true }).fill(title);
  await find.getByRole('button', { name: 'Focalizza: ' + title, exact: true }).click(); await expect(find).not.toBeVisible();
}
export async function pickGraphNode(page: Page, title: string) {
  await locateGraphNode(page, title); await graphSurface(page).getByRole('button', { name: 'Scegli destinazione: ' + title, exact: true }).click();
}
export async function cancelGraphTarget(page: Page) {
  await page.locator('.nf-target-context').getByRole('button', { name: 'Annulla', exact: true }).click();
}
