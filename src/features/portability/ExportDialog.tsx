import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Sheet } from '@shared/components';
import type { portabilityService } from './service';
import type { PackageKind } from '@domain/portability/package-schema';
type Prepared = Omit<Awaited<ReturnType<typeof portabilityService.prepareExport>>, 'kind'> & { kind: PackageKind; counts?: { procedures: number; groups: number; revisions: number; media: number; runs: number } };
export function ExportDialog({ prepared, close }: { prepared: Prepared; close(): void }) {
  const { t } = useTranslation(); const [url, setUrl] = useState(''); const [state, setState] = useState('prepared'); const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; const value = URL.createObjectURL(prepared.blob); queueMicrotask(() => { if (active) setUrl(value); }); return () => { active = false; URL.revokeObjectURL(value); }; }, [prepared]);
  let canShare = false; const file = new File([prepared.blob], prepared.name, { type: prepared.blob.type });
  try { canShare = Boolean(navigator.canShare?.({ files: [file] }) && navigator.share); } catch { /* Browser capability only. */ }
  async function share() { setBusy(true); try { await navigator.share({ files: [file], title: 'NurseFlow' }); setState('shared'); } catch (error) { setState(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError' ? 'cancelled' : 'deliveryError'); } finally { setBusy(false); } }
  return <Sheet open title={t('portable.filePrepared')} onClose={() => { if (!busy) close(); }}>
    <p>{prepared.name}</p><p>{prepared.kind === 'settings' ? t('backup.settingsOnly') : t('portable.exportCount', { count: prepared.count })} · {Math.ceil(prepared.blob.size / 1024)} kB</p>
    {prepared.kind === 'full' && prepared.counts && <p>{t('backup.counts', prepared.counts)}</p>}
    <p role="status">{t('portable.' + state)}</p><p className="nf-note">{t('portable.downloadNote')}</p>
    {[...new Set(prepared.warnings.map((issue) => issue.code))].map((code) => <p key={code}>{code} · {t('check.rules.' + code)}</p>)}
    {url && <a className="nf-button" href={url} download={prepared.name} onClick={() => setState('downloadRequested')}>{t('portable.download')}</a>}
    {canShare && <Button disabled={busy} disabledReason={t('common.loading')} onClick={() => { void share(); }}>{t('portable.share')}</Button>}
  </Sheet>;
}
