import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Settings } from '@domain/model';
import { editableStep } from '@domain/editor/edits';
import { nodeAt } from '@domain/builder/structure';
import { builderService, type BuilderSnapshot } from '@features/builder/service';
import { Button } from '@shared/components';
import { mediaService } from './media/service';
import { StepEditor } from './StepEditor';
import './editor.css';
export default function StepEditorPage() {
  const { id = '', nodeId = '' } = useParams(); const [params] = useSearchParams(); const requested = params.get('revision') ?? undefined;
  const { t } = useTranslation(); const [loaded, setLoaded] = useState<{ snapshot: BuilderSnapshot; settings: Settings } | null>(null); const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  const committed = useRef<string | null>(null);
  useEffect(() => {
    if (requested && requested === committed.current) return;
    let active = true;
    void Promise.all([builderService.load(id, requested), mediaService.settings()]).then(([snapshot, settings]) => {
      editableStep(nodeAt(snapshot.revision.graph, nodeId)); if (active) setLoaded({ snapshot, settings });
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, nodeId, requested, attempt]);
  if (error) return <section className="nf-stack"><h1>{t('editor.title')}</h1><p role="alert">{t('editor.unavailable')}</p><Button onClick={() => { setError(false); setAttempt((value) => value + 1); }}>{t('common.retry')}</Button><Link to={'/build/' + encodeURIComponent(id)}>{t('builder.backBuilder')}</Link></section>;
  if (!loaded) return <p role="status">{t('common.loading')}</p>;
  return <StepEditor key={nodeId} initial={loaded.snapshot} settings={loaded.settings} nodeId={nodeId} markRevision={(id) => { committed.current = id; }} />;
}
