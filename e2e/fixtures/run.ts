import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';
import type * as Harness from './run-browser';
declare global { interface Window { NurseFlowF10: typeof Harness } }
let bundlePromise: Promise<string> | undefined;
export function runHarness() {
  bundlePromise ??= (async () => {
    const bundle = await build({ configFile: false, logLevel: 'silent', resolve: { alias: {
      '@domain': fileURLToPath(new URL('../../src/domain', import.meta.url)), '@test': fileURLToPath(new URL('../../src/test', import.meta.url)),
    } }, build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('./run-browser.ts', import.meta.url)), name: 'NurseFlowF10', formats: ['iife'] } } });
    const output = Array.isArray(bundle) ? bundle[0]?.output : 'output' in bundle ? bundle.output : [];
    const chunk = output?.find((entry) => entry.type === 'chunk'); if (!chunk || chunk.type !== 'chunk') throw new Error('Run harness missing'); return chunk.code;
  })(); return bundlePromise;
}
export async function attachRunHarness(page: Page) { await page.evaluate(await runHarness()); }
export async function setupRun(page: Page, kind: Parameters<typeof Harness.seedRun>[0] = 'or', endKind?: Parameters<typeof Harness.seedRun>[1]) {
  await page.goto('./#/settings'); await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible();
  await attachRunHarness(page); await page.evaluate(({ kind, endKind }) => window.NurseFlowF10.seedRun(kind, endKind), { kind, endKind });
  await page.goto('./#/procedure/procedure'); await expect(page.getByRole('heading', { name: 'Cartoncini dimostrativi', exact: true })).toBeVisible();
  await page.getByRole('button', { name: kind === 'preview' ? 'Anteprima bozza' : 'Avvia', exact: true }).click();
  await expect(page.locator('[data-run-id]')).toBeVisible();
}
export async function runState(page: Page) { await attachRunHarness(page); return page.evaluate(() => window.NurseFlowF10.inspectRuns()); }
