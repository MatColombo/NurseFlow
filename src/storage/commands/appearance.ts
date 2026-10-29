import { settingsSchema } from '@domain/model';
import type { NurseFlowDatabase } from '../db';

const appearanceSchema = settingsSchema.pick({ locale: true, theme: true, uiScalePt: true });
export type AppearancePreferences = ReturnType<typeof appearanceSchema.parse>;

export function appearanceCommands(db: NurseFlowDatabase) {
  return {
    async saveAppearance(input: AppearancePreferences) {
      const appearance = appearanceSchema.parse(input);
      return db.transaction('rw', db.settings, async () => {
        const current = settingsSchema.parse(await db.settings.get('main'));
        const next = settingsSchema.parse({ ...current, ...appearance });
        await db.settings.put(next);
        return next;
      });
    },
  };
}
