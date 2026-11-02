/** NurseFlow v1 ZIP profile: stored entries only, no extraction or decompression. */
export const PACKAGE_LIMITS = { bytes: 128 * 1024 * 1024, batchBytes: 128 * 1024 * 1024, entries: 10_000, jsonBytes: 8 * 1024 * 1024, jsonUnits: 250_000, files: 32 } as const;
export class PackageError extends Error {
  constructor(readonly code: 'archive' | 'limit' | 'version' | 'schema' | 'hash' | 'scope' | 'references' | 'ready' | 'media' | 'stale', readonly kind?: string) { super(code); this.name = 'PackageError'; }
}
export function requirePackage(value: unknown, code: PackageError['code'] = 'archive'): asserts value { if (!value) throw new PackageError(code); }
const allowedPath = /^(manifest\.json|groups\.json|media\.json|settings\.json|(?:procedures|revisions|runs)\/\d{6}\.json|media\/\d{6}\.bin)$/;
const table = Uint32Array.from({ length: 256 }, (_, index) => { let value = index; for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1; return value >>> 0; });
export function crc32(bytes: Uint8Array) { let crc = 0xffffffff; for (const byte of bytes) crc = table[(crc ^ byte) & 255]! ^ crc >>> 8; return (crc ^ 0xffffffff) >>> 0; }
export function readZip(bytes: Uint8Array): Map<string, Uint8Array> {
  requirePackage(bytes.length <= PACKAGE_LIMITS.bytes, 'limit'); requirePackage(bytes.length >= 22);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); const end = bytes.length - 22;
  const u16 = (at: number) => view.getUint16(at, true); const u32 = (at: number) => view.getUint32(at, true);
  requirePackage(u32(end) === 0x06054b50 && u16(end + 4) === 0 && u16(end + 6) === 0 && u16(end + 20) === 0);
  const count = u16(end + 10); const directory = u32(end + 16); const directoryBytes = u32(end + 12);
  requirePackage(count > 0 && count <= PACKAGE_LIMITS.entries, 'limit');
  requirePackage(u16(end + 8) === count && directory + directoryBytes === end && directory < end);
  const result = new Map<string, Uint8Array>(); const names = new Set<string>(); const ranges: { start: number; end: number }[] = [];
  let cursor = directory; let total = 0;
  // Inspect all headers and lengths before any JSON, Blob allocation or hashing.
  const entries: { path: string; from: number; size: number; crc: number }[] = [];
  for (let index = 0; index < count; index++) {
    requirePackage(cursor + 46 <= end && u32(cursor) === 0x02014b50);
    const flags = u16(cursor + 8); const method = u16(cursor + 10); const size = u32(cursor + 24); const compressed = u32(cursor + 20);
    const nameBytes = u16(cursor + 28); const extra = u16(cursor + 30); const comment = u16(cursor + 32); const offset = u32(cursor + 42);
    requirePackage(u16(cursor + 6) <= 20 && (flags === 0 || flags === 0x800) && method === 0 && size === compressed);
    requirePackage(extra === 0 && comment === 0 && u16(cursor + 34) === 0 && (u32(cursor + 38) >>> 16 & 0xf000) !== 0xa000);
    requirePackage(nameBytes > 0 && nameBytes <= 96 && cursor + 46 + nameBytes <= end);
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameBytes); const path = new TextDecoder('utf-8', { fatal: true }).decode(name);
    requirePackage(allowedPath.test(path) && !names.has(path.toLowerCase())); names.add(path.toLowerCase());
    requirePackage(offset + 30 <= directory && u32(offset) === 0x04034b50);
    requirePackage(u16(offset + 4) === u16(cursor + 6) && u16(offset + 6) === flags && u16(offset + 8) === method);
    requirePackage(u32(offset + 14) === u32(cursor + 16) && u32(offset + 18) === compressed && u32(offset + 22) === size);
    requirePackage(u16(offset + 26) === nameBytes && u16(offset + 28) === 0);
    const from = offset + 30 + nameBytes; requirePackage(from + size <= directory);
    requirePackage(name.every((byte, i) => byte === bytes[offset + 30 + i]));
    total += size; requirePackage(total <= PACKAGE_LIMITS.bytes && (!path.endsWith('.json') || size <= PACKAGE_LIMITS.jsonBytes), 'limit');
    ranges.push({ start: offset, end: from + size }); entries.push({ path, from, size, crc: u32(cursor + 16) }); cursor += 46 + nameBytes;
  }
  requirePackage(cursor === end); ranges.sort((a, b) => a.start - b.start); let next = 0;
  for (const range of ranges) { requirePackage(range.start === next); next = range.end; } requirePackage(next === directory);
  for (const entry of entries) { const data = bytes.subarray(entry.from, entry.from + entry.size); requirePackage(crc32(data) === entry.crc, 'hash'); result.set(entry.path, data); }
  return result;
}
export function writeZip(entries: ReadonlyMap<string, Uint8Array>): Uint8Array<ArrayBuffer> {
  requirePackage(entries.size > 0 && entries.size <= PACKAGE_LIMITS.entries, 'limit');
  const order = [...entries].sort(([a], [b]) => a === 'manifest.json' ? -1 : b === 'manifest.json' ? 1 : a.localeCompare(b));
  const prepared = order.map(([path, data]) => { requirePackage(allowedPath.test(path)); requirePackage(!path.endsWith('.json') || data.length <= PACKAGE_LIMITS.jsonBytes, 'limit'); return { path: new TextEncoder().encode(path), data, crc: crc32(data) }; });
  const size = prepared.reduce((sum, entry) => sum + 76 + 2 * entry.path.length + entry.data.length, 22); requirePackage(size <= PACKAGE_LIMITS.bytes, 'limit');
  const bytes = new Uint8Array(size); const view = new DataView(bytes.buffer); let at = 0;
  const u16 = (offset: number, value: number) => view.setUint16(offset, value, true); const u32 = (offset: number, value: number) => view.setUint32(offset, value, true);
  const offsets: number[] = [];
  for (const entry of prepared) {
    offsets.push(at); u32(at, 0x04034b50); u16(at + 4, 20); u16(at + 6, 0x800); u16(at + 12, 33); u32(at + 14, entry.crc);
    u32(at + 18, entry.data.length); u32(at + 22, entry.data.length); u16(at + 26, entry.path.length);
    bytes.set(entry.path, at + 30); bytes.set(entry.data, at + 30 + entry.path.length); at += 30 + entry.path.length + entry.data.length;
  }
  const directory = at;
  prepared.forEach((entry, index) => {
    u32(at, 0x02014b50); u16(at + 4, 20); u16(at + 6, 20); u16(at + 8, 0x800); u16(at + 14, 33); u32(at + 16, entry.crc);
    u32(at + 20, entry.data.length); u32(at + 24, entry.data.length); u16(at + 28, entry.path.length); u32(at + 42, offsets[index]!);
    bytes.set(entry.path, at + 46); at += 46 + entry.path.length;
  });
  u32(at, 0x06054b50); u16(at + 8, entries.size); u16(at + 10, entries.size); u32(at + 12, at - directory); u32(at + 16, directory); return bytes;
}
