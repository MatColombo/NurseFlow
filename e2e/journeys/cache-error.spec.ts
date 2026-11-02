import { expect } from '@playwright/test';
import { portableTest as test } from '../fixtures/portability';

test('F15 a native Cache API write failure never shows offline ready', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'Target the native Windows WebKit Cache API limitation when present.');
  await page.goto('./#/settings');
  const error = await page.evaluate(async () => {
    try { const cache = await caches.open('NurseFlow-F15-probe'); await cache.put(new URL('probe', location.href), new Response('probe')); return null; }
    catch (error) { return String(error); }
    finally { await caches.delete('NurseFlow-F15-probe'); }
  });
  test.skip(error === null, 'Cache API works here; offline tests cover this browser.');
  expect(error).toContain('Failed writing data to the file system');
  await expect(page.getByText('Cache offline non verificata.', { exact: false })).toBeVisible();
  await expect(page.getByText('Pronta offline · risorse app verificate', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Riprova', exact: true }).click();
  await expect(page.getByText('Cache offline non verificata.', { exact: false })).toBeVisible();
});
