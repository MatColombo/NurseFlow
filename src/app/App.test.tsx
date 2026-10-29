import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '@app/App';
import { routeDefinitions } from '@app/route-definitions';
import { settingsSchema } from '@domain/model';
import type { AppearanceService } from './appearance-service';

const appearanceService: AppearanceService = {
  load: async () => settingsSchema.parse({}), save: async (value) => value,
};

describe('Shell F02 con HashRouter', () => {
  it('monta React e apre la libreria dalla root', async () => {
    render(<App appearanceService={appearanceService} />);

    expect(await screen.findByRole('heading', { name: 'NurseFlow', level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Libreria', level: 2 })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/library');
    expect(screen.getByText('Pagina 01: funzionalità non ancora implementata.')).toBeInTheDocument();
  });

  it.each(routeDefinitions)('risolve il deep link $path', async ({ example, title, page }) => {
    window.history.replaceState(null, '', `/repository/#${example}`);
    render(<App appearanceService={appearanceService} />);

    expect(await screen.findByRole('heading', { name: title, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(`Pagina ${page}: funzionalità non ancora implementata.`)).toBeInTheDocument();
    expect(window.location.hash).toBe(`#${example}`);
    expect(window.location.pathname).toBe('/repository/');
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
