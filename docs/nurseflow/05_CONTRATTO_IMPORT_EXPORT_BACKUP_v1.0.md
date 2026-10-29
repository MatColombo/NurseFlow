# NurseFlow — Contratto import/export, backup e compatibilità v1.0

**Ambito:** Pagina 11A `Procedure e libreria` e 11B `Backup app e impostazioni`. **Stato comportamenti:** FROZEN in master v3.8. **Stato specifica formato:** baseline tecnica proposta da usare nello sviluppo, versionabile con migrazioni senza alterare i flussi approvati.

## 1. Quattro tipi di pacchetto e routing

| `packageKind` | Suffix suggerito | UI che accetta | Cosa contiene | Regola di import |
|---|---|---|---|---|
| `procedure` | `.nfproc` | 11A | Una procedura, Draft/Ready e asset referenziati | Aggiunge nuova copia |
| `library` | `.nflib` | 11A | Una o più procedure, gruppi coinvolti, metadati, Draft/Ready e media | Aggiunge nuove copie |
| `settings` | `.nfsettings` | 11B | Configurazione app-only incl. UI scale, lingua, tema e media defaults | Sostituzione solo con differenze + conferma |
| `full` | `.nfbackup` | 11B | Libreria completa, media, settings e sessioni locali salvate con revisioni pinnate | Aggiunge copie di libreria/run; sostituzione settings facoltativa, OFF di default |

La **manifest** (`packageKind` + `formatVersion`) determina il tipo, non l'estensione né il nome file. Per file di categoria sbagliata, **rifiutare senza mutazione** e mostrare testo + CTA per l'altra pagina. Nessuna importazione implicita della parte library da un `full` caricato in 11A. Formati sconosciuti/corrotti: spiegazione e nessun commit.

## 2. UI 11A — export selettivo della libreria

1. Presenta **procedure reali presenti in IndexedDB**, non una lista demo. Ricerca full text per titolo, alias, parole chiave, tag/label e metadati appropriati. Filtri: gruppo, label, priorità dove già disponibili.
2. Espone checkbox per procedure e comandi `Seleziona tutto il gruppo`, `Seleziona visibili`, `Deseleziona visibili`, `Annulla selezione`. **Seleziona gruppo** include tutte le procedure del gruppo indipendentemente dal filtro corrente; `Seleziona visibili` solo quelle risultanti dal filtro.
3. Le selezioni sono mantenute quando cambia ricerca/gruppo/label; conteggio finale = selezionate reali, comprese le non più visibili.
4. Prima dell'export permette **Preview** read-only di una procedura, mostrando titolo, tag, stato Draft/Ready, note, grafo e media non modificati; non avvia una sessione.
5. `Esporta selezione`: 1 selezionata → `procedure`; 2 o più → `library`; zero → disabilitato. `Esporta tutta la libreria` è un comando separato che IGNORA le selezioni correnti e prende un consistente snapshot di tutta la libreria.
6. L'esportazione non altera ID/stato/Ready/Draft né aggiorna `lastOpenedAt` come se la procedura fosse consultata, se non previsto dalla master. Al massimo registra metadati locali `lastExportPreparedAt` dopo esito reale della preparazione.

## 3. UI 11A — import multiplo e selettivo

1. Selezione **uno o più file** contemporaneamente, con possibilità di aggiungerne altri allo staging prima del commit.
2. Per ogni file: rilevazione packageKind → verifica formato/versione, bounds, CRC/hash e schema → parse degli item candidati in staging effimero. Una procedura in due file diversi rimane **due candidati indipendenti** anche se titolo/ID origine coincidono.
3. Tutte le procedure valide partono **selezionate**. Si possono deselezionare una per una, per gruppo o fra i risultati visibili; filtri (parole chiave, gruppo, label) sono lo **stesso motore concettuale** dell'export. La selezione non cambia cambiando filtro.
4. Preview effettiva e READ-ONLY del candidato (outline o graph, contenuto media, Draft/Ready, metadata, warning) senza importazione e senza esecuzione. Deve funzionare anche per un candidato deselezionato; Back mantiene filtri e scroll.
5. Conferma riepiloga file validi/non validi, n selezionate, gruppi nuovi, dimensioni stimate, Ready/Draft, eventuali warning, conflitti di titolo (titoli duplicati sono permessi).
6. Dopo conferma, per **soli selezionati**, generare mappe ID **nuove** per procedure, revisioni, nodi, outcomes, attività, fasi, media, gruppi associati, referenced runs dove applicabile; aggiornare tutti i rimandi, inclusi `pinnedRevisionId`. Gruppi omonimi esistenti non vengono fusi implicitamente; creare nuove copie senza modifica del gruppo originale.
7. Eseguire insert in **un'unica transazione**; su errore nessuna procedura parzialmente importata. Mostrare count aggiunte e W07/W08. Nessuna impostazione cambiata.
8. Una Ready importata resta **Ready immediatamente utilizzabile** se la validazione import e le regole strutturali la ammettono; nessun nuovo Check obbligatorio. Draft resta Draft. W07/W08 non annullano Ready di per sé. File non sicuro/incompatibile respinto.

