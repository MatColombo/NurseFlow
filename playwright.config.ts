import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';
import { resolveBasePath } from './tooling/base-path.ts';

const environment = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const basePath = resolveBasePath(environment);
const baseURL = `http://127.0.0.1:4173${basePath}`;

export default defineConfig({
  testDir: './e2e/journeys',
  fullyParallel: true,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'playwright-results.json' }]],
  use: {
    baseURL,
    locale: 'it-IT',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testIgnore: '**/*.visual.spec.ts', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testIgnore: '**/*.visual.spec.ts', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [{
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_BASE_PATH: basePath },
  }, {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url: `http://127.0.0.1:4174${basePath}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { VITE_BASE_PATH: basePath },
  }],
});
