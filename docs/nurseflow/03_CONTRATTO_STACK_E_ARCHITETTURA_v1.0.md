# NurseFlow — Contratto di stack tecnico e architettura v1.0

**Data:** 29 ottobre 2026. **Stato:** baseline tecnica per avviare lo sviluppo; derivata dalle scelte già confermate e dai componenti consigliati. Le scelte di libreria implementativa non precedentemente approvate sono qui definite come *convenzioni tecniche*, modificabili solo con ADR motivato, non come nuove funzionalità. **Input normativi:** master v3.8, contratto UI v1.0, dati/runtime v1.0, import/export v1.0 e test v1.0.

## 1. Obiettivi e limiti

- PWA **offline-first**, personale, senza account, backend, server dati, cloud o sincronizzazione.
- Hosting **GitHub Pages** statico su HTTPS; distribuibile/installabile, ma installazione non obbligatoria.
- Dati **esclusivamente locali sul dispositivo**, IndexedDB come unica source of truth. Nessun patient identifier; non progettare cartelle cliniche, registri istituzionali o prescrizioni.
- Ready è **versione immutabile confermata dall'autore per uso personale**, non certificazione clinica; sessione in esecuzione agganciata allo snapshot scelto.
- L'app deve funzionare senza connettività **dopo una prima visita online che abbia installato e popolato con successo la cache PWA**. L'assenza di rete al primo accesso su un dispositivo nuovo non può essere garantita.
- Eccezione di rete voluta dall'utente: immagini/GIF remoti con HTTPS; su consultazione possono contattare host esterni e non sono garantiti offline. Gli altri asset dell'app sono locali/cache.

## 2. Stack scelto

