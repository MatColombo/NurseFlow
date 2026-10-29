import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { expect, it, vi } from 'vitest';
import { createUiI18n } from '@shared/i18n';
import { ErrorBoundary } from './error-boundaries';

it('un errore di rendering ha recupero localizzato e non espone contenuti o stack', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  let fail = true;
  function View() { if (fail) throw new Error('Private authored content'); return <p>Vista recuperata</p>; }
  render(<I18nextProvider i18n={createUiI18n('en')}><ErrorBoundary><View /></ErrorBoundary></I18nextProvider>);
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to display this view');
  expect(screen.queryByText('Private authored content')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Return to Library' })).toHaveAttribute('href', '#/library');
  fail = false; fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(screen.getByText('Vista recuperata')).toBeInTheDocument();
  consoleError.mockRestore();
});
