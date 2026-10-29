import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { routeDefinitions } from '@app/route-definitions';
import { RouteContent, RouteNotFound } from './RouteContent';
import { ErrorBoundary } from './error-boundaries';

// Vite elimina questo import e i placeholder dal bundle production.
const DevelopmentRoutes = import.meta.env.DEV
  ? lazy(() => import('@app/development/DevelopmentRoutes'))
  : null;

export function AppRoutes() {
  const location = useLocation();
  const { t } = useTranslation();
  return <ErrorBoundary resetKey={location.pathname}>
    {DevelopmentRoutes ? <Suspense fallback={<p role="status">{t('common.loading')}</p>}>
      <DevelopmentRoutes />
    </Suspense> : <Routes>
      <Route path="/" element={<Navigate to="/library" replace />} />
      {routeDefinitions.map(({ path, page }) => (
        <Route key={path} path={path} element={<RouteContent page={page} />} />
      ))}
      <Route path="*" element={<RouteNotFound />} />
    </Routes>}
  </ErrorBoundary>;
}
