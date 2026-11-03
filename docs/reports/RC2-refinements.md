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

## Verifiche

| Controllo locale | Esito |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS: 444 test, 57 file |
| Build production avviata dalla configurazione Playwright | PASS, CSP e precache attive |
| E2E mirati Chromium/Firefox/WebKit | PASS: 21/21, zero retry |
| Matrice visuale, CI completa e deploy | In corso: esito da registrare separatamente |

Gli E2E mirati coprono sette casi nei tre browser: AND/Stop autorizzato,
ritorno Details/Library, ricerca nei passi, nuovo collettore/follow-up,
ancore/frecce, note/movimento ridotto e ritorno Settings/Library.
Screenshot ispezionato: [AND con follow-up e collettore esterno](assets/RC2/and-horizontal.png).

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