| Layer | Soluzione | Vincolo |
|---|---|---|
| Linguaggio | **TypeScript** in strict mode | Evitare `any` salvo confine e validazione |
| UI | **React** | Componenti funzionali, semantici, testabili |
| Tooling | **Vite** | Build statica, path base GitHub Pages |
| Router | **React Router HashRouter** | URL `/#/...` come master, nessun rewrite server |
| Styling | **CSS Modules + custom properties** (oppure fogli CSS per token globali) | No design system esterno che imponga layout, usare contratto UI |
| Database | **IndexedDB + Dexie** | Repository e transazioni; niente dati applicativi in localStorage |
| Validazione runtime | **Zod** (o libreria schema equivalente) | Parsing di file/input/DB, TypeScript inferito |
| Lingue UI | **i18next + react-i18next** | Stringhe IT/EN incluse nel bundle offline |
| PWA | **vite-plugin-pwa / Workbox** | Precaching app shell; aggiornamento su conferma, non forzato in run/editor |
| Unit/integration test | **Vitest + Testing Library + fake-indexeddb** | Eseguibili in CI; per DB critico aggiungere browser reali |
| E2E test | **Playwright** | Browser Chromium, Firefox, WebKit quando disponibili |
| Icone | **SVG locali allowlist** | Nessun fetch remoto né SVG arbitrario importato |
| Dipendenze import/export | Libreria ZIP locale solo se necessaria (`fflate`/`JSZip` valutate all'implementazione) | Dimensioni, integrità e limiti anti ZIP-bomb; nessun servizio esterno |
| Deployment | **GitHub Actions → GitHub Pages** | Test/build prima del deploy; prefisso `base` corretto |

**Versioni:** fissare versioni effettive e lockfile nel primo commit; installare versioni stabili compatibili con LTS Node al momento dell'avvio. Non inventare numeri di versione. Nessun CDN al runtime, nessun analytics/tracker. Testare la compatibilità reale del pacchetto installato, non confidare in esempi documentali obsoleti.

## 3. Topologia dei moduli

```text
index.html / Vite / PWA service worker
    |
    v
src/app (routing, providers, layout, error boundaries, update gate)
    +-- features/library          (Page 01, gruppi, ricerca, recenti)
    +-- features/procedures       (Page 02, Page 06, metadati)
    +-- features/builder          (Page 07 Outline + Graph)
    +-- features/step-editor      (Page 08, outcome editor, media)
    +-- features/validation       (Page 09, problema/avviso)
    +-- features/run              (Page 03, Page 04, session state machine)
    +-- features/map              (Page 05, Graph e List read-only)
    +-- features/settings         (Page 00/10)
    +-- features/portability      (Page 11A / 11B)
    +-- domain                    (types, graph ops, validators, runtime rules)
    +-- storage                   (Dexie, schema migrations, repos, asset blobs)
    +-- shared                   (UI components, theme tokens, i18n, error handling)
```

### Regole di dipendenza

1. `domain` NON importa React, DOM, router, Dexie o UI.
2. `storage` implementa repository e transazioni con tipi `domain` ma non importa componenti React.
3. `features` usano servizi/commands tipizzati e UI condivisa; **mai** scrivere direttamente tabelle Dexie da un button handler.
4. `run` consulta snapshot Ready immutabile, non il working Draft; `map` legge lo stesso snapshot/session state senza mutarlo.
5. `validation` è una funzione deterministica e senza effetti collaterali; regole P01–P12, W01–W08, compresa precedenza W08 rispetto a P02/P04/P05/P11.
6. `builder Outline` e `builder Graph` rappresentano **lo stesso** Draft; nessuna seconda copia del grafo o state divergent.
7. `portability` usa `domain` + repository; file parsing/preview fuori dalle transazioni e operazioni atomiche solo alla conferma.
8. `uiScalePt` è un'unica impostazione che produce token per tutti i feature module.

## 4. Struttura repository proposta

```text
nurseflow/
  .github/workflows/{ci.yml,deploy.yml}
  docs/{...contratti.md}
  public/{icons,manifest-assets}/
  src/
    app/{App.tsx,routes.tsx,providers.tsx,error-boundaries.tsx}
    domain/{model,graph,validation,runtime,portability}/
    storage/{db.ts,migrations,repositories,unit-of-work.ts}/
    features/{first-launch,library,procedures,builder,step-editor,validation,run,map,settings,portability}/
    shared/{components,design-tokens,styles,i18n,icons,utils}/
    test/{fixtures,helpers}/
    main.tsx
  e2e/{journeys,fixtures}/
  vite.config.ts
  tsconfig.json
  package.json
  package-lock.json
  README.md
  AGENTS.md
```

La cartella reale può essere semplificata, ma **non** eliminare il confine dominio/persistenza/interfaccia. Usare alias import e naming coerente. Niente mega-file con centinaia di logiche mischiate.

## 5. Navigazione e deep link

HashRouter aderente alla master: `/#/setup`, `/#/library`, `/#/procedure/:id`, `/#/run/:id`, `/#/run/:id/end`, `/#/procedure/:id/map`, `/#/new`, `/#/build/:id`, `/#/build/:id/step/:nodeId`, `/#/build/:id/check`, `/#/settings`.

Separare le due sotto-pagine Page 11 in una route implementativa stabile (suggerite `/#/data/procedures` e `/#/data/app`). I path sono dettagli interni e non alterano due voci distinte congelate in Settings. Le route con revision ID/ run ID devono risolvere la revisione corretta; route non trovata mostra recupero, non pagina bianca.

GitHub Pages su sottocartella: impostare `base: '/<repo>/'` e URL risorse relativo a `import.meta.env.BASE_URL`. Su root/custom domain usare `/`. Evitare history routing puro che produce 404 statici.

## 6. Persistenza e unità atomiche

- Database Dexie `NurseFlowDB` con versioni di schema progressive e migrazioni **non distruttive**.
- Tabelle come contratto dati: `procedures`, `groups`, `revisions`, `mediaAssets`, `runSessions`, `settings`, `uiPreferences`, `importReceipts` (facoltativa per diagnostica, mai deduplicazione imposta).
- `transaction('rw', ...)` coinvolge **tutte** le tabelle correlate quando si crea una Ready revision, si modifica un Draft con nuove risorse, si avanza in una run, o si importa un pacchetto. Non fare `fetch`, compressione Blob, `crypto.subtle.digest`, file picker o pause async estranee *dentro* una transazione IndexedDB: eseguire queste operazioni prima e poi fare solo I/O DB dentro l'unità atomica.
- Ready: snapshot immutabile per valore e media pin/reference coerenti; solo nuova revisione può diventare Ready, il vecchio Ready rimane recuperabile e i run pinned restano invariati.
- Draft: autosave con debounce dove opportuno, ma segnare `Saved` solo quando il commit è finito; `Mark Ready` disabilitato con autosave in corso o errori I/O.
- `put` è lecito per update di entità locali editabili, **vietato per sovrascrivere dati esistenti durante import**. Import usa nuove identità + `add`/`bulkAdd` in unica transazione, senza catch interno di errori che renderebbe parziale il commit.
- `navigator.storage.persist()` richiesto contestualmente e veritiero; `persisted()` e `estimate()` mostrano le condizioni effettive. Il permesso non è un backup.

## 7. Grafo e stato di run

- DAG, Start singolo; nessun ciclo nell'MVP. Decision = OR, **una** scelta per visita; due–trentadue outcomes Ready. Collegate a uno stesso nodo sono legali due o più risposte.
- Multitask activities = AND, due–trentadue attività richieste in Ready, completabili in ordine libero, con stato indipendente; gate di completamento interno **non esposto in Builder**; una sola continuazione `After all activities`.
- `Finish this activity` è evento esplicito; quando tutte complete si sblocca l'uscita comune.
- `Stop entire procedure` eccezionale, deliberato, tramite End di tipo Stopped o Escalation, non marca completate le attività non svolte.
- End altri tipi Completed e Neutral. L'End è un nodo scritto dall'autore; nessun successo dedotto automaticamente.
- Missing image W07 = placeholder; historical deleted-target W08 = `Path unavailable`, Back/Map/Exit; non è End, non genera Skip. Un outlet mai assegnato è Problem.
- Back e cambio Decision ricostruiscono storia dal percorso realmente visitato, invalidando futuro incompatibile, con salvataggio atomico; Map in run è read-only.
- Ogni `RunSession` deve puntare a una revisione/snapshot immutabile, incluse eventuali copie importate; nessun run si aggiorna durante il cambio Ready.

## 8. PWA offline, cache e aggiornamento

1. Cache app shell e risorse statiche locali precache con Workbox. Testare hard reload offline, route hash profonde, installazione e riapertura.
2. Nessuna cache remota come prerequisito; link HTTPS opzionale è `remote-unavailable` offline; mai sostituire una immagine con dato clinico inventato.
3. La cache del service worker **non** è storage dei dati: procedure e Blob sono in IndexedDB.
4. Politica aggiornamenti `prompt`: nuova versione rilevata → `Later` / `Aggiorna quando inattivo`. Mai forzare `skipWaiting`+reload durante run attivo o editor con autosave pendente. L'azione Update when idle valuta davvero l'assenza di attività e commit non completati.
5. Strategie di caching che non restituiscano vecchio `index.html` indefinitamente. Gestire un aggiornamento che cambia lo schema DB con migration; testare app aperta su due tab e comportamenti `blocked/versionchange`.
6. L'app segnala con precisione `Pronta offline` **solo** dopo che assets critici e service worker sono effettivamente pronti.
7. Aggiornamenti e controlli rete in Settings falliscono con messaggi pertinenti; nessun crash in modalità aereo.

## 9. Sicurezza e privacy

- Importati: JSON/archivi potenzialmente malevoli. Validare schema, tipi, limiti, nomi path, versione, integrità e link. Niente HTML/JS eseguito da note, caption, titoli, nomi file o SVG non allowlisted. React esegue escaping; niente `dangerouslySetInnerHTML` per contenuto utente.
- Remote media: **solo HTTPS**; no `javascript:`, `data:`, `file:`, `http:`, redirect insicuri, SVG remoto o URL locali/privati se non sicuri; evitare tracking accidentale e comunicare che il caricamento contatta un server terzo.
- Nessun patient identifier; nessun errore/screenshot contenente dati delle procedure inviato a telemetria. In CI i fixture sono fittizi.
- Full export contiene dati sensibili personali creati nell'app; interfaccia avverte l'utente di conservarlo in luogo protetto. Non promettere crittografia se non implementata; crittografia password sarebbe un'**estensione distinta**.
- CSP prudente compatibile con asset locali e HTTPS remoti esplicitamente consentiti; nessun CDN/script esterno. Le policy effettive devono essere testate sul deployment statico.

## 10. Qualità e comandi standard

`npm ci`, `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run build`, `npm run preview`. Tali script devono essere implementati, non solo documentati.

CI pull request: install lockfile → lint/typecheck → test → build → e2e smoke. Deploy `main` solo dopo gate verdi. Preferire un ambiente `preview` locale/test URL per evitare di testare su biblioteca reale.

Dati di test riproducibili: decisioni condivise, AND con terminazione precoce, nodo cancellato W08, immagine mancante W07, media in due slot, import Ready ripetuto, file scope errato e file corrotto.

## 11. Registro decisioni implementative da chiudere al primo commit

| ADR | Scelta iniziale | Gate prima dell'implementazione |
|---|---|---|
| ADR-001 | Lockfile npm e Node LTS | `node --version`, `npm ci`, build in CI |
| ADR-002 | Archive ZIP versionato (`.nfproc/.nflib/.nfsettings/.nfbackup`) | Formato in contratto portabilità + limite memoria benchmark |
| ADR-003 | Rappresentazione editoriale AND con gate implicito | Test semantici, nessun Join visibile |
| ADR-004 | Normalizzazione delle Ready da import | Test conservazione + P/W + W08 |
| ADR-005 | Flusso update PWA differito | Test run attivo durante nuova SW |
| ADR-006 | Migrazioni schema DB e package | Backup testato e rollback su errore |

Non scegliere alternative che cambino l'UX congelata senza esplicita nuova approvazione. Un ADR documenta *come* implementiamo, non può cambiare il *cosa* già approvato.

## 12. Fonti tecniche di verifica (consultate 29 ottobre 2026)

- Vite deployment Pages: https://vite.dev/guide/static-deploy
- Vite public base: https://vite.dev/guide/build
- React Router HashRouter: https://reactrouter.com/api/declarative-routers/HashRouter
- Dexie transactions: https://dexie.org/docs/Dexie/Dexie.transaction()
- Dexie bulkAdd: https://dexie.org/docs/Table/Table.bulkAdd()
- Vite PWA update prompt: https://github.com/vite-pwa/vite-plugin-pwa/blob/main/docs/frameworks/index.md
- Storage persistence: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- Storage eviction limits: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

**Criterio di completamento dell'architettura:** l'app può creare dati, aggiornarli, validarli, eseguire una run, esportarli/importarli e riaprirli offline senza perdere o sovrascrivere Ready o run esistenti; il resto dello sviluppo deve aderire a questi vincoli verificabili.
