import { createContext, useContext } from 'react';
import type { Appearance } from './appearance-service';

export interface AppearanceContextValue {
  preferences: Appearance;
  update(patch: Partial<Appearance>): void;
  saveFailed: boolean;
  retry(): void;
}
export const AppearanceContext = createContext<AppearanceContextValue | null>(null);
export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('AppearanceProvider required');
  return context;
}
