import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';

export function createUiI18n(locale: 'it' | 'en' = 'it') {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources, lng: locale, fallbackLng: 'it', supportedLngs: ['it', 'en'],
    initAsync: false, interpolation: { escapeValue: false }, react: { useSuspense: false },
  });
  return instance;
}
