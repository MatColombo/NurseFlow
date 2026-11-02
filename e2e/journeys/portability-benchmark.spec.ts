import { expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { attachPortable, portableTest as test } from '../fixtures/portability';
test('F13 bounded ZIP benchmark 8/32/96 MiB at mobile viewport, without DB writes', async ({ page }, info) => {
  test.setTimeout(180_000); await page.setViewportSize({ width: 320, height: 844 }); await page.goto('./#/settings'); await expect(page.getByRole('heading', { name: 'Impostazioni', exact: true })).toBeVisible(); await attachPortable(page);
  const measured = await page.evaluate(() => window.NurseFlowF13.benchmarkPortable());
  expect(measured.measurements).toHaveLength(3); expect(measured.measurements.every((item) => item.bytes <= measured.limits.bytes)).toBe(true);
  const path = info.outputPath('package-benchmark.json'); await writeFile(path, JSON.stringify({ browser: info.project.name, ...measured }, null, 2));
  await info.attach('package-benchmark.json', { path, contentType: 'application/json' });
});
