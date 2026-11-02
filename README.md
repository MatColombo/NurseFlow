# NurseFlow

Bootstrap **F00**, persistenza **F01**, design system **F02**, First Launch/Library **F03**, Details/New Procedure **F04**, Builder Outline **F05**, Graph **F06**, Step Editor/media **F07**, Check/Ready **F08**, motore pinned **F09**, Guided Run/End **F10**, Map/List **F11** e Settings **F12**: React/Vite/TypeScript strict, dominio e Dexie separati dalla UI, tema pronto soccorso light/dark, scala globale e IT/EN. Le fasi successive restano incomplete, senza contenuti clinici o fixture precaricati. I contratti originali sono in [docs/nurseflow](docs/nurseflow/00_START_HERE.md).

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
- Page 09 usa `checkDraft`/`markCheckedReady`: validatore P/W concreto, lettura durabile, token anti-stale, nuova snapshot e puntatore Ready nella stessa transazione. `markReadyUnitOfWork` resta l'API interna con validatore sincrono esplicito del nucleo F01; nessun validatore permissivo predefinito.
- F09: `startOrResumeReady`, `resumeRunSession` e `transitionRun` usano il reducer puro OR/AND e la Ready pinnata. Ogni evento riceve la `saveVersion` visualizzata; conflitti e quota non avanzano la run. `finishRun` elimina soltanto la sessione sul suo End authored. `saveRun` resta l'API interna di staging con controllo identità/versione e invarianti del percorso.
- `addImportedRecords` riceve un array di batch interni già decodificati: `{ procedures, groups, revisions, mediaAssets, runSessions }`. Ogni batch ha un namespace sorgente indipendente. Remappa tutte le identità e aggiunge i batch in una sola transazione; richiede il validatore anche per Ready importate, senza nuova conferma personale. Settings non sono accettate da questo comando. Formato file, sicurezza archivi, staging/preview e consenso Settings sono F13/F14.

Il DB ha nove tabelle e versioni append-only: v1 introduce gli store; v2 aggiunge i token mancanti; v3 conserva la lingua già scelta e introduce le preferenze F03; v4 aggiunge la cronologia Builder; v5 aggiunge le sessioni Draft Preview indipendenti, senza cambiare snapshot, run, asset o preferenze esistenti. Ready e Blob non sono sovrascrivibili; non viene eseguita garbage collection. `QuotaExceededError`, `TransactionInactiveError`, conflitti e altri fallimenti propagano al chiamante soltanto dopo rollback; la UI mostra successo solo dopo risoluzione del comando. UUID e timestamp sono preparati fuori dalle transazioni; nessun file I/O, rete o hashing asincrono al loro interno.

Le fixture non cliniche risiedono soltanto nei test e non vengono inserite in produzione. Dettagli e limiti: [ADR-002](docs/adr/002-domain-storage-transactions.md), [report F01](docs/reports/F01.md).

## Design system F02

`src/shared/components` esporta Button, Card, Badge, Search, Sheet, Dialog, Icon, List/ListItem, GalleryFrame e ValidationRow. Token colore in `shared/styles/tokens.css`, geometria/tipografia in `shared/design-tokens/scale.ts`. Usare i token anche nelle prossime feature; nessun `transform: scale()` sulla pagina. Button disabilitato richiede `disabledReason`; le icone decorative sono escluse dal nome accessibile. GalleryFrame non carica autonomamente risorse.

`/#/settings` riusa Interfaccia di F02: lingua IT/EN, tema System/Light/Dark, scala unica 4–48pt e ripristino 13pt. I selettori usano Sheet con focus trap, Escape e ritorno focus. Cambi immediati, persistenza locale mediante `saveAppearance`; su errore rollback e Retry. F12 completa Page 10 con media, dati locali e controlli applicativi descritti sotto. I cataloghi i18next sono nel bundle, senza richieste HTTP o traduzione automatica dei contenuti authored.

Solo con `npm run dev`, `/#/dev/components` mostra i componenti con fixture neutre per ispezione e test; non modifica la libreria. Gli snapshot sono in `e2e/journeys/components.visual.spec.ts-snapshots/`. I test coprono 320/390/768px × 4/13/30/48pt, offset, icone, target, overflow, contrasti, etichette, focus e preferenze dopo reload. [ADR-003](docs/adr/003-ui-theme-scale-i18n.md) e [report F02](docs/reports/F02.md) documentano scelte, prove e limiti.

## Settings F12

