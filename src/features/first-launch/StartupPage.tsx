import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components';
import { LibraryPage } from '@features/library/LibraryPage';
import { libraryService, type LibrarySnapshot } from '@features/library/service';
import { FirstLaunch } from './FirstLaunch';

export function StartupPage({ setup }: { setup: boolean }) {
  const { t } = useTranslation(); const [data, setData] = useState<LibrarySnapshot | null>(null);
  const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void libraryService.load().then((loaded) => { if (active) setData(loaded); }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);
  if (error) return <section className="nf-stack"><p role="alert">{t('library.loadError')}</p><Button onClick={() => {
    setError(false); setAttempt((value) => value + 1);
  }}>{t('common.retry')}</Button></section>;
  if (!data) return <p role="status">{t('common.loading')}</p>;
  if (setup) return data.view.firstLaunchComplete ? <Navigate to="/library" replace /> : <FirstLaunch onComplete={() => {}} />;
  return data.view.firstLaunchComplete ? <LibraryPage initial={data} /> : <Navigate to="/setup" replace />;
}
