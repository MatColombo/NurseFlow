import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { routeDefinitions } from '@app/route-definitions';
import { RouteNotFound } from '@app/routes';

function DevelopmentPlaceholder({ title, page }: { title: string; page: string }) {
  const parameters = useParams();

  return (
    <section aria-labelledby="placeholder-title">
      <h2 id="placeholder-title">{title}</h2>
      <p>Page {page}: <strong>not implemented</strong></p>
      {Object.entries(parameters).map(([name, value]) => (
        <p key={name}>{name}: <code>{value}</code></p>
      ))}
    </section>
  );
}

export default function DevelopmentRoutes() {
  return (
    <>
      <p>F00 · Solo sviluppo · Nessuna funzionalità applicativa implementata.</p>
      <Routes>
        <Route path="/" element={<Navigate to="/library" replace />} />
        {routeDefinitions.map(({ path, title, page }) => (
          <Route key={path} path={path} element={<DevelopmentPlaceholder title={title} page={page} />} />
        ))}
        <Route path="*" element={<RouteNotFound />} />
      </Routes>
      <nav aria-label="Route di sviluppo">
        <ul>
          {routeDefinitions.map(({ path, example, page, title }) => (
            <li key={path}><Link to={example}>{page} · {title}</Link></li>
          ))}
        </ul>
      </nav>
    </>
  );
}
