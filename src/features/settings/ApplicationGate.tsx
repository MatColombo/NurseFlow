import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppearance } from '@app/appearance-context';
import { pendingOperations, subscribeOperations } from '@storage/activity';
import { builderService } from '@features/builder/service';
import { settingsService } from './service';
import { applicationService, setAppearanceBarrier, type InstallPrompt } from './application-service';
/** No registration, cache installation, automatic network check, or forced reload. */
export function ApplicationGate() {
  const { pathname } = useLocation(); const { flush } = useAppearance();
  const pending = useSyncExternalStore(subscribeOperations, pendingOperations);
  useEffect(() => { setAppearanceBarrier(async () => { await flush(); await builderService.flush(); }); }, [flush]);
  useEffect(() => { applicationService.setPath(pathname); }, [pathname]);
  useEffect(() => { if (!pending) void applicationService.whenIdle(); }, [pending]);
  useEffect(() => {
    const install = (event: Event) => { if ('prompt' in event && typeof event.prompt === 'function') applicationService.offerInstall(event as InstallPrompt); };
    const installed = () => applicationService.installed(); const changed = () => { void applicationService.controllerChanged(); };
    const network = () => applicationService.networkChanged();
    window.addEventListener('beforeinstallprompt', install); window.addEventListener('appinstalled', installed);
    window.addEventListener('online', network); window.addEventListener('offline', network);
    navigator.serviceWorker?.addEventListener('controllerchange', changed);
    const stop = settingsService.watchSessions(() => { void applicationService.whenIdle(); });
    return () => { window.removeEventListener('beforeinstallprompt', install); window.removeEventListener('appinstalled', installed);
      window.removeEventListener('online', network); window.removeEventListener('offline', network);
      navigator.serviceWorker?.removeEventListener('controllerchange', changed); stop(); applicationService.dispose(); };
  }, []);
  return null;
}
