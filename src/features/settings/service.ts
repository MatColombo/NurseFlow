import { createNurseFlowStorage } from '@storage/index';
import { builderService, graphClipboard } from '@features/builder/service';
export function createSettingsService(storage = createNurseFlowStorage()) {
  return {
    async inventory() { await builderService.flush(); await storage.open(); return storage.repositories.localData.inventory(); },
    async resetLayout(confirmed: boolean) { await storage.open(); return storage.commands.resetLibraryLayout(confirmed); },
    async clear(token: string, confirmed: boolean) {
      await builderService.flush(); await storage.open(); const defaults = await storage.commands.clearLocalData(token, confirmed);
      graphClipboard.set(null); return defaults;
    },
    async hasSessions() { await storage.open(); return storage.repositories.localData.hasSessions(); },
    watchSessions(changed: () => void) { return storage.repositories.localData.watchSessions(changed); },
  };
}
export const settingsService = createSettingsService();
export type LocalInventory = Awaited<ReturnType<typeof settingsService.inventory>>;
