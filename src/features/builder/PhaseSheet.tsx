import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Graph } from '@domain/model';
import type { Edit } from '@domain/builder/edits';
import { Button, Sheet } from '@shared/components';
export function PhaseSheet({ graph, edit, close, error, busy, retry, retryable }: {
  graph: Graph; edit(edit: Edit, preview: boolean): Promise<boolean>; close(): void; error: string | null; busy: boolean;
  retry(): void; retryable: boolean;
}) {
  const { t } = useTranslation(); const [name, setName] = useState(''); const [id, setId] = useState<string | undefined>();
  const phases = [...graph.phases].sort((a, b) => a.order - b.order);
  return <Sheet open title={t('builder.managePhases')} onClose={close}>
    {error && <div><p role="alert">{error}</p>{retryable && <Button onClick={retry}>{t('common.retry')}</Button>}</div>}
    <fieldset disabled={busy} className="nf-metadata-fields nf-stack">
      <ul className="nf-list nf-stack">{phases.map((phase, index) => <li key={phase.id} className="nf-stack">
        <Button onClick={() => { setId(phase.id); setName(phase.name); }}>{phase.name || t('builder.phase')}</Button>
        <div className="nf-row">{([-1, 1] as const).map((delta) => <Button key={delta} disabled={index + delta < 0 || index + delta >= phases.length}
          disabledReason={t('builder.boundary')} onClick={() => { void edit({ type: 'phase', id: phase.id, name: phase.name, delta }, false); }}>{t(delta < 0 ? 'library.up' : 'library.down')}</Button>)}
          <Button variant="danger" onClick={() => { void edit({ type: 'phase', id: phase.id, name: phase.name, remove: true }, true); }}>{t('builder.removeItem')}</Button></div>
      </li>)}</ul>
      <form className="nf-stack" onSubmit={(event) => { event.preventDefault(); if (name.trim()) void edit({ type: 'phase', ...(id ? { id } : {}), name }, false).then((saved) => { if (saved) { setId(undefined); setName(''); } }); }}>
        <label className="nf-stack">{t('builder.phaseName')}<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <Button type="submit" disabled={!name.trim()} disabledReason={t('builder.phaseName')}>{t(id ? 'library.done' : 'builder.addPhase')}</Button>
      </form>
    </fieldset>
  </Sheet>;
}
