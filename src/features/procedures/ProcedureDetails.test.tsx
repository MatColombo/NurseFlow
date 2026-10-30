import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@app/App';
import { libraryFixture } from '@test/fixtures/library';
import { procedureService, type ProcedureDetails } from './service';
import { settingsSchema } from '@domain/model';
import { libraryService } from '@features/library/service';

const fixture = libraryFixture();
function details(kind: 'draft' | 'ready' | 'both'): ProcedureDetails {
  const procedure = { ...fixture.procedures[0]! };
  if (kind === 'draft') delete procedure.readyRevisionId;
  if (kind === 'ready') delete procedure.workingDraftId;
  return { procedure, groups: fixture.groups, tags: procedure.tags, resume: undefined,
    ready: kind === 'draft' ? undefined : fixture.revisions.find((revision) => revision.id === 'fixture-0-ready'),
    draft: kind === 'ready' ? undefined : fixture.revisions.find((revision) => revision.id === 'fixture-0-draft') };
}
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  window.history.replaceState(null, '', '/#/procedure/fixture-0');
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function mount() { return render(<App appearanceService={{ load: async () => settingsSchema.parse({}), save: async (value) => value }} />); }

describe('Details usa stati e revisioni reali', () => {
  it.each(['draft', 'ready', 'both'] as const)('stato %s: azioni contestuali senza duplicati o titolo nel header', async (kind) => {
    vi.spyOn(procedureService, 'load').mockResolvedValue(details(kind)); mount();
    expect(await screen.findByRole('heading', { name: 'Cartoncini àlfa', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'NurseFlow' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vedi mappa' })).toBeInTheDocument();
    if (kind === 'draft') {
      expect(screen.queryByRole('button', { name: /Avvia/ })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Anteprima bozza' })).toBeInTheDocument();
    } else {
      expect(screen.getByRole('button', { name: kind === 'both' ? 'Avvia Ready' : 'Avvia' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Anteprima bozza' })).not.toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: kind === 'both' ? 'Continua modifica' : 'Modifica grafo' })).toBeInTheDocument();
  });
  it('Map seleziona Ready in presenza di una Draft differente', async () => {
    vi.spyOn(procedureService, 'load').mockResolvedValue(details('both'));
    vi.spyOn(procedureService, 'revision').mockResolvedValue(details('both').ready!); mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Vedi mappa' }));
    await waitFor(() => expect(window.location.hash).toContain('revision=fixture-0-ready'));
  });
  it('Edit Ready-only apre una copia di lavoro, senza invocare creazione Draft', async () => {
    vi.spyOn(procedureService, 'load').mockResolvedValue(details('ready')); vi.spyOn(procedureService, 'revision').mockResolvedValue(details('ready').ready!);
    vi.spyOn(libraryService, 'openProcedure').mockResolvedValue({ ...details('ready').procedure, lastOpenedAt: '2026-10-30T10:00:00.000Z' }); const create = vi.spyOn(procedureService, 'create'); mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Modifica grafo' }));
    await waitFor(() => expect(window.location.hash).toContain('copy=ready')); expect(create).not.toHaveBeenCalled();
    expect(await screen.findByText(/Copia di lavoro/)).toBeInTheDocument();
  });
  it('revisione assente o corrotta blocca Start e Preview con recupero', async () => {
    vi.spyOn(procedureService, 'load').mockRejectedValue(new Error('corrupt')); mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Procedura o revisione non disponibile');
    expect(screen.queryByRole('button', { name: /Avvia|Anteprima/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Torna alla libreria' })).toBeInTheDocument();
  });
  it('errore Start indica recupero della Ready e mantiene la stessa azione al Retry', async () => {
    vi.spyOn(procedureService, 'load').mockResolvedValue(details('ready'));
    const start = vi.spyOn(procedureService, 'start').mockRejectedValue(new Error('invalid Ready')); mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Avvia' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('La versione Ready non può essere aperta');
    fireEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    await waitFor(() => expect(start).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('alert')).toHaveTextContent('La versione Ready non può essere aperta');
    expect(screen.getByRole('button', { name: 'Modifica grafo' })).toBeInTheDocument();
  });
});
