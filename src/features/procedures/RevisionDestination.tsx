import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Revision } from '@domain/model';
import { invariant } from '@domain/model/integrity';
import { Button } from '@shared/components';
import { libraryService } from '@features/library/service';
import { procedureService } from './service';

/** Entry adapter only. F05/F10/F11 implement the actual editor, guided screen and map. */
export function RevisionDestination({ kind, children }: { kind: 'build' | 'map' | 'preview'; children: ReactNode }) {
  const { id = '' } = useParams(); const [params] = useSearchParams(); const revisionId = params.get('revision');
  const { t } = useTranslation(); const [loaded, setLoaded] = useState<{ title: string; revision: Revision } | null>(null);
  const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void (async () => {
      const details = await procedureService.load(id);
      const revision = revisionId ? await procedureService.revision(id, revisionId) :
        kind === 'map' ? details.ready ?? details.draft : details.draft ?? details.ready;
      invariant(revision, 'Revision unavailable');
      if (kind === 'preview') invariant(revision.state === 'working-draft', 'Preview requires Draft');
      if (kind !== 'map') await libraryService.openProcedure(id);
      if (active) setLoaded({ title: details.procedure.title, revision });
    })().catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, revisionId, kind, attempt]);
  if (error) return <div className="nf-stack">{children}<p role="alert">{t('procedure.unavailable')}</p>
    <Button onClick={() => { setError(false); setAttempt((value) => value + 1); }}>{t('common.retry')}</Button><Link to="/library">{t('common.library')}</Link></div>;
  return <div className="nf-stack">{loaded && <>
    {kind === 'preview' && <strong role="status">{t('procedure.draftPreview')}</strong>}
    <p>{loaded.title}</p><p data-revision-id={loaded.revision.id} data-revision-state={loaded.revision.state}>
      {kind === 'build' && loaded.revision.state === 'ready' ? `${t('procedure.workingCopy')} · ` : ''}
      {loaded.revision.state === 'ready' ? t('procedure.readyVersion', { version: loaded.revision.revisionNumber }) : t('status.draft')}
    </p></>}{children}
    <Link to={kind === 'build' ? '/library' : `/procedure/${encodeURIComponent(id)}`}>{t(kind === 'build' ? 'common.library' : 'common.back')}</Link>
  </div>;
}
