// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, afterEach, expect, it } from 'vitest';
import { exampleRecords, fixtureDate } from '@test/fixtures/domain';
import { outlineGraph } from '@test/fixtures/builder';
import { editStep } from '@domain/editor/edits';
import { builderViewSchema } from '@domain/builder/model';
import { mediaAssetSchema, settingsSchema, type Graph } from '@domain/model';
import { NurseFlowDatabase } from './db';
import { createCommands } from './commands';
import { createRepositories } from './repositories';
let db: NurseFlowDatabase; let commands: ReturnType<typeof createCommands>; let repositories: ReturnType<typeof createRepositories>;
beforeEach(async () => {
  db = new NurseFlowDatabase('F07-' + crypto.randomUUID()); await db.open(); commands = createCommands(db); repositories = createRepositories(db);
  const records = exampleRecords(outlineGraph()); await db.groups.bulkAdd(records.groups); await db.revisions.bulkAdd(records.revisions); await db.procedures.bulkAdd(records.procedures);
});
afterEach(async () => { await db.delete(); });
const photo = () => { const blob = new Blob(['raster-fixture'], { type: 'image/png' }); return mediaAssetSchema.parse({ id: crypto.randomUUID(), blob, bytes: blob.size, width: 1, height: 1, sha256: 'a'.repeat(64), mime: blob.type }); };
async function commit(graph: Graph, assets: ReturnType<typeof photo>[] = [], adding = false) {
  const source = await repositories.builder.get('procedure');
  return commands.commitBuilderEdit({ procedureId: source.procedure.id, sourceRevisionId: source.revision.id, expectedEditVersion: source.revision.editVersion, expectedGraph: source.revision.graph,
    graph, label: 'step-media', view: builderViewSchema.parse({}), mediaAssets: assets, ...(adding ? { mediaAdditionFor: 'shared' } : {}) });
}
async function adding() {
  const source = await repositories.builder.get('procedure'); const asset = photo();
  const graph = editStep(source.revision.graph, 'shared', { type: 'add-media', media: { id: crypto.randomUUID(), slot: 'after-note', order: 0, source: { kind: 'local', assetId: asset.id, mime: 'image/png' }, caption: 'Autore' } }, settingsSchema.parse({}), () => crypto.randomUUID());
  return { graph, asset };
}
it('foto: Blob, prima Draft, puntatore e history sono una sola unità; Ready/run non cambiano', async () => {
  const run = await commands.startOrResumeReady('procedure', 'ready'); const ready = await db.revisions.get('ready'); const { graph, asset } = await adding(); await commit(graph, [asset], true);
  const loaded = await repositories.builder.get('procedure'); expect(loaded.history.past).toHaveLength(1); expect(await db.mediaAssets.get(asset.id)).toEqual(asset);
  expect(await db.revisions.get('ready')).toEqual(ready); expect(await db.runSessions.get(run.id)).toEqual(run); expect(loaded.procedure.lastOpenedAt).toBeUndefined();
  await commands.travelBuilderHistory({ procedureId: 'procedure', sourceRevisionId: loaded.revision.id, expectedEditVersion: loaded.revision.editVersion, direction: 'undo' });
  expect((await repositories.builder.get('procedure')).revision.graph).toEqual(ready?.graph); expect(await db.mediaAssets.get(asset.id)).toEqual(asset);
});
it('quota history dopo Blob: rollback di Blob, revisioni e puntatore; Retry stessa identità una volta', async () => {
  const before = await db.revisions.toArray(); const { graph, asset } = await adding(); const failure = () => { throw new DOMException('quota-editor', 'QuotaExceededError'); };
  db.builderStates.hook('creating', failure); await expect(commit(graph, [asset], true)).rejects.toThrow('quota-editor');
  expect(await db.revisions.toArray()).toEqual(before); expect(await db.mediaAssets.count()).toBe(0); expect((await db.procedures.get('procedure'))?.workingDraftId).toBeUndefined();
  db.builderStates.hook('creating').unsubscribe(failure); await commit(graph, [asset], true); expect(await db.mediaAssets.count()).toBe(1); expect((await repositories.builder.get('procedure')).history.past).toHaveLength(1);
});
it('il comando ricontrolla la soft cap attuale anche quando la proposta era stata preparata prima', async () => {
  const first = await adding(); await commit(first.graph, [first.asset], true); const next = await adding();
  await commands.saveMediaPreferences({ photoPreset: 'original', mediaAddSoftLimit: { enabled: true, max: 1 } });
  await expect(commit(next.graph, [next.asset], true)).rejects.toThrow('limit'); expect(await db.mediaAssets.count()).toBe(1);
  const before = await repositories.builder.get('procedure'); await commands.saveMediaPreferences({ photoPreset: 'small', mediaAddSoftLimit: { enabled: false, max: 1 } });
  expect((await repositories.builder.get('procedure')).revision).toEqual(before.revision);
});
it('preferenze media: rollback quota e merge conservano lingua/scala e tutti gli asset esistenti', async () => {
  await commands.saveAppearance({ locale: 'en', theme: 'dark', uiScalePt: 48 }); const before = await db.settings.get('main');
  const { graph, asset } = await adding(); await commit(graph, [asset], true); const revision = (await repositories.builder.get('procedure')).revision;
  const failure = () => { throw new DOMException('quota-settings', 'QuotaExceededError'); }; db.settings.hook('updating', failure);
  const preferences = { photoPreset: 'small' as const, mediaAddSoftLimit: { enabled: true, max: 2 } };
  await expect(commands.saveMediaPreferences(preferences)).rejects.toThrow('quota-settings'); expect(await db.settings.get('main')).toEqual(before);
  db.settings.hook('updating').unsubscribe(failure); const saved = await commands.saveMediaPreferences(preferences);
  expect(saved).toMatchObject({ locale: 'en', theme: 'dark', uiScalePt: 48, ...preferences });
  expect((await repositories.builder.get('procedure')).revision).toEqual(revision); expect(await db.mediaAssets.get(asset.id)).toEqual(asset);
});
it('E13 staging: serializzazione e reimport additivo preservano Blob, due slot, layout, URL e W07', async () => {
  const { graph, asset } = await adding(); const node = graph.nodes.find((node) => node.id === 'shared'); if (!node || !('media' in node)) throw new Error('fixture');
  node.galleries.beforeNote = { layout: 'side-by-side', imageSpace: 'large' };
  node.media.push({ id: 'remote', slot: 'before-note', order: 0, source: { kind: 'remote', httpsUrl: 'https://example.com/card.gif' }, altText: 'GIF autore' },
    { id: 'missing', slot: 'after-note', order: 1, source: { kind: 'local', assetId: 'absent', mime: 'image/png' } });
  const reordered = editStep(graph, 'shared', { type: 'reorder-media', id: node.media[0]!.id, delta: 1 }, settingsSchema.parse({}), () => crypto.randomUUID()); await commit(reordered, [asset]);
  const revisions = await db.revisions.toArray(); const procedures = await db.procedures.toArray(); const groups = await db.groups.toArray();
  const portable = JSON.parse(JSON.stringify({ procedures, groups, revisions, runSessions: [], mediaAssets: [{ ...asset, blob: undefined, data: [...new Uint8Array(await asset.blob.arrayBuffer())] }] }));
  portable.mediaAssets = portable.mediaAssets.map((record: { id: string; mime: string; data: number[] }) => { const { data, ...rest } = record; return { ...rest, blob: new Blob([new Uint8Array(data)], { type: record.mime }) }; });
  const imported = await commands.addImportedRecords([portable], () => ({ validatorSchemaVersion: 1, problems: [], warnings: [] }));
  const copy = await repositories.builder.get(imported.procedureIds[0]!); const copied = copy.revision.graph.nodes.find((node) => node.kind === 'instruction' && node.text === nodeAtText(graph));
  if (!copied || !('media' in copied)) throw new Error('copy'); expect(copied.media).toHaveLength(3); expect(copied.galleries.beforeNote).toEqual(node.galleries.beforeNote);
  const expected = reordered.nodes.find((node) => node.id === 'shared'); if (!expected || !('media' in expected)) throw new Error('reorder');
  const authored = (items: typeof copied.media) => items.map(({ slot, order, caption, altText, source }) => ({ slot, order, caption, altText, source: source.kind === 'local' ? { kind: source.kind, mime: source.mime } : source }));
  expect(authored(copied.media)).toEqual(authored(expected.media)); expect(copied.galleries).toEqual(expected.galleries);
  const local = copied.media.find((item) => item.caption === 'Autore'); if (local?.source.kind !== 'local') throw new Error('asset');
  expect(local.source.assetId).not.toBe(asset.id); expect(await (await db.mediaAssets.get(local.source.assetId))?.blob.text()).toBe('raster-fixture');
  expect(copied.media.find((item) => item.altText === 'GIF autore')?.source).toEqual({ kind: 'remote', httpsUrl: 'https://example.com/card.gif' });
  expect(await db.procedures.get('procedure')).toEqual(procedures[0]); expect(await db.revisions.get('ready')).toEqual(revisions.find((record) => record.id === 'ready'));
  expect(copy.procedure.createdAt).toBe(fixtureDate);
});
function nodeAtText(graph: Graph) { const node = graph.nodes.find((node) => node.id === 'shared'); return node && 'text' in node ? node.text : ''; }
