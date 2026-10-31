import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { createUiI18n } from '@shared/i18n';
import { createRun, reduceRun, unwrap, viewRun } from '@domain/runtime';
import { activityChoiceGraph, runtimeReady } from '@test/fixtures/runtime';
import { outlineGraph } from '@test/fixtures/builder';
import { fixtureDate } from '@test/fixtures/domain';
import { nodeSchema, type EndKind } from '@domain/model';
import { RunScreen, type RunData, type RunAdapter } from './RunScreen';
vi.mock('@features/step-editor/media/MediaImage', () => ({ MediaImage: () => <span>W07 · Immagine non disponibile</span> }));
vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
function initial(endKind?: EndKind): RunData {
  const graph = outlineGraph(); const end = graph.nodes.find((n) => n.kind === 'end')!; if (end.kind === 'end' && endKind) end.endKind = endKind;
  const choice = graph.nodes.find((n) => n.kind === 'decision')!;
  if (choice.kind === 'decision') { choice.outcomes[0]!.note = { text: 'Nota A', visibility: 'expandable' }; choice.outcomes[1]!.note = { text: 'Nota B essenziale', visibility: 'always-visible' }; }
  const revision = runtimeReady(graph); let run = unwrap(createRun(revision, 'run', fixtureDate));
  if (endKind) for (const event of [{ type: 'choose-outcome', outcomeId: 'a' }, { type: 'continue' }, { type: 'continue' }]) run = unwrap(reduceRun(run, revision, event, fixtureDate))!;
  return { run, revision, view: viewRun(run, revision), title: 'Esempio senza contenuto clinico', preview: false };
}
function mount(data = initial(), change?: (adapter: RunAdapter) => RunAdapter) {
  let latest = data;
  const dispatch = vi.fn<RunAdapter['dispatch']>(async (event) => { const run = unwrap(reduceRun(latest.run, latest.revision, event, fixtureDate)); return run ? { ...latest, run, view: viewRun(run, latest.revision) } : null; });
  const finish = vi.fn(async () => {});
  function Harness() {
    const [current, setCurrent] = useState(data); latest = current;
    const adapter: RunAdapter = { dispatch, finish, reload: async () => latest };
    return <RunScreen initial={current} onData={setCurrent} adapter={change ? change(adapter) : adapter} />;
  }
  render(<I18nextProvider i18n={createUiI18n()}><MemoryRouter initialEntries={['/run/run']}><Harness /></MemoryRouter></I18nextProvider>);
  return { dispatch, finish };
}
describe('F10 consultation and terminal rendering', () => {
  it('an authored answer that ends an activity explicitly labels completion and keeps other activities pending', async () => {
    const revision = runtimeReady(activityChoiceGraph()); let run = unwrap(createRun(revision, 'run', fixtureDate));
    run = unwrap(reduceRun(run, revision, { type: 'continue' }, fixtureDate))!;
    const { dispatch } = mount({ run, revision, view: viewRun(run, revision), title: 'Cartoncini', preview: false });
    expect(dispatch).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: /^Blu.*Termina questa attività/ }));
    await screen.findByRole('heading', { name: 'Operazione 2' }); expect(screen.getByRole('button', { name: /Cambia attività/ })).toHaveTextContent('1/2 completate');
  });
  it('missing End type defaults to neutral, while missing authored message produces an error without a success label', () => {
    expect(nodeSchema.parse({ id: 'old-end', kind: 'end', heading: 'Titolo autore', message: 'Testo autore' })).toMatchObject({ endKind: 'neutral' });
    const data = initial('completed'); if (data.view.node.kind === 'end') data.view.node.message = '';
    mount(data); expect(screen.getByRole('alert')).toHaveTextContent('Contenuto finale non disponibile'); expect(document.querySelector('[data-end-kind]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Torna alla libreria' })).toBeNull();
  });
  it('missing authored question never offers an executable choice or fabricated content', () => {
    const data = initial(); if (data.view.node.kind === 'decision') data.view.node.question = '';
    mount(data); expect(screen.getByRole('alert')).toHaveTextContent('Contenuto del passo non disponibile');
    expect(screen.queryByRole('button', { name: 'A' })).toBeNull(); expect(screen.queryByRole('button', { name: 'B' })).toBeNull();
  });
  it('one visible step, route context and independent notes; always-visible outcome note is never collapsed', async () => {
    const { dispatch } = mount(); expect(screen.getByText('PASSO 1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Fase esempio')).toBeInTheDocument(); expect(screen.getByText('Nota B essenziale')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nota per: A' })); expect(screen.getByText('Nota A')).toBeInTheDocument(); expect(dispatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'A' })); await screen.findByRole('heading', { name: 'Percorso A' });
    expect(document.querySelectorAll('[data-step-content]')).toHaveLength(1); expect(screen.getByRole('complementary', { name: 'PASSO PRECEDENTE' })).toHaveTextContent('Percorso A o B? · A');
  });
  it('waits for commit, blocks duplicate taps and preserves the last durable step on write failure', async () => {
    let reject!: (reason: Error) => void; const dispatch = vi.fn(() => new Promise<RunData | null>((_resolve, failure) => { reject = failure; }));
    mount(initial(), (adapter) => ({ ...adapter, dispatch })); const button = screen.getByRole('button', { name: 'A' });
    fireEvent.click(button); fireEvent.click(button); expect(dispatch).toHaveBeenCalledTimes(1); expect(screen.getByRole('heading', { name: 'Percorso A o B?' })).toBeInTheDocument();
    reject(new Error('quota')); expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile salvare'); expect(screen.getByRole('heading', { name: 'Percorso A o B?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Riprova' })).toBeInTheDocument();
  });
  it('Exit and first-step Back require confirmation with Stay focused; dismissing leaves the run intact', async () => {
    const { dispatch } = mount(); fireEvent.click(screen.getByRole('button', { name: 'Esci' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Resta' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Resta' })); expect(dispatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Indietro' })); await screen.findByRole('dialog', { name: 'Uscire dall’esecuzione?' });
  });
  it.each(['completed', 'stopped', 'escalation', 'neutral'] as const)('authored %s End preserves text, count, Back/Map and confirmed Restart', async (kind) => {
    const { dispatch, finish } = mount(initial(kind)); expect(document.querySelector('[data-end-kind]')).toHaveAttribute('data-end-kind', kind);
    expect(screen.getByText('Fine del percorso dimostrativo.')).toBeInTheDocument(); expect(screen.getByText('FINE · 3 passi')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continua' })).toBeNull(); expect(screen.queryByRole('button', { name: 'Esci' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ricomincia' })); fireEvent.click(screen.getByRole('button', { name: 'Annulla' })); expect(dispatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Torna alla libreria' })); await waitFor(() => expect(finish).toHaveBeenCalledOnce());
  });
});
