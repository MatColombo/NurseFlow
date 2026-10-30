type Guard = (event: PopStateEvent) => boolean;
const guards: Guard[] = [];
const installed = new WeakSet<Window>();

/** Install before HashRouter subscribes, so consumed POPs cannot unmount a dirty form first. */
export function installPopGuard(target: Window) {
  if (installed.has(target)) return; installed.add(target);
  target.addEventListener('popstate', (event) => {
    for (const guard of [...guards].reverse()) if (guard(event)) { event.stopImmediatePropagation(); return; }
  });
}
export function registerPopGuard(guard: Guard) {
  guards.push(guard);
  return () => { const index = guards.indexOf(guard); if (index >= 0) guards.splice(index, 1); };
}
