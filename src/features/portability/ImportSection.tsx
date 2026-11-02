import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Candidate, PortableFilters } from '@domain/portability/selection';
import { emptyPortableFilters, changeSelection, visibleCandidates } from '@domain/portability/selection';
import { subsetRecords } from '@domain/portability/validation';
import type { MediaAsset, Procedure } from '@domain/model';
import { useAppearance } from '@app/appearance-context';
import { Button, Dialog } from '@shared/components';
import { ProcedurePicker } from './ProcedurePicker';
import { ImportStorageEstimate } from './ImportStorageEstimate';
import { portabilityService, stagedCandidates, type StagedFile, type FileFailure } from './service';
export function ImportSection({ local, preview, imported }: { local: readonly Procedure[]; preview(item: Candidate, assets: readonly MediaAsset[]): void; imported(): void }) {
  const { t } = useTranslation(); const { preferences } = useAppearance();
  const [files, setFiles] = useState<StagedFile[]>([]); const [rejected, setRejected] = useState<FileFailure[]>([]);
  const [selected, setSelected] = useState(new Set<string>()); const [filters, setFilters] = useState<PortableFilters>(emptyPortableFilters);
  const [busy, setBusy] = useState<'stage' | 'commit' | null>(null); const locking = useRef(false); const [error, setError] = useState(false); const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<{ count: number; excluded: number; warnings: string[] } | null>(null);
  const items = stagedCandidates(files); const visible = visibleCandidates(items, filters, preferences.locale);
  const subsets = files.map((file) => subsetRecords(file.parsed.records, new Set(file.parsed.records.procedures.filter((procedure) => selected.has(JSON.stringify([file.id, procedure.id]))).map((procedure) => procedure.id))));
  const chosen = items.filter((item) => selected.has(item.key)); const groups = subsets.reduce((sum, records) => sum + records.groups.length, 0); const bytes = subsets.reduce((sum, records) => sum + records.mediaAssets.reduce((size, asset) => size + asset.bytes, 0), 0);
  const warningCodes = [...new Set(chosen.flatMap((item) => item.warnings.map((issue) => issue.code)))];
  async function stage(added: File[]) {
    if (locking.current) return; locking.current = true; setBusy('stage'); setError(false); setResult(null);
    try { const staged = await portabilityService.stage(added, files.reduce((sum, file) => sum + file.bytes, 0), files.length);
      setFiles((previous) => [...previous, ...staged.valid]); setRejected((previous) => [...previous, ...staged.rejected]);
      setSelected((previous) => changeSelection(previous, stagedCandidates(staged.valid).map((item) => item.key), true));
    } catch { setError(true); } finally { setBusy(null); locking.current = false; }
  }
  async function commit() {
    if (locking.current || !chosen.length) return; locking.current = true; setBusy('commit'); setError(false);
    try {
      const saved = await portabilityService.importSelected(files, selected, true);
      setResult({ count: saved.procedureIds.length, excluded: items.length - chosen.length, warnings: warningCodes });
      setFiles([]); setRejected([]); setSelected(new Set()); setFilters(emptyPortableFilters()); setConfirm(false); imported();
    } catch { setError(true); } finally { setBusy(null); locking.current = false; }
  }
  const errorView = error && <div role="alert" className="nf-stack"><p>{t('portable.importError')}</p>{confirm && <Button disabled={busy !== null} disabledReason={t('common.loading')} onClick={() => { void commit(); }}>{t('common.retry')}</Button>}</div>;
  return <section className="nf-stack" aria-label={t('portable.import')}>
    <label className="nf-stack">{t('portable.chooseFiles')}<input type="file" multiple disabled={busy !== null} accept=".nfproc,.nflib,.nfsettings,.nfbackup,.zip,application/zip" onChange={(event) => { const added = [...(event.currentTarget.files ?? [])]; event.currentTarget.value = ''; if (added.length) void stage(added); }} /></label>
    {busy === 'stage' && <p role="status">{t('portable.staging')}</p>}{!confirm && errorView}
    {rejected.map((failure) => <div role="alert" className="nf-card nf-stack" key={failure.id}><strong>{failure.name}</strong><p>{t('portable.errors.' + failure.code)}</p>
      {failure.code === 'scope' && <Link className="nf-button" to="/data/app">{t('portable.goApp')}</Link>}
      <Button onClick={() => setRejected((previous) => previous.filter((item) => item.id !== failure.id))}>{t('portable.removeFile')}</Button></div>)}
    {files.map((file) => <div className="nf-card nf-stack" key={file.id}><p>{file.name} · {file.parsed.records.procedures.length}</p><Button disabled={busy !== null} disabledReason={t('common.loading')} onClick={() => {
      setFiles((previous) => previous.filter((item) => item.id !== file.id)); setSelected((previous) => changeSelection(previous, items.filter((item) => item.fileId === file.id).map((item) => item.key), false));
    }}>{t('portable.removeFile')}</Button></div>)}
    {items.length > 0 && <ProcedurePicker items={items} visible={visible} filters={filters} changeFilters={setFilters} selected={selected} select={setSelected} local={local}
      preview={(item) => preview(item, files.find((file) => file.id === item.fileId)!.parsed.records.mediaAssets)} />}
    {items.length > 0 && <Button variant="primary" disabled={busy !== null || chosen.length === 0} disabledReason={t(busy ? 'common.loading' : 'portable.noSelection')} onClick={() => { setError(false); setConfirm(true); }}>{t('portable.importSelected')}</Button>}
    {result && <section className="nf-card nf-stack" role="status"><h2>{t('portable.imported', { count: result.count })}</h2><p>{t('portable.excluded', { count: result.excluded })}</p>
      {result.warnings.map((code) => <p key={code}>{code} · {t('check.rules.' + code)}</p>)}<Link to="/library">{t('portable.goLibrary')}</Link><Button onClick={() => setResult(null)}>{t('portable.importMore')}</Button></section>}
    <Dialog open={confirm} title={t('portable.confirmImport')} onClose={() => { if (!locking.current) { setConfirm(false); setError(false); } }}>
      <p>{t('portable.confirmCounts', { count: chosen.length, groups, ready: chosen.filter((item) => item.procedure.readyRevisionId).length, drafts: chosen.filter((item) => item.procedure.workingDraftId).length, bytes: Math.ceil(bytes / 1024) })}</p>
      <p>{t('portable.fileCounts', { valid: files.length, invalid: rejected.length })}</p><p>{t('portable.addOnly')}</p><p>{t('portable.duplicatesNote')}</p>
      <ImportStorageEstimate bytes={bytes} />
      {warningCodes.map((code) => <p key={code}>{code} · {t('check.rules.' + code)}</p>)}{warningCodes.includes('W08') && <p>{t('check.brokenRisk')}</p>}
      {errorView}<div className="nf-row"><Button autoFocus disabled={busy !== null} disabledReason={t('common.loading')} onClick={() => { setConfirm(false); setError(false); }}>{t('common.cancel')}</Button>
        <Button variant="primary" disabled={busy !== null} disabledReason={t('common.loading')} onClick={() => { void commit(); }}>{t('portable.confirmAdd')}</Button></div>
    </Dialog>
  </section>;
}
