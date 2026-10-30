import { AppProviders } from '@app/providers';
import { AppRoutes } from '@app/routes';
import type { AppearanceService } from './appearance-service';
import { useLocation } from 'react-router-dom';

function AppFrame() {
  const { pathname } = useLocation();
  const primary = ['/', '/setup', '/library', '/new'].includes(pathname) || /^\/procedure\/[^/]+$/.test(pathname);
  return <main className="nf-stack">{!primary && <h1>NurseFlow</h1>}<AppRoutes /></main>;
}

export default function App({ appearanceService }: { appearanceService?: AppearanceService }) {
  return (
    <AppProviders {...(appearanceService ? { appearanceService } : {})}>
      <AppFrame />
    </AppProviders>
  );
}
