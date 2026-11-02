import { AppProviders } from '@app/providers';
import { AppRoutes } from '@app/routes';
import type { AppearanceService } from './appearance-service';
import { useLocation } from 'react-router-dom';
import { ApplicationGate } from '@features/settings/ApplicationGate';

function AppFrame() {
  const { pathname } = useLocation();
  const map = /^\/procedure\/[^/]+\/map$/.test(pathname);
  const primary = map || ['/', '/setup', '/library', '/new', '/settings', '/data/procedures'].includes(pathname) || /^\/(procedure|build)\/[^/]+$/.test(pathname) || /^\/build\/[^/]+\/(step\/[^/]+|check)$/.test(pathname) || /^\/run\/[^/]+(\/end)?$/.test(pathname);
  return <><ApplicationGate /><main className={'nf-stack' + (map ? ' nf-map-frame' : '')}>{!primary && <h1>NurseFlow</h1>}<AppRoutes /></main></>;
}

export default function App({ appearanceService }: { appearanceService?: AppearanceService }) {
  return (
    <AppProviders {...(appearanceService ? { appearanceService } : {})}>
      <AppFrame />
    </AppProviders>
  );
}
