# ADR-010 — Runtime pinned e percorsi effettivi

Data: 2026-10-31. F09, master v3.8 Pages 03/04 e §19. Nessun cambiamento dei contratti.

Il reducer riceve run, Ready, evento e timestamp; restituisce un risultato serializzabile senza I/O, clock o UUID. La Ready conserva l'unico DAG. Il formato runtime v1 registra visite con scelta OR, token/cursori per attività, gruppi richiesti e journal ordinato di riferimenti. Start, Multitask ed End non contano come passi. La proiezione calcola ordinali globali e limiti di lunghezza considerando le attività pendenti; W08 produce totale sconosciuto e interruzione distinta dall'End authored.

Back usa la provenienza registrata nella branch, compresa l'ultima attività che ha rilasciato una continuazione. La stessa risposta riusa il percorso conservato; una risposta diversa elimina il futuro dipendente e i gruppi generati, invalidando i gate degli antenati. Le attività indipendenti completate restano intatte. Riaprire una Done richiede conferma. Le attività annidate mantengono focus e cursori indipendenti. Gli End interni terminano l'intera procedura soltanto con edge esplicitamente autorizzato verso Stopped/Escalation.

Il formato F01 resta leggibile nella stessa tabella DB v4. Non si riscrive alcun record all'apertura. Resume converte solo scaffold iniziali o percorsi lineari con scelte esplicite ricostruibili; una storia parallela insufficiente resta conservata e richiede Restart confermato. Nessuna scelta viene indovinata. I riferimenti normalizzati sono remappati dall'import interno additivo; il formato archivio rimane F13/F14.

I comandi rileggono run e sua Ready nella transazione, verificano la versione mostrata all'utente e salvano ogni transizione prima di risolvere. Due comandi sulla stessa versione producono un commit e un conflitto. Quota/abort non avanzano il cursore. Restart conserva identità, data iniziale e pin; Exit confermato e handoff dall'End eliminano solo la run indicata. Una nuova Ready non altera sessioni precedenti. Repository e servizio espongono valori distaccati, senza Dexie nei componenti.

Prove: reducer OR/AND annidati, 2–32 attività, invalidazione e gate, roundtrip JSON, conteggi confrontati con percorsi enumerati, legacy, remapping, rollback, doppio tap, nuova Ready; Playwright usa gli stessi comandi su IndexedDB reale dopo reload. La UI Page 03/04 è F10; Map completa F11 e avvio a freddo offline F15.
