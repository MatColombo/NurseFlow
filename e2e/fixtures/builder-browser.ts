import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands } from '../../src/storage/commands';
import { createRepositories } from '../../src/storage/repositories';
import { exampleRecords } from '../../src/test/fixtures/domain';
import { activitiesGraph, outlineGraph, outcomesGraph } from '../../src/test/fixtures/builder';
import type { Graph } from '../../src/domain/model';
import { exampleRun } from '../../src/test/fixtures/domain';
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

export async function configureCheck(mode: 'two' | 'content' | 'warnings' | 'invalid-url' | 'valid' = 'valid') {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const source = await createRepositories(db).builder.get('procedure'); let graph = structuredClone(outlineGraph());
    graph.phases = []; for (const node of graph.nodes) if ('phaseId' in node) node.phaseId = null;
    if (mode === 'two') {
      graph = activitiesGraph(2); const fork = graph.nodes.find((node) => node.kind === 'multitask')!;
      if (fork.kind === 'multitask') fork.activities[0]!.first = { kind: 'unassigned' };
      graph.nodes = graph.nodes.filter((node) => node.id !== 'task-1');
      const choice = outlineGraph().nodes.find((node) => node.kind === 'decision')!;
      if (choice.kind === 'decision') { choice.phaseId = null; choice.outcomes[0]!.label = 'Yes'; choice.outcomes[0]!.destination = { kind: 'node', nodeId: 'tasks' }; choice.outcomes[1]!.label = 'No'; choice.outcomes[1]!.destination = { kind: 'unassigned' }; }
      const start = graph.nodes.find((node) => node.kind === 'start')!; if (start.kind === 'start') start.next = { kind: 'node', nodeId: 'decision' }; graph.nodes.push(choice);
    }
    if (mode === 'content') { const choice = graph.nodes.find((node) => node.kind === 'decision'); if (choice?.kind === 'decision') choice.question = ''; }
    if (mode === 'warnings' || mode === 'invalid-url') {
      const step = graph.nodes.find((node) => node.id === 'shared'); if (step?.kind === 'instruction') {
        step.media = [{ id: 'gif', order: 0, slot: 'before-note', altText: 'Cartoncino remoto', source: { kind: 'remote', httpsUrl: mode === 'invalid-url' ? 'javascript:alert(1)' : 'https://example.com/missing.gif' } }, { id: 'missing', order: 1, altText: 'Cartoncino locale', slot: 'after-note', source: { kind: 'local', assetId: 'missing-asset', mime: 'image/png' } }];
        if (mode === 'warnings') { step.next = { kind: 'broken', formerNodeId: 'deleted-end', formerTitle: 'Vecchia conclusione' }; graph.nodes = graph.nodes.filter((node) => node.kind !== 'end'); }
      }
    }
    if (mode === 'invalid-url') await db.revisions.update(source.revision.id, { graph, editVersion: source.revision.editVersion + 1 });
    else await createCommands(db).updateDraft({ procedureId: 'procedure', draftId: source.revision.id, expectedEditVersion: source.revision.editVersion, graph });
    return source.procedure.id;
  } finally { db.close(); }
}
export async function checkState() {
  const db = new NurseFlowDatabase(); await db.open();
  try { return { procedure: await db.procedures.get('procedure'), revisions: await db.revisions.where('procedureId').equals('procedure').toArray(), runs: await db.runSessions.toArray(), history: await db.builderStates.get('procedure') }; } finally { db.close(); }
}
export async function changeCheckedQuestion(question: string) {
  const db = new NurseFlowDatabase(); await db.open();
  try { const source = await createRepositories(db).builder.get('procedure'); const graph = structuredClone(source.revision.graph); const node = graph.nodes.find((node) => node.kind === 'decision'); if (node?.kind === 'decision') node.question = question; await createCommands(db).updateDraft({ procedureId: 'procedure', draftId: source.revision.id, expectedEditVersion: source.revision.editVersion, graph }); } finally { db.close(); }
}
export async function pinCheckRun() {
  const db = new NurseFlowDatabase(); await db.open();
  try { const procedure = (await db.procedures.get('procedure'))!; await createCommands(db).saveRun(exampleRun(procedure.id, procedure.readyRevisionId!), null); } finally { db.close(); }
}
export async function addCheckBlob(bytes: number[], corruptHash = false) {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const source = await createRepositories(db).builder.get('procedure'); const graph = structuredClone(source.revision.graph); const node = graph.nodes.find((node) => node.id === 'shared');
    const assetId = crypto.randomUUID(); const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' }); const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map((value) => value.toString(16).padStart(2, '0')).join('');
    if (node && 'media' in node) node.media = [{ id: 'local-blob', order: 0, altText: 'Cartoncino', slot: 'after-note', source: { kind: 'local', assetId, mime: 'image/png' } }];
    await createCommands(db).updateDraft({ procedureId: 'procedure', draftId: source.revision.id, expectedEditVersion: source.revision.editVersion, graph, mediaAssets: [{ id: assetId, blob, bytes: blob.size, sha256: corruptHash ? 'a'.repeat(64) : sha256, mime: 'image/png', width: 2, height: 2 }] });
  } finally { db.close(); }
}
