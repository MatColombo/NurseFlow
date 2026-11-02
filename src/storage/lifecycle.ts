export type StorageLifecycle = 'ready' | 'blocked' | 'changed';
let snapshot: StorageLifecycle = 'ready';
const listeners = new Set<() => void>();
export const storageLifecycle = {
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  report(value: StorageLifecycle) { snapshot = value; listeners.forEach((listener) => listener()); },
};
