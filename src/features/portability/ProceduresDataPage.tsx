import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@app/appearance-context';
import { candidates, emptyPortableFilters, visibleCandidates, type Candidate } from '@domain/portability/selection';
import type { MediaAsset } from '@domain/model';
import { PackageError } from '@domain/portability/zip';
import { Button } from '@shared/components';
import { portabilityService, type PortableLibrary } from './service';
import { ProcedurePicker } from './ProcedurePicker';
import { ProcedurePreview } from './ProcedurePreview';
import { ImportSection } from './ImportSection';
import { ExportDialog } from './ExportDialog';
import './portability.css';
export default function ProceduresDataPage() {
  const { t } = useTranslation(); const location = useLocation(); const [data, setData] = useState<PortableLibrary | null>(null); const [failed, setFailed] = useState(false);
  const load = useCallback(() => { void portabilityService.list().then((value) => { setData(value); setFailed(false); }, () => setFailed(true)); }, []);
  useEffect(() => { load(); }, [load]);
  const back = ['/setup', '/library'].includes(location.state?.dataReturn) ? location.state.dataReturn as string : '/settings';
  return <section className="nf-portable nf-stack" aria-labelledby="portable-title"><header className="nf-row"><Link className="nf-button" to={back} aria-label={t('common.back')}>‹</Link><h1 id="portable-title">{t('pages.11A')}</h1></header>
    {failed && <div role="alert" className="nf-stack"><p>{t('portable.loadError')}</p><Button onClick={load}>{t('common.retry')}</Button></div>}
    {data ? <DataContent data={data} imported={load} /> : !failed && <p role="status">{t('common.loading')}</p>}
  </section>;
}
function DataContent({ data, imported }: { data: PortableLibrary; imported(): void }) {
  const { t } = useTranslation(); const { preferences } = useAppearance(); const [query] = useSearchParams();
  const [tab, setTab] = useState<'export' | 'import'>('export'); const [filters, setFilters] = useState(emptyPortableFilters);
  const [selected, setSelected] = useState(() => new Set(data.procedures.filter((procedure) => procedure.id === query.get('procedure')).map((procedure) => JSON.stringify(['local', procedure.id]))));
  const [preview, setPreview] = useState<{ item: Candidate; assets: readonly MediaAsset[] } | null>(null); const returnTo = useRef<{ top: number; anchor: HTMLElement | null }>({ top: 0, anchor: null });
  const [prepared, setPrepared] = useState<Awaited<ReturnType<typeof portabilityService.prepareExport>> | null>(null);
  const [busy, setBusy] = useState(false); const locking = useRef(false); const [error, setError] = useState<PackageError['code'] | 'unknown' | null>(null); const retry = useRef<(() => Promise<void>) | null>(null);
  const items = candidates(data, 'local', ''); const visible = visibleCandidates(items, filters, preferences.locale); const chosen = items.filter((item) => selected.has(item.key));
  async function perform(operation: () => Promise<void>) { if (locking.current) return; locking.current = true; setBusy(true); setError(null);
    try { await operation(); retry.current = null; } catch (failure) { retry.current = operation; setError(failure instanceof PackageError ? failure.code : 'unknown'); } finally { locking.current = false; setBusy(false); } }
  function remember() { returnTo.current = { top: window.scrollY, anchor: document.activeElement instanceof HTMLElement ? document.activeElement : null }; }
  function closePreview() { setPreview(null); requestAnimationFrame(() => { returnTo.current.anchor?.focus({ preventScroll: true }); window.scrollTo({ top: returnTo.current.top, behavior: 'instant' }); }); }
  return <>
    <div className="nf-row" role="group" aria-label={t('pages.11A')}><Button aria-pressed={tab === 'export'} onClick={() => setTab('export')}>{t('portable.export')}</Button><Button aria-pressed={tab === 'import'} onClick={() => setTab('import')}>{t('portable.import')}</Button></div>
    {error && <div role="alert" className="nf-stack"><p>{t('portable.exportError')}</p>{error !== 'unknown' && <p>{t('portable.errors.' + error)}</p>}<Button disabled={busy} disabledReason={t('common.loading')} onClick={() => { if (retry.current) void perform(retry.current); }}>{t('common.retry')}</Button></div>}
    <div hidden={tab !== 'export'} className="nf-stack">
      <Button variant="primary" disabled={busy || !items.length} disabledReason={t(busy ? 'common.loading' : 'portable.empty')} onClick={() => { void perform(async () => { setPrepared(await portabilityService.prepareExport()); }); }}>{t('portable.exportAll')}</Button>
      {busy && <p role="status">{t('portable.preparing')}</p>}
      <ProcedurePicker items={items} visible={visible} filters={filters} changeFilters={setFilters} selected={selected} select={setSelected} local={data.procedures} preview={(item) => { remember(); void perform(async () => {
        const records = await portabilityService.preview(item.procedure.id); setPreview({ item: candidates(records, 'local', '')[0]!, assets: records.mediaAssets });
      }); }} />
      <footer className="nf-stack"><p>{t('portable.selected', { count: chosen.length })}</p><Button variant="primary" disabled={busy || !chosen.length} disabledReason={t(busy ? 'common.loading' : 'portable.noSelection')}
        onClick={() => { void perform(async () => { setPrepared(await portabilityService.prepareExport(chosen.map((item) => item.procedure.id))); }); }}>{t('portable.exportSelected')}</Button></footer>
    </div>
    <div hidden={tab !== 'import'}><ImportSection local={data.procedures} imported={imported} preview={(item, assets) => { remember(); setPreview({ item, assets }); }} /></div>
    {preview && <ProcedurePreview item={preview.item} assets={preview.assets} close={closePreview} />}
    {prepared && <ExportDialog prepared={prepared} close={() => setPrepared(null)} />}
  </>;
}
