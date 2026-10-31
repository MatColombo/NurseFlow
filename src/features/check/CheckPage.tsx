import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, ValidationRow } from '@shared/components';
import type { Issue } from '@domain/validation/validator';
import { checkService, type CheckedDraft } from './service';
import { issuePath } from './navigation';
import './check.css';

export default function CheckPage() {
  const { id = '' } = useParams(); const [params] = useSearchParams(); const navigate = useNavigate(); const { t } = useTranslation();
  const [checked, setChecked] = useState<CheckedDraft | null>(null); const [busy, setBusy] = useState(false); const locked = useRef(false);
  const [error, setError] = useState<'load' | 'stale' | 'commit' | null>(null); const [confirm, setConfirm] = useState(false); const [ack, setAck] = useState(false);
  const restore = useRef({ top: Number(params.get('top') ?? 0), issue: params.get('issue') }); const section = useRef<HTMLElement>(null);
  const check = useCallback(async () => {
    if (locked.current) return; locked.current = true; setBusy(true); setConfirm(false); setAck(false);
    try { setChecked(await checkService.check(id)); setError(null); }
    catch (reason) { setError(reason instanceof Error && reason.name === 'ConflictError' ? 'stale' : 'load'); }
    finally { locked.current = false; setBusy(false); }
  }, [id]);
  useEffect(() => { let active = true; void Promise.resolve().then(() => { if (active) void check(); }); return () => { active = false; }; }, [check]);
  useEffect(() => {
    const subscription = checkService.watch(id, () => {
      if (!locked.current) { setConfirm(false); setAck(false); setError('stale'); }
    }, () => { setConfirm(false); setAck(false); setError('load'); });
    return () => subscription.unsubscribe();
  }, [id]);
  useEffect(() => {
    const focus = () => { if (!locked.current) void check(); };
    window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus);
  }, [check]);
  useLayoutEffect(() => {
    if (!checked) return;
    const context = restore.current;
    if (context.issue) {
      const row = [...(section.current?.querySelectorAll<HTMLElement>('[data-issue-id]') ?? [])].find((element) => element.dataset.issueId === context.issue);
      row?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    }
    if (Number.isFinite(context.top) && context.top >= 0) window.scrollTo({ top: context.top });
  }, [checked]);
  const base = '/build/' + encodeURIComponent(id); const blocked = busy || !checked || checked.result.problems.length > 0 || Boolean(error);
  function openConfirmation() { if (!blocked) { setAck(false); setConfirm(true); } }
  async function mark() {
    if (!checked || !ack || locked.current) return; locked.current = true; setBusy(true);
    try { await checkService.mark(checked, ack); void navigate('/procedure/' + encodeURIComponent(id), { replace: true }); }
    catch (reason) {
      if (reason instanceof Error && reason.name === 'ConflictError') { setConfirm(false); setAck(false); setError('stale'); }
      else setError('commit');
    } finally { locked.current = false; setBusy(false); }
  }
  function action(issue: Issue) {
    if (!checked) return;
    restore.current = { top: window.scrollY, issue: issue.id };
    void navigate(issuePath(id, checked.draftId, issue, window.scrollY));
  }
  function location(issue: Issue) { return [issue.location, issue.field ? t('check.fields.' + issue.field, { defaultValue: '' }) : '', issue.detail].filter(Boolean).join(' · '); }
  const systemError = error && <div className="nf-card nf-stack" role="alert"><p>{t('check.errors.' + error)}</p>
    <Button disabled={busy} disabledReason={t('common.loading')} onClick={() => { if (error === 'commit' && checked) { if (confirm) void mark(); else { setAck(false); setConfirm(true); } } else void check(); }}>{t('common.retry')}</Button>
    {error === 'commit' && <Link to={'/data/procedures?procedure=' + encodeURIComponent(id)}>{t('builder.exportDraft')}</Link>}
  </div>;
  return <section ref={section} className="nf-check nf-stack" aria-label={t('check.title')} data-draft-id={checked?.draftId} data-edit-version={checked?.editVersion}>
    <header className="nf-row nf-check-header"><Link to={base}>{t('builder.backBuilder')}</Link><div><h1>{t('check.title')}</h1>{checked && <p className="nf-meta">{checked.title} · {t('check.draft', { version: checked.editVersion })}</p>}</div>
      <Button icon="check" disabled={busy} disabledReason={t('common.loading')} onClick={() => { restore.current.top = window.scrollY; void check(); }}>{t('check.again')}</Button></header>
    {busy && <p role="status">{t('check.checking')}</p>}{!confirm && systemError}
    {checked && <>
      <div className="nf-check-counts" aria-live="polite"><strong>{t('check.problems', { count: checked.result.problems.length })}</strong><strong>{t('check.warnings', { count: checked.result.warnings.length })}</strong></div>
      <section className="nf-stack" aria-labelledby="check-problems"><h2 id="check-problems">{t('check.problemsTitle')}</h2>
        {checked.result.problems.length ? checked.result.problems.map((issue) => <div key={issue.id} data-issue-id={issue.id}><ValidationRow severity="problem" code={issue.code as `P${string}`} message={t('check.rules.' + issue.code)} location={location(issue)} onAction={() => action(issue)} /></div>) : <p>{t('check.noProblems')}</p>}</section>
      {checked.result.warnings.length > 0 && <section className="nf-stack" aria-labelledby="check-warnings"><h2 id="check-warnings">{t('check.warningsTitle')}</h2>
        {checked.result.warnings.map((issue) => <div key={issue.id} data-issue-id={issue.id}><ValidationRow severity="warning" code={issue.code as `W${string}`} message={t('check.rules.' + issue.code)} location={location(issue)} onAction={() => action(issue)} /></div>)}</section>}
    </>}
    <p className="nf-note nf-check-scope">{t('check.scope')}</p>
    <footer className="nf-row"><Button disabled={busy || !checked} disabledReason={t('check.checking')} onClick={() => { if (checked) void navigate('/run/' + encodeURIComponent(id) + '?preview=draft&revision=' + encodeURIComponent(checked.draftId)); }}>{t('check.preview')}</Button>
      <Button variant="primary" disabled={blocked} disabledReason={t(error ? 'check.errors.' + error : 'check.resolve')} onClick={openConfirmation}>{t('check.mark')}</Button></footer>
    <Dialog open={confirm} title={t('check.confirmTitle')} onClose={() => { if (!busy) setConfirm(false); }}>
      {checked && <><p>{t('check.version', { version: checked.nextReadyVersion })}</p>{checked.previousReadyVersion && <p>{t('check.previous', { version: checked.previousReadyVersion })}</p>}
        {checked.result.warnings.length > 0 && <p>{t('check.remain', { count: checked.result.warnings.length })}</p>}
        {checked.result.warnings.some((issue) => issue.code === 'W08') && <p className="nf-check-broken" role="note">{t('check.brokenRisk')}</p>}</>}
      <p>{t('check.scope')}</p><label className="nf-row nf-check-review"><input type="checkbox" checked={ack} disabled={busy} onChange={(event) => setAck(event.target.checked)} />{t('check.review')}</label>
      {systemError}<div className="nf-row"><Button disabled={busy} disabledReason={t('common.loading')} onClick={() => setConfirm(false)}>{t('common.cancel')}</Button>
        <Button variant="primary" disabled={!ack || busy || Boolean(error)} disabledReason={t('check.review')} onClick={() => { void mark(); }}>{t('check.mark')}</Button></div>
    </Dialog>
  </section>;
}
