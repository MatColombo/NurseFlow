import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '@app/App';
import { routeDefinitions } from '@app/route-definitions';
import { settingsSchema, uiPreferencesSchema } from '@domain/model';
import type { AppearanceService } from './appearance-service';

const appearanceService: AppearanceService = {
  load: async () => settingsSchema.parse({}), save: async (value) => value,
};
vi.mock('@features/library/service', () => ({ libraryService: {
  load: async () => ({ procedures: [], groups: [], revisions: [], view: uiPreferencesSchema.parse({ firstLaunchComplete: true }) }),
  openProcedure: async () => ({ title: 'Esempio fittizio' }),
  openRun: async () => ({ title: 'Esempio fittizio' }),
  persistenceStatus: async () => 'unsupported',
} }));

describe('Shell F02 con HashRouter', () => {
  it('monta React e apre la libreria dalla root', async () => {
    render(<App appearanceService={appearanceService} />);

    expect(await screen.findByRole('heading', { name: 'Procedure', level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Libreria', level: 2 })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/library');
    expect(screen.getByRole('searchbox', { name: 'Cerca procedure' })).toBeInTheDocument();
  });

  it.each(routeDefinitions.filter(({ page }) => !['00', '02', '06', '07'].includes(page)))('risolve il deep link $path', async ({ example, title, page }) => {
    window.history.replaceState(null, '', `/repository/#${example}`);
    render(<App appearanceService={appearanceService} />);

    expect(await screen.findByRole('heading', { name: title, level: 2 })).toBeInTheDocument();
    if (page !== '01') expect(screen.getByText(`Pagina ${page}: funzionalità non ancora implementata.`)).toBeInTheDocument();
    expect(window.location.hash).toBe(`#${example}`);
    expect(window.location.pathname).toBe('/repository/');
  });

  it('setup già completato torna alla libreria', async () => {
    window.history.replaceState(null, '', '/#/setup'); render(<App appearanceService={appearanceService} />);
    expect(await screen.findByRole('heading', { name: 'Procedure' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/library');
  });

  it('espone i parametri del deep link senza risolvere dati inesistenti', async () => {
    window.history.replaceState(null, '', '/#/build/draft-example/step/node-example');
    render(<App appearanceService={appearanceService} />);

    expect(await screen.findByText('draft-example')).toBeInTheDocument();
    expect(screen.getByText('node-example')).toBeInTheDocument();
  });

  it('offre recupero per una route inesistente', async () => {
    window.history.replaceState(null, '', '/#/missing');
    render(<App appearanceService={appearanceService} />);

    expect(await screen.findByRole('heading', { name: 'Pagina non trovata' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Torna alla libreria' }));
    expect(await screen.findByRole('heading', { name: 'Libreria', level: 2 })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/library');
  });
});
