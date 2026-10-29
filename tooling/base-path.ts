interface BasePathEnvironment {
  VITE_BASE_PATH?: string | undefined;
  REPOSITORY_NAME?: string | undefined;
}

/** Stessa risoluzione in Vite, preview e Playwright; l'hash non include la base. */
export function resolveBasePath(environment: BasePathEnvironment): string {
  const override = environment.VITE_BASE_PATH?.trim();
  const repository = environment.REPOSITORY_NAME?.trim();

  if (!override && repository && !/^[\w.-]+$/.test(repository)) {
    throw new Error('REPOSITORY_NAME deve contenere solo il nome del repository.');
  }

  const value = override || (
    repository && !repository.toLowerCase().endsWith('.github.io') ? repository : '/'
  );
  const segments = value.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);

  if (segments.some((segment) => !/^[\w.-]+$/.test(segment) || segment === '.' || segment === '..')) {
    throw new Error('VITE_BASE_PATH deve essere un percorso locale, per esempio /nurseflow/.');
  }

  return segments.length > 0 ? `/${segments.join('/')}/` : '/';
}
