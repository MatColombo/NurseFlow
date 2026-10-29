import { z } from 'zod';
import { idSchema } from './common';

export const localImageMimeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp']);
// URL parsing is pure: no request or DNS lookup is performed here.
export const remoteImageUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  return url.protocol === 'https:' && !url.username && !url.password &&
    !host.includes(':') && !/^\d+(\.\d+){3}$/.test(host) &&
    host.includes('.') && !host.endsWith('.') &&
    !/\.(localhost|local|internal|test|invalid)$/.test(host) &&
    !/\.svg(?:$|[?#])/i.test(url.pathname);
}, 'Only public HTTPS image URLs are supported');

export const stepMediaSchema = z.strictObject({
  id: idSchema,
  slot: z.enum(['before-note', 'after-note']),
  order: z.number().int().nonnegative(),
  source: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('local'), assetId: idSchema, mime: localImageMimeSchema }),
    z.strictObject({
      kind: z.literal('remote'), httpsUrl: remoteImageUrlSchema,
      expectedMime: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']).optional(),
    }),
  ]),
  caption: z.string().optional(),
  altText: z.string().optional(),
});

export const galleryStyleSchema = z.strictObject({
  layout: z.enum(['stacked-thumbnails', 'side-by-side', 'full-width']),
  imageSpace: z.enum(['compact', 'medium', 'large', 'natural']),
});
export const galleryPrefsSchema = z.strictObject({
  beforeNote: galleryStyleSchema, afterNote: galleryStyleSchema,
});

// Blob identity is checked without depending on a DOM/global Blob constructor.
const blobSchema = z.custom<Blob>((value) =>
  typeof value === 'object' && value !== null &&
  Object.prototype.toString.call(value) === '[object Blob]',
);
export const mediaAssetSchema = z.strictObject({
  id: idSchema, blob: blobSchema, sha256: z.string().regex(/^[a-f0-9]{64}$/),
  mime: localImageMimeSchema, bytes: z.number().int().nonnegative(),
  width: z.number().int().positive(), height: z.number().int().positive(),
}).refine((asset) => asset.blob.size === asset.bytes && asset.blob.type === asset.mime,
  'Blob size and MIME must match the metadata');

export type StepMedia = z.infer<typeof stepMediaSchema>;
export type Media = StepMedia;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type GalleryPrefs = z.infer<typeof galleryPrefsSchema>;
