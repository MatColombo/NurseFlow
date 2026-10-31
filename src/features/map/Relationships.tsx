import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { MapProjection, MapRoute } from '@domain/map/projection';
import { Button } from '@shared/components';
import { titleOf } from '@features/builder/labels';
import { linkLabel, targetLabel } from './labels';

/** Reference links focus List rows only. Inspector paths are plain informational text. */
export function Relationships({ nodeId, projection, route, focusNode }: {
  nodeId: string; projection: MapProjection; route: MapRoute; focusNode?: (id: string) => void;
}) {
  const { t } = useTranslation(); const prefix = useId(); const node = projection.byId.get(nodeId)!;
  const count = route.counts.get(nodeId);
  return <div className="nf-map-relations nf-stack">
    {node.kind === 'multitask' && <p>{t('map.required')}{count && <> · {t('map.count', count)}</>}</p>}
    {projection.edges.filter((link) => link.edge.nodeId === nodeId).map((link, index) => {
      const label = linkLabel(projection, link, t); const target = targetLabel(projection, link, t);
      const note = node.kind === 'decision' ? node.outcomes.find((item) => item.id === link.edge.itemId)?.note : undefined;
      const status = route.activities.get(link.key); const visited = route.visitedEdges.has(link.key);
      return <div className="nf-map-relation nf-stack" key={link.key} data-map-path={link.key} data-visited={visited}>
        <p className="nf-authored">{label}{visited && <span className="nf-meta"> · ✓ {t('map.visited')}</span>}{status && <span className="nf-meta"> · {t('map.' + status)}</span>}</p>
        {focusNode && link.targetId && link.destination.kind === 'node' ? <Button onClick={() => focusNode(link.targetId!)} aria-label={t('map.reference', {
          title: titleOf(projection.byId.get(link.targetId)!, t), ref: projection.references.get(link.targetId) })}>↪ {target}</Button> : <p>→ {target}</p>}
        {note?.text.trim() && (note.visibility === 'always-visible' ? <p className="nf-note nf-authored">{note.text}</p> :
          <details><summary aria-controls={`${prefix}-${index}`}>ⓘ {t('map.note', { label })}</summary><p id={`${prefix}-${index}`} className="nf-note nf-authored">{note.text}</p></details>)}
      </div>;
    })}
  </div>;
}
