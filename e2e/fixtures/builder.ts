import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';
import type * as Harness from './builder-browser';
declare global { interface Window { NurseFlowF05: typeof Harness } }
let code: Promise<string> | undefined;
async function harness() {
  code ??= (async () => {
    const bundle = await build({ configFile: false, logLevel: 'silent', resolve: { alias: {
      '@domain': fileURLToPath(new URL('../../src/domain', import.meta.url)), '@test': fileURLToPath(new URL('../../src/test', import.meta.url)),
    } }, build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('./builder-browser.ts', import.meta.url)), name: 'NurseFlowF05', formats: ['iife'] } } });
    const output = Array.isArray(bundle) ? bundle[0]?.output : 'output' in bundle ? bundle.output : [];
    const chunk = output?.find((entry) => entry.type === 'chunk'); if (!chunk || chunk.type !== 'chunk') throw new Error('Builder harness missing');
    return chunk.code;
  })(); return code;
}
export async function attachBuilderHarness(page: Page) { await page.evaluate(await harness()); }
export async function setupBuilder(page: Page, id = 'procedure') {
  await page.goto('./#/settings'); await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible();
  await attachBuilderHarness(page); const seeded = await page.evaluate(() => window.NurseFlowF05.seedBuilder());
  await page.goto('./#/build/' + id); await expect(page.getByRole('toolbar', { name: 'Strumenti Builder', exact: true })).toBeVisible();
  return seeded;
}
export async function readBuilder(page: Page, id = 'procedure') {
  await attachBuilderHarness(page); return page.evaluate((id) => window.NurseFlowF05.readBuilder(id), id);
}
