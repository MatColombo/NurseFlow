import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@app/App';
import { settingsSchema, uiPreferencesSchema } from '@domain/model';
import { libraryService } from '@features/library/service';
import { mediaService } from '@features/step-editor/media/service';
import { settingsService } from './service';
const defaults = settingsSchema.parse({});
beforeEach(() => {
  window.history.replaceState(null, '', '/#/settings'); vi.spyOn(mediaService, 'settings').mockResolvedValue(defaults);
  vi.spyOn(settingsService, 'inventory').mockResolvedValue({ token: 'reviewed', procedures: 2, groups: 1, revisions: 3, media: 5, runs: 1 });
});
afterEach(() => vi.restoreAllMocks());
function mount() { render(<App appearanceService={{ load: async () => ({ locale: defaults.locale, theme: defaults.theme, uiScalePt: defaults.uiScalePt }), save: async (value) => value }} />); }
describe('F12 compact Settings and guarded actions', () => {
  it('two data destinations, no global Save or placeholder and Advanced collapsed', async () => {
    mount(); expect(await screen.findByRole('heading', { name: 'Impostazioni', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Procedure e libreria/ })).toHaveAttribute('href', '#/data/procedures');
    expect(screen.getByRole('link', { name: /Backup app e impostazioni/ })).toHaveAttribute('href', '#/data/app');
    expect(screen.getByRole('button', { name: /Avanzate/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Cancella dati locali' })).toBeNull(); expect(screen.queryByText('Anteprima tecnica F02')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Salva$/ })).toBeNull();
  });
  it('future media preference waits for commit, reports failure and Retry retains the requested value', async () => {
    const save = vi.spyOn(mediaService, 'saveSettings').mockRejectedValueOnce(new Error('quota')).mockImplementation(async (value) => ({ ...defaults, ...value }));
    mount(); fireEvent.click(await screen.findByRole('button', { name: /Compressione per le prossime foto/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Alta' }));
    const sheet = screen.getByRole('dialog'); expect(await within(sheet).findByRole('alert')).toHaveTextContent('Impostazioni non salvate');
    expect(within(sheet).getByRole('radio', { name: 'Medio' })).toBeChecked();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Riprova' }));
    await waitFor(() => expect(within(sheet).getByRole('radio', { name: 'Alta' })).toBeChecked()); expect(save).toHaveBeenCalledTimes(2);
  });
  it('clear has export before two cautions, safe Cancel focus and no command until the final acknowledgment', async () => {
    const clear = vi.spyOn(settingsService, 'clear').mockRejectedValue(new Error('quota')); mount();
    fireEvent.click(await screen.findByRole('button', { name: /Avanzate/ })); fireEvent.click(screen.getByRole('button', { name: 'Cancella dati locali' }));
    let sheet = await screen.findByRole('dialog', { name: 'Cancella dati locali' });
    expect(within(sheet).getByRole('link', { name: /Esporta prima/ })).toHaveAttribute('href', '#/data/app');
    await waitFor(() => expect(within(sheet).getByRole('button', { name: 'Annulla' })).toHaveFocus()); expect(clear).not.toHaveBeenCalled();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Prosegui alla conferma finale' }));
    sheet = await screen.findByRole('dialog', { name: 'Cancellazione definitiva' });
    expect(within(sheet).getByRole('button', { name: 'Elimina definitivamente tutti i dati' })).toBeDisabled();
    fireEvent.click(within(sheet).getByRole('checkbox')); fireEvent.click(within(sheet).getByRole('button', { name: 'Elimina definitivamente tutti i dati' }));
    expect(await within(sheet).findByRole('alert')).toHaveTextContent('Operazione non completata'); expect(window.location.hash).toBe('#/settings');
    expect(clear).toHaveBeenCalledWith('reviewed', true);
    fireEvent.click(within(sheet).getByRole('button', { name: 'Annulla' })); expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('successful clear accepts only appearance fields, allowing the first locale change without an extra write', async () => {
    vi.spyOn(settingsService, 'clear').mockResolvedValue(defaults);
    vi.spyOn(libraryService, 'load').mockResolvedValue({ procedures: [], groups: [], revisions: [], view: uiPreferencesSchema.parse({}) });
    const save = vi.fn(async (value: { locale: 'it' | 'en'; theme: 'system' | 'light' | 'dark'; uiScalePt: number }) => value);
    render(<App appearanceService={{ load: async () => ({ locale: 'it', theme: 'dark', uiScalePt: 30 }), save }} />);
    fireEvent.click(await screen.findByRole('button', { name: /Avanzate/ })); fireEvent.click(screen.getByRole('button', { name: 'Cancella dati locali' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Prosegui alla conferma finale' }));
    fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Elimina definitivamente tutti i dati' }));
    await screen.findByRole('button', { name: /^Inizia$/ }); expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^English$/ }));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ locale: 'en', theme: 'system', uiScalePt: 13 }));
  });
});
