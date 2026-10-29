import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { routeDefinitions } from '@app/route-definitions';
import { RouteContent, RouteNotFound } from '@app/RouteContent';
import ComponentShowcase from './ComponentShowcase';

export default function DevelopmentRoutes() {
  const { t } = useTranslation();
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/library" replace />} />
        {routeDefinitions.map(({ path, page }) => (
          <Route key={path} path={path} element={<RouteContent page={page} />} />
        ))}
        <Route path="/dev/components" element={<ComponentShowcase />} />
        <Route path="*" element={<RouteNotFound />} />
      </Routes>
      <nav aria-label={t('shell.development')}>
        <ul>
          {routeDefinitions.map(({ path, example, page }) => (
            <li key={path}><Link to={example}>{page} · {t(`pages.${page}`)}</Link></li>
          ))}
          <li><Link to="/dev/components">{t('shell.components')}</Link></li>
        </ul>
      </nav>
    </>
  );
}
