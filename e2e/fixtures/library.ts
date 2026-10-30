import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';
import type * as Harness from './library-browser';

declare global { interface Window { NurseFlowF03: typeof Harness } }
let bundlePromise: Promise<string> | undefined;
export function libraryHarness() {
  bundlePromise ??= (async () => {
    const bundle = await build({ configFile: false, logLevel: 'silent', resolve: { alias: {
      '@domain': fileURLToPath(new URL('../../src/domain', import.meta.url)), '@test': fileURLToPath(new URL('../../src/test', import.meta.url)),
    } }, build: { write: false, minify: false, lib: {
      entry: fileURLToPath(new URL('./library-browser.ts', import.meta.url)), name: 'NurseFlowF03', formats: ['iife'],
    } } });
    const output = Array.isArray(bundle) ? bundle[0]?.output : 'output' in bundle ? bundle.output : [];
    const chunk = output?.find((entry) => entry.type === 'chunk');
    if (!chunk || chunk.type !== 'chunk') throw new Error('Library harness missing'); return chunk.code;
  })();
  return bundlePromise;
}
export async function attachLibraryHarness(page: Page) { await page.addScriptTag({ content: await libraryHarness() }); }
export async function seedLibrary(page: Page) {
  await page.goto('./#/settings'); await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible();
  await attachLibraryHarness(page); await page.evaluate(() => window.NurseFlowF03.seedLibrary());
  await page.goto('./#/library'); await expect(page.getByRole('heading', { name: 'Procedure', exact: true })).toBeVisible();
}
export async function completeSetup(page: Page) {
  await page.goto('./'); await expect(page.getByRole('heading', { name: 'NurseFlow', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Inizia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Procedure', exact: true })).toBeVisible();
}
