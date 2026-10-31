import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, Graph, Outcome } from '@domain/model';
import type { Edit } from '@domain/builder/edits';
import type { ClipSelection } from '@domain/builder/clipboard';
import type { Selection } from '@domain/builder/model';
import { incoming, nodeAt } from '@domain/builder/structure';
import { normalize } from '@domain/library';
import { Button, Sheet } from '@shared/components';
import { edgeTitle, titleOf } from './labels';
export function NodeActions({ graph, selection, close, edit, copy, pasteActivity, canPasteActivity, openEditor, select, busy, error, retry, retryable }: {
  graph: Graph; selection: Exclude<Selection, { kind: 'edge' }>; close(): void; edit(edit: Edit, preview: boolean): Promise<boolean>;
  copy(mode: 'copy' | 'cut', selection: ClipSelection): void; pasteActivity(nodeId: string): void; canPasteActivity: boolean;
  openEditor(id: string): void; select(value: Selection): void; busy: boolean; error: string | null;
  retry(): void; retryable: boolean;
}) {
  const { t } = useTranslation(); const node = nodeAt(graph, selection.nodeId);
  const activityId = selection.kind === 'activity' ? selection.activityId : undefined;
  const activity = node.kind === 'multitask' ? node.activities.find((item) => item.id === activityId) : undefined;
  const [form, setForm] = useState<string | null>(null); const [text, setText] = useState(''); const [query, setQuery] = useState('');
  const [phaseId, setPhaseId] = useState('phaseId' in node ? node.phaseId ?? '' : '');
  const items: (Outcome | Activity)[] = node.kind === 'decision' ? [...node.outcomes].sort((a, b) => a.order - b.order) :
    node.kind === 'multitask' ? [...node.activities].sort((a, b) => a.order - b.order) : [];
  const clipSelection: ClipSelection = activityId ? { kind: 'activity', nodeId: node.id, activityId } : { kind: 'node', nodeId: node.id };
  const startForm = (id: string, value: string) => { setForm(id); setText(value); };
  return <Sheet open title={activity ? activity.name || t('builder.unnamedActivity') : titleOf(node, t)} onClose={close}>
    {error && <div><p role="alert">{error}</p>{retryable && <Button onClick={retry}>{t('common.retry')}</Button>}</div>}
    {node.kind !== 'start' && <fieldset disabled={busy} className="nf-stack nf-metadata-fields">
      {form ? <form className="nf-stack" onSubmit={(event) => {
        event.preventDefault();
        void edit(form === '$node' ? { type: 'rename', nodeId: node.id, title: text, phaseId: phaseId || null } :
          { type: 'rename-item', nodeId: node.id, itemId: form, text }, false).then((saved) => { if (saved) setForm(null); });
      }}><label className="nf-stack">{t(form === '$node' ? 'builder.shortTitle' : 'builder.itemName')}<input value={text} onChange={(event) => setText(event.target.value)} /></label>
        {form === '$node' && <label className="nf-stack">{t('builder.phase')}<select value={phaseId} onChange={(event) => setPhaseId(event.target.value)}>
          <option value="">{t('builder.noPhase')}</option>{graph.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select></label>}
        <div className="nf-row"><Button onClick={() => setForm(null)}>{t('common.cancel')}</Button><Button type="submit" variant="primary">{t('library.done')}</Button></div>
      </form> : <>
        {!activity && <>{node.kind !== 'multitask' && <Button onClick={() => openEditor(node.id)}>{t('builder.editStep')}</Button>}
          <Button onClick={() => startForm('$node', 'title' in node ? node.title ?? '' : node.kind === 'end' ? node.heading : '')}>{t('builder.rename')}</Button></>}
        {activity && <><Button onClick={() => startForm(activity.id, activity.name)}>{t('builder.rename')}</Button>
          <Button onClick={() => select({ kind: 'edge', edge: { nodeId: node.id, slot: 'activity', itemId: activity.id } })}>{t('builder.setPath')}</Button></>}
        <div className="nf-row"><Button onClick={() => copy('copy', clipSelection)}>{t('builder.copy')}</Button>
          <Button onClick={() => copy('cut', clipSelection)}>{t('builder.cut')}</Button></div>
        {!activity && incoming(graph, node.id).length > 1 && <div><p>{t('builder.sharedScope')}</p>
          <ul>{incoming(graph, node.id).map(({ edge }, index) => <li key={index}>{edgeTitle(graph, edge, t)}</li>)}</ul></div>}
        {activity && <><div className="nf-row">{([-1, 1] as const).map((delta) => <Button key={delta}
          disabled={items.indexOf(activity) + delta < 0 || items.indexOf(activity) + delta >= items.length} disabledReason={t('builder.boundary')}
          onClick={() => { void edit({ type: 'reorder-item', nodeId: node.id, itemId: activity.id, delta }, false); }}>{t(delta < 0 ? 'library.up' : 'library.down')}</Button>)}</div>
          <Button variant="danger" onClick={() => { void edit({ type: 'remove-item', nodeId: node.id, itemId: activity.id }, true); }}>{t('builder.removeItem')}</Button></>}
        {!activity && <Button variant="danger" onClick={() => { void edit({ type: 'delete', nodeId: node.id }, true); }}>{t('builder.deleteStep')}</Button>}
        {!activity && (node.kind === 'decision' || node.kind === 'multitask') && <>
          <p>{t(node.kind === 'decision' ? 'builder.outcomeCount' : 'builder.activityCount', { count: items.length })}</p>
          <label className="nf-stack">{t('common.search')}<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <ul className="nf-list nf-stack">{items.filter((item) => normalize('label' in item ? item.label : item.name).includes(normalize(query))).map((item, index) => <li key={item.id} className="nf-stack">
            <Button onClick={() => startForm(item.id, 'label' in item ? item.label : item.name)}>{('label' in item ? item.label : item.name) || t(node.kind === 'decision' ? 'builder.unnamedOutcome' : 'builder.unnamedActivity')}</Button>
            <div className="nf-row"><Button onClick={() => select(node.kind === 'decision' ? { kind: 'edge', edge: { nodeId: node.id, slot: 'outcome', itemId: item.id } } :
              { kind: 'activity', nodeId: node.id, activityId: item.id })}>{t('builder.setPath')}</Button>
              {([-1, 1] as const).map((delta) => <Button key={delta} disabled={items.indexOf(item) + delta < 0 || items.indexOf(item) + delta >= items.length}
                disabledReason={t('builder.boundary')} onClick={() => { void edit({ type: 'reorder-item', nodeId: node.id, itemId: item.id, delta }, false); }}>{t(delta < 0 ? 'library.up' : 'library.down')}</Button>)}
              <Button variant="danger" aria-label={t('builder.removeNumber', { count: index + 1 })}
                onClick={() => { void edit({ type: 'remove-item', nodeId: node.id, itemId: item.id }, true); }}>{t('builder.removeItem')}</Button></div>
          </li>)}</ul>
          <Button disabled={items.length >= 32} disabledReason={t('builder.limit')} onClick={() => { void edit({ type: 'add-item', nodeId: node.id }, false); }}>
            {t(node.kind === 'decision' ? 'builder.addOutcome' : 'builder.addActivity')}</Button>
          {node.kind === 'multitask' && <>
            <Button onClick={() => select({ kind: 'edge', edge: { nodeId: node.id, slot: 'afterAll' } })}>{t('builder.afterAll')}</Button>
            {canPasteActivity && <Button onClick={() => pasteActivity(node.id)}>{t('builder.pasteActivity')}</Button>}</>}
        </>}
      </>}
    </fieldset>}
    <Button onClick={close}>{t('common.close')}</Button>
  </Sheet>;
}
