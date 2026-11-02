import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAppearance } from '@app/appearance-context';
import { Button, Icon } from '@shared/components';
import { libraryService } from '@features/library/service';

export function FirstLaunch({ onComplete }: { onComplete(): void }) {
  const { t } = useTranslation(); const { preferences, update, saveFailed } = useAppearance();
  const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  async function start() {
    setBusy(true); setError(false);
    // Invocation stays in the user gesture; its permission outcome never gates navigation.
    void libraryService.requestPersistence().catch(() => {});
    try { await libraryService.completeSetup(); onComplete(); void navigate('/library', { replace: true }); }
    catch { setError(true); setBusy(false); }
  }
  return <section className="nf-first-launch nf-stack" aria-labelledby="welcome-title">
    <Icon name="procedure" /><h1 id="welcome-title">NurseFlow</h1>
    <fieldset className="nf-stack"><legend>{t('appearance.language')}</legend><div className="nf-row">
      {(['it', 'en'] as const).map((locale) => <Button key={locale} aria-pressed={preferences.locale === locale}
        onClick={() => update({ locale })}>{locale === 'it' ? 'Italiano' : 'English'}</Button>)}
    </div></fieldset>
    {error && <p role="alert">{t('library.saveError')}</p>}
    <Button variant="primary" disabled={busy || saveFailed} disabledReason={t('common.loading')}
      onClick={() => { void start(); }}>{error ? t('common.retry') : t('setup.start')}</Button>
    <Link to="/data/app" state={{ dataReturn: '/setup' }}>{t('setup.import')}</Link>
  </section>;
}
