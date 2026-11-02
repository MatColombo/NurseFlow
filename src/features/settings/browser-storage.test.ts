import { expect, it, vi } from 'vitest';
import { readStorageInfo, requestStorageProtection } from './browser-storage';
it('actual grant/denial, unsupported and unavailable estimates stay distinct', async () => {
  expect(await readStorageInfo({} as StorageManager)).toEqual({ protection: 'unsupported', canRequest: false, estimate: null });
  const storage = { persisted: async () => false, persist: vi.fn(async () => true), estimate: async () => ({ usage: 42, quota: 100 }) } as unknown as StorageManager;
  expect(await readStorageInfo(storage)).toMatchObject({ protection: 'denied', canRequest: true, estimate: { usage: 42, quota: 100 } });
  expect(await requestStorageProtection(storage)).toMatchObject({ protection: 'granted', canRequest: false });
  storage.persist = async () => false; expect((await requestStorageProtection(storage)).protection).toBe('denied');
  storage.persisted = async () => { throw new Error('unavailable'); }; storage.estimate = async () => ({ usage: NaN });
  expect(await readStorageInfo(storage)).toMatchObject({ protection: 'error', estimate: null });
});
