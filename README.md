# NurseFlow

Bootstrap **F00**: React, Vite e TypeScript strict per hosting statico GitHub Pages. Questa è un'anteprima tecnica, senza funzionalità cliniche, dati demo o persistenza. I contratti originali sono in [docs/nurseflow](docs/nurseflow/00_START_HERE.md).

## Avvio riproducibile

Richiesti **Node 26.13.0 LTS** e **npm 11.20.0**, fissati in `.nvmrc`, `.node-version`, `package.json` e ADR-001. Con nvm, eseguire `nvm install` e `nvm use` (su nvm-windows specificare `26.13.0`).

```sh
npm ci
npm run dev
```

Aprire l'URL mostrato da Vite. `npm ci` installa esattamente `package-lock.json`; mantenere il lockfile versionato. Il server Vite e il preview sono strumenti locali di sviluppo: il deploy contiene solo file statici in `dist/`.

| Comando | Comportamento |
| --- | --- |
| `npm run dev` | Avvia Vite con le route diagnostiche di sviluppo |
| `npm run typecheck` | Verifica codice app, test, configurazioni ed E2E con TypeScript strict |
| `npm run lint` | ESLint; qualsiasi warning fa fallire il comando |
| `npm run test` | Vitest + Testing Library, esecuzione singola |
| `npm run build` | Typecheck e build statica di produzione in `dist/` |
| `npm run test:e2e` | Compila, avvia il preview e testa Chromium, Firefox e WebKit |
| `npm run preview` | Serve localmente una build già creata |

## Test

```sh
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

Su Linux installare anche le dipendenze di sistema con `npx playwright install --with-deps chromium firefox webkit`. Per eseguire un solo browser: `npm run test:e2e -- --project=chromium`.

Gli smoke test verificano mount, tutte le route hash previste, parametri, reload dei deep link e recupero di route sconosciute. Gli E2E lavorano sulla build production, verificano l'assenza di placeholder di sviluppo, richieste esterne e service worker. Il preview viene avviato automaticamente sulla porta `4173`, che deve essere libera. Il report HTML è in `playwright-report/`.

## GitHub Pages e `base`

La configurazione è condivisa fra Vite e Playwright:

1. `VITE_BASE_PATH`, se valorizzato, prevale (es. `/nurseflow/` oppure `/`).
2. `REPOSITORY_NAME` produce `/<nome>/`; per un repository `nome.github.io` produce `/`.
3. In assenza di configurazione si usa `/`, adatto allo sviluppo locale.

Le variabili si possono inserire in `.env.local`, copiando gli esempi di `.env.example`. Per provare un nome repository differente in PowerShell:

```powershell
$env:REPOSITORY_NAME = 'nurseflow-preview'
npm run test:e2e
npm run preview
# Al termine del preview (Ctrl+C):
Remove-Item Env:REPOSITORY_NAME
```

In una shell POSIX: `REPOSITORY_NAME=nurseflow-preview npm run test:e2e`.

Il link risultante è `http://127.0.0.1:4173/nurseflow-preview/#/build/example/step/node-example`. Il prefisso repository precede `#`: HashRouter non richiede rewrite o pagine 404 speciali. I futuri URL di risorse pubbliche devono partire da `import.meta.env.BASE_URL`; gli asset importati sono gestiti da Vite.

Pubblicare il repository su GitHub con branch `main` e selezionare **Settings → Pages → Build and deployment → Source: GitHub Actions**. Il nome repository è passato automaticamente al workflow. Per un dominio custom impostare la variabile repository **VITE_BASE_PATH** a `/`; un diverso prefisso può essere impostato nella stessa variabile. Non sono richiesti token personali o secret applicativi.

- `ci.yml`: controlli su pull request e avvio manuale; riusabile da altri workflow. Esegue `npm ci`, lint, typecheck, unit test, build, installazione dei tre browser ed E2E sotto la base del repository.
- `deploy.yml`: su push a `main` richiama CI; solo dopo tutti i controlli pubblica lo stesso artefatto verificato nell'ambiente `github-pages`. Avvio manuale disponibile, deploy limitato a `main`.

I workflow sono predisposti; una verifica GitHub Actions/Pages reale richiede un remote e il primo push. L'esito locale non costituisce un deploy già effettuato.

## Moduli e limiti F00

```text
src/app/          routing HashRouter e bootstrap
src/domain/       model, graph, validation, runtime, portability (F01+)
src/storage/      migrations, repositories (F01+)
src/features/     first-launch, library, procedures, builder, step-editor,
                  validation, run, map, settings, portability
src/shared/       components, design-tokens, styles, i18n, icons, utils
src/test/         setup, fixtures, helpers
e2e/              journeys, fixtures
tooling/          risoluzione e test della base statica
```

Gli alias `@app/*`, `@domain/*`, `@storage/*`, `@features/*`, `@shared/*`, `@test/*` sono coerenti fra TypeScript e Vite/Vitest. Le cartelle riservate usano `.gitkeep`, senza implementazioni fittizie. ESLint protegge i confini principali: dominio indipendente da React/DOM/DB, storage senza componenti React, UI senza accessi diretti a Dexie.

Solo in sviluppo, le Pagine 00–11B mostrano **`not implemented`**, i parametri dell'hash e un elenco diagnostico di route. Questi componenti sono esclusi dalla build production, che mostra **Anteprima tecnica F00** sulle route riservate. La root apre `#/library` soltanto per lo smoke tecnico; il flusso di primo avvio verrà implementato in F03.

Non sono presenti account, backend, sync, CDN, font remoti o tracker. Dexie, validazione, traduzioni e design system saranno introdotti nelle rispettive fasi; PWA, cache offline e aggiornamenti differiti appartengono a **F15**. F00 non registra service worker e non attiva reload forzati. Non dichiarare questa anteprima pronta offline o pronta all'uso.

Decisioni tecniche: [ADR-001](docs/adr/001-bootstrap-toolchain.md). Risultati effettivi: [report F00](docs/reports/F00.md).
