import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { viewRun } from '@domain/runtime';
import { Button } from '@shared/components';
import { runtimeService } from '@features/runtime/service';
import { libraryService } from '@features/library/service';
import { RunScreen, type RunData, type RunAdapter } from './RunScreen';

export default function RunPage() {
  const location = useLocation(); const fromMap = useRef(Boolean(location.state?.runMapReturn));
  const { id = '' } = useParams(); const [search] = useSearchParams(); const revisionId = search.get('revision') ?? '';
  const preview = search.get('preview') === 'draft'; const { t } = useTranslation();
  const [data, setData] = useState<RunData | null>(null); const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void (async () => {
      const loaded = fromMap.current ? preview ? await runtimeService.readPreview(revisionId) : await runtimeService.read(id) :
        preview ? await runtimeService.preview(id, revisionId) : await runtimeService.resume(id);
      if (!loaded.archived && !fromMap.current) { if (preview) await libraryService.openProcedure(id); else await libraryService.openRun(id); }
      if (active) { setData(loaded); setError(false); }
    })().catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, preview, revisionId, attempt]);
  if (error) return <section className="nf-run nf-stack"><h1>{t('run.title')}</h1>{preview && <strong role="status">{t('procedure.draftPreview')}</strong>}<p role="alert">{t(preview ? 'run.previewInvalid' : 'run.unavailable')}</p>
    <Button onClick={() => { setError(false); setAttempt((value) => value + 1); }}>{t('common.retry')}</Button>
    {preview && <Link to={`/build/${encodeURIComponent(id)}?revision=${encodeURIComponent(revisionId)}`}>{t('run.builder')}</Link>}
    <Link to="/library">{t('common.library')}</Link><Link to="/data/procedures">{t('run.recovery')}</Link></section>;
  if (!data) return <p role="status">{t('common.loading')}</p>;
  const adapter: RunAdapter = {
    async dispatch(event) {
      const run = data.preview ? await runtimeService.dispatchPreview(data.revision.id, data.run.saveVersion, event) : await runtimeService.dispatch(data.run.id, data.run.saveVersion, event);
      return run ? { ...data, run, view: viewRun(run, data.revision, data.preview ? 'draft-preview' : 'ready') } : null;
    },
    async finish() { if (data.preview) await runtimeService.finishPreview(data.revision.id, data.run.saveVersion); else await runtimeService.finish(data.run.id, data.run.saveVersion); },
    async reload() { return data.preview ? runtimeService.readPreview(data.revision.id) : runtimeService.read(data.run.id); },
  };
  return <RunScreen key={data.run.id} initial={data} adapter={adapter} onData={setData} />;
}
