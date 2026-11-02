import { describe, expect, it, vi } from 'vitest';
import { createApplicationService, type ApplicationEnvironment, type InstallPrompt, type UpdateRegistration } from './application-service';
function setup() {
  const worker = { postMessage: vi.fn() }; const registration = Object.assign(new EventTarget(), { waiting: worker, installing: null, active: {}, update: vi.fn(async () => {}) }) satisfies UpdateRegistration;
  const environment: ApplicationEnvironment = { online: () => true, registration: async () => registration, hasSessions: async () => false, pending: () => 0, flush: async () => {}, reload: vi.fn(), standalone: () => false };
  const service = createApplicationService(environment); service.setPath('/settings'); return { service, environment, registration, worker };
}
describe('F12 actual update capability and idle activation', () => {
  it('offline never checks the network; missing registration never claims current', async () => {
    const { service, environment } = setup(); environment.online = () => false; const read = vi.fn(environment.registration); environment.registration = read;
    await service.check(); expect(service.getSnapshot().update).toBe('offline'); expect(read).not.toHaveBeenCalled();
    environment.online = () => true; environment.registration = async () => undefined;
    await service.check(); expect(service.getSnapshot().update).toBe('unsupported'); expect(environment.reload).not.toHaveBeenCalled();
  });
  it('checking alone, Later, and unsolicited controllerchange never reload', async () => {
    const { service, environment, worker } = setup(); await service.check(); expect(service.getSnapshot().update).toBe('available');
    await service.controllerChanged(); service.later(); expect(environment.reload).not.toHaveBeenCalled(); expect(worker.postMessage).not.toHaveBeenCalled();
  });
  it.each(['/run/id', '/run/id/end', '/build/id', '/build/id/step/node'])('never activates or reloads while %s is open', async (path) => {
    const { service, worker, environment } = setup(); await service.check(); service.setPath(path); service.defer(); await service.whenIdle(); await service.controllerChanged();
    expect(worker.postMessage).not.toHaveBeenCalled(); expect(environment.reload).not.toHaveBeenCalled();
  });
  it('saved sessions and pending writes defer; actual controller change rechecks idle before reload', async () => {
    const { service, worker, environment } = setup(); let sessions = true; environment.hasSessions = async () => sessions;
    await service.check(); service.defer(); await service.whenIdle(); expect(worker.postMessage).not.toHaveBeenCalled();
    sessions = false; environment.pending = () => 1; await service.whenIdle(); expect(worker.postMessage).not.toHaveBeenCalled();
    environment.pending = () => 0; await service.whenIdle(); expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    await service.whenIdle(); expect(environment.reload).not.toHaveBeenCalled();
    sessions = true; await service.controllerChanged(); expect(environment.reload).not.toHaveBeenCalled();
    sessions = false; await service.whenIdle(); expect(environment.reload).toHaveBeenCalledTimes(1);
  });
  it('a write failure or DB read failure cannot force a reload', async () => {
    const { service, worker, environment } = setup(); environment.hasSessions = async () => { throw new Error('DB'); };
    await service.check(); service.defer(); await service.whenIdle(); expect(worker.postMessage).not.toHaveBeenCalled(); expect(environment.reload).not.toHaveBeenCalled();
  });
  it('only a successful real registration update can report no waiting update; failure remains explicit', async () => {
    const { service, registration } = setup(); Object.assign(registration, { waiting: null }); await service.check(); expect(service.getSnapshot().update).toBe('current');
    registration.update.mockRejectedValueOnce(new Error('network')); await service.check(); expect(service.getSnapshot().update).toBe('error');
  });
  it('installation is offered only with a prompt and is hidden when standalone; dismissal is not success', async () => {
    const { service, environment } = setup(); const prompt = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: 'dismissed' as const }) }) satisfies InstallPrompt;
    expect(service.getSnapshot().installAvailable).toBe(false); service.offerInstall(prompt); expect(prompt.defaultPrevented).toBe(true);
    await service.install(); expect(service.getSnapshot()).toMatchObject({ installAvailable: false, installResult: 'dismissed' });
    environment.standalone = () => true; service.offerInstall(prompt); expect(service.getSnapshot().installAvailable).toBe(false);
  });
});
