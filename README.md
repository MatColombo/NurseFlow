# NurseFlow

Bootstrap **F00**, persistenza **F01**, design system **F02**, First Launch/Library **F03**, Details/New Procedure **F04** e Builder Outline **F05**: React/Vite/TypeScript strict, dominio e Dexie separati dalla UI, tema pronto soccorso light/dark, scala globale e IT/EN. Questa è un'anteprima tecnica: le pagine applicative successive restano incomplete, senza contenuti clinici o fixture precaricati. I contratti originali sono in [docs/nurseflow](docs/nurseflow/00_START_HERE.md).

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

Gli smoke test verificano mount, tutte le route hash previste, parametri, reload e recupero di route sconosciute. Gli E2E production verificano anche IndexedDB reale, migrazioni, immutabilità, rollback, sessioni e preferenze. Il codice di test storage è compilato in memoria e iniettato esclusivamente da Playwright. La matrice UI usa il catalogo dev e gli stessi componenti/CSS dell'app. Playwright avvia automaticamente preview su `4173` e Vite su `4174`: entrambe le porte devono essere libere. Il report HTML è in `playwright-report/`.

Snapshot visivi 13pt: Chromium **Windows**, light/dark e Dialog/Sheet. Su Windows `npm run test:e2e` confronta anche le baseline versionate. Su Linux/macOS eseguire `npm run test:e2e -- --grep-invert '@visual'`; CI separa i test funzionali Linux dal confronto visuale Windows. Per aggiornare intenzionalmente le baseline su Windows: `npm run test:e2e -- --project=chromium --grep '@visual' --update-snapshots`, poi ispezionare i PNG prima del commit. Non generare automaticamente baseline mancanti in CI.

## Persistenza F01

`src/domain/model` contiene schemi Zod e tipi inferiti per procedure, gruppi, revisioni Draft/Ready, DAG, destinazioni, media, impostazioni e sessioni. `src/storage/index.ts` espone la factory di composizione, comandi e repository di sola lettura. I componenti non ricevono Dexie o tabelle. Importare il modulo non apre il DB; da F02 il provider applicativo apre lo storage per leggere e salvare le preferenze, senza inserire procedure.

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

Il DB ha otto tabelle e versioni append-only: v1 introduce gli store; v2 aggiunge i token mancanti; v3 conserva la lingua già scelta e introduce le preferenze F03; v4 aggiunge la cronologia Builder senza cambiare snapshot, run, asset o preferenze esistenti. Ready e Blob non sono sovrascrivibili; non viene eseguita garbage collection. `QuotaExceededError`, `TransactionInactiveError`, conflitti e altri fallimenti propagano al chiamante soltanto dopo rollback; la UI mostra successo solo dopo risoluzione del comando. Parsing, UUID e timestamp sono preparati fuori dalle transazioni; nessun file I/O, rete o hashing asincrono al loro interno.

Le fixture non cliniche risiedono soltanto nei test e non vengono inserite in produzione. Dettagli e limiti: [ADR-002](docs/adr/002-domain-storage-transactions.md), [report F01](docs/reports/F01.md).

## Design system F02

`src/shared/components` esporta Button, Card, Badge, Search, Sheet, Dialog, Icon, List/ListItem, GalleryFrame e ValidationRow. Token colore in `shared/styles/tokens.css`, geometria/tipografia in `shared/design-tokens/scale.ts`. Usare i token anche nelle prossime feature; nessun `transform: scale()` sulla pagina. Button disabilitato richiede `disabledReason`; le icone decorative sono escluse dal nome accessibile. GalleryFrame non carica autonomamente risorse.

`/#/settings` espone solo la sezione Interfaccia di F02: lingua IT/EN, tema System/Light/Dark, scala unica 4–48pt e ripristino 13pt. I selettori usano Sheet con focus trap, Escape e ritorno focus. Cambi immediati, persistenza locale mediante `saveAppearance`; su errore rollback e Retry. Le altre sezioni Page 10 arrivano in F12. I cataloghi i18next sono nel bundle, senza richieste HTTP o traduzione automatica dei contenuti authored.

