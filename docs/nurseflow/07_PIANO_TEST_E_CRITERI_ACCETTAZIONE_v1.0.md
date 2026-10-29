# NurseFlow — Piano QA, gate e criteri di accettazione v1.0

**Principio:** ogni feature è completa solo quando sono verificati gli invarianti dei contratti. Un prototipo HTML o una screenshot non prova persistenza, correttezza del grafo, sicurezza, comportamento offline o accessibilità.

## 1. Livelli e ambienti

| Livello | Strumento | Cosa verifica |
|---|---|---|
| `unit` | Vitest | Grafi, validator P/W, run reducer, remapping ID, package manifest |
| `component` | Testing Library + axe se adottato | Label, focus, sheet, controllo responsive, i18n |
| `storage` | Dexie + fake-indexeddb e browser reale | Migrazioni, transazioni, rollback, errori quota simulati |
| `e2e` | Playwright Chromium/WebKit/Firefox se disponibili | Flussi completi, deep link, download, Reload/Resume |
| `pwa` | Playwright + dispositivi/DevTools | SW, cache, Update idle, offline after install |
| `visual` | Screenshot + strumenti di ispezione | 4–48pt, overflow, contrasto, gerarchie, focus |
| `manual` | iOS Safari PWA + Android Chrome PWA | Storage lifecycle, file picker/share, install, low memory, offline |

**Fixture**: inventate e non cliniche; dati con nomi neutri come `Procedura esempio`, `Controllo materiale`, `Decisione A/B`, `Attività 1/2`, End Stopped/Completed. Evitare di inserire istruzioni mediche potenzialmente scambiate per procedura validata.

## 2. E2E obbligatori (derivati dalla master v3.8)

| ID | Scenario | Condizione per PASS |
|---|---|---|
| E01 | First Launch → Library → Settings | No login/backend, preferenze lingua/tema/scala persistenti, ritorno UI corretto |
| E02 | Library → New → Draft Builder | Draft autosalvata, elencata, Ready non dichiarato prima del Check |
| E03 | Decision `+` → Create next step | Nodo+edge creati atomicamente, poi Page 08, nessun nodo orfano |
| E04 | Decision Outcome → End(stopped) | Terminazione intenzionale valida, non P04/P05, End mostra tipo e messaggio |
| E05 | AND multitask 2/3 arms | Switching, Finish this activity, all-complete gate, stop intero eccezionale non marca altri arm |
| E06 | Check P02/P04 vs W07/W08 | Unassigned blocca Ready, historical broken e missing blob no; warning visibili, acknowledgment |
| E07 | Run Decision A → Back → Decision B | Path futuro incompatibile rimosso, storia/counter/previous aggiornati; persistito |
| E08 | Run → Map/List → reload → Resume | Nessun cambiamento per Map, pinned revision identica, progress recuperato |
| E09 | Slider 4→48 + navigazione | Cards, icons, padding, font reflow; nessun overlap/bleeding; Reset 13pt |
| E10 | 11A Export 1/multiple/group/all | Package kind e contenuto corretti; select visible diverso da select group; filtri non azzerano scelta |
| E11 | 11A Import multiplo + wrong-scope | Candidati tutti selezionati, preview read-only, alcuni esclusi, scope errato rifiutato |
| E12 | 11B Settings/full → replace ON/OFF | OFF no cambio Settings; ON diff + confirm; cancel invariato; libreria/run additive |
| E13 | Export/import media locale/remote offline | Local round-trip integrale, URL remote conservato senza promessa offline, W07 placeholder |
| E14 | W08 in Ready run | Interruzione `Percorso non disponibile`; Back/Map/Exit; non Page 04, session invariata |
| E15 | Import ripetuto nomi e gruppi uguali | 3 copie indipendenti, IDs/puntatori coerenti, originali identici |
| E16 | Quota/transaction/storage error | Niente success falso o import parziale, dialog Retry/recovery, originale intatto |

## 3. Test puntuali del dominio

### 3.1 Grafi e Builder

