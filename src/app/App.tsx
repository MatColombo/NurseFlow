import { AppProviders } from '@app/providers';
import { AppRoutes } from '@app/routes';
import type { AppearanceService } from './appearance-service';
import { useLocation } from 'react-router-dom';
import { ApplicationGate } from '@features/settings/ApplicationGate';
import { useEffect, useRef } from 'react';

function AppFrame() {
  const { pathname } = useLocation();
  const frame = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = frame.current?.animate?.([{ opacity: .65 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
    return () => animation?.cancel();
  }, [pathname]);
  const map = /^\/procedure\/[^/]+\/map$/.test(pathname);
  const primary = map || ['/', '/setup', '/library', '/new', '/settings', '/data/procedures', '/data/app'].includes(pathname) || /^\/(procedure|build)\/[^/]+$/.test(pathname) || /^\/build\/[^/]+\/(step\/[^/]+|check)$/.test(pathname) || /^\/run\/[^/]+(\/end)?$/.test(pathname);
  return <><ApplicationGate /><main ref={frame} className={'nf-stack' + (map ? ' nf-map-frame' : '')}>{!primary && <h1>NurseFlow</h1>}<AppRoutes /></main></>;
}

export default function App({ appearanceService }: { appearanceService?: AppearanceService }) {
  return (
    <AppProviders {...(appearanceService ? { appearanceService } : {})}>
      <AppFrame />
    </AppProviders>
  );
}