Solo con `npm run dev`, `/#/dev/components` mostra i componenti con fixture neutre per ispezione e test; non modifica la libreria. Gli snapshot sono in `e2e/journeys/components.visual.spec.ts-snapshots/`. I test coprono 320/390/768px × 4/13/30/48pt, offset, icone, target, overflow, contrasti, etichette, focus e preferenze dopo reload. [ADR-003](docs/adr/003-ui-theme-scale-i18n.md) e [report F02](docs/reports/F02.md) documentano scelte, prove e limiti.

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

- `ci.yml`: controlli su pull request e avvio manuale; riusabile da altri workflow. Esegue `npm ci`, lint, typecheck, unit test, build ed E2E sui tre browser Linux sotto la base repository; un job Windows/Chromium confronta gli snapshot visivi.
- `deploy.yml`: su push a `main` richiama CI; solo dopo tutti i controlli pubblica lo stesso artefatto verificato nell'ambiente `github-pages`. Avvio manuale disponibile, deploy limitato a `main`.

I workflow sono predisposti; una verifica GitHub Actions/Pages reale richiede un remote e il primo push. L'esito locale non costituisce un deploy già effettuato.

## First Launch e Library F03

La root apre `#/setup` solo prima del completamento del primo avvio; lingua IT/EN, Start e collegamento alla futura 11B. Start salva il completamento e richiede persistenza senza attendere il permesso. Lo stato effettivo si consulta in Settings, con Retry e senza garanzia di conservazione.

`#/library` legge procedure e gruppi da IndexedDB: gruppi collassabili, creazione/rinomina/ordine/eliminazione conservativa, ribbon allowlist, tag, alias ricercabili, preferiti, priorità 0/!/!! e viste Gruppi/Priorità/Recenti/A–Z. Ricerca locale normalizzata su titolo/gruppo/tag/alias/descrizione e opzionalmente passaggi; facet multiple con OR interno e AND fra facet. Filtri e ricerca producono risultati piatti e rimuovono Recent. Testo, filtri, ordinamento, collapse e posizione sono conservati al ritorno da Details.

Recent mostra tre scorciatoie su una riga, solo identità e titolo; massimo 20% dell'area post-toolbar, Library almeno 80%. Overflow `···` fino a venti, cronologico, sheet mobile/popover desktop. La recenza cambia solo aprendo una procedura, mai con star, filtri o autosave. Le fixture non cliniche sono caricate esclusivamente dai test in IndexedDB reale. La libreria iniziale è vuota.

Dettagli tecnici: [ADR-004](docs/adr/004-first-launch-library.md). Comandi, esiti, screenshot e limiti: [report F03](docs/reports/F03.md). Le prove offline di fase coprono la shell già caricata; cache PWA e riavvio completamente offline restano F15.

## Details e nuova procedura F04

`/#/procedure/:id` legge metadati e revisioni reali. Draft-only: Modifica grafo, Anteprima bozza, Mappa; Ready-only: Avvia, Mappa e copia di lavoro per Modifica; Ready+Draft: Avvia Ready, Mappa Ready e Continua modifica della Draft. Aprire l'editor di una Ready-only non crea una Draft prima del primo cambiamento del grafo. I destinatari ricevono e verificano l'ID della revisione. Avvia/Riprendi salva o riusa una sessione iniziale pinned; il motore di avanzamento e la schermata guidata completa restano F09/F10.

Il menu More offre modifica metadati con autosave, duplicazione come Draft indipendente, collegamento export alla futura 11A, archiviazione e cancellazione confermata. Le sessioni salvate impediscono la cancellazione; Ready e Blob restano protetti dalle scritture ordinarie. L'elenco Archiviate nel menu Library permette di riaprire e ripristinare le procedure. Esporta non produce ancora file: formato e download sono F13.

