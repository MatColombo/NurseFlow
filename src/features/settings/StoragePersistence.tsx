import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Sheet } from '@shared/components';
import { readStorageInfo, requestStorageProtection, type StorageInfo } from './browser-storage';
export function StoragePersistence() {
  const { t, i18n } = useTranslation(); const [info, setInfo] = useState<StorageInfo | null>(null); const [sheet, setSheet] = useState<'protection' | 'usage' | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; void readStorageInfo().then((value) => { if (active) setInfo(value); }); return () => { active = false; }; }, []);
  const bytes = (value: number) => {
    const exponent = value >= 1024 ** 3 ? 3 : value >= 1024 ** 2 ? 2 : value >= 1024 ? 1 : 0;
    return new Intl.NumberFormat(i18n.resolvedLanguage, { style: 'unit', unit: ['byte', 'kilobyte', 'megabyte', 'gigabyte'][exponent]!, maximumFractionDigits: 1 }).format(value / 1024 ** exponent);
  };
  return <section className="nf-settings-section nf-stack" aria-label={t('settings.local')}>
    <h3>{t('settings.local')}</h3>
    <Link className="nf-button nf-preference" to="/data/procedures"><span>{t('pages.11A')}</span><span aria-hidden="true">›</span></Link>
    <Link className="nf-button nf-preference" to="/data/app"><span>{t('pages.11B')}</span><span aria-hidden="true">›</span></Link>
    <Button className="nf-preference" onClick={() => setSheet('protection')}><span>{t('settings.protection')}</span><span>{t('settings.storage.' + (info?.protection ?? 'loading'))} ›</span></Button>
    <Button className="nf-preference" onClick={() => setSheet('usage')}><span>{t('settings.usage')}</span><span>{info?.estimate ? '≈ ' + bytes(info.estimate.usage) : t('settings.storage.unavailable')} ›</span></Button>
    <Sheet open={sheet !== null} title={t(sheet === 'protection' ? 'settings.protection' : 'settings.usage')} onClose={() => setSheet(null)}>
      {sheet === 'protection' ? <><p role="status">{t('settings.storage.' + (info?.protection ?? 'loading'))}</p><p>{t('persistence.backup')}</p>
        {info?.canRequest && <Button disabled={busy} disabledReason={t('common.loading')} onClick={() => { setBusy(true); void requestStorageProtection().then(setInfo).finally(() => setBusy(false)); }}>{t('settings.requestProtection')}</Button>}</> :
        <><p>{info?.estimate ? '≈ ' + bytes(info.estimate.usage) : t('settings.storage.unavailable')}</p>{info?.estimate?.quota !== undefined && <p>{t('settings.quota', { value: bytes(info.estimate.quota) })}</p>}<p>{t('settings.estimateNote')}</p></>}
    </Sheet>
  </section>;
}
