import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands } from '../../src/storage/commands';
import { fullBackupRecords, importedSettings } from '../../src/test/fixtures/backup';
import { fixtureDate } from '../../src/test/fixtures/domain';
import { createPackage, parsePackage } from '../../src/features/portability/codec';
import { subsetRecords } from '../../src/domain/portability/validation';
import { inspectPortable } from './portability-browser';
export const inspectBackup = inspectPortable;
export async function initializeBackup(scale = 13, theme: 'light' | 'dark' = 'light', locale: 'it' | 'en' = 'it', seed = true) {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    if (seed) { const records = await fullBackupRecords(); await db.groups.bulkAdd(records.groups); await db.mediaAssets.bulkAdd(records.mediaAssets); await db.revisions.bulkAdd(records.revisions); await db.procedures.bulkAdd(records.procedures); await db.runSessions.bulkAdd(records.runSessions); }
    const commands = createCommands(db); await commands.completeFirstLaunch(); await commands.saveAppearance({ uiScalePt: scale, theme, locale });
  } finally { db.close(); }
}
export async function backupBytes(kind: 'settings' | 'full' | 'procedure' | 'library' = 'full') {
  const all = await fullBackupRecords(); const records = kind === 'settings' ? { procedures: [], groups: [], revisions: [], mediaAssets: [], runSessions: [] } : kind === 'full' ? all : subsetRecords(all, new Set(kind === 'procedure' ? ['p-0'] : ['p-0', 'p-1']));
  const blob = await createPackage(records, kind, { packageId: 'F14-file', appVersion: '0.0.0', exportedAt: fixtureDate }, kind === 'settings' || kind === 'full' ? importedSettings() : undefined);
  return [...new Uint8Array(await blob.arrayBuffer())];
}
export async function decodeBackup(bytes: number[]) {
  const parsed = await parsePackage(new Blob([new Uint8Array(bytes)]), ['settings', 'full']);
  return { manifest: parsed.manifest, settings: parsed.settings, procedures: parsed.records.procedures, groups: parsed.records.groups, revisions: parsed.records.revisions, runs: parsed.records.runSessions,
    assets: await Promise.all(parsed.records.mediaAssets.map(async ({ blob, ...asset }) => ({ ...asset, data: [...new Uint8Array(await blob.arrayBuffer())] }))) };
}
export async function changeScale(scale: number) { const db = new NurseFlowDatabase(); await db.open(); try { const current = await db.settings.get('main'); if (!current) throw new Error('Settings unavailable'); await createCommands(db).saveAppearance({ locale: current.locale, theme: current.theme, uiScalePt: scale }); } finally { db.close(); } }
