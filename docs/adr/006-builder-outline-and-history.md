# ADR-006 — Builder Outline, clipboard e cronologia F05

Data: 30 ottobre 2026. Stato: Accepted. Ambito: implementazione Page 07 Outline secondo master §07.11; contratti approvati invariati.

## Un solo DAG e comandi puri

Outline legge il grafo della revisione effettiva. Nodi canonici resi una volta, collegamenti nominati con riferimenti che portano al nodo esistente; nessun nodo Join editoriale. Un edge è identificato stabilmente dalla tupla nodo/slot/ID esito o attività: riordinare una lista non cambia la selezione del collegamento. Edge e scope usano tuple serializzate, senza assumere che gli ID non contengano delimitatori. Graph F06 consumerà gli stessi comandi, senza convertire Outline in un altro modello.

`domain/builder` separa modifiche, invarianti, clipboard e impact diff. Ogni comando produce un nuovo grafo, senza mutare la sorgente. La verifica strutturale controlla riferimenti, un solo Start, DAG anche nei nodi orfani, massimo 32 voci e appartenenza alle attività annidate. Convergenze nella stessa attività sono valide; cross-arm e uscita anticipata verso la continuazione comune vengono rifiutati. La completezza Ready (minimo 2, etichette e contenuti authored) rimane compito F08: una Draft può avere 0/1 voci, titoli vuoti e outlet unassigned o broken.

L'uscita eccezionale da un'attività usa il flag opzionale `terminateProcedure: true` sull'edge verso un End Stopped/Escalation. Non viene dedotta dal solo tipo End. Il comando dedicato richiede il tipo appropriato e la UI richiede consenso esplicito sulle attività incomplete. Il flag è conservato da duplicazione/remapping; i grafi esistenti senza flag non sono riscritti. `activity-complete` resta distinto da End e non viene assegnato automaticamente a un outlet vuoto.

## Persistenza atomica e storia

DB v4 aggiunge esclusivamente lo store `builderStates`, indicizzato per procedura/revisione. Versioni precedenti restano append-only: nessun aggiornamento di Ready, Draft, run, asset o preferenze durante l'upgrade. I comandi salvano grafo, puntatore della prima Draft e storia nella stessa transazione Dexie. Entrare in una Ready-only non crea una Draft; il primo cambiamento reale crea direttamente la Draft modificata con una voce Undo della sorgente Ready.

La cronologia conserva almeno le ultime 30 transazioni, con snapshot completi di nodi, ID, note, media, fasi e layout. Undo/Redo è un nuovo commit sulla sola Draft; una nuova modifica dopo Undo elimina il ramo Redo. Il token editVersion e il grafo sorgente atteso impediscono di applicare una preview obsoleta. Un writer esterno invalida la storia incompatibile. Ready e sessioni pinnate rimangono indipendenti. Delete esplicito della procedura rimuove anche la sua storia nella medesima transazione.

Il repository restituisce uno snapshot coerente. Il service serializza le scritture e aggiorna la UI solo dopo commit, costruendo il risultato dal comando riuscito: una lettura successiva fallita non può trasformare un salvataggio riuscito in un falso errore. Errori mantengono input/preview e offrono Retry o ricarica confermata. Scroll e selezione vengono salvati separatamente, senza voci Undo né recenza; una view obsoleta non sovrascrive la storia della Draft appena creata. Queste scritture condividono la coda ma non bloccano i controlli, non intercettano la navigazione nativa e non cancellano gli errori contestuali: non sono modifiche pendenti del grafo.

## Clipboard e azioni con impatto

La clipboard è solo memoria dell'app, senza API o permessi del sistema operativo. Copy trasferisce contenuti tra procedure dello stesso dispositivo; Paste genera nuove identità editoriali, conserva riferimenti ai Blob immutabili e crea le definizioni di fase copiate esplicitate in preview. Nessuna GC viene introdotta. La copia di una singola Decision lascia scollegati gli outlet esterni; una semplice Instruction inserita eredita solo il target dell'edge selezionato. La copia di un gruppo/attività include il suo sottografo interno e le regioni annidate, senza copiare destinazioni esterne condivise.

Cut crea un payload pending e non scrive il grafo. Il move è permesso soltanto nella stessa Draft e versione sorgente, con un solo ingresso esterno alla radice e nessun ingresso esterno ai discendenti. Per nodi condivisi la UI mostra i percorsi interessati e richiede di usare Copia o modificare il singolo collegamento. Paste propone entrambi i cambiamenti sorgente/destinazione e conferma un'unica transazione Undo. Cancel/reload lasciano il grafo intatto; reload elimina il payload pending. Una nuova modifica effettiva cancella il Cut ormai obsoleto.

Rewiring, Paste, disconnessione e cancellazione mostrano edge Prima/Dopo, collegamenti invariati, nuovi orfani, aggiunte/rimozioni e associazioni di fase rimosse. Nessuna cancellazione a cascata implicita. Delete di un nodo trasforma tutti gli ingressi in W08 con identità/titolo storici; Undo ripristina le stesse identità. Rimuovere una voce lascia recuperabili i discendenti orfani.

## Navigazione, scala e confini

HashRouter usa revisioni esplicite e verifica proprietario e nodo. La creazione collega e salva prima di aprire Page 08; il suo adattatore F05 verifica il nodo reale, mentre l'editor completo è F07. Preview e Check attendono i commit e ricevono la Draft corrente; renderer e validatore completi restano F08–F10. Graph/auto-layout sono disabilitati con motivo F06. Export apre la futura 11A senza simulare file o successo.

Il guard Back è attivo per sheet, preview, errori e scritture; lo stato pulito già persistito usa la navigazione nativa. Il Back dell'header attende le scritture e torna a Details. I tasti di grafico non intercettano input, textarea, select o contenteditable.

A scala ordinaria scorre solo il pannello Outline e la toolbar resta visibile. Quando la chrome supera lo spazio disponibile, il contenuto usa il normale flusso verticale e la toolbar resta sticky; il pannello mantiene la propria altezza intrinseca, così il contenitore sticky comprende l'intero Outline. Scroll-padding e focus tengono i target fuori dalla toolbar; il ripristino usa lo scroll del documento in questa modalità. Font e geometria continuano a usare i token globali 4–48pt, senza riduzione del testo.

## Verifica

Property test riproducibili con oracolo DAG indipendente, invarianti di scope/ID, copie e selezioni per edge; transazioni con errori quota, migrazione v3→v4, stale preview, 30 Undo/Redo persistenti e rollback. E2E con IndexedDB e router reali per creazione, quattro End, Cut/Copy, 32 esiti/attività, consenso Stop, W08, ritorno/ricarica, errore quota, offline nella shell caricata e 320px a 4/13/30/48pt. Esiti effettivi nel [report F05](../reports/F05.md).
