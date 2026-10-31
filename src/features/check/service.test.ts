import { describe, expect, it, vi } from 'vitest';
import { createNurseFlowStorage } from '@storage/index';
import { createCheckService } from './service';
describe('F08 attesa scritture Builder', () => {
  it('non legge o conferma finché la coda durabile non è terminata', async () => {
    const storage = createNurseFlowStorage(); const open = vi.spyOn(storage, 'open').mockResolvedValue(); const read = vi.spyOn(storage.commands, 'checkDraft').mockResolvedValue({ draftId: 'durable' } as never);
    let finish!: () => void; const pending = new Promise<void>((resolve) => { finish = resolve; }); const service = createCheckService(storage, () => pending);
    const checking = service.check('procedure'); await Promise.resolve(); expect(open).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled(); finish(); expect(await checking).toEqual({ draftId: 'durable' }); expect(read).toHaveBeenCalledWith('procedure');
  });
  it('un salvataggio fallito non viene interpretato come Draft valida', async () => {
    const storage = createNurseFlowStorage(); const read = vi.spyOn(storage.commands, 'checkDraft'); const mark = vi.spyOn(storage.commands, 'markCheckedReady');
    const service = createCheckService(storage, () => Promise.reject(new Error('Unsaved change')));
    await expect(service.check('procedure')).rejects.toThrow('Unsaved change'); await expect(service.mark({} as never, true)).rejects.toThrow('Unsaved change'); expect(read).not.toHaveBeenCalled(); expect(mark).not.toHaveBeenCalled();
  });
});
