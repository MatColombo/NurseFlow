import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components';
import { builderService, type BuilderSnapshot } from './service';
import { BuilderEditor } from './BuilderEditor';
import './builder.css';
import { readPathReturn } from './path-route';
export function BuilderPage() {
  const { id = '' } = useParams(); const [params] = useSearchParams(); const revisionId = params.get('revision') ?? undefined;
  const location = useLocation(); const returningFromStep = (location.state as { fromStep?: boolean } | null)?.fromStep === true;
  const { t } = useTranslation(); const [snapshot, setSnapshot] = useState<BuilderSnapshot | null>(null);
  const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0); const opened = useRef(false);
  useEffect(() => {
    let active = true;
    void builderService.load(id, revisionId, !opened.current && !params.has('pathNode') && !returningFromStep).then((loaded) => {
      readPathReturn(params, loaded.revision.graph); if (active) { opened.current = true; setSnapshot(loaded); }
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, revisionId, attempt, params, returningFromStep]);
  if (error) return <section className="nf-stack"><h1>{t('pages.07')}</h1><p role="alert">{t('procedure.unavailable')}</p>
    <Button onClick={() => { setError(false); setAttempt((value) => value + 1); }}>{t('common.retry')}</Button><Link to={'/procedure/' + encodeURIComponent(id)}>{t('common.back')}</Link></section>;
  if (!snapshot) return <p role="status">{t('common.loading')}</p>;
  return <BuilderEditor key={snapshot.revision.id + (params.get('pathNode') ?? '') + (params.get('pathItem') ?? '')} initial={snapshot} pathReturn={readPathReturn(params, snapshot.revision.graph)} />;
}
