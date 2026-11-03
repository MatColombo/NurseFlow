import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@app/App';
import { createRun, unwrap } from '@domain/runtime';
import { settingsSchema } from '@domain/model';
import { exampleRecords, fixtureDate } from '@test/fixtures/domain';
import { runtimeReady } from '@test/fixtures/runtime';
import { outlineGraph } from '@test/fixtures/builder';
import { mapService, type MapData } from './service';
import { procedureService } from '@features/procedures/service';
vi.mock('@features/step-editor/media/MediaImage', () => ({ MediaImage: () => <p>W07 · Immagine non disponibile</p> }));
function data(): MapData {
  const graph = outlineGraph(); const choice = graph.nodes.find((node) => node.kind === 'decision')!;
  if (choice.kind === 'decision') {
    choice.note = { text: 'Nota del passo', visibility: 'expandable' };
    choice.outcomes[0]!.note = { text: 'Nota solo A', visibility: 'expandable' };
    choice.outcomes[1]!.note = { text: '<script>contenuto authored</script>', visibility: 'always-visible' };
  }
  const revision = runtimeReady(graph); return { title: 'Cartoncini', revision, preview: false, returnPath: '/procedure/procedure' };
}
beforeEach(() => {
  window.history.replaceState(null, '', '/#/procedure/procedure/map?revision=ready');
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function mount() { render(<App appearanceService={{ load: async () => settingsSchema.parse({}), save: async (value) => value }} />); }
describe('Page05 read-only interactions', () => {
  it('one canonical row, disclosures separate from inspection, reference focus and independent notes; no executable controls', async () => {
    vi.spyOn(mapService, 'read').mockResolvedValue(data()); mount(); fireEvent.click(await screen.findByRole('button', { name: 'Lista' }));
    expect(document.querySelectorAll('[data-map-row="shared"]')).toHaveLength(1);
    fireEvent.click(screen.getAllByRole('button', { name: /Riferimento a Revisione comune/ })[0]!);
    expect(screen.getByRole('button', { name: 'Esamina Revisione comune' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Collegamenti di Scelta dimostrativa' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Esamina Scelta dimostrativa' }));
    const sheet = await screen.findByRole('dialog', { name: 'Decisione' });
    expect(within(sheet).getByRole('heading', { name: 'Percorso A o B?' })).toBeInTheDocument();
    expect(within(sheet).getByText('<script>contenuto authored</script>')).toBeInTheDocument(); expect(sheet.querySelector('script')).toBeNull();
    expect(within(sheet).getByText('Nota del passo')).toBeVisible();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Nascondi nota' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Mostra nota' })); expect(within(sheet).getByText('Nota del passo')).toBeInTheDocument();
    expect(within(sheet).getByText('Nota solo A')).not.toBeVisible();
    fireEvent.click(within(sheet).getByText('ⓘ Nota di A')); expect(within(sheet).getByText('Nota solo A')).toBeVisible();
    expect(within(sheet).queryByRole('button', { name: /^(Continua|A|B|Modifica|Termina)/ })).toBeNull();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Chiudi' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Esamina Scelta dimostrativa' })).toHaveFocus());
    expect(screen.getByRole('button', { name: 'Collegamenti di Scelta dimostrativa' })).toHaveAttribute('aria-expanded', 'false');
  });
  it('Details context has no Current control; return restores context without recording another open', async () => {
    const value = data(); vi.spyOn(mapService, 'read').mockResolvedValue(value);
    const load = vi.spyOn(procedureService, 'load').mockResolvedValue({ procedure: { ...exampleRecords().procedures[0]!, title: 'Cartoncini' },
      ready: runtimeReady(value.revision.graph), draft: undefined, groups: [], tags: [], resume: undefined });
    mount(); await screen.findByRole('button', { name: 'Lista' });
    expect(screen.queryByRole('button', { name: 'Corrente' })).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Indietro ai dettagli' })); await screen.findByRole('button', { name: 'Vedi mappa' });
    expect(load).toHaveBeenCalledWith('procedure', false);
  });
  it('a saved run only exposes inspection and Jump to Current, never activity or branch switching', async () => {
    const value = data(); const run = unwrap(createRun(value.revision, 'run', fixtureDate));
    vi.spyOn(mapService, 'read').mockResolvedValue({ ...value, run, returnPath: '/run/run' }); mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Lista' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vai al corrente' }));
    expect(screen.getByRole('button', { name: 'Esamina Scelta dimostrativa' })).toHaveFocus();
    expect(document.querySelector('[data-map-row="decision"]')).toHaveAttribute('data-route-state', 'current');
    expect(screen.queryByRole('button', { name: /Cambia attività|Riapri attività|Continua/ })).toBeNull();
  });
  it('unavailable revision offers Back and real Retry without a substituted graph', async () => {
    const read = vi.spyOn(mapService, 'read').mockRejectedValueOnce(new Error('missing')).mockResolvedValue(data()); mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile aprire la mappa');
    expect(screen.queryByRole('button', { name: 'Lista' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Riprova' })); await screen.findByRole('button', { name: 'Lista' });
    expect(read).toHaveBeenCalledTimes(2);
  });
});