- [ ] Start assente/duplicato → P01; Start regolare e path iniziale valido.
- [ ] Decision 1/33 outcomes → P03; 2/32 validi se tutte le altre condizioni passano.
- [ ] Outcome con etichetta vuota/duplicata indistinguibile → P03.
- [ ] Due outcomes convergenti sullo stesso nodo → valido; nodo unico in Map/List.
- [ ] Cambiare destinazione di solo un outcome preserva altri edge e contenuto del nodo condiviso.
- [ ] `Insert before` su uno degli edge convergenti preserva gli altri.
- [ ] Tentativo ciclo o cross-arm → rifiutato subito o P08/P07; editing non corrompe grafo.
- [ ] Multitask con 1/33 attività o attività vuota → P06.
- [ ] Finish activity non termina tutta la procedura; early Stop fa End Stopped/Escalation senza dichiarare complete altre attività.
- [ ] Node orfano creato da rewiring → P09 alla verifica; non autodelete.
- [ ] Cut pendente non rimuove alcun nodo fino a move valido; Undo/Redo coerenti.
- [ ] Nessun giudizio automatico di sicurezza/accuratezza clinica.

### 3.2 Problemi e avvisi

- [ ] P02 = `unassigned`, W08 = `broken`. Non doppio report P02/P04/P05/P11 per lo stesso W08.
- [ ] W07 missing Blob non promuove P12 da solo; P12 per URL/schema/limite >32.
- [ ] W01/W02 URL remoto correttamente classificato offline e placeholder.
- [ ] W03 media grande, W04 alt mancante, W05 fase opzionale omessa, W06 esiti praticamente identici senza colpire stessa destinazione valida.
- [ ] Step Alert senza testo always-visible → P10; End senza tipo/messaggio obbligatorio → P10.
- [ ] Mark Ready usa esattamente la Draft salvata e richiede revisione personale; DB failure = nessun Ready nuovo.
- [ ] Ripetere Check senza edit produce stessi issue, nessuna side effect.

### 3.3 Versioni e run

- [ ] Working Draft modificata non altera Ready precedente; run attivo non cambia grafo.
- [ ] Nuovo Ready non riscrive vecchio Ready, active pinned run o suo asset.
- [ ] Resume in background/reload mantiene attività corrente e progresso indipendente dei rami.
- [ ] Reopen activity chiede conferma e applica invalidazione coerente.
- [ ] End Completed, Stopped, Escalation, Neutral mostrano messaggio authored senza successo automatico.
- [ ] Exit sempre confermato; Restart confermato e sulla stessa revisione pinned.

### 3.4 Media e preferenze

- [ ] Dual gallery before/after con ordine e layout separato; 32 combinati max.
- [ ] Soft cap Off/On max 1..32, default On 2; riduzione sotto numero già presente non elimina immagini.
- [ ] Fotografie Small/Medium/High/Original solo future; foto esistenti non ricompresse.
- [ ] Nessun remote image caricato automaticamente durante l'anteprima import di un file non trusted.
- [ ] Il browser storage grant/denied/unavailable corrisponde a stato reale, nessuna garanzia infondata.
- [ ] Traduzione IT/EN cambia solo chrome UI; testi authored invariati.

## 4. Test import/export e sicurezza (gate obbligatorio prima dell'uso reale)

| ID | Input/Azione | Pass |
|---|---|---|
| I01 | `.nfproc` corretto | Un elemento, nuovi ID, Ready conservato |
| I02 | `.nflib` con 10 procedure, filtri | Selezione visibile/gruppo distinta, solo scelte importate |
| I03 | 11A carica `.nfsettings` o `.nfbackup` | Errore scope, CTA 11B, zero changes |
| I04 | 11B carica `.nfproc` o `.nflib` | Errore scope, CTA 11A, zero changes |
| I05 | Settings only → cancel | Originali Settings identici |
| I06 | Full backup → Settings switch OFF | Library/runs aggiunti, Settings invariati |
| I07 | Full backup → Settings switch ON → diff → confirm | Set corretto, nessuna mutazione preesistente Library |
| I08 | Import ripetuto 3x | IDs e references disgiunti, origin invariato |
| I09 | Missing local media reference | W07 e placeholder, import possibile dove valida |
| I10 | Missing historical graph target | W08, safe interrupt; import Ready valido |
| I11 | Reference strutturalmente corrotto o metadata incompatibile | Rifiuto prima del commit |
| I12 | ZIP bomb/path traversal/duplicate entry/ext errata | Rifiuto, nessun file eseguito |
| I13 | Hash entry errato | Rifiuto e zero commit, non semplice W07 |
| I14 | 2 file buoni + 1 wrong-scope | Wrong-scope rifiutato, altri disponibili in staging; conferma necessaria |
| I15 | File salvato/Share annullato | Non dichiarare backup persistito fuori browser |
| I16 | Errore quota/import transaction | Zero record parziale e istruzione Retry |
| I17 | Doppio asset usato da Ready e run | GC non lo cancella per errore |
| I18 | File con JS/HTML/SVG offensivo in note | Testo escaped, no esecuzione, nessun remote fetch non autorizzato |
| I19 | Formato package futuro non supportato | Rifiuto esplicito, no conversione fittizia |
| I20 | Backup full con run multipli pinnati | Remap di revisionId, procedureId e progress consistente |

