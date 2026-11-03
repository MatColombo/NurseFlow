# Correzioni grafo, attività, immagini e testo

Data: 3 novembre 2026. Ambito: dodici richieste utente successive alla rc.2,
formalizzate nell'[addendum 020](../adr/020-graph-authoring-and-text.md).

## Implementazione

1. Frecce: tratto rettilineo prima della testa, tangente orizzontale anche
   per passi disassati, marker con colore esplicito e dimensione stabile.
   Rimosso il rettangolo di focus nativo SVG che appariva al click.
2. Telefoni: font dei campi almeno 16 CSS px per evitare l'ingrandimento
   automatico al focus. Nessuna restrizione allo zoom manuale del browser.
   Lo slider globale continua a governare il resto della UI.
3. Colori: consultazione blu, azioni turchesi, anteprima viola; palette
   light/dark esistente. Avviso ambra, Decision blu, Multitask viola,
   Instruction turchese. Etichette sempre presenti e controlli disabilitati
   neutri, senza essere ricolorati come azioni disponibili.
4. Attività: nome e primo passo Instruction/Alert creati insieme con un
   comando atomico. Si apre subito l'editor del contenuto. Le attività
   vuote già presenti usano lo stesso modulo; annullare non aggiunge dati.
   Restano obbligatorie tutte le attività, con `activity-complete` e
   `afterAll`; lo Stop intero resta esplicito e confermato.
5. Le regioni AND riservano anche lo spazio vuoto tra rami disuguali:
   i nodi estranei vengono collocati fuori dal rettangolo.
6. Click o Invio/Spazio su una freccia evidenziano arco, sorgente e
   destinazione e attenuano il resto, in Builder e Map. Secondo click,
   altro punto del grafo o Escape sul canvas deselezionano. Nessuno sheet
   si apre selezionando un arco; i comandi sono ancora sulle uscite.
7. Nuovi layout immagini: massimo 2 o massimo 4 per riga, compatti e
   adattivi alla larghezza; le sezioni prima/dopo note restano separate.
8. Istruzioni/avvisi e note: selezione del testo e pulsanti grassetto,
   corsivo, sottolineato e colore della palette, con anteprima immediata.
   Senza selezione si formatta l'intero campo. Le note, comprese quelle
   delle risposte, supportano un elenco puntato con una voce per riga.
9. Didascalie centrate sulla stessa mezzeria delle immagini.
10. End sulla stessa colonna destra, ordinati Completata, Neutra,
    Interrotta, Escalation; colori e tratteggi distinti per tipo.
11. La fase compare come label sopra il titolo del passo, in Builder e Map.
12. Passate mediane sulle colonne e ordine delle porte riducono gli
    incroci dei rami paralleli. Gli ingressi alle convergenze seguono
    l'ordine verticale delle sorgenti. Nessuna riscrittura del DAG.

## Dati e compatibilità

Testo semplice conservato come stringa. Gli stili sono intervalli numerici
con attributi opzionali validati, colori allowlist e flag elenco puntato;
nessun HTML, SVG, CSS o script importato viene interpretato. I contenuti
precedenti restano testo semplice. Gli stili dell'istruzione sono conservati
anche nel cambio Instruction/Alert.

Nessuna dipendenza aggiunta e nessuna migrazione distruttiva: IndexedDB v5,
graph schema 1 e contenitore package v1. Questa versione legge i dati
precedenti. I pacchetti con nuovi attributi/layout richiedono un lettore
aggiornato: un'app precedente con validazione strict può rifiutarli.
Ready e run pinnate non vengono modificate; gli stili viaggiano negli
snapshot, nel clipboard e nell'export/import additivo.

## Verifica

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run test -- --maxWorkers=2`: **452/452 PASS**, 59 file.
  Le prime esecuzioni con parallelismo predefinito, in contemporanea ai
  browser, avevano riportato timeout; l'esecuzione integrale a due worker
  è passata senza modificare o allentare quei test.
- Dopo gli ultimi ritocchi, rieseguiti i sette file unitari/integrativi
  interessati: **46/46 PASS**, compresi geometria, formattazione,
  persistenza attività, Undo/Redo, quota e round-trip portabile.
- La prima serie E2E ampia è stata interrotta dopo 149 casi completati:
  147 PASS e due FAIL per l'asserzione storica che vietava qualsiasi
  combobox nella nota delle risposte. Il test ora verifica il solo
  selettore colore e l'assenza di un menu delle destinazioni.
  Quella serie usava una build precedente all'ultima correzione del
  contorno SVG; non viene presentata come una suite interamente PASS.
- `npm run build`, eseguito dal webServer Playwright sulla versione finale:
  PASS. Restano gli avvisi già presenti sul bundle oltre 500 kB e
  sull'opzione Vite `inlineDynamicImports` deprecata.
- Verifica conclusiva su nuova build, Chromium/Firefox/WebKit:
  **41 E2E PASS, 1 SKIP, 0 FAIL**. Lo SKIP riguarda soltanto l'emulazione
  touch non supportata da Firefox desktop; il caso è passato negli altri
  due browser. Coperti anche focus SVG da mouse/tastiera, deselezione,
  editor delle risposte aggiornato, AND con 32 attività, Ready immutabile,
  Map read-only, Run, media reali in IndexedDB e reflow delle gallerie.
- Componenti/overlay e matrice UI Chromium: **17/17 PASS**. Dodici
  combinazioni 320/390/768 px × 4/13/30/48 pt, tastiera e focus trap,
  persistenza/offline, gestione errori e contrasti light/dark. Quattro
  baseline 13pt rigenerate intenzionalmente (`--update-snapshots=all`)
  e ispezionate: componenti light/dark, Dialog e Sheet.

## Evidenze visive

- [Freccia selezionata tra passi disassati](assets/graph-followup/arrow-detail.png).
- [Panoramica grafo e fase sopra i passi](assets/graph-followup/graph-overview.png).
- [Testo formattato e nota puntata, con contenuto HTML mostrato come testo](assets/graph-followup/formatted-preview.png).
- [Gallerie 2/4 colonne, note separate e didascalie centrate](assets/graph-followup/compact-galleries.png).

## Limiti

iPhone/iPad fisici, Android fisico e screen reader reali: **NON ESEGUITO**.
L'emulazione touch di Chromium/WebKit verifica CSS e viewport, non sostituisce
una verifica del focus sulla tastiera di Safari iOS fisico.

La riduzione degli incroci è euristica: non garantisce il minimo matematico
per ogni DAG. Gli archi verso gli End possono attraversare più colonne.
La formattazione si applica tramite selezione nel campo e anteprima live;
non è un editor Word completo. Nessuna nuova dichiarazione di prontezza
operativa o di validità clinica. Pubblicazione sul sito non inclusa.

Prossimo controllo: verifica del focus e dello zoom su Safari iOS fisico,
leggibilità su Android e revisione visiva prima della pubblicazione.
