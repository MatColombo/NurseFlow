# NurseFlow — Contratto dati, grafo, versioni e motore di esecuzione v1.0

**Ruolo:** baseline tecnica concretamente implementabile per il modello; l'interfaccia e i comportamenti sono già congelati in v3.8. **Vincolo:** la forma interna può evolvere con migration e ADR; invarianti e scenari testabili no.

## 1. Invarianti assolute

1. `Procedure.id`, `Revision.id`, `Node.id`, `Outcome.id`, `Activity.id`, `Media.id`, `RunSession.id`, `Group.id` sono **identità**, non titoli o posizioni. UUID/ULID generati localmente; import attribuisce nuove identità.
2. Una procedura può avere `workingDraftId` e `readyRevisionId` contemporaneamente. Il Ready precedente è immutabile durante l'editing.
3. La revisione Ready è una **snapshot**, non un puntatore al Draft che può cambiare. Commit Ready crea nuova revisione immutabile e aggiorna il riferimento attivo in una sola transazione.
4. Una sessione Run conserva `pinnedRevisionId` e puntatori risolti senza utilizzare il Draft corrente. Le sessioni salvate in un backup completo sono importate come copie con revisioni corrette.
5. Library import mai `update`, `upsert` o `delete` su dati già presenti; usa `add` con nuove identità. È **ammessa** soltanto la modifica esplicita di Settings con conferma separata.
6. Il grafo Draft può essere incompleto. Una validazione Ready passa solo con zero Problems; Warning W07/W08 non bloccano da soli.
7. Nessuna informazione di pazienti. Procedure e note sono testo personale dell'autore; l'interfaccia non valuta correttezza clinica.

## 2. Identità e dati principali

```ts
type ID = string;                 // UUID/ULID; non ordine o titolo
type ISODate = string;
type Priority = 0 | 1 | 2;
type UiLocale = 'it' | 'en';
type RevisionState = 'working-draft' | 'ready';
type EndKind = 'completed' | 'stopped' | 'escalation' | 'neutral';

interface ProcedureMeta {
  id: ID;
  title: string;
  description?: string;
  groupId: ID | null;
  tags: string[];
  aliases: string[];
  priority: Priority;
  ribbon: { colorKey: string; iconKey: string }; // allowlist del tema
  favorite: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  lastOpenedAt?: ISODate;  // dettagli, builder, run, non autosave
  workingDraftId?: ID;
  readyRevisionId?: ID;
  archived?: boolean;
}

interface Group {
  id: ID; name: string; order: number; createdAt: ISODate;
}

interface AppSettings {
  id: 'main';
  locale: UiLocale;
  theme: 'system' | 'light' | 'dark';
  uiScalePt: number;               // intero 4..48; default 13
  mediaAddSoftLimit: { enabled: boolean; max: number }; // default on 2; 1..32
  photoPreset: 'small' | 'medium' | 'high' | 'original';
  // altre preferenze di app: solo campi versionati e allowlisted
}

interface LibraryViewState {
  id: 'main';
  sortMode: string;
  collapsedGroupIds: ID[];
  searchText?: string;
  filters?: Record<string, unknown>;
  recentProcedureIds: ID[];         // UI max 3 recenti + overflow max 20
}
```

La parte visiva dei gruppi e le preferenze filtro possono essere incluse in settings export, ma le **procedure** e i **gruppi effettivi** appartengono alla libreria, non ai Settings. Un import delle sole impostazioni non modifica procedimenti o gruppi.

## 3. Modello editoriale del DAG

### 3.1 Connessioni con tre stati realmente distinti

```ts
type Destination =
  | { kind: 'node'; nodeId: ID }            // collegamento attivo e valido
  | { kind: 'unassigned' }                  // non ancora selezionato -> Problem
  | { kind: 'broken'; formerNodeId: ID; formerTitle?: string } // riferimento storico -> W08
  | { kind: 'activity-complete' };          // solo endpoint di un'attività AND
```

**Non** rappresentare W08 con `null`, poiché `null` rappresenta l'outlet da compilare. `activity-complete` è distinto dal vero `End` di procedura e non apre Page 04. Una connessione verso `End` è `kind:'node'` con target un vero End. Una uscita anticipata autorizzata da AND termina in **un vero End di tipo `stopped` o `escalation`**, con conferma dell'intenzionalità e senza marcare completate le altre attività.

