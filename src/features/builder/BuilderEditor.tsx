import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BuilderError, type BuilderView, type Selection } from '@domain/builder/model';
import { applyEdit, type Edit } from '@domain/builder/edits';
import { assertMovable, pasteGraph, type ClipSelection, type PasteTarget } from '@domain/builder/clipboard';
import { nodeAt } from '@domain/builder/structure';
import { Button, Dialog, Sheet } from '@shared/components';
import { useUnsavedNavigation } from '@features/procedures/useUnsavedNavigation';
import { MetadataSheet } from '@features/procedures/MetadataSheet';
import { procedureService, type ProcedureDetails } from '@features/procedures/service';
import { builderService, graphClipboard, type BuilderSnapshot } from './service';
import { Outline } from './Outline';
import { EdgeActions } from './EdgeActions';
import { NodeActions } from './NodeActions';
import { PhaseSheet } from './PhaseSheet';
import { ImpactSheet, type EditPlan } from './ImpactSheet';
import { useBuilderLayout } from './useBuilderLayout';

export function BuilderEditor({ initial }: { initial: BuilderSnapshot }) {
  const { t } = useTranslation(); const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(initial); const current = useRef(initial);
  const [selection, setSelection] = useState<Selection | null>(null); const selected = useRef<Selection | null>(initial.history.view.selection);
  const [highlight, setHighlight] = useState(initial.history.view.selection); const [hasFailure, setHasFailure] = useState(false);
  const scroll = useRef<HTMLDivElement>(null); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [plan, setPlan] = useState<EditPlan | null>(null); const [modal, setModal] = useState<'more' | 'phases' | null>(null);
  const [metadata, setMetadata] = useState<ProcedureDetails | null>(null); const [discard, setDiscard] = useState(false);
  const [busy, setBusy] = useState(false); const locked = useRef(false);
  const [error, setError] = useState<string | null>(null); const failed = useRef<(() => Promise<void>) | null>(null);
  const { header: headerRef, toolbar: toolbarRef, footer: footerRef, flow } = useBuilderLayout();
  const clip = useSyncExternalStore(graphClipboard.subscribe, graphClipboard.get);
  const { procedure, revision, history } = snapshot; const graph = revision.graph;
  const basePath = '/build/' + encodeURIComponent(procedure.id);
  const view = (): BuilderView => ({ scrollTop: flow ? window.scrollY : scroll.current?.scrollTop ?? 0, selection: selected.current });
  function update(value: BuilderSnapshot) { current.current = value; setSnapshot(value); }
  function explain(reason: unknown) {
    return t(reason instanceof BuilderError ? 'builder.errors.' + reason.code :
      reason instanceof Error && reason.name === 'ConflictError' ? 'builder.errors.stale' : 'builder.saveError');
  }
  async function run(operation: () => Promise<void>) {
    if (locked.current) return false; locked.current = true; setBusy(true);
    try { await operation(); failed.current = null; setHasFailure(false); setError(null); return true; }
    catch (reason) { failed.current = operation; setHasFailure(true); setError(explain(reason)); return false; }
    finally { locked.current = false; setBusy(false); }
  }
  function persistView() {
    if (locked.current || failed.current) return;
    const source = current.current; const layout = view();
    const operation = async () => { await builderService.saveView(source, layout); };
    // View writes share the storage queue, but never lock graph controls or consume navigation.
    void operation().catch((reason: unknown) => {
      if (current.current.revision.id !== source.revision.id || current.current.revision.editVersion !== source.revision.editVersion) return;
      failed.current = operation; setHasFailure(true); setError(explain(reason));
    });
  }
  function select(value: Selection | null) { selected.current = value; setSelection(value); setHighlight(value); if (!failed.current) setError(null); persistView(); }
  useLayoutEffect(() => {
    if (flow) window.scrollTo({ top: initial.history.view.scrollTop });
    else {
      if (window.scrollY !== 0) window.scrollTo({ top: 0 });
      if (scroll.current) scroll.current.scrollTop = initial.history.view.scrollTop;
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [initial.history.view.scrollTop, flow]);
  useEffect(() => {
    if (!flow) return;
    const changed = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(persistView, 250); };
    window.addEventListener('scroll', changed); return () => window.removeEventListener('scroll', changed);
  });
  function focus(id: string) {
    select(null); requestAnimationFrame(() => {
      const row = document.getElementById('builder-node-' + id); row?.scrollIntoView({ block: flow ? 'start' : 'nearest' });
      if (flow) window.scrollBy({ top: -(toolbarRef.current?.getBoundingClientRect().height ?? 0) - 8 });
      row?.querySelector('button')?.focus({ preventScroll: true });
    });
  }
  function editor(id: string, saved = current.current) {
    void navigate(basePath + '/step/' + encodeURIComponent(id) + '?revision=' + encodeURIComponent(saved.revision.id));
  }
  async function commit(value: EditPlan) {
    return run(async () => {
      const before = current.current; const nextView = view();
      if (value.createdId) nextView.selection = { kind: 'node', nodeId: value.createdId };
      else if (nextView.selection && !value.graph.nodes.some((node) => node.id === (nextView.selection?.kind === 'edge' ? nextView.selection.edge.nodeId : nextView.selection?.nodeId))) nextView.selection = null;
      const saved = await builderService.commit(before, value.graph, value.label, nextView); update(saved);
      if (graphClipboard.get()?.mode === 'cut') graphClipboard.set(null);
      selected.current = nextView.selection; setHighlight(nextView.selection); setPlan(null); setSelection(null); setModal(null);
      if (value.openEditor && value.createdId) editor(value.createdId, saved);
      else if (before.revision.id !== saved.revision.id) void navigate(basePath + '?revision=' + encodeURIComponent(saved.revision.id), { replace: true });
    });
  }
  async function edit(value: Edit, preview: boolean, openEditor = false) {
    try {
      const result = applyEdit(current.current.revision.graph, value, () => crypto.randomUUID());
      if (JSON.stringify(result.graph) === JSON.stringify(current.current.revision.graph)) {
        select(null); setModal(null); return true;
      }
      const proposed = { ...result, label: value.type, openEditor };
      setError(null); if (preview) { setPlan(proposed); return false; } return commit(proposed);
    } catch (reason) { setError(explain(reason)); return false; }
  }
  function copy(mode: 'copy' | 'cut', value: ClipSelection) {
    try {
      const source = current.current;
      const payload = { mode, procedureId: source.procedure.id, revisionId: source.revision.id,
        editVersion: source.revision.editVersion, graph: structuredClone(source.revision.graph), selection: value };
      if (mode === 'cut') assertMovable(payload);
      graphClipboard.set(payload); select(null);
    } catch (reason) { setError(explain(reason)); }
  }
  function paste(target: PasteTarget) {
    try {
      const payload = graphClipboard.get(); if (!payload) return; const source = current.current;
      const next = pasteGraph(source.revision.graph, target, payload, { procedureId: source.procedure.id,
        revisionId: source.revision.id, editVersion: source.revision.editVersion, newId: () => crypto.randomUUID() });
      setError(null); setPlan({ graph: next, label: payload.mode === 'cut' ? 'move' : 'paste' });
    } catch (reason) { setError(explain(reason)); }
  }
  function travel(direction: 'undo' | 'redo') {
    if ((direction === 'undo' ? current.current.history.past : current.current.history.future).length === 0) return;
    void run(async () => { update(await builderService.travel(current.current, direction)); if (graphClipboard.get()?.mode === 'cut') graphClipboard.set(null);
      selected.current = null; setHighlight(null); setSelection(null); setPlan(null); });
  }
  async function leave() {
    if (locked.current) { try { await builderService.flush(); } catch { return; } }
    if (failed.current) return;
    await run(async () => { await builderService.flush(); await builderService.saveView(current.current, view());
      void navigate('/procedure/' + encodeURIComponent(procedure.id)); });
  }
  useUnsavedNavigation(busy || hasFailure || Boolean(plan || modal || metadata || selection || discard), { onBack: () => {
    if (plan) setPlan(null); else if (metadata) setMetadata(null); else if (modal) setModal(null); else if (selection) select(null); else void leave();
  }, beforeUnloadDirty: busy || hasFailure });
  function shortcuts(event: KeyboardEvent<HTMLElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"]'))) return;
    const key = event.key.toLowerCase();
    if (key === 'z' || key === 'y') { event.preventDefault(); if (!plan) travel(key === 'y' || event.shiftKey ? 'redo' : 'undo'); }
    else if ((key === 'c' || key === 'x') && selection && selection.kind !== 'edge') { event.preventDefault(); copy(key === 'c' ? 'copy' : 'cut', selection); }
    else if (key === 'v' && selection) {
      event.preventDefault(); if (selection.kind === 'edge') paste({ kind: 'edge', edge: selection.edge });
      else if (nodeAt(graph, selection.nodeId).kind === 'multitask') paste({ kind: 'activity-list', nodeId: selection.nodeId });
    }
  }
  const modalOpen = Boolean(selection || plan || modal || metadata || discard);
  const retry = () => { if (failed.current) void run(failed.current); };
  return <section className={'nf-builder nf-stack' + (flow ? ' nf-builder-flow' : '')} aria-label={t('pages.07')} onKeyDown={shortcuts}>
    <header ref={headerRef} className="nf-builder-header nf-row"><Button icon="back" aria-label={t('common.back')} onClick={() => { void leave(); }} />
      <div className="nf-builder-heading"><h1>{procedure.title}</h1><p className="nf-meta" data-revision-id={revision.id} data-revision-state={revision.state}>
        {revision.state === 'ready' ? t('procedure.workingCopy') + ' · ' + t('procedure.readyVersion', { version: revision.revisionNumber }) : t('status.draft')}</p></div>
      <Button aria-label={t('builder.more')} onClick={() => setModal('more')}>···</Button>
      {clip?.mode === 'cut' && <div className="nf-builder-pending nf-row"><span role="status">{t('builder.movePending')}</span><Button onClick={() => graphClipboard.set(null)}>{t('builder.cancelMove')}</Button></div>}
      {error && !modalOpen && <div className="nf-stack" role="alert">{error}<div className="nf-row"><Button onClick={() => { if (failed.current) void run(failed.current); }}>{t('common.retry')}</Button>
        <Button onClick={() => setDiscard(true)}>{t('builder.reload')}</Button></div></div>}
    </header>
    <div ref={toolbarRef} className="nf-builder-toolbar nf-row" role="toolbar" aria-label={t('builder.tools')}>
      <Button aria-pressed>{t('builder.outline')}</Button><Button disabled disabledReason={t('builder.graphPending')}>{t('builder.graph')}</Button>
      <Button aria-label={t('builder.undo')} disabled={busy || history.past.length === 0 || Boolean(plan)} disabledReason={t('builder.noUndo')} onClick={() => travel('undo')}>↶</Button>
      <Button aria-label={t('builder.redo')} disabled={busy || history.future.length === 0 || Boolean(plan)} disabledReason={t('builder.noRedo')} onClick={() => travel('redo')}>↷</Button>
    </div>
    <div ref={scroll} className="nf-builder-scroll" data-testid="builder-scroll" onScroll={() => {
      if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(persistView, 250);
    }}><Outline graph={graph} selection={highlight} select={select} focus={focus} /></div>
    <footer ref={footerRef} className="nf-row nf-builder-footer">
      <Button disabled={busy || hasFailure || revision.state === 'ready'} disabledReason={t('builder.previewNeedsDraft')}
        onClick={() => { void run(async () => { await builderService.flush(); await builderService.saveView(current.current, view());
          void navigate('/run/' + encodeURIComponent(procedure.id) + '?preview=draft&revision=' + encodeURIComponent(revision.id)); }); }}>{t('builder.preview')}</Button>
      <Button disabled={busy || hasFailure || revision.state === 'ready'} disabledReason={t('builder.previewNeedsDraft')}
        onClick={() => { void run(async () => { await builderService.flush(); await builderService.saveView(current.current, view());
          void navigate(basePath + '/check?revision=' + encodeURIComponent(revision.id)); }); }}>{t('builder.check')}</Button>
    </footer>
    {!plan && selection?.kind === 'edge' && <EdgeActions key={JSON.stringify(selection.edge)} graph={graph} edge={selection.edge}
      close={() => select(null)} edit={(value, preview, openEditor) => { void edit(value, preview, openEditor); }}
      paste={() => paste({ kind: 'edge', edge: selection.edge })} hasClipboard={Boolean(clip)} focus={focus} busy={busy} error={error} retry={retry} retryable={hasFailure} />}
    {!plan && selection && selection.kind !== 'edge' && <NodeActions key={JSON.stringify(selection)} graph={graph} selection={selection}
      close={() => select(null)} edit={edit} copy={copy} pasteActivity={(nodeId) => paste({ kind: 'activity-list', nodeId })}
      canPasteActivity={clip?.selection.kind === 'activity'} openEditor={editor} select={select} busy={busy} error={error} retry={retry} retryable={hasFailure} />}
    {plan && <ImpactSheet before={graph} plan={plan} busy={busy} error={error} cancel={() => {
      if (!busy) { setPlan(null); failed.current = null; setHasFailure(false); setError(null); persistView(); }
    }} confirm={() => { void commit(plan); }} />}
    <Sheet open={modal === 'more' && !plan} title={t('builder.more')} onClose={() => setModal(null)}>
      {error && <p role="alert">{error}</p>}<Button onClick={() => setModal('phases')}>{t('builder.managePhases')}</Button>
      <Button disabled disabledReason={t('builder.graphPending')}>{t('builder.autoLayout')}</Button>
      <Button onClick={() => { void run(async () => { setMetadata(await procedureService.load(procedure.id)); setModal(null); }); }}>{t('procedure.editDetails')}</Button>
      <Link to={'/data/procedures?procedure=' + encodeURIComponent(procedure.id)}>{t('builder.exportDraft')}</Link>
    </Sheet>
    {modal === 'phases' && !plan && <PhaseSheet graph={graph} edit={edit} close={() => setModal(null)} error={error} busy={busy} retry={retry} retryable={hasFailure} />}
    {metadata && <MetadataSheet details={metadata} onClose={() => setMetadata(null)} onSaved={async () => { update(await builderService.load(procedure.id, current.current.revision.id)); }} />}
    <Dialog open={discard} title={t('builder.discardPending')} onClose={() => setDiscard(false)}>
      <Button onClick={() => setDiscard(false)}>{t('common.cancel')}</Button><Button variant="danger" onClick={() => {
        void run(async () => { const loaded = await builderService.load(procedure.id); update(loaded); setDiscard(false); setPlan(null);
          selected.current = null; setHighlight(null); setSelection(null); void navigate(basePath + '?revision=' + encodeURIComponent(loaded.revision.id), { replace: true }); });
      }}>{t('builder.reload')}</Button>
    </Dialog>
  </section>;
}
