# ADR-021 — Focus delle card Graph sovradimensionate

Data: 3 novembre 2026. Correzione implementativa, nessuna modifica ai contratti.

Il gate GitHub Pages falliva in due E2E WebKit a 320px/48pt: dopo Find,
il centro del primo pulsante di uscita cadeva appena oltre il bordo inferiore
del canvas. Il click colpiva `builder-scroll`. Riprodotto anche localmente:
centro a circa 754.86px, clip terminante a 754.27px.

La camera riserva ora l'altezza di header e prima uscita, con margine per
i bordi, quando focalizza una card più alta del viewport. Le card che
entrano nel canvas mantengono il posizionamento precedente; zoom, scala,
pan e ordine dei passi non cambiano. Si modificano solo metadati di vista,
senza migrazione, nuova dipendenza o scritture a Ready/run.

Test: geometria pura e hit-test browser tramite `elementFromPoint`, seguito
da click normale. Rieseguiti i due scenari CI: non si usano `force`, timeout
più alti, skip o esclusioni WebKit. Risultati nel report della correzione.
