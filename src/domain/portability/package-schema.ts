import { z } from 'zod';
import { idSchema, isoDateSchema, localImageMimeSchema } from '../model';
import { PACKAGE_LIMITS, requirePackage } from './zip';
export const packageKindSchema = z.enum(['procedure', 'library', 'settings', 'full']);
export type PackageKind = z.infer<typeof packageKindSchema>;
export const manifestSchema = z.strictObject({
  format: z.literal('nurseflow-portable'), formatVersion: z.literal(1), schemaVersion: z.literal(1), packageKind: packageKindSchema,
  packageId: idSchema, exportedAt: isoDateSchema, appVersion: z.string().min(1).max(80),
  counts: z.strictObject({ procedures: z.number().int().nonnegative(), groups: z.number().int().nonnegative(), revisions: z.number().int().nonnegative(), media: z.number().int().nonnegative(), runs: z.number().int().nonnegative() }),
  entries: z.array(z.strictObject({ path: z.string(), bytes: z.number().int().nonnegative(), sha256: z.string().regex(/^[a-f0-9]{64}$/) })).max(PACKAGE_LIMITS.entries),
  missingAssets: z.array(idSchema).max(PACKAGE_LIMITS.entries),
});
export type Manifest = z.infer<typeof manifestSchema>;
export const portableAssetSchema = z.strictObject({ id: idSchema, mime: localImageMimeSchema, bytes: z.number().int().nonnegative(),
  width: z.number().int().positive(), height: z.number().int().positive(), sha256: z.string().regex(/^[a-f0-9]{64}$/), path: z.string().regex(/^media\/\d{6}\.bin$/) });
export function parseJson(bytes: Uint8Array): unknown {
  requirePackage(bytes.length <= PACKAGE_LIMITS.jsonBytes, 'limit');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); let quoted = false; let escaped = false; let depth = 0; let units = 0;
  for (const char of text) {
    if (quoted) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === '"') quoted = false; }
    else if (char === '"') quoted = true;
    else if (char === '{' || char === '[') { depth++; units++; requirePackage(depth <= 64 && units <= PACKAGE_LIMITS.jsonUnits, 'limit'); }
    else if (char === ',') { units++; requirePackage(units <= PACKAGE_LIMITS.jsonUnits, 'limit'); }
    else if (char === '}' || char === ']') depth--;
  }
  return JSON.parse(text, (key: string, value: unknown) => { requirePackage(!['__proto__', 'prototype', 'constructor'].includes(key), 'schema'); return value; }) as unknown;
}
