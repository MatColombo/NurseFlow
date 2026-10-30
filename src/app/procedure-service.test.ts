// @vitest-environment node
import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { Dexie } from 'dexie';
import { createNurseFlowStorage } from '@storage/index';
import { metadataOf } from '@domain/procedures';
import { createProcedureService } from '@features/procedures/service';

it('nuova procedura salva solo Start + Draft, titolo duplicato ammesso e reload', async () => {
  const name = `F04-service-${crypto.randomUUID()}`; const storage = createNurseFlowStorage(name); const service = createProcedureService(storage);
  try {
    const first = await service.create({ ...metadataOf(), title: '  Esempio neutro  ' });
    const second = await service.create({ ...metadataOf(), title: 'Esempio neutro' });
    expect(first.procedure.id).not.toBe(second.procedure.id); expect(first.procedure.readyRevisionId).toBeUndefined();
    expect(first.draft.graph.nodes).toEqual([{ id: expect.any(String), kind: 'start', next: { kind: 'unassigned' } }]);
    storage.close(); await storage.open(); expect((await storage.repositories.procedures.get(first.procedure.id))?.title).toBe('Esempio neutro');
    await expect(service.create({ ...metadataOf(), title: 'a'.repeat(121) })).rejects.toThrow('120');
  } finally { storage.close(); await Dexie.delete(name); }
});
