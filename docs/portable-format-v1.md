# NurseFlow portable — formato 1

Stato: implementazione F13/F14 del contratto 05, [ADR-014](adr/014-portable-packages-and-additive-staging.md) e [ADR-015](adr/015-app-backups-and-settings-consent.md). Formato file indipendente da versione app e versione IndexedDB. Nessuna firma digitale, crittografia o verifica di provenienza.

Il file è ZIP stored, header locali e directory centrale con CRC32 e nomi UTF-8 ASCII allowlist. Metodo 0, flag 0/UTF-8, nessun descriptor/extra/commento/volume/ZIP64/cifratura. Entrate locali contigue dall'offset zero fino alla directory; directory immediatamente seguita da EOCD senza trailer. Non estrarre file su disco. Rifiutare metodi diversi, entry duplicate, path non ammessi o dimensioni discordanti; non decomprimere per tentare il recupero.

| Entry | Contenuto |
| --- | --- |
| `manifest.json` | Formato/versioni/scope, package ID, data/versione app, conteggi, entries e missingAssets |
| `procedures/000000.json` … | Un record Procedure normalizzato per entry |
| `revisions/000000.json` … | Tutte le revisioni esportate della procedura, comprese Ready storiche |
| `groups.json` | Array Group, anche vuoto |
| `media.json` | Array `{id,mime,bytes,width,height,sha256,path}` per i Blob presenti |
| `media/000000.bin` … | Byte esatti PNG/JPEG/WebP, mai URL remoto scaricato |
| `settings.json` | Record Settings per settings/full; F14 gestisce scritture e consenso |
| `runs/000000.json` … | Record RunSession per full; vietati nei pacchetti procedure/library |

Gli indici hanno sei cifre e non rappresentano identità. Le entry JSON sono UTF-8, oggetti con chiavi ordinate ricorsivamente; l'ordine degli array authored è conservato. Il lettore accetta ordine delle chiavi differente. JSON con proprietà riservate di prototype o profondità oltre 64 è rifiutato anche alla preparazione; schema strict per i record. Nomi, testi, note, caption e alt restano testo escaped, mai HTML eseguibile.

Manifest v1:

```json
{
  "format": "nurseflow-portable",
  "formatVersion": 1,
  "schemaVersion": 1,
  "packageKind": "procedure",
  "packageId": "uuid-locale",
  "exportedAt": "2026-11-02T00:00:00.000Z",
  "appVersion": "0.0.0",
  "counts": {"procedures": 1, "groups": 1, "revisions": 2, "media": 1, "runs": 0},
  "entries": [{"path": "groups.json", "bytes": 82, "sha256": "digest-esadecimale-di-64-caratteri"}],
  "missingAssets": ["id-locale-assente"]
}
```

L'esempio illustra i campi: `entries` reale elenca **ogni payload tranne manifest**, con dimensione esatta e SHA-256 dei byte reali. Conteggi e path devono coincidere con quanto presente; nessuna entry extra o payload non dichiarato. La manifest non include il proprio hash; CRC32 ne verifica i byte. Gli hash non sono firme.

`procedure`: esattamente una procedura; `library`: una o più; entrambe senza Settings/run. `settings`: solo settings.json con tutti i conteggi libreria a zero. `full`: sezioni libreria + Settings e run opzionali, senza cache o permessi browser; anche una libreria vuota con gruppi vuoti è valida. 11A esporta/importa procedure/library; 11B esporta/importa settings/full. Ogni pagina rifiuta integralmente gli scope dell'altra.

Settings usa il record app strict con default v1 espliciti del modello, senza campi browser o estensioni sconosciute. Gli export scrivono tutti i campi. Full conserva tutte le revisioni e sessioni Ready pinnate, anche storiche rispetto al puntatore corrente. I contatori locali delle visite restano locali alla nuova sessione; i token attività incorporano gli activity ID rimappati. Un restore full conserva anche gruppi vuoti; un import selettivo 11A crea soltanto i gruppi associati alle scelte. Le preferenze di layout e la cronologia editoriale non sono parte del formato.

Ogni Blob presente deve avere hash, byte count, MIME, dimensioni e decodifica raster coerenti. Ogni riferimento locale senza Blob deve essere elencato una sola volta in `missingAssets`; l'insieme deve essere esatto. Un asset presente ma corrotto è errore, non W07. URL HTTPS/GIF restano solo metadata e non causano fetch durante parsing/preview. `kind:broken`, formerNodeId e formerTitle restano storici, senza conversione a End o unassigned.

Il decoder verifica schema/referenze e gli invarianti editabili anche per Draft incomplete. Tutte le Ready devono superare il validator strutturale locale senza Problems; i Warning restano non bloccanti. Nessuna migrazione di versioni future o downgrade Ready implicito. Import aggiunge nuove identità per file/procedura, aggiornando tutti i rimandi; originali, Settings e run locali rimangono immutati in 11A.

Limiti effettivi v1: 128 MiB archivio/batch, 32 file, 10.000 entry, 8 MiB JSON/entry, profondità 64 e 250.000 aperture di contenitori/separatori per JSON, 10.000 nodi/fasi per revisione; valgono inoltre i limiti raster F07. Il browser può avere meno quota o memoria: gli errori non devono dare successo né commit parziali. Benchmark desktop e prove su hardware fisico sono distinti nel report.
