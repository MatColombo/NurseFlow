// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { crc32, PACKAGE_LIMITS, readZip, writeZip } from './zip';
const text = (value: string) => new TextEncoder().encode(value);
describe('F13 bounded stored ZIP profile I12/I13', () => {
  it('matches the standard CRC vector and roundtrips 100 generated entry sets', () => {
    expect(crc32(text('123456789'))).toBe(0xcbf43926);
    for (let seed = 1; seed <= 100; seed++) {
      const entries = new Map([['manifest.json', text('{}')], ...Array.from({ length: seed % 13 }, (_, index): [string, Uint8Array] => ['procedures/' + String(index).padStart(6, '0') + '.json', text(JSON.stringify({ seed, index, text: 'à'.repeat(seed) }))])]);
      const read = readZip(writeZip(entries)); expect([...read.keys()].sort()).toEqual([...entries.keys()].sort()); for (const [name, bytes] of entries) expect(read.get(name)).toEqual(bytes);
    }
  });
  it.each(['../x.json', '/manifest.json', 'media/a.svg', 'nested.zip', 'procedures/x.json', 'media/000000.exe'])('rejects non-profile paths %s', (path) => expect(() => writeZip(new Map([[path, text('{}')]]))).toThrow());
  it('rejects flags, compression bombs, declared size lies, overlap, duplicate paths, trailers and truncated input before unpacking', () => {
    const zip = writeZip(new Map([['manifest.json', text('{}')], ['groups.json', text('[]')]]));
    const end = zip.length - 22; const directory = new DataView(zip.buffer).getUint32(end + 16, true);
    for (const mutate of [
      (v: DataView) => v.setUint16(directory + 10, 8, true), (v: DataView) => v.setUint16(directory + 8, 1, true),
      (v: DataView) => v.setUint32(directory + 24, 0x7fffffff, true), (v: DataView) => v.setUint32(directory + 42, 1, true),
      (v: DataView) => v.setUint16(end + 8, 3, true), (v: DataView) => v.setUint16(28, 4, true),
    ]) { const bad = zip.slice(); mutate(new DataView(bad.buffer)); expect(() => readZip(bad)).toThrow(); }
    const duplicate = writeZip(new Map([['procedures/000000.json', text('{}')], ['procedures/000001.json', text('{}')]])); const dupView = new DataView(duplicate.buffer);
    const dupDirectory = dupView.getUint32(duplicate.length - 6, true); const nameSize = 'procedures/000000.json'.length; const directory2 = dupDirectory + 46 + nameSize;
    const local2 = dupView.getUint32(directory2 + 42, true); duplicate[local2 + 30 + 'procedures/00000'.length] = 48; duplicate[directory2 + 46 + 'procedures/00000'.length] = 48;
    expect(() => readZip(duplicate)).toThrow('archive');
    expect(() => readZip(zip.slice(1))).toThrow(); expect(() => readZip(new Uint8Array([...zip, 0]))).toThrow(); expect(() => readZip(zip.subarray(0, 10))).toThrow();
  });
  it('rejects corruption and JSON/resource ceilings', () => {
    const bytes = writeZip(new Map([['manifest.json', text('{}')]])); bytes[30 + 'manifest.json'.length] = bytes[30 + 'manifest.json'.length]! ^ 1; expect(() => readZip(bytes)).toThrow('hash');
    expect(() => writeZip(new Map([['manifest.json', new Uint8Array(PACKAGE_LIMITS.jsonBytes + 1)]]))).toThrow('limit');
  });
});
