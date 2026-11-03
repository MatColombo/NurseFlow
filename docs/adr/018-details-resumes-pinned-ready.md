# ADR-018 — ripresa della Ready storica da Details

3 novembre 2026 · F16 · correzione del contratto esistente master §02/§19.3 e dati04 §1/§5.

L'audit trova una sessione importata valida con pin v1 e puntatore corrente v3. Il repository Details filtrava soltanto sessioni con pin uguale alla Ready corrente; l'utente vedeva Start, mentre la sessione v1 restava nel DB e richiedeva un deep link non disponibile nella UI. Il vecchio round-trip di test usava direttamente quel deep link e non provava il pulsante Resume.

Details ora seleziona la sessione salvata più recentemente della stessa procedura, valida il suo vero pin e presenta il già previsto Resume. Il comando riprende esattamente l'ID della sessione senza crearne una nuova. Versione visibile e Map corrispondono alla consultazione che Resume aprirà, come richiesto da “Map always uses the same revision as the visible Start action”. La Ready corrente resta distinta e immutabile; dopo Exit confermato o handoff End, Details espone la Ready corrente. Edit continua a usare la working Draft o la Ready corrente. Nessun nuovo pulsante, selettore o flusso.

La precedente asserzione F11 che chiedeva una Map nuova mentre l'azione primaria riprendeva il vecchio pin è sostituita da una verifica più completa: Resume+Map vecchi, sessione intatta durante inspection, Exit esplicito, poi Map corrente. Il Full round-trip apre realmente Details e preme Resume per OR/AND storiche prima di provare la nuova Ready. Unit/storage verificano lettura senza mutazioni e nessuna sessione sostitutiva; la stessa prova viene eseguita sul vero hosting Pages.
