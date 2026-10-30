import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { metadataOf, metadataSchema, type ProcedureMetadata } from '@domain/procedures';
import { Button, Sheet } from '@shared/components';
import { MetadataFields } from './MetadataFields';
import { procedureService, type ProcedureDetails } from './service';
import { useUnsavedNavigation } from './useUnsavedNavigation';

export function MetadataSheet({ details, onClose, onSaved }: { details: ProcedureDetails; onClose(): void; onSaved(): Promise<void> }) {
  const { t } = useTranslation(); const [value, setValue] = useState(() => metadataOf(details.procedure));
  const [groups, setGroups] = useState(details.groups); const latest = useRef(value); const version = useRef(0);
  const pending = useRef<Promise<unknown>>(Promise.resolve()); const [error, setError] = useState(false); const [busy, setBusy] = useState(false);
  const [writing, setWriting] = useState(false);
  const closing = useRef(false);
  useUnsavedNavigation(true, { onBack: () => { void close(); }, beforeUnloadDirty: writing || error });
  function save(next: ProcedureMetadata) {
    const generation = ++version.current;
    setWriting(true);
    const promise = procedureService.saveMetadata(details.procedure.id, next); pending.current = promise;
    void promise.then(() => { if (generation === version.current) { setError(false); setWriting(false); } }, () => { if (generation === version.current) { setError(true); setWriting(false); } });
    return promise;
  }
  async function close() {
    if (closing.current) return;
    if (!metadataSchema.safeParse(latest.current).success) { setError(true); return; }
    closing.current = true; setBusy(true);
    try { await pending.current; await onSaved(); onClose(); } catch { setError(true); } finally { closing.current = false; setBusy(false); }
  }
  return <Sheet open title={t('procedure.editDetails')} onClose={() => { void close(); }}>
    <fieldset disabled={busy} className="nf-metadata-fields"><MetadataFields value={value} onChange={(next) => {
      latest.current = next; setValue(next);
      if (metadataSchema.safeParse(next).success) void save(next);
    }} groups={groups} onGroups={setGroups} suggestions={details.tags} /></fieldset>
    {error && <div className="nf-stack"><p role="alert">{t('procedure.saveError')}</p><Button onClick={() => { void save(latest.current); }}>{t('common.retry')}</Button></div>}
    <Button variant="primary" disabled={busy || !value.title.trim()} disabledReason={t('procedure.name')}
      onClick={() => { void close(); }}>{t('library.done')}</Button>
  </Sheet>;
}
