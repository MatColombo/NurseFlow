import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { resolveBasePath } from '../../tooling/base-path';

/** Real HTTP updates bypass Playwright interception, as SW script fetches must. */
export async function pwaServer() {
  let version = 1;
  const base = resolveBasePath(process.env); const root = resolve('dist');
  const server = createServer((request, response) => {
    void (async () => {
      const path = new URL(request.url ?? '/', 'http://localhost').pathname;
      if (!path.startsWith(base)) { response.writeHead(404).end(); return; }
      const file = resolve(root, path.slice(base.length) || 'index.html');
      if (!file.startsWith(root + sep)) { response.writeHead(404).end(); return; }
      try {
        const data = await readFile(file);
        const type = ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' } as Record<string, string>)[extname(file)] ?? 'application/octet-stream';
        response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
        response.end(file.endsWith(sep + 'sw.js') ? Buffer.concat([data, Buffer.from(`\n// F15 actual worker revision ${version}\n`)]) : data);
      } catch { response.writeHead(404).end(); }
    })();
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('HTTP test address missing');
  return { url: `http://127.0.0.1:${address.port}${base}`, update: () => { version++; }, close: () => new Promise<void>((done, reject) => { server.close((error) => error ? reject(error) : done()); server.closeAllConnections(); }) };
}
