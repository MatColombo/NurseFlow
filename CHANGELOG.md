# NurseFlow — versioni

## Modifiche locali successive alla rc.2 — 3 novembre 2026

- Frecce con arrivo rettilineo, selezione arco e due estremi, resto attenuato; fase sopra il titolo e tipi di passo colorati.
- Regioni multitask riservate, meno incroci, End sulla colonna destra con colori e tratteggi distinti.
- Nome attività e primo passo creati atomicamente con passaggio diretto all'editor.
- Campi touch senza zoom automatico al focus, pulsanti distinti per consultazione/azione/anteprima.
- Gallerie compatte fino a 2/4 immagini per riga, didascalie centrate; stili testo e note con elenco puntato, salvati come dati validati.

[Report e limiti](docs/reports/RC2-followup.md), [addendum su richiesta utente](docs/adr/020-graph-authoring-and-text.md).

## 0.1.0-rc.2 — 3 novembre 2026

- Graph e Map da sinistra a destra, ancore destra/sinistra e curve con arrivo perpendicolare; convergenze sempre su un solo nodo.
- Nuove attività AND con istruzioni/avvisi di follow-up già terminabili sul successore esterno comune. Il picker riconosce quel successore come completamento dell'attività, senza saltare le altre; nessuna riscrittura di Ready o run esistenti.
- Transizioni leggere per pagine, passaggi, popup e sheet; movimento ridotto rispettato, scroll del grafo immediato e ripristini di posizione senza animazione.
- Note inizialmente aperte, controllo compatto, testo principale e nota della stessa misura; figure numerate tra le due gallerie, didascalie in corsivo e separatori discreti.
- Libreria con accenti turchesi e icona ospedaliera locale, conservando ricerca, gruppi, recenti e scala 4–48pt.

Regole aggiornate su richiesta esplicita dell'utente nell'[addendum](docs/adr/019-graph-and-reading-refinement.md). Schema IndexedDB v5 e formato package v1 invariati. Restano da verificare i dispositivi mobili e gli screen reader reali elencati nel report F16.

## 0.1.0-rc.1 — 3 novembre 2026

Candidata tecnica per uso personale, sottoposta all'audit F16. Non è dichiarata pronta per l'uso operativo: installazione, lifecycle storage e accessibilità assistita su dispositivi mobili reali devono ancora essere verificati. L'esito puntuale dei gate è nel [report F16](docs/reports/F16.md).

- Pagine 00–11A/11B integrate con IndexedDB reale, Ready immutabili e run pinnate; nessuna procedura clinica precaricata.
- Builder Outline/Graph sullo stesso DAG, media locali, Check strutturale, Run e Map read-only; IT/EN, temi e scala unica 4–48pt.
- Pacchetti versionati con manifest/hash, import Library additivo e Settings sostituibili soltanto con consenso separato; quota e rollback verificati con fault injection.
- PWA con asset locali, cache verificata e aggiornamento differito; pubblicazione statica sotto `/NurseFlow/`.
- Corretto il wrapping delle scelte backup a 320px/48pt. Stabilizzate le prove di persistenza e intercettazione dei media con service worker attivo.
- Aggiunte prove F16 per import selettivo di dieci procedure, tastiera/albero accessibile del preview e round-trip Full sul vero URL Pages.
- Aggiunta CSP nella build statica per limitare gli script all'origine dell'app e bloccare inline script, oggetti e frame; test eseguiti con policy attiva, senza `bypassCSP`.
- Corretto Resume da Details dopo import Full o nuova pubblicazione: riprende la sessione storica anche se la Ready corrente è più recente; versione e Map seguono il pin. Dopo uscita esplicita torna disponibile la Ready corrente.

Nessuna migrazione distruttiva: schema IndexedDB v5 e formato portabile v1 invariati. Un export preparato o consegnato a Download/Share non dimostra che il file sia stato conservato fuori dal browser. Seguire il [piano backup](docs/backup-and-recovery.md).
