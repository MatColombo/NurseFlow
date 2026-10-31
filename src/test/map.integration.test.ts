// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNurseFlowStorage } from '@storage/index';
import { NurseFlowDatabase } from '@storage/db';
import { exampleRecords } from '@test/fixtures/domain';
import { outlineGraph } from '@test/fixtures/builder';
import { runtimeReady } from '@test/fixtures/runtime';
import { createMapService } from '@features/map/service';
let db: NurseFlowDatabase; let storage: ReturnType<typeof createNurseFlowStorage>; let service: ReturnType<typeof createMapService>;
beforeEach(async () => {
  const name = 'F11-' + crypto.randomUUID(); db = new NurseFlowDatabase(name); await db.open();
  const records = exampleRecords(outlineGraph()); await db.procedures.bulkAdd(records.procedures); await db.revisions.bulkAdd(records.revisions);
  storage = createNurseFlowStorage(name); service = createMapService(storage);
});
afterEach(async () => { storage.close(); await db.delete(); });
async function snapshot() { return { procedures: await db.procedures.toArray(), revisions: await db.revisions.toArray(), runs: await db.runSessions.toArray(), previews: await db.previewSessions.toArray(), view: await db.uiPreferences.toArray() }; }
describe('F11 consistent read-only map repository/service', () => {
  it('Details picks Ready over Draft; explicit Draft and incomplete new Draft never start a session or update recents', async () => {
    const draft = await storage.commands.createDraft({ procedureId: 'procedure' }); const before = await snapshot();
    expect((await service.read({ procedureId: 'procedure' })).revision.id).toBe('ready');
    expect((await service.read({ procedureId: 'procedure', revisionId: draft.draft.id })).revision).toEqual(draft.draft);
    expect(await snapshot()).toEqual(before);
    const created = await storage.commands.createDraft({ metadata: { title: 'Bozza vuota' } }); const next = await snapshot();
    expect((await service.read({ procedureId: created.procedure.id })).revision.graph.nodes).toHaveLength(1); expect(await snapshot()).toEqual(next);
  });
  it('run map uses old pinned Ready after publication and reload, with zero writes even when write hooks reject', async () => {
    const run = await storage.commands.startOrResumeReady('procedure', 'ready');
    await db.revisions.add({ ...runtimeReady(), id: 'new-ready', revisionNumber: 2 }); await db.procedures.update('procedure', { readyRevisionId: 'new-ready' });
    const before = await snapshot(); const reject = () => { throw new Error('Map must not write'); };
    db.runSessions.hook('updating', reject); db.procedures.hook('updating', reject); db.revisions.hook('updating', reject);
    for (let i = 0; i < 2; i++) {
      const result = await service.read({ procedureId: 'procedure', revisionId: 'ready', runId: run.id });
      expect(result.run).toEqual(run); expect(result.revision.id).toBe('ready'); expect(result.returnPath).toBe(`/run/${run.id}`); storage.close();
    }
    expect(await snapshot()).toEqual(before);
  });
  it('Draft Preview uses saved snapshot after working Draft changes; reading does not create a missing preview', async () => {
    const created = await storage.commands.createDraft({ procedureId: 'procedure' }); await storage.commands.startDraftPreview('procedure', created.draft.id);
    const preview = await storage.repositories.preview.get(created.draft.id);
    const graph = outlineGraph(); const node = graph.nodes.find((node) => node.kind === 'decision')!; if (node.kind === 'decision') node.question = 'Domanda modificata dopo preview';
    await storage.commands.updateDraft({ procedureId: 'procedure', draftId: created.draft.id, expectedEditVersion: created.draft.editVersion, graph });
    const before = await snapshot(); const result = await service.read({ procedureId: 'procedure', revisionId: created.draft.id, previewId: preview.run.id });
    expect(result.revision).toEqual(preview.revision); expect(result.preview).toBe(true); expect(result.returnPath).toContain('preview=draft'); expect(await snapshot()).toEqual(before);
    await expect(service.read({ procedureId: 'procedure', revisionId: 'missing', previewId: 'missing' })).rejects.toThrow(); expect(await snapshot()).toEqual(before);
  });
  it('rejects wrong procedure/revision and ambiguous contexts without silently substituting current content', async () => {
    const run = await storage.commands.startOrResumeReady('procedure', 'ready'); const before = await snapshot();
    for (const request of [
      { procedureId: 'other', revisionId: 'ready' }, { procedureId: 'procedure', revisionId: 'missing' },
      { procedureId: 'other', revisionId: 'ready', runId: run.id }, { procedureId: 'procedure', revisionId: 'other', runId: run.id },
      { procedureId: 'procedure', runId: run.id }, { procedureId: 'procedure', runId: run.id, previewId: 'preview' },
    ]) await expect(service.read(request)).rejects.toThrow();
    expect(await snapshot()).toEqual(before);
  });
  it('duplicate canonical identities fail safely instead of displaying a substituted or duplicated node', async () => {
    const { draft } = await storage.commands.createDraft({ procedureId: 'procedure' }); draft.graph.nodes.push(structuredClone(draft.graph.nodes[0]!));
    await db.revisions.put(draft); const before = await snapshot();
    await expect(service.read({ procedureId: 'procedure', revisionId: draft.id })).rejects.toThrow('Duplicate identities');
    expect(await snapshot()).toEqual(before);
  });
});
