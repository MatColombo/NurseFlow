// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NurseFlowDatabase } from './db';
import { createCommands } from './commands';
import { createRepositories } from './repositories';
import { fixtureDate, exampleRecords, exampleRun } from '@test/fixtures/domain';
import { activityChoiceGraph, runtimeReady } from '@test/fixtures/runtime';
import { outlineGraph } from '@test/fixtures/builder';
import { unwrap, createRun, reduceRun, resumeRun, type RunEvent } from '@domain/runtime';
import { prepareImportedRecords } from '@domain/portability/records';

let db: NurseFlowDatabase; let commands: ReturnType<typeof createCommands>;
beforeEach(async () => {
  db = new NurseFlowDatabase(`F09-${crypto.randomUUID()}`); await db.open();
  commands = createCommands(db, { newId: () => crypto.randomUUID(), now: () => fixtureDate });
  const fixture = exampleRecords(activityChoiceGraph());
  await db.groups.bulkAdd(fixture.groups); await db.procedures.bulkAdd(fixture.procedures); await db.revisions.bulkAdd(fixture.revisions);
});
afterEach(async () => { await db.delete(); });
describe('F09 durable commands', () => {
  it('reload restores all cursors, choices, completions, focus and gates (E05/E14)', async () => {
    let run = await commands.startOrResumeReady('procedure', 'ready');
    for (const event of [{ type: 'continue' }, { type: 'choose-outcome', outcomeId: 'red' }, { type: 'switch-activity', activityId: 'activity-2' }] satisfies RunEvent[]) {
      run = (await commands.transitionRun(run.id, run.saveVersion, event))!;
      db.close(); await db.open(); expect(await commands.resumeRunSession(run.id)).toEqual(run);
      expect((await createRepositories(db).runtime.get(run.id)).run).toEqual(run);
    }
    run = (await commands.transitionRun(run.id, run.saveVersion, { type: 'finish-activity' }))!;
    expect(run.currentNodeId).toBe('extra'); db.close(); await db.open();
    expect((await createRepositories(db).runtime.get(run.id)).view.groups[0]).toMatchObject({ completed: 1, total: 2, afterAllEnabled: false });
    run = (await commands.transitionRun(run.id, run.saveVersion, { type: 'finish-activity' }))!;
    db.close(); await db.open(); expect(await commands.resumeRunSession(run.id)).toEqual(run); expect(run.status).toBe('ended');
    await commands.finishRun(run.id, run.saveVersion); expect(await db.runSessions.get(run.id)).toBeUndefined();
  });
  it('a newer Ready never changes the saved run, authored content or old pinned snapshot', async () => {
    const run = await commands.startOrResumeReady('procedure', 'ready'); const before = await db.revisions.get('ready');
    await db.revisions.add({ ...runtimeReady(outlineGraph()), id: 'new-ready', revisionNumber: 2 });
    await db.procedures.update('procedure', { readyRevisionId: 'new-ready' });
    expect(await commands.resumeRunSession(run.id)).toEqual(run);
    const next = (await commands.transitionRun(run.id, run.saveVersion, { type: 'continue' }))!; expect(next.currentNodeId).toBe('choice');
    expect((await createRepositories(db).runtime.get(run.id)).revision).toEqual(before); expect(await db.revisions.get('ready')).toEqual(before);
    const newer = await commands.startOrResumeReady('procedure', 'new-ready'); expect(newer.id).not.toBe(run.id); expect(await db.runSessions.count()).toBe(2);
  });
  it('quota/abort never report success or persist half a transition, and retry succeeds', async () => {
    const run = await commands.startOrResumeReady('procedure', 'ready');
    const quota = () => { throw new DOMException('quota', 'QuotaExceededError'); }; db.runSessions.hook('updating', quota);
    await expect(commands.transitionRun(run.id, run.saveVersion, { type: 'continue' })).rejects.toThrow('quota');
    expect(await db.runSessions.get(run.id)).toEqual(run); db.runSessions.hook('updating').unsubscribe(quota);
    const next = await commands.transitionRun(run.id, run.saveVersion, { type: 'continue' }); expect(next?.currentNodeId).toBe('choice');
  });
  it('concurrent duplicate taps commit at most one visible transition', async () => {
    const run = await commands.startOrResumeReady('procedure', 'ready');
    const results = await Promise.allSettled([commands.transitionRun(run.id, run.saveVersion, { type: 'continue' }), commands.transitionRun(run.id, run.saveVersion, { type: 'continue' })]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1); expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(await db.runSessions.get(run.id)).toMatchObject({ currentNodeId: 'choice', saveVersion: 2 });
  });
  it('Back, confirmed Restart/Exit and End cleanup affect only the exact run', async () => {
    const run = await commands.startOrResumeReady('procedure', 'ready');
    await expect(commands.finishRun(run.id, run.saveVersion)).rejects.toThrow('authored End');
    await expect(commands.transitionRun(run.id, run.saveVersion, { type: 'restart', confirmed: false })).rejects.toThrow('confirmation-required');
    await expect(commands.transitionRun(run.id, run.saveVersion, { type: 'exit', confirmed: false })).rejects.toThrow('confirmation-required');
    expect(await db.runSessions.get(run.id)).toEqual(run);
    const restarted = (await commands.transitionRun(run.id, run.saveVersion, { type: 'restart', confirmed: true }))!;
    expect(restarted.pinnedRevisionId).toBe(run.pinnedRevisionId); expect(restarted.saveVersion).toBe(2);
    await expect(commands.transitionRun(run.id, 1, { type: 'exit', confirmed: true })).rejects.toThrow('Run changed');
    await commands.transitionRun(run.id, restarted.saveVersion, { type: 'exit', confirmed: true }); expect(await db.runSessions.count()).toBe(0);
  });
  it('legacy records are untouched by reading; ambiguous parallel history requires explicit restart', async () => {
    const legacy = { ...exampleRun('procedure', 'ready'), currentNodeId: 'task-1', visited: [], multitaskProgress: { tasks: { completedActivityIds: [], cursorByActivityId: {}, pathByActivityId: {} } } };
    await db.runSessions.add(legacy); expect(await createRepositories(db).runSessions.get(legacy.id)).toEqual(legacy);
    await expect(commands.resumeRunSession(legacy.id)).rejects.toThrow('legacy-session'); expect(await db.runSessions.get(legacy.id)).toEqual(legacy);
    const restarted = await commands.transitionRun(legacy.id, legacy.saveVersion, { type: 'restart', confirmed: true }); expect(restarted).toMatchObject({ runtimeVersion: 1, currentNodeId: 'task-1', saveVersion: 2 });
  });
  it('legacy F04 scaffold is upgraded atomically without losing its pin or identity', async () => {
    const legacy = { ...exampleRun('procedure', 'ready'), currentNodeId: 'start', visited: [] }; await db.runSessions.add(legacy);
    const run = await commands.startOrResumeReady('procedure', 'ready'); expect(run).toMatchObject({ id: legacy.id, runtimeVersion: 1, saveVersion: 2, currentNodeId: 'task-1', pinnedRevisionId: 'ready', startedAt: legacy.startedAt });
    expect(await commands.resumeRunSession(run.id)).toEqual(run);
  });
  it('normalized nested references survive additive internal import remapping', () => {
    const source = exampleRecords(activityChoiceGraph()); const revision = source.revisions[0]!;
    let run = unwrap(createRun(revision, 'run', fixtureDate)); run = unwrap(reduceRun(run, revision, { type: 'continue' }, fixtureDate))!;
    run = unwrap(reduceRun(run, revision, { type: 'choose-outcome', outcomeId: 'red' }, fixtureDate))!; source.runSessions.push(run);
    let id = 0; const imported = prepareImportedRecords([source], () => `imported-${++id}`)[0]!;
    const mapped = imported.runSessions[0]!; const pinned = imported.revisions.find((r) => r.id === mapped.pinnedRevisionId)!;
    expect(unwrap(resumeRun(mapped, pinned))).toEqual(mapped); expect(mapped.currentNodeId).not.toBe(run.currentNodeId);
    expect(imported.runSessions[0]?.pinnedRevisionId).not.toBe(run.pinnedRevisionId);
  });
});
