import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Graph } from '@domain/model';
import type { CanvasView } from '@domain/builder/model';
import type { MapProjection, MapRoute } from '@domain/map/projection';
import { mapScene } from '@domain/map/scene';
import { centerAt, fitViewport, zoomAt } from '@domain/builder/viewport';
import { Button } from '@shared/components';
import { titleOf } from '@features/builder/labels';
import { useCanvasGestures } from '@features/builder/graph/useCanvasGestures';
import { linkLabel, mapIcon, targetLabel } from './labels';
import '@features/builder/graph/graph.css';
import { ArrowMarkers } from '@features/builder/graph/ArrowMarkers';
import { activityRegions, layoutScopes } from '@domain/builder/scene';

export default function MapGraph({ graph, projection, route, current, scale, view, change, inspect }: {
  graph: Graph; projection: MapProjection; route: MapRoute; current?: string | undefined; scale: number;
  view: CanvasView; change(value: CanvasView): void; inspect(id: string): void;
}) {
  const { t } = useTranslation(); const viewport = useRef<HTMLDivElement>(null); const marker = useId();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [focusedEdge, setFocusedEdge] = useState<string | null>(null);
  const keyboardFocus = useRef(false);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { keyboardFocus.current = event.key === 'Tab' && !(event.target instanceof Element && event.target.closest('dialog')); };
    const pointer = () => { keyboardFocus.current = false; };
    window.addEventListener('keydown', key); window.addEventListener('pointerdown', pointer);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('pointerdown', pointer); };
  }, []);
  useLayoutEffect(() => {
    const node = viewport.current; if (!node) return;
    const measure = () => { if (node.clientWidth && node.clientHeight) setSize({ width: node.clientWidth, height: node.clientHeight }); };
    measure(); const observer = new ResizeObserver(measure); observer.observe(node); return () => observer.disconnect();
  }, []);
  const scene = useMemo(() => mapScene(graph, projection, scale, size.width || 320), [graph, projection, scale, size.width]);
  const fit = () => change(fitViewport(view, scene, size.width, size.height, .001));
  const center = () => { const box = scene.nodes.find((node) => node.id === current); if (box) change(centerAt({ ...view, zoom: 1 }, box, size.width, size.height)); };
  useLayoutEffect(() => {
    if (!size.width || !size.height || view.initialized) return;
    const frame = requestAnimationFrame(() => { if (current) center(); else fit(); });
    return () => cancelAnimationFrame(frame);
  });
  const gestures = useCanvasGestures(viewport, view, change, fit, () => setFocusedEdge(null), .001);
  const activeEdge = scene.edges.find((edge) => edge.key === focusedEdge);
  const toggleEdge = (key: string) => setFocusedEdge((current) => current === key ? null : key);
  const zoom = (factor: number) => change(zoomAt(view, view.zoom * factor, { x: size.width / 2, y: size.height / 2 }, .001));
  return <div className="nf-map-graph">
    <div ref={viewport} className="nf-graph-viewport" role="region" aria-label={t('map.canvas')} tabIndex={0} {...gestures}
      data-camera-x={view.x} data-camera-y={view.y} data-camera-zoom={view.zoom} data-camera-initialized={String(view.initialized)}
      onPointerDownCapture={(event) => { if (!(event.target instanceof Element && event.target.closest('[data-graph-edge]'))) setFocusedEdge(null); }}
      onFocusCapture={(event) => {
        if (!keyboardFocus.current || !(event.target instanceof Element) || event.target === event.currentTarget) return;
        keyboardFocus.current = false;
        const target = event.target.getBoundingClientRect(); const bounds = event.currentTarget.getBoundingClientRect();
        const anchor = { x: target.x + target.width / 2 - bounds.x, y: target.y + target.height / 2 - bounds.y };
        if (view.zoom < .99 || anchor.x < 0 || anchor.x > bounds.width || anchor.y < 0 || anchor.y > bounds.height) {
          const camera = zoomAt(view, Math.max(1, view.zoom), anchor);
          change({ ...camera, x: camera.x + bounds.width / 2 - anchor.x, y: camera.y + bounds.height / 2 - anchor.y });
        }
      }}>
      <svg className="nf-graph-svg" width="100%" height="100%" aria-label={t('canvas.diagram')}>
        <ArrowMarkers id={marker} />
        <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
          {activityRegions(graph, scene.nodes, layoutScopes(graph)).map((region) => <rect key={region.id} data-activity-region={region.id}
            x={region.x} y={region.y} width={region.width} height={region.height} rx="12" className="nf-graph-group-region" pointerEvents="none" />)}
          {scene.edges.map((edge) => {
            const target = projection.byId.get(edge.targetId!)!; const tone = target.kind === 'end' ? target.endKind : 'primary';
            return <g key={edge.key} data-end-kind={target.kind === 'end' ? target.endKind : undefined}
              data-edge-focus={activeEdge ? edge === activeEdge ? 'active' : 'dimmed' : undefined}>
            <path d={edge.path} markerEnd={`url(#${marker}-${tone})`} className="nf-map-line" pointerEvents="none"
            data-map-edge={edge.key} data-source={edge.edge.nodeId} data-target={edge.targetId} data-visited={route.visitedEdges.has(edge.key)}>
            <title>{linkLabel(projection, edge, t)} → {targetLabel(projection, edge, t)}</title>
          </path><path d={edge.path} className="nf-graph-edge-hit" data-graph-edge={edge.key} role="button" tabIndex={0}
            aria-label={linkLabel(projection, edge, t) + ' → ' + targetLabel(projection, edge, t)} aria-pressed={activeEdge === edge}
            onClick={() => toggleEdge(edge.key)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleEdge(edge.key); } }} />
          </g>; })}
          {scene.nodes.map((box) => {
            const node = projection.byId.get(box.id)!; const title = titleOf(node, t);
            const state = box.id === current ? 'current' : route.visitedNodes.has(box.id) ? 'visited' : undefined;
            const phase = 'phaseId' in node ? graph.phases.find((phase) => phase.id === node.phaseId)?.name : undefined;
            return <foreignObject key={box.id} x={box.x} y={box.y} width={box.width} height={box.height} data-map-node={box.id} data-route-state={state}
              data-node-kind={node.kind} data-end-kind={node.kind === 'end' ? node.endKind : undefined}
              data-edge-focus={activeEdge ? box.id === activeEdge.edge.nodeId || box.id === activeEdge.targetId ? 'active' : 'dimmed' : undefined}>
              <div className="nf-map-graph-card" data-graph-inspect={box.id} onClick={(event) => {
                if (event.target instanceof Element && event.target.closest('button')) return;
                event.currentTarget.querySelector('button')?.focus({ preventScroll: true }); inspect(box.id);
              }}>
                <div className="nf-graph-card-head" style={{ height: scene.metrics.header }}>
                  <p className="nf-meta nf-graph-phase" title={phase}>{phase || '\u00a0'}</p>
                  <Button purpose="view" className="nf-graph-title" icon={mapIcon(node)} onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); inspect(box.id); }} aria-label={t('map.inspect', { title })} aria-current={box.id === current ? 'step' : undefined}>{title}</Button>
                  <p className="nf-meta nf-graph-meta">{state && <>{state === 'current' ? '◎' : '✓'} {t('map.' + state)} · </>}{t('builder.kinds.' + node.kind)}{node.kind === 'end' && <> · {t('builder.ends.' + node.endKind)}</>}</p>
                </div>
                {box.ports.map((port) => {
                  const link = projection.edges.find((link) => link.edge === port.edge)!; const status = route.activities.get(link.key);
                  return <p className="nf-map-graph-port" key={link.key} style={{ height: scene.metrics.row }}
                    title={linkLabel(projection, link, t) + ' → ' + targetLabel(projection, link, t)}>
                    {linkLabel(projection, link, t)}{status && <> · {t('map.' + status)}</>} → {targetLabel(projection, link, t)}
                  </p>;
                })}
              </div>
            </foreignObject>;
          })}
        </g>
      </svg>
    </div>
    <div className="nf-map-controls nf-row" role="group" aria-label={t('canvas.controls')}>
      <Button purpose="view" onClick={fit}>{t('canvas.fit')}</Button>{current && <Button purpose="view" onClick={center}>{t('map.current')}</Button>}
      <Button purpose="view" aria-label={t('canvas.zoomOut')} disabled={view.zoom <= .001} disabledReason={t('canvas.zoomLimit')} onClick={() => zoom(.8)}>−</Button>
      <Button purpose="view" aria-label={t('canvas.zoomIn')} disabled={view.zoom >= 3} disabledReason={t('canvas.zoomLimit')} onClick={() => zoom(1.25)}>+</Button>
      <output className="nf-meta" aria-label={t('canvas.zoomLevel')}>{Math.round(view.zoom * 100)}%</output>
    </div>
  </div>;
}
