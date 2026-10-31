import { expect, test, type Page } from '@playwright/test';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import type * as Harness from '../fixtures/runtime-browser';
import type { ExecutionRun, RunEvent } from '../../src/domain/runtime';

declare global { interface Window { NurseFlowF09: typeof Harness } }
let harness: string;
test.setTimeout(90_000);
test.beforeAll(async () => {
  const bundle = await build({ configFile: false, logLevel: 'silent', resolve: { alias: {
    '@domain': fileURLToPath(new URL('../../src/domain', import.meta.url)), '@test': fileURLToPath(new URL('../../src/test', import.meta.url)),
  } }, build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('../fixtures/runtime-browser.ts', import.meta.url)), name: 'NurseFlowF09', formats: ['iife'] } } });
  const output = Array.isArray(bundle) ? bundle[0]?.output : 'output' in bundle ? bundle.output : [];
  const chunk = output?.find((entry) => entry.type === 'chunk'); if (!chunk || chunk.type !== 'chunk') throw new Error('Runtime harness missing'); harness = chunk.code;
});
async function attach(page: Page) { await page.addScriptTag({ content: harness }); }
async function initialize(page: Page, kind: Parameters<typeof Harness.initialize>[0] = 'and') { await page.goto('./'); await attach(page); return page.evaluate((kind) => window.NurseFlowF09.initialize(kind), kind); }
async function act(page: Page, run: ExecutionRun, event: RunEvent) { return (await page.evaluate(({ run, event }) => window.NurseFlowF09.act(run.id, run.saveVersion, event), { run, event }))!; }
async function reload(page: Page, run: ExecutionRun) {
  await page.reload(); await attach(page);
  expect(await page.evaluate((id) => window.NurseFlowF09.resume(id), run.id)).toEqual(run);
  return page.evaluate((id) => window.NurseFlowF09.inspect(id), run.id);
}

test('F09 OR: real route, shared destination, Back, incompatible future removed from IndexedDB', async ({ page }) => {
  let run = await initialize(page, 'or');
  run = await act(page, run, { type: 'choose-outcome', outcomeId: 'a' }); run = await act(page, run, { type: 'continue' });
  expect((await reload(page, run)).view.previous).toMatchObject({ nodeId: 'a-step' });
  run = await act(page, run, { type: 'back' }); run = await act(page, run, { type: 'back' }); run = await act(page, run, { type: 'choose-outcome', outcomeId: 'b' });
  const persisted = await reload(page, run); expect(persisted.run.visits.map((v) => v.nodeId)).toEqual(['decision', 'b-step']);
  run = await act(page, run, { type: 'continue' }); expect(run.currentNodeId).toBe('shared');
  expect((await reload(page, run)).view.previous).toMatchObject({ nodeId: 'b-step' });
});
test('F09 E05/E14: independent switch/resume, explicit Finish, gated After all and restorable authored End', async ({ page }) => {
  let run = await initialize(page); const groupVisitId = run.groups[0]!.visitId;
  expect(await page.evaluate(({ run, groupVisitId }) => window.NurseFlowF09.failedAction(run.id, run.saveVersion, { type: 'after-all', groupVisitId }), { run, groupVisitId })).toMatchObject({ failed: true });
  run = await act(page, run, { type: 'continue' }); run = await act(page, run, { type: 'choose-outcome', outcomeId: 'red' });
  run = await act(page, run, { type: 'switch-activity', activityId: 'activity-2' }); await reload(page, run);
  run = await act(page, run, { type: 'finish-activity' }); expect(run.currentNodeId).toBe('extra');
  expect((await reload(page, run)).view.groups[0]).toMatchObject({ completed: 1, total: 2, afterAllEnabled: false });
  run = await act(page, run, { type: 'finish-activity' }); expect(run.status).toBe('ended'); await reload(page, run);
  run = await act(page, run, { type: 'back' }); expect(run.currentNodeId).toBe('extra');
  run = await act(page, run, { type: 'finish-activity' }); expect(run.journal.filter((j) => j.kind === 'after-all')).toHaveLength(1);
  await page.evaluate((run) => window.NurseFlowF09.finish(run.id, run.saveVersion), run); expect(await page.evaluate(() => window.NurseFlowF09.allRuns())).toEqual([]);
});
test('F09 nested AND retains focus and independent work through reload', async ({ page }) => {
  let run = await initialize(page, 'nested'); const outer = run.groups[0]!.visitId;
  run = await act(page, run, { type: 'continue' }); const inner = run.groups[1]!.visitId;
  run = await act(page, run, { type: 'switch-activity', groupVisitId: inner, activityId: 'inner-activity-2' });
  run = await act(page, run, { type: 'switch-activity', groupVisitId: outer, activityId: 'activity-2' }); await reload(page, run);
  run = await act(page, run, { type: 'finish-activity' }); expect(run.currentNodeId).toBe('inner-step-2');
  run = await act(page, run, { type: 'finish-activity' }); expect(run.currentNodeId).toBe('inner-step-1'); await reload(page, run);
  run = await act(page, run, { type: 'finish-activity' }); expect(run.status).toBe('ended'); expect(run.tokens.filter((t) => t.completed)).toHaveLength(4); await reload(page, run);
});
test('F09 E07/E08: authorized Stop ends the whole procedure, W08 interrupts without an End', async ({ page }) => {
  let run = await initialize(page, 'stop'); run = await act(page, run, { type: 'continue' });
  run = await act(page, run, { type: 'choose-outcome', outcomeId: 'stop-all' }); expect(run.status).toBe('ended'); expect(run.tokens.filter((t) => t.completed)).toHaveLength(0); await reload(page, run);
});
test('F09 W08 survives reload and permits Back without inventing a terminal step', async ({ page }) => {
  let run = await initialize(page, 'broken'); run = await act(page, run, { type: 'continue' }); run = await act(page, run, { type: 'choose-outcome', outcomeId: 'red' });
  run = await act(page, run, { type: 'continue' }); expect(run.status).toBe('interrupted'); expect(run.terminalEndNodeId).toBeUndefined();
  expect((await reload(page, run)).view.progress.total).toEqual({ kind: 'unknown' });
  run = await act(page, run, { type: 'back' }); expect(run.currentNodeId).toBe('extra'); expect(run.status).toBe('active');
});
test('F09 no false success on quota and at most one advance for duplicate taps', async ({ page }) => {
  const run = await initialize(page);
  expect(await page.evaluate((run) => window.NurseFlowF09.failedAction(run.id, run.saveVersion, { type: 'continue' }, true), run)).toMatchObject({ failed: true });
  await reload(page, run);
  const statuses = await page.evaluate((run) => window.NurseFlowF09.duplicateTap(run.id, run.saveVersion, { type: 'continue' }), run);
  expect(statuses.sort()).toEqual(['fulfilled', 'rejected']);
  expect((await page.evaluate((id) => window.NurseFlowF09.inspect(id), run.id)).run).toMatchObject({ currentNodeId: 'choice', saveVersion: run.saveVersion + 1 });
});
test('F09 new Ready from Check leaves an existing run and its pinned content untouched', async ({ page }) => {
  let run = await initialize(page); run = await act(page, run, { type: 'continue' }); const before = await reload(page, run);
  await page.evaluate(() => window.NurseFlowF09.newReady()); const after = await reload(page, run);
  expect(after.run).toEqual(before.run); expect(after.revision).toEqual(before.revision); expect(after.view.node).toEqual(before.view.node);
});
