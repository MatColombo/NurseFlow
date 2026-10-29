# NurseFlow — Development Contracts v1.0 · START HERE

**Preparato:** 29 ottobre 2026. **Obiettivo:** avviare sviluppo della PWA NurseFlow su base già approvata. **Prodotto corrente:** progettato, non ancora implementato.

## 1. File e funzione

| Ordine | File | Funzione | Stato |
|---|---|---|---|
| 1 | `01_MASTER_NURSEFLOW_v3.8.md` | Specifica integrale UX/prodotto, 343KB: copia IDENTICA della master v3.8 originale | Utente approvato/frozen |
| 2 | `02_CONTRATTO_UI_TEMA_PRONTO_SOCCORSO_v1.0.md` | Estetica, colori, token, tipografia, slider 4–48pt, responsive e accessibilità | Tema approvato; token di implementazione |
| 3 | `03_CONTRATTO_STACK_E_ARCHITETTURA_v1.0.md` | React/Vite/TS/Dexie/PWA/i18n/CI, moduli, confini e politiche offline | Baseline tecnica |
| 4 | `04_CONTRATTO_MODELLO_DATI_E_RUNTIME_v1.0.md` | Strutture, IDs, Ready/Draft, media, DAG, AND/OR, W07/W08, run state | Contratto integrità |
| 5 | `05_CONTRATTO_IMPORT_EXPORT_BACKUP_v1.0.md` | Scopes 11A/11B, file versionati, sicurezza, snapshot, import add-only | Comportamento frozen; formato tecnico baseline |
| 6 | `06_ROADMAP_SVILUPPO_E_PROMPT_v1.0.md` | 17 fasi F00–F16, un prompt e gate per ogni fase | Piano esecutivo |
| 7 | `07_PIANO_TEST_E_CRITERI_ACCETTAZIONE_v1.0.md` | E2E, data integrity, UI 4–48pt, sicurezza, offline e release | Gate QA |
| 8 | `08_ADR_E_DECISIONI_IMPLEMENTATIVE_v1.0.md` | Record decisioni tecniche e template ADR | Manutenzione |
| 9 | `AGENTS.md` | Regole per AI coding agents e sviluppatori | Istruzioni di progetto |
| Asset | `assets/riferimento_tema_pronto_soccorso.png` | Moodboard scelta, NON mockup pixel-perfect | Riferimento estetico |

Tutti i documenti sono leggibili senza font esterni, servizi o collegamenti privati. La sola master v3.8 è volutamente in inglese come documento originale, mentre i nuovi contratti sono in italiano.

## 2. Che cosa è effettivamente congelato

- Pagine **00–11** (Page 11A Procedure e libreria + Page 11B Backup app e impostazioni).
- Stato Ready conservato dopo import validato, sia in 11A che 11B; Draft resta Draft.
- Import Library/procedure **solo additivo**, mai merge distruttivo, cancellazione o sostituzione; Settings-only e Settings di Full sostituibili soltanto dopo avviso/compare/consenso.
- Decision esclusive, Multitask activities con tutte le attività richieste, End intenzionali e Stop intero eccezionale.
- Problemi P01–P12 e avvisi W01–W08, in particolare W07 e W08 warnings, W08 safe interruption.
- Interfaccia una scala globale 4–48pt default 13, contenitori e spazi che scalano con il testo.
- Tema estetico infermiera / pronto soccorso, pulito e funzionale.
- PWA personale offline-first e storage locale, no account/backend/cloud sync.

## 3. IMPORTANTISSIMO: gerarchia tra fonti

La master v3.8 è un documento **incrementale** che conserva alcune vecchie sezioni storiche con status `PROPOSED` o vecchi valori, talvolta contraddetti da approvazioni successive. La presenza di questi paragrafi non riapre una scelta congelata. **In caso di apparente contraddizione:**

1. Le approvazioni finali riassunte nell'**header v3.8**, §07.11, §09.2, §15/§17 (scala unica), §18 (11A/11B) e §19.3 (Ready importata) prevalgono sulle proposte precedenti.
2. La master governa **cosa deve fare** l'app e il comportamento delle pagine.
3. Il contratto estetico governa **come appare**, senza cambiare geometria e interaction patterns congelati.
4. Contratti 03–05 governano implementazione e dati **finché coerenti** con master/estetica; una proposta tecnica può cambiare con ADR verificata senza modificare l'UX.
5. Il mockup PNG è riferimento visivo e può non rappresentare perfettamente il layout congelato (ad es. mostra i Recent in verticale, mentre la specifica esige tre mini scorciatoie in una riga). **Non ricostruire la UI copiando letteralmente il PNG.**

Esempi **superati** da non implementare: `Normal/Large` al posto dello slider 4–48pt; doppio slider testo+densità; `Settings import come profilo non attivo`; Page 11 unificata; Decision max 5; join manuale esplicito; dover ri-confermare Ready dopo import; richiedere target già esistente per aggiungere un ramo; colorare sempre `Sì` verde e `No` rosso come giudizio clinico.

## 4. Primo passo operativo

1. Crea repository vuoto `nurseflow` (privato all'inizio se preferisci; hosting finale Pages da configurare).
2. Copia l'intero contenuto di questo pacchetto in `docs/nurseflow/` e **sposta una copia di `AGENTS.md` alla root**.
3. Apri `06_ROADMAP_SVILUPPO_E_PROMPT_v1.0.md` e usa nell'assistente di coding **Prompt comune + F00**, chiedendo il primo commit soltanto.
4. Prima della fase F01, assicurati che typecheck/test/build e CI passino su un branch pulito.
5. Dopo ogni fase richiedi report test, commit e problemi; correggi regressioni prima della fase successiva.

## 5. Occorrono altri file Markdown prima di partire?

**No, non altri contratti obbligatori per il bootstrap.** Oltre ai 4 documenti principali richiesti sono già inclusi i 3 documenti complementari realmente utili: (i) dati/runtime, (ii) portabilità/import-export, (iii) piano test/accettazione. `AGENTS.md` evita che un coding agent ignori il freeze, e il registro ADR documenta scelte di implementazione. Sono sufficienti per partire da F00 senza decisioni di prodotto aperte.

Durante lo sviluppo verranno **generati dal codice**, non servono ora: `package.json`/`package-lock.json`, `vite.config.ts`, `tsconfig.json`, `README.md` operativo, `.github/workflows/*.yml`, schema/migrations Dexie, `CHANGELOG.md` e ADR puntuali. È utile mantenere un `/docs/adr/` man mano che emergono scelte tecniche, ma non va prodotto un ulteriore libro di specifiche prima del primo commit.

## 6. Attenzione su architettura e backup

Il browser può cancellare storage locale in determinate condizioni: richiedere persistent storage e fare export regolari, ma non promettere conservazione assoluta. I file backup sono importanti proprio perché l'app non ha cloud.

Le citazioni a GitHub Pages, React Router, Dexie, MDN e vite-plugin-pwa sono nella sezione Fonti del contratto 03. I contratti sono documenti, **non** repository implementato né test automatici già eseguiti.

## 7. Checklist kickoff

- [ ] I contratti sono copiati e versionati nel repository.
- [ ] `AGENTS.md` è accessibile dall'assistente di coding.
- [ ] La master originale ha SHA-256 identica a `nurseflow-ux-spec-v3.8.md`.
- [ ] La fase assegnata è **F00**, non un miscuglio F00–F16.
- [ ] Il primo commit registra versioni vere delle dipendenze nel lockfile.
- [ ] Chi sviluppa dichiara quali test ha realmente eseguito.
