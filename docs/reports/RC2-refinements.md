# Graph, multitasking e lettura — rc.2

Richiesta utente successiva a F16, 3 novembre 2026. Le cinque correzioni
sono formalizzate nell'[addendum approvato](../adr/019-graph-and-reading-refinement.md).
Questo report riguarda il delta rc.2, non sostituisce l'audit F16.

## Comportamenti

1. Builder e Map usano colonne da sinistra a destra, uscite a destra,
   ingressi a sinistra e tangenti orizzontali. Geometria condivisa,
   destinazioni condivise uniche, nessun Join e nessuna scrittura nel viewer.
   Le attività mantengono la propria corsia anche quando i rami hanno
   lunghezze diverse; la convergenza avviene nello spazio prima del
   successore, evitando linee coperte dai follow-up di altre attività.
2. Nuovi rami AND di istruzioni/avvisi terminano sul successore comune
   esterno. Creare un passo nel ramo lo rende già terminabile; inserire
   follow-up conserva la continuazione. Impostare il collettore chiude
   anche i terminali semplici ancora unassigned nello stesso comando
   annullabile. Il picker accetta il collettore come completamento,
   non come salto diretto che escluda le altre attività. Corretto anche
   il ritorno dal picker quando il collegamento equivale a quello esistente.
3. Transizioni brevi per route, contenuto del passo, dialog e sheet;
   scroll fluido fuori dal grafo. Movimento ridotto elimina animazioni e
   scroll fluido; ripristini di scroll sempre immediati. Nessun remount
   artificiale delle route e nessun ritardo introdotto nelle transazioni.
4. Note aperte all'ingresso del passo, toggle compatto se espandibili;
   nuove note di passo sempre visibili come impostazione iniziale.
   Testo principale e nota della stessa misura, didascalie in corsivo
   meno rilevanti e numerazione continua `fig.1 - …` tra le due gallerie.
   Testi/caption originali, alt e Blob non vengono modificati.
5. Libreria con accenti turchesi, icona ospedaliera SVG locale allowlisted,
   maggiore distinzione tra filtro selezionato, gruppi e procedure.
   Nessun dato clinico precaricato né claim istituzionale.

## Compatibilità

Nessuna migrazione: IndexedDB v5, graph schema 1, formato portabile 1.
Ready e sessioni pinnate non vengono riscritte. Decision/AND annidati
precedenti restano leggibili, importabili e utilizzabili nel runtime;
il nuovo authoring nei rami propone istruzioni/avvisi. Lo Stop intero
resta un'eccezione esplicita Stopped/Escalation confermata.

I vecchi layout vengono conservati nei dati; la nuova proiezione
automatica orizzontale governa la visualizzazione. W08 non viene riparato
implicitamente. Eliminare il collettore interrompe il percorso dopo il
completamento delle attività; non produce un falso End. Gli orfani
restano recuperabili e possono richiedere una scelta esplicita nel Check.

Il [confronto degli alberi Git](assets/RC2/compatibility.json) con il tag
rc.1 conferma che storage, schema di dominio, motore runtime, contratti
originali e dipendenze sono invariati. La nuova semantica editoriale è
nei comandi Builder; la persistenza e il runtime usano gli stessi moduli.

## Verifiche

| Controllo locale | Esito |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS: 444 test, 57 file |
| Build production avviata dalla configurazione Playwright | PASS, CSP e precache attive |
| E2E mirati Chromium/Firefox/WebKit | PASS: 21/21, zero retry |
| Matrice visuale 320/390/768px × 4/13/30/48pt | PASS: 120/120 combinazioni, zero retry |
| Snapshot componenti light/dark, Dialog/Sheet | PASS: 1 test, 4 snapshot; nessun baseline modificato |
| Editor/media nei tre browser desktop su Windows | PASS: 69/69, zero retry |
| Regressioni focus Outline e font alternativi, tre browser | PASS: 9/9, zero retry |
| CI completa Linux, revisione finale | PASS: 801 E2E, 3 skip condizionali, zero failure e zero flaky |
| Snapshot Windows sulla revisione finale | PASS |
| Deploy Pages | PASS, job `125903707097` |
| Smoke indipendente HTTPS/CSP/manifest/icone/cache/hash/offline | PASS sull'URL pubblico, profilo nuovo |
| Versione pubblicata | PASS: `0.1.0-rc.2`, HTTP 200, zero page error |
| Full download → import in nuovo profilo → offline Resume | PASS: 1/1, zero retry |

Gli E2E mirati coprono sette casi nei tre browser: AND/Stop autorizzato,
ritorno Details/Library, ricerca nei passi, nuovo collettore/follow-up,
ancore/frecce, note/movimento ridotto e ritorno Settings/Library.
Screenshot ispezionato: [AND con follow-up e collettore esterno](assets/RC2/and-horizontal.png).
Altri screenshot ispezionati a 320px/13pt in dark:
[Library](assets/RC2/library-320-13-dark.png),
[Run con nota visibile](assets/RC2/run-320-13-dark.png),
[Preview con foto locali e didascalie](assets/RC2/media-320-13-dark.png).
Inventari macchina: [21 E2E mirati](assets/RC2/critical.json),
[120 combinazioni + snapshot](assets/RC2/matrix.json).
[69 regressioni editor/media](assets/RC2/editor.json).

