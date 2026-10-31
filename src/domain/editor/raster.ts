/** Raster envelopes only. No SVG/HTML decoder or imported executable content. */
export const MAX_IMAGE_BYTES = 32 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 48_000_000;
export type RasterInfo = { mime: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'; width: number; height: number };
export function inspectRaster(bytes: Uint8Array, allowGif = false): RasterInfo {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); const ascii = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
  let result: RasterInfo | undefined;
  if (bytes.length >= 24 && ascii(1, 4) === 'PNG' && bytes[0] === 137 && ascii(12, 16) === 'IHDR' && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10)
    result = { mime: 'image/png', width: view.getUint32(16), height: view.getUint32(20) };
  else if (allowGif && bytes.length >= 10 && ['GIF87a', 'GIF89a'].includes(ascii(0, 6))) result = { mime: 'image/gif', width: view.getUint16(6, true), height: view.getUint16(8, true) };
  else if (bytes.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    const chunk = ascii(12, 16);
    if (chunk === 'VP8X') result = { mime: 'image/webp', width: 1 + bytes[24]! + (bytes[25]! << 8) + (bytes[26]! << 16), height: 1 + bytes[27]! + (bytes[28]! << 8) + (bytes[29]! << 16) };
    else if (chunk === 'VP8 ' && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) result = { mime: 'image/webp', width: view.getUint16(26, true) & 16383, height: view.getUint16(28, true) & 16383 };
    else if (chunk === 'VP8L' && bytes[20] === 47) result = { mime: 'image/webp', width: 1 + bytes[21]! + ((bytes[22]! & 63) << 8), height: 1 + (bytes[22]! >> 6) + (bytes[23]! << 2) + ((bytes[24]! & 15) << 10) };
  } else if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
    let cursor = 2;
    while (cursor + 4 <= bytes.length) {
      if (bytes[cursor++] !== 255) break;
      while (bytes[cursor] === 255) cursor++;
      const marker = bytes[cursor++]!; if (marker === 218 || marker === 217) break;
      if (marker === 1 || marker >= 208 && marker <= 215) continue;
      if (cursor + 2 > bytes.length) break; const size = view.getUint16(cursor); if (size < 2 || cursor + size > bytes.length) break;
      if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker) && size >= 7) {
        result = { mime: 'image/jpeg', width: view.getUint16(cursor + 5), height: view.getUint16(cursor + 3) }; break;
      } cursor += size;
    }
  }
  if (!result || !result.width || !result.height) throw new Error('image-format');
  if (bytes.byteLength > MAX_IMAGE_BYTES || result.width * result.height > MAX_IMAGE_PIXELS) throw new Error('image-size');
  return result;
}
