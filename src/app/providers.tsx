import { useState, type PropsWithChildren } from 'react';
import { HashRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { createUiI18n } from '@shared/i18n';
import { AppearanceProvider } from './AppearanceProvider';
import { createAppearanceService, type AppearanceService } from './appearance-service';
import { ErrorBoundary } from './error-boundaries';
import { installPopGuard } from '@shared/navigation/pop-guard';

export function AppProviders({ children, appearanceService }: PropsWithChildren<{ appearanceService?: AppearanceService }>) {
  const [i18n] = useState(createUiI18n);
  const [service] = useState(() => { installPopGuard(window); return appearanceService ?? createAppearanceService(); });
  return <I18nextProvider i18n={i18n}><ErrorBoundary>
    <AppearanceProvider service={service}><HashRouter>{children}</HashRouter></AppearanceProvider>
  </ErrorBoundary></I18nextProvider>;
}
