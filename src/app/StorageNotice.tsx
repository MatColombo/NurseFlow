import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { storageLifecycle } from '@storage/lifecycle';

export function StorageNotice() {
  const status = useSyncExternalStore(storageLifecycle.subscribe, storageLifecycle.getSnapshot);
  const { t } = useTranslation();
  return status === 'ready' ? null : <p role="alert">{t('settings.database.' + status)}</p>;
}
