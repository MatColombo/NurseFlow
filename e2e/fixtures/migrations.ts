import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import type * as Harness from './migrations-browser';
declare global { interface Window { NurseFlowF15Migration: typeof Harness } }
let code: Promise<string> | undefined;
export async function attachMigrations(page: Page) {
  code ??= (async () => {
    const result = await build({ configFile: false, logLevel: 'silent', resolve: { alias: { '@domain': fileURLToPath(new URL('../../src/domain', import.meta.url)), '@test': fileURLToPath(new URL('../../src/test', import.meta.url)), '@storage': fileURLToPath(new URL('../../src/storage', import.meta.url)) } }, build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('./migrations-browser.ts', import.meta.url)), name: 'NurseFlowF15Migration', formats: ['iife'] } } });
    const output = Array.isArray(result) ? result[0]?.output : 'output' in result ? result.output : []; const chunk = output?.find((item) => item.type === 'chunk'); if (!chunk || chunk.type !== 'chunk') throw new Error('Missing migration harness'); return chunk.code;
  })(); await page.evaluate(await code);
}