`/#/new` richiede soltanto il nome (massimo 120 caratteri), con gruppo singolo e tag; Altri dettagli apre ribbon, priorità, alias e descrizione. Il picker permette di creare un gruppo senza perdere il form. Crea bozza salva metadati, Draft e un solo Start editoriale in transazione, poi apre Builder. Nessun passaggio clinico o Ready precompilato. Back conferma lo scarto degli input; gli errori di salvataggio mantengono i valori e offrono Retry. La lingua UI non traduce il contenuto authored.

La fase F04 conserva lo schema DB v3 e non aggiunge dipendenze. [ADR-005](docs/adr/005-procedure-details-and-creation.md) e [report F04](docs/reports/F04.md) descrivono transazioni, prove e limiti. Per una verifica locale con browser seriali: `npm run test:e2e -- --workers=1`.

## Builder Outline F05

`/#/build/:id` modifica il DAG reale della Draft. Le azioni contestuali creano/collegano passi vuoti, modificano un singolo edge e gestiscono esiti, attività e fasi. Decision e Multitask partono con due slot vuoti; il limite superiore è 32, mentre la Draft può restare incompleta. End espliciti in quattro tipi; nelle attività, Finish e Stop dell'intera procedura sono azioni distinte, con consenso per Stop Stopped/Escalation. Nessun Join visibile, ciclo o cross-arm accettato.

Undo/Redo nella toolbar conserva 30 transazioni in IndexedDB, anche dopo reload. Copy usa nuove identità e mantiene i riferimenti ai media; Cut resta pending fino a Paste confermato, con move atomico e preview Prima/Dopo. Nodi condivisi canonici, W08 dopo cancellazione, orfani conservati e ripristinabili con Undo. Il primo cambiamento reale di una Ready-only crea Draft e storia nella stessa transazione, senza modificare Ready o run. Scroll e selezione persistono senza aggiornare la recenza.

Graph/auto-layout arrivano in F06. La creazione apre la vera route Page 08 dopo il salvataggio; l'editor dei contenuti è F07. Preview/Check ricevono la revisione salvata, ma renderer e validazione completi restano nelle fasi successive. [ADR-006](docs/adr/006-builder-outline-and-history.md) e [report F05](docs/reports/F05.md) documentano implementazione, prove e limiti.

## Moduli e limiti F00–F05

```text
src/app/          HashRouter, provider appearance/i18n, error boundaries
src/domain/       model, remapping e builder; validation e runtime nelle fasi successive
src/storage/      DB, migrations, repositories, commands
src/features/     first-launch, library, procedures, builder, step-editor,
                  validation, run, map, settings, portability
src/shared/       components, design-tokens, styles, i18n, icons, utils
src/test/         setup, fixtures, helpers
e2e/              journeys, fixtures
tooling/          risoluzione e test della base statica
```

Gli alias `@app/*`, `@domain/*`, `@storage/*`, `@features/*`, `@shared/*`, `@test/*` sono coerenti fra TypeScript e Vite/Vitest. Le cartelle riservate usano `.gitkeep`, senza implementazioni fittizie. ESLint protegge i confini principali: dominio indipendente da React/DOM/DB, storage senza componenti React, UI senza accessi diretti a Dexie.

Le Pages 00/01/02/06 e l'Outline della 07 sono implementati. Run, Map e le pagine successive mostrano ancora un avviso esplicito di funzionalità non implementata, con contesto reale di procedura/revisione agli ingressi già collegati; Settings espone Interfaccia, persistenza e due collegamenti dati. In sviluppo sono disponibili parametri hash e catalogo componenti, esclusi dalla build production. Nessuna bottom navigation globale.

Non sono presenti account, backend, sync, CDN, font remoti o tracker. Validator P/W e motore run arrivano nelle rispettive fasi. PWA, cache offline e aggiornamenti differiti appartengono a **F15**. La shell non registra service worker e non attiva reload forzati. Non dichiarare questa anteprima pronta offline dopo riavvio o pronta all'uso.

Decisioni tecniche: [ADR-001](docs/adr/001-bootstrap-toolchain.md). Risultati effettivi: [report F00](docs/reports/F00.md).
