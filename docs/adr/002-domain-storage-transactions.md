# ADR-002 — Dominio, Dexie e transazioni F01

Data: 29 ottobre 2026. Fase: F01. Stato: Accepted.

## Decisione

Si adottano Dexie 4.4.7, Zod 4.6.7 e fake-indexeddb 6.2.6 con versioni esatte nel lockfile. Schemi strict e tipi inferiti mantengono un unico contratto per input dei comandi e letture dai repository. Il dominio non importa UI o storage; i servizi restituiscono valori separati, mai tabelle. La factory pubblica non apre il database all'importazione e non carica fixture.

`NurseFlowDB` v1 definisce `procedures`, `groups`, `revisions`, `mediaAssets`, `runSessions`, `settings`, `uiPreferences`. L'audit facoltativo `importReceipts` non è necessario in F01. Non si indicizza `favorite`: IndexedDB non ammette chiavi booleane; i futuri filtri usano il valore del record senza introdurre una copia divergente. Blob separati dai metadati di libreria; indice hash non univoco, nessuna deduplicazione implicita.

La v2 aggiunge `editVersion` alle revisioni e `saveVersion` ai run soltanto se assenti. Timestamp uguali non rendono sicuro un confronto ottimistico, perciò i token numerici crescono a ogni salvataggio. `revisionNumber` numera le pubblicazioni Ready; il token di autosave è indipendente. Ogni versione resta dichiarata e i futuri upgrade si aggiungono senza riscrivere v1/v2. La migrazione non elimina store, campi, procedure o media.

Le protezioni Dexie su update/delete di Ready e asset sono installate nell'evento `ready`, dopo l'upgrade: la migrazione verificata può aggiungere metadati tecnici a snapshot storiche, mentre le transazioni applicative non possono sovrascriverle. Nessuna cancellazione o GC degli asset in F01; tutte le Ready storiche e le run rimangono conservate. Le connessioni si chiudono su `versionchange`; la gestione UI di blocked/refresh è F15.

## Unità atomiche

- Create/update Draft: procedura, revisione, eventuali nuovi asset; verifica gruppo nella creazione. Per una procedura Ready-only, `createDraft({ procedureId })` copia la Ready in una Draft indipendente con riferimenti ad asset immutabili; se una Draft è già presente la riapre senza duplicarla. Il grafo può essere incompleto, ma gli ID e i riferimenti live devono essere coerenti.
- Ready: rilettura della Draft durabile, controllo del token, validazione pura, `add` di una nuova snapshot e aggiornamento del puntatore. La Draft rimane disponibile; la precedente Ready e le run non vengono scritte. Il validatore riceve una copia separata per non alterare lo snapshot del commit.
- Run: salvataggio di un unico record serializzabile con riferimento a Ready immutabile, controllo dei riferimenti e token contro overwrite concorrenti. Nessuna transizione di dominio è anticipata rispetto a F09.
- Import: schema e remapping prima della transazione; gruppi, asset, revisioni, procedure e run con soli `add`/`bulkAdd`, in un'unica transazione per tutti i batch. Nessun catch intermedio che permetta commit parziali. Settings assenti dall'API e dal perimetro della transazione.

Gli ID interni dei grafi hanno namespace per procedura, stabile fra le sue revisioni; file diversi mantengono namespace indipendenti. Si remappano nodi, outcome, attività, fasi, media, layout, warning e progressi dei run. Un asset assente riceve comunque un nuovo riferimento senza inventare bytes (W07); una collisione con asset locali viene rifiutata. `broken.formerNodeId` rimane storico, senza trasformarlo in un collegamento live. Si creano solo gruppi e asset necessari alle procedure presenti nei batch.

Ogni callback transazionale esegue soltanto I/O IndexedDB e operazioni pure. UUID/timestamp/schema e remapping sono preparati prima; il caller deve completare lettura file, hashing, compressione e parsing prima di invocare i comandi. Errori DB/quota non sono convertiti in successi: la promise del comando si risolve soltanto al completamento della transazione.

## Confini delle fasi

`markReadyUnitOfWork` e import Ready richiedono un validatore sincrono; risultati Promise, validator assente o Problems fanno fallire l'unità. I test usano un doppio esplicito escluso dalla build. Nessun validator P01–P12/W01–W08 permissivo viene fornito all'app. F08 completerà la validazione e la UI di consenso; l'import Ready userà la stessa validazione strutturale senza obbligo di nuova conferma personale.

`RunSession` è lo scheletro minimo del contratto 04 con token aggiuntivo. F09 introdurrà i checkpoint canonici Back/redo con una migrazione versionata. Gli input import sono record interni, non archivi accettati direttamente: manifest, checksum, limiti ZIP, preview e routing scope restano F13/F14. Lo schema URL non esegue rete; controlli effettivi di caricamento/redirect e media appartengono a F07. Settings import con consenso separato rimane F14.

Alternative considerate: upsert import, aggiornamento della stessa Ready, mutazione Draft per pubblicarla, confronto tramite soli timestamp. Scartate perché permettono sovrascritture o riferimenti/run divergenti. Nessun impatto sulle pagine congelate o sui contratti approvati.

## Accettazione e rollback

Test su fake-indexeddb e IndexedDB reale Playwright Chromium/Firefox/WebKit: riapertura, immutabilità, batch ripetuti con ID uguali alla sorgente, convergenza, W07/W08, run AND, quota simulata dopo scritture parziali, conflitti e migrazione v1→v2. Upgrade fallito deve mantenere v1 leggibile; riaprire v2 non modifica dati. I risultati effettivi sono nel [report F01](../reports/F01.md).

Gli E2E storage usano profili persistenti temporanei separati, gestiti e rimossi da Playwright. Il WebKit Windows disponibile in questo ambiente rifiuta i Blob nei context privati con `UnknownError: Error preparing Blob/File data to be stored in object store`. La riproduzione senza Dexie conferma: Blob fallisce nel context privato, riesce nel profilo persistente; ArrayBuffer riesce in entrambi. Si testa quindi la persistenza nel profilo normale senza cambiare il formato contrattuale o saltare test. L'esito non certifica storage in navigazione privata o Safari iOS: gli errori continuano a propagare atomicamente. [API ufficiale dei profili persistenti](https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context).

Non si propone downgrade distruttivo dello schema. Un problema di migrazione va corretto con nuova versione non distruttiva; un upgrade fallito è annullato da IndexedDB. In test si cancellano soltanto DB isolati con nomi casuali. Nessun DB personale è aperto dai test o dalla shell F00.

Riferimenti: [transazioni Dexie](https://dexie.org/docs/Dexie/Dexie.transaction()), [bulkAdd e rollback](https://dexie.org/docs/Table/Table.bulkAdd()), [upgrade versionati](https://dexie.org/docs/Version/Version.upgrade()).
