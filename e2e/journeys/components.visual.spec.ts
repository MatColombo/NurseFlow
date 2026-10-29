import { expect, test } from '@playwright/test';
import { openShowcase } from '../fixtures/ui';

test('@visual componenti default 13pt e overlay', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await openShowcase(page, baseURL);
  await expect(page.getByTestId('components')).toHaveScreenshot('components-13pt-light.png');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByTestId('components')).toHaveScreenshot('components-13pt-dark.png');
  await page.emulateMedia({ colorScheme: 'light' });
  for (const name of ['Dialog', 'Sheet']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('dialog', { name, exact: true })).toHaveScreenshot(`${name.toLowerCase()}-13pt.png`);
    await page.keyboard.press('Escape');
  }
});
