import { createNurseFlowStorage } from '@storage/index';
import type { LibraryViewPatch } from '@storage/commands/library';
import type { LibraryViewState } from '@domain/model';

export function createLibraryService(storage = createNurseFlowStorage()) {
  let queue: Promise<unknown> = Promise.resolve();
  function write<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.catch(() => {}).then(operation); queue = result; return result;
  }
  return {
    async load(includeSteps?: boolean) {
      await queue.catch(() => {}); await storage.open();
      const { procedures, groups, view, revisions } = await storage.repositories.library.getSnapshot(includeSteps);
      return { procedures, groups: groups.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)), view, revisions };
    },
    saveView: (patch: LibraryViewPatch) => write(() => storage.commands.saveLibraryView(patch)),
    completeSetup: () => write(() => storage.commands.completeFirstLaunch()),
    openProcedure: (id: string) => write(() => storage.commands.recordProcedureOpen(id)),
    openRun: (id: string) => write(async () => {
      const run = await storage.repositories.runSessions.get(id);
      if (!run) throw new Error('Run not found');
      return storage.commands.recordProcedureOpen(run.procedureId);
    }),
    setFavorite: (id: string, favorite: boolean) => write(() => storage.commands.setFavorite(id, favorite)),
    saveGroup: (input: { id?: string; name: string }) => write(() => storage.commands.saveGroup(input)),
    moveGroup: (id: string, direction: -1 | 1) => write(() => storage.commands.moveGroup(id, direction)),
    deleteGroup: (id: string) => write(() => storage.commands.deleteGroup(id)),
    async requestPersistence() {
      let status: LibraryViewState['persistenceStatus'];
      try {
        status = navigator.storage?.persist ? (await navigator.storage.persist() ? 'granted' : 'denied') : 'unsupported';
      } catch { status = 'error'; }
      await write(() => storage.commands.savePersistenceStatus(status));
      return status;
    },
    async persistenceStatus() {
      const view = await storage.repositories.uiPreferences.get();
      try {
        if (!navigator.storage?.persisted) return 'unsupported' as const;
        if (await navigator.storage.persisted()) return 'granted' as const;
        return view.persistenceStatus === 'granted' ? 'denied' as const : view.persistenceStatus;
      } catch { return 'error' as const; }
    },
  };
}
export type LibraryService = ReturnType<typeof createLibraryService>;
export type LibrarySnapshot = Awaited<ReturnType<LibraryService['load']>>;
// No connection is opened and no procedure is inserted on module import.
export const libraryService = createLibraryService();
