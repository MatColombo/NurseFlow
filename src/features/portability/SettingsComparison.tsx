import { useTranslation } from 'react-i18next';
import type { Settings } from '@domain/model';
import { settingsChanges } from '@domain/portability/settings';
export function SettingsComparison({ current, imported }: { current: Settings; imported: Settings }) {
  const { t } = useTranslation(); const changed = settingsChanges(current, imported);
  const labels = { locale: t('appearance.language'), theme: t('appearance.theme'), uiScalePt: t('appearance.scale'), photoPreset: t('media.defaultPreset'), mediaAddSoftLimit: t('media.max') };
  function value(settings: Settings, key: typeof changed[number]) {
    switch (key) {
      case 'locale': return settings.locale === 'it' ? 'Italiano' : 'English';
      case 'theme': return t('appearance.' + settings.theme);
      case 'uiScalePt': return t('appearance.points', { value: settings.uiScalePt });
      case 'photoPreset': return t('media.' + settings.photoPreset);
      case 'mediaAddSoftLimit': return (settings.mediaAddSoftLimit.enabled ? 'On' : 'Off') + ' · ' + t('backup.max', { count: settings.mediaAddSoftLimit.max });
    }
  }
  return <section className="nf-stack" aria-label={t('backup.compare')}><h3>{t('backup.compare')}</h3>{!changed.length && <p>{t('backup.noChanges')}</p>}
    {changed.map((key) => <div className="nf-card nf-stack" key={key}><h4>{labels[key]}</h4><p>{t('backup.current')}: <span>{value(current, key)}</span></p><p>→ {t('backup.imported')}: <span>{value(imported, key)}</span></p></div>)}
  </section>;
}
