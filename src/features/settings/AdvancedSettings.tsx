import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@app/appearance-context';
import { Button, Sheet } from '@shared/components';
import { settingsService, type LocalInventory } from './service';
import { applicationService } from './application-service';
export function AdvancedSettings() {
  const { t } = useTranslation(); const navigate = useNavigate(); const appearance = useAppearance();
  const [expanded, setExpanded] = useState(false); const [sheet, setSheet] = useState<'reset' | 'review' | 'final' | null>(null);
  const [inventory, setInventory] = useState<LocalInventory | null>(null); const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const locking = useRef(false); const cancel = useRef<HTMLButtonElement>(null);
  const failed = useRef<(() => Promise<void>) | null>(null);
  useEffect(() => { if (!sheet) return; const frame = requestAnimationFrame(() => cancel.current?.focus()); return () => cancelAnimationFrame(frame); }, [sheet]);
  async function perform(operation: () => Promise<void>) {
    if (locking.current) return; locking.current = true; setBusy(true); setError(null);
    try { await operation(); failed.current = null; } catch (failure) {
      failed.current = operation; setError(failure instanceof Error && failure.message.includes('Local data changed') ? 'settings.changed' : 'settings.operationError');
    } finally { locking.current = false; setBusy(false); }
  }
  const close = () => { if (!locking.current) { setSheet(null); setAcknowledged(false); setError(null); } };
  const review = () => perform(async () => { await appearance.flush(); setInventory(await settingsService.inventory()); setAcknowledged(false); setSheet('review'); });
  const errorView = error && <div className="nf-stack" role="alert"><p>{t(error)}</p><Button onClick={() => {
    if (error === 'settings.changed') void review(); else if (failed.current) void perform(failed.current);
  }} disabled={busy} disabledReason={t('common.loading')}>{t(error === 'settings.changed' ? 'settings.reviewAgain' : 'common.retry')}</Button></div>;
  return <section className="nf-settings-advanced nf-stack">
    <Button className="nf-preference" aria-expanded={expanded} aria-controls="settings-advanced" onClick={() => setExpanded(!expanded)}>{t('settings.advanced')} {expanded ? '⌄' : '›'}</Button>
    {expanded && <div id="settings-advanced" className="nf-stack">{!sheet && errorView}
      <Button disabled={busy} disabledReason={t('common.loading')} onClick={() => { setError(null); setSheet('reset'); }}>{t('settings.resetLayout')}</Button>
      <Button variant="danger" disabled={busy} disabledReason={t('common.loading')} onClick={() => { void review(); }}>{t('settings.clear')}</Button>
    </div>}
    <Sheet open={sheet !== null} title={t(sheet === 'reset' ? 'settings.resetLayout' : sheet === 'final' ? 'settings.finalClear' : 'settings.clear')} onClose={close}>
      {sheet === 'reset' ? <p>{t('settings.resetDetails')}</p> : <>
        <p>{t('settings.clearDetails')}</p>{inventory && <p>{t('settings.inventory', inventory)}</p>}
        <p>{t('settings.backupBefore')}</p>
        <Link to="/data/app" className="nf-button" state={{ dataReturn: '/settings' }}>{t('settings.exportBefore')}</Link>
        {sheet === 'final' && <label className="nf-choice"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.currentTarget.checked)} />{t('settings.clearAck')}</label>}
      </>}
      {errorView}
      <div className="nf-row"><Button ref={cancel} disabled={busy} disabledReason={t('common.loading')} onClick={close}>{t('common.cancel')}</Button>
        {sheet === 'reset' ? <Button disabled={busy} disabledReason={t('common.loading')} onClick={() => { void perform(async () => { await settingsService.resetLayout(true); setSheet(null); }); }}>{t('settings.resetLayout')}</Button> :
          sheet === 'review' ? <Button variant="danger" disabled={busy} disabledReason={t('common.loading')} onClick={() => setSheet('final')}>{t('settings.continueClear')}</Button> :
            <Button variant="danger" disabled={busy || !acknowledged} disabledReason={t(busy ? 'common.loading' : 'settings.needAck')} onClick={() => { void perform(async () => {
              if (!inventory || !acknowledged) return;
              applicationService.later(); await appearance.flush(); const defaults = await settingsService.clear(inventory.token, true);
              appearance.acceptCommitted(defaults); void navigate('/setup', { replace: true });
            }); }}>{t('settings.confirmClear')}</Button>}
      </div>
    </Sheet>
  </section>;
}
