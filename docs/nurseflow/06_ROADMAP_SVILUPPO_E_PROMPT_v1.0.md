# NurseFlow — Piano di sviluppo e prompt operativi v1.0

**Data:** 29 ottobre 2026. **Uso:** eseguire una fase alla volta con un assistente di coding o sviluppatore, nel repository. Non lanciare tutti i prompt insieme. **Nessuna fase cambia il freeze UX/UI 00–11 o il tema pronto soccorso.** Stime temporali volutamente omesse: la complessità è subordinata a test, dipendenze e capacità dell'ambiente.

## 0. Come usare questi prompt

1. Copia nel repository i file dell'intero pacchetto (cartella `docs/nurseflow/` o equivalente) e **AGENTS.md** alla root.
2. Ogni fase ha dipendenze, un prompt autonomo, criteri di uscita e test. Ogni prompt suppone che l'esecutore abbia accesso ai documenti e al codice. Se manca un documento, deve dichiararlo e fermarsi sul punto dipendente invece di inventare la UX.
3. **Una fase = una PR/commit verificabile**; prima di avanzare, fare typecheck, lint, test pertinenti e build. Gli E2E si aggiungono man mano.
4. Il master v3.8 è storico e cumulativo: valgono le decisioni con massima precedenza (header v3.8, §07.11, §09, §15, §18, §19). Non programmare vecchie proposte superate come doppio slider, import impostazioni come profilo non attivo, Max 5 outcomes, Page 11 unica.
5. Non scrivere un'app finta/solo screenshot: implementare la feature reale richiesta o indicare esplicitamente lo stub che verrà completato nella fase designata. Mai mettere testo clinico di esempio come procedura affidabile.
6. Il prompt comune qui sotto **si aggiunge idealmente all'inizio** di ogni fase, poi incollare il relativo prompt di fase.

### Prompt comune — guardrail da anteporre

> Stai sviluppando **NurseFlow**, PWA personale offline-first senza backend, account o cloud. Prima di modificare il codice leggi `AGENTS.md` e i documenti `01_MASTER_NURSEFLOW_v3.8.md`, `02_CONTRATTO_UI_TEMA_PRONTO_SOCCORSO_v1.0.md`, `03_CONTRATTO_STACK_E_ARCHITETTURA_v1.0.md`, `04_CONTRATTO_MODELLO_DATI_E_RUNTIME_v1.0.md`, `05_CONTRATTO_IMPORT_EXPORT_BACKUP_v1.0.md`, `07_PIANO_TEST_E_CRITERI_ACCETTAZIONE_v1.0.md`. Non modificare i flussi congelati delle Pagine 00–11 né il tema approvato. Il DB locale è IndexedDB/Dexie, Ready è snapshot immutabile, la sessione pinna una revisione, import Library è sempre additivo e le Settings sono sostituite solo dopo conferma. Implementa la fase richiesta con TypeScript strict, unit/integration test e documentazione minima, senza chiamate cloud. Non dichiarare test superati se non li hai eseguiti. Alla fine presenta file modificati, comandi lanciati, risultati, bug/rischi e checklist di completamento. Se trovi una contraddizione nella master storica, applica la precedenza v3.8 e registra una ADR soltanto per la decisione implementativa.

---

## Mappa delle fasi

| Fase | Moduli/pagine | Dipende da | Deliverable verificabile |
|---|---|---|---|
| **F00** | Scaffold, GitHub, CI | Contratti | React/Vite/TS, scripts, pipeline green |
| **F01** | Domain + DB | F00 | Tipi, Dexie, migration, fixture, transazioni |
| **F02** | Design system + shell + i18n | F00/F01 | Tema pronto soccorso, slider e routing base |
| **F03** | Page 00, Page 01 | F01/F02 | First Launch e Library reale |
| **F04** | Page 02, Page 06 | F03 | Dettaglio, creazione Draft e metadati |
| **F05** | Page 07 Outline | F01/F04 | Editing DAG mobile/undo/redo/copy/cut/paste |
| **F06** | Page 07 Graph | F05 | Canvas grafico coerente con Outline, target picker |
| **F07** | Page 08 + Media | F05/F06 | Editor contenuti, outcome, doppie gallerie |
| **F08** | Page 09 + Ready | F07 | Validator P/W e commit Ready atomico |
| **F09** | Runtime engine | F01/F08 | State machine OR/AND, save/Resume, Back |
| **F10** | Page 03, Page 04 | F09/F07 | Consultazione e tipi End completi |
| **F11** | Page 05 Map | F06/F10 | Graph/List read-only, current node info |
| **F12** | Page 10 Settings | F02/F11 | Preferences, slider 4–48pt, storage, update |
| **F13** | Page 11A | F08/F12 | Export/import procedure selettivo e additivo |
| **F14** | Page 11B | F13 | Settings/full backup, compare e opt-in |
| **F15** | PWA/Pages | F00–F14 | Offline, install, SW update safe, deploy |
| **F16** | QA/release | F00–F15 | Gate G1–G5 e rilascio documentato |

