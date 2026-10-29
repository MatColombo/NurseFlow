import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { routeDefinitions } from '@app/route-definitions';

// Vite elimina questo import e i placeholder dal bundle production.
const DevelopmentRoutes = import.meta.env.DEV
  ? lazy(() => import('@app/development/DevelopmentRoutes'))
  : null;

function TechnicalPreview() {
  return (
    <section aria-labelledby="preview-title">
      <h2 id="preview-title">Anteprima tecnica F00</h2>
      <p>Bootstrap di NurseFlow. Le funzionalità applicative saranno aggiunte nelle prossime fasi.</p>
    </section>
  );
}

export function RouteNotFound() {
  return (
    <section aria-labelledby="not-found-title">
      <h2 id="not-found-title">Pagina non trovata</h2>
      <Link to="/library">Torna alla libreria</Link>
    </section>
  );
}

export function AppRoutes() {
  if (DevelopmentRoutes) {
    return (
      <Suspense fallback={<p>Caricamento…</p>}>
        <DevelopmentRoutes />
      </Suspense>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/library" replace />} />
      {routeDefinitions.map(({ path }) => (
        <Route key={path} path={path} element={<TechnicalPreview />} />
      ))}
      <Route path="*" element={<RouteNotFound />} />
    </Routes>
  );
}
