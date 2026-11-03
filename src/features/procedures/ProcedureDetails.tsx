import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { procedureState } from '@domain/procedures';
import { libraryFiltersSchema } from '@domain/library';
import { Button, Sheet } from '@shared/components';
import { Identity } from '@features/library/ProcedureRow';
import { libraryService } from '@features/library/service';
import { MetadataSheet } from './MetadataSheet';
import { procedureService, type ProcedureDetails as Details } from './service';
import './procedures.css';

export function ProcedureDetails() {
  const location = useLocation(); const fromMap = useRef(Boolean(location.state?.mapDetailsReturn));
  const { id = '' } = useParams(); const { t } = useTranslation(); const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void procedureService.load(id, !fromMap.current).then((loaded) => { if (active) setDetails(loaded); }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, attempt]);
  if (error) return <section className="nf-stack" aria-label={t('pages.02')}><h1>{t('pages.02')}</h1>
    <p role="alert">{t('procedure.unavailable')}</p><Link to="/library">{t('common.library')}</Link>
    <Button onClick={() => { setError(false); setAttempt((value) => value + 1); }}>{t('common.retry')}</Button></section>;
  if (!details) return <p role="status">{t('common.loading')}</p>;
  return <DetailsContent key={id} details={details} reload={async () => { setDetails(await procedureService.load(id)); }} />;
}

