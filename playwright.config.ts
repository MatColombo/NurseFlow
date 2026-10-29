import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';
import { resolveBasePath } from './tooling/base-path.ts';

const environment = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const basePath = resolveBasePath(environment);
const baseURL = `http://127.0.0.1:4173${basePath}`;

export default defineConfig({
  testDir: './e2e/journeys',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_BASE_PATH: basePath },
  },
});
