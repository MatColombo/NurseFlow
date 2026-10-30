import { expect, test as base } from '@playwright/test';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import type * as BrowserHarness from '../fixtures/storage-browser';

// Blob persistence is tested in a normal disk-backed profile. In this Windows
// WebKit build, even native IndexedDB rejects Blob writes in private contexts.
// An empty profile path lets Playwright create and clean up an isolated temp dir.
const test = base.extend({
  context: async ({ playwright, browserName, baseURL, headless }, use) => {
    const context = await playwright[browserName].launchPersistentContext('', {
      headless, ...(baseURL ? { baseURL } : {}),
    });
    try { await use(context); } finally { await context.close(); }
  },
});

declare global {
  interface Window { NurseFlowF01: typeof BrowserHarness }
}
let harness = '';
test.beforeAll(async () => {
  // In-memory test bundle: exercise the actual storage code on the preview origin.
  // It is never added to dist, the app entry point, or a diagnostic UI.
  const bundle = await build({ configFile: false, logLevel: 'silent',
    resolve: { alias: {
      '@domain': fileURLToPath(new URL('../../src/domain', import.meta.url)),
      '@test': fileURLToPath(new URL('../../src/test', import.meta.url)),
    } },
    build: { write: false, minify: false, lib: {
      entry: fileURLToPath(new URL('../fixtures/storage-browser.ts', import.meta.url)), name: 'NurseFlowF01', formats: ['iife'],
    } },
  });
  const output = Array.isArray(bundle) ? bundle[0]?.output : 'output' in bundle ? bundle.output : [];
  const chunk = output?.find((entry) => entry.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') throw new Error('Storage test bundle not produced');
  harness = chunk.code;
});

test('F01: tabelle, Ready immutabile, import atomico, quota e riapertura IndexedDB', async ({ page }) => {
  await page.goto('./');
  await page.addScriptTag({ content: harness });
  const state = await page.evaluate(() => window.NurseFlowF01.exerciseStorage());
  await page.reload();
  await page.addScriptTag({ content: harness });
  expect(await page.evaluate((state) => window.NurseFlowF01.inspectPersisted(state), state)).toBe(true);
});

test('F01/F05: migrazione reale v1→v4 preserva lo snapshot Ready', async ({ page }) => {
  await page.goto('./');
  await page.addScriptTag({ content: harness });
  expect(await page.evaluate(() => window.NurseFlowF01.exerciseMigration())).toBe(true);
});
