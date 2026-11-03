# NurseFlow — versioni

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
