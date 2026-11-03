# Grafo, authoring e testo — addendum alla v3.8

Data: 2026-11-03. Fonte: richiesta esplicita dell'utente, punti 1–12.
Questa revisione circoscritta integra ADR-019 e i contratti UI/dati;
non riapre Ready, import additivo, runtime AND/OR o altre pagine.

- Frecce con tratto finale orizzontale rettilineo e testa dello stesso colore.
- Nessuno zoom automatico al focus dei campi su telefoni; resta disponibile
  lo zoom manuale di accessibilità e la scala globale 4–48pt.
- Palette esistente per distinguere consultazione, modifica e anteprima;
  tipi di passo e terminazioni riconoscibili anche tramite etichette.
- Creazione attività: nome e primo passo Instruction/Alert in un solo comando
  atomico, seguito immediatamente dall'editor. Nessuna attività opzionale.
- Regioni AND riservate, senza passi estranei all'interno. Terminazioni sulla
  colonna destra, ordinate per tipo, archi terminali colorati e tratteggiati.
- Selezione freccia senza aprire menu: evidenzia arco e due estremi, attenua
  il resto; un secondo click o un altro punto del grafo azzera il focus.
  Le azioni di modifica rimangono disponibili sui pulsanti delle uscite.
- Fase sopra il titolo del passo. Ordinamento visuale dei rami per ridurre
  gli incroci, senza modificare ordine canonico o semantica del grafo.
- Due layout galleria aggiuntivi: massimo 2 o 4 immagini per riga, con reflow
  su schermi stretti; sezioni prima/dopo note distinte. Didascalie centrate.
- Formattazione testo con attributi strutturati opzionali: grassetto, corsivo,
  sottolineato e colori della palette; note anche con elenco puntato.
  Nessun HTML/SVG/CSS arbitrario, nessuna esecuzione di contenuti importati.
  Testi precedenti restano testo semplice; campi opzionali senza migrazioni
  distruttive, incluse persistenza, snapshot e portabilità.

Verifiche e limiti effettivi nel report di fase.
