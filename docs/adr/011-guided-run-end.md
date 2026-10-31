# ADR-011 — Guided Run e End durabili

Data: 2026-10-31. F10, Pages 03/04 congelate della master v3.8. Nessuna modifica ai contratti approvati.

`RunPage` carica la sessione pinnata tramite il servizio F09; `RunScreen` mostra un solo passo e invia eventi con la versione visualizzata. Un lock sincrono impedisce doppi tap prima del render di `busy`. La scheda cambia solo dopo il commit. Quota/abort conservano scheda e versione; Retry ripete l'azione confermata, mentre un conflitto richiede la rilettura e non ripete automaticamente una scelta. Le conferme Exit/Restart/Reopen non scrivono finché non vengono accettate. Gli errori nelle conferme riaprono il contenuto con recupero visibile.

Il renderer condiviso F07 mostra contenuti authored escaped, note, alert e due gallerie nello stesso ordine. Le note essenziali degli outcome restano sotto la propria risposta, le informazioni espandibili non selezionano un ramo. Media e URL temporanei usano il ciclo di vita F07. Nessun testo authored viene tradotto. La fase deriva dal nodo, non dal gruppo Library. Posizione, previous cue e stato attività provengono dalle proiezioni F09.

Una risposta che termina un'attività lo dichiara sulla propria azione esplicita; non aggiunge un secondo passo o un End. Back non elimina la route finché non cambia una risposta. Se si passa a un'altra attività dopo Back, il percorso già registrato nell'attività lasciata continua a contribuire all'ordinale globale; riaprendone il contesto Decision si ricalcolano le alternative. Questo evita posizioni come `4/3` conservando gli ordinali delle visite note.

Page 04 deriva soltanto da un End authored: quattro tipi con icona e testo, conteggio delle visite visibili, messaggio completo e nota opzionale. Un End con titolo/messaggio vuoti mostra un errore specifico senza etichetta di successo. Il tipo mancante nei record precedenti viene letto come Neutral. Library cancella solo la run indicata; Restart confermato conserva il pin, anche dopo una nuova Ready. W08 usa una vista di interruzione senza CTA Continua o falso End. Le sessioni di procedure archiviate restano leggibili senza reinserirle nei Recent.

Il guard POP usa il gestore già installato prima di HashRouter. Un ingresso duplicato dello stesso URL rende intercettabile anche Back da deep link. Back richiama il reducer, al primo passo apre Exit con Stay focalizzato; browser Forward non ripristina scelte abbandonate. Un nuovo hash digitato privo di stato router si comporta come navigazione di documento: la run resta salvata. Unload non promette conferme o cleanup. Il link Map legge la revisione della run e torna alla stessa sessione; il renderer completo Page 05 rimane F11.

## Anteprima Draft e migrazione

La modalità esplicita `draft-preview` riusa lo stesso reducer e le stesse proiezioni, accettando incompletezza editoriale ma continuando a rifiutare cicli, cross-arm e schema invalido. Un outlet unassigned blocca l'avanzamento e mostra il ritorno al Builder; il totale resta `?`. Il percorso non viene trasformato in Ready.

DB v5 aggiunge soltanto `previewSessions`: snapshot Draft immutabile, run e discriminante di modalità. Il grafo di preview è fissato al primo ingresso; modifiche successive della working Draft non alterano la consultazione. Resume, transizioni e cleanup sono atomici e indipendenti da `runSessions`. Il guard impedisce modifiche alla snapshot/identità. La migrazione lascia intatti gli otto store precedenti e aggiunge uno store vuoto; la cancellazione di procedure con preview salvate resta bloccata. Non si eliminano asset, revisioni o preferenze.

## Verifica

Unit test su renderer, nota vs scelta, lock prima del commit, failure, conferme, quattro End, default Neutral e End incompleto; test transazionali per snapshot preview, quota, reload e migrazione v4→v5. Playwright usa dati fittizi in IndexedDB reale e controlla OR/AND, 32 attività, conteggi/range, media W07, Alert, W08, conflitti, quota, End/Resume, Back di sistema, pin dopo nuova Ready e 320px/48pt. Nessuna fixture o harness è incluso nell'app production. Risultati e limiti nel report F10.
