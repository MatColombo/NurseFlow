import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components';
import { libraryService } from './service';

/** F03 records actual entry. The full Details/Builder/Run screens belong to their assigned phases. */
export function ProcedureEntry({ children, run = false }: { children: ReactNode; run?: boolean }) {
  const { id } = useParams(); const { t } = useTranslation(); const [title, setTitle] = useState('');
  const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (id) void (run ? libraryService.openRun(id) : libraryService.openProcedure(id))
      .then((procedure) => { if (active) setTitle(procedure.title); }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, attempt, run]);
  return <div className="nf-stack">{title && <p>{title}</p>}{children}
    {error && <div className="nf-stack"><p role="alert">{t('library.loadError')}</p><Button onClick={() => {
      setError(false); setAttempt((value) => value + 1);
    }}>{t('common.retry')}</Button></div>}
    <Link to="/library">{t('common.library')}</Link>
  </div>;
}