### 3.2 Struttura dei nodi

```ts
type Node =
 | { id: ID; kind: 'start'; next: Destination }
 | { id: ID; kind: 'instruction'; title?: string; text: string;
     phaseId?: ID | null; note?: StepNote; media: StepMedia[];
     galleries: GalleryPrefs; next: Destination }
 | { id: ID; kind: 'alert'; title?: string; text: string;
     phaseId?: ID | null; note?: StepNote; media: StepMedia[];
     galleries: GalleryPrefs; next: Destination }
 | { id: ID; kind: 'decision'; question: string; title?: string;
     phaseId?: ID | null; note?: StepNote; media: StepMedia[];
     galleries: GalleryPrefs; outcomes: DecisionOutcome[] }
 | { id: ID; kind: 'multitask'; title: string; phaseId?: ID | null;
     activities: TaskActivity[]; afterAll: Destination }
 | { id: ID; kind: 'end'; endKind: EndKind; heading: string;
     message: string; note?: StepNote; phaseId?: ID | null };

interface DecisionOutcome { id: ID; order: number; label: string;
  note?: StepNote; destination: Destination; }
interface TaskActivity { id: ID; name: string; order: number;
  first: Destination; required: true; }
interface StepNote { text: string; visibility: 'expandable'|'always-visible'; }
interface Phase { id: ID; name: string; order: number; }

interface GraphSnapshot {
  schemaVersion: number;
  phases: Phase[];
  nodes: Node[];                     // ID stabili per la revisione
  // Se servono edge records separati, usare ID stabili e mapping bijettivo
  layout?: { positions: Record<ID, {x:number;y:number}> };
}
```

**Validazioni aggiuntive:** fase assegnata deve esistere; per le attività, i nodi appartenenti a ciascun braccio vanno tracciati con derivazione strutturale/ownership esplicita in indice e non possono saltare a un altro braccio; tutte le attività terminano esplicitamente con `activity-complete` oppure con early stop autorizzato. Grafo aciclico. OR con 2–32 outcomes, AND con 2–32 bracci in Ready. Nodo condiviso = una sola identità canonica, potenzialmente diversi collegamenti in ingresso.

### 3.3 Convergenza ed editing

- `Create next step` su un outlet vuoto crea **node + collegamento** atomicamente e apre Page 08. Non richiede step già esistente.
- `Go to existing step` crea riferimento a un ID canonico esistente, verificato contro cicli e cross-activity.
- `Insert before` crea un nuovo nodo *sul collegamento selezionato*, senza alterare altri ingressi allo stesso target.
- Se un esito `No` collega a `End(stopped)`, è un path breve valido, non dead-end.
- Copy/Cut/Paste: Cut resta pending fino alla conferma della destinazione; Move atomico; cancellare un nodo può registrare destinazioni spezzate con metadata W08 anziché perdere informazioni di collegamento.
- Riorganizzare gli outcomes cambia l'ordine visuale, non IDs/destinazioni.
- Undo/Redo operano sui comandi di modifica del Draft, non mutano le versioni Ready o run in corso.

## 4. Media e gallerie

```ts
interface StepMedia {
  id: ID;
  slot: 'before-note' | 'after-note';
  order: number;
  source:
    | { kind: 'local'; assetId: ID; mime: 'image/jpeg'|'image/png'|'image/webp' }
    | { kind: 'remote'; httpsUrl: string; expectedMime?: string };
  caption?: string;
  altText?: string;
}
interface GalleryStyle { layout: 'stacked-thumbnails'|'side-by-side'|'full-width';
  imageSpace: 'compact'|'medium'|'large'|'natural'; }
interface GalleryPrefs { beforeNote: GalleryStyle; afterNote: GalleryStyle; }
interface MediaAsset { id: ID; blob: Blob; sha256: string;
  mime: string; bytes: number; width: number; height: number; }
```

