import { useTranslation } from 'react-i18next';
import type { Graph } from '@domain/model';
import type { CanvasView, EdgeRef, Selection } from '@domain/builder/model';
import { edgeKey, nodeAt, reachable } from '@domain/builder/structure';
import type { SceneNode, SceneMetrics } from '@domain/builder/scene';
import { Button } from '@shared/components';
import { destinationLabel, titleOf } from '../labels';
export function GraphCard({ graph, box, metrics, view, selection, located, picking, reason, select, pick, reveal, browse }: {
  graph: Graph; box: SceneNode; metrics: SceneMetrics; view: CanvasView; selection: Selection | null; located: boolean;
  picking: boolean; reason: string | null; select(value: Selection): void; pick(id: string): void; reveal(id: string): void; browse(id: string): void;
}) {
  const { t } = useTranslation(); const node = nodeAt(graph, box.id); const title = titleOf(node, t);
  const group = node.kind === 'multitask' || node.kind === 'decision' && node.outcomes.length > 3;
  const items = node.kind === 'multitask' ? node.activities : node.kind === 'decision' ? node.outcomes : [];
  const focusedIndex = Math.max(0, [...items].sort((a, b) => a.order - b.order).findIndex((item) => item.id === view.focusItems[node.id]));
  const shown = box.ports.filter(({ edge }) => edge.itemId).length;
  const outletName = (edge: EdgeRef) => edge.slot === 'outcome' && node.kind === 'decision' ? node.outcomes.find((item) => item.id === edge.itemId)?.label || t('builder.unnamedOutcome') :
    edge.slot === 'activity' && node.kind === 'multitask' ? node.activities.find((item) => item.id === edge.itemId)?.name || t('builder.unnamedActivity') :
      t(edge.slot === 'afterAll' ? 'builder.afterAll' : node.kind === 'start' ? 'builder.firstStep' : 'builder.next');
  const act = (value: Selection) => { if (view.zoom < .99) reveal(node.id); else select(value); };
  return <foreignObject x={box.x} y={box.y} width={box.width} height={box.height} data-graph-node={node.id}>
    <div className={'nf-graph-card' + (located || selection && (selection.kind === 'edge' ? selection.edge.nodeId : selection.nodeId) === node.id ? ' nf-graph-card--selected' : '')}>
      <div className="nf-graph-card-head" style={{ height: metrics.header }}>
        <Button id={'graph-node-' + node.id} className="nf-graph-title" title={title} data-target-reason={reason ?? undefined}
          aria-label={picking ? t('canvas.choose', { title }) : title} disabled={picking && Boolean(reason)} disabledReason={reason ?? ''}
          onClick={() => { if (view.zoom < .99) reveal(node.id); else if (picking) pick(node.id); else select({ kind: 'node', nodeId: node.id }); }}>{title}</Button>
        <p className="nf-meta nf-graph-meta" title={reason ?? undefined}>{reason ?? (!reachable(graph).has(node.id) ? t('builder.unreachable') : t('builder.kinds.' + node.kind))}</p>
      </div>
      {box.ports.map(({ edge, destination }) => <div className="nf-graph-port" key={edgeKey(edge)} style={{ height: metrics.row }}>
        {edge.slot === 'activity' && !picking && <Button aria-label={t('builder.activityActions', { title: outletName(edge) })}
          onClick={() => act({ kind: 'activity', nodeId: node.id, activityId: edge.itemId! })}>···</Button>}
        <Button className={destination.kind === 'broken' ? 'nf-graph-broken' : ''} title={outletName(edge) + ' · ' + destinationLabel(graph, destination, t)}
          data-graph-outlet={edgeKey(edge)} data-empty-outlet={destination.kind === 'unassigned' ? 'true' : undefined}
          aria-label={outletName(edge) + ' · ' + (destination.kind === 'unassigned' ? '+' : destinationLabel(graph, destination, t))}
          aria-pressed={selection?.kind === 'edge' && edgeKey(selection.edge) === edgeKey(edge)} disabled={picking} disabledReason={t('canvas.chooseDestination')}
          onClick={() => act({ kind: 'edge', edge })}>
          {destination.kind === 'broken' ? 'W08 · ' : ''}{outletName(edge)} · {destination.kind === 'unassigned' ? '+' : destinationLabel(graph, destination, t)}
        </Button>
      </div>)}
      {group && <>
        <p className="nf-meta nf-graph-group-summary" style={{ height: metrics.row }}>
          <span>{t(node.kind === 'multitask' ? 'canvas.activityFocus' : 'canvas.outcomeFocus', { index: items.length ? focusedIndex + 1 : 0, count: box.total })}</span>
          <span>{t('canvas.shown', { count: shown, total: box.total })}</span>
        </p>
        <Button style={{ height: metrics.row }} onClick={() => browse(node.id)}>{t(node.kind === 'multitask' ? 'canvas.browseActivities' : 'canvas.browseOutcomes')} ({box.total})</Button>
      </>}
    </div>
  </foreignObject>;
}
