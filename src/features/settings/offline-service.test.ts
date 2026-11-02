import { describe, expect, it, vi } from 'vitest';
import { createOfflineService, type OfflineEnvironment } from './offline-service';

describe('F15 truthful offline capability', () => {
  it('cannot claim ready in an unsupported environment or before a controller exists', async () => {
    const register = vi.fn(async () => ({} as ServiceWorkerRegistration));
    const environment: OfflineEnvironment = { supported: () => false, register, controller: () => null };
    const service = createOfflineService(environment); await service.check();
    expect(service.getSnapshot()).toBe('unsupported'); expect(register).not.toHaveBeenCalled();
    environment.supported = () => true; await service.check(); expect(service.getSnapshot()).toBe('incomplete');
  });
  it('a failed registration can be retried without claiming offline success', async () => {
    const register = vi.fn<OfflineEnvironment['register']>().mockRejectedValueOnce(new DOMException('quota', 'QuotaExceededError')).mockResolvedValue({} as ServiceWorkerRegistration);
    const service = createOfflineService({ supported: () => true, register, controller: () => null });
    await service.check(); expect(service.getSnapshot()).toBe('error');
    await service.check(); expect(service.getSnapshot()).toBe('incomplete'); expect(register).toHaveBeenCalledTimes(2);
  });
  it('an install that becomes redundant reports failure and allows a fresh registration', async () => {
    const worker = Object.assign(new EventTarget(), { state: 'installing' });
    const register = vi.fn(async () => ({ installing: worker, active: null } as unknown as ServiceWorkerRegistration));
    const service = createOfflineService({ supported: () => true, register, controller: () => null });
    await service.check(); worker.state = 'redundant'; worker.dispatchEvent(new Event('statechange'));
    expect(service.getSnapshot()).toBe('error'); await service.check(); expect(register).toHaveBeenCalledTimes(2);
  });
});