Il primo deploy preview può avvenire già in F00 per provare la base Pages, ma il release pubblico di un'app usabile avviene soltanto dopo F16.

---

## F00 — Bootstrap repository, tooling, CI

**Obiettivo:** base che compila e distribuisce correttamente su static hosting. **Non** inventare ancora una UI medica né database demo travestito da produzione.

**Prompt da incollare:**

> Implementa **F00** di NurseFlow: crea repository Vite + React + TypeScript strict e Node LTS, usa npm con lockfile, React Router HashRouter, Vitest, ESLint, Playwright pronto all'uso, GitHub Actions CI e GitHub Pages con `base` configurabile per nome repository. Crea struttura moduli secondo contratto 03, alias import e route placeholders etichettati `not implemented` solo per sviluppo. Crea scripts reali `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `preview`, e README con istruzioni `npm ci`. Aggiungi smoke test di app mount e deep link hash. Non introdurre account, server, sync o CDN. Esegui i comandi realmente possibili; fornisci report. Non attivare auto-reload forzato PWA.

**Exit gate:** CI green; `npm ci && npm run typecheck && npm run test && npm run build`; pagina root / hash route base funziona sul preview locale; repository non contiene secrets.

## F01 — Modello dati, IndexedDB e comandi atomici

**Prompt:**

> Implementa **F01** leggendo soprattutto contratti 03/04/05. Introduci tipi dominio per Procedure, Group, Revision, Graph, Node/Outcome/Activity/Destination (node/unassigned/broken/activity-complete), Settings, Media, RunSession. Configura Dexie con tabelle/versioning e repository, migrazioni non distruttive e fixture non cliniche. Crea `createDraft`, `updateDraft`, `markReadyUnitOfWork` scheletro transazionale (la validazione concreta sarà F08), `saveRun`, `addImportedRecords` come comandi isolati senza UI. I commit Ready non possono modificare una Ready esistente; fallimenti devono fare rollback. Testa import add-only con nuovi ID, immutabilità, transaction fail/quota simulati. Niente file I/O/crypto async dentro tx. Non esporre direttamente Dexie nei componenti.

**Exit gate:** tabelle create su browser reale e fake-indexeddb, migrazione v1 testata, rollback dimostrato, unit tests e build verdi.

## F02 — Componenti UI, tema e routing/i18n

**Prompt:**

> Implementa **F02**: design tokens del tema infermiera/pronto soccorso contratto 02, dark mode, componenti `Button`, `Card`, `Badge`, `Search`, `Sheet`, `Dialog`, `Icon`, `List`, `GalleryFrame`, `ValidationRow`, indicatori di focus accessibili, confini errori. Un'unica `uiScalePt` 4–48pt default 13 con offset titoli/note/badge e dimensionamento coerente di box/icona/spaziature; `Ripristina 13 pt`. Includi i18next IT/EN offline e HashRouter routes master; nessun bottom nav. Non usare `transform: scale()` sulla pagina. Testa render 320px e 48pt, screen reader labels e preferenza theme; snapshot visivi di componenti al default. I componenti non devono inventare nuove decisioni di UX.

**Exit gate:** component library riutilizzabile, i18n, tema light/dark, unit/accessibility tests e prima prova 4/13/48pt senza bleeding.

## F03 — First Launch e Library (Pages 00–01)

**Prompt:**

> Implementa **F03** Pages 00/01 dalla master v3.8: First Launch solo al primo avvio (lingua, Start, import link verso futura 11B), richiesta persistenza contestuale senza falsa promessa; Library con gruppi personali collassabili, nastro colore/icona allowlist, tag, alias, ricerca locale, preferiti, priorità 0/!/!!, visualizzazione per gruppi e modalità priorità. Tre recenti ultracompatti in UNA riga entro 20% dell'area post-toolbar, Libreria >=80%, overflow recenti fino a 20, `···`; recent = apertura vera, non autosave. Usa IndexedDB reale e fixture fittizie, non hardcode di mockup. Mantieni filters/scroll al ritorno. Scrivi test selezione, ricerca, recent, gruppi e 320px.

