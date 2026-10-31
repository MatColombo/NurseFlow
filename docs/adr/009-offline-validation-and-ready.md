# ADR-009 — Controllo offline e conferma Ready

Data: 2026-10-31. Ambito: F08, master v3.8 §09 congelato. Nessuna modifica ai contratti o allo schema DB v4.

## Validatore e identità

`validateGraph` è puro e sincrono: riceve il DAG e fatti locali sui media; non legge DB, orologio, impostazioni, rete o DOM. Gestisce anche dati raw non conformi, classificando gli errori di schema nelle regole appropriate. Non corregge automaticamente il contenuto. ID issue: tupla JSON di regola, node ID, slot, outcome/activity/media ID e campo; ordine lessicografico indipendente dal riordino UI. In assenza di un ID valido, l'ancora usa il record canonico. Percorsi ciclici e attraversamenti di attività vengono controllati anche nei componenti scollegati.

P02/P04 identificano l'outlet raggiungibile non assegnato. Per evitare errori a cascata, P05/P06 non ripetono lo stesso difetto già localizzato su quell'outlet. Un'attività priva del primo passo produce P06. Un nodo rimasto scollegato produce comunque P09. Un riferimento storico `broken` o `node` con destinazione assente produce W08, senza P02/P04/P05/P11 e senza convertirlo in End; anche la verifica di completamento dell'attività rispetta questa precedenza. P01 resta indipendente: Start deve avere un primo passo valido; se il suo primo collegamento è storico e interrotto compaiono P01 e W08, senza le classificazioni ridondanti escluse dal master.

P03 confronta nomi con normalizzazione Unicode NFKC, spazi, controlli di formato invisibili e maiuscole, senza modificare l'originale. W06 usa inoltre normalizzazione diacritici/punteggiatura del testo e delle note: è un confronto editoriale ripetibile, non un'analisi clinica o semantica AI. La sola destinazione condivisa non genera W06. P10 richiede titolo e testo per Instruction/Alert, domanda per Decision, titolo del Multitask/nome attività e tipo/titolo/messaggio per End.

W01/W02 sono aggregati per passaggio: i media remoti validi richiedono rete e sono **non verificati ora**. Il controllo non effettua fetch e non dichiara un ipotetico 404. W04 è aggregato per passaggio. W03 usa soglie tecniche informative di 5 MiB per asset e 50 MiB di asset locali complessivi, senza blocco Ready. Il limite soft di aggiunta non entra nella validazione.

I fatti W07 derivano da presenza, schema dell'asset, lettura dei byte, firma raster, dimensioni, MIME, SHA-256 e decodifica raster nativa del browser. Un errore resta W07 se il riferimento media è valido; schema, slot, layout, URL non consentito o più di 32 media restano P12. I test Node non hanno un decoder nativo; la prova browser comprende PNG reale e PNG troncato con hash coerente. Bitmap e URL Blob temporanei vengono sempre rilasciati.

## Lettura e commit

`checkDraft` legge in transazione coerente procedura, ultima working Draft durabile e inventario asset. L'hashing/decodifica avviene fuori dalla transazione, poi una seconda lettura esclude cambiamenti durante l'ispezione. Il risultato conserva ID Draft, editVersion, timestamp, versione validator e token canonico del record esatto/inventario/puntatore Ready/prossimo numero. Gli asset sono write-once e non vengono eliminati.

`markCheckedReady` non si fida del risultato ricevuto dalla UI: verifica la conferma personale, rilegge la Draft, controlla il token e rivalida. Dopo l'ispezione locale dei Blob, rilegge e confronta nuovamente nella transazione RW; inserisce nuova Ready e aggiorna il puntatore insieme. Non muta working Draft, vecchie Ready, history, media o run pinnate. Una seconda conferma concorrente diventa stale. Il risultato arriva solo dopo il completamento della transazione; quota/abort/conflitto non diventano Problems fittizi. Il Retry del commit fallito riusa il contesto conservato, rivalidando ancora.

La sottoscrizione repository segnala variazioni durabili e rende indisponibile la conferma vecchia. Tornando da Fix/Inspect si esegue sempre una nuova lettura; il contesto porta solo ID issue e scroll, mai un URL arbitrario. Fix passa selezioni validate al Builder o campo/item all'editor. I collegamenti successivi conservano il ritorno al Check e il Builder mantiene camera, modalità e scroll.

## Moduli offline e confini

Page 07/08/09 e Graph sono dipendenze del bundle iniziale. La prova con `context.setOffline(true)` ha mostrato che il precedente caricamento differito dell'editor poteva fallire durante Inspect. Questa scelta rende il flusso di authoring disponibile dopo il caricamento dell'app, con costo di bundle iniziale maggiore; non introduce cache o service worker. Avvio a freddo e aggiornamenti offline rimangono F15.

La preview usa la route Draft esistente e non crea run o Ready; il motore Guided e la preview navigabile completa sono F09/F10. Import/file e recupero tramite archivio approvato restano F13/F14: il link di recupero punta alla route 11A già prevista e non dichiara un export completato. I record raw gravemente corrotti vengono diagnosticati e bloccati; gli editor strict possono offrire solo il recupero, senza una riparazione automatica arbitraria.

## Prove

Matrice P01–P12/W01–W08, ripetibilità, permutazioni 2–32 outcome, DAG condivisi, AND annidati, uscite esplicite, W08/unassigned, W07/P12; transazioni con conflitto, concorrenza, quota, abort, collisioni ID e preservazione pinned. Testing Library verifica conferma e no falso successo. Playwright verifica E06, flussi Fix/Inspect reali, Blob IndexedDB, stale/Retry, tastiera e scala a 320px. Risultati effettivi e limiti nel report F08.
