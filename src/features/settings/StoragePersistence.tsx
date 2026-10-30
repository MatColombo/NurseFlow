import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components';
import { libraryService } from '@features/library/service';
import type { LibraryViewState } from '@domain/model';

export function StoragePersistence() {
  const { t } = useTranslation(); const [status, setStatus] = useState<LibraryViewState['persistenceStatus']>('not-requested');
  useEffect(() => { void libraryService.persistenceStatus().then(setStatus, () => setStatus('error')); }, []);
  return <section className="nf-card nf-stack" aria-label={t('persistence.title')}>
    <h3>{t('persistence.title')}</h3><p role="status">{t(`persistence.${status}`)}</p><p className="nf-note">{t('persistence.backup')}</p>
    {status !== 'granted' && status !== 'unsupported' && <Button onClick={() => {
      void libraryService.requestPersistence().then(setStatus, () => setStatus('error'));
    }}>{t('common.retry')}</Button>}
  </section>;
}
