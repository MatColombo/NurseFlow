import { useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BuilderError, type BuilderView, type CanvasView, type EdgeRef, type Selection } from '@domain/builder/model';
import { graphMetrics, makeScene } from '@domain/builder/scene';
import { useAppearance } from '@app/appearance-context';
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
import type { FocusRequest } from './graph/GraphCanvas';
import { edgeTitle } from './labels';
import { connectionProblem } from '@domain/builder/targets';
import { editorPath, type PathReturn } from './path-route';
import { checkPath, type CheckReturn } from '@features/check/navigation';

import GraphCanvas from './graph/GraphCanvas';

export function BuilderEditor({ initial, pathReturn, checkReturn, checkSelection }: { initial: BuilderSnapshot; pathReturn?: PathReturn | undefined; checkReturn?: CheckReturn | undefined; checkSelection?: Selection | undefined }) {
  const { t } = useTranslation(); const navigate = useNavigate();
  const { preferences } = useAppearance();
  const [mode, setMode] = useState(initial.editorMode);
  const [canvas, setCanvas] = useState(initial.history.view.canvas); const camera = useRef(canvas);
  const outlineTop = useRef(initial.history.view.scrollTop);
  const [picking, setPicking] = useState<{ edge: EdgeRef; revisionId: string; version: number } | null>(pathReturn ? { edge: pathReturn.edge, revisionId: initial.revision.id, version: initial.revision.editVersion } : null);
  const [targetMode, setTargetMode] = useState<'outline' | 'graph'>('graph');
  const focusNode = checkSelection?.kind === 'edge' ? checkSelection.edge.nodeId : checkSelection?.nodeId;
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(pathReturn || focusNode ? { id: pathReturn?.edge.nodeId ?? focusNode!, sequence: 1 } : null); const focusSequence = useRef(pathReturn || focusNode ? 1 : 0);
  const displayMode = picking ? targetMode : mode;
  const [snapshot, setSnapshot] = useState(initial); const current = useRef(initial);
  const [selection, setSelection] = useState<Selection | null>(checkSelection ?? null); const selected = useRef<Selection | null>(checkSelection ?? initial.history.view.selection);
  const [highlight, setHighlight] = useState(checkSelection ?? initial.history.view.selection); const [hasFailure, setHasFailure] = useState(false);
  const scroll = useRef<HTMLDivElement>(null); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [plan, setPlan] = useState<EditPlan | null>(null); const [modal, setModal] = useState<'more' | 'phases' | null>(null);
  const [metadata, setMetadata] = useState<ProcedureDetails | null>(null); const [discard, setDiscard] = useState(false);
  const [busy, setBusy] = useState(false); const locked = useRef(false);
  const [error, setError] = useState<string | null>(null); const failed = useRef<(() => Promise<void>) | null>(null);
  const { header: headerRef, toolbar: toolbarRef, footer: footerRef, chrome: chromeRef, flow } = useBuilderLayout(displayMode === 'graph' ? 208 : 160);
  const clip = useSyncExternalStore(graphClipboard.subscribe, graphClipboard.get);
  const { procedure, revision, history } = snapshot; const graph = revision.graph;
  const basePath = '/build/' + encodeURIComponent(procedure.id);
  const view = (): BuilderView => checkReturn ? { ...initial.history.view } : pathReturn ? { ...initial.history.view, selection: { kind: 'node', nodeId: pathReturn.stepId } } :
    ({ scrollTop: Math.max(0, displayMode === 'outline' && !picking ? flow ? window.scrollY : scroll.current?.scrollTop ?? 0 : outlineTop.current), selection: selected.current, canvas: camera.current });
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
    if (pathReturn) return;
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
  function scheduleView() { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(persistView, 250); }
  function canvasChanged(value: CanvasView) { camera.current = value; setCanvas(value); scheduleView(); }
  function switchMode(value: 'outline' | 'graph') {
    setFocusRequest(null);
    if (displayMode === 'outline') outlineTop.current = view().scrollTop;
    persistView();
    if (picking || pathReturn) { setTargetMode(value); return; }
    setMode(value);
    const operation = async () => { await builderService.saveMode(value); };
    void operation().catch((reason: unknown) => { failed.current = operation; setHasFailure(true); setError(explain(reason)); });
  }
  function chooseDestination(edge: EdgeRef) {
    outlineTop.current = view().scrollTop;
    setPicking({ edge, revisionId: current.current.revision.id, version: current.current.revision.editVersion }); setTargetMode('graph'); setSelection(null);
    setFocusRequest({ id: edge.nodeId, sequence: ++focusSequence.current });
  }
  function cancelDestination() {
    if (pathReturn) { void navigate(editorPath(initial.procedure.id, current.current.revision.id, pathReturn), { replace: true }); return; }
    const edge = picking?.edge; setPicking(null); setFocusRequest(null); if (edge) select({ kind: 'edge', edge });
  }
  function pickTarget(id: string) {
    if (!picking) return;
    if (picking.revisionId !== current.current.revision.id || picking.version !== current.current.revision.editVersion) { setError(t('builder.errors.stale')); return; }
    void edit({ type: 'connect', edge: picking.edge, destination: { kind: 'node', nodeId: id } }, true);
  }
  useLayoutEffect(() => {
    if (flow && displayMode === 'outline') window.scrollTo({ top: outlineTop.current, behavior: 'instant' });
    else {
      if (window.scrollY !== 0) window.scrollTo({ top: 0, behavior: 'instant' });
      if (scroll.current) scroll.current.scrollTop = displayMode === 'outline' ? outlineTop.current : 0;
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [displayMode, flow, picking]);
  useLayoutEffect(() => {
    if (!flow || displayMode !== 'outline' || picking) return;
    const changed = () => { outlineTop.current = Math.max(0, window.scrollY); scheduleView(); };
    window.addEventListener('scroll', changed); return () => window.removeEventListener('scroll', changed);
  });
  function focus(id: string) {
    if (displayMode === 'graph') { select(null); setFocusRequest({ id, sequence: ++focusSequence.current }); return; }
    select(null); requestAnimationFrame(() => {
      const row = document.getElementById('builder-node-' + id);
      if (row && flow) window.scrollTo({ top: Math.max(0, window.scrollY + row.getBoundingClientRect().top - (toolbarRef.current?.getBoundingClientRect().height ?? 0) - 8) });
      else row?.scrollIntoView({ block: 'nearest' });
      row?.querySelector('button')?.focus({ preventScroll: true });
    });
  }
  function editor(id: string, saved = current.current) {
    const query = new URLSearchParams({ revision: saved.revision.id }); if (checkReturn) query.set('checkReturn', JSON.stringify(checkReturn));
    void navigate(basePath + '/step/' + encodeURIComponent(id) + '?' + query.toString());
  }
  async function commit(value: EditPlan) {
    return run(async () => {
      const before = current.current; const nextView = view();
      if (value.createdId) nextView.selection = { kind: 'node', nodeId: value.createdId };
      else if (nextView.selection && !value.graph.nodes.some((node) => node.id === (nextView.selection?.kind === 'edge' ? nextView.selection.edge.nodeId : nextView.selection?.nodeId))) nextView.selection = null;
      const saved = await builderService.commit(before, value.graph, value.label, nextView); update(saved);
      if (graphClipboard.get()?.mode === 'cut') graphClipboard.set(null);
      selected.current = nextView.selection; setHighlight(nextView.selection); setPlan(null); setSelection(null); setModal(null); setPicking(null); setFocusRequest(null);
      if (value.openEditor && value.createdId && nodeAt(saved.revision.graph, value.createdId).kind !== 'multitask') editor(value.createdId, saved);
      else if (pathReturn) void navigate(editorPath(procedure.id, saved.revision.id, pathReturn), { replace: true });
      else if (before.revision.id !== saved.revision.id) void navigate(basePath + '?revision=' + encodeURIComponent(saved.revision.id), { replace: true });
    });
  }
  async function edit(value: Edit, preview: boolean, openEditor = false) {
    try {
      const result = applyEdit(current.current.revision.graph, value, () => crypto.randomUUID());
      if (JSON.stringify(result.graph) === JSON.stringify(current.current.revision.graph)) {
        select(null); setModal(null); setPicking(null); setFocusRequest(null);
        if (pathReturn) void navigate(editorPath(procedure.id, current.current.revision.id, pathReturn), { replace: true });
        return true;
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
    if (pathReturn) { cancelDestination(); return; }
    if (locked.current) { try { await builderService.flush(); } catch { return; } }
    if (failed.current) return;
    await run(async () => { await builderService.flush(); await builderService.saveView(current.current, view());
      void navigate(checkReturn ? checkPath(procedure.id, checkReturn) : '/procedure/' + encodeURIComponent(procedure.id)); });
  }
  useUnsavedNavigation(busy || hasFailure || Boolean(plan || picking || modal || metadata || selection || discard), { onBack: () => {
    if (plan) setPlan(null); else if (picking) cancelDestination(); else if (metadata) setMetadata(null); else if (modal) setModal(null); else if (selection) select(null); else void leave();
  }, beforeUnloadDirty: busy || hasFailure });
  function shortcuts(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && picking && !plan && !event.defaultPrevented && !(event.target instanceof Element && event.target.closest('dialog'))) {
      event.preventDefault(); cancelDestination(); return;
    }
    if (!(event.ctrlKey || event.metaKey) || event.altKey || (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"]'))) return;
    const key = event.key.toLowerCase();
    if (key === 'z' || key === 'y') { event.preventDefault(); if (!plan && !picking) travel(key === 'y' || event.shiftKey ? 'redo' : 'undo'); }
    else if ((key === 'c' || key === 'x') && selection && selection.kind !== 'edge') { event.preventDefault(); copy(key === 'c' ? 'copy' : 'cut', selection); }
    else if (key === 'v' && selection) {
      event.preventDefault(); if (selection.kind === 'edge') paste({ kind: 'edge', edge: selection.edge });
      else if (nodeAt(graph, selection.nodeId).kind === 'multitask') paste({ kind: 'activity-list', nodeId: selection.nodeId });
    }
  }
  const modalOpen = Boolean(selection || plan || picking || modal || metadata || discard);
  const retry = () => { if (failed.current) void run(failed.current); };
  function autoLayout() {
    const width = scroll.current?.clientWidth ?? window.innerWidth; const metrics = graphMetrics(preferences.uiScalePt, width);
    const scene = makeScene(current.current.revision.graph, camera.current.focusItems, width, metrics);
    void edit({ type: 'layout', positions: Object.fromEntries(scene.nodes.map((node) => [node.id, { x: node.x / metrics.ratio, y: node.y / metrics.ratio }])) }, false);
  }
  return <section className={'nf-builder nf-stack' + (flow ? ' nf-builder-flow' : '')} aria-label={t('pages.07')} onKeyDown={shortcuts}>
    <header ref={headerRef} className="nf-builder-header nf-row"><Button icon="back" aria-label={t(checkReturn ? 'check.back' : 'common.back')} onClick={() => { if (picking) cancelDestination(); else void leave(); }} />
      <div className="nf-builder-heading"><h1>{procedure.title}</h1><p className="nf-meta" data-revision-id={revision.id} data-revision-state={revision.state}>
        {revision.state === 'ready' ? t('procedure.workingCopy') + ' · ' + t('procedure.readyVersion', { version: revision.revisionNumber }) : t('status.draft')}</p></div>
      <Button aria-label={t('builder.more')} disabled={Boolean(picking)} disabledReason={t('canvas.chooseDestination')} onClick={() => setModal('more')}>···</Button>
      {clip?.mode === 'cut' && <div className="nf-builder-pending nf-row"><span role="status">{t('builder.movePending')}</span><Button onClick={() => graphClipboard.set(null)}>{t('builder.cancelMove')}</Button></div>}
      {error && !modalOpen && <div className="nf-stack" role="alert">{error}<div className="nf-row"><Button onClick={() => { if (failed.current) void run(failed.current); }}>{t('common.retry')}</Button>
        <Button onClick={() => setDiscard(true)}>{t('builder.reload')}</Button></div></div>}
    </header>
    <div ref={toolbarRef} className="nf-builder-toolbar nf-row" role="toolbar" aria-label={t('builder.tools')}>
      <Button aria-pressed={displayMode === 'outline'} onClick={() => switchMode('outline')}>{t('builder.outline')}</Button><Button aria-pressed={displayMode === 'graph'} onClick={() => switchMode('graph')}>{t('builder.graph')}</Button>
      <Button aria-label={t('builder.undo')} disabled={busy || history.past.length === 0 || Boolean(plan || picking)} disabledReason={t('builder.noUndo')} onClick={() => travel('undo')}>↶</Button>
      <Button aria-label={t('builder.redo')} disabled={busy || history.future.length === 0 || Boolean(plan || picking)} disabledReason={t('builder.noRedo')} onClick={() => travel('redo')}>↷</Button>
    </div>
    {picking && <div ref={chromeRef} className="nf-target-context nf-stack"><strong>{t('canvas.pathFor', { title: edgeTitle(graph, picking.edge, t) })}</strong>
      {pathReturn && <Button onClick={() => { setPicking(null); select({ kind: 'edge', edge: pathReturn.edge }); }}>{t('builder.createNext')}</Button>}
      <Button onClick={cancelDestination}>{t('common.cancel')}</Button>{error && <div role="alert">{error}<Button onClick={() => setDiscard(true)}>{t('builder.reload')}</Button></div>}</div>}
    <div ref={scroll} className={'nf-builder-scroll' + (displayMode === 'graph' ? ' nf-builder-scroll--graph' : '')} data-testid="builder-scroll" onScroll={() => {
      if (displayMode === 'outline' && !picking) { outlineTop.current = Math.max(0, scroll.current?.scrollTop ?? 0); scheduleView(); }
    }}>{displayMode === 'outline' ? <Outline graph={graph} selection={highlight} select={select} focus={focus}
      pickNode={picking ? pickTarget : undefined} targetProblem={picking ? (id) => { const problem = connectionProblem(graph, picking.edge, id); return problem ? t(problem === 'connected' ? 'canvas.connected' : 'builder.errors.' + problem) : null; } : undefined} /> :
      <GraphCanvas graph={graph} view={canvas} scale={preferences.uiScalePt} selection={highlight}
        picking={picking?.edge ?? null} request={focusRequest} chrome={chromeRef} change={canvasChanged} select={select} pick={pickTarget} clear={() => { if (!picking) select(null); }} />}
    </div>
    <footer ref={footerRef} className="nf-row nf-builder-footer">
      <Button disabled={busy || hasFailure || revision.state === 'ready' || Boolean(picking)} disabledReason={t(picking ? 'canvas.chooseDestination' : 'builder.previewNeedsDraft')}
        onClick={() => { void run(async () => { await builderService.flush(); await builderService.saveView(current.current, view());
          void navigate('/run/' + encodeURIComponent(procedure.id) + '?preview=draft&revision=' + encodeURIComponent(revision.id)); }); }}>{t('builder.preview')}</Button>
      <Button disabled={busy || hasFailure || revision.state === 'ready' || Boolean(picking)} disabledReason={t(picking ? 'canvas.chooseDestination' : 'builder.previewNeedsDraft')}
        onClick={() => { void run(async () => { await builderService.flush(); await builderService.saveView(current.current, view());
          void navigate(basePath + '/check?revision=' + encodeURIComponent(revision.id)); }); }}>{t('builder.check')}</Button>
    </footer>
    {!plan && !picking && selection?.kind === 'edge' && <EdgeActions key={JSON.stringify(selection.edge)} graph={graph} edge={selection.edge} chooseTarget={() => chooseDestination(selection.edge)}
      close={() => { if (pathReturn) cancelDestination(); else select(null); }} edit={(value, preview, openEditor) => { void edit(value, preview, openEditor); }}
      paste={() => paste({ kind: 'edge', edge: selection.edge })} hasClipboard={Boolean(clip)} focus={focus} busy={busy} error={error} retry={retry} retryable={hasFailure} />}
    {!plan && selection && selection.kind !== 'edge' && <NodeActions key={JSON.stringify(selection)} graph={graph} selection={selection}
      close={() => select(null)} edit={edit} copy={copy} pasteActivity={(nodeId) => paste({ kind: 'activity-list', nodeId })}
      canPasteActivity={clip?.selection.kind === 'activity'} openEditor={editor} select={select} busy={busy} error={error} retry={retry} retryable={hasFailure} />}
    {plan && <ImpactSheet before={graph} plan={plan} busy={busy} error={error} cancel={() => {
      if (!busy) { setPlan(null); failed.current = null; setHasFailure(false); setError(null); persistView(); }
    }} confirm={() => { void commit(plan); }} />}
    <Sheet open={modal === 'more' && !plan} title={t('builder.more')} onClose={() => setModal(null)}>
      {error && <p role="alert">{error}</p>}<Button onClick={() => setModal('phases')}>{t('builder.managePhases')}</Button>
      <Button onClick={autoLayout}>{t('builder.autoLayout')}</Button>
      <Button onClick={() => { void run(async () => { setMetadata(await procedureService.load(procedure.id)); setModal(null); }); }}>{t('procedure.editDetails')}</Button>
      <Link to={'/data/procedures?procedure=' + encodeURIComponent(procedure.id)}>{t('builder.exportDraft')}</Link>
    </Sheet>
    {modal === 'phases' && !plan && <PhaseSheet graph={graph} edit={edit} close={() => setModal(null)} error={error} busy={busy} retry={retry} retryable={hasFailure} />}
    {metadata && <MetadataSheet details={metadata} onClose={() => setMetadata(null)} onSaved={async () => { update(await builderService.load(procedure.id, current.current.revision.id)); }} />}
    <Dialog open={discard} title={t('builder.discardPending')} onClose={() => setDiscard(false)}>
      <Button onClick={() => setDiscard(false)}>{t('common.cancel')}</Button><Button variant="danger" onClick={() => {
        void run(async () => { const loaded = await builderService.load(procedure.id); update(loaded); setDiscard(false); setPlan(null); setPicking(null);
          selected.current = null; setHighlight(null); setSelection(null); void navigate(basePath + '?revision=' + encodeURIComponent(loaded.revision.id), { replace: true }); });
      }}>{t('builder.reload')}</Button>
    </Dialog>
  </section>;
}
