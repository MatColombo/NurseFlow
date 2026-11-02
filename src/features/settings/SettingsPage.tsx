import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppearanceSettings } from './AppearanceSettings';
import { MediaSettings } from './MediaSettings';
import { StoragePersistence } from './StoragePersistence';
import { ApplicationControls } from './ApplicationControls';
import { AdvancedSettings } from './AdvancedSettings';
import './settings.css';
export function SettingsPage() {
  const { t } = useTranslation();
  return <section className="nf-settings-page nf-stack" aria-labelledby="settings-title">
    <header className="nf-row"><Link className="nf-button" to="/library" aria-label={t('common.back')}>‹</Link><h1 id="settings-title">{t('pages.10')}</h1></header>
    <AppearanceSettings /><MediaSettings /><StoragePersistence /><ApplicationControls /><AdvancedSettings />
  </section>;
}