Page 10 completa preferenze Interfaccia e Immagini con soft limit On 1..32/default 2 e Off che conserva il massimo; compressione Small/Medium/High/Original per importazioni locali successive. Le modifiche non cambiano contenuti authored, Blob già presenti, Ready o sessioni pinnate. Ogni preferenza autosalva indipendentemente e offre Retry su errore.

I due ingressi `Procedure e libreria` e `Backup app e impostazioni` aprono rispettivamente le route 11A e 11B, con ritorno a Settings. I relativi formati e download rimangono F13/F14. Protezione archivio usa lo stato effettivo del browser e permette una richiesta esplicita; uso e quota sono stime dell'origine, non una promessa di conservazione.

Verifica aggiornamenti usa un eventuale worker registrato per lo scope dell'app, solo online e su richiesta. `Aggiorna quando inattiva` attende run/sessioni salvate, editor e salvataggi; un evento controllerchange da solo non forza reload. Install compare solo quando il browser espone il prompt; About è su richiesta. Registrazione del worker, manifest e cache offline restano F15.

Advanced è inizialmente collassata. Reset vista preserva contenuto e record recenti. Clear offre export prima, due cautele e checkbox finale; verifica che il riepilogo sia ancora attuale e cancella/reinizializza in una transazione con rollback. Torna a First Launch solo dopo commit. [ADR-013](docs/adr/013-settings-and-local-data-controls.md) e [report F12](docs/reports/F12.md) documentano verifiche, matrice e limiti.

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

`/#/procedure/:id` legge metadati e revisioni reali. Draft-only: Modifica grafo, Anteprima bozza, Mappa; Ready-only: Avvia, Mappa e copia di lavoro per Modifica; Ready+Draft: Avvia Ready, Mappa Ready e Continua modifica della Draft. Aprire l'editor di una Ready-only non crea una Draft prima del primo cambiamento del grafo. I destinatari ricevono e verificano l'ID della revisione. Avvia/Riprendi salva o riusa una sessione pinned e apre Guided Run F10, anche quando la sessione è già sul suo End.

Il menu More offre modifica metadati con autosave, duplicazione come Draft indipendente, collegamento export alla futura 11A, archiviazione e cancellazione confermata. Le sessioni salvate impediscono la cancellazione; Ready e Blob restano protetti dalle scritture ordinarie. L'elenco Archiviate nel menu Library permette di riaprire e ripristinare le procedure. Esporta non produce ancora file: formato e download sono F13.

`/#/new` richiede soltanto il nome (massimo 120 caratteri), con gruppo singolo e tag; Altri dettagli apre ribbon, priorità, alias e descrizione. Il picker permette di creare un gruppo senza perdere il form. Crea bozza salva metadati, Draft e un solo Start editoriale in transazione, poi apre Builder. Nessun passaggio clinico o Ready precompilato. Back conferma lo scarto degli input; gli errori di salvataggio mantengono i valori e offrono Retry. La lingua UI non traduce il contenuto authored.

La fase F04 conserva lo schema DB v3 e non aggiunge dipendenze. [ADR-005](docs/adr/005-procedure-details-and-creation.md) e [report F04](docs/reports/F04.md) descrivono transazioni, prove e limiti. Per una verifica locale con browser seriali: `npm run test:e2e -- --workers=1`.

## Builder Outline F05

`/#/build/:id` modifica il DAG reale della Draft. Le azioni contestuali creano/collegano passi vuoti, modificano un singolo edge e gestiscono esiti, attività e fasi. Decision e Multitask partono con due slot vuoti; il limite superiore è 32, mentre la Draft può restare incompleta. End espliciti in quattro tipi; nelle attività, Finish e Stop dell'intera procedura sono azioni distinte, con consenso per Stop Stopped/Escalation. Nessun Join visibile, ciclo o cross-arm accettato.

Undo/Redo nella toolbar conserva 30 transazioni in IndexedDB, anche dopo reload. Copy usa nuove identità e mantiene i riferimenti ai media; Cut resta pending fino a Paste confermato, con move atomico e preview Prima/Dopo. Nodi condivisi canonici, W08 dopo cancellazione, orfani conservati e ripristinabili con Undo. Il primo cambiamento reale di una Ready-only crea Draft e storia nella stessa transazione, senza modificare Ready o run. Scroll e selezione persistono senza aggiornare la recenza.

La creazione di un passo di contenuto apre Page 08 dopo il salvataggio; Start/Multitask restano strutturali nel Builder. Preview/Check del Builder ricevono la revisione salvata; consultazione e validazione complete restano nelle fasi successive. [ADR-006](docs/adr/006-builder-outline-and-history.md) e [report F05](docs/reports/F05.md) documentano implementazione, prove e limiti.

