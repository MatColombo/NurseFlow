import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { AppearanceSettings } from '@features/settings/AppearanceSettings';
import { Card } from '@shared/components';
import type { routeDefinitions } from './route-definitions';
import { StartupPage } from '@features/first-launch/StartupPage';
import { ProcedureEntry } from '@features/library/ProcedureEntry';
import { StoragePersistence } from '@features/settings/StoragePersistence';

type Page = typeof routeDefinitions[number]['page'];
export function RouteContent({ page }: { page: Page }) {
  const { t } = useTranslation();
  const parameters = useParams();
  if (page === '00' || page === '01') return <StartupPage key={page} setup={page === '00'} />;
  const content = <section className="nf-stack" aria-labelledby="page-title">
    <h2 id="page-title" className="nf-title">{t(`pages.${page}`)}</h2>
    <Card><p>{t('shell.preview')}</p><p className="nf-note">{t('shell.pending', { page })}</p></Card>
    {import.meta.env.DEV && Object.entries(parameters).map(([name, value]) => <p key={name}>{name}: <code>{value}</code></p>)}
    {page === '10' && <><Link to="/library">{t('common.back')}</Link><AppearanceSettings /><StoragePersistence />
      <Link to="/data/procedures">{t('pages.11A')}</Link><Link to="/data/app">{t('pages.11B')}</Link></>}
    {page === '11B' && <Link to="/setup">{t('common.back')}</Link>}
  </section>;
  return ['02', '03', '07', '08'].includes(page) ? <ProcedureEntry key={`${page}-${parameters.id}`} run={page === '03'}>{content}</ProcedureEntry> : content;
}

export function RouteNotFound() {
  const { t } = useTranslation();
  return <section className="nf-stack" aria-labelledby="not-found-title">
    <h2 id="not-found-title">{t('shell.notFound')}</h2><Link to="/library">{t('common.library')}</Link>
  </section>;
}
