import { pendingOperations } from '@storage/activity';
import { settingsService } from './service';
export type UpdateStatus = 'idle' | 'checking' | 'offline' | 'unsupported' | 'current' | 'available' | 'deferred' | 'applying' | 'error';
interface UpdateWorker { postMessage(message: { type: string }): void }
export interface UpdateRegistration extends EventTarget { waiting: UpdateWorker | null; installing: (EventTarget & { state: string }) | null; active: unknown; update(): Promise<unknown> }
export interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
export interface ApplicationEnvironment {
  online(): boolean; registration(): Promise<UpdateRegistration | undefined>; hasSessions(): Promise<boolean>;
  pending(): number; flush(): Promise<void>; reload(): void; standalone(): boolean;
}
export function createApplicationService(environment: ApplicationEnvironment) {
  let snapshot = { update: 'idle' as UpdateStatus, online: environment.online(), installAvailable: false, installResult: 'idle' as 'idle' | 'accepted' | 'dismissed' | 'error' };
  const listeners = new Set<() => void>(); let registration: UpdateRegistration | undefined; let prompt: InstallPrompt | null = null;
  let path = ''; let queued = false; let activating = false; let controllerReady = false; let idlePromise: Promise<void> | null = null; let generation = 0; let releaseRegistration = () => {};
  function emit(patch: Partial<typeof snapshot>) {
    if (Object.entries(patch).every(([key, value]) => snapshot[key as keyof typeof snapshot] === value)) return;
    snapshot = { ...snapshot, ...patch }; listeners.forEach((listener) => listener());
  }
  async function idle() {
    const protectedPath = () => path === '/new' || /^\/(run|build|data)\//.test(path);
    if (protectedPath() || environment.pending()) return false;
    await environment.flush();
    const sessions = await environment.hasSessions();
    return !sessions && !environment.pending() && !protectedPath();
  }
  function whenIdle(): Promise<void> {
    if (!queued) return Promise.resolve(); if (idlePromise) return idlePromise;
    idlePromise = (async () => { try {
      if (!await idle() || !queued) { if (queued) emit({ update: 'deferred' }); return; }
      if (activating) { if (controllerReady) { queued = false; environment.reload(); } return; }
      if (!registration?.waiting) return;
      activating = true; emit({ update: 'applying' }); registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch { emit({ update: 'error' }); } })().finally(() => { idlePromise = null; });
    return idlePromise;
  }
  function refresh() {
    emit({ update: registration?.waiting ? queued ? 'deferred' : 'available' : registration?.installing ? 'checking' : registration?.active ? 'current' : 'unsupported' });
    if (queued) void whenIdle();
  }
  function watch(value: UpdateRegistration) {
    releaseRegistration(); let worker: EventTarget | null = null;
    const changed = () => {
      const failed = worker && 'state' in worker && worker.state === 'redundant';
      worker?.removeEventListener('statechange', changed); worker = value.installing; worker?.addEventListener('statechange', changed);
      if (failed) emit({ update: 'error' }); else refresh();
    };
    value.addEventListener('updatefound', changed); changed();
    releaseRegistration = () => { value.removeEventListener('updatefound', changed); worker?.removeEventListener('statechange', changed); };
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async check() {
      const request = ++generation; emit({ online: environment.online() });
      if (!environment.online()) { emit({ update: 'offline' }); return; }
      emit({ update: 'checking' });
      try {
        const value = await environment.registration(); if (request !== generation) return;
        registration = value; if (!value) { emit({ update: 'unsupported' }); return; }
        watch(value); emit({ update: 'checking' }); await value.update(); if (request === generation) refresh();
      } catch { if (request === generation) emit({ update: 'error' }); }
    },
    defer() { if (!registration?.waiting) return; queued = true; emit({ update: 'deferred' }); void whenIdle(); },
    later() { queued = false; if (registration?.waiting) emit({ update: 'available' }); },
    setPath(value: string) { path = value; void whenIdle(); },
    whenIdle,
    isIdle: idle,
    updateBlocked() { activating = false; controllerReady = false; if (queued) emit({ update: 'deferred' }); },
    async controllerChanged() {
      // A worker changing controller never authorizes a reload by itself.
      if (!queued || !activating) return;
      controllerReady = true;
      try { if (await idle() && queued) { queued = false; environment.reload(); } else emit({ update: 'deferred' }); }
      catch { emit({ update: 'error' }); }
    },
    networkChanged() { emit({ online: environment.online() }); },
    offerInstall(event: InstallPrompt) { if (environment.standalone()) return; event.preventDefault(); prompt = event; emit({ installAvailable: true, installResult: 'idle' }); },
    installed() { prompt = null; emit({ installAvailable: false }); },
    async install() {
      const current = prompt; if (!current || environment.standalone()) return; prompt = null; emit({ installAvailable: false });
      try { await current.prompt(); emit({ installResult: (await current.userChoice).outcome }); } catch { emit({ installResult: 'error' }); }
    },
    dispose() { releaseRegistration(); },
  };
}
let flushAppearance: () => Promise<void> = async () => {};
export function setAppearanceBarrier(flush: () => Promise<void>) { flushAppearance = flush; }
export const applicationService = createApplicationService({
  online: () => navigator.onLine,
  async registration() {
    if (!navigator.serviceWorker?.getRegistration) return;
    const scope = new URL(import.meta.env.BASE_URL, window.location.href).href;
    const registration = await navigator.serviceWorker.getRegistration(scope);
    return registration?.scope === scope ? registration : undefined;
  },
  hasSessions: () => settingsService.hasSessions(),
  pending: pendingOperations,
  flush: () => flushAppearance(),
  reload: () => window.location.reload(),
  standalone: () => window.matchMedia?.('(display-mode: standalone)').matches === true || ('standalone' in navigator && navigator.standalone === true),
});