## Builder Graph F06

Il selettore Outline/Graph usa un unico DAG e ricorda l'ultima modalità sul dispositivo. Graph offre pan sullo sfondo, pinch, zoom con pulsanti, Fit, centro della selezione e ricerca per focalizzare. Camera, selezione, focus e scroll Outline persistono senza modificare Ready o cronologia. Undo/Redo, Cut/Copy/Paste e sheet contestuali sono condivisi fra le due viste. Da F08 il codice di Graph/Step Editor/Check viene caricato insieme alla shell per permettere Fix/Inspect senza rete dopo il caricamento dell'app.

Cambiare un collegamento avvia un picker: la ricerca focalizza il passo; il tap propone soltanto l'edge scelto e apre la preview Prima/Dopo. Apply salva atomicamente. Si può selezionare il target anche in Outline; nessun collegamento richiede di trascinare linee. Cicli/cross-arm sono bloccati. Le convergenze mostrano un solo nodo con frecce distinte; cancellare il nodo produce W08, senza frecce sane o falsi `+`.

Fino a tre attività AND sono in focus, con Browse ricercabile fino a 32; gli OR numerosi usano una lista equivalente senza ridurre i caratteri. I completamenti raggiungono direttamente la continuazione senza gate o merge visibili. Auto layout modifica solo le posizioni nel medesimo DAG ed è reversibile. [ADR-007](docs/adr/007-builder-graph-projection.md) e [report F06](docs/reports/F06.md) riportano scelte, test, screenshot e limiti.

## Step Editor e media F07

`/#/build/:id/step/:nodeId` è la Page 08 full-page reale per Instruction, Alert, Decision ed End: contenuti authored, fase o nessuna fase, nota facoltativa, preview live e Fine che attende le scritture e torna al Builder. Nessun Save duplicato. Autosave con debounce, transazioni e Undo/Redo condivisi con il Builder; Ready e run pinnate rimangono indipendenti. Errori e quota mantengono gli input e offrono Retry senza falsa conferma.

Outcome Editor contiene soltanto risposta, nota, percorso di sola lettura e Cambia percorso. Il picker Graph F06 cambia un singolo edge con preview d'impatto e torna allo stesso outcome; la modalità temporanea conserva camera, scroll e preferenze del Builder. Riordina risposte è separato e modifica solo l'ordine UI. Preview usa il renderer `StepContent` destinato anche alla futura Page 03, con disclosure/zoom disponibili e azioni Run inerti.

Le gallerie prima/dopo nota hanno ordine, layout e spazio immagine indipendenti, caption/alt e spostamento fra slot. JPEG/PNG/WebP locali vengono verificati, preparati e mostrati con byte/dimensioni effettivi prima dell'inserimento. I Blob sono separati e immutabili in IndexedDB; ricomprimere o sostituire crea un nuovo asset conservando il precedente per Undo/Ready. Compressione predefinita e soft limit globale 2 riguardano le aggiunte future; gli elementi esistenti restano modificabili oltre il limite ridotto, fino al massimo di schema di 32 complessivi. End non contiene media.

URL HTTPS/GIF sono facoltativi, con controllo URL/MIME/firma raster e placeholder quando indisponibili. I collegamenti possono contattare il sito esterno e non sono garantiti offline. Un asset locale mancante mostra W07 e non blocca il salvataggio della Draft. Gli object URL vengono revocati; testi e didascalie non vengono interpretati come HTML. Il round-trip media di F07 verifica metadati/byte attraverso il repository reale di import additivo; file/archivi e interfacce 11A/11B restano F13/F14. [ADR-008](docs/adr/008-step-editor-and-local-media.md) e [report F07](docs/reports/F07.md).

## Check e Ready F08

`/#/build/:id/check` controlla l'ultima Draft durabile offline con P01–P12 e W01–W08: Problems sopra Warnings, ID issue stabili, Fix/Inspect mirati a Page 07/08, ricontrollo, contesto di ritorno e Preview Draft indipendente dalle run Ready. I collegamenti storici interrotti sono W08; quelli mai assegnati restano P02/P04. Blob mancanti/illeggibili sono W07, mentre media fuori schema sono P12. I remoti sono segnalati come dipendenti dalla rete e non verificati ora, senza fetch nel controllo.

