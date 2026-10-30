import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { nodeAt } from '@domain/builder/structure';
import { Button } from '@shared/components';
import { builderService } from './service';
import { titleOf } from './labels';
/** F05 entry contract; full content/outcome/media editing belongs to F07. */
export function StepEntry({ children }: { children: ReactNode }) {
  const { id = '', nodeId = '' } = useParams(); const [params] = useSearchParams(); const requested = params.get('revision') ?? undefined;
  const { t } = useTranslation(); const [loaded, setLoaded] = useState<{ revisionId: string; title: string } | null>(null);
  const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void builderService.load(id, requested).then((snapshot) => {
      const node = nodeAt(snapshot.revision.graph, nodeId);
      if (active) setLoaded({ revisionId: snapshot.revision.id, title: titleOf(node, t) });
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, nodeId, requested, attempt, t]);
  return <div className="nf-stack">{loaded && <p data-node-id={nodeId}>{loaded.title}</p>}{children}
    {error && <><p role="alert">{t('procedure.unavailable')}</p><Button onClick={() => { setError(false); setAttempt((value) => value + 1); }}>{t('common.retry')}</Button></>}
    <Link to={'/build/' + encodeURIComponent(id) + (loaded ? '?revision=' + encodeURIComponent(loaded.revisionId) : '')}>{t('builder.backBuilder')}</Link>
  </div>;
}
