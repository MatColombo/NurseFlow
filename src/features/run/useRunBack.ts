import { useLayoutEffect, useRef } from 'react';
import { registerPopGuard } from '@shared/navigation/pop-guard';

/** POP mirrors a durable engine Back, including a first-step Exit confirmation. Unload leaves the run saved. */
export function useRunBack(id: string, onBack: () => void) {
  const latest = useRef(onBack); const href = useRef(window.location.href); const state = useRef<unknown>(window.history.state);
  useLayoutEffect(() => { latest.current = onBack; href.current = window.location.href; state.current = window.history.state; });
  useLayoutEffect(() => {
    if (window.history.state?.nurseflowRun !== id) window.history.pushState({ ...window.history.state, nurseflowRun: id }, '', window.location.href);
    state.current = window.history.state;
    return registerPopGuard((event) => {
      // A new address-bar hash has no router state. Like document navigation, it leaves progress saved.
      // The same-URL guard entry guarantees a real Back has a prior router state, including on deep links.
      if (event.state === null) return false;
      window.history.pushState({ ...(state.current as object), nurseflowRun: id }, '', href.current);
      latest.current(); return true;
    });
  }, [id]);
}
