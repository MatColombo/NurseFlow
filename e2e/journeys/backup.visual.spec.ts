import { expect } from '@playwright/test';
import { backupFile, backupState, backupTest as test, setupBackup } from '../fixtures/backup';
import { expectNoBleeding } from '../fixtures/ui';
for (const width of [320, 390, 768]) for (const scale of [4, 13, 30, 48]) {
  test(`F14 Page11B settings/full diff and second consent ${width}px ${scale}pt`, async ({ page }, info) => {
    const en = scale === 30; await page.setViewportSize({ width, height: 844 }); await setupBackup(page, scale, scale === 13 ? 'light' : 'dark', en ? 'en' : 'it'); const before = await backupState(page);
    await expectNoBleeding(page); await page.getByRole('button', { name: en ? 'Import' : 'Importa', exact: true }).click(); const settings = await backupFile(page, 'settings'); settings.name = 'nome-lungo-'.repeat(14) + '.nfsettings';
    await page.getByLabel(en ? 'Choose file' : 'Scegli file', { exact: true }).setInputFiles(settings); await expect(page.getByRole('region', { name: en ? 'Settings comparison' : 'Confronto impostazioni' })).toBeVisible(); await expectNoBleeding(page);
    if (width === 320 && scale === 13) await page.screenshot({ path: info.outputPath('F14-settings-comparison-320px-13pt.png') });
    await page.getByRole('button', { name: en ? 'Replace settings…' : 'Sostituisci impostazioni…', exact: true }).click(); await expectNoBleeding(page); await page.getByRole('dialog').getByRole('button', { name: en ? 'Cancel' : 'Annulla', exact: true }).click();
    await page.getByLabel(en ? 'Choose file' : 'Scegli file', { exact: true }).setInputFiles(await backupFile(page)); const toggle = page.getByRole('checkbox', { name: en ? 'Also replace settings' : 'Sostituisci anche le impostazioni' }); await expect(toggle).not.toBeChecked(); await toggle.check(); await expectNoBleeding(page);
    await page.getByRole('button', { name: en ? 'Import backup' : 'Importa backup', exact: true }).click(); await expectNoBleeding(page); await page.getByRole('dialog').getByRole('button', { name: en ? 'Continue to settings consent' : 'Prosegui al consenso impostazioni', exact: true }).click(); await expectNoBleeding(page);
    const confirm = page.getByRole('dialog').getByRole('button', { name: en ? 'Confirm replacement' : 'Conferma sostituzione', exact: true }); await confirm.scrollIntoViewIfNeeded(); await expect(confirm).toBeInViewport({ ratio: 1 });
    if (width === 320 && scale === 48) await page.screenshot({ path: info.outputPath('F14-confirm-320px-48pt-dark.png') });
    await page.getByRole('dialog').getByRole('button', { name: en ? 'Cancel' : 'Annulla', exact: true }).click(); await expectNoBleeding(page); const cancelAll = page.getByRole('dialog').getByRole('button', { name: en ? 'Cancel everything' : 'Annulla tutto', exact: true }); await cancelAll.scrollIntoViewIfNeeded(); await expect(cancelAll).toBeInViewport({ ratio: 1 }); await cancelAll.click();
    expect(await backupState(page)).toEqual(before);
  });
}
