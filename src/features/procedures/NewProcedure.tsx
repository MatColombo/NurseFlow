import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { metadataOf, type ProcedureMetadata } from '@domain/procedures';
import type { Group } from '@domain/model';
import { Button, Dialog } from '@shared/components';
import { MetadataFields } from './MetadataFields';
import { procedureService } from './service';
import { useUnsavedNavigation } from './useUnsavedNavigation';
import './procedures.css';

export function NewProcedure() {
  const { t } = useTranslation(); const navigate = useNavigate(); const [metadata, setMetadata] = useState(metadataOf);
  const latest = useRef(metadata); const [groups, setGroups] = useState<Group[]>([]); const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(false); const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false); const [error, setError] = useState(false); const committing = useRef(false);
  const [touched, setTouched] = useState(false);
  const dirty = touched || JSON.stringify(metadata) !== JSON.stringify(metadataOf()); const guard = useUnsavedNavigation(dirty && !saving);
  useEffect(() => {
    let active = true;
    void procedureService.choices().then((choices) => { if (active) { setGroups(choices.groups); setTags(choices.tags); setLoading(false); } }, () => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [attempt]);
  async function create() {
    if (committing.current) return;
    const value = latest.current; if (!value.title.trim() || value.title.trim().length > 120) return;
    committing.current = true; setSaving(true); setError(false);
    try { const { procedure, draft } = await procedureService.create(value);
      void navigate(`/build/${encodeURIComponent(procedure.id)}?revision=${encodeURIComponent(draft.id)}`, { replace: true });
    } catch { setSaving(false); committing.current = false; setError(true); }
  }
  if (loadError) return <div className="nf-stack"><p role="alert">{t('library.loadError')}</p><Button onClick={() => { setLoadError(false); setAttempt((value) => value + 1); }}>{t('common.retry')}</Button></div>;
  if (loading) return <p role="status">{t('common.loading')}</p>;
  return <section className="nf-procedure nf-stack" aria-labelledby="new-procedure-title">
    <header className="nf-row"><Button icon="back" aria-label={t('common.back')} onClick={() => guard.requestLeave(() => { void navigate('/library'); })} />
      <h1 id="new-procedure-title">{t('pages.06')}</h1></header>
    <form className="nf-stack" onChange={() => setTouched(true)} onSubmit={(event) => { event.preventDefault(); void create(); }}>
      <fieldset disabled={saving} className="nf-stack nf-metadata-fields">
        <MetadataFields value={metadata} onChange={(value: ProcedureMetadata) => { latest.current = value; setMetadata(value); }}
          groups={groups} onGroups={setGroups} suggestions={tags} optionalCollapsed creating />
      </fieldset>
      {error && <p role="alert">{t('procedure.saveError')}</p>}
      <Button type="submit" variant="primary" action disabled={saving || !metadata.title.trim() || metadata.title.trim().length > 120}
        disabledReason={saving ? t('common.loading') : t('procedure.titleRequired')}>{error ? t('common.retry') : t('procedure.create')}</Button>
    </form>
    <Dialog open={guard.pending} title={t('procedure.discard')} onClose={guard.cancel}>
      <div className="nf-row"><Button onClick={guard.cancel}>{t('procedure.keepEditing')}</Button>
        <Button variant="danger" onClick={guard.confirm}>{t('procedure.discardAction')}</Button></div>
    </Dialog>
  </section>;
}