- Massimo **32 media combinati** per step, in entrambe le gallerie. Soft cap app globale default `On: 2`, modifica solo aggiunte future; la disattivazione non supera il limite schema 32. Compressione solo al nuovo import locale e con preset, mai retroattiva.
- W07 asset referenziato assente/illeggibile non cancella testo/Ready: placeholder + warning. W01/W02 link remoti offline/non verificabili con fallback. W03/W04 altri warning conformi alla master.
- Non usare URL `blob:` persistiti come riferimento a lungo termine: ricreare objectURL da Blob al render, revocarlo su cleanup.
- Export include media locale utilizzato da revisioni, Draft, Ready e run importabili; se manca asset, esportazione dichiara nella manifest una voce mancante (W07) e l'import non finge che il Blob sia presente.
- Media condiviso per riferimento tra più revisioni è permesso **soltanto se immutabile** e con reference-count/GC conservativo; niente cancellazione fisica finché Ready/run/import snapshot lo usa.

## 5. Revisioni e sessioni

```ts
interface RevisionRecord {
  id: ID;
  procedureId: ID;
  state: RevisionState;
  revisionNumber: number;
  graph: GraphSnapshot;
  createdAt: ISODate;
  updatedAt: ISODate;
  confirmedForPersonalUseAt?: ISODate; // solo Ready
  validatorSchemaVersion: number;
  warningsAtConfirmation?: { rule: string; locationId?: ID }[];
}

type RunStatus = 'active' | 'ended' | 'interrupted';
interface RunSession {
  id: ID; procedureId: ID; pinnedRevisionId: ID;
  status: RunStatus;
  currentNodeId: ID;
  visited: Array<{ nodeId: ID; outcomeId?: ID; previousActivityId?: ID }>;
  multitaskProgress: Record<ID, {
    completedActivityIds: ID[];
    cursorByActivityId: Record<ID, ID>;
    pathByActivityId: Record<ID, ID[]>;
  }>;
  terminalEndNodeId?: ID;
  startedAt: ISODate; updatedAt: ISODate;
}
```

**Controllare il modello run durante l'implementazione**: il tipo sopra è un *minimum skeleton*, non una rappresentazione completa della macchina a stati. Serve anche una history di checkpoint per Back, decision redo, previous-step cue, conteggio route-aware, ripresa task indipendenti e re-open con conferma. Non memorizzare simultaneamente strutture duplicative non sincronizzate: una state machine pura e serializzabile deve produrre un solo stato canonical da persistere.

### Transizioni del run engine

`startReady(revisionId)` → `enterStep(nodeId)` → `chooseOutcome(outcomeId)` oppure `continueStep` → `switchActivity(activityId)` / `completeActivity(activityId)` → `afterAll` → `enterEnd` / `interruptBrokenPath`; `back`, `resume`, `reopenActivity`, `confirmedExit`, `confirmedRestart`.

Tutte le transizioni restituiscono `Result<NewRunState, Error>` senza side effects; lo storage persiste `NewRunState` **prima** che la UI dichiari il cambio concluso. Le sessioni non possono cambiare snapshot a metà run. Back dopo divergenza tronca selezioni future incompatibili e completa i checkpoint/indicatori.

Tre terminali **non equivalenti**: (A) **End** authored → Page 04; (B) **activity-complete** → marca un braccio e valuta gate, ma non Page 04; (C) **broken** W08 → interruzione recuperabile con Back/Map/Exit e run pinned integro.

## 6. Algoritmo validator — precedenza

1. Verificare sintassi/schema di Revision, node/phase/media IDs e classificare connessioni.
2. Connessioni `kind:'broken'` → W08. **Escluderle da conteggi P02/P04/P05/P11** come se fossero unassigned o corruzione ulteriore; a runtime sono interrotte.
3. Connessioni `kind:'unassigned'` su outcome/continuazione necessaria → P02/P04. Start mancante/malformato → P01.
4. Controllare 2–32, etichette, corrispondenza ID, reachability, acyclic, condizioni multiactivity, nodi orfani, testi obbligatori.
5. Media local asset missing → W07; media schema/URL non valido, cap >32 → P12.
6. Applicare P01–P12, W01–W08 come matrici master. Zero Problems consente conferma Ready previo acknowledgment e transazione riuscita; Warning visibili.
7. `checkDraft` non modifica graph e produce issue ID stabile; `Mark Ready` rilegge ultima revisione durably committed e ricalcola prima del commit atomico.

