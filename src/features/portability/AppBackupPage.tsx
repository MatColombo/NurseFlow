import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@app/appearance-context';
import type { Settings } from '@domain/model';
import { PackageError } from '@domain/portability/zip';
import { candidates, type Candidate } from '@domain/portability/selection';
import { builderService } from '@features/builder/service';
import { Button, Dialog } from '@shared/components';
import { appBackupService } from './app-service';
import type { ParsedPackage } from './codec';
import { ExportDialog } from './ExportDialog';
import { ImportStorageEstimate } from './ImportStorageEstimate';
import { SettingsComparison } from './SettingsComparison';
import { ProcedurePreview } from './ProcedurePreview';
import './portability.css';
type Modal = 'additions' | 'replacement' | 'declined' | null;
export default function AppBackupPage() {
  const { t } = useTranslation(); const appearance = useAppearance(); const location = useLocation();
  const [tab, setTab] = useState<'export' | 'import'>('export'); const [kind, setKind] = useState<'settings' | 'full'>('settings');
  const [prepared, setPrepared] = useState<Awaited<ReturnType<typeof appBackupService.prepareExport>> | null>(null); const [preparedAt, setPreparedAt] = useState('');
  const [staged, setStaged] = useState<{ name: string; parsed: ParsedPackage; current: Settings } | null>(null); const inputFile = useRef<File | null>(null);
  const [replace, setReplace] = useState(false); const [modal, setModal] = useState<Modal>(null); const [busy, setBusy] = useState(false); const locking = useRef(false);
  const [error, setError] = useState<PackageError['code'] | 'unknown' | null>(null); const [operation, setOperation] = useState<'export' | 'stage' | 'commit' | 'review'>('export');
  const [result, setResult] = useState<(Awaited<ReturnType<typeof appBackupService.commit>> & { warnings: string[] }) | null>(null);
  const [preview, setPreview] = useState<Candidate | null>(null); const returnTo = useRef<{ top: number; anchor: HTMLElement | null }>({ top: 0, anchor: null });
  const full = staged?.parsed.manifest.packageKind === 'full'; const warnings = [...new Set([...(staged?.parsed.warnings.values() ?? [])].flat().map((issue) => issue.code))];
  const counts = staged?.parsed.manifest.counts; const bytes = staged?.parsed.records.mediaAssets.reduce((sum, asset) => sum + asset.bytes, 0) ?? 0;
  const items = staged ? candidates(staged.parsed.records, 'app', staged.name, staged.parsed.warnings) : [];
  const back = ['/setup', '/library'].includes(location.state?.dataReturn) ? location.state.dataReturn as string : '/settings';
  async function perform(type: typeof operation, action: () => Promise<void>) {
    if (locking.current) return; locking.current = true; setBusy(true); setError(null); setOperation(type);
    try { await action(); } catch (error) { setError(error instanceof PackageError ? error.code : 'unknown'); }
    finally { locking.current = false; setBusy(false); }
  }
  async function flush() { await appearance.flush(); await builderService.flush(); }
  function prepare() { void perform('export', async () => { await flush(); const file = await appBackupService.prepareExport(kind); setPrepared(file); setPreparedAt(new Date().toISOString()); }); }
  function stage(file: File) {
    inputFile.current = file; setStaged(null); setReplace(false); setModal(null); setResult(null);
    void perform('stage', async () => { await flush(); const parsed = await appBackupService.stage(file); const current = await appBackupService.currentSettings(); setStaged({ name: file.name, parsed, current }); });
  }
  function cancel() { setStaged(null); inputFile.current = null; setReplace(false); setModal(null); setError(null); }
  function dismiss() { if (locking.current) return; setError(null); if (modal === 'replacement' && full) { setReplace(false); setModal('declined'); } else setModal(null); }
  function commit(withSettings: boolean) { if (!staged) return; void perform('commit', async () => {
    await flush(); const saved = await appBackupService.commit(staged.parsed, { additions: full, ...(withSettings ? { replacement: { current: staged.current, confirmed: true } } : {}) });
    setResult({ ...saved, warnings }); setStaged(null); inputFile.current = null; setReplace(false); setModal(null); if (saved.settings) appearance.acceptCommitted(saved.settings);
  }); }
  function review() { void perform('review', async () => { await flush(); const current = await appBackupService.currentSettings(); setStaged((previous) => previous ? { ...previous, current } : null); setModal(null); setReplace(false); }); }
  function retry() { if (error === 'stale' || operation === 'review') review(); else if (operation === 'export') prepare(); else if (operation === 'stage' && inputFile.current) stage(inputFile.current); else if (operation === 'commit') commit(modal === 'replacement'); }
  const failure = error && <div role="alert" className="nf-stack"><p>{t(error === 'stale' ? 'backup.stale' : operation === 'export' ? 'portable.exportError' : 'backup.failure')}</p>
    {error === 'scope' ? <><p>{t('portable.wrongAppScope')}</p><Link className="nf-button" to="/data/procedures">{t('portable.goProcedures')}</Link></> : error !== 'unknown' && error !== 'stale' && <p>{t('portable.errors.' + error)}</p>}
    <Button disabled={busy} disabledReason={t('common.loading')} onClick={retry}>{t(error === 'stale' ? 'backup.review' : 'common.retry')}</Button></div>;
  const summary = staged && <div className="nf-stack"><p>{t('backup.counts', counts!)}</p><p>{t('backup.bytes', { value: Math.ceil(bytes / 1024) })}</p>
    {warnings.map((code) => <p key={code}>{code} · {t('check.rules.' + code)}</p>)}{warnings.includes('W08') && <p>{t('check.brokenRisk')}</p>}
    <ImportStorageEstimate bytes={bytes} /></div>;
  return <section className="nf-portable nf-stack" aria-labelledby="backup-title"><header className="nf-row"><Link className="nf-button" to={back} aria-label={t('common.back')}>‹</Link><h1 id="backup-title">{t('pages.11B')}</h1></header>
    <p className="nf-meta">{t('backup.local')}</p><p className="nf-meta">{preparedAt ? t('backup.preparedAt', { date: preparedAt }) : t('backup.never')}</p>
    <div className="nf-row" role="group" aria-label={t('pages.11B')}>{(['export', 'import'] as const).map((mode) => <Button key={mode} aria-pressed={tab === mode} disabled={busy} disabledReason={t('common.loading')} onClick={() => { setTab(mode); setError(null); }}>{t('portable.' + mode)}</Button>)}</div>
    {busy && <p role="status">{t('common.loading')}</p>}{!modal && failure}
    <div hidden={tab !== 'export'} className="nf-stack"><fieldset disabled={busy} className="nf-stack"><legend>{t('portable.export')}</legend>{(['settings', 'full'] as const).map((scope) => <label className="nf-card nf-choice" key={scope}><input type="radio" name="backup-scope" checked={kind === scope} onChange={() => setKind(scope)} /><span><strong>{t(scope === 'settings' ? 'backup.settingsOnly' : 'backup.full')}</strong><span className="nf-block">{t('backup.' + scope + 'Description')}</span></span></label>)}</fieldset>
      <Button variant="primary" disabled={busy} disabledReason={t('common.loading')} onClick={prepare}>{t('backup.prepare')}</Button></div>
    <div hidden={tab !== 'import'} className="nf-stack"><label className="nf-stack">{t('backup.chooseFile')}<input type="file" disabled={busy} accept=".nfsettings,.nfbackup,.nfproc,.nflib,.zip,application/zip" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) stage(file); }} /></label>
      {staged && <div className="nf-stack"><h2>{t(full ? 'backup.full' : 'backup.settingsOnly')}</h2><p>{staged.name}</p><p>{t('backup.exportedAt', { date: staged.parsed.manifest.exportedAt })}</p>
        {full && <>{summary}<p>{t('portable.addOnly')}</p><p>{t('portable.duplicatesNote')}</p><p className="nf-note">{t('backup.remote')}</p>
          <ul className="nf-list nf-stack">{staged.parsed.records.groups.map((group) => <li key={group.id}>{group.name}</li>)}</ul>
          <ul className="nf-list nf-stack">{items.map((item) => <li key={item.key} className="nf-card nf-stack"><strong>{item.procedure.title}</strong><Button aria-label={t('portable.previewNamed', { title: item.procedure.title })} onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); returnTo.current = { top: scrollY, anchor: event.currentTarget }; setPreview(item); }}>{t('portable.preview')}</Button></li>)}</ul>
          <label className="nf-choice"><input type="checkbox" checked={replace} onChange={(event) => setReplace(event.target.checked)} />{t('backup.replaceAlso')}</label>{!replace && <p>{t('backup.settingsKept')}</p>}</>}
        {(!full || replace) && <SettingsComparison current={staged.current} imported={staged.parsed.settings!} />}
        <Button variant="primary" disabled={busy || error === 'stale'} disabledReason={t(error === 'stale' ? 'backup.stale' : 'common.loading')} onClick={() => { setError(null); setModal(full ? 'additions' : 'replacement'); }}>{t(full ? 'backup.importFull' : 'backup.replace')}</Button>
        <Button disabled={busy} disabledReason={t('common.loading')} onClick={cancel}>{t('backup.cancelImport')}</Button></div>}
      {result && <section className="nf-card nf-stack" role="status"><h2>{t(result.procedureIds.length || result.runIds.length ? 'backup.complete' : result.settings ? 'backup.replaced' : 'backup.complete')}</h2><p>{t('backup.result', { procedures: result.procedureIds.length, runs: result.runIds.length })}</p><p>{t(result.settings ? 'backup.resultReplaced' : 'backup.resultKept')}</p><Link to="/library">{t('portable.goLibrary')}</Link>
        {result.warnings.map((code) => <p key={code}>{code} · {t('check.rules.' + code)}</p>)}{result.warnings.includes('W08') && <p>{t('check.brokenRisk')}</p>}
        {result.runIds.map((id, index) => <Link key={id} to={'/run/' + encodeURIComponent(id)}>{t('backup.resume', { count: index + 1 })}</Link>)}</section>}
    </div>
    <Dialog key={modal ?? 'closed'} open={modal !== null} title={t(modal === 'replacement' ? 'backup.confirmReplace' : modal === 'declined' ? 'backup.declinedTitle' : 'backup.confirmFull')} onClose={dismiss}>
      {modal === 'declined' ? <><p>{t('backup.declined')}</p><Button onClick={() => { setReplace(false); setModal('additions'); }}>{t('backup.withoutSettings')}</Button><Button autoFocus onClick={() => { setModal(null); setError(null); }}>{t('backup.cancelAll')}</Button></> : <>
        {summary}{modal === 'replacement' && staged ? <><p>{t('backup.warning')}</p><SettingsComparison current={staged.current} imported={staged.parsed.settings!} /></> : <><p>{t('portable.addOnly')}</p><p>{t(replace ? 'backup.additionsFirst' : 'backup.settingsKept')}</p></>}
        {failure}<div className="nf-row"><Button autoFocus disabled={busy} disabledReason={t('common.loading')} onClick={dismiss}>{t('common.cancel')}</Button><Button variant="primary" disabled={busy || error === 'stale'} disabledReason={t(error === 'stale' ? 'backup.stale' : 'common.loading')} onClick={() => { if (modal === 'replacement') commit(true); else if (replace) setModal('replacement'); else commit(false); }}>{t(modal === 'replacement' ? full ? 'backup.confirmBoth' : 'backup.confirmReplace' : replace ? 'backup.nextConsent' : 'portable.confirmAdd')}</Button></div>
      </>}
    </Dialog>
    {preview && staged && <ProcedurePreview item={preview} assets={staged.parsed.records.mediaAssets} close={() => { setPreview(null); requestAnimationFrame(() => { returnTo.current.anchor?.focus({ preventScroll: true }); scrollTo({ top: returnTo.current.top, behavior: 'instant' }); }); }} />}
    {prepared && <ExportDialog prepared={prepared} close={() => setPrepared(null)} />}
  </section>;
}
