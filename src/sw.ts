/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };
const assets = self.__WB_MANIFEST;
// Only build assets. No runtime caching of authored remote media or application data.
precacheAndRoute(assets);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), {
  allowlist: [new RegExp(`^${new URL(self.registration.scope).pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:index\\.html)?$`)],
}));
clientsClaim();

let activation: Promise<void> | undefined;
async function allClientsIdle() {
  const clients = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
    .filter((client) => client.url.startsWith(self.registration.scope));
  return (await Promise.all(clients.map((client) => new Promise<boolean>((resolve) => {
    const channel = new MessageChannel();
    const finish = (safe: boolean) => { clearTimeout(timer); channel.port1.close(); resolve(safe); };
    const timer = setTimeout(() => finish(false), 3000);
    channel.port1.onmessage = (event: MessageEvent<unknown>) => finish(event.data === true);
    client.postMessage({ type: 'NF_IDLE_REQUEST' }, [channel.port2]);
  })))).every(Boolean);
}
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'NF_CACHE_STATUS') {
    event.waitUntil((async () => {
      try {
        const complete = (await Promise.all(assets.map((asset) => matchPrecache(typeof asset === 'string' ? asset : asset.url)))).every(Boolean);
        event.ports[0]?.postMessage({ complete });
      } catch { event.ports[0]?.postMessage({ complete: false }); }
    })());
  }
  if (event.data?.type === 'SKIP_WAITING') {
    activation ??= (async () => {
      if (await allClientsIdle().catch(() => false)) await self.skipWaiting();
      else event.source?.postMessage({ type: 'NF_UPDATE_BLOCKED' });
    })().catch(() => { event.source?.postMessage({ type: 'NF_UPDATE_BLOCKED' }); }).finally(() => { activation = undefined; });
    event.waitUntil(activation);
  }
});
