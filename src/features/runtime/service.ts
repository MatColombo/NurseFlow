import { createNurseFlowStorage } from '@storage/index';
import type { RunEvent } from '@domain/runtime';

/** F10 must pass the version displayed to the user; rapid taps cannot advance unseen steps. */
export function createRuntimeService(storage = createNurseFlowStorage()) {
  return {
    async read(id: string) { await storage.open(); return storage.repositories.runtime.get(id); },
    async resume(id: string) { await storage.open(); await storage.commands.resumeRunSession(id); return storage.repositories.runtime.get(id); },
    async dispatch(id: string, expectedSaveVersion: number, event: RunEvent) { await storage.open(); return storage.commands.transitionRun(id, expectedSaveVersion, event); },
    async finish(id: string, expectedSaveVersion: number) { await storage.open(); return storage.commands.finishRun(id, expectedSaveVersion); },
    async preview(procedureId: string, revisionId: string) { await storage.open(); await storage.commands.startDraftPreview(procedureId, revisionId); return storage.repositories.preview.get(revisionId); },
    async readPreview(id: string) { await storage.open(); return storage.repositories.preview.get(id); },
    async dispatchPreview(id: string, version: number, event: RunEvent) { await storage.open(); return storage.commands.transitionDraftPreview(id, version, event); },
    async finishPreview(id: string, version: number) { await storage.open(); return storage.commands.finishDraftPreview(id, version); },
  };
}
export const runtimeService = createRuntimeService();
