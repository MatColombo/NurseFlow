import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PackageError, PACKAGE_LIMITS } from '@domain/portability/zip';
import { parsePackage } from './codec';
/** F13 cross-route rejection only. Settings/full preview and writes belong to F14. */
export function AppScopeGuard() {
  const { t } = useTranslation(); const [results, setResults] = useState<{ name: string; code: string }[]>([]); const [busy, setBusy] = useState(false);
  async function inspect(files: File[]) { setBusy(true); const results = [];
    let bytes = 0;
    for (const [index, file] of files.entries()) { try { if (index >= PACKAGE_LIMITS.files || bytes + file.size > PACKAGE_LIMITS.batchBytes) throw new PackageError('limit'); bytes += file.size; await parsePackage(file, ['settings', 'full']); results.push({ name: file.name, code: 'pendingApp' }); }
      catch (error) { results.push({ name: file.name, code: error instanceof PackageError ? error.code : 'schema' }); } }
    setResults(results); setBusy(false);
  }
  return <section className="nf-portable nf-stack"><label className="nf-stack">{t('portable.chooseFiles')}<input type="file" multiple disabled={busy} onChange={(event) => { const files = [...(event.currentTarget.files ?? [])]; event.currentTarget.value = ''; void inspect(files); }} /></label>
    {busy && <p role="status">{t('portable.staging')}</p>}{results.map((result, index) => <div className="nf-stack" role="alert" key={index}><p>{result.name}</p><p>{t(result.code === 'scope' ? 'portable.wrongAppScope' : result.code === 'pendingApp' ? 'portable.pendingApp' : 'portable.errors.' + result.code)}</p>
      {result.code === 'scope' && <Link to="/data/procedures">{t('portable.goProcedures')}</Link>}</div>)}
  </section>;
}
