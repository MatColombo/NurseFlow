# ADR-007 — Graph come proiezione del DAG Builder

Data: 30 ottobre 2026. Stato: accettata per F06. I contratti e i layout congelati restano invariati.

## Decisione

Outline e Graph ricevono lo stesso `revision.graph` dal controller F05. `scene.ts` calcola solo identità, porte visibili, coordinate e tracciati SVG: non mantiene un secondo grafo editabile. Il renderer React/SVG è caricato tramite `lazy()` e usa HTML nei `foreignObject` per mantenere controlli nativi, nomi accessibili e lo stesso design system. Nessuna dipendenza aggiunta.

Ogni nodo condiviso ha una sola card canonica; gli ingressi mantengono frecce e selezioni distinte tramite `EdgeRef`. Le attività AND mostrano da una a tre corsie secondo spazio e scala, con indice focalizzato e lista ricercabile completa. Gli OR numerosi usano la stessa presentazione a focus. I passi nascosti restano nel DAG; la ricerca modifica il focus della vista e non i collegamenti. I completamenti di attività hanno frecce derivate direttamente verso la continuazione `afterAll`, anche nei gruppi annidati: nessun nodo join/merge viene aggiunto o mostrato. `afterAll` rimane una porta editoriale reale sul gruppo.

Il picker blocca i comandi estranei, identifica l'esatto edge e conserva revisione/versione attese. Cercare un nodo lo focalizza soltanto; toccarlo propone la modifica. L'alternativa Outline usa lo stesso picker e validatore. Il diff F05 mostra Prima/Dopo, invariati e nuovi orfani prima di Apply. I candidati che introdurrebbero ciclo/cross-arm sono disabilitati con motivo; il comando verifica nuovamente tutte le invarianti nella normale transazione. Non esiste un gesto obbligatorio di trascinamento delle linee.

Pan, pinch, zoom, fit e focus sono metadati della vista. Fit può produrre una panoramica ridotta; il primo tap riporta il passo alla dimensione di modifica prima di consentire azioni. I controlli di zoom e la tastiera offrono alternative ai gesti. La camera è distinta dalla scala UI globale 4–48pt; le geometrie e i testi delle card seguono i token, mentre il canvas contiene intenzionalmente la scena che scorre sotto il viewport.

`uiPreferences.builderMode` conserva l'ultima modalità sul dispositivo; `builderStates.view.canvas` conserva camera e ID focalizzati per procedura. I campi nuovi hanno default Zod compatibili con i record esistenti. Il DB resta v4 con otto store: nessuna migrazione, riscrittura di snapshot o eliminazione di dati. I salvataggi della vista condividono la coda storage senza creare Draft, recenza o voci Undo. Il cambio modalità salva anche l'ultima camera/posizione prima di cancellare il debounce.

Lo scroll della lista temporanea dei target non sostituisce quello dell'Outline abituale. Al termine del picker si ripristina il pannello o lo scroll del documento, secondo la scala. Il calcolo dello spazio disponibile osserva anche i controlli Graph e il contesto del collegamento: se manca spazio verticale, usa il flusso del documento con toolbar sticky, preservando il viewport del canvas e il footer.

Auto layout è invece un comando editoriale sul `graph.layout.positions` esistente: conserva contenuti e collegamenti, usa la stessa transazione e la stessa cronologia Undo/Redo. La prima modifica reale di una Ready-only crea la Draft atomicamente. Posizioni non visibili nella proiezione non vengono eliminate. Le coordinate memorizzate sono normalizzate alla scala 13pt; la geometria calcolata evita sovrapposizioni senza riscrivere dati durante il rendering.

## Verifica e confini

Test di dominio per identità canoniche, frecce dirette, 32 voci, gruppi annidati, focus, geometria e camera; test storage per preferenze, compatibilità dei default, rollback e layout reversibile. E2E su IndexedDB e router reali per equivalenza tra viste, singolo edge, ricerca, cicli/cross-arm, W08, Cut/Paste, errori quota, persistenza e viewport 320/390/768px. Esiti e screenshot nel [report F06](../reports/F06.md).

L'editor contenuti resta F07, Check/Ready completo F08, runtime F09/F10 e Map read-only F11. L'offline di fase riguarda la shell e il modulo Graph già caricati: cache PWA e avvio completamente offline restano F15. Gesti multitouch su dispositivi fisici richiedono verifica manuale.
