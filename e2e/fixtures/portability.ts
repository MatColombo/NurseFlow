import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { expect, test as base, type Page } from '@playwright/test';
import type * as Harness from './portability-browser';
declare global { interface Window { NurseFlowF13: typeof Harness } }
// Native Blob writes require a disk-backed context in Windows WebKit (same as F01/F07).
export const portableTest = base.extend({ context: async ({ playwright, browserName, baseURL, headless, locale }, use) => {
  const context = await playwright[browserName].launchPersistentContext('', { headless, acceptDownloads: true, ...(baseURL ? { baseURL } : {}), ...(locale ? { locale } : {}) });
  try { await use(context); } finally { await context.close(); }
} });
let bundle: Promise<string> | undefined;
async function harness() {
  bundle ??= (async () => {
    const result = await build({ configFile: false, logLevel: 'silent', resolve: { alias: { '@domain': fileURLToPath(new URL('../../src/domain', import.meta.url)), '@test': fileURLToPath(new URL('../../src/test', import.meta.url)), '@storage': fileURLToPath(new URL('../../src/storage', import.meta.url)) } }, build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('./portability-browser.ts', import.meta.url)), name: 'NurseFlowF13', formats: ['iife'] } } });
    const output = Array.isArray(result) ? result[0]?.output : 'output' in result ? result.output : []; const chunk = output?.find((item) => item.type === 'chunk'); if (!chunk || chunk.type !== 'chunk') throw new Error('Missing F13 harness'); return chunk.code;
  })(); return bundle;
}
export async function attachPortable(page: Page) { await page.addScriptTag({ content: await harness() }); }
export async function setupPortable(page: Page, scale = 13, theme: 'light' | 'dark' = 'light', locale: 'it' | 'en' = 'it') {
  await page.goto('./#/settings'); await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible(); await attachPortable(page);
  const seeded = await page.evaluate(({ scale, theme, locale }) => window.NurseFlowF13.seedPortable(scale, theme, locale), { scale, theme, locale });
  await page.goto('./#/data/procedures'); await page.reload(); await expect(page.getByRole('heading', { name: locale === 'it' ? 'Procedure e libreria' : 'Procedures & Library', exact: true })).toBeVisible(); return seeded;
}
export async function portableState(page: Page) { await attachPortable(page); return page.evaluate(() => window.NurseFlowF13.inspectPortable()); }
export async function portableFile(page: Page, kind: Parameters<typeof Harness.packageBytes>[0], name = kind + '.nfproc') { await attachPortable(page); return { name, mimeType: 'application/zip', buffer: Buffer.from(await page.evaluate((kind) => window.NurseFlowF13.packageBytes(kind), kind)) }; }
