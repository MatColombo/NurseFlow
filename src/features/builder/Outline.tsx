import { useTranslation } from 'react-i18next';
import type { Graph, Node } from '@domain/model';
import type { EdgeRef, Selection } from '@domain/builder/model';
import { edgeKey, incoming, outlets, reachable } from '@domain/builder/structure';
import { Button } from '@shared/components';
import { destinationLabel, titleOf } from './labels';

function orderedOutline(graph: Graph) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node])); const seen = new Set<string>();
  const result: { node: Node; depth: number }[] = [];
  function visit(id: string, depth: number) {
    if (seen.has(id)) return; seen.add(id); const node = nodes.get(id); if (!node) return;
    result.push({ node, depth });
    for (const { edge, destination } of outlets(node)) if (destination.kind === 'node') visit(destination.nodeId, depth + (edge.slot === 'outcome' || edge.slot === 'activity' ? 1 : 0));
  }
  for (const node of graph.nodes.filter((node) => node.kind === 'start')) visit(node.id, 0);
  for (const node of graph.nodes) visit(node.id, 0); return result;
}
export function Outline({ graph, select, focus, selection }: {
  graph: Graph; select(value: Selection): void; focus(id: string): void; selection: Selection | null;
}) {
  const { t } = useTranslation(); const linked = reachable(graph);
  const outletLabel = (node: Node, edge: EdgeRef) => edge.slot === 'outcome' && node.kind === 'decision'
    ? node.outcomes.find((item) => item.id === edge.itemId)?.label || t('builder.unnamedOutcome')
    : edge.slot === 'activity' && node.kind === 'multitask' ? node.activities.find((item) => item.id === edge.itemId)?.name || t('builder.unnamedActivity')
      : t(edge.slot === 'afterAll' ? 'builder.afterAll' : node.kind === 'start' ? 'builder.firstStep' : 'builder.next');
  return <ol className="nf-list nf-stack nf-outline" aria-label={t('builder.outline')} tabIndex={0}>
    {orderedOutline(graph).map(({ node, depth }) => <li key={node.id} id={'builder-node-' + node.id} data-outline-node={node.id}
      className={'nf-outline-node nf-stack' + (selection?.kind === 'node' && selection.nodeId === node.id ? ' nf-outline-selected' : '')}
      style={{ marginInlineStart: 'min(' + Math.min(depth, 2) + ' * var(--nf-space-2), 4vw)' }}>
      <Button className="nf-outline-title" aria-pressed={selection?.kind === 'node' && selection.nodeId === node.id}
        onClick={() => select({ kind: 'node', nodeId: node.id })}>{titleOf(node, t)}</Button>
      <div className="nf-row nf-meta"><span>{t('builder.kinds.' + node.kind)}</span>
        {!linked.has(node.id) && <span>{t('builder.unreachable')}</span>}
        {incoming(graph, node.id).length > 1 && <span>{t('builder.incoming', { count: incoming(graph, node.id).length })}</span>}
        {'phaseId' in node && node.phaseId && <span>{graph.phases.find((phase) => phase.id === node.phaseId)?.name}</span>}
        {'media' in node && node.media.length > 0 && <span>{t('builder.mediaCount', { count: node.media.length })}</span>}
      </div>
      {node.kind === 'multitask' && <Button onClick={() => select({ kind: 'node', nodeId: node.id })}>{t('builder.browse', { count: node.activities.length })}</Button>}
      <ul className="nf-list nf-stack">{outlets(node).map(({ edge, destination }) => <li className="nf-stack" key={edgeKey(edge)}>
        <div className="nf-row">
          {edge.slot === 'activity' && <Button aria-label={t('builder.activityActions', { title: outletLabel(node, edge) })}
            aria-pressed={selection?.kind === 'activity' && selection.nodeId === node.id && selection.activityId === edge.itemId}
            onClick={() => select({ kind: 'activity', nodeId: node.id, activityId: edge.itemId! })}>···</Button>}
          <Button className="nf-outline-edge" aria-label={outletLabel(node, edge) + ' · ' + (destination.kind === 'unassigned' ? '+' : destinationLabel(graph, destination, t))}
            aria-pressed={selection?.kind === 'edge' && edgeKey(selection.edge) === edgeKey(edge)}
            onClick={() => select({ kind: 'edge', edge })}>{outletLabel(node, edge)} · {destination.kind === 'unassigned' ? '+' : destinationLabel(graph, destination, t)}</Button>
          {destination.kind === 'node' && <Button aria-label={t('builder.focus', { title: destinationLabel(graph, destination, t) })}
            onClick={() => focus(destination.nodeId)}>↗</Button>}
        </div>
        {destination.kind === 'broken' && <span className="nf-note nf-outline-broken">W08 · {destinationLabel(graph, destination, t)}</span>}
      </li>)}</ul>
    </li>)}
  </ol>;
}
