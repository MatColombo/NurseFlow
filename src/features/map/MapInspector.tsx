import { useTranslation } from 'react-i18next';
import type { Graph } from '@domain/model';
import type { MapProjection, MapRoute } from '@domain/map/projection';
import { Icon, Sheet } from '@shared/components';
import { StepContent } from '@features/run/StepContent';
import { titleOf } from '@features/builder/labels';
import { Relationships } from './Relationships';
import { mapIcon } from './labels';
export function MapInspector({ nodeId, graph, projection, route, close, allowRemote = true }: {
  nodeId: string; graph: Graph; projection: MapProjection; route: MapRoute; close(): void; allowRemote?: boolean;
}) {
  const { t } = useTranslation(); const node = projection.byId.get(nodeId)!;
  const phase = 'phaseId' in node ? graph.phases.find((phase) => phase.id === node.phaseId)?.name : undefined;
  return <Sheet open title={t('builder.kinds.' + node.kind)} onClose={close} className="nf-map-inspector">
    {node.kind === 'end' && <p className="nf-row"><Icon name={mapIcon(node)} />{t('builder.ends.' + node.endKind)}</p>}
    {node.kind === 'start' || node.kind === 'multitask' ? <><p className="nf-meta">{phase}</p><h3>{titleOf(node, t)}</h3></> :
      <StepContent node={node} phase={phase} preview inspection showEndType={false} allowRemote={allowRemote} />}
    <Relationships nodeId={nodeId} projection={projection} route={route} />
  </Sheet>;
}