**Exit gate:** Library funziona offline e con dati persistenti; screenshot e E2E su Recent e gruppi, nessuna lista verticale di recent contro il freeze.

## F04 — Procedure Details e New Procedure (Pages 02,06)

**Prompt:**

> Implementa **F04** Pages 02/06 congelate: metadati procedura, gruppo singolo, tags, aliases, priority e ribbon, favorite; azioni contestuali `Start Ready` se esiste, `Map`, `Edit`, menu More; distinzione Draft-only, Ready-only, Ready+working-Draft. Nuova procedura crea una Draft non Ready con Start editoriale, apre Builder e salva prima di mostrare successo. Nessuna traduzione automatica di contenuti authored. Usa transazioni e router reali, niente step clinici precompilati. Test su stati Details e ricarica Draft.

**Exit gate:** E02, creation/metadata tests; una Ready non muta tramite apertura editor.

## F05 — Builder mobile Outline (Page 07)

**Prompt:**

> Implementa **F05** Builder Outline della Page 07 conforme a §07.11 master: stesso DAG editabile, toolbar Undo/Redo sempre visibile, Copy/Cut/Paste contestuale con Cut pending sicuro e move atomico; picker `Prendi una decisione` e `Attività multitasking` con titoli concisi, OR 2–32 outcome e AND 2–32 activity, Draft incompleta consentita. Su outcome vuoto pulsante `+` apre `Create next step`, `End procedure here`, `Go to existing step`; creare e collegare automaticamente passo nuovo. Scelta End con 4 tipi. Per AND: `Finish this activity`, `After all activities`, `Stop entire procedure` autorizzato; nessun Join visibile. Nessun ciclo/cross-arm, shared nodes e rewiring per singolo edge con impact preview. Test property/invarianti, Undo/Redo e cancellazione W08.

**Exit gate:** E03/E04/E05 dominiali e semantica grafo pass; Outline usa gli stessi ID del dominio, nessun monolite stateful separato.

## F06 — Builder Graph + connection picker (Page 07)

**Prompt:**

> Implementa **F06** view Graph sincronizzata 1:1 con Outline F05 (non creare un secondo graph object). Canvas con pan/zoom/fit, selezione di node/outcome/edge, contextual sheet e preview di impatto prima di cambiare edge; collegare tap-to-target o ricerca-per-focalizzare e tap, **mai richiedere trascinamento linee** su telefono. Convergenze in nodo unico, arrow dirette, senza nodo merge, `+` soltanto su slot d'inserimento veri. Per AND mostra focus su fino a 3 attività e `Browse activities` ricercabile, nessun gate o `ALL complete` visibile. Supporta 32 outcome/attività senza testo microscopico. E2E su shared destination, change-one-edge, cycle rejection, break W08.

**Exit gate:** equivalenza Outline↔Graph dopo ogni edit; screenshot viewport 320/390/768 e navigazione tastiera dove praticabile.

## F07 — Step Editor, Outcomes e media (Page 08)

**Prompt:**

> Implementa **F07** Page 08 full-page: Instruction/Alert/Decision/End fields, fase, note opzionali, preview live, `Done` che torna al Builder senza pulsante Save duplicato. Outcome Editor deve contenere SOLO answer, note, read-only path summary e `Change path` tramite picker grafico F06; `Arrange answers` separato cambia ordine UI soltanto. Due gallerie indipendenti prima/dopo nota, upload immagini locali e URL HTTPS/GIF opzionali, caption/alt, reorder, layout/size, default compression futura, 32 hard cap per step e soft limit setting default 2. Preserva media già presenti quando limit diventa 2, mostra W07 placeholder. Tutto autosalvato in IndexedDB, Blob separati, evitare objectURL leaks e XSS. Test E13 e media reorder/import.

**Exit gate:** Page 08 opera su grafo persistito, media offline round-trip, 32 cap, failure autosave gestito.

## F08 — Check/Mark Ready e validator (Page 09)

**Prompt:**

