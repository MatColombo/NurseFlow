import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';
import { portableTest } from './portability';
import type * as Harness from './backup-browser';
declare global { interface Window { NurseFlowF14: typeof Harness } }
export const backupTest = portableTest;
let bundle: Promise<string> | undefined;
export async function attachBackup(page: Page) {
  bundle ??= (async () => {
    const result = await build({ configFile: false, logLevel: 'silent', resolve: { alias: { '@domain': fileURLToPath(new URL('../../src/domain', import.meta.url)), '@test': fileURLToPath(new URL('../../src/test', import.meta.url)), '@storage': fileURLToPath(new URL('../../src/storage', import.meta.url)) } }, build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('./backup-browser.ts', import.meta.url)), name: 'NurseFlowF14', formats: ['iife'] } } });
    const output = Array.isArray(result) ? result[0]?.output : 'output' in result ? result.output : []; const chunk = output?.find((item) => item.type === 'chunk'); if (!chunk || chunk.type !== 'chunk') throw new Error('Missing F14 harness'); return chunk.code;
  })(); await page.evaluate(await bundle);
}
export async function setupBackup(page: Page, scale = 13, theme: 'light' | 'dark' = 'light', locale: 'it' | 'en' = 'it', seed = true) {
  await page.goto('./#/data/app'); await expect(page.getByRole('heading', { name: 'Backup app e impostazioni', exact: true })).toBeVisible(); await attachBackup(page);
  await page.evaluate(({ scale, theme, locale, seed }) => window.NurseFlowF14.initializeBackup(scale, theme, locale, seed), { scale, theme, locale, seed }); await page.reload();
  await expect(page.getByRole('heading', { name: locale === 'it' ? 'Backup app e impostazioni' : 'App Backup & Settings', exact: true })).toBeVisible();
}
export async function backupState(page: Page) { await attachBackup(page); return page.evaluate(() => window.NurseFlowF14.inspectBackup()); }
export async function backupFile(page: Page, kind: Parameters<typeof Harness.backupBytes>[0] = 'full') { await attachBackup(page); return { name: 'F14-' + kind + (kind === 'settings' ? '.nfsettings' : '.nfbackup'), mimeType: 'application/zip', buffer: Buffer.from(await page.evaluate((kind) => window.NurseFlowF14.backupBytes(kind), kind)) }; }
