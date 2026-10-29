# NurseFlow — Registro ADR e decisioni implementative v1.0

**Scopo:** distinguere le scelte funzionali **già congelate** dai dettagli tecnici da chiudere nel codice. Nessuna delle righe seguenti riapre Page 00–11 o il tema pronto soccorso.

## A. Scelte del prodotto già congelate

| ID | Decisione |
|---|---|
| UX-001 | Pagine 00–11 incluse Page 11A/11B: interazioni v3.8 vincolanti |
| UX-002 | Tema infermiera/pronto soccorso e scala unica 4–48pt default 13 |
| UX-003 | OR esclusiva, AND completa tutte attività, Stop/Escalation intero esplicito |
| UX-004 | Draft editabile, Ready immutabile, run pinned e recuperabile offline |
| UX-005 | P02/P04 non assegnato = Problem; W07 missing local image e W08 broken historical = Warning |
| UX-006 | Import procedure e librerie sempre additivo, incluso full backup |
| UX-007 | Ready valida mantiene Ready in 11A e 11B; Draft resta Draft |
| UX-008 | Settings import sostituisce solo con diff e conferma esplicita, full OFF by default |
| UX-009 | PWA statica GitHub Pages, nessun account/backend/cloud sync |

## B. ADR da chiudere *dentro* le fasi (non bloccano il bootstrap)

| ADR | Fase | Scelta baseline | Decisione tecnica/benchmark richiesta |
|---|---|---|---|
| ADR-001 | F00 | npm lockfile, Node LTS | versioni installate e supporto browser/CI |
| ADR-002 | F01 | Dexie tables come contratto dati | migration e lifetime degli asset condivisi |
| ADR-003 | F02 | CSS modules + token UI | CSS computations per pt coerenti su browser target |
| ADR-004 | F05–06 | Graph editor su DAG condiviso | libreria canvas/layout o renderer custom, performance a 32 arms |
| ADR-005 | F09 | Run reducer pure + persisted checkpoints | struttura canonica senza denormalizzazioni divergenti |
| ADR-006 | F13 | ZIP versionato + manifest | streaming/libreria, budget RAM su iOS/Android, limiti anti-bomb |
| ADR-007 | F13 | SHA-256 entry + schema validator | limiti di hashing e validazione per file grandi |
| ADR-008 | F15 | Update SW su prompt idle | gestione multitab / versionchange/migration testata |
| ADR-009 | F16 | Device support | lista di browser/versioni realmente testate |

## C. Modello di ADR

```markdown
# ADR-NNN — [Titolo preciso]
Data:
Fase:
Stato: Proposed / Accepted / Superseded
Contesto:
Decisione:
Alternative considerate:
Impatto su dati e compatibilità:
Impatto su UX congelata: nessuno / richiede approvazione
Test di accettazione:
Rollback / migrazione:
```

**Criterio:** se un'ADR cambia il comportamento di una pagina approvata, non basta marcarla Accepted: serve esplicita approvazione di nuova specifica. In particolare non usare ADR per degradare Ready importata a Draft o rendere W08 un Problem.