> Implementa **F08** validator deterministic offline P01–P12 e W01–W08 da §09.2 master v3.8, con issue ID stabili, confronti W08 (historically broken) vs P02/P04 (unassigned) e W07 missing Blob vs P12 invalid schema. Check view con Problems sopra Warnings, `Fix`/`Inspect` focus Page 07/08, `Check again`, `Preview Draft`, avviso solo controlli strutturali, conferma personale con checkbox. `Mark Ready` rilegge draft durabile, controlla stale validation, crea nuova revisione Ready in tx atomica e preserva vecchio Ready/run pinned. Warning non impedisce Ready, W08 richiede comunicazione `un percorso può interrompersi`. Test E06, P/W matrix e quota error, no falso successo.

**Exit gate:** ciclo Draft→Ready realistico, 0 Problems obbligatorio, atomic commit verificato, test regression pass.

## F09 — Runtime di consultazione puro OR/AND

**Prompt:**

> Implementa **F09** state machine pura e serializzabile per run pinned Ready: OR seleziona un solo outcome esplicito; AND richiede completamento di ogni activity in qualsiasi ordine, switching e resume indipendenti, `Finish this activity` esplicito, `After all activities` gated, early `Stop entire procedure` solo End stopped/escalation autorizzato. History real route, Back, cambio decisione con invalidazione del futuro incompatibile, progress range n/N o n/min-max, previous-step cue. Distinguere End, activity-complete e broken W08 (interruzione senza falso End). Persisti ogni transizione in Dexie, testa reload/Resume e run non alterata da nuove Ready. Non costruire subito screenshot come motore, verifica reducer/commands prima.

**Exit gate:** E05, E07, E08, E14 unit tests pass anche dopo reload e con pinned snapshot.

## F10 — Guided Run + End (Pages 03,04)

**Prompt:**

> Implementa **F10** UI Page 03/04 della master usando engine F09: una sola instruction/decision visibile alla volta, macro-category, posizione route-aware, previous-step cue, dual galleries, note/alert, Decision buttons espliciti, activity progress e `Cambia attività`, `Riapri attività` con conferma, Back e Exit sempre confermato. Page 04 End mostra Completed/Stopped/Escalation/Neutral con titolo/messaggio authored, Back/Map/Restart confermato/Library, senza interpretare successo clinico. W08 route → interruption distinta, W07 media placeholder. 320px e scala 48pt devono mantenere CTA accessibili. E2E su run/reload/End.

**Exit gate:** run completa End e può riprendere senza divergences, test E07/E08/E14 pass con UI reale.

## F11 — Mappa read-only (Page 05)

**Prompt:**

> Implementa **F11** Map Graph + List, strettamente read-only, sia da Details sia da Run, usando medesima revisione/snapshot. Pan/zoom/fit, inspect node, evidenzia nodo corrente/route visitata se in run, condivisi referenziati una volta in List, AND senza gate editabile. Non consentire di cambiare ramo o navigare cursore dalla mappa. Il Back ripristina contesto e sessione intatti. Test per convergenza, incomplete Draft view se prevista, pinned run invariata, scale 4 e 48.

**Exit gate:** aprire/chiudere Map non produce alcuna scrittura del run, E08 pass.

## F12 — Settings (Page 10)

**Prompt:**

> Implementa **F12** Settings completo: locale English/Italiano, theme system/light/dark, **un unico slider `Scala interfaccia` 4–48pt default 13**, con tutti i componenti che cambiano dimensione (testi, badge, box, icone e gap) e Reset 13pt. Media future-add soft limit 1..32 On default 2/Off, compressione Small/Medium/High/Original futura; storage persistent actual status/grant request e uso approssimativo; check update quando online senza forzare reload durante run; About/Install se supportato; Advanced collassata con Reset layout e Clear local data con doppia cautela e export prima. Due link distinti `Procedure e libreria` e `Backup app e impostazioni` (preparare routing reale 11A/11B). Nessun Save globale. Test persistence, IT/EN, 96 visual matrix su principali pages, dark.

**Exit gate:** Settings modifica immediatamente e persiste, ma non modifica procedimenti o Ready; funzionalità esposta solo se realmente implementata.

## F13 — Esportazione/importazione 11A

**Prompt:**

> Implementa **F13** Page 11A e package engine da contratto 05: export mostra procedure reali, ricerca per keywords/group/label, selezione una/multiple, gruppo intero indipendente da filtro, selezione visibili, selezioni persistenti cambiando filtri, preview read-only, tasto Export entire library indipendente. Per import carica più file `procedure` e `library`, staging validato, tutti selezionati all'inizio, filtri uguali e checkbox per escludere elementi, preview effettiva prima della conferma, rifiuta settings/full con route 11B. FormatVersion+manifest+hash, Blob locali, URL remoti preservati, W07/W08, ID remap completa, transazione add-only e rollback; Ready valida mantiene Ready subito. Non inventare provenienza digitale certificata o dichiarare 'backup salvo' prima che download/Share finisca. Test I01–I04,I08–I16,E10–E11,E13,E15.

