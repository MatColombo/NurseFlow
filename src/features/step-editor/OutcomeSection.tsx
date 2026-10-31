import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Graph, Node } from '@domain/model';
import { normalize } from '@domain/library';
import { Button } from '@shared/components';
import { destinationLabel } from '@features/builder/labels';
export function OutcomeSection({ node, graph, busy, open, arrange, add }: {
  node: Extract<Node, { kind: 'decision' }>; graph: Graph; busy: boolean; open(id: string): void; arrange(): void; add(): void;
}) {
  const { t } = useTranslation(); const [query, setQuery] = useState('');
  return <details className="nf-card nf-stack nf-editor-section" open><summary>{t('editor.outcomes')} ({node.outcomes.length})</summary>
    <div className="nf-row"><Button disabled={busy} disabledReason={t('common.loading')} onClick={arrange}>{t('editor.arrange')}</Button>
      <Button disabled={busy || node.outcomes.length >= 32} disabledReason={t('builder.limit')} onClick={add}>{t('editor.addOutcome')}</Button></div>
    {node.outcomes.length >= 8 && <label className="nf-stack">{t('common.search')}<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>}
    <ol className="nf-list nf-stack">{[...node.outcomes].sort((a, b) => a.order - b.order).map((item, index) => ({ ...item, index })).filter((item) => normalize(item.label).includes(normalize(query))).map((item) =>
      <li key={item.id}><Button className="nf-outcome-row" aria-label={t('editor.editOutcome', { label: item.label || t('builder.unnamedOutcome') })} onClick={() => open(item.id)}>
        {item.index + 1}. {item.label || t('builder.unnamedOutcome')} · {destinationLabel(graph, item.destination, t)}{item.note?.text.trim() ? ' · ' + t('editor.noteBadge') : ''}</Button></li>)}</ol>
  </details>;
}
