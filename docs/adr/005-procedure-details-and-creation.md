# ADR-005 — Details, metadati e nuova Draft F04

Data: 30 ottobre 2026. Stato: Accepted. Ambito: dettagli implementativi delle Pages 02/06 frozen, senza variazioni ai contratti.

## Revisioni e navigazione

Details legge un unico snapshot transazionale di procedura, revisioni, gruppi e sessioni. Verifica proprietario, stato e riferimenti; non usa una revisione alternativa se quella richiesta manca. Draft-only mostra Modifica/Anteprima/Mappa; Ready-only mostra Avvia/Mappa/Modifica; Ready+Draft mostra Avvia Ready/Mappa/Continua modifica. Le route portano l'ID della revisione scelta e il destinatario verifica l'appartenenza. Mappa e Anteprima non scrivono sessioni.

L'editor di una Ready-only riceve una copia detached della Ready, identificata come copia di lavoro; entrare, ricaricare e uscire non chiama `createDraft`. Il primo cambiamento del grafo sarà il confine di creazione della Draft in F05. Il comando F01 rimane disponibile per quel momento. Nuove procedure e duplicati hanno invece una vera working Draft già salvata prima di aprire il Builder.

`startOrResumeReady` controlla la Ready attesa, Start, riferimenti, assenza di cicli e outlet mai assegnati. Broken storico rimane distinto e non diventa End. In una transazione riusa una sessione salvata della medesima revisione, incluso un End authored già raggiunto, oppure salva il minimo stato iniziale pinned su Start. Un errore di avvio offre recupero/Retry della Ready e accesso al grafo. Non implementa transizioni o completamenti della run: F09/F10 restano separati. Una Ready più recente non riscrive sessioni precedenti.

## Metadati e creazione

Schema di input dedicato ai metadati, senza accettare ID di revisioni o flag Ready. Colori/icone sono le allowlist già usate in Library, ora condivise nel dominio. Tag e alias vengono normalizzati per matching, conservando casing e testo authored; nessuna traduzione di contenuti. Il limite 120 caratteri governa la creazione; titoli storici più lunghi non vengono troncati leggendo o modificando altri metadati.

L'autosave serializza snapshot di metadati e li unisce al record corrente in transazione, preservando favorite, recenza, puntatori e graph. Il modulo mantiene gli input su errore e offre Retry; Fine/chiusura attende il commit, senza un secondo pulsante Save. La creazione usa il comando atomico F01, con un solo Start editoriale verso `unassigned`, senza istruzioni precompilate o Ready implicita. Aprire Altri dettagli o creare un gruppo non crea la procedura.

Il picker gruppo riusa il dialog F03; i suoi dialog sono resi fuori dal form mediante portal e il submit del gruppo non propaga al form procedura. Questo impedisce la creazione involontaria di una procedura con Enter nel nome gruppo. La selezione nuova conserva titolo, tag e opzioni del form.

HashRouter rimane il router. Un dispatcher POP viene installato prima della sua sottoscrizione e consente ai form attivi di consumare Back prima dell'unmount. Il form New ripristina la posizione prima della conferma Scarta/Continua; lo sheet metadati chiude dopo aver atteso i salvataggi. Le entry hash native con stato privo dell'indice del router vengono normalizzate nel percorso Back. Registrazione e rimozione dei guard usano il layout effect: il cleanup sincrono all'unmount impedisce che un handler dello sheet appena chiuso intercetti la navigazione successiva, race riprodotta in WebKit. Per uscita/reload del documento con scritture/input pendenti si usa il meccanismo `beforeunload` del browser.

## Azioni More e conservazione dati

Duplicazione: nuova procedura e nuova Draft in transazione, nuove identità editoriali per nodi/esiti/attività/fasi/media e convergenze preservate. I Blob locali immutabili rimangono condivisi per riferimento; non viene introdotta GC. Il gruppo resta quello dell'originale. La copia nasce Draft e non modifica Ready o run dell'originale.

Archive/Restore modificano il flag locale e preservano tutto il contenuto; l'elenco Archiviate è raggiungibile dal menu Library già previsto dalla master. Delete richiede conferma esplicita e rimuove procedura/revisioni atomicamente soltanto in assenza di sessioni salvate. Un capability interno associato alla singola transazione autorizza la rimozione delle sole revisioni del proprietario controllato; aggiornare o cancellare normalmente una Ready resta vietato. Qualsiasi sessione pinned blocca la rimozione. Blob immutabili e gruppi non vengono rimossi da questa operazione.

Esporta/Esporta prima aprono la destinazione 11A con l'identità selezionata. Il formato portable, preparazione file e download sono F13: F04 non introduce un secondo formato JSON o messaggi di export completato. Il destinatario rimane esplicitamente incompleto finché quella fase non è implementata.

## Verifica

Test di dominio e persistenza per stati, metadati, Ready immutabile, sessioni pinned, copie indipendenti, rollback e ricarica della nuova Draft. E2E con IndexedDB reale per Pages 02/06, interazioni con Library, gruppi nel form, Back nativo, errore quota/Retry, localizzazione e scala 4/13/30/48pt a 320px. Nessuna dipendenza o migrazione DB aggiunta. Esiti effettivi nel [report F04](../reports/F04.md).
