import { createNurseFlowStorage } from '@storage/index';
import type { Settings } from '@domain/model';

export type Appearance = Pick<Settings, 'locale' | 'theme' | 'uiScalePt'>;
export interface AppearanceService {
  load(): Promise<Appearance>;
  save(value: Appearance): Promise<Appearance>;
}

function selectAppearance({ locale, theme, uiScalePt }: Settings): Appearance { return { locale, theme, uiScalePt }; }

export function createAppearanceService(storage = createNurseFlowStorage()): AppearanceService {
  return {
    async load() {
      await storage.open();
      await storage.commands.initializeLocale(navigator.languages ?? [navigator.language]);
      return selectAppearance(await storage.repositories.settings.get());
    },
    async save(value) { return selectAppearance(await storage.commands.saveAppearance(value)); },
  };
}
