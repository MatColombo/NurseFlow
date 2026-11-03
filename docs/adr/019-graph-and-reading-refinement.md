# Raffinamento Graph, attività e lettura — addendum approvato alla v3.8

Data: 2026-11-03. Fonte: richiesta esplicita dell'utente successiva a F16,
punti 1–5. Questo addendum aggiorna soltanto le regole indicate; la master
originale e i suoi hash restano invariati. Non rappresenta una nuova master
v3.9 completa né una riapertura degli altri contratti.

- Builder e Map progrediscono da sinistra a destra. I rami sono separati
  verticalmente, le convergenze conservano una sola identità. Le connessioni
  escono dalla destra e arrivano sulla sinistra con tangenti orizzontali.
  I rami AND conservano la propria corsia anche con lunghezze diverse;
  le linee lunghe convergono nello spazio prima della destinazione,
  senza passare sotto i follow-up delle altre attività.
  Le vecchie coordinate di layout restano nei dati ma non governano la nuova
  proiezione automatica, per evitare archi all'indietro. Nessuna migrazione.
- Nel nuovo authoring, i rami AND contengono istruzioni e avvisi di follow-up,
  terminano sul medesimo successore reale esterno definito da `afterAll`.
  I nuovi passi dei rami sono già terminabili, senza assegnare un seguito
  manuale a ciascuno. Aggiungere un follow-up eredita il completamento.
  Definire il successore comune chiude anche i terminali Instruction/Alert
  ancora `unassigned` dei rami diretti, nello stesso comando atomico e
  annullabile. Nessuna riparazione implicita dei collegamenti `broken` W08
  o degli outcome delle Decision legacy; nessuna modifica alla sola apertura.
  Selezionare quel successore nel picker equivale a completare l'attività:
  non consente di saltare le altre attività. Rimangono espliciti il comando
  di completamento e gli Stop/Escalation eccezionali confermati.
- La rappresentazione durabile resta `activity-complete` + `afterAll`,
  garantendo attesa di tutte le attività, cambio/resume indipendenti,
  Undo/Redo atomico e W08 se il successore viene eliminato. Nessun Join
  visibile e nessun secondo oggetto grafo. Decision/AND annidati già salvati
  rimangono leggibili, modificabili nei contenuti, importabili e utilizzabili
  nelle Ready/sessioni originali; non si riscrivono i dati esistenti.
- Transizioni leggere all'ingresso delle pagine, popup e sheet, feedback
  cromatico dei controlli e scroll fluido fuori dal grafo. `reduced-motion`
  disattiva tutto. Nessun ritardo prima delle scritture o cambio route;
  ripristino dello scroll immediato e nessun remount forzato dei flussi.
- Le note dei passi si aprono inizialmente anche quando espandibili;
  l'autore può ancora renderle non richiudibili. Controllo compatto,
  testo nota della stessa misura del corpo, separatori delicati, didascalie
  meno rilevanti e in corsivo con `fig.n - `, numerate nell'ordine di lettura
  tra le due gallerie. Prefissi soltanto di presentazione, mai riscritti nei
  contenuti dell'autore o nei package.
- Libreria: accenti turchesi più riconoscibili e icona ospedaliera locale,
  senza claim istituzionali; funzioni, accessibilità, scala 4–48pt,
  tre Recent in una riga e rapporto Recent/Library invariati.

Verifica: test di geometria/tangenti, comandi AND e compatibilità legacy,
runtime con successore unico, persistenza/Undo/Redo, note/figure, movimento
ridotto e matrici responsive. Risultati effettivi nel report di questa modifica.
