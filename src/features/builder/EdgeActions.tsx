import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Graph } from '@domain/model';
import { type Edit, type NewKind } from '@domain/builder/edits';
import { type EdgeRef } from '@domain/builder/model';
import { activityCollector, destinationAt, nodeAt, outletScope } from '@domain/builder/structure';
import { Button, Sheet } from '@shared/components';
import { destinationLabel, edgeTitle, titleOf } from './labels';
export function EdgeActions({ graph, edge, close, edit, paste, hasClipboard, focus, busy, error, retry, retryable, chooseTarget }: {
  graph: Graph; edge: EdgeRef; close(): void; edit(edit: Edit, preview: boolean, openEditor?: boolean): void;
  paste(): void; hasClipboard: boolean; focus(id: string): void; busy: boolean; error: string | null;
  retry(): void; retryable: boolean;
  chooseTarget(): void;
}) {
  const { t } = useTranslation(); const [mode, setMode] = useState<'menu' | 'types' | 'ends' | 'stop'>('menu');
  const [ack, setAck] = useState(false);
  const [endKind, setEndKind] = useState<'stopped' | 'escalation' | null>(null);
  const current = destinationAt(graph, edge); const scope = outletScope(graph, edge); const assigned = current.kind !== 'unassigned';
  const collector = activityCollector(graph, edge);
  const create = (kind: NewKind) => {
    if (kind === 'end') setMode('ends');
    else edit({ type: 'create', edge, kind }, assigned, true);
  };
  return <Sheet open title={mode === 'menu' ? t('builder.afterOutlet', { title: edgeTitle(graph, edge, t) }) :
    t('builder.' + (mode === 'types' ? 'addToProcedure' : mode === 'ends' ? 'endHere' : 'stopEntire'))} onClose={close}>
    <p className="nf-meta">{edgeTitle(graph, edge, t)}</p>
    {collector?.kind === 'multitask' && <p>{t('builder.collectorHint', { target: destinationLabel(graph, collector.afterAll, t) })}</p>}
    {error && <div><p role="alert">{error}</p>{retryable && <Button onClick={retry}>{t('common.retry')}</Button>}</div>}
    <fieldset disabled={busy} className="nf-stack nf-metadata-fields">
      {mode === 'menu' && <>
        {current.kind === 'node' && <Button onClick={() => focus(current.nodeId)}>{t('builder.viewStep')}</Button>}
        <Button onClick={() => setMode('types')}>{t(assigned ? 'builder.insertBefore' : 'builder.createNext')}</Button>
        {scope.length === 0 && <Button onClick={() => setMode('ends')}>{t('builder.endHere')}</Button>}
        <Button onClick={chooseTarget}>{t(assigned ? 'builder.changePath' : 'builder.existing')}</Button>
        {assigned && <Button onClick={() => edit({ type: 'disconnect', edge }, true)}>{t('builder.disconnect')}</Button>}
        {scope.length > 0 && edge.slot !== 'activity' && <Button onClick={() => edit({ type: 'finish', edge }, assigned)}>{t('builder.finishActivity')}</Button>}
        {scope.length > 0 && <Button variant="danger" onClick={() => setMode('stop')}>{t('builder.stopEntire')}</Button>}
        {hasClipboard && <Button onClick={paste}>{t('builder.pasteHere')}</Button>}
      </>}
      {mode === 'types' && (scope.length ? ['instruction', 'alert'] as const : ['instruction', 'decision', 'multitask', 'alert', 'end'] as const).map((kind) => <Button key={kind}
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
    </fieldset>
    <p className="nf-note">{t('builder.currentPath')}: {destinationLabel(graph, current, t)}</p>
    {current.kind === 'node' && <span className="nf-note">{titleOf(nodeAt(graph, current.nodeId), t)}</span>}
    <Button onClick={close}>{t('common.cancel')}</Button>
  </Sheet>;
}
