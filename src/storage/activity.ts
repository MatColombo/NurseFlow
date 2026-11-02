let pending = 0;
const listeners = new Set<() => void>();
export const pendingOperations = () => pending;
export function subscribeOperations(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function notify() { listeners.forEach((listener) => listener()); }
/** Track the whole command promise, including preparation before its transaction starts. */
export function trackCommands<T extends object>(commands: T): T {
  return new Proxy(commands, { get(target, key, receiver) {
    const value: unknown = Reflect.get(target, key, receiver); if (typeof value !== 'function') return value;
    return (...args: unknown[]) => {
      pending++; notify();
      const finish = () => { pending--; notify(); };
      try { return Promise.resolve(Reflect.apply(value, target, args)).finally(finish); }
      catch (error) { finish(); throw error; }
    };
  } });
}
