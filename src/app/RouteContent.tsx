import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { SettingsPage } from '@features/settings/SettingsPage';
import { Card } from '@shared/components';
import type { routeDefinitions } from './route-definitions';
import { StartupPage } from '@features/first-launch/StartupPage';
import { ProcedureDetails } from '@features/procedures/ProcedureDetails';
import { NewProcedure } from '@features/procedures/NewProcedure';
import MapPage from '@features/map/MapPage';
import { BuilderPage } from '@features/builder/BuilderPage';
import StepEditorPage from '@features/step-editor/StepEditorPage';
import CheckPage from '@features/check/CheckPage';
import RunPage from '@features/run/RunPage';

type Page = typeof routeDefinitions[number]['page'];
export function RouteContent({ page }: { page: Page }) {
  const { t } = useTranslation();
  const location = useLocation();
  const parameters = useParams();
  const [search] = useSearchParams();
  if (page === '00' || page === '01') return <StartupPage key={page} setup={page === '00'} />;
  if (page === '02') return <ProcedureDetails key={parameters.id} />;
  if (page === '05') return <MapPage key={`${parameters.id}-${search.get('revision')}-${search.get('run')}-${search.get('previewRun')}`} />;
  if (page === '06') return <NewProcedure />;
  if (page === '07') return <BuilderPage key={parameters.id} />;
  if (page === '08') return <StepEditorPage key={`${parameters.id}-${parameters.nodeId}`} />;
  if (page === '09') return <CheckPage key={parameters.id} />;
  if (page === '10') return <SettingsPage />;
  if (page === '03' || page === '04') return <RunPage key={`${parameters.id}-${search.get('preview')}-${search.get('revision')}`} />;
  const content = <section className="nf-stack" aria-labelledby="page-title">
    <h2 id="page-title" className="nf-title">{t(`pages.${page}`)}</h2>
    <Card><p>{t('shell.preview')}</p><p className="nf-note">{t('shell.pending', { page })}</p></Card>
    {import.meta.env.DEV && Object.entries(parameters).map(([name, value]) => <p key={name}>{name}: <code>{value}</code></p>)}
    {(page === '11A' || page === '11B') && <Link to={['/setup', '/library'].includes(location.state?.dataReturn) ? location.state.dataReturn : '/settings'}>{t('common.back')}</Link>}
  </section>;
  return content;
}

export function RouteNotFound() {
  const { t } = useTranslation();
  return <section className="nf-stack" aria-labelledby="not-found-title">
    <h2 id="not-found-title">{t('shell.notFound')}</h2><Link to="/library">{t('common.library')}</Link>
  </section>;
}
