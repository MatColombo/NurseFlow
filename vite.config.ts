import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { resolveBasePath } from './tooling/base-path.ts';

export default defineConfig(({ mode }) => {
  const environment = { ...loadEnv(mode, process.cwd(), ''), ...process.env };

  return {
    base: resolveBasePath(environment),
    plugins: [react()],
    resolve: {
      alias: Object.fromEntries(
        ['app', 'domain', 'storage', 'features', 'shared', 'test'].map((name) => [
          `@${name}`,
          fileURLToPath(new URL(`./src/${name}`, import.meta.url)),
        ]),
      ),
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'tooling/**/*.test.ts'],
      clearMocks: true,
    },
  };
});
