import { createNurseFlowStorage } from '@storage/index';
import type { RunEvent } from '@domain/runtime';

/** F10 must pass the version displayed to the user; rapid taps cannot advance unseen steps. */
export function createRuntimeService(storage = createNurseFlowStorage()) {
  return {
    async read(id: string) { await storage.open(); return storage.repositories.runtime.get(id); },
    async resume(id: string) { await storage.open(); await storage.commands.resumeRunSession(id); return storage.repositories.runtime.get(id); },
    async dispatch(id: string, expectedSaveVersion: number, event: RunEvent) { await storage.open(); return storage.commands.transitionRun(id, expectedSaveVersion, event); },
    async finish(id: string, expectedSaveVersion: number) { await storage.open(); return storage.commands.finishRun(id, expectedSaveVersion); },
  };
}
export const runtimeService = createRuntimeService();
