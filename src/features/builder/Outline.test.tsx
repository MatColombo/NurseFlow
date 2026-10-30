import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { createUiI18n } from '@shared/i18n';
import { outlineGraph, activitiesGraph } from '@test/fixtures/builder';
import { applyEdit } from '@domain/builder/edits';
import { Outline } from './Outline';
it('rende una sola identità canonica per il nodo condiviso e riferimenti navigabili', () => {
  const select = vi.fn(); const focus = vi.fn();
  const { container } = render(<I18nextProvider i18n={createUiI18n()}><Outline graph={outlineGraph()} selection={null} select={select} focus={focus} /></I18nextProvider>);
  expect(container.querySelectorAll('[data-outline-node="shared"]')).toHaveLength(1);
  const refs = screen.getAllByRole('button', { name: 'Vai al passo: Revisione comune' }); expect(refs).toHaveLength(2);
  fireEvent.click(refs[0]!); expect(focus).toHaveBeenCalledWith('shared');
  expect(screen.queryByText(/Join|ALL complete|Shared following step/)).not.toBeInTheDocument();
});
it('outlet vuoto e W08 hanno controlli distinti, con selezione dell’esatto outcome', () => {
  const graph = applyEdit(applyEdit(outlineGraph(), { type: 'disconnect', edge: { nodeId: 'decision', slot: 'outcome', itemId: 'a' } }, () => 'unused').graph,
    { type: 'delete', nodeId: 'b-step' }, () => 'unused').graph; const select = vi.fn();
  render(<I18nextProvider i18n={createUiI18n()}><Outline graph={graph} selection={{ kind: 'edge', edge: { nodeId: 'decision', slot: 'outcome', itemId: 'a' } }} select={select} focus={vi.fn()} /></I18nextProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'A · +' }));
  expect(screen.getByRole('button', { name: 'A · +' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'B · Percorso non disponibile: Percorso B' })).toHaveAttribute('aria-pressed', 'false');
  expect(select).toHaveBeenCalledWith({ kind: 'edge', edge: { nodeId: 'decision', slot: 'outcome', itemId: 'a' } });
  expect(screen.getByText(/W08/)).toHaveTextContent('Percorso B');
  expect(screen.queryByRole('button', { name: 'B · +' })).not.toBeInTheDocument();
});
it('32 attività rimangono nominalmente raggiungibili senza generare nodi di completamento', () => {
  const { container } = render(<I18nextProvider i18n={createUiI18n()}><Outline graph={activitiesGraph(32)} selection={null} select={vi.fn()} focus={vi.fn()} /></I18nextProvider>);
  expect(screen.getByRole('button', { name: 'Attività 27 · Operazione 27' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sfoglia attività (32)' })).toBeInTheDocument();
  expect(container.querySelectorAll('[data-outline-node]')).toHaveLength(35);
});
