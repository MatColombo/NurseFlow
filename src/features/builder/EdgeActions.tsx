import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Graph, Node } from '@domain/model';
import { applyEdit, type Edit, type NewKind } from '@domain/builder/edits';
import { BuilderError, type EdgeRef } from '@domain/builder/model';
import { destinationAt, nodeAt, outletScope } from '@domain/builder/structure';
import { normalize } from '@domain/library';
import { Button, Sheet } from '@shared/components';
import { destinationLabel, edgeTitle, titleOf } from './labels';
export function EdgeActions({ graph, edge, close, edit, paste, hasClipboard, focus, busy, error, retry, retryable }: {
  graph: Graph; edge: EdgeRef; close(): void; edit(edit: Edit, preview: boolean, openEditor?: boolean): void;
  paste(): void; hasClipboard: boolean; focus(id: string): void; busy: boolean; error: string | null;
  retry(): void; retryable: boolean;
}) {
  const { t } = useTranslation(); const [mode, setMode] = useState<'menu' | 'types' | 'ends' | 'stop' | 'targets'>('menu');
  const [query, setQuery] = useState(''); const [ack, setAck] = useState(false);
  const [endKind, setEndKind] = useState<'stopped' | 'escalation' | null>(null);
  const current = destinationAt(graph, edge); const scope = outletScope(graph, edge); const assigned = current.kind !== 'unassigned';
  const create = (kind: NewKind) => {
    if (kind === 'end') setMode('ends');
    else edit({ type: 'create', edge, kind }, assigned, true);
  };
  const reasonFor = (node: Node) => {
    try { applyEdit(graph, { type: 'connect', edge, destination: { kind: 'node', nodeId: node.id } }, () => 'not-used'); return null; }
    catch (error) { return t('builder.errors.' + (error instanceof BuilderError ? error.code : 'invalid')); }
  };
  return <Sheet open title={mode === 'menu' ? t('builder.afterOutlet', { title: edgeTitle(graph, edge, t) }) :
    t('builder.' + (mode === 'types' ? 'addToProcedure' : mode === 'ends' ? 'endHere' : mode === 'targets' ? 'existing' : 'stopEntire'))} onClose={close}>
    <p className="nf-meta">{edgeTitle(graph, edge, t)}</p>
    {error && <div><p role="alert">{error}</p>{retryable && <Button onClick={retry}>{t('common.retry')}</Button>}</div>}
    <fieldset disabled={busy} className="nf-stack nf-metadata-fields">
      {mode === 'menu' && <>
        {current.kind === 'node' && <Button onClick={() => focus(current.nodeId)}>{t('builder.viewStep')}</Button>}
        <Button onClick={() => setMode('types')}>{t(assigned ? 'builder.insertBefore' : 'builder.createNext')}</Button>
        {scope.length === 0 && <Button onClick={() => setMode('ends')}>{t('builder.endHere')}</Button>}
        <Button onClick={() => setMode('targets')}>{t(assigned ? 'builder.changePath' : 'builder.existing')}</Button>
        {assigned && <Button onClick={() => edit({ type: 'disconnect', edge }, true)}>{t('builder.disconnect')}</Button>}
        {scope.length > 0 && edge.slot !== 'activity' && <Button onClick={() => edit({ type: 'finish', edge }, assigned)}>{t('builder.finishActivity')}</Button>}
        {scope.length > 0 && <Button variant="danger" onClick={() => setMode('stop')}>{t('builder.stopEntire')}</Button>}
        {hasClipboard && <Button onClick={paste}>{t('builder.pasteHere')}</Button>}
      </>}
      {mode === 'types' && (['instruction', 'decision', 'multitask', 'alert', 'end'] as const).map((kind) => <Button key={kind}
        disabled={kind === 'end' && scope.length > 0} disabledReason={t('builder.useStop')}
        onClick={() => create(kind)}>{t('builder.picker.' + kind)}</Button>)}
      {mode === 'ends' && (['completed', 'stopped', 'escalation', 'neutral'] as const).map((kind) => <Button key={kind}
        onClick={() => edit({ type: 'create', edge, kind: 'end', endKind: kind }, assigned, true)}>{t('builder.ends.' + kind)}</Button>)}
      {mode === 'stop' && <>
        <p>{t('builder.stopWarning')}</p>
        {(['stopped', 'escalation'] as const).map((kind) => <label key={kind} className="nf-choice"><input type="radio" name="stop-kind" checked={endKind === kind} onChange={() => setEndKind(kind)} />{t('builder.ends.' + kind)}</label>)}
        <label className="nf-choice"><input type="checkbox" checked={ack} onChange={(event) => setAck(event.target.checked)} />{t('builder.stopAcknowledge')}</label>
        <Button variant="danger" disabled={!ack || !endKind} disabledReason={t('builder.stopAcknowledge')}
          onClick={() => { if (endKind) edit({ type: 'create', edge, kind: 'end', endKind, stopEntire: true }, true, true); }}>{t('builder.stopEntire')}</Button>
      </>}
      {mode === 'targets' && <>
        <label className="nf-stack">{t('builder.findStep')}<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <ul className="nf-list nf-stack">{graph.nodes.filter((node) => normalize(titleOf(node, t)).includes(normalize(query))).map((node) => {
          const reason = reasonFor(node); return <li key={node.id}><Button disabled={reason !== null} disabledReason={reason ?? ''}
            onClick={() => edit({ type: 'connect', edge, destination: { kind: 'node', nodeId: node.id } }, true)}>
            {titleOf(node, t)} · {t('builder.kinds.' + node.kind)}</Button></li>;
        })}</ul>
      </>}
    </fieldset>
    <p className="nf-note">{t('builder.currentPath')}: {destinationLabel(graph, current, t)}</p>
    {current.kind === 'node' && <span className="nf-note">{titleOf(nodeAt(graph, current.nodeId), t)}</span>}
    <Button onClick={close}>{t('common.cancel')}</Button>
  </Sheet>;
}
