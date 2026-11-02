import { expect } from '@playwright/test';
import { portableFile, portableState, portableTest as test, setupPortable } from '../fixtures/portability';
import { expectNoBleeding } from '../fixtures/ui';
for (const width of [320, 390, 768]) for (const scale of [4, 13, 30, 48]) {
  test(`F13 Page11A Export/Import ${width}px ${scale}pt`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 }); const locale = scale === 30 ? 'en' : 'it'; await setupPortable(page, scale, scale === 13 ? 'light' : 'dark', locale);
    const before = await portableState(page); await expect(page.getByRole('checkbox')).toHaveCount(10); await expectNoBleeding(page);
    if (width === 320 && scale === 13) await page.screenshot({ path: info.outputPath('F13-export-320px.png') });
    await page.getByRole('button', { name: locale === 'it' ? 'Importa' : 'Import', exact: true }).click(); const file = await portableFile(page, 'single', 'nome-file-lungo-'.repeat(8) + '.nfproc');
    await page.getByLabel(locale === 'it' ? 'Carica uno o più file' : 'Load one or more files').setInputFiles(file); await expect(page.getByRole('checkbox')).toHaveCount(1); await expectNoBleeding(page);
    await page.getByRole('button', { name: (locale === 'it' ? 'Anteprima: ' : 'Preview: ') + 'Cartoncino 0', exact: true }).click(); await expect(page.getByRole('list', { name: locale === 'it' ? 'Lista dei passi' : 'Step list', exact: true })).toBeVisible(); await expectNoBleeding(page);
    await page.getByRole('dialog').getByRole('button', { name: locale === 'it' ? 'Chiudi' : 'Close', exact: true }).first().click();
    await page.getByRole('button', { name: locale === 'it' ? 'Importa le procedure selezionate' : 'Import selected procedures', exact: true }).click();
    await expect(page.getByRole('dialog').getByText(/Spazio usato nell’origine|Stima dello spazio non disponibile|Origin storage used|Storage estimate unavailable/)).toBeVisible(); await expectNoBleeding(page);
    if (width === 320 && scale === 48) await page.screenshot({ path: info.outputPath('F13-import-confirm-320px-48pt-dark.png') });
    const add = page.getByRole('dialog').getByRole('button', { name: locale === 'it' ? 'Aggiungi come copie' : 'Add as copies', exact: true }); await add.scrollIntoViewIfNeeded(); await expect(add).toBeInViewport({ ratio: 1 }); await expectNoBleeding(page);
    if (width === 320 && scale === 48) await page.screenshot({ path: info.outputPath('F13-import-actions-320px-48pt-dark.png') });
    const cancel = page.getByRole('dialog').getByRole('button', { name: locale === 'it' ? 'Annulla' : 'Cancel', exact: true }); await cancel.scrollIntoViewIfNeeded(); await expect(cancel).toBeInViewport({ ratio: 1 });
    await cancel.click(); expect(await portableState(page)).toEqual(before);
  });
}