## 5. UI visual / scalabilità

Matrice minima automatizzata: dimensioni viewport **320, 390, 768** CSS px × scale **4, 13, 30, 48pt** × viste **Library 01, Run 03, Builder 07, Step Editor 08, Check 09, Settings 10, Export/Import 11A, Backup 11B** = 96 combinazioni; poi test mirati 360/430/1024/1280, IT/EN e modalità dark. Per ogni combinazione:

- `document.documentElement.scrollWidth <= window.innerWidth + tolerance` salvo scroll interno del Graph Canvas; niente screenshot comparativa da sola come prova di assenza overlap.
- Nessun clipping o overflow con titoli di 140 caratteri, note verbose, traduzioni italiane, nomi file lunghi.
- Button/checkbox/focus sono raggiungibili tramite tab e tap, anche con footer sticky e tastiera mobile.
- Al 4pt il testo è deliberatamente minuscolo e l'app può mostrare cautela; non deve ridurre i target sotto la soglia minima; azioni cliniche restano ampie.
- Al 48pt la navigazione diventa verticale: controlli wrap, non si sovrappongono e non scompaiono sotto overlay.
- Decision `Yes/No` non vengono colorate sempre con significato moralistico/clinico, conforme al tema.

## 6. PWA / offline / aggiornamenti

1. Dopo installazione/cache, aprire Libreria, Page 03, Builder e Settings offline e usare media locali.
2. Reindirizzamento hash route profonda e refresh su GitHub Pages funzionano con repo base path.
3. Primo accesso offline su device mai visitato: messaggio corretto del browser; non simulare supporto impossibile.
4. Server/PWA aggiornato mentre una run è aperta: nessun reload automatico, stato e media disponibili.
5. In due tab con diverse revisioni: migrazione/blocked/refresh non lascia DB corrotto.
6. Su Safari iOS installato vs browser normale, verificare differenze storage e installabilità; registrare limiti reali.
7. Impostare storage persistent granted/denied/unavailable: testo corrispondente, nessuna promessa di conservazione assoluta.
8. Browser quota eviction/clear site data: app deve spiegare perdita dati; backup rimane necessario.

## 7. Soglie release e definizione di Done

**Ogni fase PR:** typecheck e lint zero errori, unit test pass, build, E2E di fase; confronto preciso con pagine congelate; README e changelog/ADR aggiornati se architettura cambiata. Non inserire TODO di contenuti essenziali nascosti nei pulsanti.

**Gate G1 — MVP funzionale:** Library, Builder Outline/Graph, media, validator, Ready, Guided Run, End, Map, Settings, 11A e 11B esistono e sono integrate; nessuna pagina finta. Non chiamarlo completo se una feature congelata è ancora uno stub.

**Gate G2 — Dati affidabili:** I01–I20, E03–E16 e test quota/migrazioni pass; Ready importata resta Ready, backup salvati integralmente, nessun data loss per import fallito.

**Gate G3 — Offline mobile:** install/cache, run offline, resume, no forced reload e test su iOS/Android reali. Documentare limiti del browser non controllabili.

**Gate G4 — UI e sicurezza:** 96 combinazioni, contrasto e focus, input escaped, validazione ZIP, sicurezza URL remoti; bug critici = zero, bug major con dati/perdita procedura = zero.

**Gate G5 — Rilascio:** commit tag/versione, deploy Pages, smoke su URL reale, export+reimport di fixture non sensibili, backup consigliato nella UI; documentazione d'uso minima e limiti clinici corretti.

## 8. Report test standard

Ogni phase handoff deve riportare:

```text
Phase ID:
Commit/ref:
Implementato:
File principali:
Test eseguiti: (comandi reali + risultati)
Manual QA eseguita:
Screen pages toccate:
Contratti verificati:
Limiti/bug aperti:
Migrazioni/compatibilità:
Prossima fase pronta? Sì/No + motivo
```

**Regola:** se un test non è stato eseguito, scrivere `NON ESEGUITO` con ragione, mai `pass` presunto. Se l'ambiente non ha browser reale, non sostituire risultati manuali con screenshot demo.
