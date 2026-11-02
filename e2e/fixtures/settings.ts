import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';
import type * as Harness from './settings-browser';
declare global { interface Window { NurseFlowF12: typeof Harness } }
let bundle: Promise<string> | undefined;
async function harness() {
  bundle ??= (async () => {
    const built = await build({ configFile: false, logLevel: 'silent', resolve: { alias: {
      '@domain': fileURLToPath(new URL('../../src/domain', import.meta.url)), '@test': fileURLToPath(new URL('../../src/test', import.meta.url)),
    } }, build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('./settings-browser.ts', import.meta.url)), name: 'NurseFlowF12', formats: ['iife'] } } });
    const output = Array.isArray(built) ? built[0]?.output : 'output' in built ? built.output : []; const chunk = output?.find((entry) => entry.type === 'chunk');
    if (!chunk || chunk.type !== 'chunk') throw new Error('Settings harness missing'); return chunk.code;
  })(); return bundle;
}
export async function attachSettingsHarness(page: Page) { await page.addScriptTag({ content: await harness() }); }
export async function setupSettings(page: Page, scale = 13, theme: 'light' | 'dark' | 'system' = 'light', verbose = false) {
  await page.goto('./#/settings'); await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible();
  await attachSettingsHarness(page); return page.evaluate(({ scale, theme, verbose }) => window.NurseFlowF12.seedSettings(scale, theme, verbose), { scale, theme, verbose });
}
export async function settingsData(page: Page) { await attachSettingsHarness(page); return page.evaluate(() => window.NurseFlowF12.readSettingsData()); }