## 4. UI 11B — impostazioni e full backup

- **Settings-only export**: solo le preferenze dell'app, incluse lingua, theme e slider globale da 4 a 48 pt, limiti/qualità foto, altre preferenze app-only; non includere Libreria o gruppi sostanziali. Non inserire permessi del browser, cache PWA, cookie, device credentials.
- **Settings-only import**: anteprima `Attuale → Importato` per le preferenze cambiate; chiusura/annulla non cambia nulla. Pulsante distinto **Sostituisci impostazioni** → conferma esplicita; solo allora commit settings. Valori sconosciuti/incompatibili rifiutati o migrati secondo regola documentata, mai silenziosamente ignorati.
- **Full export**: libreria completa con gruppi, media, revisioni Draft/Ready e **sessioni salvate** complete di snapshot pinnati, più settings. No cache browser/Service Worker o autorizzazioni OS.
- **Full import**: tutte le procedure e sessioni come copie indipendenti. Switch `Sostituisci anche impostazioni` **OFF di default**. Se ON, mostra diff Current→Imported e richiedi conferma separata. Se l'utente rifiuta quel consenso, mostra esplicitamente la possibilità di continuare **senza** sostituire settings o di annullare l'intero import; non procedere a sua insaputa.
- Se è confermata anche la sostituzione Settings, commit libreria+sessioni+settings atomico, oppure una strategia equivalente con rollback garantito e chiaramente documentata. Mai una situazione finale in cui il messaggio dice import completo ma metà dati mancano.
- Un file di scope `procedure`/`library` caricato in 11B è rifiutato, con CTA `Vai a Procedure e libreria`.

## 5. Formato fisico suggerito

**Baseline:** archivio ZIP binario con file testuali JSON e asset immagine separati, estensione specifica del suo scope; questo evita JSON giganti con tutte le immagini base64. Il protocollo è definito dagli **entry path** e dalla manifest, non dalla libreria ZIP. Un possibile albero:

```text
manifest.json
procedures/<sourceProcedureId>.json
revisions/<sourceRevisionId>.json
groups.json
media/<sourceAssetId>.bin
runs/<sourceRunId>.json
settings.json
```

Per ogni `packageKind`, i file non pertinenti vanno omessi; `settings` non deve contenere `procedures/`, `library` non deve contenere `settings.json`, `procedure` deve contenere esattamente una procedura. `full` contiene tutte le sezioni supportate. I path devono essere relativi, senza `../`, root assolute o nomi duplicati case-folded. Nessun file eseguibile o SVG/script importato.

Manifest minimale esemplificativa (chiavi logiche, schema finale in Zod/Test):

```json
{
  "format": "nurseflow-portable",
  "formatVersion": 1,
  "packageKind": "library",
  "packageId": "source-local-export-uuid",
  "exportedAt": "2026-10-29T14:00:00.000Z",
  "appVersion": "a-semver-at-export",
  "counts": { "procedures": 3, "revisions": 5, "media": 7, "runs": 0 },
  "entries": [
    { "path": "procedures/p1.json", "bytes": 4200, "sha256": "hex-digest-of-actual-entry" }
  ]
}
```

La SHA-256 controlla **integrità accidentale** di contenuto/entry ma non prova l'autenticità o la provenienza, perché chi modifica un file può ricomputarne i digest. Non presentarla come firma crittografica o certificazione clinica. Alla creazione della manifest reale includere **ogni entry** con hash e dimensione, ordinamento deterministico, conteggi coerenti, versioni supportate, media che mancano dichiarati esplicitamente. Il checksum della manifest, se previsto, deve avere un meccanismo non circolare. Per protezione da modifiche malevole servirebbe un sistema di firme/chiavi, non richiesto dall'MVP.

## 6. Compatibilità e versionamento

