import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MediaAsset, Settings, StepMedia } from '@domain/model';
import { editStep, editableStep, type StepEdit } from '@domain/editor/edits';
import { applyEdit } from '@domain/builder/edits';
import { activityCollector, assertEditableGraph, nodeAt } from '@domain/builder/structure';
import { Button, Dialog, Sheet } from '@shared/components';
import { useUnsavedNavigation } from '@features/procedures/useUnsavedNavigation';
import { graphClipboard, type BuilderSnapshot } from '@features/builder/service';
import { destinationLabel, titleOf } from '@features/builder/labels';
import { ImpactSheet, type EditPlan } from '@features/builder/ImpactSheet';
import { StepContent } from '@features/run/StepContent';
import { useStepDraft } from './useStepDraft';
import { ContentFields } from './ContentFields';
import { OutcomeSection } from './OutcomeSection';
import { MediaEditor } from './media/MediaEditor';
import { SourceDialog } from './media/SourceDialog';
import { carryCheck, checkPath, readCheckReturn } from '@features/check/navigation';

type Modal = 'preview' | 'more' | 'type' | 'phase' | 'arrange' | 'outcome' | null;
export function StepEditor({ initial, settings, nodeId, markRevision }: { initial: BuilderSnapshot; settings: Settings; nodeId: string; markRevision(id: string): void }) {
  const { t } = useTranslation(); const navigate = useNavigate(); const [params] = useSearchParams();
  const [modal, setModal] = useState<Modal>(params.has('outcome') ? 'outcome' : null); const [outcomeId, setOutcomeId] = useState<string | null>(params.get('outcome'));
  const [phaseName, setPhaseName] = useState(''); const [plan, setPlan] = useState<EditPlan | null>(null); const [reload, setReload] = useState(false);
  const [source, setSource] = useState<{ mode: 'photo' | 'url' | 'recompress'; slot: StepMedia['slot']; existing?: StepMedia } | null>(null);
  const [issue, setIssue] = useState<string | null>(null);
  const [restoreTop] = useState(() => Number(params.get('editorTop') ?? 0));
  const focusField = useRef(params.get('focusField')); const focusItem = useRef(params.get('focusItem'));
  const draft = useStepDraft(initial, nodeId, settings, (revisionId) => { markRevision(revisionId); const query = new URLSearchParams(params); query.set('revision', revisionId); void navigate('?' + query.toString(), { replace: true }); });
  const node = editableStep(draft.graph.nodes.find((node) => node.id === nodeId) ?? draft.snapshot.revision.graph.nodes.find((node) => node.id === nodeId) ?? nodeAt(initial.revision.graph, nodeId));
  const collector = 'next' in node && node.next.kind === 'activity-complete' ? activityCollector(draft.graph, { nodeId: node.id, slot: 'next' }) : undefined;
  const outcome = node.kind === 'decision' ? node.outcomes.find((item) => item.id === outcomeId) : undefined;
  const busy = draft.writing; const failed = draft.failed; const error = draft.error ?? issue;
  const base = '/build/' + encodeURIComponent(initial.procedure.id);
  useLayoutEffect(() => { if (Number.isFinite(restoreTop) && restoreTop >= 0) window.scrollTo({ top: restoreTop, behavior: 'instant' }); }, [restoreTop]);
  useLayoutEffect(() => {
    if (!focusField.current) return;
    const field = focusField.current; const itemId = focusItem.current;
    const target = [...document.querySelectorAll<HTMLElement>('[data-editor-field]')].find((element) => element.dataset.editorField === field);
    const item = itemId ? [...document.querySelectorAll<HTMLElement>('[data-media-row]')].find((element) => element.dataset.mediaRow === itemId) : undefined;
    const element = item ?? target; element?.closest('details')?.setAttribute('open', '');
    const control = element?.matches('input,textarea,select,button') ? element : element?.querySelector<HTMLElement>('input,textarea,select,button');
    control?.focus(); element?.scrollIntoView({ block: 'center' });
    if (field === 'outcomes' && itemId) {
      const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>('dialog[open] [data-editor-field="answer"]')?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, []);
  async function leave(toCheck = false) { try { if (await draft.saveSelection()) { const query = new URLSearchParams({ revision: draft.current().revision.id }); carryCheck(params, query); void navigate(toCheck ? checkPath(initial.procedure.id, readCheckReturn(params)) : base + '?' + query.toString(), { replace: true, state: { fromStep: true } }); } } catch { setIssue(t('editor.saveError')); } }
  function closeSource() { if (busy) return; if (failed) draft.discardProposal(); setSource(null); }
  useUnsavedNavigation(draft.dirty || busy || failed || Boolean(modal || source || plan), { onBack: () => {
    if (plan) { if (!busy) { if (failed) draft.discardProposal(); setPlan(null); } } else if (source) closeSource(); else if (modal) setModal(null); else void leave();
  }, beforeUnloadDirty: draft.dirty || busy || failed });
  async function open(value: Modal) { if (await draft.flush()) { setIssue(null); setModal(value); } }
  async function changePath(itemId?: string) {
    try {
      if (!await draft.saveSelection()) return;
      const query = new URLSearchParams({ revision: draft.current().revision.id, pathNode: nodeId, pathSlot: itemId ? 'outcome' : 'next', returnStep: nodeId, editorTop: String(window.scrollY) });
      carryCheck(params, query);
      if (itemId) { query.set('pathItem', itemId); query.set('returnOutcome', itemId); }
      void navigate(base + '?' + query.toString());
    } catch { setIssue(t('editor.saveError')); }
  }
  async function retrySave() {
    try {
      const saved = failed ? await draft.flush(true) : await draft.saveSelection();
      if (saved) { setIssue(null); setPhaseName(''); if (modal === 'phase') setModal(null); }
    } catch { setIssue(t('editor.saveError')); }
  }
  const errorPanel = error && <div role="alert" className="nf-stack"><p>{error}</p>{(failed || issue === t('editor.saveError')) && <Button disabled={busy} disabledReason={t('common.loading')} onClick={() => { void retrySave(); }}>{t('common.retry')}</Button>}<Button onClick={() => setReload(true)}>{t('editor.reload')}</Button></div>;
  async function applyPlan() {
    if (!plan) return; const success = failed ? await draft.flush(true) : await draft.transaction(() => plan.graph);
    if (success) { setPlan(null); setModal(null); if (!plan.graph.nodes.some((node) => node.id === nodeId)) void navigate(base + '?revision=' + encodeURIComponent(draft.current().revision.id), { replace: true, state: { fromStep: true } }); }
  }
  async function propose(value: StepEdit | 'delete') {
    if (!await draft.flush()) return;
    try {
      const graph = value === 'delete' ? applyEdit(draft.current().revision.graph, { type: 'delete', nodeId }, () => crypto.randomUUID()).graph :
        editStep(draft.current().revision.graph, nodeId, value, settings, () => crypto.randomUUID());
      setPlan({ graph, label: value === 'delete' ? 'delete' : value.type });
    } catch { setIssue(t('editor.invalid')); }
  }
  async function edit(value: StepEdit) { if (await draft.edit(value)) setIssue(null); }
  async function mediaSource(mode: 'photo' | 'url' | 'recompress', slot: StepMedia['slot'], existing?: StepMedia) {
    if (await draft.flush()) setSource({ mode, slot, ...(existing ? { existing } : {}) });
  }
  async function saveMedia(item: StepMedia, asset?: MediaAsset) {
    const edit: StepEdit = source?.existing ? { type: 'replace-media', id: item.id, source: item.source, caption: item.caption ?? '', altText: item.altText ?? '' } : { type: 'add-media', media: item };
    const success = await draft.edit(edit, asset ? [asset] : []);
    return success;
  }
  return <section className="nf-step-editor nf-stack" aria-label={t('editor.title')} data-node-id={nodeId} data-revision-id={draft.snapshot.revision.id} data-revision-state={draft.snapshot.revision.state}>
    <header className="nf-row nf-editor-header"><div><h1>{t('editor.title')}</h1><p className="nf-meta">{titleOf(node, t)}</p></div>
      <Button onClick={() => setModal('preview')}>{t('editor.preview')}</Button><Button variant="primary" onClick={() => { void leave(); }}>{t('editor.done')}</Button>
      <Button aria-label={t('editor.more')} onClick={() => { void open('more'); }}>···</Button></header>
    {readCheckReturn(params) && <Button onClick={() => { void leave(true); }}>{t('check.back')}</Button>}
    <p role="status" className="nf-meta">{t(error ? 'editor.saveError' : draft.dirty || busy ? 'editor.saving' : 'editor.saved')}</p>
    {!modal && !source && !plan && errorPanel}
    <ContentFields node={node} graph={draft.graph} change={draft.change} newPhase={() => { void open('phase'); }} />
    {(node.kind === 'instruction' || node.kind === 'alert') && <div className="nf-card nf-stack"><p>{t('editor.continuation')}: {destinationLabel(draft.graph, node.next, t)}</p>
      {collector?.kind === 'multitask' && <p>{t('builder.collectorHint', { target: destinationLabel(draft.graph, collector.afterAll, t) })}</p>}
      <Button onClick={() => { void changePath(); }}>{t('editor.changePath')}</Button></div>}
    {node.kind === 'decision' && <OutcomeSection node={node} graph={draft.graph} busy={busy} open={(id) => { setOutcomeId(id); setModal('outcome'); }} arrange={() => { void open('arrange'); }} add={() => { void edit({ type: 'add-outcome' }); }} />}
    <details className="nf-card nf-stack nf-editor-section" open={Boolean(node.note?.text)}><summary>{t('editor.note')}</summary>
      <label className="nf-stack">{t('editor.noteText')}<textarea rows={4} value={node.note?.text ?? ''} onChange={(event) => draft.change({ type: 'content', patch: { note: { text: event.target.value, visibility: node.note?.visibility ?? 'always-visible' } } })} /></label>
      <label className="nf-stack">{t('editor.note')}<select value={node.note?.visibility ?? 'always-visible'} onChange={(event) => draft.change({ type: 'content', patch: { note: { text: node.note?.text ?? '', visibility: event.target.value as 'expandable' | 'always-visible' } } })}>
        <option value="expandable">{t('editor.expandable')}</option><option value="always-visible">{t('editor.alwaysVisible')}</option></select></label>
    </details>
    {'media' in node && <MediaEditor node={node} settings={settings} busy={busy} change={draft.change} edit={(value) => { void edit(value); }} source={(...args) => { void mediaSource(...args); }} />}
    <Sheet open={modal === 'outcome' && Boolean(outcome) && !plan} title={t('editor.editOutcome', { label: outcome?.label || t('builder.unnamedOutcome') })} onClose={() => setModal(null)}>
      {errorPanel}{outcome && <>
        <label className="nf-stack">{t('editor.answer')}<input data-editor-field="answer" value={outcome.label} onChange={(event) => draft.change({ type: 'outcome', id: outcome.id, label: event.target.value })} /></label>
        <label className="nf-stack">{t('editor.outcomeNote')}<textarea rows={4} value={outcome.note?.text ?? ''} onChange={(event) => draft.change({ type: 'outcome', id: outcome.id, label: outcome.label, note: { text: event.target.value, visibility: outcome.note?.visibility ?? 'expandable' } })} /></label>
        <p>{t('editor.path')}: {destinationLabel(draft.graph, outcome.destination, t)}</p><Button aria-label={t('editor.changePath') + ': ' + outcome.label} onClick={() => { void changePath(outcome.id); }}>{t('editor.changePath')}</Button>
      </>}
    </Sheet>
    <Sheet open={modal === 'arrange' && !plan} title={t('editor.arrange')} onClose={() => setModal(null)}>{errorPanel}
      {node.kind === 'decision' && <ol className="nf-list nf-stack">{[...node.outcomes].sort((a, b) => a.order - b.order).map((item, index, items) => <li key={item.id} className="nf-stack" data-arrange-outcome={item.id}>
        <span>{item.label || t('builder.unnamedOutcome')}</span><div className="nf-row">{([-1, 1] as const).map((delta) => <Button key={delta} disabled={busy || index + delta < 0 || index + delta >= items.length} disabledReason={t('builder.boundary')} onClick={() => { void edit({ type: 'arrange', id: item.id, delta }); }}>{t(delta < 0 ? 'library.up' : 'library.down')}</Button>)}
          <Button variant="danger" aria-label={t('editor.removeOutcome', { label: item.label })} onClick={() => { void propose({ type: 'remove-outcome', id: item.id }); }}>{t('builder.removeItem')}</Button></div>
      </li>)}</ol>}
    </Sheet>
    <Sheet open={modal === 'phase'} title={t('editor.newPhase')} onClose={() => setModal(null)}>{errorPanel}
      <label className="nf-stack">{t('editor.phaseName')}<input disabled={failed || busy} value={phaseName} onChange={(event) => setPhaseName(event.target.value)} /></label>
      <Button disabled={busy || failed || !phaseName.trim()} disabledReason={t(failed ? 'editor.saveError' : 'editor.phaseName')} onClick={() => { void draft.edit({ type: 'new-phase', id: crypto.randomUUID(), name: phaseName }).then((saved) => { if (saved) { setModal(null); setPhaseName(''); } }); }}>{t('editor.done')}</Button>
    </Sheet>
    <Sheet open={modal === 'more' && !plan} title={t('editor.more')} onClose={() => setModal(null)}>{errorPanel}
      <Button onClick={() => setModal('type')}>{t('editor.changeType')}</Button><Button onClick={() => { void draft.flush().then((saved) => { if (!saved) return; const snapshot = draft.current(); graphClipboard.set({ mode: 'copy', graph: snapshot.revision.graph, procedureId: snapshot.procedure.id, revisionId: snapshot.revision.id, editVersion: snapshot.revision.editVersion, selection: { kind: 'node', nodeId } }); void leave(); }); }}>{t('editor.duplicate')}</Button>
      <Button variant="danger" onClick={() => { void propose('delete'); }}>{t('editor.delete')}</Button>
    </Sheet>
    <Sheet open={modal === 'type' && !plan} title={t('editor.changeType')} onClose={() => setModal(null)}>{errorPanel}<p>{t('editor.typeImpact')}</p>
      {(['instruction', 'alert', 'decision', 'end'] as const).filter((kind) => kind !== node.kind &&
        (!(assertEditableGraph(draft.graph).get(node.id)?.length) || node.kind === 'end' || kind === 'instruction' || kind === 'alert')).map((kind) => <Button key={kind} onClick={() => { void propose({ type: 'change-type', kind }); }}>{t('builder.kinds.' + kind)}</Button>)}
    </Sheet>
    {plan && <ImpactSheet before={draft.snapshot.revision.graph} plan={plan} busy={busy} error={error}
      details={plan.label === 'change-type' && <div className="nf-stack"><p>{t('editor.typeImpact')}</p>{node.kind === 'decision' && <p>{t('editor.lostQuestion', { text: node.question })}</p>}
        {node.kind === 'alert' && node.additionalText && <p>{t('editor.lostAdditional', { text: node.additionalText })}</p>}
        {'media' in node && node.media.length > 0 && plan.graph.nodes.find((item) => item.id === nodeId)?.kind === 'end' && <p>{t('editor.mediaRemoved', { count: node.media.length })}</p>}</div>}
      cancel={() => { if (!busy) { if (failed) draft.discardProposal(); setPlan(null); } }} confirm={() => { void applyPlan(); }} />}
    {source && <SourceDialog {...source} settings={settings} busy={busy} failed={failed} error={error} save={saveMedia} retry={() => draft.flush(true)} close={closeSource} />}
    <Dialog open={modal === 'preview'} title={t('editor.preview')} className="nf-editor-preview" onClose={() => setModal(null)}>
      <p className="nf-note">{t('editor.previewOnly')}</p>{errorPanel}<StepContent node={node} phase={draft.graph.phases.find((phase) => phase.id === node.phaseId)?.name} preview />
    </Dialog>
    <Dialog open={reload} title={t('editor.discard')} onClose={() => setReload(false)}><Button onClick={() => setReload(false)}>{t('common.cancel')}</Button><Button variant="danger" onClick={() => { window.location.reload(); }}>{t('editor.reload')}</Button></Dialog>
  </section>;
}
