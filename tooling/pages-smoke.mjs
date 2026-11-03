import { chromium } from '@playwright/test';
const target = process.argv[2];
if (!target || !/^https:\/\//.test(target)) throw new Error('Pass the final HTTPS Pages URL, including repository base.');
const url = new URL(target); url.hash = ''; if (!url.pathname.endsWith('/')) url.pathname += '/';
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ locale: 'it-IT', serviceWorkers: 'allow' });
  const page = await context.newPage();
  const faults = []; page.on('pageerror', (error) => faults.push(error.message));
  const response = await page.goto(url.href + '#/settings');
  if (!response?.ok()) throw new Error(`Pages response: ${response?.status()}`);
  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  if (!policy?.includes("script-src 'self'") || !policy.includes("object-src 'none'")) throw new Error('Missing static CSP');
  await page.getByText('Pronta offline · risorse app verificate', { exact: true }).waitFor({ timeout: 30000 });
  const manifest = await page.evaluate(async () => {
    const response = await fetch(document.querySelector('link[rel="manifest"]').href);
    const data = await response.json();
    return { scope: data.scope, start: data.start_url, icons: await Promise.all(data.icons.map(async (icon) => (await fetch(icon.src)).ok)) };
  });
  if (manifest.scope !== url.pathname || manifest.start !== url.pathname || !manifest.icons.every(Boolean)) throw new Error('Manifest/base/icons mismatch');
  await context.setOffline(true); await page.reload();
  await page.getByRole('heading', { name: 'Impostazioni', exact: true }).waitFor();
  await page.getByText('Pronta offline · risorse app verificate', { exact: true }).waitFor();
  if (faults.length) throw new Error(faults.join('\n'));
  console.log(`PASS Pages HTTPS, CSP, manifest, icons, controlled cache, hash route and offline reload: ${url.href}`);
} finally { await browser.close(); }
