import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Revision, Node } from '@domain/model';
import type { ExecutionRun, RunEvent, viewRun } from '@domain/runtime';
import { Button, Dialog, Icon, Sheet } from '@shared/components';
import { StepContent } from './StepContent';
import { useRunBack } from './useRunBack';
import './run.css';

export type RunData = { run: ExecutionRun; revision: Revision; view: ReturnType<typeof viewRun>; title: string; preview: boolean };
export type RunAdapter = { dispatch(event: RunEvent): Promise<RunData | null>; finish(): Promise<void>; reload(): Promise<RunData> };
const titleOf = (node: Node) => node.kind === 'decision' ? node.question : node.kind === 'end' ? node.heading : 'title' in node ? node.title : '';

export function RunScreen({ initial, adapter, onData }: { initial: RunData; adapter: RunAdapter; onData(data: RunData): void }) {
  const { t, i18n } = useTranslation(); const navigate = useNavigate(); const data = initial; const { run, revision, view } = data;
  const location = useLocation(); const fromMap = useRef(location.state?.runMapReturn === run.id); const mapButton = useRef<HTMLButtonElement>(null);
  const [modal, setModal] = useState<'exit' | 'restart' | 'activities' | 'reopen' | null>(null);
  const [reopen, setReopen] = useState<{ groupVisitId: number; activityId: string } | null>(null);
  const [busy, setBusy] = useState(false); const locking = useRef(false); const [error, setError] = useState<'save' | 'stale' | 'incomplete' | null>(null);
  const retry = useRef<(() => Promise<void>) | null>(null); const stay = useRef<HTMLButtonElement>(null); const content = useRef<HTMLElement>(null);
  const ended = run.status === 'ended'; const interrupted = run.status === 'interrupted';
  const invalidEnd = view.node.kind === 'end' && (!view.node.heading.trim() || !view.node.message.trim());
  const invalidContent = view.node.kind === 'instruction' || view.node.kind === 'alert' ? !view.node.text.trim() : view.node.kind === 'decision' && !view.node.question.trim();
  const number = (value: number) => new Intl.NumberFormat(i18n.resolvedLanguage).format(value);
  const total = view.progress.total.kind === 'unknown' ? '?' : view.progress.total.kind === 'exact' ? number(view.progress.total.value) : `${number(view.progress.total.min)}–${number(view.progress.total.max)}`;
  const procedurePath = `/procedure/${encodeURIComponent(run.procedureId)}`;
  const builderPath = `/build/${encodeURIComponent(run.procedureId)}?revision=${encodeURIComponent(revision.id)}`;
  const runPath = `/run/${encodeURIComponent(data.preview ? run.procedureId : run.id)}${ended ? '/end' : ''}${data.preview ? `?preview=draft&revision=${encodeURIComponent(revision.id)}` : ''}`;
  const mapPath = `${procedurePath}/map?revision=${encodeURIComponent(revision.id)}&${data.preview ? 'previewRun' : 'run'}=${encodeURIComponent(run.id)}`;
  const currentToken = run.tokens.find((token) => token.id === run.focusTokenId)!;
  const group = view.groups[0]; const activity = group?.activities.find((item) => item.id === currentToken.activityId);
  const phaseId = 'phaseId' in view.node ? view.node.phaseId : undefined;
  const phase = revision.graph.phases.find((item) => item.id === phaseId)?.name;
  const previous = view.previous; const previousLabel = previous ? previous.kind === 'multitask' ? t('run.forkContext') : titleOf(previous.node) : '';
  const answer = previous?.node.kind === 'decision' ? previous.node.outcomes.find((item) => item.id === previous.outcomeId)?.label : undefined;
  useEffect(() => { if (location.pathname + location.search !== runPath) void navigate(runPath, { replace: true, state: location.state }); }, [navigate, runPath, location.pathname, location.search, location.state]);
  useEffect(() => {
    const restoreMap = fromMap.current;
    const frame = requestAnimationFrame(() => { fromMap.current = false; (restoreMap ? mapButton.current : content.current?.querySelector<HTMLElement>('h2'))?.focus({ preventScroll: true }); window.scrollTo({ top: restoreMap ? location.state?.runMapContext?.scrollTop ?? 0 : 0, behavior: 'instant' }); });
    return () => cancelAnimationFrame(frame);
  }, [run.currentNodeId, run.status, run.focusTokenId, location.state]);
  useEffect(() => { if (modal !== 'exit') return; const frame = requestAnimationFrame(() => stay.current?.focus()); return () => cancelAnimationFrame(frame); }, [modal]);
  async function perform(operation: () => Promise<void>) {
    if (locking.current) return; locking.current = true; setBusy(true); setError(null);
    try { await operation(); retry.current = null; }
    catch (failure) {
      if (failure instanceof Error && 'code' in failure && failure.code === 'first-step') setModal('exit');
      else { retry.current = operation; setModal(null); setError(failure instanceof Error && failure.name === 'ConflictError' ? 'stale' : data.preview && failure instanceof Error && 'code' in failure && failure.code === 'invalid-revision' ? 'incomplete' : 'save'); }
    } finally { locking.current = false; setBusy(false); }
  }
  function dispatch(event: RunEvent) {
    void perform(async () => {
      const next = await adapter.dispatch(event);
      if (next) { onData(next); setModal(null); }
      else void navigate(procedurePath, { replace: true });
    });
  }
  const back = () => { if (!locking.current && !modal) dispatch({ type: 'back' }); };
  useRunBack(run.id, back);
  return <section className="nf-run nf-stack" aria-label={t(ended ? 'pages.04' : 'pages.03')} data-run-id={run.id} data-revision-id={revision.id} aria-busy={busy}>
    <header className="nf-run-header">
      <Button icon="back" aria-label={t('common.back')} disabled={busy || ended && !previous} disabledReason={t(busy ? 'run.saving' : 'run.noPrevious')} onClick={back} />
      <h1 title={data.title}>{data.title}</h1>
      <Button purpose="view" ref={mapButton} disabled={busy} disabledReason={t('run.saving')} onClick={() => { if (!locking.current) void navigate(mapPath, { state: { runMapContext: { scrollTop: window.scrollY } } }); }}>{t('run.map')}</Button>
      {(!ended || invalidEnd) && <Button disabled={busy} disabledReason={t('run.saving')} onClick={() => setModal('exit')}>{t('run.exit')}</Button>}
    </header>
    {data.preview && <strong role="status">{t('procedure.draftPreview')}</strong>}
    <div className="nf-run-context nf-meta"><p>{ended && !invalidEnd ? t('run.endCount', { count: view.progress.actualVisibleCount }) : t('run.step', { n: view.progress.n === undefined ? '?' : number(view.progress.n), total: invalidEnd ? '?' : total })}</p>{phase && <p>{phase}</p>}</div>
    {!ended && !interrupted && group && <Button className="nf-run-switch" disabled={busy} disabledReason={t('run.saving')} aria-haspopup="dialog" onClick={() => setModal('activities')}>
      <Icon name="fork" /><strong>{t('run.switch')}</strong><span>{activity?.name ?? group.title}</span><span>{t('run.doneCount', { done: group.completed, total: group.total })} ▾</span>
    </Button>}
    {previous && <aside className="nf-run-previous nf-meta" aria-label={t('run.previous')}><p>{t('run.previous')}</p><p title={[previousLabel, answer].filter(Boolean).join(' · ')}>{previousLabel}{answer ? ` · ${answer}` : ''}</p></aside>}
    {error && <div className="nf-run-error nf-stack" role="alert"><p>{t(error === 'stale' ? 'run.stale' : error === 'incomplete' ? 'run.previewPath' : 'run.saveError')}</p>
      <div className="nf-row">{error === 'incomplete' ? <Link to={builderPath}>{t('run.builder')}</Link> : error === 'stale' ? <Button onClick={() => { void perform(async () => { onData(await adapter.reload()); }); }}>{t('run.reload')}</Button> : <Button onClick={() => { if (retry.current) void perform(retry.current); }}>{t('common.retry')}</Button>}
        <Button onClick={() => { setError(null); setModal(null); }}>{t('run.stay')}</Button><Link to={`/data/procedures?procedure=${encodeURIComponent(run.procedureId)}`}>{t('run.recovery')}</Link></div></div>}
    <section ref={content} className="nf-stack" aria-live="polite" aria-atomic="false">
      {invalidEnd || invalidContent && !interrupted ? <div className="nf-run-error nf-stack"><h2 tabIndex={-1}>{t(invalidEnd ? 'run.endMissing' : 'run.contentMissing')}</h2><p role="alert">{t(invalidEnd ? 'run.endMissing' : 'run.contentMissing')}</p><Link to={data.preview ? builderPath : procedurePath}>{t(data.preview ? 'run.builder' : 'run.details')}</Link></div> : interrupted ? <div className="nf-run-error nf-stack"><h2 tabIndex={-1}>{t('run.interrupted')}</h2><p role="alert">{t('run.broken')}</p>{run.interruption?.formerTitle && <p className="nf-authored">{run.interruption.formerTitle}</p>}</div> :
        view.node.kind !== 'start' && view.node.kind !== 'multitask' ? <>
          {view.node.kind === 'end' && <p className="nf-row" data-end-kind={view.node.endKind}><Icon name={view.node.endKind === 'completed' ? 'check' : view.node.endKind === 'escalation' ? 'warning' : view.node.endKind === 'stopped' ? 'problem' : 'info'} /><span>{t('run.end.' + view.node.endKind)}</span></p>}
          <div className="nf-run-current">{!ended && group && activity && <aside className="nf-run-rail" aria-label={activity.name}>B {group.activities.indexOf(activity) + 1}/{group.total}</aside>}
            <StepContent key={run.currentNodeId} node={view.node} preview={false} busy={busy} showEndType={false}
              continueLabel={t(view.actions.finishActivity ? 'run.finishActivity' : view.actions.stopEntireProcedure ? 'run.stop' : 'editor.continue')}
              stopOutcomeIds={view.actions.authorizedStopOutcomeIds}
              finishOutcomeIds={view.node.kind === 'decision' ? view.node.outcomes.filter((outcome) => outcome.destination.kind === 'activity-complete').map((outcome) => outcome.id) : []}
              onContinue={() => dispatch({ type: view.actions.finishActivity ? 'finish-activity' : 'continue' })}
              onChoose={(outcomeId) => dispatch({ type: 'choose-outcome', outcomeId })} />
          </div>
        </> : null}
    </section>
    {ended && !invalidEnd && <footer className="nf-stack nf-run-end-actions"><Button action variant="primary" disabled={busy} disabledReason={t('run.saving')} onClick={() => { void perform(async () => { await adapter.finish(); void navigate('/library', { replace: true }); }); }}>{t('common.library')}</Button>
      <Button disabled={busy} disabledReason={t('run.saving')} onClick={() => setModal('restart')}>{t('run.restart')}</Button></footer>}
    <Sheet open={modal === 'activities'} title={t('run.activities')} onClose={() => { if (!busy) setModal(null); }}>
      {view.groups.map((item) => <section key={item.visitId} className="nf-stack"><h3>{item.title}</h3><p>{t('run.doneCount', { done: item.completed, total: item.total })}</p>
        {item.activities.map((a) => <Button key={a.id} className="nf-run-activity" disabled={busy} disabledReason={t('run.saving')} onClick={() => {
          if (a.status === 'done') { setReopen({ groupVisitId: item.visitId, activityId: a.id }); setModal('reopen'); }
          else if (run.groups.find((g) => g.visitId === item.visitId)?.focusedActivityId === a.id) setModal(null);
          else dispatch({ type: 'switch-activity', groupVisitId: item.visitId, activityId: a.id });
        }}><span>{a.name}</span><span>{t(a.status === 'done' ? 'run.done' : run.groups.find((g) => g.visitId === item.visitId)?.focusedActivityId === a.id ? 'run.current' : a.status === 'pending' ? 'run.pending' : 'run.inProgress')}{a.status === 'done' ? ` · ${t('run.reopen')}` : ''}</span></Button>)}
      </section>)}
    </Sheet>
    <Dialog open={modal === 'exit'} title={t('run.exitTitle')} onClose={() => { if (!busy) setModal(null); }}>
      <div className="nf-row"><Button ref={stay} disabled={busy} disabledReason={t('run.saving')} onClick={() => setModal(null)}>{t('run.stay')}</Button><Button variant="danger" disabled={busy} disabledReason={t('run.saving')} onClick={() => dispatch({ type: 'exit', confirmed: true })}>{t('run.exitAction')}</Button></div>
    </Dialog>
    <Dialog open={modal === 'restart'} title={t('run.restartTitle')} description={t('run.restartBody')} onClose={() => { if (!busy) setModal(null); }}>
      <div className="nf-row"><Button disabled={busy} disabledReason={t('run.saving')} onClick={() => setModal(null)}>{t('common.cancel')}</Button><Button variant="danger" disabled={busy} disabledReason={t('run.saving')} onClick={() => dispatch({ type: 'restart', confirmed: true })}>{t('run.restart')}</Button></div>
    </Dialog>
    <Dialog open={modal === 'reopen'} title={t('run.reopenTitle')} description={t('run.reopenBody')} onClose={() => { if (!busy) setModal('activities'); }}>
      <div className="nf-row"><Button disabled={busy} disabledReason={t('run.saving')} onClick={() => setModal('activities')}>{t('common.cancel')}</Button><Button disabled={busy} disabledReason={t('run.saving')} onClick={() => { if (reopen) dispatch({ type: 'reopen-activity', ...reopen, confirmed: true }); }}>{t('run.reopen')}</Button></div>
    </Dialog>
  </section>;
}
