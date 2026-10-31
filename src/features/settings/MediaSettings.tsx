import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings } from '@domain/model';
import { mediaService } from '@features/step-editor/media/service';
import { Button, Card } from '@shared/components';
export function MediaSettings() {
  const { t } = useTranslation(); const [settings, setSettings] = useState<Settings | null>(null); const [failure, setFailure] = useState(false); const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Settings | null>(null);
  useEffect(() => { let active = true; void mediaService.settings().then((value) => { if (active) setSettings(value); }, () => { if (active) setFailure(true); }); return () => { active = false; }; }, []);
  async function save(next: Settings) {
    const before = settings; setSettings(next); setPending(next); setBusy(true);
    try { const saved = await mediaService.saveSettings(next); setSettings(saved); setFailure(false); setPending(null); }
    catch { setSettings(before); setFailure(true); } finally { setBusy(false); }
  }
  return <Card><section className="nf-stack" aria-label={t('media.settingsTitle')}><h3>{t('media.settingsTitle')}</h3>
    {failure && <div role="alert">{t('media.settingsError')}<Button disabled={busy} disabledReason={t('common.loading')} onClick={() => { if (pending) void save(pending); else void mediaService.settings().then((value) => { setSettings(value); setFailure(false); }, () => setFailure(true)); }}>{t('common.retry')}</Button></div>}
    {settings && <fieldset disabled={busy} className="nf-stack nf-metadata-fields">
      <label className="nf-choice"><input type="checkbox" checked={settings.mediaAddSoftLimit.enabled} onChange={(event) => { void save({ ...settings, mediaAddSoftLimit: { ...settings.mediaAddSoftLimit, enabled: event.target.checked } }); }} />{t('media.softLimit')}</label>
      <label className="nf-stack">{t('media.max')}<select value={settings.mediaAddSoftLimit.max} onChange={(event) => { void save({ ...settings, mediaAddSoftLimit: { ...settings.mediaAddSoftLimit, max: Number(event.target.value) } }); }}>{Array.from({ length: 32 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
      <label className="nf-stack">{t('media.defaultPreset')}<select value={settings.photoPreset} onChange={(event) => { void save({ ...settings, photoPreset: event.target.value as Settings['photoPreset'] }); }}>{(['small', 'medium', 'high', 'original'] as const).map((preset) => <option key={preset} value={preset}>{t('media.' + preset)}</option>)}</select></label>
    </fieldset>}
  </section></Card>;
}
