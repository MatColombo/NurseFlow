import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { Appearance, AppearanceService } from './appearance-service';
import { settingsSchema } from '@domain/model';
vi.mock('@features/step-editor/media/service', () => ({ mediaService: { settings: async () => settingsSchema.parse({}), saveSettings: async (value: unknown) => settingsSchema.parse(value) } }));

const defaults: Appearance = { locale: 'it', theme: 'system', uiScalePt: 13 };
let osDark = false;
let query: EventTarget;
beforeEach(() => {
  osDark = false; query = new EventTarget();
  vi.stubGlobal('matchMedia', () => ({ get matches() { return osDark; },
    addEventListener: query.addEventListener.bind(query), removeEventListener: query.removeEventListener.bind(query) }));
  window.history.replaceState(null, '', '/#/settings');
});
function service(overrides: Partial<AppearanceService> = {}): AppearanceService {
  return { load: async () => defaults, save: async (value) => value, ...overrides };
}
async function openScale() {
  fireEvent.click(await screen.findByRole('button', { name: 'Scala interfaccia 13 pt' }));
  return screen.getByRole('slider');
}

describe('Preferenze UI', () => {
  it('segue System anche quando l’OS cambia, e conserva l’override esplicito', async () => {
    const save = vi.fn(async (value: Appearance) => value);
    render(<App appearanceService={service({ save })} />);
    await screen.findByRole('heading', { name: 'Impostazioni', level: 2 });
    expect(document.documentElement.dataset.theme).toBe('light');
    act(() => { osDark = true; query.dispatchEvent(new Event('change')); });
    expect(document.documentElement.dataset.theme).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: 'Tema Sistema' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Chiaro' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ ...defaults, theme: 'light' }));
    act(() => { osDark = false; query.dispatchEvent(new Event('change')); osDark = true; query.dispatchEvent(new Event('change')); });
    expect(document.documentElement.dataset.theme).toBe('light');
  });
  it('scala immediata, un solo slider con estremi accessibili e reset', async () => {
    const save = vi.fn(async (value: Appearance) => value);
    render(<App appearanceService={service({ save })} />);
    const slider = await openScale();
    expect(screen.getAllByRole('slider')).toHaveLength(1);
    expect(slider).toHaveAttribute('min', '4'); expect(slider).toHaveAttribute('max', '48');
    fireEvent.change(slider, { target: { value: '48' } });
    expect(slider).toHaveAttribute('aria-valuetext', '48 pt');
    expect(document.documentElement.style.getPropertyValue('--nf-font-base')).toBe('48pt');
    await waitFor(() => expect(save).toHaveBeenCalledWith({ ...defaults, uiScalePt: 48 }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Ripristina 13 pt' }).at(-1)!);
    expect(slider).toHaveValue('13');
  });
  it('serializza aggiornamenti rapidi senza perdere tema o scala', async () => {
    let release: (value: Appearance) => void = () => {};
    const save = vi.fn<(value: Appearance) => Promise<Appearance>>()
      .mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }))
      .mockImplementation(async (value) => value);
    render(<App appearanceService={service({ save })} />);
    const slider = await openScale();
    fireEvent.change(slider, { target: { value: '30' } });
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    fireEvent.change(slider, { target: { value: '48' } });
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => release({ ...defaults, uiScalePt: 30 }));
    await waitFor(() => expect(save).toHaveBeenLastCalledWith({ ...defaults, uiScalePt: 48 }));
    expect(slider).toHaveValue('48');
  });
  it('fallimento save ripristina la preferenza durabile e Retry salva quella richiesta', async () => {
    const save = vi.fn<(value: Appearance) => Promise<Appearance>>()
      .mockRejectedValueOnce(new DOMException('Quota', 'QuotaExceededError')).mockImplementation(async (value) => value);
    render(<App appearanceService={service({ save })} />);
    const slider = await openScale();
    fireEvent.change(slider, { target: { value: '48' } });
    const dialog = within(screen.getByRole('dialog'));
    expect(await dialog.findByRole('alert')).toHaveTextContent('Impostazioni non salvate');
    expect(slider).toHaveValue('13');
    fireEvent.click(dialog.getByRole('button', { name: 'Riprova' }));
    await waitFor(() => expect(slider).toHaveValue('48'));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
  it('errore di apertura è recuperabile senza cancellare dati', async () => {
    const load = vi.fn<AppearanceService['load']>().mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValue(defaults);
    render(<App appearanceService={service({ load })} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('IndexedDB deve essere accessibile');
    fireEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    expect(await screen.findByRole('heading', { name: 'Impostazioni', level: 2 })).toBeInTheDocument();
  });
  it('IT/EN funziona offline e aggiorna document.lang', async () => {
    render(<App appearanceService={service()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Lingua Italiano' }));
    fireEvent.click(screen.getByRole('radio', { name: 'English' }));
    expect(await screen.findByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('heading', { name: 'Settings', level: 2 })).toBeInTheDocument();
  });
});
