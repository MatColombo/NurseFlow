import { expect } from '@playwright/test';
import { portableTest as test } from '../fixtures/portability';
import { attachMigrations } from '../fixtures/migrations';

test('F15 two tabs: blocked v1→v5 migration preserves records; versionchange closes v5 safely', async ({ page, context }) => {
  const name = `NurseFlow-F15-${crypto.randomUUID()}`;
  await page.goto('./#/settings'); await attachMigrations(page);
  const source = await page.evaluate((name) => window.NurseFlowF15Migration.legacy(name), name);
  const other = await context.newPage(); await other.goto('./#/settings'); await attachMigrations(other);
  const upgrading = other.evaluate((name) => window.NurseFlowF15Migration.migrate(name), name);
  await expect.poll(() => other.evaluate(() => window.NurseFlowF15Migration.lifecycle())).toBe('blocked');
  await page.evaluate(() => window.NurseFlowF15Migration.close());
  const migrated = await upgrading;
  expect(migrated.version).toBe(5); expect(migrated.revisions).toHaveLength(source.revisions);
  expect(migrated.revisions.every((revision: { editVersion: number }) => revision.editVersion === 1)).toBe(true);
  expect(migrated.settings).toMatchObject({ locale: 'en', theme: 'dark' }); expect(migrated.view).toMatchObject({ recentProcedureIds: [source.procedure], initialLocaleSet: true });
  expect(migrated.tables).toEqual(expect.arrayContaining(['builderStates', 'previewSessions', 'mediaAssets', 'runSessions']));
  await page.evaluate(() => { document.documentElement.dataset.f15 = 'not-reloaded'; });
  const next = await page.evaluate((name) => window.NurseFlowF15Migration.nextVersion(name), name);
  expect(next.version).toBe(6); expect(next.revisions).toEqual(migrated.revisions); expect(next.procedures).toEqual(migrated.procedures);
  // The old NurseFlow connection actually receives versionchange and closes, without refreshing its document.
  await expect.poll(() => other.evaluate(() => window.NurseFlowF15Migration.lifecycle())).toBe('changed');
  expect(await page.evaluate(() => document.documentElement.dataset.f15)).toBe('not-reloaded');
  await page.evaluate(() => window.NurseFlowF15Migration.close()); await other.close();
});
