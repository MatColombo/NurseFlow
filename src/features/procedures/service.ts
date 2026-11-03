import { createNurseFlowStorage } from '@storage/index';
import { parseMetadata, type ProcedureMetadata } from '@domain/procedures';
import { invariant } from '@domain/model/integrity';
import { revisionSchema, type Revision } from '@domain/model';

export function createProcedureService(storage = createNurseFlowStorage()) {
  let queue: Promise<unknown> = Promise.resolve();
  function write<T>(operation: () => Promise<T>) { const result = queue.catch(() => {}).then(operation); queue = result; return result; }
  return {
    async load(id: string, opened = false) {
      await queue.catch(() => {}); await storage.open();
      const details = await storage.repositories.procedureDetails.get(id);
      if (opened && !details.procedure.archived) details.procedure = await storage.commands.recordProcedureOpen(id);
      return details;
    },
    async choices() {
      await storage.open(); const [groups, procedures] = await Promise.all([storage.repositories.groups.list(), storage.repositories.procedures.list()]);
      return { groups: groups.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)), tags: procedures.flatMap((item) => item.tags) };
    },
    create: (metadata: ProcedureMetadata) => write(async () => {
      await storage.open(); return storage.commands.createDraft({ metadata: parseMetadata(metadata, true) });
    }),
    saveMetadata: (id: string, metadata: ProcedureMetadata) => write(() => storage.commands.updateProcedureMetadata(id, metadata)),
    favorite: (id: string, favorite: boolean) => write(() => storage.commands.setFavorite(id, favorite)),
    archive: (id: string, archived: boolean) => write(() => storage.commands.setArchived(id, archived)),
    duplicate: (id: string, suffix: string) => write(() => storage.commands.duplicateProcedure(id, suffix)),
    remove: (id: string) => write(() => storage.commands.deleteProcedure(id)),
    start: (id: string, revisionId: string) => write(() => storage.commands.startOrResumeReady(id, revisionId)),
    resume: (runId: string) => write(() => storage.commands.resumeRunSession(runId)),
    async revision(id: string, revisionId: string): Promise<Revision> {
      await storage.open(); const revision = revisionSchema.parse(await storage.repositories.revisions.get(revisionId));
      invariant(revision.procedureId === id, 'Revision belongs to another procedure'); return revision;
    },
    async run(id: string) { await storage.open(); return storage.repositories.runSessions.get(id); },
  };
}
export const procedureService = createProcedureService();
export type ProcedureDetails = Awaited<ReturnType<typeof procedureService.load>>;
