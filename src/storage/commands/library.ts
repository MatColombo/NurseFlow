import { z } from 'zod';
import { groupSchema, procedureSchema, settingsSchema, uiPreferencesSchema, type LibraryViewState } from '@domain/model';
import { browserLocale, groupNameKey } from '@domain/library';
import { invariant } from '@domain/model/integrity';
import { recentProcedures } from '@domain/library';
import type { NurseFlowDatabase } from '../db';
import type { CommandEnvironment } from './context';

const viewPatchSchema = uiPreferencesSchema.omit({ id: true, recentProcedureIds: true, firstLaunchComplete: true, initialLocaleSet: true, persistenceStatus: true }).partial().strip();
export type LibraryViewPatch = z.input<typeof viewPatchSchema>;
export function libraryCommands(db: NurseFlowDatabase, environment: CommandEnvironment) {
  async function saveView(patch: LibraryViewPatch) {
    const parsed = viewPatchSchema.parse(patch);
    return db.transaction('rw', db.uiPreferences, async () => {
      const next = uiPreferencesSchema.parse({ ...await db.uiPreferences.get('main'), ...parsed });
      await db.uiPreferences.put(next); return next;
    });
  }
  return {
    saveLibraryView: saveView,
    async savePersistenceStatus(status: LibraryViewState['persistenceStatus']) {
      await db.transaction('rw', db.uiPreferences, async () => {
        const view = uiPreferencesSchema.parse(await db.uiPreferences.get('main'));
        await db.uiPreferences.put(uiPreferencesSchema.parse({ ...view, persistenceStatus: status }));
      });
    },
    async initializeLocale(languages: readonly string[]) {
      return db.transaction('rw', [db.settings, db.uiPreferences], async () => {
        const view = uiPreferencesSchema.parse(await db.uiPreferences.get('main'));
        if (!view.initialLocaleSet) {
          const settings = settingsSchema.parse(await db.settings.get('main'));
          await db.settings.put({ ...settings, locale: browserLocale(languages) });
          await db.uiPreferences.put({ ...view, initialLocaleSet: true });
        }
      });
    },
    async completeFirstLaunch() {
      await db.transaction('rw', db.uiPreferences, async () => {
        const view = uiPreferencesSchema.parse(await db.uiPreferences.get('main'));
        await db.uiPreferences.put({ ...view, firstLaunchComplete: true });
      });
    },
    async recordProcedureOpen(id: string) {
      const now = environment.now();
      return db.transaction('rw', [db.procedures, db.uiPreferences], async () => {
        const procedure = procedureSchema.parse(await db.procedures.get(id));
        invariant(!procedure.archived, 'Procedure is archived');
        const opened = { ...procedure, lastOpenedAt: now };
        await db.procedures.put(opened);
        const view: LibraryViewState = uiPreferencesSchema.parse(await db.uiPreferences.get('main'));
        const recent = recentProcedures(await db.procedures.toArray());
        await db.uiPreferences.put({ ...view, recentProcedureIds: recent.map((item) => item.id) });
        return opened;
      });
    },
    async toggleFavorite(id: string) {
      await db.transaction('rw', db.procedures, async () => {
        const procedure = procedureSchema.parse(await db.procedures.get(id));
        await db.procedures.put({ ...procedure, favorite: !procedure.favorite });
      });
    },
    async setFavorite(id: string, favorite: boolean) {
      const value = z.boolean().parse(favorite);
      await db.transaction('rw', db.procedures, async () => {
        const procedure = procedureSchema.parse(await db.procedures.get(id));
        await db.procedures.put({ ...procedure, favorite: value });
      });
    },
    async saveGroup(input: { id?: string; name: string }) {
      const name = input.name.trim().replace(/\s+/g, ' '); const id = input.id ?? environment.newId(); const now = environment.now();
      invariant(name.length > 0, 'Group name is required');
      return db.transaction('rw', db.groups, async () => {
        const groups = await db.groups.toArray();
        invariant(!groups.some((group) => group.id !== id && groupNameKey(group.name) === groupNameKey(name)), 'Duplicate group');
        const current = input.id ? groupSchema.parse(await db.groups.get(id)) : undefined;
        const group = groupSchema.parse({ id, name, order: current?.order ?? Math.max(-1, ...groups.map((item) => item.order)) + 1,
          createdAt: current?.createdAt ?? now });
        if (current) await db.groups.put(group); else await db.groups.add(group);
        return group;
      });
    },
    async moveGroup(id: string, direction: -1 | 1) {
      await db.transaction('rw', db.groups, async () => {
        const groups = (await db.groups.toArray()).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
        const index = groups.findIndex((group) => group.id === id); invariant(index >= 0, 'Unknown group');
        const target = index + direction; if (target < 0 || target >= groups.length) return;
        const moved = groups.splice(index, 1)[0]; invariant(moved, 'Unknown group'); groups.splice(target, 0, moved);
        await db.groups.bulkPut(groups.map((group, order) => ({ ...group, order })));
      });
    },
    async deleteGroup(id: string) {
      await db.transaction('rw', [db.groups, db.procedures, db.uiPreferences], async () => {
        invariant(await db.groups.get(id), 'Unknown group');
        await db.procedures.where('groupId').equals(id).modify({ groupId: null });
        await db.groups.delete(id);
        const view = uiPreferencesSchema.parse(await db.uiPreferences.get('main'));
        await db.uiPreferences.put({ ...view, collapsedGroupIds: view.collapsedGroupIds.filter((value) => value !== id) });
      });
    },
  };
}
