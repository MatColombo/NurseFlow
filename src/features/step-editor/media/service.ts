import { createNurseFlowStorage } from '@storage/index';
import type { Settings } from '@domain/model';
const storage = createNurseFlowStorage();
export const mediaService = {
  async asset(id: string) { await storage.open(); return storage.repositories.mediaAssets.get(id); },
  async settings() { await storage.open(); return storage.repositories.settings.get(); },
  async saveSettings({ mediaAddSoftLimit, photoPreset }: Pick<Settings, 'mediaAddSoftLimit' | 'photoPreset'>) { await storage.open(); return storage.commands.saveMediaPreferences({ mediaAddSoftLimit, photoPreset }); },
};
