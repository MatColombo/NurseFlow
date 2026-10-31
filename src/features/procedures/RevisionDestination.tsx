import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Revision } from '@domain/model';
import { invariant } from '@domain/model/integrity';
import { Button } from '@shared/components';
import { libraryService } from '@features/library/service';
import { procedureService } from './service';
import { runtimeService } from '@features/runtime/service';

/** Read-only revision entry. The complete Map/List renderer belongs to F11. */
export function RevisionDestination({ kind, children }: { kind: 'build' | 'map' | 'preview'; children: ReactNode }) {
  const { id = '' } = useParams(); const [params] = useSearchParams(); const revisionId = params.get('revision');
  const { t } = useTranslation(); const [loaded, setLoaded] = useState<{ title: string; revision: Revision } | null>(null);
  const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  const [runReturn, setRunReturn] = useState<string | null>(null); const [currentNode, setCurrentNode] = useState<string | null>(null);
  const runId = params.get('run'); const previewRun = params.get('previewRun');
  useEffect(() => {
    let active = true;
    void (async () => {
      if (kind === 'map' && (runId || previewRun)) {
        const runtime = runId ? await runtimeService.read(runId) : await runtimeService.readPreview(revisionId ?? '');
        invariant(runtime.run.procedureId === id && runtime.revision.id === revisionId && (runId || runtime.run.id === previewRun), 'Map run mismatch');
        if (active) { setLoaded({ title: runtime.title, revision: runtime.revision }); setCurrentNode(runtime.run.currentNodeId);
          setRunReturn(`/run/${encodeURIComponent(runtime.preview ? id : runtime.run.id)}${runtime.run.status === 'ended' ? '/end' : ''}${runtime.preview ? `?preview=draft&revision=${encodeURIComponent(runtime.revision.id)}` : ''}`); }
        return;
      }
      const details = await procedureService.load(id);
      const revision = revisionId ? await procedureService.revision(id, revisionId) :
        kind === 'map' ? details.ready ?? details.draft : details.draft ?? details.ready;
      invariant(revision, 'Revision unavailable');
      if (kind === 'preview') invariant(revision.state === 'working-draft', 'Preview requires Draft');
      if (kind !== 'map') await libraryService.openProcedure(id);
      if (active) setLoaded({ title: details.procedure.title, revision });
    })().catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, revisionId, kind, attempt, runId, previewRun]);
  if (error) return <div className="nf-stack">{children}<p role="alert">{t('procedure.unavailable')}</p>
    <Button onClick={() => { setError(false); setAttempt((value) => value + 1); }}>{t('common.retry')}</Button><Link to="/library">{t('common.library')}</Link></div>;
  return <div className="nf-stack">{loaded && <>
    {kind === 'preview' && <strong role="status">{t('procedure.draftPreview')}</strong>}
    <p>{loaded.title}</p><p data-revision-id={loaded.revision.id} data-revision-state={loaded.revision.state} data-current-node={currentNode}>
      {kind === 'build' && loaded.revision.state === 'ready' ? `${t('procedure.workingCopy')} · ` : ''}
      {loaded.revision.state === 'ready' ? t('procedure.readyVersion', { version: loaded.revision.revisionNumber }) : t('status.draft')}
    </p></>}{children}
    <Link to={runReturn ?? (kind === 'build' ? '/library' : `/procedure/${encodeURIComponent(id)}`)} state={runReturn ? { runMapReturn: runId ?? previewRun } : null}>{t(kind === 'build' ? 'common.library' : 'common.back')}</Link>
  </div>;
}
