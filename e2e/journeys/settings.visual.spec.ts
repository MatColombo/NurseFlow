import { expect, test } from '@playwright/test';
import { settingsData, setupSettings } from '../fixtures/settings';
import { expectNoBleeding } from '../fixtures/ui';

const pages = ['Library', 'Details', 'Run', 'Map', 'Builder', 'Editor', 'Check', 'Settings'] as const;
for (const width of [320, 390, 768]) for (const scale of [4, 13, 30, 48]) for (const [index, name] of pages.entries()) {
  test(`F12 matrix ${name} ${width}px ${scale}pt`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 });
    const theme = (index + scale + width) % 2 ? 'dark' : 'light';
    const { runId } = await setupSettings(page, scale, theme, true);
    const before = await settingsData(page);
    const paths = {
      Library: '/library', Details: '/procedure/procedure', Run: '/run/' + runId,
      Map: '/procedure/procedure/map?revision=ready&run=' + runId,
      Builder: '/build/procedure', Editor: '/build/procedure/step/shared',
      Check: '/build/procedure/check', Settings: '/settings',
    };
    await page.goto('./#' + paths[name]); await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    if (name === 'Library') await expect(page.getByTestId('library-pane')).toBeVisible();
    if (name === 'Details') await expect(page.locator('.nf-procedure-actions')).toBeVisible();
    if (name === 'Run') await expect(page.locator('[data-step-content="decision"]')).toBeVisible();
    if (name === 'Map') await expect(page.getByRole('region', { name: 'Mappa della procedura', exact: true })).toHaveAttribute('data-camera-initialized', 'true');
    if (name === 'Builder') await expect(page.getByRole('button', { name: 'Annulla modifica', exact: true })).toBeVisible();
    if (name === 'Editor') await expect(page.getByRole('heading', { name: 'Editor passaggio', exact: true })).toBeVisible();
    if (name === 'Check') await expect(page.locator('[data-draft-id]')).toHaveAttribute('data-edit-version', '1');
    if (name === 'Settings') await expect(page.getByRole('button', { name: /^Scala interfaccia/ })).toContainText(scale + ' pt');
    await expectNoBleeding(page);
    const minimum = ['Settings', 'Run', 'Map'].includes(name) ? 44 : 24;
    const metrics = await page.evaluate((minimum) => ({
      base: parseFloat(getComputedStyle(document.documentElement).fontSize),
      transform: getComputedStyle(document.documentElement).transform,
      shortTargets: [...document.querySelectorAll<HTMLElement>('main button, main input:not([type=checkbox]):not([type=radio]), main .nf-preference')]
        .filter((element) => { const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && !element.closest('.nf-graph-viewport'); })
        .filter((element) => element.getBoundingClientRect().height < minimum - .1).map((element) => element.textContent?.slice(0, 40)),
    }), minimum);
    expect(metrics.base).toBeCloseTo(scale * 4 / 3, 1); expect(metrics.transform).toBe('none'); expect(metrics.shortTargets).toEqual([]);
    if (name === 'Map') { await page.getByRole('button', { name: 'Lista', exact: true }).click(); await expectNoBleeding(page); }
    if (name === 'Settings') {
      await page.getByRole('button', { name: /^Scala interfaccia/ }).click(); await expect(page.getByRole('slider')).toHaveCount(1); await expectNoBleeding(page);
      await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
    }
    if (width === 320 && (scale === 13 || scale === 48)) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.screenshot({ path: info.outputPath(`${name}-${scale}pt-${theme}.png`) });
    }
    const after = await settingsData(page); expect(after.runs).toEqual(before.runs);
    expect(after.revisions.filter((revision) => revision.state === 'ready')).toEqual(before.revisions.filter((revision) => revision.state === 'ready'));
  });
}
