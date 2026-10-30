import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AppearanceSettings } from '@features/settings/AppearanceSettings';
import { Card } from '@shared/components';
import type { routeDefinitions } from './route-definitions';
import { StartupPage } from '@features/first-launch/StartupPage';
import { ProcedureEntry } from '@features/library/ProcedureEntry';
import { StoragePersistence } from '@features/settings/StoragePersistence';
import { ProcedureDetails } from '@features/procedures/ProcedureDetails';
import { NewProcedure } from '@features/procedures/NewProcedure';
import { RevisionDestination } from '@features/procedures/RevisionDestination';
import { BuilderPage } from '@features/builder/BuilderPage';
import { StepEntry } from '@features/builder/StepEntry';

type Page = typeof routeDefinitions[number]['page'];
export function RouteContent({ page }: { page: Page }) {
  const { t } = useTranslation();
  const parameters = useParams();
  const [search] = useSearchParams();
  if (page === '00' || page === '01') return <StartupPage key={page} setup={page === '00'} />;
  if (page === '02') return <ProcedureDetails key={parameters.id} />;
  if (page === '06') return <NewProcedure />;
  if (page === '07') return <BuilderPage key={parameters.id} />;
  const content = <section className="nf-stack" aria-labelledby="page-title">
    <h2 id="page-title" className="nf-title">{t(`pages.${page}`)}</h2>
    <Card><p>{t('shell.preview')}</p><p className="nf-note">{t('shell.pending', { page })}</p></Card>
    {import.meta.env.DEV && Object.entries(parameters).map(([name, value]) => <p key={name}>{name}: <code>{value}</code></p>)}
    {page === '10' && <><Link to="/library">{t('common.back')}</Link><AppearanceSettings /><StoragePersistence />
      <Link to="/data/procedures">{t('pages.11A')}</Link><Link to="/data/app">{t('pages.11B')}</Link></>}
    {page === '11B' && <Link to="/setup">{t('common.back')}</Link>}
  </section>;
  if (page === '05' || page === '03' && search.get('preview') === 'draft') return <RevisionDestination
    key={`${page}-${parameters.id}-${search.get('revision')}`} kind={page === '05' ? 'map' : 'preview'}>{content}</RevisionDestination>;
  if (page === '08') return <StepEntry key={`${parameters.id}-${parameters.nodeId}`}>{content}</StepEntry>;
  return page === '03' ? <ProcedureEntry key={`${page}-${parameters.id}`} run>{content}</ProcedureEntry> : content;
}

export function RouteNotFound() {
  const { t } = useTranslation();
  return <section className="nf-stack" aria-labelledby="not-found-title">
    <h2 id="not-found-title">{t('shell.notFound')}</h2><Link to="/library">{t('common.library')}</Link>
  </section>;
}
