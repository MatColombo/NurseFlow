# AGENTS.md — istruzioni operative per sviluppatori / agenti AI NurseFlow

## Obiettivo

Implementare NurseFlow secondo i contratti senza modificare le UX/UI Pagine 00–11, i comportamenti Ready/import o lo stile visivo infermiera/pronto soccorso congelati.

## Ordine di lettura obbligatorio

1. `00_START_HERE.md` — mappa, precedenze, uso dei prompt.
2. `01_MASTER_NURSEFLOW_v3.8.md` — specifica funzionale completa (leggere soprattutto intestazioni v3.8, §07.11, §09, §15, §18 e §19 per decisioni più recenti).
3. `02_CONTRATTO_UI_TEMA_PRONTO_SOCCORSO_v1.0.md` — stile visivo e scala UI.
4. `03_CONTRATTO_STACK_E_ARCHITETTURA_v1.0.md` — architettura e dipendenze.
5. `04_CONTRATTO_MODELLO_DATI_E_RUNTIME_v1.0.md` — dominio e run.
6. `05_CONTRATTO_IMPORT_EXPORT_BACKUP_v1.0.md` — file e additività.
7. `07_PIANO_TEST_E_CRITERI_ACCETTAZIONE_v1.0.md` — prove e gate.
8. `06_ROADMAP_SVILUPPO_E_PROMPT_v1.0.md` — eseguire solo fase assegnata.

## Non negoziabile

- Offline-first e GitHub Pages statico: no backend, no account, no sync, no tracker e no CDN a runtime.
- Dati e media locali in IndexedDB/Dexie. Ready è immutabile; working Draft e sessioni pinnate sono indipendenti.
- OR sceglie una risposta, AND richiede tutte le attività, salvo Stop/Escalation intero esplicito. Niente cicli.
- Distinzione `unassigned` P02/P04 e `broken` W08; missing local asset W07 è warning, non blocca Ready da solo.
- Import Page 11A procedure/libreria è **solo additivo**; Page 11B full aggiunge procedure/run, sostituisce Settings soltanto dopo preview+consenso separato. Ready importata valida mantiene Ready in entrambi.
- UI scale è **unico slider 4–48pt**, default 13; scala TUTTA la UI (font, icone, cards, spaziature), senza overflow o overlay; tema medicale pronto soccorso, no reinterpretazioni di layout dei mockup.
- Non inventare contenuto clinico, certificazioni, approvazioni istituzionali o risultati clinici automatici.
- Non accettare input non trusted eseguibile, HTML/SVG arbitrario, URL remoti insicuri o archivi non validati.

## Sviluppo e test

- Una fase = commit/PR. TypeScript strict, funzioni di dominio pure, DB dietro repository, test per ogni comando importante, non chiamare `db.*` dai componenti.
- Eseguire realmente `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` e test E2E pertinenti quando disponibili; non inventare PASS.
- Prima di cambiare un contratto approvato, **fermati e richiedi nuova versione/approvazione**. Per dettagli implementativi non funzionali crea ADR breve con motivazione e test.
- Non introdurre feature extra, refactoring globale o dipendenze inutili. Non eliminare dati con migrazioni.
- Dopo ogni fase riferire cosa è implementato, test eseguiti, limiti e prossima fase. Se i browser reali non sono disponibili, scrivere `NON ESEGUITO` per test dispositivi.

## Definition of Done

Nessuna feature è conclusa perché "sembra simile al mockup": deve usare data model reale, gestire errori, avere test di persistenza/rollback dove rilevante e rispettare le pagine congelate. Il prodotto non può dirsi pronto se import/Ready/Run offline non superano i gate.
