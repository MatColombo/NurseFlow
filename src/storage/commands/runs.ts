import { runSessionSchema } from '@domain/model';
import { ConflictError, ImmutableRecordError } from '@domain/model/errors';
import { assertRunReferences, invariant } from '@domain/model/integrity';
import type { NurseFlowDatabase } from '../db';

export function runCommands(db: NurseFlowDatabase) {
  return {
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
