import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@shared/components';
import { createScaleTokens } from '@shared/design-tokens/scale';
import { AppearanceContext } from './appearance-context';
import type { Appearance, AppearanceService } from './appearance-service';
import { AppearanceSaveError } from './AppearanceSaveError';

const defaults: Appearance = { locale: 'it', theme: 'system', uiScalePt: 13 };
function subscribeTheme(notify: () => void) {
  const query = window.matchMedia?.('(prefers-color-scheme: dark)');
  query?.addEventListener('change', notify);
  return () => query?.removeEventListener('change', notify);
}
function systemIsDark() { return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false; }

export function AppearanceProvider({ service, children }: PropsWithChildren<{ service: AppearanceService }>) {
  const [preferences, setPreferences] = useState<Appearance>(defaults);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saveFailed, setSaveFailed] = useState(false);
  const desired = useRef(defaults);
  const committed = useRef(defaults);
  const failed = useRef<Appearance | null>(null);
  const generation = useRef(0);
  const loadRequest = useRef(0);
  const queue = useRef(Promise.resolve());
  const mounted = useRef(false);
  const dark = useSyncExternalStore(subscribeTheme, systemIsDark, () => false);
  const { t, i18n } = useTranslation();

  const load = useCallback(() => {
    const request = ++loadRequest.current;
    void service.load().then((loaded) => {
      if (!mounted.current || request !== loadRequest.current) return;
      desired.current = committed.current = loaded;
      setPreferences(loaded); setStatus('ready');
    }, () => { if (mounted.current && request === loadRequest.current) setStatus('error'); });
  }, [service]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => { mounted.current = false; };
  }, [load]);
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(createScaleTokens(preferences.uiScalePt))) root.style.setProperty(name, value);
    root.dataset.theme = preferences.theme === 'system' ? (dark ? 'dark' : 'light') : preferences.theme;
    root.lang = preferences.locale;
    void i18n.changeLanguage(preferences.locale);
  }, [preferences, dark, i18n]);

  const update = useCallback((patch: Partial<Appearance>) => {
    const next = { ...desired.current, ...patch };
    const version = ++generation.current;
    desired.current = next;
    setPreferences(next);
    // Serialize full appearance snapshots. Media defaults are merged inside the repository command.
    queue.current = queue.current.then(async () => {
      try {
        const saved = await service.save(next);
        committed.current = saved;
        if (!mounted.current || version !== generation.current) return;
        desired.current = saved; failed.current = null;
        setPreferences(saved); setSaveFailed(false);
      } catch {
        if (!mounted.current || version !== generation.current) return;
        failed.current = next; desired.current = committed.current;
        setPreferences(committed.current); setSaveFailed(true);
      }
    });
  }, [service]);
  const flush = useCallback(async () => { await queue.current; if (failed.current) throw new Error('Appearance not saved'); }, []);
  const acceptCommitted = useCallback(({ locale, theme, uiScalePt }: Appearance) => {
    const value = { locale, theme, uiScalePt };
    generation.current++; desired.current = committed.current = value; failed.current = null;
    setPreferences(value); setSaveFailed(false);
  }, []);

  if (status === 'loading') return <p role="status">{t('common.loading')}</p>;
  if (status === 'error') return <Card><p role="alert">{t('library.loadError')}</p>
    <Button onClick={() => { setStatus('loading'); void load(); }}>{t('common.retry')}</Button></Card>;
  return (
    <AppearanceContext value={{ preferences, update, saveFailed, flush, acceptCommitted, retry: () => { if (failed.current) update(failed.current); } }}>
      <AppearanceSaveError />
      {children}
    </AppearanceContext>
  );
}
