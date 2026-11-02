import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppearance } from '@app/appearance-context';
import { pendingOperations, subscribeOperations } from '@storage/activity';
import { builderService } from '@features/builder/service';
import { settingsService } from './service';
import { applicationService, setAppearanceBarrier, type InstallPrompt } from './application-service';
import { offlineService } from './offline-service';
/** Registration never authorizes activation or reload of a waiting update. */
export function ApplicationGate() {
  const { pathname } = useLocation(); const { flush } = useAppearance();
  const pending = useSyncExternalStore(subscribeOperations, pendingOperations);
  useEffect(() => { setAppearanceBarrier(async () => { await flush(); await builderService.flush(); }); }, [flush]);
  useEffect(() => { applicationService.setPath(pathname); }, [pathname]);
  useEffect(() => { if (!pending) void applicationService.whenIdle(); }, [pending]);
  useEffect(() => {
    const install = (event: Event) => { if ('prompt' in event && typeof event.prompt === 'function') applicationService.offerInstall(event as InstallPrompt); };
    const installed = () => applicationService.installed(); const changed = () => { void applicationService.controllerChanged(); void offlineService.check(); };
    const network = () => { applicationService.networkChanged(); void offlineService.check(); };
    const message = (event: MessageEvent<unknown>) => {
      if (typeof event.data !== 'object' || !event.data || !('type' in event.data)) return;
      if (event.data.type === 'NF_IDLE_REQUEST') void applicationService.isIdle().then((safe) => event.ports[0]?.postMessage(safe), () => event.ports[0]?.postMessage(false));
      if (event.data.type === 'NF_UPDATE_BLOCKED') applicationService.updateBlocked();
    };
    const idle = () => { void applicationService.whenIdle(); };
    const timer = window.setInterval(idle, 5000);
    void offlineService.check();
    window.addEventListener('beforeinstallprompt', install); window.addEventListener('appinstalled', installed);
    window.addEventListener('online', network); window.addEventListener('offline', network);
    navigator.serviceWorker?.addEventListener('controllerchange', changed);
    navigator.serviceWorker?.addEventListener('message', message);
    window.addEventListener('focus', idle);
    const stop = settingsService.watchSessions(() => { void applicationService.whenIdle(); });
    return () => { window.removeEventListener('beforeinstallprompt', install); window.removeEventListener('appinstalled', installed);
      window.removeEventListener('online', network); window.removeEventListener('offline', network);
      navigator.serviceWorker?.removeEventListener('controllerchange', changed); navigator.serviceWorker?.removeEventListener('message', message);
      window.removeEventListener('focus', idle); window.clearInterval(timer); stop(); applicationService.dispose(); };
  }, []);
  return null;
}
