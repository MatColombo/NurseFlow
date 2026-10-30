import { useId, useLayoutEffect, useMemo, useRef, useState, type RefCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Graph } from '@domain/model';
import type { CanvasView, EdgeRef, Selection } from '@domain/builder/model';
import { focusPath, graphMetrics, makeScene } from '@domain/builder/scene';
import { centerAt, fitViewport, zoomAt } from '@domain/builder/viewport';
import { connectionProblem } from '@domain/builder/targets';
import { activityScopeKey, assertEditableGraph, edgeKey } from '@domain/builder/structure';
import { Button } from '@shared/components';
import { edgeTitle, titleOf } from '../labels';
import { GraphBrowse } from './GraphBrowse';
import { GraphCard } from './GraphCard';
import { useCanvasGestures } from './useCanvasGestures';
import './graph.css';

export type FocusRequest = { id: string; sequence: number };
export default function GraphCanvas({ graph, view, scale, selection, picking, request, chrome, change, select, pick, clear }: {
  graph: Graph; view: CanvasView; scale: number; selection: Selection | null; picking: EdgeRef | null; request: FocusRequest | null;
  chrome: RefCallback<HTMLDivElement>; change(view: CanvasView): void; select(value: Selection): void; pick(id: string): void; clear(): void;
}) {
  const { t } = useTranslation(); const viewport = useRef<HTMLDivElement>(null); const marker = useId();
  const [size, setSize] = useState({ width: 0, height: 0 }); const [browse, setBrowse] = useState<{ nodeId: string | null } | null>(null);
  const [located, setLocated] = useState<string | null>(null); const handled = useRef(-1);
  useLayoutEffect(() => {
    const node = viewport.current; if (!node) return;
    const measure = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    measure(); const observer = new ResizeObserver(measure); observer.observe(node); return () => observer.disconnect();
  }, []);
  const metrics = useMemo(() => graphMetrics(scale, size.width || 320), [scale, size.width]);
  const scene = useMemo(() => makeScene(graph, view.focusItems, size.width || 320, metrics), [graph, view.focusItems, size.width, metrics]);
  const owners = useMemo(() => assertEditableGraph(graph), [graph]);
  const reasons = useMemo(() => new Map(graph.nodes.map((node) => [node.id, picking ? connectionProblem(graph, picking, node.id) : null])), [graph, picking]);
  function reveal(id: string, focus = focusPath(graph, id, view.focusItems)) {
    const nextScene = makeScene(graph, focus, size.width || 320, metrics); const node = nextScene.nodes.find((node) => node.id === id);
    if (!node) return;
    setLocated(id); change(centerAt({ ...view, focusItems: focus }, node, size.width, size.height));
    requestAnimationFrame(() => {
      const control = document.getElementById('graph-node-' + id);
      if (control instanceof HTMLButtonElement && !control.disabled) control.focus({ preventScroll: true }); else viewport.current?.focus({ preventScroll: true });
    });
  }
  useLayoutEffect(() => {
    if (!size.width || !size.height) return;
    const id = request && handled.current !== request.sequence ? request.id : !view.initialized ? graph.nodes.find((node) => node.kind === 'start')?.id : undefined;
    if (!id) return;
    // Center after the measured viewport has been painted, including lazy-load/reflow.
    const frame = requestAnimationFrame(() => { if (request) handled.current = request.sequence; reveal(id); });
    return () => cancelAnimationFrame(frame);
  });
  const fit = () => change(fitViewport(view, scene, size.width, size.height));
  const gestures = useCanvasGestures(viewport, view, change, fit, clear);
  const selectedId = selection?.kind === 'edge' ? selection.edge.nodeId : selection?.nodeId;
  const centerId = [selectedId, located].find((id) => id && graph.nodes.some((node) => node.id === id));
  const zoom = (factor: number) => change(zoomAt(view, view.zoom * factor, { x: size.width / 2, y: size.height / 2 }));
  const edgeAction = (edge: EdgeRef) => { if (view.zoom < .99) reveal(edge.nodeId); else if (!picking) select({ kind: 'edge', edge }); };
  return <div className="nf-graph-shell">
    <div ref={chrome} className="nf-graph-controls nf-row" role="group" aria-label={t('canvas.controls')}>
      <Button aria-label={t('canvas.zoomIn')} disabled={view.zoom >= 3} disabledReason={t('canvas.zoomLimit')} onClick={() => zoom(1.25)}>+</Button>
      <Button aria-label={t('canvas.zoomOut')} disabled={view.zoom <= .05} disabledReason={t('canvas.zoomLimit')} onClick={() => zoom(.8)}>−</Button>
      <Button onClick={fit}>{t('canvas.fit')}</Button>
      <Button aria-label={t('canvas.center')} disabled={!centerId} disabledReason={t('canvas.noSelection')} onClick={() => { if (centerId) reveal(centerId); }}>◎</Button>
      <Button onClick={() => setBrowse({ nodeId: null })}>{t('canvas.find')}</Button>
      <output aria-label={t('canvas.zoomLevel')}>{Math.round(view.zoom * 100)}%</output>
    </div>
    {view.zoom < .99 && <p className="nf-note" role="status">{t('canvas.overview')}</p>}
    <div ref={viewport} className="nf-graph-viewport" role="region" aria-label={t('canvas.surface')} tabIndex={0} {...gestures}
      data-camera-x={view.x} data-camera-y={view.y} data-camera-zoom={view.zoom} data-camera-initialized={String(view.initialized)}
      onFocusCapture={(event) => {
        if (!(event.target instanceof Element) || !event.target.matches(':focus-visible') || event.target === event.currentTarget) return;
        const target = event.target.getBoundingClientRect(); const bounds = event.currentTarget.getBoundingClientRect();
        const anchor = { x: target.x + target.width / 2 - bounds.x, y: target.y + target.height / 2 - bounds.y };
        if (view.zoom < .99 || anchor.x < 0 || anchor.x > bounds.width || anchor.y < 0 || anchor.y > bounds.height) {
          const camera = zoomAt(view, Math.max(1, view.zoom), anchor);
          change({ ...camera, x: camera.x + bounds.width / 2 - anchor.x, y: camera.y + bounds.height / 2 - anchor.y });
        }
      }}>
      <svg className="nf-graph-svg" width="100%" height="100%" aria-label={t('canvas.diagram')}>
        <defs><marker id={marker} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse" markerUnits="strokeWidth">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--nf-primary)" />
        </marker></defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
          {graph.nodes.filter((node) => node.kind === 'multitask').map((group) => {
            const prefix = owners.get(group.id) ?? []; const tokens = group.activities.map((activity) => activityScopeKey(group.id, activity.id));
            const members = scene.nodes.filter((box) => box.id === group.id || tokens.includes(owners.get(box.id)?.[prefix.length] ?? ''));
            if (!members.length) return null;
            const left = Math.min(...members.map((box) => box.x)) - 8; const top = Math.min(...members.map((box) => box.y)) - 8;
            return <rect key={group.id} data-activity-region={group.id} x={left} y={top} width={Math.max(...members.map((box) => box.x + box.width)) - left + 8}
              height={Math.max(...members.map((box) => box.y + box.height)) - top + 8} rx="12" className="nf-graph-group-region" pointerEvents="none" />;
          })}
          {scene.edges.filter((edge) => edge.draw).map((edge) => <g key={edgeKey(edge.edge)}>
            <path d={edge.path} className={'nf-graph-line' + (selection?.kind === 'edge' && edgeKey(selection.edge) === edgeKey(edge.edge) ? ' nf-graph-line--selected' : '')}
              markerEnd={`url(#${marker})`} pointerEvents="none" />
            <path d={edge.path} className="nf-graph-edge-hit" data-graph-edge={edgeKey(edge.edge)} data-source={edge.edge.nodeId} data-target={edge.targetId}
              data-completion={edge.completion ? 'true' : undefined} role="button" tabIndex={picking ? -1 : 0} aria-disabled={Boolean(picking)}
              aria-label={t('canvas.edge', { title: edgeTitle(graph, edge.edge, t) }) + ' → ' + titleOf(graph.nodes.find((node) => node.id === edge.targetId)!, t)}
              onClick={() => edgeAction(edge.edge)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); edgeAction(edge.edge); } }}>
              <title>{edgeTitle(graph, edge.edge, t)}</title>
            </path>
          </g>)}
          {scene.nodes.map((box) => {
            const code = reasons.get(box.id); const reason = code ? t(code === 'connected' ? 'canvas.connected' : 'builder.errors.' + code) : null;
            return <GraphCard key={box.id} graph={graph} box={box} metrics={metrics} view={view} selection={selection} located={located === box.id}
              picking={Boolean(picking)} reason={reason} select={select} pick={pick} reveal={reveal} browse={(id) => setBrowse({ nodeId: id })} />;
          })}
        </g>
      </svg>
    </div>
    {browse && <GraphBrowse graph={graph} nodeId={browse.nodeId} close={() => setBrowse(null)} focusNode={reveal}
      focusItem={(nodeId, itemId) => reveal(nodeId, { ...view.focusItems, [nodeId]: itemId })} />}
  </div>;
}
