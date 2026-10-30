import { expect, type Page } from '@playwright/test';

export async function openShowcase(page: Page, baseURL: string | undefined) {
  const url = new URL(baseURL ?? 'http://127.0.0.1:4173/');
  url.port = '4174'; url.hash = '/dev/components';
  await page.goto(url.href);
  await expect(page.getByRole('heading', { name: 'Componenti UI', exact: true })).toBeVisible();
}

export async function setScale(page: Page, value: number) {
  await page.getByRole('button', { name: /^Scala interfaccia/ }).click();
  const slider = page.getByRole('slider');
  await slider.focus();
  await slider.press(value === 48 ? 'End' : 'Home');
  if (value !== 48) for (let i = 4; i < value; i++) await slider.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuetext', `${value} pt`);
}

export async function expectNoBleeding(page: Page) {
  const failures = await page.evaluate(() => {
    const errors: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) errors.push(`viewport: ${document.documentElement.scrollWidth}/${innerWidth}`);
    for (const element of document.querySelectorAll<HTMLElement>('main button, main input, main .nf-card, main .nf-validation, main .nf-gallery, dialog[open]')) {
      const box = element.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      const canvas = element.closest('.nf-graph-viewport');
      if (canvas) {
        const viewport = canvas.getBoundingClientRect();
        if (viewport.left < -1 || viewport.right > innerWidth + 1) errors.push('Graph viewport outside app');
        continue; // The graph deliberately pans/clips scene elements inside its bounded viewport.
      }
      const carousel = element.closest('.nf-recent-tiles');
      const bounds = carousel?.getBoundingClientRect() ?? box;
      // Recent explicitly permits horizontal scrolling inside its single-row strip at large scales.
      if (bounds.left < -1 || bounds.right > innerWidth + 1) errors.push(`${element.tagName} outside viewport: ${bounds.left}/${bounds.right}`);
      // Native single-line inputs scroll their editable value; their box must still fit.
      if (!(element instanceof HTMLInputElement) && element.scrollWidth > element.clientWidth + 2) errors.push(`${element.tagName} clipping: ${element.scrollWidth}/${element.clientWidth}`);
    }
    return errors;
  });
  expect(failures).toEqual([]);
}
