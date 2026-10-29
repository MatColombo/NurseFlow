# NurseFlow

Bootstrap **F00** e persistenza **F01**: React, Vite e TypeScript strict per hosting statico GitHub Pages; dominio, Dexie e comandi atomici separati dalla UI. Questa è un'anteprima tecnica, senza funzionalità cliniche o fixture precaricate. I contratti originali sono in [docs/nurseflow](docs/nurseflow/00_START_HERE.md).

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

Gli smoke test verificano mount, tutte le route hash previste, parametri, reload dei deep link e recupero di route sconosciute. Gli E2E lavorano sull'origine del preview production e verificano anche IndexedDB reale, migrazioni, immutabilità, rollback e reload delle sessioni. Il codice di test storage è compilato in memoria e iniettato esclusivamente da Playwright, senza includerlo nella build applicativa. Il preview viene avviato automaticamente sulla porta `4173`, che deve essere libera. Il report HTML è in `playwright-report/`.

## Persistenza F01

`src/domain/model` contiene schemi Zod e tipi inferiti per procedure, gruppi, revisioni Draft/Ready, DAG, destinazioni, media, impostazioni e sessioni. `src/storage/index.ts` espone la factory di composizione, comandi e repository di sola lettura. I componenti non ricevono Dexie o tabelle. Importare il modulo non apre il DB; la shell F00 non avvia ancora questi servizi.

```ts
import { createNurseFlowStorage } from '@storage/index';

const storage = createNurseFlowStorage(); // NurseFlowDB
await storage.open();
const { procedure, draft } = await storage.commands.createDraft({
  metadata: { title: 'Esempio non clinico' },
});
// draft è incompleta: Start → unassigned; nessuna Ready viene creata.
const persisted = await storage.repositories.revisions.get(draft.id);
storage.close();
```

- `createDraft` aggiunge procedura, Draft e asset preparati atomicamente. Con `{ procedureId }` riapre la Draft esistente o ne crea una indipendente dalla Ready; `updateDraft` salva grafo/asset con controllo `expectedEditVersion`.
- `markReadyUnitOfWork` richiede conferma personale, token aggiornato e un validatore sincrono fornito dal chiamante. Aggiunge sempre una nuova snapshot Ready e aggiorna il puntatore nella stessa transazione; mantiene la Draft indipendente. Non esiste un validatore permissivo predefinito: le regole P/W arrivano in F08.
- `saveRun` controlla appartenenza e riferimenti alla Ready, vieta di cambiare la revisione pinnata e usa `saveVersion`/`expectedSaveVersion` contro salvataggi obsoleti. Per la prima scrittura passare `null` come versione attesa. Il motore e i checkpoint Back sono F09.
- `addImportedRecords` riceve un array di batch interni già decodificati: `{ procedures, groups, revisions, mediaAssets, runSessions }`. Ogni batch ha un namespace sorgente indipendente. Remappa tutte le identità e aggiunge i batch in una sola transazione; richiede il validatore anche per Ready importate, senza nuova conferma personale. Settings non sono accettate da questo comando. Formato file, sicurezza archivi, staging/preview e consenso Settings sono F13/F14.

Il DB ha sette tabelle e versioni append-only: v1 introduce gli store; v2 aggiunge i token mancanti senza cambiare snapshot, asset o preferenze. Ready e Blob non sono sovrascrivibili; F01 non esegue garbage collection. `QuotaExceededError`, `TransactionInactiveError`, conflitti e altri fallimenti propagano al chiamante soltanto dopo rollback; la futura UI deve mostrare successo solo dopo risoluzione del comando. Parsing, UUID e timestamp sono preparati fuori dalle transazioni; nessun file I/O, rete o hashing asincrono al loro interno.

Le fixture non cliniche risiedono soltanto nei test e non vengono inserite in produzione. Dettagli e limiti: [ADR-002](docs/adr/002-domain-storage-transactions.md), [report F01](docs/reports/F01.md).

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

## Moduli e limiti F00/F01

```text
src/app/          routing HashRouter e bootstrap
src/domain/       model e remapping; graph, validation e runtime nelle fasi successive
src/storage/      DB, migrations, repositories, commands
src/features/     first-launch, library, procedures, builder, step-editor,
                  validation, run, map, settings, portability
src/shared/       components, design-tokens, styles, i18n, icons, utils
src/test/         setup, fixtures, helpers
e2e/              journeys, fixtures
tooling/          risoluzione e test della base statica
```

Gli alias `@app/*`, `@domain/*`, `@storage/*`, `@features/*`, `@shared/*`, `@test/*` sono coerenti fra TypeScript e Vite/Vitest. Le cartelle riservate usano `.gitkeep`, senza implementazioni fittizie. ESLint protegge i confini principali: dominio indipendente da React/DOM/DB, storage senza componenti React, UI senza accessi diretti a Dexie.

Solo in sviluppo, le Pagine 00–11B mostrano **`not implemented`**, i parametri dell'hash e un elenco diagnostico di route. Questi componenti sono esclusi dalla build production, che mostra **Anteprima tecnica F00** sulle route riservate. La root apre `#/library` soltanto per lo smoke tecnico; il flusso di primo avvio verrà implementato in F03.

Non sono presenti account, backend, sync, CDN, font remoti o tracker. Dexie e gli schemi dati sono implementati in F01; validator P/W, motore run, traduzioni e design system arrivano nelle rispettive fasi. PWA, cache offline e aggiornamenti differiti appartengono a **F15**. La shell non registra service worker e non attiva reload forzati. Non dichiarare questa anteprima pronta offline o pronta all'uso.

Decisioni tecniche: [ADR-001](docs/adr/001-bootstrap-toolchain.md). Risultati effettivi: [report F00](docs/reports/F00.md).
