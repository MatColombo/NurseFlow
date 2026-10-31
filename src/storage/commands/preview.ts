import { draftRevisionSchema, procedureSchema } from '@domain/model';
import { ConflictError } from '@domain/model/errors';
import { invariant } from '@domain/model/integrity';
import { createRun, reduceRun, resumeRun, runEventSchema, unwrap } from '@domain/runtime';
import { previewSessionSchema } from '@domain/runtime/preview';
import type { NurseFlowDatabase } from '../db';
import type { CommandEnvironment } from './context';

export function previewCommands(db: NurseFlowDatabase, environment: CommandEnvironment) {
  return {
    async startDraftPreview(procedureId: string, revisionId: string) {
      const id = environment.newId(); const now = environment.now();
      return db.transaction('rw', [db.procedures, db.revisions, db.previewSessions], async () => {
        procedureSchema.parse(await db.procedures.get(procedureId));
        const existing = await db.previewSessions.get(revisionId);
        if (existing) { const stored = previewSessionSchema.parse(existing); invariant(stored.procedureId === procedureId, 'Wrong preview owner'); unwrap(resumeRun(stored.run, stored.snapshot, 'draft-preview')); return stored; }
        const snapshot = draftRevisionSchema.parse(await db.revisions.get(revisionId)); invariant(snapshot.procedureId === procedureId, 'Wrong Draft owner');
        const run = unwrap(createRun(snapshot, id, now, 'draft-preview'));
        const session = previewSessionSchema.parse({ id: revisionId, procedureId, mode: 'draft-preview', snapshot, run });
        await db.previewSessions.add(session); return session;
      });
    },
    async transitionDraftPreview(id: string, expectedSaveVersion: number, inputEvent: unknown) {
      const event = runEventSchema.parse(inputEvent); const now = environment.now();
      return db.transaction('rw', db.previewSessions, async () => {
        const session = previewSessionSchema.parse(await db.previewSessions.get(id));
        if (session.run.saveVersion !== expectedSaveVersion) throw new ConflictError('Preview changed; reload before acting');
        const run = unwrap(reduceRun(session.run, session.snapshot, event, now, 'draft-preview'));
        if (!run) { await db.previewSessions.delete(id); return null; }
        if (run.saveVersion !== session.run.saveVersion) await db.previewSessions.put({ ...session, run }); return run;
      });
    },
    async finishDraftPreview(id: string, expectedSaveVersion: number) {
      return db.transaction('rw', db.previewSessions, async () => {
        const session = previewSessionSchema.parse(await db.previewSessions.get(id));
        if (session.run.saveVersion !== expectedSaveVersion) throw new ConflictError('Preview changed');
        const run = unwrap(resumeRun(session.run, session.snapshot, 'draft-preview')); invariant(run.status === 'ended', 'Preview is not at End'); await db.previewSessions.delete(id);
      });
    },
  };
}
