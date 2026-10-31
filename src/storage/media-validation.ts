/** Local raster decoding only. Every temporary native bitmap / Blob URL is released. */
export async function assertDecodable(blob: Blob) {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob); try { if (!bitmap.width || !bitmap.height) throw new Error('Unreadable image'); } finally { bitmap.close(); }
  } else if (typeof Image === 'function') {
    const image = new Image(); const url = URL.createObjectURL(blob);
    try { image.src = url; await image.decode(); if (!image.naturalWidth || !image.naturalHeight) throw new Error('Unreadable image'); }
    finally { image.src = ''; URL.revokeObjectURL(url); }
  }
  // Node unit tests have no native raster decoder; real browser tests exercise decoding.
}
