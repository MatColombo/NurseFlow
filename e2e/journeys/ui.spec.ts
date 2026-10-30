import { expect, test } from '@playwright/test';
import { expectNoBleeding, openShowcase, setScale } from '../fixtures/ui';
import { completeSetup } from '../fixtures/library';

for (const width of [320, 390, 768]) {
  for (const scale of [4, 13, 30, 48]) {
    test(`componenti a ${width}px e ${scale}pt senza overflow o clipping`, async ({ page, baseURL }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      await openShowcase(page, baseURL);
      await setScale(page, scale);
      await expectNoBleeding(page);
      await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
      await expectNoBleeding(page);
      const gallery = page.getByRole('img', { name: 'Campione geometrico locale', exact: true });
      const imageBox = await gallery.boundingBox();
      expect(await gallery.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(120);
      expect(imageBox!.width / imageBox!.height).toBeCloseTo(2, 1);
      const metrics = await page.getByTestId('components').evaluate((element) => {
        const button = element.querySelector('button')!;
        const card = element.querySelector('.nf-card')!;
        const icon = button.querySelector('svg')!;
        return { base: parseFloat(getComputedStyle(document.documentElement).fontSize),
          pageTitle: parseFloat(getComputedStyle(document.querySelector('.nf-title')!).fontSize),
          title: parseFloat(getComputedStyle(card.querySelector('h3')!).fontSize),
          note: parseFloat(getComputedStyle(card.querySelector('.nf-note')!).fontSize),
          badge: parseFloat(getComputedStyle(card.querySelector('.nf-badge')!).fontSize),
          padding: parseFloat(getComputedStyle(card).paddingTop), icon: icon.getBoundingClientRect().width,
          button: button.getBoundingClientRect().height, transform: getComputedStyle(document.documentElement).transform };
      });
      expect(metrics.base).toBeCloseTo(scale * 4 / 3, 1);
      expect(metrics.pageTitle).toBeCloseTo((scale + 4) * 4 / 3, 1);
      expect(metrics.title).toBeCloseTo((scale + 3) * 4 / 3, 1);
      expect(metrics.note).toBeCloseTo((scale - 1) * 4 / 3, 1);
      expect(metrics.badge).toBeCloseTo((scale - 2) * 4 / 3, 1);
      expect(metrics.button).toBeGreaterThanOrEqual(44);
      expect(metrics.icon).toBeCloseTo(20 * scale / 13, 1);
      expect(metrics.padding).toBeCloseTo(Math.min(10 * (scale - 4) / 9, width * .04), 1);
      expect(metrics.transform).toBe('none');
      await page.getByRole('button', { name: 'Dialog', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Dialog', exact: true });
      await expect(dialog).toBeVisible(); await expectNoBleeding(page);
      await dialog.getByRole('button', { name: 'Annulla', exact: true }).click();
      if (width === 320 && scale === 48) await testInfo.attach('components-320px-48pt', {
        body: await page.getByTestId('components').screenshot(), contentType: 'image/png',
      });
      await page.getByRole('button', { name: 'Ripristina 13 pt', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Scala interfaccia 13 pt' })).toBeVisible();
    });
  }
}

test('focus tastiera contenuto e ripristinato per Dialog e Sheet, anche a 48pt', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openShowcase(page, baseURL); await setScale(page, 48);
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  for (const name of ['Dialog', 'Sheet']) {
    const trigger = page.getByRole('button', { name, exact: true });
    await trigger.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name, exact: true });
    await expect(dialog.getByRole('heading', { name, exact: true })).toBeFocused();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
    const focus = await page.locator(':focus').evaluate((element) => ({
      width: getComputedStyle(element).outlineWidth, style: getComputedStyle(element).outlineStyle,
    }));
    expect(focus.style).toBe('solid'); expect(parseFloat(focus.width)).toBeGreaterThanOrEqual(3);
    await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
  }
});

test('theme System segue OS, override e lingua/scala sopravvivono a reload e navigazione offline', async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await completeSetup(page);
  await page.goto('./#/settings');
  await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Tema Sistema' }).click();
  await page.getByRole('radio', { name: 'Scuro' }).check();
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await setScale(page, 48);
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await page.getByRole('button', { name: 'Lingua Italiano' }).click();
  await page.getByRole('radio', { name: 'English', exact: true }).check();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'UI scale 48 pt', exact: true })).toBeVisible();
  await expectNoBleeding(page);
  const requests: string[] = []; page.on('request', (request) => requests.push(request.url()));
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Language English' }).click();
  await page.getByRole('radio', { name: 'Italiano' }).check();
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await page.getByRole('link', { name: 'Indietro', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Libreria', exact: true })).toBeVisible();
  expect(requests).toEqual([]);
});

test('save fallito mostra errore e Retry dentro lo sheet attivo', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('button', { name: 'Tema Sistema' }).click();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'settings') {
        IDBObjectStore.prototype.put = original;
        throw new DOMException('Simulated quota', 'QuotaExceededError');
      }
      return original.apply(this, args);
    };
  });
  await page.getByRole('radio', { name: 'Scuro', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Tema', exact: true });
  await expect(dialog.getByRole('alert')).toContainText('Impostazioni non salvate');
  await expect(page.getByRole('radio', { name: 'Sistema', exact: true })).toBeChecked();
  await dialog.getByRole('button', { name: 'Riprova', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Scuro', exact: true })).toBeChecked();
});

test('contrasto light/dark per testi, stati, focus e pulsanti', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('button', { name: 'Tema Sistema' }).click();
  for (const theme of ['Chiaro', 'Scuro']) {
    await page.getByRole('radio', { name: theme, exact: true }).check();
    const contrasts = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      const luminance = (token: string) => {
        const hex = css.getPropertyValue(`--nf-${token}`).trim().replace('#', '');
        const values = hex.length === 3 ? [...hex].map((c) => c + c) : hex.match(/.{2}/g)!;
        const rgb = values.map((c) => {
          const s = parseInt(c, 16) / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
        });
        return rgb[0]! * .2126 + rgb[1]! * .7152 + rgb[2]! * .0722;
      };
      const ratio = (a: string, b: string) => {
        const x = luminance(a); const y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
      };
      return { text: ['text', 'text-muted', 'primary', 'primary-strong', 'warning', 'danger', 'success', 'info', 'ribbon-purple'].flatMap((token) =>
        ['surface', 'bg', 'surface-soft'].map((surface) => ({ pair: `${token}/${surface}`, ratio: ratio(token, surface) }))),
      button: ratio('on-primary', 'primary'), focus: ratio('focus', 'surface'), control: ratio('primary', 'surface') };
    });
    for (const { pair, ratio } of contrasts.text) expect(ratio, `${theme}: ${pair}`).toBeGreaterThanOrEqual(4.5);
    expect(contrasts.button).toBeGreaterThanOrEqual(4.5);
    expect(contrasts.focus).toBeGreaterThanOrEqual(3); expect(contrasts.control).toBeGreaterThanOrEqual(3);
  }
});
