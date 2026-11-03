import { Component, lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { projectMap, projectRoute } from '@domain/map/projection';
import type { CanvasView } from '@domain/builder/model';
import { useAppearance } from '@app/appearance-context';
import { Button } from '@shared/components';
import { registerPopGuard } from '@shared/navigation/pop-guard';
import { MapList } from './MapList';
import { MapInspector } from './MapInspector';
import { mapService, type MapData } from './service';
import './map.css';
const MapGraph = lazy(() => import('./MapGraph'));

class GraphBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false }; static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function MapPage() {
  const { id = '' } = useParams(); const [query] = useSearchParams(); const { t } = useTranslation();
  const location = useLocation();
  const revisionId = query.get('revision') ?? undefined; const runId = query.get('run') ?? undefined; const previewId = query.get('previewRun') ?? undefined;
  const [data, setData] = useState<MapData | null>(null); const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  const fallback = runId ? `/run/${encodeURIComponent(runId)}` : previewId ? `/run/${encodeURIComponent(id)}?preview=draft&revision=${encodeURIComponent(revisionId ?? '')}` : `/procedure/${encodeURIComponent(id)}`;
  const fallbackState = runId || previewId ? { runMapReturn: runId ?? previewId, runMapContext: location.state?.runMapContext } :
    { mapDetailsReturn: location.state?.mapDetailsContext ?? { scrollTop: 0 } };
  useEffect(() => {
    let active = true;
    void mapService.read({ procedureId: id, ...(revisionId ? { revisionId } : {}), ...(runId ? { runId } : {}), ...(previewId ? { previewId } : {}) }).then((data) => {
      if (!data.revision.graph.nodes.length) throw new Error('Empty map'); if (active) setData(data);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, revisionId, runId, previewId, attempt]);
  if (error) return <section className="nf-stack nf-map-error"><h1>{t('pages.05')}</h1><p role="alert">{t('map.unavailable')}</p>
    <Link to={fallback} replace state={fallbackState}>{t('common.back')}</Link><Button onClick={() => { setError(false); setAttempt((value) => value + 1); }}>{t('common.retry')}</Button></section>;
  if (!data) return <p role="status">{t('common.loading')}</p>;
  return <MapScreen data={data} />;
}

function MapScreen({ data }: { data: MapData }) {
  const { t } = useTranslation(); const { preferences } = useAppearance(); const location = useLocation(); const navigate = useNavigate();
  const projection = useMemo(() => projectMap(data.revision.graph), [data.revision.graph]);
  const route = useMemo(() => projectRoute(data.revision.graph, projection, data.run), [data, projection]);
  const [mode, setMode] = useState<'graph' | 'list'>('graph'); const [inspected, setInspected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(() => new Set(projection.order)); const listScroll = useRef(0);
  const [view, setView] = useState<CanvasView>({ x: 0, y: 0, zoom: 1, initialized: false, focusItems: {} });
  const backKey = data.run ? data.run.status === 'ended' ? 'map.backEnd' : 'map.backStep' : 'map.backDetails';
  const returnState = data.run ? { runMapReturn: data.run.id, runMapContext: location.state?.runMapContext } : { mapDetailsReturn: location.state?.mapDetailsContext ?? { scrollTop: 0 } };
  const back = () => { void navigate(data.returnPath, { replace: true, state: returnState }); };
  const onPop = useRef(() => {});
  useLayoutEffect(() => { onPop.current = () => { if (inspected) setInspected(null); else back(); }; });
  useLayoutEffect(() => {
    const href = window.location.href; const state: unknown = window.history.state;
    const key = data.run?.id ?? data.revision.id;
    if (window.history.state?.nurseflowMap !== key) window.history.pushState({ ...window.history.state, nurseflowMap: key }, '', href);
    return registerPopGuard((event) => {
      if (event.state === null) return false;
      window.history.pushState({ ...(state as object), nurseflowMap: key }, '', href); onPop.current(); return true;
    });
  }, [data]);
  const header = useRef<HTMLHeadingElement>(null);
  useEffect(() => { header.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, []);
  return <section className="nf-map-page" aria-label={t('pages.05')} data-revision-id={data.revision.id} data-revision-state={data.revision.state} data-current-node={data.run?.currentNodeId}>
    <header className="nf-map-header">
      <Link className="nf-button" to={data.returnPath} replace state={returnState} aria-label={t(backKey)}>‹</Link>
      <h1 ref={header} tabIndex={-1} title={data.title}>{data.title}</h1>
      <Button purpose="view" onClick={() => setMode(mode === 'graph' ? 'list' : 'graph')}>{t(mode === 'graph' ? 'map.list' : 'map.graph')}</Button>
    </header>
    {data.revision.state === 'working-draft' && <strong className="nf-map-draft" role="status">{t(data.preview ? 'procedure.draftPreview' : 'status.draft')}</strong>}
    <div className="nf-map-body">
      <div className="nf-map-mode" hidden={mode !== 'graph'}>
        <GraphBoundary fallback={<p role="alert">{t('map.graphFailed')}</p>}><Suspense fallback={<p role="status">{t('common.loading')}</p>}>
          <MapGraph graph={data.revision.graph} projection={projection} route={route} current={data.run?.currentNodeId}
            scale={preferences.uiScalePt} view={view} change={setView} inspect={setInspected} />
        </Suspense></GraphBoundary>
      </div>
      {mode === 'list' && <div className="nf-map-mode">
        <MapList graph={data.revision.graph} projection={projection} route={route} current={data.run?.currentNodeId} expanded={expanded}
          toggle={(id) => setExpanded((value) => { const next = new Set(value); if (next.has(id)) next.delete(id); else next.add(id); return next; })}
          inspect={setInspected} scrollRef={listScroll} />
      </div>}
    </div>
    {inspected && <MapInspector key={inspected} nodeId={inspected} graph={data.revision.graph} projection={projection} route={route} close={() => setInspected(null)} />}
  </section>;
}