La matrice comprende 96 combinazioni per le otto viste richieste in F16
(Library, Run, Builder, Step Editor, Check, Settings, 11A e 11B), più 24
per Details e Map. Temi light/dark alternati tra i casi; non si dichiara
una matrice raddoppiata di 240 combinazioni.

Prima revisione inviata alla CI: `5e23afd58dad2ff44a6eb44423ebfb73b816b008`.
[Prima pipeline](https://github.com/MatColombo/NurseFlow/actions/runs/41623183622):
791 PASS, 1 FAIL, 3 skip condizionali; deploy non eseguito. Il FAIL
Linux era `Library 320px 48pt`: il pulsante del titolo gruppo aveva
86px di contenuto in 81px. Riprodotto anche su Windows con Georgia;
corretto consentendo il reflow dell'intestazione gruppo, senza ridurre
font, icone, target o la severità delle asserzioni.
[Evidenza del primo FAIL](assets/RC2/ci-initial.json).

Una prova aggiuntiva ha individuato l'annullamento del salto Outline da
due chiamate di scroll consecutive con `scroll-behavior: smooth`. Ora
il salto calcola la destinazione in un'unica chiamata, tenendo conto
della toolbar. Il test 320px a 4/48pt verifica focus, area interattiva
visibile di almeno 44px sotto la toolbar, apertura da tastiera e grafo
immutato. Un titolo molto grande può richiedere scroll verticale:
non viene compresso per far entrare tutta la card nello stesso frame.
[Misura reale dopo il salto a 48pt](assets/RC2/outline-focus.json).
[9 regressioni nei tre browser](assets/RC2/focus-and-font.json).

Correzione finale: `d10c9937ebd4c7002c4ff128e11f4d471d9dfcf1`.
[Nuova pipeline completa](https://github.com/MatColombo/NurseFlow/actions/runs/41629065990).
Il [report macchina della CI finale](assets/RC2/ci-final.json), scaricato
dall'artifact con SHA-256 verificata, conta 804 casi pianificati: 801 PASS,
3 skip, 0 failure, 0 flaky. Tutti i 120 casi di matrice passano, compreso
il precedente FAIL Library 320px/48pt. Sono inclusi i nuovi test sul focus
Outline e sui font alternativi nei tre browser.

I tre skip riguardano soltanto la prova di errore nativo Cache API:
Chromium/Firefox non sono il target di quella limitazione; sul WebKit
Linux la sonda conferma che Cache API funziona. Non sono conteggiati come
test eseguiti con PASS. Le prove offline ordinarie sono eseguite.

## Verifica della pubblicazione

URL reale: [NurseFlow su Pages](https://matcolombo.github.io/NurseFlow/).
La sonda indipendente ha verificato HTTP 200, CSP, manifest e icone sotto
`/NurseFlow/`, cache controllata dal service worker e ricaricamento offline
di una hash route. Un secondo profilo nuovo ha letto la versione rc.2
direttamente da Settings/About senza page error:
[risultato](assets/RC2/pages-version.json),
[screenshot](assets/RC2/pages-rc2.png).

Eseguito nuovamente `playwright.pages.config.ts` sul sito pubblico:
download reale Full, import tramite UI in un altro profilo vuoto,
ricarica e Resume offline di sessioni OR/AND/W08 con media locali,
Ready importate utilizzabili senza Check e revisione storica pinnata
distinta dalla Ready corrente. Esito 1 PASS, 0 failure, 0 retry:
[evidenza](assets/RC2/pages-roundtrip.json).

La chiusura del report modifica soltanto documentazione/evidenze; il codice
pubblicato e verificato resta quello di `d10c993`. Tag di riferimento:
[`v0.1.0-rc.2`](https://github.com/MatColombo/NurseFlow/tree/v0.1.0-rc.2).
Resta valido il [piano backup e recupero](../backup-and-recovery.md).

Nuovi test: geometria/ancore/tangenti a 320/390/768px × 4/13/30/48pt;
2/3/32 attività con follow-up, completamenti indipendenti, reload,
successore unico e W08; compatibilità dei grafi legacy; note visibili,
ordine delle figure, toggle e rendering non eseguibile; E2E con
persistenza, Undo/Redo, Ready invariata e movimento ridotto.

Sono stati aggiornati i test di scroll che impostavano una posizione
e la leggevano nello stesso istante: la preparazione del test usa ora
`behavior: instant` per stabilire la posizione iniziale, mentre le
asserzioni su posizione ripristinata e contenuto del database restano.
Il vecchio test che richiedeva il collettore disabilitato nel picker ora
verifica la nuova regola approvata e l'assenza di modifiche spurie.

Dispositivi iOS/Android fisici e screen reader reali: **NON ESEGUITI**.
I test desktop Chromium/Firefox/WebKit non sostituiscono queste prove.
Restano le limitazioni e i gate manuali documentati in F16.
