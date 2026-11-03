import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands } from '../../src/storage/commands';
import { portableRecords } from '../../src/test/fixtures/portable';
import { createPackage, jsonBytes, parsePackage, sealPackage } from '../../src/features/portability/codec';
import { subsetRecords } from '../../src/domain/portability/validation';
import { manifestSchema, parseJson } from '../../src/domain/portability/package-schema';
import { PACKAGE_LIMITS, readZip, writeZip } from '../../src/domain/portability/zip';
import { settingsSchema } from '../../src/domain/model';
import { fixtureDate } from '../../src/test/fixtures/domain';
const context = { packageId: 'fixture-package', exportedAt: fixtureDate, appVersion: '0.0.0' };
export async function seedPortable(scale = 13, theme: 'light' | 'dark' = 'light', locale: 'it' | 'en' = 'it') {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const records = await portableRecords(10); await db.groups.bulkAdd(records.groups); await db.mediaAssets.bulkAdd(records.mediaAssets); await db.revisions.bulkAdd(records.revisions); await db.procedures.bulkAdd(records.procedures);
    const commands = createCommands(db); await commands.completeFirstLaunch(); await commands.saveAppearance({ uiScalePt: scale, theme, locale });
    const run = await commands.startOrResumeReady('p-0', 'r-0'); return { runId: run.id };
  } finally { db.close(); }
}
export async function inspectPortable() {
  const db = new NurseFlowDatabase(); await db.open();
  try { return { procedures: await db.procedures.toArray(), groups: await db.groups.toArray(), revisions: await db.revisions.toArray(), runs: await db.runSessions.toArray(), settings: await db.settings.toArray(), view: await db.uiPreferences.toArray(),
    assets: await Promise.all((await db.mediaAssets.toArray()).map(async ({ blob, ...asset }) => ({ ...asset, data: [...new Uint8Array(await blob.arrayBuffer())] }))) }; }
  finally { db.close(); }
}
export async function packageBytes(kind: 'single' | 'library' | 'library-ten' | 'settings' | 'full' | 'collision' | 'broken' | 'corrupt' | 'future') {
  const library = kind === 'library' || kind === 'library-ten';
  const records = await portableRecords(kind === 'library-ten' ? 10 : library ? 3 : 1); let blob: Blob;
  if (kind === 'settings') blob = await sealPackage(new Map([['settings.json', jsonBytes(settingsSchema.parse({ locale: 'en', uiScalePt: 48 }))]]), { ...context, packageKind: 'settings', counts: { procedures: 0, groups: 0, revisions: 0, media: 0, runs: 0 }, missingAssets: [] });
  else {
    if (kind === 'collision') {
      records.procedures[0]!.title = '<img src=x onerror="window.F13Xss=1">'; records.mediaAssets[0]!.id = 'foreign-raster';
      for (const revision of records.revisions) for (const node of revision.graph.nodes) if ('media' in node) for (const media of node.media) if (media.source.kind === 'local') media.source.assetId = media.source.assetId === 'asset' ? 'foreign-raster' : 'asset';
    }
    if (kind === 'broken') {
      const graph = records.revisions.find((revision) => revision.state === 'ready')!.graph; const decision = graph.nodes.find((node) => node.kind === 'decision')!;
      if (decision.kind === 'decision') decision.outcomes[0]!.destination = { kind: 'broken', formerNodeId: 'deleted-card', formerTitle: 'Carta rimossa' };
      graph.nodes = graph.nodes.filter((node) => node.id !== 'a-step');
    }
    blob = await createPackage(library ? records : subsetRecords(records, new Set(['p-0'])), library ? 'library' : 'procedure', context);
    if (kind === 'full') {
      const entries = readZip(new Uint8Array(await blob.arrayBuffer())); const manifest = manifestSchema.parse(parseJson(entries.get('manifest.json')!)); entries.delete('manifest.json'); entries.set('settings.json', jsonBytes(settingsSchema.parse({ uiScalePt: 48 })));
      blob = await sealPackage(entries, { ...manifest, packageKind: 'full' });
    }
    if (kind === 'corrupt' || kind === 'future') {
      const entries = readZip(new Uint8Array(await blob.arrayBuffer()));
      if (kind === 'corrupt') entries.set('groups.json', jsonBytes([]));
      else { const manifest = parseJson(entries.get('manifest.json')!) as { formatVersion: number }; manifest.formatVersion = 99; entries.set('manifest.json', jsonBytes(manifest)); }
      blob = new Blob([writeZip(entries)]);
    }
  }
  return [...new Uint8Array(await blob.arrayBuffer())];
}
export async function decodeBytes(bytes: number[]) {
  const parsed = await parsePackage(new Blob([new Uint8Array(bytes)])); return { manifest: parsed.manifest, procedures: parsed.records.procedures, groups: parsed.records.groups, revisions: parsed.records.revisions, assets: parsed.records.mediaAssets.map(({ id, bytes, sha256 }) => ({ id, bytes, sha256 })) };
}
export async function benchmarkPortable() {
  const measurements = [];
  for (const mib of [8, 32, 96]) {
    const entries = new Map<string, Uint8Array>([['manifest.json', jsonBytes({ benchmark: true })]]);
    for (let index = 0; index < mib / 8; index++) entries.set('media/' + String(index).padStart(6, '0') + '.bin', new Uint8Array(8 * 1024 * 1024));
    const start = performance.now(); const written = writeZip(entries); const prepared = performance.now(); const parsed = readZip(written); const read = performance.now();
    measurements.push({ mib, entries: parsed.size, bytes: written.length, writeMs: prepared - start, readMs: read - prepared });
  }
  return { limits: PACKAGE_LIMITS, measurements };
}
