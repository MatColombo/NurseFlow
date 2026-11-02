import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Candidate } from '@domain/portability/selection';
import type { MediaAsset } from '@domain/model';
import { projectMap, projectRoute } from '@domain/map/projection';
import { Sheet } from '@shared/components';
import { MapList } from '@features/map/MapList';
import { MapInspector } from '@features/map/MapInspector';
import { MediaAssetContext } from '@features/step-editor/media/asset-context';
import '@features/map/map.css';
export function ProcedurePreview({ item, assets, close }: { item: Candidate; assets: readonly MediaAsset[]; close(): void }) {
  const { t } = useTranslation(); const [revisionId, setRevisionId] = useState(item.procedure.readyRevisionId ?? item.procedure.workingDraftId);
  const revision = item.revisions.find((revision) => revision.id === revisionId)!;
  const projection = useMemo(() => projectMap(revision.graph), [revision]); const route = useMemo(() => projectRoute(revision.graph, projection), [revision, projection]);
  const [expanded, setExpanded] = useState(() => new Set(projection.order)); const [inspected, setInspected] = useState<string | null>(null); const scroll = useRef(0);
  const assetReader = useMemo(() => { const byId = new Map(assets.map((asset) => [asset.id, asset])); return async (id: string) => byId.get(id); }, [assets]);
  return <MediaAssetContext value={assetReader}><Sheet open title={t('portable.preview')} onClose={close} className="nf-portable-preview">
    <h3>{item.procedure.title}</h3>{item.source && <p className="nf-meta">{item.source}</p>}
    <p>{item.group?.name ?? t('library.ungrouped')} · {item.procedure.tags.join(' · ')}</p>
    {item.procedure.description && <p>{item.procedure.description}</p>}{item.procedure.aliases.length > 0 && <p>{t('portable.aliases')}: {item.procedure.aliases.join(' · ')}</p>}
    <label className="nf-stack">{t('portable.revision')}<select value={revisionId} onChange={(event) => { setRevisionId(event.target.value); setInspected(null); scroll.current = 0; setExpanded(new Set(item.revisions.find((revision) => revision.id === event.target.value)!.graph.nodes.map((node) => node.id))); }}>
      {item.revisions.map((revision) => <option key={revision.id} value={revision.id}>{revision.state === 'ready' ? 'Ready' : t('status.draft')} · v{revision.revisionNumber}</option>)}
    </select></label>
    <p>{t('portable.nodeCount', { count: revision.graph.nodes.length })}</p><p className="nf-note">{t('portable.previewNote')}</p>
    {item.warnings.length > 0 && <div className="nf-stack" role="note">{[...new Map(item.warnings.map((issue) => [issue.code, issue])).values()].map((issue) => <p key={issue.code}>{issue.code} · {t('check.rules.' + issue.code)}</p>)}</div>}
    <MapList key={revision.id} graph={revision.graph} projection={projection} route={route} expanded={expanded} scrollRef={scroll} inspect={setInspected}
      toggle={(id) => setExpanded((value) => { const next = new Set(value); if (next.has(id)) next.delete(id); else next.add(id); return next; })} />
    {inspected && <MapInspector nodeId={inspected} graph={revision.graph} projection={projection} route={route} close={() => setInspected(null)} allowRemote={false} />}
  </Sheet></MediaAssetContext>;
}
