import { useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { version } from '../../../package.json';
import { Button, Sheet } from '@shared/components';
import { applicationService } from './application-service';
import { offlineService } from './offline-service';
export function ApplicationControls() {
  const { t } = useTranslation(); const snapshot = useSyncExternalStore(applicationService.subscribe, applicationService.getSnapshot);
  const [sheet, setSheet] = useState<'updates' | 'about' | 'install' | null>(null);
  const offline = useSyncExternalStore(offlineService.subscribe, offlineService.getSnapshot);
  useEffect(() => { void offlineService.check(); }, []);
  const waiting = snapshot.update === 'available' || snapshot.update === 'deferred';
  return <section className="nf-settings-section nf-stack" aria-label={t('settings.application')}>
    <h3>{t('settings.application')}</h3>
    <p role="status">{t('settings.cache.' + offline)}</p>
    {(offline === 'error' || offline === 'incomplete') && <Button onClick={() => { void offlineService.check(); }}>{t('common.retry')}</Button>}
    <Button className="nf-preference" onClick={() => { setSheet('updates'); void applicationService.check(); }}><span>{t('settings.checkUpdates')}</span><span>{snapshot.update !== 'idle' && t('settings.update.' + snapshot.update)} ›</span></Button>
    {snapshot.installAvailable && <Button className="nf-preference" onClick={() => { setSheet('install'); void applicationService.install(); }}>{t('settings.install')} ›</Button>}
    <Button className="nf-preference" onClick={() => setSheet('about')}>{t('settings.about')} ›</Button>
    <Sheet open={sheet !== null} title={t(sheet === 'about' ? 'settings.about' : sheet === 'install' ? 'settings.install' : 'settings.checkUpdates')} onClose={() => setSheet(null)}>
      {sheet === 'about' ? <><p>NurseFlow · {version}</p><p>{t(snapshot.online ? 'settings.online' : 'settings.offline')}</p><p>{t('settings.aboutDetails')}</p><p>{t('settings.cacheNote')}</p><p>{t('settings.installHelp')}</p></> :
        sheet === 'install' ? <><p role="status">{t('settings.installResult.' + snapshot.installResult)}</p><p>{t('settings.installNote')}</p></> : <>
          <p role="status">{t('settings.update.' + snapshot.update)}</p>
          {waiting && <><p>{t('settings.idleNote')}</p><div className="nf-row"><Button onClick={() => { applicationService.later(); setSheet(null); }}>{t('settings.later')}</Button>
            <Button onClick={() => applicationService.defer()}>{t('settings.updateWhenIdle')}</Button></div></>}
          {(snapshot.update === 'error' || snapshot.update === 'offline') && <Button onClick={() => { void applicationService.check(); }}>{t('common.retry')}</Button>}
        </>}
    </Sheet>
  </section>;
}
