import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { createUiI18n } from '@shared/i18n';
import { ExportDialog } from './ExportDialog';
afterEach(() => vi.unstubAllGlobals());
it('I15 Share cancellation is not a saved backup; download is an honest handoff and Blob URLs are released', async () => {
  const NativeURL = URL; const revoke = vi.fn(); vi.stubGlobal('URL', class extends NativeURL { static override createObjectURL = vi.fn(() => 'blob:prepared'); static override revokeObjectURL = revoke; });
  const share = vi.fn(async () => { throw new DOMException('cancel', 'AbortError'); }); vi.stubGlobal('navigator', { canShare: () => true, share });
  const close = vi.fn(); const { unmount } = render(<I18nextProvider i18n={createUiI18n()}><ExportDialog prepared={{ blob: new Blob(['zip']), kind: 'procedure', name: 'NurseFlow.nfproc', count: 1, warnings: [] }} close={close} /></I18nextProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Condividi file' })); expect(await screen.findByRole('status')).toHaveTextContent('Condivisione annullata'); expect(share).toHaveBeenCalledTimes(1);
  const link = await screen.findByRole('link', { name: 'Scarica file' }); expect(link).toHaveAttribute('download', 'NurseFlow.nfproc'); link.addEventListener('click', (event) => event.preventDefault()); fireEvent.click(link);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Download richiesto al browser'));
  expect(screen.queryByText('Backup salvato')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Chiudi' })); expect(close).toHaveBeenCalled(); unmount(); expect(revoke).toHaveBeenCalledWith('blob:prepared');
});