**Exit gate:** export/reimport roundtrip, import stesso file 3 volte, original immutato e media/run references validi, wrong-scope senza mutation.

## F14 — Backup app e impostazioni 11B

**Prompt:**

> Implementa **F14** Page 11B: settings-only export/import con confronto Current→Imported, avviso e pulsante separato di sostituzione; full export/import con libreria+Ready/Draft+local media+sessioni salvate e settings, senza cache/PWA browser perms. Full import crea copie di tutti i dati Library/run, Ready importata è usabile senza Check, Settings replacement OFF di default; quando ON richiede confronto e secondo consenso. Cancel settings non può attivare mutazioni non volute. Rifiuta `procedure`/`library` con route 11A. Import atomico e controlli quota. Test I05–I07,I16,I20,E12 e roundtrip su browser reale.

**Exit gate:** full restore di fixture con sessioni pinned pronto in nuova installazione/browser profile, nessuna mutazione di Library originale.

## F15 — PWA, aggiornamenti, hosting e resilienza

**Prompt:**

> Implementa **F15** robustezza offline/Pages: vite-plugin-pwa + Workbox precache asset bundle locali, manifest installabile, icone, handling hash routes sotto `base` repo, install test su dispositivo, offline after first successful caching, storage errors/eviction UX veritiera. SW `prompt` per updates, niente reload durante run o editor non durabilmente salvato; Update when idle differito e testato. Remote HTTPS media è opzionale, fallback offline; no trackers/CDN. CI+deploy Pages funzionanti, smoke su URL finale, test migrazioni schema con tab multipli. Registra le limitazioni effettive iOS/Android.

**Exit gate:** install, reload offline, run offline, update deferred, deploy reale; risultato documentato, nessun requisito di rete per consultare media locali.

## F16 — Hardening, audit e rilascio

**Prompt:**

> Esegui **F16** di NurseFlow come revisore severo, usando 07_PIANO_TEST_E_CRITERI_ACCETTAZIONE e tutti i contratti. Per ogni pagina 00–11 crea checklist di parità con v3.8, testa 16 E2E e almeno 20 import/security I01–I20; visual test a 320/390/768px × 4/13/30/48pt su Library, Run, Builder, Step Editor, Check, Settings, 11A/B (>=96 casi); tastiera, screen reader, IT/EN, dark/light, iOS Safari e Android Chrome (se accessibili), quota e import corrotto. Non alterare flussi per comodità. Elimina bug critical/major di data loss, XSS, outcome routing, pinned Ready, W08. Registra test non eseguiti come NON ESEGUITI. Verifica GitHub Pages statico con nuovo profilo, import Full+Resume, release tag, note versione e piano backup. Consegnami elenco problemi e gate G1–G5 con PASS/FAIL e evidenze reali.

**Exit gate:** G1–G5, zero bug critici, test reale dispositivi dove disponibile, report e release tag. Non dichiarare produzione pronta se test di sicurezza/dati critici mancano.

---

## 17. Checkpoint/commit obbligatori fra fasi

Dopo ogni fase richiedere all'esecutore questo breve report (non accettare risposte vaghe):

```text
Fase:
Obiettivo raggiunto:
File creati/modificati:
Comandi eseguiti (output sintetico):
Unit test / E2E:
Controllo rispetto UX v3.8 e tema:
Persistenza / versioni / import toccati?:
ADR nuove (se presenti):
Rischi e problemi aperti:
Proposta singola prossima fase:
```

Se il commit non passa CI, correggere nella stessa fase. Non procedere con feature nuove per nascondere una regressione di modello dati.

## 18. Definizione di MVP e di rilascio

**MVP di NurseFlow non significa** solo consultazione o una dashboard visiva: il primo rilascio dichiarato conforme al freeze deve includere anche Builder con Graph + Outline, autentica multitask AND, Ready e warning, media doppi slot, scala unica, 11A/11B e loro data integrity. Si possono fare **alpha tecniche incomplete**, chiaramente etichettate, ma non dichiararle prodotto finale.

**Il prompt da usare per iniziare** è **Prompt comune + F00**. Non serve attendere ulteriori MD per creare la prima struttura del repository; le ADR su dettagli ZIP e limiti di memoria si completano prima di implementare F13.
