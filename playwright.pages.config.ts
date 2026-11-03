import { defineConfig, devices } from '@playwright/test';

// The actual Download -> Full import -> offline Resume journey on deployed assets.
// Fixture code is injected into isolated test profiles, never into the bundle.
const target = new URL(process.env.NF_PAGES_URL ?? 'https://matcolombo.github.io/NurseFlow/');
if (target.protocol !== 'https:') throw new Error('NF_PAGES_URL must be HTTPS');
if (!target.pathname.endsWith('/')) target.pathname += '/';
export default defineConfig({
  testDir: './e2e/journeys', testMatch: 'backup.spec.ts', grep: /F14 I20/,
  timeout: 180_000, retries: 0, workers: 1,
  outputDir: 'test-results-pages',
  reporter: [['list'], ['html', { outputFolder: 'playwright-pages-report', open: 'never' }], ['json', { outputFile: 'playwright-pages-report/results.json' }]],
  use: { baseURL: target.href, locale: 'it-IT', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
