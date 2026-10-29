// @vitest-environment node
import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { expect, it } from 'vitest';
import { createNurseFlowStorage } from '@storage/index';
import { createAppearanceService } from './appearance-service';

it('il servizio espone solo preferenze di appearance e le risalva senza campi estranei', async () => {
  const name = `NurseFlow-F02-service-${crypto.randomUUID()}`;
  const storage = createNurseFlowStorage(name);
  const service = createAppearanceService(storage);
  try {
    const loaded = await service.load();
    expect(loaded).toEqual({ locale: 'it', theme: 'system', uiScalePt: 13 });
    expect(await service.save({ ...loaded, uiScalePt: 48 })).toEqual({ ...loaded, uiScalePt: 48 });
    expect(await storage.repositories.settings.get()).toMatchObject({ photoPreset: 'medium', uiScalePt: 48 });
  } finally { storage.close(); await Dexie.delete(name); }
});
