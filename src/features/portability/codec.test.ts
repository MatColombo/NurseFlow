// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createPackage, jsonBytes, parsePackage, sealPackage } from './codec';
import { PACKAGE_LIMITS, readZip, writeZip } from '@domain/portability/zip';
import { manifestSchema, parseJson } from '@domain/portability/package-schema';
import { subsetRecords } from '@domain/portability/validation';
import { settingsSchema } from '@domain/model';
import { portableRecords } from '@test/fixtures/portable';
import { fixtureDate } from '@test/fixtures/domain';
const context = { packageId: 'source-package', exportedAt: fixtureDate, appVersion: '0.0.0' };
async function altered(blob: Blob, change: (entries: Map<string, Uint8Array>) => void, reseal = true) {
  const entries = readZip(new Uint8Array(await blob.arrayBuffer())); const manifest = manifestSchema.parse(parseJson(entries.get('manifest.json')!)); entries.delete('manifest.json'); change(entries);
  if (!reseal) { entries.set('manifest.json', jsonBytes(manifest)); return new Blob([writeZip(entries)]); }
  return sealPackage(entries, manifest);
}
describe('F13 real packages and scope/security I01/I03/I09–I14/I18/I19/E13', () => {
  it('roundtrips Ready+incomplete Draft, metadata, convergent IDs, exact raster bytes, remote URL, galleries and explicit W07', async () => {
    const records = await portableRecords(3); const mediaStep = records.revisions[0]!.graph.nodes.find((node) => node.id === 'shared')!;
    if (mediaStep.kind !== 'instruction') throw new Error('fixture');
    mediaStep.galleries = { beforeNote: { layout: 'full-width', imageSpace: 'natural' }, afterNote: { layout: 'side-by-side', imageSpace: 'large' } };
    mediaStep.media.find((item) => item.id === 'm-url')!.order = 1; mediaStep.media.find((item) => item.id === 'm-missing')!.order = 0;
    const blob = await createPackage(records, 'library', context); const parsed = await parsePackage(blob);
    expect(parsed.manifest.counts).toEqual({ procedures: 3, groups: 3, revisions: 4, media: 1, runs: 0 }); expect(parsed.manifest.missingAssets).toEqual(['missing']);
    expect(parsed.records.procedures).toEqual(records.procedures); expect(parsed.records.revisions).toEqual([...records.revisions].sort((a, b) => a.id.localeCompare(b.id))); expect(parsed.records.mediaAssets[0]!.sha256).toBe(records.mediaAssets[0]!.sha256);
    expect(new Uint8Array(await parsed.records.mediaAssets[0]!.blob.arrayBuffer())).toEqual(new Uint8Array(await records.mediaAssets[0]!.blob.arrayBuffer()));
    expect(parsed.warnings.get('r-0')?.map((issue) => issue.code)).toContain('W07'); expect(parsed.records.runSessions).toEqual([]);
    const one = subsetRecords(records, new Set(['p-1'])); const single = await parsePackage(await createPackage(one, 'procedure', context)); expect(single.manifest.packageKind).toBe('procedure'); expect(single.records.groups).toHaveLength(1);
    const draftOnly = await portableRecords(1, false); delete draftOnly.procedures[0]!.readyRevisionId; draftOnly.revisions = draftOnly.revisions.filter((revision) => revision.state === 'working-draft');
    const draft = await parsePackage(await createPackage(draftOnly, 'procedure', context)); expect(draft.records.procedures[0]!.readyRevisionId).toBeUndefined(); expect(draft.records.revisions[0]!.state).toBe('working-draft');
  });
  it('preserves historical W08 and never forgives newly unassigned Ready outlets; incomplete Draft may remain incomplete', async () => {
    const records = await portableRecords(1, false); const decision = records.revisions[0]!.graph.nodes.find((node) => node.kind === 'decision')!;
    if (decision.kind !== 'decision') throw new Error('fixture'); decision.outcomes[0]!.destination = { kind: 'broken', formerNodeId: 'gone', formerTitle: 'Carta cancellata' };
    records.revisions[0]!.graph.nodes = records.revisions[0]!.graph.nodes.filter((node) => node.id !== 'a-step');
    const read = await parsePackage(await createPackage(records, 'procedure', context)); expect(read.warnings.get('r-0')?.map((issue) => issue.code)).toContain('W08');
    decision.outcomes[0]!.destination = { kind: 'unassigned' }; await expect(createPackage(records, 'procedure', context)).rejects.toThrow('ready');
  });
  it('classifies settings/full by verified manifest instead of extension, and rejects wrong scopes symmetrically (I03/I04)', async () => {
    const counts = { procedures: 0, groups: 0, revisions: 0, media: 0, runs: 0 };
    const settings = await sealPackage(new Map([['settings.json', jsonBytes(settingsSchema.parse({}))]]), { ...context, packageKind: 'settings', counts, missingAssets: [] });
    await expect(parsePackage(new File([settings], 'misleading.nfproc'))).rejects.toMatchObject({ code: 'scope', kind: 'settings' });
    expect((await parsePackage(settings, ['settings', 'full'])).settings?.uiScalePt).toBe(13);
    const full = await sealPackage(new Map([['settings.json', jsonBytes(settingsSchema.parse({}))], ['groups.json', jsonBytes([])], ['media.json', jsonBytes([])]]), { ...context, packageKind: 'full', counts, missingAssets: [] });
    await expect(parsePackage(full)).rejects.toMatchObject({ code: 'scope', kind: 'full' });
    const proc = await createPackage(await portableRecords(1, false), 'procedure', context); await expect(parsePackage(proc, ['settings', 'full'])).rejects.toMatchObject({ code: 'scope', kind: 'procedure' });
  });
  it('rejects hash mismatch as corruption, not W07, plus undeclared missing media, schema/URL/ribbon corruption and future version', async () => {
    const good = await createPackage(await portableRecords(1), 'procedure', context);
    await expect(parsePackage(await altered(good, (entries) => { entries.set('groups.json', jsonBytes([])); }, false))).rejects.toMatchObject({ code: 'hash' });
    await expect(parsePackage(await altered(good, (entries) => { entries.delete('media/000000.bin'); }))).rejects.toThrow();
    await expect(parsePackage(await altered(good, (entries) => { const proc = parseJson(entries.get('procedures/000000.json')!) as { ribbon: { iconKey: string } }; proc.ribbon.iconKey = '<svg>'; entries.set('procedures/000000.json', jsonBytes(proc)); }))).rejects.toThrow();
    await expect(parsePackage(await altered(good, (entries) => { const revision = parseJson(entries.get('revisions/000001.json')!) as { graph: { schemaVersion: number } }; revision.graph.schemaVersion = 999; entries.set('revisions/000001.json', jsonBytes(revision)); }))).rejects.toThrow();
    for (const target of ['not-a-node', 'shared']) await expect(parsePackage(await altered(good, (entries) => {
      const revision = parseJson(entries.get('revisions/000001.json')!) as { graph: { nodes: { id: string; next?: { kind: string; nodeId: string } }[] } };
      revision.graph.nodes.find((node) => node.id === 'shared')!.next = { kind: 'node', nodeId: target }; entries.set('revisions/000001.json', jsonBytes(revision));
    }))).rejects.toThrow('references');
    const raw = readZip(new Uint8Array(await good.arrayBuffer())); const manifest = parseJson(raw.get('manifest.json')!) as { formatVersion: number }; manifest.formatVersion = 999; raw.set('manifest.json', jsonBytes(manifest)); await expect(parsePackage(new Blob([writeZip(raw)]))).rejects.toMatchObject({ code: 'version' });
  });
  it('rejects JSON depth/prototype pollution and safely retains authored HTML as plain text', async () => {
    expect(() => parseJson(new TextEncoder().encode('{"__proto__":{"polluted":true}}'))).toThrow('schema'); expect(() => parseJson(new TextEncoder().encode('['.repeat(65) + '0' + ']'.repeat(65)))).toThrow('limit');
    expect(() => parseJson(new TextEncoder().encode('[' + '0,'.repeat(250_000) + '0]'))).toThrow('limit');
    const oversize = await portableRecords(1); Object.defineProperty(oversize.mediaAssets[0]!.blob, 'size', { value: PACKAGE_LIMITS.bytes + 1 });
    Object.defineProperty(oversize.mediaAssets[0]!.blob, 'arrayBuffer', { value: () => { throw new Error('Must reject before reading image bytes'); } });
    await expect(createPackage(oversize, 'procedure', context)).rejects.toMatchObject({ code: 'limit' });
    const records = await portableRecords(1, false); records.procedures[0]!.title = '<img src=x onerror=alert(1)>'; const parsed = await parsePackage(await createPackage(records, 'procedure', context)); expect(parsed.records.procedures[0]!.title).toBe(records.procedures[0]!.title);
  });
});
