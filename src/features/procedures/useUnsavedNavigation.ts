import { useLayoutEffect, useRef, useState } from 'react';
import { registerPopGuard } from '@shared/navigation/pop-guard';

/** Scoped guard for HashRouter forms. Restore a POP before asking, retaining the mounted form. */
export function useUnsavedNavigation(dirty: boolean, options?: { onBack?(): void; beforeUnloadDirty?: boolean }) {
  const currentDirty = useRef(dirty);
  const onBack = useRef(options?.onBack); const unloadingDirty = useRef(options?.beforeUnloadDirty ?? dirty);
  useLayoutEffect(() => { currentDirty.current = dirty; onBack.current = options?.onBack;
    unloadingDirty.current = options?.beforeUnloadDirty ?? dirty;
  }, [dirty, options?.onBack, options?.beforeUnloadDirty]);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const action = useRef<(() => void) | null>(null); const allowPop = useRef(false);
  function requestLeave(next: () => void) { if (currentDirty.current) setPending(() => next); else next(); }
  useLayoutEffect(() => {
    const originIndex = typeof window.history.state?.idx === 'number' ? window.history.state.idx as number : 0;
    if (typeof window.history.state?.idx !== 'number') window.history.replaceState({ ...window.history.state, idx: originIndex }, '');
    let restoring = false;
    const beforeUnload = (event: BeforeUnloadEvent) => { if (unloadingDirty.current) { event.preventDefault(); event.returnValue = ''; } };
    const pop = (event: PopStateEvent) => {
      if (allowPop.current || !currentDirty.current) return false;
      if (restoring) { restoring = false;
        if (onBack.current) onBack.current(); else setPending(() => action.current); return true;
      }
      // Native hash entries can predate HashRouter and have null state. Back is still protected.
      const destination = typeof event.state?.idx === 'number' ? event.state.idx as number : originIndex - 1;
      if (typeof event.state?.idx !== 'number') window.history.replaceState({ ...window.history.state, idx: destination }, '');
      if (originIndex === destination) return false;
      const delta = originIndex - destination; restoring = true;
      action.current = () => { allowPop.current = true; window.history.go(-delta); };
      window.history.go(delta);
      return true;
    };
    window.addEventListener('beforeunload', beforeUnload); const unregister = registerPopGuard(pop);
    return () => { window.removeEventListener('beforeunload', beforeUnload); unregister(); };
  }, []);
  return { pending: pending !== null, requestLeave, cancel: () => setPending(null), confirm: () => {
    const next = pending; setPending(null); currentDirty.current = false; next?.();
  } };
}
