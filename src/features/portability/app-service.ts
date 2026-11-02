import { createNurseFlowStorage } from '@storage/index';
import { version } from '../../../package.json';
import type { Settings } from '@domain/model';
import { settingsToken } from '@domain/portability/settings';
import { importedReadyValidation, validatePortableRecords } from '@domain/portability/validation';
import { requirePackage } from '@domain/portability/zip';
import { createPackage, parsePackage, type ParsedPackage } from './codec';
export function createAppBackupService(storage = createNurseFlowStorage()) {
  return {
    async currentSettings() { await storage.open(); return (await storage.repositories.portability.appSnapshot('settings')).settings; },
    async prepareExport(kind: 'settings' | 'full') {
      await storage.open(); const { records, settings } = await storage.repositories.portability.appSnapshot(kind);
      const context = { packageId: crypto.randomUUID(), exportedAt: new Date().toISOString(), appVersion: version };
      const blob = await createPackage(records, kind, context, settings);
      return { blob, kind, name: 'NurseFlow-' + kind + '-' + context.exportedAt.slice(0, 10) + '-' + context.packageId.slice(0, 8) + (kind === 'settings' ? '.nfsettings' : '.nfbackup'), count: records.procedures.length, warnings: [...validatePortableRecords(records).values()].flat(), counts: { procedures: records.procedures.length, groups: records.groups.length, revisions: records.revisions.length, media: records.mediaAssets.length, runs: records.runSessions.length } };
    },
    async stage(file: Blob) { return parsePackage(file, ['settings', 'full']); },
    async commit(parsed: ParsedPackage, consent: { additions: boolean; replacement?: { current: Settings; confirmed: boolean } }) {
      const kind = parsed.manifest.packageKind; requirePackage(kind === 'settings' || kind === 'full', 'scope');
      requirePackage(kind !== 'full' || consent.additions, 'scope');
      requirePackage(!consent.replacement || consent.replacement.confirmed && consent.replacement.current && parsed.settings, 'scope');
      validatePortableRecords(parsed.records); await storage.open();
      return storage.commands.importAppPackage({ kind, records: parsed.records, confirmed: true,
        ...(consent.replacement ? { replacement: { value: parsed.settings, expectedToken: settingsToken(consent.replacement.current), confirmed: true } } : {}) }, importedReadyValidation);
    },
  };
}
export const appBackupService = createAppBackupService();
