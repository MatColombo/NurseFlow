import { expect, test } from '@playwright/test';

test('monta la build statica senza placeholder o richieste esterne', async ({ page, baseURL }) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL ?? '').origin) {
      externalRequests.push(request.url());
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'NurseFlow', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Anteprima tecnica F00' })).toBeVisible();
  await expect(page).toHaveURL(`${baseURL}#/library`);
  await expect(page.getByText('not implemented')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Route di sviluppo' })).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

// Percorsi espliciti indipendenti dal catalogo dell'app: il test rileva route mancanti.
const deepLinks = [
  '/setup', '/library', '/procedure/example', '/run/example', '/run/example/end',
  '/procedure/example/map', '/new', '/build/example', '/build/example/step/node-example',
  '/build/example/check', '/settings', '/data/procedures', '/data/app',
];

for (const path of deepLinks) {
  test(`apre e ricarica il deep link hash ${path}`, async ({ page, baseURL }) => {
    await page.goto(`./#${path}`);
    await expect(page.getByRole('heading', { name: 'Anteprima tecnica F00' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'NurseFlow', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Anteprima tecnica F00' })).toBeVisible();
    await expect(page).toHaveURL(`${baseURL}#${path}`);
  });
}

test('recupera un hash sconosciuto', async ({ page, baseURL }) => {
  await page.goto('./#/missing');
  await expect(page.getByRole('heading', { name: 'Pagina non trovata' })).toBeVisible();
  await page.getByRole('link', { name: 'Torna alla libreria' }).click();
  await expect(page).toHaveURL(`${baseURL}#/library`);
  await expect(page.getByRole('heading', { name: 'Anteprima tecnica F00' })).toBeVisible();
});

test('F00 non registra service worker PWA', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'NurseFlow', level: 1 })).toBeVisible();
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
});
