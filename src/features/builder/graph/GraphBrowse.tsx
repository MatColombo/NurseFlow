import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Graph } from '@domain/model';
import { normalize } from '@domain/library';
import { Button, Sheet } from '@shared/components';
import { useUnsavedNavigation } from '@features/procedures/useUnsavedNavigation';
import { titleOf, destinationLabel } from '../labels';
export function GraphBrowse({ graph, nodeId, close, focusNode, focusItem }: {
  graph: Graph; nodeId: string | null; close(): void; focusNode(id: string): void; focusItem(nodeId: string, itemId: string): void;
}) {
  const { t } = useTranslation(); const [query, setQuery] = useState('');
  const node = nodeId ? graph.nodes.find((node) => node.id === nodeId) : undefined;
  useUnsavedNavigation(true, { onBack: close, beforeUnloadDirty: false });
  const items = node?.kind === 'multitask' ? [...node.activities].sort((a, b) => a.order - b.order).map((item) => ({ id: item.id, label: item.name || t('builder.unnamedActivity'), destination: item.first })) :
    node?.kind === 'decision' ? [...node.outcomes].sort((a, b) => a.order - b.order).map((item) => ({ id: item.id, label: item.label || t('builder.unnamedOutcome'), destination: item.destination })) : null;
  return <Sheet open title={t(items ? node?.kind === 'multitask' ? 'canvas.browseActivities' : 'canvas.browseOutcomes' : 'canvas.find')} onClose={close}>
    {node && <p>{titleOf(node, t)}</p>}
    <label className="nf-stack">{t('common.search')}<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    <ul className="nf-list nf-stack">{items ? items.map((item, index) => ({ ...item, index })).filter((item) => normalize(item.label).includes(normalize(query))).map((item) => <li key={item.id}>
      <Button data-browse-item={item.id} onClick={() => { focusItem(node!.id, item.id); close(); }}>{item.index + 1}. {item.label} · {destinationLabel(graph, item.destination, t)}</Button>
    </li>) : graph.nodes.filter((node) => normalize(titleOf(node, t)).includes(normalize(query))).map((node) => <li key={node.id}>
      <Button data-find-node={node.id} onClick={() => { focusNode(node.id); close(); }}>{t('canvas.locate', { title: titleOf(node, t) })}</Button>
    </li>)}</ul>
  </Sheet>;
}
