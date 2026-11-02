import { createContext } from 'react';
import type { MediaAsset } from '@domain/model';
/** Isolated read-only assets for a staged package; never falls back to coincident local IDs. */
export const MediaAssetContext = createContext<((id: string) => Promise<MediaAsset | undefined>) | null>(null);
