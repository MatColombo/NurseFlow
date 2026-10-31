import type { TFunction } from 'i18next';
import type { MapLink, MapProjection } from '@domain/map/projection';
import { titleOf } from '@features/builder/labels';
import type { Node } from '@domain/model';
import type { IconName } from '@shared/components/Icon';
export function mapIcon(node: Node): IconName {
  if (node.kind === 'end') return node.endKind === 'completed' ? 'check' : node.endKind === 'stopped' ? 'problem' : node.endKind === 'escalation' ? 'warning' : 'info';
  return node.kind === 'decision' || node.kind === 'multitask' ? 'fork' : node.kind === 'alert' ? 'warning' : node.kind === 'start' ? 'ready' : 'procedure';
}
export function linkLabel(projection: MapProjection, link: MapLink, t: TFunction) {
  const node = projection.byId.get(link.edge.nodeId)!;
  if (node.kind === 'decision') return node.outcomes.find((item) => item.id === link.edge.itemId)?.label || t('builder.unnamedOutcome');
  if (node.kind === 'multitask' && link.edge.slot === 'activity') return node.activities.find((item) => item.id === link.edge.itemId)?.name || t('builder.unnamedActivity');
  return t(link.edge.slot === 'afterAll' ? 'builder.afterAll' : node.kind === 'start' ? 'builder.firstStep' : 'builder.next');
}
export function targetLabel(projection: MapProjection, link: MapLink, t: TFunction) {
  if (link.destination.kind === 'activity-complete') return t('builder.activityFinished');
  if (link.destination.kind === 'broken') return t('map.broken') + ' · ' + (link.destination.formerTitle || link.destination.formerNodeId);
  if (link.destination.kind === 'node' && !link.targetId) return t('map.broken') + ' · ' + link.destination.nodeId;
  if (link.targetId) return titleOf(projection.byId.get(link.targetId)!, t) + ' · ' + projection.references.get(link.targetId);
  return t('map.unlinked');
}