function DetailsContent({ details, reload }: { details: Details; reload(): Promise<void> }) {
  const location = useLocation(); const returned = location.state?.mapDetailsReturn as { scrollTop?: number; expandedTags?: boolean; expandedDescription?: boolean } | undefined;
  const mapButton = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation(); const navigate = useNavigate(); const { procedure, ready, draft, resume } = details;
  const state = procedureState(procedure); const [modal, setModal] = useState<'more' | 'metadata' | 'archive' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const failed = useRef<(() => Promise<void>) | null>(null); const failureKey = useRef('procedure.saveError'); const [menuTop, setMenuTop] = useState(0);
  const [expandedTags, setExpandedTags] = useState(returned?.expandedTags === true); const [expandedDescription, setExpandedDescription] = useState(returned?.expandedDescription === true);
  const [descriptionOverflow, setDescriptionOverflow] = useState(false); const description = useRef<HTMLParagraphElement>(null);
  const consultationReady = details.resumeReady ?? ready;
  const selected = consultationReady ?? draft;
  const exportPath = `/data/procedures?procedure=${encodeURIComponent(procedure.id)}`;
  const mapPath = `/procedure/${encodeURIComponent(procedure.id)}/map?revision=${encodeURIComponent(selected?.id ?? '')}`;
  const editPath = `/build/${encodeURIComponent(procedure.id)}?revision=${encodeURIComponent((draft ?? ready)?.id ?? '')}${draft ? '' : '&copy=ready'}`;
  useLayoutEffect(() => {
    if (!returned) return;
    const frame = requestAnimationFrame(() => { mapButton.current?.focus({ preventScroll: true }); window.scrollTo({ top: returned.scrollTop ?? 0, behavior: 'instant' }); });
    return () => cancelAnimationFrame(frame);
  }, [returned]);
  const openMap = () => { void navigate(mapPath, { state: { mapDetailsContext: { scrollTop: window.scrollY, expandedTags, expandedDescription } } }); };
  useLayoutEffect(() => {
    const element = description.current; if (!element) return;
    const measure = () => setDescriptionOverflow(element.scrollHeight > parseFloat(getComputedStyle(element).lineHeight) * 2 + 1);
    measure(); const observer = new ResizeObserver(measure); observer.observe(element); return () => observer.disconnect();
  }, [procedure.description, expandedDescription]);
  async function perform(operation: () => Promise<void>, errorKey = 'procedure.saveError') {
    if (busy) return; setBusy(true); setError(null);
    try { await operation(); failed.current = null; } catch (error) {
      failed.current = operation; failureKey.current = errorKey;
      setError(error instanceof Error && error.message === 'Procedure has saved sessions' ? t('procedure.savedSessions') : t(errorKey));
    } finally { setBusy(false); }
  }
  function start() { void perform(async () => {
    if (!ready) return; const run = resume ? await procedureService.resume(resume.id) : await procedureService.start(procedure.id, ready.id); void navigate(`/run/${encodeURIComponent(run.id)}`);
  }, 'procedure.startUnavailable'); }
  function applyFacet(kind: 'groupIds' | 'tags', value: string) { void perform(async () => {
    const current = await libraryService.load(); const filters = libraryFiltersSchema.parse(current.view.filters ?? {});
    await libraryService.saveView({ filters: { ...filters, [kind]: [value] }, scrollTop: 0 }); void navigate('/library');
  }); }
  return <section className="nf-procedure nf-stack" aria-label={t('pages.02')}>
    <header className="nf-row nf-procedure-header"><Link to="/library" aria-label={t('common.library')}>‹</Link>
      <Button aria-pressed={procedure.favorite} aria-label={t(procedure.favorite ? 'library.unfavorite' : 'library.favorite', { title: procedure.title })}
        onClick={() => { void perform(async () => { await procedureService.favorite(procedure.id, !procedure.favorite); await reload(); }); }}>{procedure.favorite ? '★' : '☆'}</Button>
      <Button aria-label={t('procedure.more')} onClick={(event) => { setMenuTop(event.currentTarget.getBoundingClientRect().bottom); setModal('more'); }}>···</Button></header>
    <div className="nf-procedure-identity"><Identity procedure={procedure} /><h1>{procedure.title}</h1>
      <span className="nf-priority" aria-label={t('library.priorityLabel', { value: procedure.priority })}><span aria-hidden="true">{'!'.repeat(procedure.priority)}</span></span></div>
    <p>{state === 'archived' ? t('procedure.archived') : consultationReady ? t('procedure.readyVersion', { version: consultationReady.revisionNumber }) : t('status.draft')}</p>
    {state === 'ready-draft' && <p className="nf-meta">{t('procedure.draftInProgress')}</p>}
    {details.groups.find((group) => group.id === procedure.groupId) && <Button className="nf-group-link" onClick={() => { if (procedure.groupId) applyFacet('groupIds', procedure.groupId); }}>
      {details.groups.find((group) => group.id === procedure.groupId)?.name}</Button>}
    {procedure.tags.length > 0 && <div className="nf-row">{(expandedTags ? procedure.tags : procedure.tags.slice(0, 3)).map((tag, index) =>
      <Button key={`${tag}-${index}`} onClick={() => applyFacet('tags', tag)}>#{tag}</Button>)}
      {procedure.tags.length > 3 && <Button onClick={() => setExpandedTags(!expandedTags)}>{expandedTags ? t('procedure.less') : t('procedure.moreTags', { count: procedure.tags.length - 3 })}</Button>}</div>}
    {procedure.description && <div><p ref={description} className={expandedDescription ? '' : 'nf-description--collapsed'}>{procedure.description}</p>
      {descriptionOverflow && <Button onClick={() => setExpandedDescription(!expandedDescription)}>{t(expandedDescription ? 'procedure.less' : 'procedure.expand')}</Button>}</div>}
    {error && !modal && <div className="nf-row"><p role="alert">{error}</p><Button onClick={() => { void perform(failed.current ?? reload, failureKey.current); }}>{t('common.retry')}</Button></div>}
    <div className="nf-stack nf-procedure-actions">
      {state === 'archived' ? <Button action variant="primary" onClick={() => { void perform(async () => { await procedureService.archive(procedure.id, false); await reload(); }); }}>{t('procedure.restore')}</Button>
        : ready ? <><Button action variant="primary" disabled={busy} disabledReason={t('common.loading')} onClick={start}>
          {resume ? t('procedure.resume') : t(state === 'ready-draft' ? 'procedure.startReady' : 'procedure.start')}</Button>
          <div className="nf-row"><Button ref={mapButton} onClick={openMap}>{t('procedure.map')}</Button>
            <Button onClick={() => { void navigate(editPath); }}>{t(state === 'ready-draft' ? 'procedure.continueEditing' : 'procedure.edit')}</Button></div></>
        : <><Button action variant="primary" onClick={() => { void navigate(editPath); }}>{t('procedure.edit')}</Button>
          <div className="nf-row"><Button onClick={() => { void navigate(`/run/${encodeURIComponent(procedure.id)}?preview=draft&revision=${encodeURIComponent(draft?.id ?? '')}`); }}>{t('procedure.preview')}</Button>
            <Button ref={mapButton} onClick={openMap}>{t('procedure.map')}</Button></div></>}
    </div>
    <Sheet open={modal === 'more'} title={t('procedure.more')} className="nf-procedure-menu"
      style={{ '--nf-menu-top': `${menuTop}px` } as CSSProperties} onClose={() => setModal(null)}>
      {error && <p role="alert">{error}</p>}
      <Button onClick={() => setModal('metadata')}>{t('procedure.editDetails')}</Button>
      <Button onClick={() => { void perform(async () => { const copy = await procedureService.duplicate(procedure.id, t('procedure.copySuffix'));
        void navigate(`/build/${encodeURIComponent(copy.id)}?revision=${encodeURIComponent(copy.workingDraftId ?? '')}`); }); }}>{t('procedure.duplicate')}</Button>
      <Link to={exportPath}>{t('procedure.export')}</Link>
      <Button onClick={() => setModal('archive')}>{t('procedure.archive')}</Button><hr />
      <Button variant="danger" onClick={() => setModal('delete')}>{t('procedure.delete')}</Button>
    </Sheet>
    {modal === 'metadata' && <MetadataSheet details={details} onSaved={reload} onClose={() => setModal(null)} />}
    <Sheet open={modal === 'archive' || modal === 'delete'} title={t(modal === 'delete' ? 'procedure.delete' : 'procedure.archive')} onClose={() => setModal(null)}>
      <p>{t(modal === 'delete' ? 'procedure.deletePrompt' : 'procedure.archivePrompt', { title: procedure.title })}</p>
      {error && <p role="alert">{error}</p>}{modal === 'delete' && <Link to={exportPath}>{t('procedure.exportFirst')}</Link>}
      <div className="nf-row"><Button onClick={() => setModal(null)}>{t('common.cancel')}</Button>
        <Button variant="danger" disabled={busy} disabledReason={t('common.loading')} onClick={() => { void perform(async () => {
          if (modal === 'delete') await procedureService.remove(procedure.id); else await procedureService.archive(procedure.id, true);
          void navigate('/library');
        }); }}>{t(modal === 'delete' ? 'procedure.delete' : 'procedure.archive')}</Button></div>
    </Sheet>
  </section>;
}
