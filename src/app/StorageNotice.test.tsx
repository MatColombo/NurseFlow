import { render, screen, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, expect, it } from 'vitest';
import { createUiI18n } from '@shared/i18n';
import { storageLifecycle } from '@storage/lifecycle';
import { StorageNotice } from './StorageNotice';
afterEach(() => storageLifecycle.report('ready'));
it('blocked/versionchange explain recovery without an automatic reload or destructive reset', () => {
  render(<I18nextProvider i18n={createUiI18n()}><StorageNotice /></I18nextProvider>);
  expect(screen.queryByRole('alert')).toBeNull(); act(() => storageLifecycle.report('blocked'));
  expect(screen.getByRole('alert')).toHaveTextContent('non cancellare i dati');
  act(() => storageLifecycle.report('changed'));
  expect(screen.getByRole('alert')).toHaveTextContent('conserva eventuali testi non salvati'); expect(screen.queryByRole('button')).toBeNull();
});
