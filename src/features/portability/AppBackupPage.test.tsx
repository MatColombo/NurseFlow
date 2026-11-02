import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AppearanceContext } from '@app/appearance-context';
import { createUiI18n } from '@shared/i18n';
import { settingsSchema } from '@domain/model';
import { PackageError } from '@domain/portability/zip';
import { manifestSchema } from '@domain/portability/package-schema';
import { fullBackupRecords, importedSettings } from '@test/fixtures/backup';
import { fixtureDate } from '@test/fixtures/domain';
import AppBackupPage from './AppBackupPage';
import { appBackupService } from './app-service';
vi.mock('@features/builder/service', () => ({ builderService: { flush: async () => {} } }));
afterEach(() => vi.restoreAllMocks());
async function setup(full: boolean) {
  const records = full ? await fullBackupRecords() : { procedures: [], groups: [], revisions: [], mediaAssets: [], runSessions: [] };
  vi.spyOn(appBackupService, 'stage').mockResolvedValue({ records, settings: importedSettings(), warnings: new Map(), manifest: manifestSchema.parse({ format: 'nurseflow-portable', formatVersion: 1, schemaVersion: 1, packageKind: full ? 'full' : 'settings', packageId: 'test', exportedAt: fixtureDate, appVersion: '0.0.0', counts: { procedures: records.procedures.length, groups: records.groups.length, revisions: records.revisions.length, media: records.mediaAssets.length, runs: records.runSessions.length }, entries: [], missingAssets: [] }) });
  const current = vi.spyOn(appBackupService, 'currentSettings').mockResolvedValue(settingsSchema.parse({})); const acceptCommitted = vi.fn();
  render(<I18nextProvider i18n={createUiI18n()}><AppearanceContext value={{ preferences: { locale: 'it', theme: 'light', uiScalePt: 13 }, update: vi.fn(), saveFailed: false, retry: vi.fn(), flush: async () => {}, acceptCommitted }}><MemoryRouter><AppBackupPage /></MemoryRouter></AppearanceContext></I18nextProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Importa' })); fireEvent.change(screen.getByLabelText('Scegli file'), { target: { files: [new File(['x'], 'test.nfbackup')] } });
  await screen.findByRole('heading', { name: full ? 'Backup completo' : 'Solo impostazioni' }); return { current, acceptCommitted };
}
it('I05 settings comparison is read-only, cancel does nothing; replacement requires its own confirmation and waits for durable success', async () => {
  const commit = vi.spyOn(appBackupService, 'commit'); let finish: (value: Awaited<ReturnType<typeof appBackupService.commit>>) => void = () => {};
  commit.mockImplementation(() => new Promise((resolve) => { finish = resolve; })); const { acceptCommitted } = await setup(false);
  expect(screen.getByRole('region', { name: 'Confronto impostazioni' })).toHaveTextContent('English'); expect(commit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Sostituisci impostazioni…' })); fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annulla' })); expect(commit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Sostituisci impostazioni…' })); fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Conferma sostituzione' }));
  await waitFor(() => expect(commit).toHaveBeenCalledTimes(1)); expect(acceptCommitted).not.toHaveBeenCalled(); expect(screen.queryByRole('heading', { name: 'Impostazioni sostituite' })).toBeNull();
  finish({ procedureIds: [], runIds: [], settings: importedSettings() }); await screen.findByRole('heading', { name: 'Impostazioni sostituite' }); expect(acceptCommitted).toHaveBeenCalledWith(importedSettings());
});
it('I06/I07 E12 full defaults OFF; declining the second settings consent adds nothing until separately confirmed without settings', async () => {
  const commit = vi.spyOn(appBackupService, 'commit').mockResolvedValue({ procedureIds: ['copy'], runIds: [], settings: null }); await setup(true);
  const toggle = screen.getByRole('checkbox', { name: 'Sostituisci anche le impostazioni' }); expect(toggle).not.toBeChecked(); fireEvent.click(toggle);
  fireEvent.click(screen.getByRole('button', { name: 'Importa backup' })); fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Prosegui al consenso impostazioni' })); expect(commit).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annulla' })); expect(toggle).not.toBeChecked(); expect(commit).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Continua senza sostituire impostazioni' })); expect(commit).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aggiungi come copie' })); await screen.findByRole('heading', { name: 'Importazione completata' }); expect(commit).toHaveBeenCalledWith(expect.anything(), { additions: true });
});
it('stale replacement invalidates consent and rereads Current; it cannot retry automatically using the old comparison', async () => {
  const commit = vi.spyOn(appBackupService, 'commit').mockRejectedValue(new PackageError('stale')); const { current } = await setup(false); current.mockResolvedValue(settingsSchema.parse({ uiScalePt: 30 }));
  fireEvent.click(screen.getByRole('button', { name: 'Sostituisci impostazioni…' })); fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Conferma sostituzione' }));
  const alert = await within(screen.getByRole('dialog')).findByRole('alert'); expect(alert).toHaveTextContent('cambiate dopo il confronto'); fireEvent.click(within(alert).getByRole('button', { name: 'Rileggi impostazioni attuali' }));
  await screen.findByText('30 pt'); expect(commit).toHaveBeenCalledTimes(1);
});
