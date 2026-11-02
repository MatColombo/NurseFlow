import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings } from '@domain/model';
import { mediaService } from '@features/step-editor/media/service';
import { Button, Card, Sheet } from '@shared/components';
export function MediaSettings() {
  const { t } = useTranslation(); const name = useId(); const [settings, setSettings] = useState<Settings | null>(null);
  const [failure, setFailure] = useState(false); const [busy, setBusy] = useState(false); const locking = useRef(false);
  const [pending, setPending] = useState<Settings | null>(null); const [picker, setPicker] = useState<'limit' | 'quality' | null>(null);
  useEffect(() => { let active = true; void mediaService.settings().then((value) => { if (active) setSettings(value); }, () => { if (active) setFailure(true); }); return () => { active = false; }; }, []);
  async function save(next: Settings) {
    if (locking.current) return; locking.current = true; setPending(next); setBusy(true);
    try { setSettings(await mediaService.saveSettings(next)); setFailure(false); setPending(null); }
    catch { setFailure(true); } finally { locking.current = false; setBusy(false); }
  }
  function changePreset(event: ChangeEvent<HTMLInputElement>) {
    const preset = event.currentTarget.value;
    if (settings && (preset === 'small' || preset === 'medium' || preset === 'high' || preset === 'original')) void save({ ...settings, photoPreset: preset });
  }
  const error = failure && <div role="alert" className="nf-stack">{t('media.settingsError')}<Button disabled={busy} disabledReason={t('common.loading')} onClick={() => {
    if (pending) void save(pending); else void mediaService.settings().then((value) => { setSettings(value); setFailure(false); }, () => setFailure(true));
  }}>{t('common.retry')}</Button></div>;
  return <Card><section className="nf-stack" aria-label={t('media.settingsTitle')}><h3>{t('media.settingsTitle')}</h3>
    {!picker && error}
    {settings && <>
      <Button className="nf-preference" onClick={() => setPicker('limit')} aria-haspopup="dialog"><span>{t('media.max')}</span><span>{settings.mediaAddSoftLimit.enabled ? t('settings.onCount', { count: settings.mediaAddSoftLimit.max }) : t('settings.off')} ›</span></Button>
      <Button className="nf-preference" onClick={() => setPicker('quality')} aria-haspopup="dialog"><span>{t('media.defaultPreset')}</span><span>{t('media.' + settings.photoPreset)} ›</span></Button>
    </>}
    <Sheet open={picker !== null} title={t(picker === 'limit' ? 'media.max' : 'media.defaultPreset')} onClose={() => setPicker(null)}>
      {error}<p className="nf-note">{t('settings.futureMedia')}</p>
      {settings && <fieldset disabled={busy} className="nf-stack nf-settings-fields">
        {picker === 'limit' ? <>
          <label className="nf-choice"><input type="checkbox" checked={settings.mediaAddSoftLimit.enabled} onChange={(event) => { void save({ ...settings, mediaAddSoftLimit: { ...settings.mediaAddSoftLimit, enabled: event.target.checked } }); }} />{t('media.softLimit')}</label>
          {settings.mediaAddSoftLimit.enabled && <label className="nf-stack">{t('media.max')}<select value={settings.mediaAddSoftLimit.max} onChange={(event) => { void save({ ...settings, mediaAddSoftLimit: { ...settings.mediaAddSoftLimit, max: Number(event.target.value) } }); }}>{Array.from({ length: 32 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>}
        </> : (['small', 'medium', 'high', 'original'] as const).map((preset) => <label key={preset} className="nf-choice"><input type="radio" name={name} value={preset} checked={settings.photoPreset === preset} onChange={changePreset} />{t('media.' + preset)}</label>)}
      </fieldset>}
    </Sheet>
  </section></Card>;
}
