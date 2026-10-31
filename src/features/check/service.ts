import { createNurseFlowStorage } from '@storage/index';
import { builderService } from '@features/builder/service';
export type { CheckedDraft } from '@storage/commands';
export function createCheckService(storage = createNurseFlowStorage(), flush = () => builderService.flush()) {
  return {
    watch(id: string, changed: () => void, failed: () => void) { return storage.repositories.check.subscribe(id, changed, failed); },
    async check(id: string) { await flush(); await storage.open(); return storage.commands.checkDraft(id); },
    async mark(checked: Parameters<typeof storage.commands.markCheckedReady>[0], confirmed: boolean) {
      await flush(); await storage.open(); return storage.commands.markCheckedReady(checked, confirmed);
    },
  };
}
export const checkService = createCheckService();