**W06** esiti semanticamente quasi identici: solo analisi deterministica della normalizzazione di testo/nota, non giudizi clinici automatici; nessuna penalità per il solo target condiviso.

## 7. Schema IndexedDB proposto

| Tabella | Chiave | Indici consigliati | Politica |
|---|---|---|---|
| `procedures` | `id` | `groupId, lastOpenedAt, favorite, priority` | Editing ordinario sì, import solo add |
| `groups` | `id` | `order, name` | Import crea nuovi ID |
| `revisions` | `id` | `procedureId, state, revisionNumber` | Ready write-once |
| `mediaAssets` | `id` | `sha256` | Blob immutabile |
| `runSessions` | `id` | `procedureId, pinnedRevisionId, status` | Pinned snapshot |
| `settings` | singleton `main` | — | Solo modifica locale / import con conferma |
| `uiPreferences` | singleton `main` | — | Preferenze di visualizzazione |
| `importReceipts` | `id` | `importedAt, sourcePackageId` | Facoltativa, audit locale senza tracciamento |

I blob grandi non vengono tenuti nella stessa store dei metadati di elenco, per non trascinare file interi nella ricerca. Aggiornamenti schema versionati e idempotenti, migrazioni testate su copie e backup. Non conservare `undefined` con ambiguità nei contratti serializzati: schema dichiara campi opzionali e default.

## 8. Atomicità: comandi esemplari

```ts
async function markReady(procedureId: ID): Promise<RevisionRecord> {
  // 1. await fuori tx: commit degli autosave in sospeso e snapshot da DB
  // 2. validazione deterministica snapshot corrente, ricontrollata nell'unità
  // 3. nella STESSA tx: rileggere draft/version token, abort se cambia;
  //    add nuova revisione ready immutabile e update pointer procedure
  // 4. su failure: nessun nuovo pointer/Ready e UI mostra errore
  throw new Error('illustrative contract, not implementation');
}
```

| Comando | Atomicità richiesta |
|---|---|
| Create-next-step | Nodo e outlet insieme, mai nodo orfano per errore intermedio |
| Make Ready | Snapshot Ready nuovo e puntatore a Ready coerenti |
| Edit draft | Commit di graph+media+revision token coerente |
| Advance run | Checkpoint/attività/cursore e reference pinned coerenti |
| Import batch | Tutte le entità selezionate + media + remap, o niente |
| Replace settings | Soltanto settings, dopo conferma; libreria invariata |
| Full import con settings opzionali | Conferma distinta; evitare stato misto non autorizzato |

Le operazioni di file input, hashing, compressione e parsing **avvengono fuori** dalla transaction Dexie; questa contiene esclusivamente operazioni IndexedDB e validazioni pure già disponibili. Gestire esplicitamente `QuotaExceededError`, `TransactionInactiveError`, tab chiusa, schema incompatibile e conflitti di versione.

## 9. Casi modello obbligatori (fixture)

- Una Decision con due risultati che convergono su un solo nodo canonico; inserimento su un ramo non tocca l'altro.
- Una Decision con `No → End(stopped)` e `Yes → ... → End(completed)`; Ready valida con conteggi differenti.
- AND di 3 attività; completa 2, cambia ordine, ricarica e riprende la terza; gate si apre solo quando tutte terminate.
- AND contenente Decision con Stop intero `escalation`; 2 attività ancora incomplete e run termina senza marcarle completate.
- Decision con due outcome, uno `unassigned` (P02), altro `broken` (W08) nello stesso Draft; esiti separati.
- Passo con URL remoto, due gallerie, blob assente W07, media totale 32 e soft cap 2.
- Revisione Ready su cui viene aperto un nuovo Draft; modifica Draft non cambia Ready/run.
- Import Ready due volte (Page 11A e 11B), tutte le identità coerentemente indipendenti e usabili immediatamente se valida.

## 10. Relazione con la master

La master v3.8 contiene più rappresentazioni storiche di fork/join e diversi campi TypeScript proposti in precedenza: **prevalgono le regole approvate negli header v3.8 e §07.11, §09, §15, §18, §19**. Questo documento fissa un modello normalizzato di partenza; non modificare layout o nomenclatura UX per adattarli a un schema comodo da programmare. Ogni migration o modifica incompatibile richiede test di round-trip import/export e campione delle revisioni precedenti.
