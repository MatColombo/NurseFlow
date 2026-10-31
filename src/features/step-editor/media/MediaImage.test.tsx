import { act, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, expect, it, vi } from 'vitest';
import { createUiI18n } from '@shared/i18n';
import type { MediaAsset, StepMedia } from '@domain/model';
import { MediaImage } from './MediaImage';
import { mediaService } from './service';
vi.mock('./service', () => ({ mediaService: { asset: vi.fn() } }));
vi.mock('./images', () => ({ remotePhoto: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const item: StepMedia = { id: 'm', slot: 'before-note', order: 0, source: { kind: 'local', assetId: 'a', mime: 'image/png' }, altText: 'Alt autore' };
const view = (item: StepMedia) => <I18nextProvider i18n={createUiI18n()}><MediaImage item={item} /></I18nextProvider>;
it('revoca gli object URL a cambio sorgente/unmount; digitare caption non rilegge il Blob', async () => {
  const read = vi.mocked(mediaService.asset); read.mockResolvedValue({ blob: new Blob(['image']) } as MediaAsset);
  const create = vi.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second'); const revoke = vi.fn();
  vi.stubGlobal('URL', class extends URL { static override createObjectURL = create; static override revokeObjectURL = revoke; });
  const { rerender, unmount } = render(view(item)); await screen.findByAltText('Alt autore');
  rerender(view({ ...item, source: { ...item.source }, caption: 'Nuova didascalia' })); expect(create).toHaveBeenCalledTimes(1);
  rerender(view({ ...item, source: { kind: 'local', assetId: 'b', mime: 'image/png' } })); await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
  expect(revoke).toHaveBeenCalledWith('blob:first'); unmount(); expect(revoke).toHaveBeenCalledWith('blob:second');
});
it('unmount durante lettura non crea URL; Blob mancante mostra W07 e caption escaped', async () => {
  let resolve!: (value: MediaAsset | undefined) => void; vi.mocked(mediaService.asset).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const create = vi.fn(); vi.stubGlobal('URL', class extends URL { static override createObjectURL = create; static override revokeObjectURL = vi.fn(); });
  const { unmount } = render(view(item)); unmount(); await act(async () => resolve({ blob: new Blob(['late']) } as MediaAsset)); expect(create).not.toHaveBeenCalled();
  vi.mocked(mediaService.asset).mockResolvedValue(undefined); const { container } = render(view({ ...item, caption: '<svg onload="alert(1)"/>' }));
  expect(await screen.findByText(/^W07/)).toBeInTheDocument(); expect(screen.getByText('<svg onload="alert(1)"/>')).toBeInTheDocument(); expect(container.querySelector('svg')).toBeNull();
});
