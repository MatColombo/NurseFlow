import { mediaAssetSchema, remoteImageUrlSchema, type MediaAsset, type Settings } from '@domain/model';
import { inspectRaster, MAX_IMAGE_BYTES } from '@domain/editor/raster';
export async function preparePhoto(file: Blob, preset: Settings['photoPreset']): Promise<MediaAsset> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error('image-size');
  const info = inspectRaster(new Uint8Array(await file.arrayBuffer()));
  if (info.mime === 'image/gif' || file.type && file.type !== info.mime) throw new Error('image-format');
  const original = new Blob([file], { type: info.mime }); const url = URL.createObjectURL(original); const image = new Image();
  let blob = original; let width: number; let height: number;
  try {
    image.src = url; await image.decode(); width = image.naturalWidth; height = image.naturalHeight;
    if (preset !== 'original') {
      const max = { small: 640, medium: 1280, high: 2048 }[preset]; const ratio = Math.min(1, max / width);
      width = Math.max(1, Math.round(width * ratio)); height = Math.max(1, Math.round(height * ratio));
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d'); if (!context) throw new Error('image-format'); context.drawImage(image, 0, 0, width, height);
      try { blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('image-format')),
        info.mime === 'image/jpeg' ? 'image/jpeg' : 'image/webp', { small: .72, medium: .82, high: .92 }[preset])); }
      finally { canvas.width = 1; canvas.height = 1; }
    }
  } finally { image.src = ''; URL.revokeObjectURL(url); }
  const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map((value) => value.toString(16).padStart(2, '0')).join('');
  return mediaAssetSchema.parse({ id: crypto.randomUUID(), blob, mime: blob.type, bytes: blob.size, width, height, sha256 });
}
/** Never persist a remote download. Reject redirects, unsafe MIME and non-raster payloads. */
export async function remotePhoto(value: string, signal: AbortSignal): Promise<Blob> {
  const url = remoteImageUrlSchema.parse(value);
  const response = await fetch(url, { signal, redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', mode: 'cors' });
  if (!response.ok || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(response.headers.get('content-type')?.split(';')[0]?.trim() ?? '')) throw new Error('image-format');
  if (Number(response.headers.get('content-length')) > MAX_IMAGE_BYTES) throw new Error('image-size');
  const chunks: Uint8Array<ArrayBuffer>[] = []; let count = 0; const reader = response.body?.getReader(); if (!reader) throw new Error('image-format');
  try {
    while (true) { const chunk = await reader.read(); if (chunk.done) break; count += chunk.value.byteLength; if (count > MAX_IMAGE_BYTES) throw new Error('image-size'); chunks.push(new Uint8Array(chunk.value)); }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  const data = new Blob(chunks); const info = inspectRaster(new Uint8Array(await data.arrayBuffer()), true);
  if (info.mime !== response.headers.get('content-type')?.split(';')[0]?.trim()) throw new Error('image-format');
  return new Blob([data], { type: info.mime });
}