- `formatVersion` è indipendente da `appVersion` e `schemaVersion` DB. La matrice di compatibilità deve dichiarare versioni importabili e migrazioni sicure.
- Nuovi campi opzionali: default espliciti; nuove enum strutturali: rifiuta se non interpretabili, niente downgrade silenzioso Ready.
- Import di formati sconosciuti: rifiuta con testo leggibile; non aggiungere procedure incomplete nell'illusione che import sia riuscito.
- W07 su asset locale mancante documentato in package: accetta come warning preservando reference storico e placeholder; asset realmente presente ma con digest errato => pacchetto corrotto **rifiutato** (distinto dall'assenza nota).
- W08 su collegamento storico missing/deleted: preservare `kind:'broken'`, locatore e fallback, mantenere Ready se il resto è valido.
- Nel remapping, l'eventuale **formerNodeId** di un W08 resta metadato storico; non reinterpretarlo come nodo esistente solo perché si genera un nuovo ID uguale accidentalmente.

## 7. Limiti e protezione del dispositivo

- Validazione preliminare prima della decompressione completa: numero entry, dimensione compressa e **totale dichiarato non compresso**, percorso, estensioni consentite, profondità/nesting e decompression ratio; rifiuto di ZIP bomb, path traversal, entry duplicati e file anomali.
- I limiti numerici di ZIP/asset importabili vanno fissati in una **ADR basata su benchmark** mobile/iOS: non inventare limiti totali che impediscano una libreria reale senza misurazioni. Avvertire prima di occupare spazio, controllare quota; gli import devono gestire device low-storage.
- Usare parsing con schema e sanitize di tutti i metadati. Non eseguire HTML, JS, URL non sicuri o SVG arbitrari; un file selezionato non deve innescare fetch di URL remoti durante la sola anteprima import se non espressamente attivato dall'utente.
- Il parsing può avvenire in Worker per file pesanti; per prestazioni usare progress affidabile e annullamento prima del commit.
- Export crea Blob/file solo dopo aver realizzato **snapshot coerente**. Download OS/API può essere annullato e non si può verificare sempre la destinazione: UI dice **"File preparato"** o consegna al sistema, non "backup archiviato in sicurezza" se non verificato.
- Nessuna sincronizzazione o upload automatico. Il salvataggio fuori dal browser dipende dall'utente.

## 8. Mappa ID d'import e referential integrity

```ts
interface ImportRemap {
  procedureIds: Map<string,string>;
  groupIds: Map<string,string>;
  revisionIds: Map<string,string>;
  nodeIds: Map<string,string>;
  outcomeIds: Map<string,string>;
  activityIds: Map<string,string>;
  phaseIds: Map<string,string>;
  mediaIds: Map<string,string>;
  runIds: Map<string,string>;
}
```

Generare mappe **per unità di procedura** quando gli ID interni del file non sono globalmente univoci; no collisione tra due file diversi con `nodeId='a'`. Validare tutte le connessioni `nodeId`, gli edge/outcome, `afterAll`, `activity`, media links, ID fasi, gruppi e le revisioni pinnate delle sessioni. Duplicati Ready importati sono copie valide e indipendenti.

## 9. Matrice di verifica specifica

| Scenario | Atteso |
|---|---|
| 11A: export una voce | `.nfproc`, 1 procedura, tutte le revisioni/media necessarie |
| 11A: selezione gruppo con filtro label attivo | Include tutto il gruppo, anche nascosti dal filtro |
| 11A: cambio filtro dopo scelta | Scelta precedente conservata |
| 11A: due file con stessi titoli | Candidati distinti, entrambi selezionati, nuove copie |
| 11A: file settings/full | Rifiuto della singola entry, con route 11B, niente mutazioni |
| 11B: file procedure/library | Rifiuto con route 11A |
| 11B: full con toggle Settings OFF | Libreria/run aggiunti, preferenze identiche |
| 11B: Settings import confermato | Solo impostazioni sostituite |
| 11B: Settings import annullato | Nessuna sostituzione |
| Import Ready valido | Utilizzabile Ready senza nuovo Check in entrambe le pagine |
| Import Draft | Rimane Draft |
| W07 locale mancante | Placeholder+warning; Ready non automaticamente perso |
| W08 broken storico | Interruzione runtime, warning, no false End |
| Manomissione checksum / ZIP bomb | Rifiuto e zero commit |
| Esaurimento quota durante commit | Rollback completo, no messaggio di successo |
| Import 3 volte stessa procedura | Tre nuove procedure con ID disgiunti, originali immutati |

## 10. Non compreso nell'MVP

Cloud sync, pubblicazione online di procedure, import diretto di file di altri software, firma digitale, sharing multiutente, backup automatico su cloud, crittografia password non approvata, merging/deduplicazione distruttiva, download forzato in background. Per includerli in futuro serve contratto versionato separato.
