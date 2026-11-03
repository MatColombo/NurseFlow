# Correzione gate GitHub Pages — Graph 48pt

Data: 3 novembre 2026. Riferimento: [ADR-021](../adr/021-oversized-graph-focus.md).

## Errore riprodotto

Il log GitHub dell'utente mostra **813 E2E PASS, 4 SKIP e 2 FAIL**:
`Graph 320px/48pt` e `Outline a 48pt conserva lo scroll`, entrambi WebKit.
La compilazione non era il passaggio fallito: il gate E2E impediva il deploy.

Riprodotti localmente entrambi i timeout senza modificare i test originali.
L'hit-test ha mostrato il centro della prima uscita a circa 754.86px,
oltre il clip del canvas che terminava a 754.27px. Il click arrivava
al contenitore `builder-scroll`, come nel log CI.

## Correzione

Il focus della camera riserva header e prima uscita, inclusi i bordi,
quando la card supera l'altezza del canvas. Posizionamento dei nodi,
scala globale, zoom, pan e contenuti restano invariati. Le card piccole
mantengono esattamente il comportamento precedente. Nessuna modifica
alla pipeline, nessun incremento dei timeout, `force` o skip dei test.

Aggiunti un test di geometria e una regressione browser con hit-test
`elementFromPoint`, seguita da un click normale sull'uscita.

## Verifiche

- Prima della correzione: entrambi i test CI falliscono anche su WebKit
  Windows locale; fallisce anche la nuova regressione.
- Dopo la correzione: i due scenari originali più la regressione,
  **3/3 PASS su WebKit**.
- Lint: PASS.
- `npm run typecheck`: PASS.
- `npm run test -- --maxWorkers=2`: **453/453 PASS**, 59 file.
- `npm run build`, eseguito anche dal webServer Playwright: PASS.
  Restano gli avvisi preesistenti sulla dimensione del bundle e su
  `inlineDynamicImports` deprecato.
- Suite Graph completa e nuova regressione nei tre browser con
  `REPOSITORY_NAME=NurseFlow` (base `/NurseFlow/`): **60/60 PASS**,
  nessuno skip o retry. Eseguita con
  `npx playwright test graph.spec.ts graph-focus.spec.ts`.

GitHub Actions Linux non è eseguibile da questo ambiente Windows (WSL
non installato). Il nuovo esito remoto richiede il push e una nuova CI.
Test su dispositivi fisici iOS/Android: **NON ESEGUITO**.
