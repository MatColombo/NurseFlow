import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import { resolveBasePath } from './tooling/base-path.ts';

export default defineConfig(({ mode }) => {
  const environment = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const base = resolveBasePath(environment);

  return {
    base,
    plugins: [react(), VitePWA({
      strategies: 'injectManifest', srcDir: 'src', filename: 'sw.ts',
      registerType: 'prompt', injectRegister: false,
      includeAssets: ['icons/*.png'],
      manifest: {
        id: base, name: 'NurseFlow', short_name: 'NurseFlow',
        description: 'Procedure personali sul dispositivo · Personal procedures on this device',
        lang: 'it', start_url: base, scope: base, display: 'standalone',
        theme_color: '#087f8c', background_color: '#f4f8fa',
        icons: [
          { src: `${base}icons/app-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/app-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: { globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'], maximumFileSizeToCacheInBytes: 2 * 1024 * 1024 },
      devOptions: { enabled: false },
    })],
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
