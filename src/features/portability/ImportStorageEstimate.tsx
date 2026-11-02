import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readStorageInfo, type StorageInfo } from '@features/settings/browser-storage';
/** Advisory only: browser estimates can change before the atomic commit. */
export function ImportStorageEstimate({ bytes }: { bytes: number }) {
  const { t, i18n } = useTranslation(); const [info, setInfo] = useState<StorageInfo | null>(null);
  useEffect(() => { let active = true; void readStorageInfo().then((value) => { if (active) setInfo(value); }); return () => { active = false; }; }, []);
  const estimate = info?.estimate; const remaining = estimate?.quota === undefined ? undefined : Math.max(0, estimate.quota - estimate.usage);
  const mb = (value: number) => new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 1 }).format(value / 1024 ** 2);
  return <div className="nf-stack nf-note" role="note">
    <p>{!info ? t('common.loading') : estimate ? t('portable.spaceUsage', { value: mb(estimate.usage) }) : t('portable.spaceUnknown')}</p>
    {remaining !== undefined && <p>{t('portable.spaceRemaining', { value: mb(remaining) })}</p>}
    {remaining !== undefined && bytes > remaining && <p>{t('portable.spaceLow')}</p>}
    <p>{t('portable.spaceNote')}</p>
  </div>;
}
