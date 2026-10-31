import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands } from '../../src/storage/commands';
import { createRepositories } from '../../src/storage/repositories';
import { exampleRecords } from '../../src/test/fixtures/domain';
import { activitiesGraph, outlineGraph, outcomesGraph } from '../../src/test/fixtures/builder';
import type { Graph } from '../../src/domain/model';
export async function seedBuilder() {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const commands = createCommands(db); await commands.completeFirstLaunch();
    const graphs: [string, Graph, boolean][] = [['procedure', outlineGraph(), true], ['ready-only', outlineGraph(), false],
      ['multi', activitiesGraph(), true], ['many', activitiesGraph(32), true]];
    await db.groups.bulkAdd(exampleRecords().groups);
    for (const [id, graph, working] of graphs) {
      const records = exampleRecords(graph); const procedure = records.procedures[0]!; const ready = records.revisions[0]!;
      procedure.id = id; procedure.title = 'Esempio ' + id; procedure.readyRevisionId = id + '-ready';
      ready.procedureId = id; ready.id = procedure.readyRevisionId;
      await db.revisions.add(ready); await db.procedures.add(procedure);
      if (working) await commands.createDraft({ procedureId: id });
    }
    const decisionDraft = await commands.createDraft({ metadata: { title: '32 esiti fittizi' }, graph: outcomesGraph() });
    const blank = await commands.createDraft({ metadata: { title: 'Vuota' } }); return { blankId: blank.procedure.id, decisionsId: decisionDraft.procedure.id };
  } finally { db.close(); }
}
export async function readBuilder(id: string) {
  const db = new NurseFlowDatabase(); await db.open();
  try { const loaded = await createRepositories(db).builder.get(id);
    return { ...loaded, ready: loaded.procedure.readyRevisionId ? await db.revisions.get(loaded.procedure.readyRevisionId) : undefined,
      runs: await db.runSessions.where('procedureId').equals(id).toArray(), version: db.verno };
  } finally { db.close(); }
}
export async function readEditor(id = 'procedure') {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const loaded = await createRepositories(db).builder.get(id); const assets = await db.mediaAssets.toArray();
    return { ...loaded, settings: await db.settings.get('main'), assets: await Promise.all(assets.map(async ({ blob, ...asset }) => ({ ...asset,
      data: [...new Uint8Array(await blob.arrayBuffer())], actualSha: [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map((value) => value.toString(16).padStart(2, '0')).join('') }))) };
  } finally { db.close(); }
}
/** Test-only wire round-trip. Archive formats/UI and full E13 release gate remain F13/F14. */
export async function roundTripEditor(id = 'procedure') {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const procedure = (await db.procedures.get(id))!; const revisions = await db.revisions.where('procedureId').equals(id).toArray();
    const groups = procedure.groupId ? [(await db.groups.get(procedure.groupId))!] : [];
    const assets = await db.mediaAssets.toArray(); const wire = JSON.parse(JSON.stringify({ procedures: [procedure], revisions, groups, runSessions: [],
      mediaAssets: await Promise.all(assets.map(async ({ blob, ...asset }) => ({ ...asset, data: [...new Uint8Array(await blob.arrayBuffer())] }))) }));
    wire.mediaAssets = wire.mediaAssets.map(({ data, ...asset }: { data: number[]; mime: string }) => ({ ...asset, blob: new Blob([new Uint8Array(data)], { type: asset.mime }) }));
    // The artificial Ready fixture is already known by this test; no production validator is installed.
    return await createCommands(db).addImportedRecords([wire], () => ({ validatorSchemaVersion: 1, problems: [], warnings: [] }));
  } finally { db.close(); }
}
export async function addMissingPhoto() {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const source = await createRepositories(db).builder.get('procedure'); const graph = structuredClone(source.revision.graph); const node = graph.nodes.find((node) => node.id === 'shared');
    if (!node || !('media' in node)) throw new Error('fixture');
    node.media.push({ id: 'missing-photo', slot: 'after-note', order: 0, source: { kind: 'local', assetId: 'missing-blob', mime: 'image/png' } });
    await createCommands(db).updateDraft({ procedureId: 'procedure', draftId: source.revision.id, expectedEditVersion: source.revision.editVersion, graph });
  } finally { db.close(); }
}
