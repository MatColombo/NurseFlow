# ADR-008 — Page 08, autosave e media locali

Data: 31 ottobre 2026. Stato: accettata per i soli dettagli implementativi F07. Contratti v3.8 e pagine congelate invariati.

## Decisione

Page 08 legge e modifica il medesimo `revision.graph` di Outline/Graph. `editStep` contiene comandi puri per contenuti, fase, risposte, ordine e media. I campi opzionali `Alert.additionalText` e `Decision.context` conservano le distinzioni richieste dalla master senza riscrivere revisioni esistenti. DB v4 e otto store invariati, nessuna nuova dipendenza.

Un buffer immutabile raccoglie la digitazione, con debounce di 350 ms e una sola coda di scrittura. Dopo il commit si adotta il grafo normalizzato dal repository soltanto se nessun nuovo input ha sostituito il buffer. Il confronto non provoca salvataggi ripetuti per il solo ordine delle proprietà. `Done`, i cambi strutturali e `Change path` attendono lo svuotamento della coda. Gli errori mantengono input e asset preparati; Retry ripropone la stessa modifica. Un conflitto richiede ricarica esplicita. Nessun successo prima della transazione conclusa.

Le modifiche riusano la cronologia Builder di 30 operazioni. Il primo cambiamento di una Ready-only crea Draft, puntatore, history e nuovi Blob nella stessa transazione. Ready, run pinnate e asset precedenti restano indipendenti. `bulkAdd` non sovrascrive Blob: sostituzione e ricompressione assegnano nuovi asset ID. Undo/rimozione non fanno garbage collection. Il limite Add viene ricontrollato sulle Settings attuali nella transazione; spostare, riordinare o sostituire un elemento esistente non consuma nuove aggiunte.

Il picker di percorso è la vista Graph F06 esistente, con contesto interno per edge, passo/outcome di ritorno e scroll. Non esiste un secondo DAG. Camera e modalità temporanee del picker non sostituiscono le preferenze abituali del Builder. Answer/note vengono salvati prima della navigazione; Apply cambia il solo edge e torna allo stesso outcome. La creazione di un passo apre il nuovo editor soltanto dopo il commit. Il ritorno interno da Page 08 non registra una nuova apertura nei recenti.

`StepContent`, con CSS proprio, è il renderer condiviso di contenuti destinato anche alla consultazione Page 03. Preview usa azioni Run inerti, lasciando disponibili disclosure delle note e zoom delle immagini; non crea sessioni. L'editor di contenuto non include Start/Multitask strutturali. End non ammette media.

## Immagini e risorse

I metadati ordinati per slot sono nel DAG, i Blob nello store `mediaAssets`. Le due gallerie hanno layout e spazio immagine indipendenti; il conteggio totale rimane 32. Il limite globale predefinito 2 riguarda soltanto le nuove aggiunte. Le preferenze media Page 10 sono l'integrazione minima necessaria a F07; il resto di Settings rimane F12.

Prima della decodifica si verificano firma raster, MIME, dimensioni e limiti tecnici di 32 MiB / 48 milioni di pixel. Questi limiti proteggono memoria e decodifica; non costituiscono un nuovo limite al numero di media. Sono coperti da test di rifiuto, ma il consumo di memoria su telefoni fisici resta da misurare. Upload locale: JPEG/PNG/WebP. GIF solo come URL remoto. Nessun SVG/HTML arbitrario viene interpretato.

La pipeline usa decodifica/canvas del browser, mantenendo proporzioni e senza ingrandire: Small 640px, Medium 1280px, High 2048px di larghezza massima; Original mantiene i byte. JPEG rimane JPEG; per PNG/WebP si richiede WebP, conservando il formato effettivamente restituito dal browser se l'encoder non lo supporta. Qualità richiesta .72/.82/.92. Si mostrano dimensioni e byte effettivi prima dell'inserimento. Il target Medium 150–300 KB non è una promessa: il peso dipende dall'immagine e dall'encoder. Il preset globale riguarda le foto future; ricomprimere l'esistente richiede l'azione esplicita.

I collegamenti ammettono HTTPS pubblico senza credenziali, IP letterali, host locali o suffissi SVG. Il parser gestisce anche URL vuoti/parziali senza eccezioni fuori dalla validazione. Per mostrare il remoto si usa fetch CORS senza credenziali/referrer, con redirect vietato, timeout, limite byte e controllo MIME/firma. Il download è effimero e non viene salvato come asset. Un server privo di CORS, un errore o l'assenza di rete producono un placeholder; l'autore può comunque salvare esplicitamente un URL sintatticamente valido. Non si afferma che un link sia disponibile offline. Nessuna risoluzione DNS viene simulata nel validatore puro.

Gli object URL appartengono all'effetto che li crea e vengono revocati a cambio sorgente/unmount. Una lettura terminata dopo unmount non crea URL. Il cambio di caption non rilegge il Blob. W07 rappresenta un asset locale mancante e non impedisce di salvare la Draft. Contenuti, caption, alt e note sono testo React; nessun `dangerouslySetInnerHTML`.

## Verifica e confini

Test di dominio, rollback/stale/soft cap nei comandi, digitazione concorrente, normalizzazione, lifecycle degli object URL e renderer condiviso. E2E con HashRouter/IndexedDB reali e immagini raster generate solo dal test, verifica dei byte/dimensioni e prove a 320px fino a 48pt. Esiti effettivi nel [report F07](../reports/F07.md).

Come già verificato in F01, WebKit Windows rifiuta Blob in IndexedDB nei contesti privati di Playwright. La riproduzione F07 con sole API native fallisce sia per il Blob canvas sia per un Blob ricreato in memoria con `UnknownError: Error preparing Blob/File data to be stored in object store`; entrambe le varianti vengono salvate nel profilo persistente. Gli E2E Page 08 usano quindi profili persistenti temporanei isolati, come `storage.spec.ts`, senza skip o sostituzioni del modello Blob. In navigazione privata non si promette supporto universale; un rifiuto di scrittura resta un errore recuperabile nell'editor.

La prova E13 di F07 attraversa serializzazione dei metadati/byte e il comando reale di import additivo, con identità remappate, ordine e slot conservati e lettura locale offline. Il wire test è escluso dal bundle production. Archivio/file, UI 11A/11B, validatore completo e gate E13 di rilascio restano F08/F13/F14/F16. Nessun validatore permissivo viene aggiunto all'app.
