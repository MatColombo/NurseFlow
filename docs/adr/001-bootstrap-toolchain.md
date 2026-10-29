# ADR-001 — Toolchain riproducibile F00

Data: 29 ottobre 2026. Fase: F00. Stato: Accepted.

## Contesto e decisione

Il contratto 03 richiede npm, lockfile e Node LTS con versioni reali, compatibili e verificabili. Si fissa **Node 26.13.0 LTS (Lithium), npm 11.20.0**; `.nvmrc` e `.node-version` scelgono la stessa patch usata da CI. `engines` e `.npmrc` richiedono la linea Node 26 e npm 11 compatibili. `packageManager` documenta la versione usata per generare il lockfile.

Le dipendenze dirette hanno versioni esatte; npm genera il lockfile v3 anche per le dipendenze transitive. I pacchetti sono risolti dal registry npm, senza sorgenti CDN a runtime. React 19.3.1, Router 7.18.5, Vite 8.3.5, Vitest 5.0.5, ESLint 10.13.0 e Playwright 1.64.1 sono versioni stabili effettivamente pubblicate alla verifica.

Si usa **TypeScript 6.0.3**: TypeScript 7.0.2 è pubblicato, ma il parser `typescript-eslint` 8.72.1 dichiara compatibilità `>=4.8.4 <6.1.0`. L'alternativa di installare automaticamente tutti i `latest` non produce una combinazione supportata. Gli aggiornamenti successivi richiederanno nuova risoluzione del lockfile e riesecuzione dei gate.

Il routing hash e la risoluzione di `base` sono distinti. `VITE_BASE_PATH` prevale sul nome repository; locale e domini custom possono usare `/`. Vite e Playwright condividono la stessa funzione di risoluzione, testata anche con un repository rinominato. CI viene riusata dal workflow Pages: il deploy pubblica l'artefatto solo dopo unit test, build ed E2E.

I placeholder e i link diagnostici sono caricati solo con `import.meta.env.DEV` ed eliminati dalla build production. La build mantiene una sola anteprima tecnica sulle route note e recupero delle route sconosciute. Nessuna feature applicativa o dato clinico viene simulato. Le dipendenze Dexie/i18n/PWA saranno aggiunte quando usate nelle rispettive fasi; in F00 non esiste service worker, registrazione o reload automatico.

## Compatibilità e accettazione

TypeScript strict copre applicazione, test e configurazioni. Vitest usa jsdom e Testing Library. Playwright è configurato per Chromium, Firefox e WebKit e avvia autonomamente la build statica con preview. Le versioni browser effettivamente eseguite e i risultati dei comandi sono nel [report F00](../reports/F00.md); non equivalgono a verifica su dispositivi iOS/Android.

Accettazione: `npm ci`, typecheck, lint, unit test, build e smoke E2E; ripetizione E2E con base repository differente. GitHub Actions e Pages richiedono remote e push per la verifica in hosting.

Impatto su dati, migrazioni e UX congelata: nessuno. Rollback: ripristinare il commit F00, senza dati persistenti da migrare. Prossima fase: F01 (dominio e persistenza).

## Fonti verificate

- [Node 26.13.0 LTS](https://nodejs.org/en/blog/release/v26.13.0) e [indice ufficiale](https://nodejs.org/dist/index.json).
- Metadati `version`, `engines` e `peerDependencies` del registry npm, verificati prima dell'installazione; versioni installate nel lockfile.
- [Vite su GitHub Pages](https://vite.dev/guide/static-deploy).
- [React Router HashRouter](https://reactrouter.com/api/declarative-routers/HashRouter).
- [Playwright webServer](https://playwright.dev/docs/test-webserver).
