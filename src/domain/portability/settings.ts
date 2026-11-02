import type { Settings } from '../model';
import { canonical } from '../validation/validator';
import { PackageError } from './zip';
export const portableSettingKeys = ['locale', 'theme', 'uiScalePt', 'photoPreset', 'mediaAddSoftLimit'] as const;
export function settingsToken(value: Settings) { return canonical(value); }
export function settingsChanges(current: Settings, imported: Settings) { return portableSettingKeys.filter((key) => canonical(current[key]) !== canonical(imported[key])); }
export function assertSettingsUnchanged(current: Settings, expected: string) { if (settingsToken(current) !== expected) throw new PackageError('stale'); }
