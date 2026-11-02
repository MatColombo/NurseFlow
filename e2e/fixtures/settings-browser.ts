import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands } from '../../src/storage/commands';
import { exampleRecords, galleries } from '../../src/test/fixtures/domain';
import { outlineGraph } from '../../src/test/fixtures/builder';
export async function seedSettings(scale = 13, theme: 'light' | 'dark' | 'system' = 'light', verbose = false) {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const commands = createCommands(db); const graph = outlineGraph();
    const choice = graph.nodes.find((node) => node.kind === 'decision')!;
    if (choice.kind === 'decision') { choice.question = verbose ? 'Quale percorso dimostrativo scegliere? '.repeat(5) : 'Domanda authored invariata?'; choice.note = { text: 'Nota authored invariata.', visibility: 'always-visible' }; }
    const step = graph.nodes.find((node) => node.id === 'shared')!;
    if (step.kind === 'instruction') { step.text = verbose ? 'Testo completo del cartoncino dimostrativo. '.repeat(12) : 'Contenuto authored invariato.'; step.media = Array.from({ length: 5 }, (_, index) => ({
      id: 'media-' + index, slot: index % 2 ? 'after-note' as const : 'before-note' as const, order: index, altText: 'Cartoncino ' + index,
      source: { kind: 'local' as const, assetId: 'missing-' + index, mime: 'image/png' as const },
    })); step.galleries = galleries; }
    const records = exampleRecords(graph); records.procedures[0]!.title = verbose ? 'Cartoncini personali: '.repeat(7) : 'Esempio authored';
    records.procedures[0]!.tags = ['materiale', 'dimostrazione']; records.procedures[0]!.favorite = true;
    await db.groups.bulkAdd(records.groups); await db.revisions.bulkAdd(records.revisions); await db.procedures.bulkAdd(records.procedures);
    await commands.createDraft({ procedureId: 'procedure' }); const run = await commands.startOrResumeReady('procedure', 'ready');
    await commands.completeFirstLaunch(); await commands.saveAppearance({ uiScalePt: scale, theme, locale: 'it' });
    return { runId: run.id };
  } finally { db.close(); }
}
export async function readSettingsData() {
  const db = new NurseFlowDatabase(); await db.open();
  try { return { settings: await db.settings.get('main'), view: await db.uiPreferences.get('main'), procedures: await db.procedures.toArray(), groups: await db.groups.toArray(), revisions: await db.revisions.toArray(), runs: await db.runSessions.toArray(), previews: await db.previewSessions.toArray(), assets: (await db.mediaAssets.toArray()).map(({ id, sha256, bytes }) => ({ id, sha256, bytes })) }; }
  finally { db.close(); }
}
export async function configureLayout() {
  const db = new NurseFlowDatabase(); await db.open();
  try { await db.uiPreferences.update('main', { sortMode: 'priority', collapsedGroupIds: ['group'], searchText: 'materiale', filters: { favoritesOnly: true }, recentProcedureIds: ['procedure'], scrollTop: 180, recentCollapsed: true }); }
  finally { db.close(); }
}
export async function touchDuringReview() {
  const db = new NurseFlowDatabase(); await db.open();
  try { await createCommands(db).setFavorite('procedure', false); } finally { db.close(); }
}
