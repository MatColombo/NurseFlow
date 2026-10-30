import type { TFunction } from 'i18next';
import type { Destination, Graph, Node } from '@domain/model';
import { nodeAt, nodeLabel } from '@domain/builder/structure';
import type { EdgeRef } from '@domain/builder/model';
export function titleOf(node: Node, t: TFunction) { return nodeLabel(node) || t('builder.kinds.' + node.kind); }
export function destinationLabel(graph: Graph, value: Destination | undefined, t: TFunction) {
  if (!value) return '—';
  if (value.kind === 'node') return titleOf(nodeAt(graph, value.nodeId), t);
  if (value.kind === 'broken') return t('builder.broken', { title: value.formerTitle ?? value.formerNodeId });
  return t(value.kind === 'activity-complete' ? 'builder.activityFinished' : 'builder.notSet');
}
export function edgeTitle(graph: Graph, edge: EdgeRef, t: TFunction) {
  const node = nodeAt(graph, edge.nodeId);
  const name = edge.slot === 'outcome' && node.kind === 'decision' ? node.outcomes.find((item) => item.id === edge.itemId)?.label || t('builder.unnamedOutcome') :
    edge.slot === 'activity' && node.kind === 'multitask' ? node.activities.find((item) => item.id === edge.itemId)?.name || t('builder.unnamedActivity') :
      t(edge.slot === 'afterAll' ? 'builder.afterAll' : 'builder.next');
  return titleOf(node, t) + ' / ' + name;
}
