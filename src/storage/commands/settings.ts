import { settingsSchema, uiPreferencesSchema } from '@domain/model';
import { invariant } from '@domain/model/integrity';
import type { NurseFlowDatabase } from '../db';
import { authorizeLocalDataRemoval } from '../local-data-removal';
import { localInventory } from '../repositories/settings';
export function settingsCommands(db: NurseFlowDatabase) {
  return {
    async resetLibraryLayout(confirmed: boolean) {
      invariant(confirmed, 'Confirmation required');
      return db.transaction('rw', db.uiPreferences, async () => {
        const current = uiPreferencesSchema.parse(await db.uiPreferences.get('main'));
        const next = uiPreferencesSchema.parse({ ...current, sortMode: 'groups', collapsedGroupIds: [], searchText: '', filters: {}, recentCollapsed: false, scrollTop: 0 });
        await db.uiPreferences.put(next); return next;
      });
    },
    async clearLocalData(expectedToken: string, confirmed: boolean) {
      invariant(confirmed && expectedToken.length > 0, 'Confirmation required');
      return db.transaction('rw', db.tables, async (transaction) => {
        invariant((await localInventory(db)).token === expectedToken, 'Local data changed; review again');
        authorizeLocalDataRemoval(transaction);
        for (const table of db.tables) await table.clear();
        const defaults = settingsSchema.parse({}); await db.settings.add(defaults);
        // These explicit defaults are already shown by the mounted provider. A subsequent
        // boot must not overwrite a new First Launch language choice with browser detection.
        await db.uiPreferences.add(uiPreferencesSchema.parse({ initialLocaleSet: true }));
        return defaults;
      });
    },
  };
}
