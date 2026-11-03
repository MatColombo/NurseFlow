# F15 — Verifiche su dispositivo e Pages

Aggiornamento: **2026-11-03**. iOS/Android fisici: **NON ESEGUITO**, nessun dispositivo WPD collegato né `adb`/Xcode accessibile. URL pubblico: **PASS**, [NurseFlow](https://matcolombo.github.io/NurseFlow/), deploy e smoke reali della [CI41604415777](https://github.com/MatColombo/NurseFlow/actions/runs/41604415777), più Full+Resume in profilo nuovo. Le prove Playwright desktop non sostituiscono le verifiche fisiche. Evidenze finali: [report F16](reports/F16.md); storia F15: [report F15](reports/F15.md).

## Riscontri disponibili

- Chromium e Firefox desktop: cache reale Workbox, hard reload offline sotto `/nurseflow/`, IndexedDB/Blob e sessioni pinnate, update differito e cache rimossa verificati.
- Chromium: controllo CDP dell'installabilità, senza installazione nel sistema operativo.
- WebKit Windows: `Cache.put()` con una semplice Response fallisce con `TypeError: Failed writing data to the file system`, anche in profilo persistente. La registrazione diventa redundant. Verificata UI d'errore, mai “Pronta offline”; prove SW saltate solo dopo il probe nativo fallito. IndexedDB e migrazioni in due tab funzionano. Non è una misura di Safari su iOS.
- Non è stata simulata una vera eviction decisa dall'OS: è stata eliminata intenzionalmente la cache di un profilo di test. Nessuna promessa di recupero dei dati eliminati.

## Protocollo da eseguire su hardware reale

Registrare modello, OS/versione, browser/versione, modalità browser/standalone, URL/base, commit e data per ogni esecuzione. Usare esclusivamente fixture fittizie e un profilo di prova con backup esterno.

1. Visitare l'URL HTTPS; attendere Settings → “Pronta offline”. Verificare grant effettivo di persistenza e stima spazio, senza interpretarli come garanzia.
2. Installare tramite UI del browser (Android/Chromium) o Condividi → Aggiungi alla schermata Home (iOS). Annotare se il browser offre il prompt. Riaprire dall'icona e verificare identità/storage effettivi; non presumere che tutti i contesti condividano lo stesso archivio.
3. Importare il full di prova; attivare modalità aereo, chiudere completamente e riaprire l'app. Eseguire OR e AND, switch, Resume dopo chiusura, Blob in entrambe le gallerie e placeholder remoto/W07. Verificare route hash profonde e Map senza mutazioni.
4. Con run o editor aperto, pubblicare una nuova build sullo stesso scope; da una seconda scheda verificare update e scegliere Update when idle. Nessun reload o perdita degli input. Terminare le operazioni/sessioni e chiudere eventuali vecchie schede; verificare applicazione soltanto dopo inattività. Ripetere con Later e salvataggio fallito.
5. In un profilo sacrificabile rimuovere cache/dati dal browser, riaprire online e verificare stato vuoto/errore veritiero; ripristinare il file esterno. Non aspettarsi recupero dai soli cache o permessi.

Limiti documentati, ancora **non misurati su questi dispositivi**: installazione e prompt dipendono da browser/OS; Safari richiede un'azione del menu invece di `beforeinstallprompt`; storage/quota e concessione di persistenza dipendono dal browser e possono essere revocati/rimossi; immagini HTTPS restano dipendenti dalla rete. Fonti: [installazione PWA](https://web.dev/learn/pwa/installation), [politica storage WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/). Non vengono dichiarati tempi di conservazione o quote mobili misurati.

## Pubblicazione e smoke reale

Configurare il remote del repository di destinazione e Pages → Source: GitHub Actions. Il workflow usa il nome del repository per la base; `VITE_BASE_PATH=/` va impostata solo per root/custom domain. Non cambiare scope/origine a un archivio esistente senza esportarlo: lo storage è legato all'origine del browser.

Il push `main` o workflow_dispatch esegue CI, pubblica l'artefatto verificato e testa il `page_url` restituito da Pages. Esecuzione riproducibile:

```sh
node tooling/pages-smoke.mjs https://OWNER.github.io/REPO/
```

Lo smoke richiede HTTPS e un Chromium Playwright installato, usa un profilo nuovo, controlla risposta, CSP, manifest/base/icone, stato cache e reload offline di `#/settings`. Eseguito con PASS sull'URL reale sopra. Eseguito anche `NF_PAGES_URL=https://matcolombo.github.io/NurseFlow/ npm run test:e2e -- --config playwright.pages.config.ts`:1/1 PASS, Download Full, import e Resume OR/AND/W08 su pin storico. G5 tecnico chiuso per la candidata; G3 resta aperto per hardware mobile reale.