Ready richiede zero Problems e conferma personale con checkbox. Il commit rilegge e rivalida la Draft esatta, rifiuta risultati stale e inserisce nuova Ready/puntatore nella stessa transazione IndexedDB. Vecchie Ready, Draft e sessioni pinnate restano indipendenti. Warning consentiti; W08 comunica che un percorso può interrompersi, anche nella conferma. Quota/abort mantengono i dati e offrono Retry senza falso successo. Il controllo riguarda solo la struttura, non la correttezza clinica. [ADR-009](docs/adr/009-offline-validation-and-ready.md) e [report F08](docs/reports/F08.md).

## Runtime F09 e Guided Run/End F10

`/#/run/:id` mostra un solo passo della Ready pinnata, con fase, posizione n/N o n/min–max, previous cue, note/alert e gallerie F07. Le scelte OR sono esplicite; ogni attività AND conserva cursore e completamento indipendenti. Cambia attività non completa il lavoro; Riapri una Done richiede conferma. Il motore distingue Finish activity, End globale e interruzione W08, senza Join visibili. Ogni transizione attende il commit prima di cambiare la scheda; quota e conflitti conservano il contesto e richiedono Retry o rilettura.

Page 04 usa il testo completo dell'autore e i quattro tipi End, con Back, Map, Restart confermato e ritorno Library che elimina solo la sessione corrente. Exit è sempre confermato e Back di sistema segue il percorso reale. Draft Preview è esplicita e persistente in uno store separato, senza creare Ready; la sua snapshot non cambia quando si modifica la working Draft. I percorsi incompleti si bloccano con totale `?` e ritorno al Builder. Map F11 mantiene il contesto pinned senza eseguire transizioni. [ADR-010](docs/adr/010-pinned-runtime.md), [ADR-011](docs/adr/011-guided-run-end.md), [report F09](docs/reports/F09.md), [report F10](docs/reports/F10.md).

## Map e List F11

Page 05 legge la revisione scelta dai Details o la snapshot pinnata della Run/Preview, anche dopo una nuova pubblicazione Ready. Graph offre pan, pinch, zoom, Fit e Current; List usa ordine topologico, disclosure delle relazioni e riferimenti a nodi condivisi rappresentati una sola volta. Inspector con testo authored, fase, End type, gallerie e note indipendenti; nessun comando per avanzare, scegliere rami o modificare il grafo. AND mostra stati e conteggi dei token salvati, senza gate visibili.

Il percorso evidenziato esclude il futuro oltre il cursore e i rami abbandonati. Draft incomplete restano consultabili con collegamenti mancanti espliciti. Back ripristina contesto, scroll e focus senza aggiornare recenti o sessioni. Geometria e camera restano transitorie; nessuna migrazione DB. List resta disponibile se fallisce il renderer grafico lazy. [ADR-012](docs/adr/012-read-only-map-list.md), [report F11](docs/reports/F11.md).

## Moduli e limiti F00–F11

```text
src/app/          HashRouter, provider appearance/i18n, error boundaries
src/domain/       model, remapping, builder, validation e runtime puro
src/storage/      DB, migrations, repositories, commands
src/features/     first-launch, library, procedures, builder, step-editor,
                  check, run, map, settings, portability
src/shared/       components, design-tokens, styles, i18n, icons, utils
src/test/         setup, fixtures, helpers
e2e/              journeys, fixtures
tooling/          risoluzione e test della base statica
```

Gli alias `@app/*`, `@domain/*`, `@storage/*`, `@features/*`, `@shared/*`, `@test/*` sono coerenti fra TypeScript e Vite/Vitest. Le cartelle riservate usano `.gitkeep`, senza implementazioni fittizie. ESLint protegge i confini principali: dominio indipendente da React/DOM/DB, storage senza componenti React, UI senza accessi diretti a Dexie.

Le Pages 00/01/02/03/04/05/06, le viste Outline/Graph della 07, l'editor contenuti/media della 08 e Check/Ready della 09 sono implementati. Le pagine successive restano incomplete; Settings espone Interfaccia, Immagini, persistenza e due collegamenti dati. In sviluppo sono disponibili parametri hash e catalogo componenti, esclusi dalla build production. Nessuna bottom navigation globale.

Non sono presenti account, backend, sync, CDN, font remoti o tracker. PWA, cache offline e aggiornamenti differiti appartengono a **F15**. La shell non registra service worker e non attiva reload forzati. Non dichiarare questa anteprima pronta offline dopo riavvio o pronta all'uso.

Decisioni tecniche: [ADR-001](docs/adr/001-bootstrap-toolchain.md). Risultati effettivi: [report F00](docs/reports/F00.md).
