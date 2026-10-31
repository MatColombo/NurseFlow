import { runSessionSchema } from '@domain/model';
import { ConflictError, ImmutableRecordError } from '@domain/model/errors';
import { assertRunReferences, invariant } from '@domain/model/integrity';
import type { NurseFlowDatabase } from '../db';
import { reduceRun, restoreRun, restartStoredRun, runEventSchema, unwrap, requireRun } from '@domain/runtime';
import type { CommandEnvironment } from './context';

export function runCommands(db: NurseFlowDatabase, environment: CommandEnvironment) {
  return {
    async resumeRunSession(id: string) {
      const now = environment.now();
      return db.transaction('rw', [db.revisions, db.runSessions], async () => {
        const stored = runSessionSchema.parse(await db.runSessions.get(id));
        const run = unwrap(restoreRun(stored, await db.revisions.get(stored.pinnedRevisionId), now));
        if (!('runtimeVersion' in stored)) await db.runSessions.put(run);
        return run;
      });
    },
    async transitionRun(id: string, expectedSaveVersion: number, inputEvent: unknown) {
      const event = runEventSchema.parse(inputEvent); const now = environment.now();
      return db.transaction('rw', [db.revisions, db.runSessions], async () => {
        const stored = runSessionSchema.parse(await db.runSessions.get(id));
        if (stored.saveVersion !== expectedSaveVersion) throw new ConflictError('Run changed; reload before acting');
        const revision = await db.revisions.get(stored.pinnedRevisionId);
        // Confirmed restart/exit also recover a legacy record whose route cannot safely be reconstructed.
        if (event.type === 'exit') { requireRun(event.confirmed, 'confirmation-required'); await db.runSessions.delete(id); return null; }
        const next = event.type === 'restart' ? (requireRun(event.confirmed, 'confirmation-required'), restartStoredRun(stored, revision, now)) :
          unwrap(reduceRun(unwrap(restoreRun(stored, revision, now)), revision, event, now));
        invariant(next, 'Unexpected run deletion');
        // A safe legacy upgrade and the requested action are one durable version and one transaction.
        if (!('runtimeVersion' in stored)) next.saveVersion = stored.saveVersion + 1;
        if (next.saveVersion !== stored.saveVersion) await db.runSessions.put(next);
        return next;
      });
    },
    async finishRun(id: string, expectedSaveVersion: number) {
      return db.transaction('rw', [db.revisions, db.runSessions], async () => {
        const run = runSessionSchema.parse(await db.runSessions.get(id));
        if (run.saveVersion !== expectedSaveVersion) throw new ConflictError('Run changed; reload before leaving End');
        const revision = await db.revisions.get(run.pinnedRevisionId); invariant(revision, 'Pinned revision not found');
        assertRunReferences(run, revision); invariant(run.status === 'ended', 'Only an authored End can finish a session');
        await db.runSessions.delete(id);
      });
    },
    async saveRun(input: unknown, expectedSaveVersion: number | null) {
      const run = runSessionSchema.parse(input);
      return db.transaction('rw', [db.procedures, db.revisions, db.runSessions], async () => {
        invariant(await db.procedures.get(run.procedureId), 'Run procedure not found');
        const revision = await db.revisions.get(run.pinnedRevisionId);
        invariant(revision, 'Pinned revision not found');
        assertRunReferences(run, revision);
        const existing = await db.runSessions.get(run.id);
        if (existing && (existing.procedureId !== run.procedureId || existing.pinnedRevisionId !== run.pinnedRevisionId ||
          existing.startedAt !== run.startedAt)) throw new ImmutableRecordError('Run identity and pinned revision cannot change');
        if (existing ? existing.saveVersion !== expectedSaveVersion || run.saveVersion !== existing.saveVersion + 1 :
          expectedSaveVersion !== null || run.saveVersion !== 1) throw new ConflictError('Run changed; reload before saving');
        if (existing) await db.runSessions.put(run);
        else await db.runSessions.add(run);
        return run;
      });
    },
  };
}
