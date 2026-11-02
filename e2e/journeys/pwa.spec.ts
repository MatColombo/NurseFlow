import { expect, type Page } from '@playwright/test';
import { attachBackup, backupState, backupTest as test } from '../fixtures/backup';
import { pwaServer } from '../fixtures/pwa-server';

async function cached(page: Page) {
  await expect(page.getByText('Pronta offline · risorse app verificate', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}
test.beforeEach(async ({ page, browserName }, info) => {
  if (browserName !== 'webkit') return;
  await page.goto('./#/settings');
  const capability = await page.evaluate(async () => {
    try { const cache = await caches.open('NurseFlow-F15-capability'); await cache.put(new URL('probe', location.href), new Response('probe')); return { supported: true, reason: '' }; }
    catch (error) { return { supported: false, reason: String(error) }; }
    finally { await caches.delete('NurseFlow-F15-capability'); }
  });
  if (!capability.supported) {
    await info.attach('native-cache-limitation', { body: capability.reason, contentType: 'text/plain' });
    test.skip(true, `Native Cache API unavailable in this WebKit environment: ${capability.reason}. Not an iOS test.`);
  }
});
async function seed(page: Page) {
  await attachBackup(page); await page.evaluate(() => window.NurseFlowF14.initializeBackup());
  await page.reload(); await cached(page);
}

test('F15 actual precache, install manifest, offline cold reload and pinned local Blob run', async ({ page, context, browserName }) => {
  const host = await pwaServer();
  try {
    await page.goto(host.url + '#/settings'); await cached(page);
    const manifest = await page.evaluate(async () => {
      const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href;
      const data = await (await fetch(href)).json() as { start_url: string; scope: string; display: string; icons: { src: string; sizes: string; purpose: string }[] };
      return { data, icons: await Promise.all(data.icons.map(async (icon) => ({ ...icon, ok: (await fetch(icon.src)).ok }))) };
    });
    expect(manifest.data.scope).toBe(new URL(host.url).pathname); expect(manifest.data.start_url).toBe(new URL(host.url).pathname);
    expect(manifest.data.display).toBe('standalone'); expect(manifest.icons.every((icon) => icon.ok)).toBe(true); expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
    if (browserName === 'chromium') {
      const cdp = await context.newCDPSession(page);
      await expect.poll(async () => (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([]);
      await cdp.detach();
    }
    await seed(page); const before = await backupState(page); const run = before.runs.find((item) => item.status === 'active' && 'runtimeVersion' in item && item.groups.length === 0)!;
    await context.setOffline(true); await page.goto(host.url + '#/run/' + run.id); await page.reload();
    await expect(page.getByText('Contenuto authored: materiale 0', { exact: true })).toBeVisible(); await expect(page.getByRole('img', { name: 'Cartoncino locale', exact: true })).toBeVisible();
    await expect(page.locator('figure[data-media-id]').filter({ hasText: 'W07' })).toBeVisible();
    await expect(page.locator('figure[data-media-id="m-url"]')).toContainText('Immagine non disponibile');
    await expect(page.locator('figure[data-media-id="m-url"] img')).toHaveCount(0);
    expect((await backupState(page)).runs).toEqual(before.runs);
    await page.goto(host.url + '#/build/' + before.procedures[0]!.id); await page.reload(); await expect(page.getByRole('region', { name: 'Builder', exact: true })).toBeVisible();
    await page.goto(host.url + '#/library'); await page.reload(); await expect(page.getByRole('heading', { name: 'Libreria', exact: true })).toBeVisible();
    await page.goto(host.url + '#/settings'); await page.reload(); await cached(page);
    await page.getByRole('button', { name: /Verifica aggiornamenti/ }).click(); await expect(page.getByRole('dialog')).toContainText('Verifica non disponibile offline');
  } finally { await context.setOffline(false); await host.close(); }
});

test('F15 real update waits for another tab editor and only reloads the consenting idle tab', async ({ page, context }) => {
  const host = await pwaServer();
  try {
    await page.goto(host.url + '#/settings'); await cached(page);
    const other = await context.newPage(); await other.goto(host.url + '#/new');
    await expect(other.getByRole('textbox').first()).toBeVisible(); await other.getByRole('textbox').first().fill('Testo non salvato F15');
    await page.evaluate(() => { document.documentElement.dataset.f15 = 'same-document'; });
    await other.evaluate(() => { document.documentElement.dataset.f15 = 'other-document'; });
    host.update(); await page.getByRole('button', { name: /Verifica aggiornamenti/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Aggiornamento disponibile');
    await page.getByRole('button', { name: 'Aggiorna quando inattiva', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('In attesa che l’app sia inattiva');
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.f15)).toBe('same-document');
    await page.waitForTimeout(3500);
    expect(await other.getByRole('textbox').first().inputValue()).toBe('Testo non salvato F15');
    expect(await page.evaluate(() => document.documentElement.dataset.f15)).toBe('same-document');
    await other.close(); await expect.poll(() => page.evaluate(() => document.documentElement.dataset.f15).catch(() => 'navigating'), { timeout: 20000 }).toBeUndefined();
    await cached(page);
  } finally { await host.close(); }
});

test('F15 waiting worker never reloads a pinned run, including offline resume', async ({ page, context }) => {
  const host = await pwaServer();
  try {
    await page.goto(host.url + '#/settings'); await cached(page); await seed(page);
    const before = await backupState(page); const run = before.runs.find((item) => item.status === 'active' && 'runtimeVersion' in item && item.groups.length === 0)!;
    await page.goto(host.url + '#/run/' + run.id); await expect(page.getByText('Contenuto authored: materiale 0', { exact: true })).toBeVisible();
    await page.evaluate(() => { document.documentElement.dataset.f15 = 'pinned-run'; });
    const settings = await context.newPage(); await settings.goto(host.url + '#/settings'); await cached(settings); host.update();
    await settings.getByRole('button', { name: /Verifica aggiornamenti/ }).click(); await expect(settings.getByRole('dialog')).toContainText('Aggiornamento disponibile');
    await settings.getByRole('button', { name: 'Aggiorna quando inattiva', exact: true }).click(); await expect(settings.getByRole('dialog')).toContainText('In attesa che l’app sia inattiva');
    await page.waitForTimeout(5500); expect(await page.evaluate(() => document.documentElement.dataset.f15)).toBe('pinned-run');
    await expect.poll(() => settings.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting)).toBe(true);
    await context.setOffline(true); await page.reload(); await expect(page.getByText('Contenuto authored: materiale 0', { exact: true })).toBeVisible();
    expect((await backupState(page)).runs).toEqual(before.runs); await settings.close();
  } finally { await context.setOffline(false); await host.close(); }
});

test('F15 cache eviction never claims readiness or recovery of removed data', async ({ page }) => {
  const host = await pwaServer();
  try {
    await page.goto(host.url + '#/settings'); await cached(page);
    await page.evaluate(async () => { for (const name of await caches.keys()) await caches.delete(name); });
    await page.getByRole('button', { name: /Informazioni/ }).click(); await expect(page.getByRole('dialog')).toContainText('non può determinarne la causa o recuperare dati rimossi');
    await page.getByRole('dialog').getByRole('button', { name: /Chiudi/ }).click();
    await page.reload(); await expect(page.getByText('Cache offline incompleta.', { exact: false })).toBeVisible();
    await expect(page.getByText('Pronta offline · risorse app verificate', { exact: true })).toHaveCount(0);
  } finally { await host.close(); }
});
