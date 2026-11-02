import { z } from 'zod';
import { settingsSchema, type Settings } from '@domain/model';
import { importedRecordsSchema, assetReferences, type ImportedRecords } from '@domain/portability/records';
import { manifestSchema, parseJson, portableAssetSchema, type Manifest, type PackageKind } from '@domain/portability/package-schema';
import { PackageError, PACKAGE_LIMITS, readZip, requirePackage, writeZip } from '@domain/portability/zip';
import { validatePortableRecords } from '@domain/portability/validation';
import { inspectRaster, MAX_IMAGE_BYTES } from '@domain/editor/raster';
import { canonical } from '@domain/validation/validator';
import { assertDecodable } from '../../storage';
export const jsonBytes = (value: unknown) => { const bytes = new TextEncoder().encode(canonical(value)); parseJson(bytes); return bytes; };
export async function sha256(bytes: Uint8Array) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)))].map((byte) => byte.toString(16).padStart(2, '0')).join(''); }
export type PackageContext = { packageId: string; exportedAt: string; appVersion: string };
export async function sealPackage(entries: ReadonlyMap<string, Uint8Array>, meta: Omit<Manifest, 'format' | 'formatVersion' | 'schemaVersion' | 'entries'>) {
  const hashes: Manifest['entries'] = [];
  for (const [path, bytes] of [...entries].sort(([a], [b]) => a.localeCompare(b))) hashes.push({ path, bytes: bytes.length, sha256: await sha256(bytes) });
  const manifest = manifestSchema.parse({ ...meta, format: 'nurseflow-portable', formatVersion: 1, schemaVersion: 1, entries: hashes });
  return new Blob([writeZip(new Map([['manifest.json', jsonBytes(manifest)], ...entries]))], { type: 'application/zip' });
}
async function verifyAsset(asset: ImportedRecords['mediaAssets'][number]) {
  try {
  requirePackage(asset.blob.size <= MAX_IMAGE_BYTES, 'media');
  const bytes = new Uint8Array(await asset.blob.arrayBuffer()); const info = inspectRaster(bytes);
  requirePackage(info.mime === asset.mime && info.width === asset.width && info.height === asset.height && await sha256(bytes) === asset.sha256, 'media');
  await assertDecodable(asset.blob); return bytes;
  } catch (error) { if (error instanceof PackageError) throw error; throw new PackageError('media'); }
}
const pathAt = (folder: string, index: number, extension = 'json') => folder + '/' + String(index).padStart(6, '0') + '.' + extension;
export async function createPackage(records: ImportedRecords, kind: 'procedure' | 'library', context: PackageContext) {
  requirePackage(records.runSessions.length === 0 && records.procedures.length > 0 && (kind !== 'procedure' || records.procedures.length === 1), 'scope');
  requirePackage(records.procedures.length + records.revisions.length + records.mediaAssets.length + 3 <= PACKAGE_LIMITS.entries && records.mediaAssets.reduce((sum, asset) => sum + asset.blob.size, 0) <= PACKAGE_LIMITS.bytes, 'limit');
  validatePortableRecords(records); const entries = new Map<string, Uint8Array>();
  entries.set('groups.json', jsonBytes(records.groups));
  for (const [folder, values] of [['procedures', records.procedures], ['revisions', records.revisions]] as const)
    [...values].sort((a, b) => a.id.localeCompare(b.id)).forEach((value, index) => entries.set(pathAt(folder, index), jsonBytes(value)));
  const media = [];
  for (const [index, asset] of [...records.mediaAssets].sort((a, b) => a.id.localeCompare(b.id)).entries()) {
    const bytes = await verifyAsset(asset); const path = pathAt('media', index, 'bin'); entries.set(path, bytes); media.push({ id: asset.id, mime: asset.mime, bytes: asset.bytes, width: asset.width, height: asset.height, sha256: asset.sha256, path });
  }
  entries.set('media.json', jsonBytes(media)); const present = new Set(records.mediaAssets.map((asset) => asset.id));
  const missingAssets = [...new Set(records.revisions.flatMap((revision) => assetReferences(revision.graph)))].filter((id) => !present.has(id)).sort();
  return sealPackage(entries, { ...context, packageKind: kind, counts: { procedures: records.procedures.length, revisions: records.revisions.length, groups: records.groups.length, media: media.length, runs: 0 }, missingAssets });
}
export type ParsedPackage = { manifest: Manifest; records: ImportedRecords; warnings: ReturnType<typeof validatePortableRecords>; settings?: Settings };
export async function parsePackage(file: Blob, accepted: readonly PackageKind[] = ['procedure', 'library']): Promise<ParsedPackage> {
  try {
    requirePackage(file.size <= PACKAGE_LIMITS.bytes, 'limit'); const entries = readZip(new Uint8Array(await file.arrayBuffer()));
    requirePackage(entries.has('manifest.json')); const raw = parseJson(entries.get('manifest.json')!);
    requirePackage(raw && typeof raw === 'object' && 'format' in raw && raw.format === 'nurseflow-portable', 'schema');
    requirePackage('formatVersion' in raw && raw.formatVersion === 1 && 'schemaVersion' in raw && raw.schemaVersion === 1, 'version');
    const manifest = manifestSchema.parse(raw); requirePackage(entries.size === manifest.entries.length + 1, 'hash'); const paths = new Set<string>();
    for (const entry of manifest.entries) {
      requirePackage(entry.path !== 'manifest.json' && !paths.has(entry.path), 'hash'); paths.add(entry.path);
      const data = entries.get(entry.path); requirePackage(data && data.length === entry.bytes && await sha256(data) === entry.sha256, 'hash');
    }
    const kind = manifest.packageKind; const hasLibrary = kind !== 'settings'; const hasSettings = kind === 'settings' || kind === 'full';
    requirePackage(entries.has('settings.json') === hasSettings && entries.has('groups.json') === hasLibrary && entries.has('media.json') === hasLibrary, 'schema');
    const read = (path: string) => { const value = entries.get(path); requirePackage(value, 'schema'); return parseJson(value); };
    const values = (folder: string) => [...entries.keys()].filter((path) => path.startsWith(folder + '/') && path.endsWith('.json')).sort().map(read);
    const media = hasLibrary ? z.array(portableAssetSchema).parse(read('media.json')) : []; const usedPaths = new Set<string>();
    const mediaAssets = [];
    for (const asset of media) {
      const data = entries.get(asset.path); requirePackage(data && data.length <= MAX_IMAGE_BYTES && !usedPaths.has(asset.path), 'media'); usedPaths.add(asset.path);
      const item = { id: asset.id, mime: asset.mime, bytes: asset.bytes, width: asset.width, height: asset.height, sha256: asset.sha256, blob: new Blob([new Uint8Array(data)], { type: asset.mime }) };
      await verifyAsset(item); mediaAssets.push(item);
    }
    requirePackage([...entries.keys()].filter((path) => path.startsWith('media/')).length === mediaAssets.length, 'media');
    const records = importedRecordsSchema.parse({ procedures: values('procedures'), revisions: values('revisions'), groups: hasLibrary ? read('groups.json') : [], mediaAssets, runSessions: values('runs') });
    const counts = { procedures: records.procedures.length, groups: records.groups.length, revisions: records.revisions.length, media: records.mediaAssets.length, runs: records.runSessions.length };
    requirePackage(canonical(counts) === canonical(manifest.counts), 'schema');
    requirePackage(kind === 'full' || records.runSessions.length === 0, 'schema');
    requirePackage(kind !== 'library' || records.procedures.length > 0, 'schema'); requirePackage(kind !== 'procedure' || records.procedures.length === 1, 'schema');
    requirePackage(kind !== 'settings' || Object.values(counts).every((value) => value === 0), 'schema');
    const present = new Set(mediaAssets.map((asset) => asset.id)); const missing = [...new Set(records.revisions.flatMap((revision) => assetReferences(revision.graph)))].filter((id) => !present.has(id)).sort();
    requirePackage(canonical(missing) === canonical([...manifest.missingAssets].sort()), 'references');
    const warnings = validatePortableRecords(records); const settings = hasSettings ? settingsSchema.parse(read('settings.json')) : undefined;
    if (!accepted.includes(kind)) throw new PackageError('scope', kind);
    return { manifest, records, warnings, ...(settings ? { settings } : {}) };
  } catch (error) { if (error instanceof PackageError) throw error; throw new PackageError('schema'); }
}
