import { expect, test } from '@playwright/test';
import { settingsData, setupSettings } from '../fixtures/settings';
import { expectNoBleeding } from '../fixtures/ui';

test('F12 clear from 320px/48pt dark resets appearance and permits first locale change with strict storage after commit', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await setupSettings(page, 48, 'dark'); await page.reload();
  await page.getByRole('button', { name: /^Avanzate/ }).click(); await page.getByRole('button', { name: 'Cancella dati locali', exact: true }).click();
  const sheet = page.getByRole('dialog'); await expect(sheet).toHaveAccessibleName('Cancella dati locali'); await expectNoBleeding(page);
  await sheet.getByRole('button', { name: 'Prosegui alla conferma finale' }).click(); await expectNoBleeding(page);
  await sheet.getByRole('checkbox').check(); await sheet.getByRole('button', { name: 'Elimina definitivamente tutti i dati' }).click();
  await expect(page).toHaveURL(/\/setup$/); await expect(page.getByRole('button', { name: 'Inizia', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect.poll(async () => (await settingsData(page)).settings?.locale).toBe('en');
  await page.reload(); await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Procedures', exact: true })).toBeVisible();
  await page.goto('./#/settings'); await page.reload(); await expect(page.getByRole('button', { name: 'UI scale 13 pt', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Language English', exact: true })).toBeVisible();
  const data = await settingsData(page); expect(data.procedures).toEqual([]); expect(data.runs).toEqual([]); expect(data.view?.firstLaunchComplete).toBe(true);
});

for (const scale of [4, 48]) test(`F12 Settings dialogs dark 320px ${scale}pt remain bounded with reachable controls`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await setupSettings(page, scale, 'dark'); await page.reload();
  for (const label of ['Lingua', 'Scala interfaccia', 'Tema', 'Limite nuove aggiunte', 'Compressione per le prossime foto', 'Protezione archivio', 'Spazio utilizzato', 'Verifica aggiornamenti', 'Informazioni']) {
    await page.getByRole('button', { name: new RegExp('^' + label) }).click();
    await expect(page.getByRole('dialog')).toBeVisible(); await expectNoBleeding(page);
    await page.getByRole('dialog').getByRole('button', { name: 'Chiudi', exact: true }).click();
  }
  await page.getByRole('button', { name: /^Avanzate/ }).click(); await page.getByRole('button', { name: 'Ripristina vista Libreria', exact: true }).click();
  await expectNoBleeding(page); await page.getByRole('dialog').getByRole('button', { name: 'Annulla', exact: true }).click();
  await page.getByRole('button', { name: 'Ripristina 13 pt', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Scala interfaccia 13 pt', exact: true })).toBeVisible();
});
