export type Protection = 'granted' | 'denied' | 'unsupported' | 'error';
export interface StorageInfo { protection: Protection; canRequest: boolean; estimate: { usage: number; quota?: number } | null }
export async function readStorageInfo(storage?: StorageManager): Promise<StorageInfo> {
  if (!storage) try { storage = navigator.storage; } catch { return { protection: 'error', canRequest: false, estimate: null }; }
  let protection: Protection = 'unsupported'; let estimate: StorageInfo['estimate'] = null;
  if (typeof storage?.persisted === 'function') { try { protection = await storage.persisted() ? 'granted' : 'denied'; } catch { protection = 'error'; } }
  if (typeof storage?.estimate === 'function') try {
    const value = await storage.estimate();
    if (typeof value.usage === 'number' && Number.isFinite(value.usage) && value.usage >= 0) estimate = { usage: value.usage,
      ...(typeof value.quota === 'number' && Number.isFinite(value.quota) && value.quota >= 0 ? { quota: value.quota } : {}) };
  } catch { /* Estimate is optional and independent of protection. */ }
  return { protection, canRequest: typeof storage?.persist === 'function' && protection !== 'granted', estimate };
}
export async function requestStorageProtection(storage?: StorageManager): Promise<StorageInfo> {
  if (!storage) try { storage = navigator.storage; } catch { return { protection: 'error', canRequest: false, estimate: null }; }
  if (typeof storage?.persist !== 'function') return readStorageInfo(storage);
  try {
    const granted = await storage.persist(); const info = await readStorageInfo(storage);
    return { ...info, protection: granted ? 'granted' : 'denied', canRequest: !granted };
  } catch { return { ...await readStorageInfo(storage), protection: 'error', canRequest: true }; }
}
