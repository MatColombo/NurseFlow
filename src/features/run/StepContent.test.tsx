import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { expect, it, vi } from 'vitest';
import { createUiI18n } from '@shared/i18n';
import { editableStep } from '@domain/editor/edits';
import { outlineGraph } from '@test/fixtures/builder';
import type { StepMedia } from '@domain/model';
import { StepContent } from './StepContent';
vi.mock('@features/step-editor/media/MediaImage', () => ({ MediaImage: ({ item, figureNumber }: { item: StepMedia; figureNumber?: number }) => <figure><figcaption>fig.{figureNumber} - {item.caption}</figcaption></figure> }));
const wrap = (node: ReturnType<typeof editableStep>) => render(<I18nextProvider i18n={createUiI18n()}><StepContent node={node} preview /></I18nextProvider>);
it('renderer condiviso: testo, galleria prima, disclosure nota, galleria dopo e azione inerte', () => {
  const node = editableStep(outlineGraph().nodes.find((node) => node.id === 'shared')!); if (node.kind !== 'instruction') throw new Error('fixture');
  node.text = '<img src=x onerror="alert(1)">'; node.note = { text: 'Nota autore', visibility: 'expandable' };
  node.media = [{ id: 'before', slot: 'before-note', order: 0, source: { kind: 'local', assetId: 'a', mime: 'image/png' }, caption: 'Prima' },
    { id: 'after', slot: 'after-note', order: 0, source: { kind: 'local', assetId: 'a', mime: 'image/png' }, caption: 'Dopo' }];
  const { container } = wrap(node);
  expect(screen.getByText(node.text)).toBeInTheDocument(); expect(container.querySelector('img')).toBeNull(); expect(screen.getByText('Nota autore')).toBeVisible();
  const disclosure = screen.getByRole('button', { name: 'Nascondi nota' }); expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(disclosure); expect(screen.queryByText('Nota autore')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Mostra nota' }));
  const before = screen.getByText('fig.1 - Prima'); const note = screen.getByText('Nota autore'); const after = screen.getByText('fig.2 - Dopo');
  expect(before.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy(); expect(note.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Continua' })).toBeDisabled();
});
it('Outcome note disponibile anche in preview; nessuna galleria vuota e nessuna navigazione Run', () => {
  const node = editableStep(outlineGraph().nodes.find((node) => node.id === 'decision')!); if (node.kind !== 'decision') throw new Error('fixture');
  node.outcomes[1]!.note = { text: 'Nota B', visibility: 'expandable' }; const { container } = wrap(node);
  expect(container.querySelector('.nf-gallery')).toBeNull(); expect(screen.getByRole('button', { name: 'B' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Nota per: B' }));
  expect(screen.getByText('Nota B')).toBeInTheDocument();
});
it('End mostra i campi terminali senza azione Continua e senza media', () => {
  wrap({ id: 'end', kind: 'end', endKind: 'escalation', heading: 'Titolo autore', message: 'Messaggio autore', note: { text: 'Nota finale', visibility: 'always-visible' } });
  expect(screen.getByText('Messaggio autore')).toBeInTheDocument(); expect(screen.getByText('Nota finale')).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Continua' })).toBeNull();
});
