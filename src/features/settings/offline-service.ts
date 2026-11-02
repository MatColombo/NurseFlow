export type OfflineStatus = 'checking' | 'ready' | 'incomplete' | 'unsupported' | 'error';
export interface OfflineEnvironment {
  supported(): boolean;
  register(): Promise<ServiceWorkerRegistration>;
  controller(): ServiceWorker | null;
}
export function createOfflineService(environment: OfflineEnvironment) {
  let status: OfflineStatus = 'checking'; let registration: Promise<ServiceWorkerRegistration> | undefined;
  const watched = new WeakSet<ServiceWorker>();
  const listeners = new Set<() => void>();
  const emit = (value: OfflineStatus) => { status = value; listeners.forEach((listener) => listener()); };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => status,
    async check() {
      if (!environment.supported()) { emit('unsupported'); return; }
      emit('checking');
      try {
        registration ??= environment.register().catch((error: unknown) => { registration = undefined; throw error; });
        const value = await registration;
        const installing = value.installing;
        if (installing && !watched.has(installing)) {
          watched.add(installing);
          const changed = () => {
            if (installing.state === 'redundant' || installing.state === 'activated') {
              installing.removeEventListener('statechange', changed);
              if (installing.state === 'redundant' && !value.active) { registration = undefined; emit('error'); }
            }
          };
          installing.addEventListener('statechange', changed); changed();
        }
        const controller = environment.controller();
        if (!controller) { emit('incomplete'); return; }
        const complete = await new Promise<boolean>((resolve) => {
          const channel = new MessageChannel();
          const finish = (value: boolean) => { clearTimeout(timer); channel.port1.close(); resolve(value); };
          const timer = setTimeout(() => finish(false), 4000);
          channel.port1.onmessage = (event: MessageEvent<unknown>) => finish(
            typeof event.data === 'object' && event.data !== null && 'complete' in event.data && event.data.complete === true,
          );
          controller.postMessage({ type: 'NF_CACHE_STATUS' }, [channel.port2]);
        });
        emit(complete ? 'ready' : 'incomplete');
      } catch { emit('error'); }
    },
  };
}
export const offlineService = createOfflineService({
  supported: () => import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator,
  register: () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL, updateViaCache: 'none' }),
  controller: () => navigator.serviceWorker?.controller ?? null,
});
