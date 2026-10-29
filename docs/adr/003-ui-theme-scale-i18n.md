# ADR-003 — Tema, scala, componenti e preferenze F02

Data: 29 ottobre 2026. Stato: Accepted. Ambito: dettagli tecnici del contratto 02, senza modifiche ai contratti approvati.

## Decisione

Colori light/dark in `src/shared/styles/tokens.css`; geometria e ruoli tipografici in `createScaleTokens`. Una sola preferenza intera `uiScalePt` 4–48, default 13. Offset +4/+3/−1/−2 in punti; line-height relativo al font. Spazi ornamentali proporzionali a `(s−4)/9`, nulli a 4pt; icone, raggi e target proporzionali a `s/13`. Target secondari almeno 24px, principali almeno 44px e 56px al default.

Padding di pagina, card, pulsanti e overlay limitato al 4% della larghezza viewport: impedisce che padding annidati consumino il contenuto a 320px/48pt. Il valore a 13pt rimane quello dei token nei viewport previsti. Le icone non si comprimono nel flex; pulsanti e testo vanno a capo. Nessuna trasformazione della pagina, altezza fissa delle card o esclusione della UI dalla scala. Gli input monoriga mantengono il normale scorrimento del testo editabile: i test controllano i loro box, mentre istruzioni, note, etichette e CTA vengono controllate anche per clipping.

`Dialog` usa `<dialog>.showModal()`: backdrop e background inerte nativi, titolo con focus iniziale, Escape/cancel e ripristino del focus. Un ciclo Tab esplicito impedisce anche il passaggio del focus al chrome del browser; considera disabilitati e gruppi radio. `Sheet` riusa lo stesso componente, con allineamento al fondo. Nessun overlay con footer che copra il contenuto. Le icone sono path SVG locali allowlist, mai markup o URL forniti dall’utente. `GalleryFrame` gestisce solo presentazione, slot e placeholder: nessun fetch o gestione asset anticipati da F07.

i18next 26.5.11 e react-i18next 17.1.9, versioni effettive fissate nel lockfile, cataloghi IT/EN incorporati e inizializzazione sincrona senza backend/detector HTTP. La lingua cambia la chrome UI e `html.lang`; i contenuti authored restano testo React invariato. `System` usa `matchMedia` con sottoscrizione ai cambi OS; preferenze esplicite light/dark prevalgono.

Un servizio applicativo collega il provider ai repository e al comando `saveAppearance`. Il servizio proietta esclusivamente lingua/tema/scala; il comando valida e unisce questi tre campi ai Settings correnti dentro una transazione. Nessuna nuova versione DB. Media defaults, UI preferences, procedure, Ready e run rimangono integri. La UI applica subito la preferenza; salvataggi serializzati di snapshot appearance evitano risposte fuori ordine. In caso di errore dell’ultimo salvataggio ripristina l’ultimo stato durabile, mostra errore e Retry, anche dentro lo sheet attivo. Apertura fallita: errore recuperabile senza cancellazione. Nessun falso toast di successo.

Error boundary globale e di route con Retry e link Libreria; nessun invio di stack, dati o telemetria. HashRouter conserva le route master e le due destinazioni 11A/11B. Le pagine future rimangono anteprime tecniche esplicite; solo le preferenze Interfaccia di F02 sono operative. Il resto di Page 10 è F12.

## Verifica e baseline visive

Unit/integration: offset, token, label/nome/descrizione, IT/EN, Escape/focus restore, error boundaries, preferenza OS, salvataggi concorrenti, errori e rollback. Browser: 320/390/768px × 4/13/30/48pt, istruzioni lunghe e titoli di 140 caratteri, Dialog/Sheet con Tab/Shift+Tab, scala/reload/lingua offline e contrasti calcolati dai colori effettivi. Le prove browser hanno rilevato e corretto il passaggio improprio dell’intero record Settings, la compressione delle icone e l’uscita di Tab dal dialog nativo.

Il catalogo `/#/dev/components` è importato esclusivamente in sviluppo e non viene distribuito. Playwright avvia preview production su 4173 e Vite sviluppo su 4174, entrambi con lo stesso `base`. Le prove di persistenza e routing usano la build production; la matrice componenti usa gli stessi componenti/CSS nel catalogo dev. Snapshot 13pt light/dark + Dialog/Sheet: Chromium Windows, font di sistema. CI esegue i confronti visivi su Windows e le prove funzionali su Linux nei tre browser; non confronta raster di sistemi operativi diversi. Aggiornamenti baseline vanno generati e ispezionati su Windows, mai accettati automaticamente da CI.

Risultati e limiti effettivi nel [report F02](../reports/F02.md). I browser Playwright non sostituiscono Safari iOS/Chrome Android fisici o una sessione con screen reader reale. PWA/cache e disponibilità offline dopo riavvio restano F15; l’assenza di fetch per cambiare lingua non dimostra una cache PWA.
