# ADR-017 — CSP sulla build statica

3 novembre 2026 · F16 · accettata come dettaglio implementativo del contratto03 §9.

L'audit rileva assenza di CSP nella shell. GitHub Pages non espone header HTTP configurabili dall'app: Vite inserisce una meta CSP prima degli script nella sola build, preservando il server dev con HMR. Script e worker soltanto same-origin, nessun unsafe-eval/inline script, oggetti/frame/form vietati, base limitata a self. CSS inline è consentito per i token di scala e gli stili React. Immagini self/blob, fetch self/HTTPS per i media opzionali; il loader remoto continua a rifiutare redirect, MIME e URL non consentiti. Nessuna dipendenza esterna o report di telemetria.

La policy meta non può impostare `frame-ancestors` o sostituire tutte le protezioni configurabili con header; non viene dichiarata una difesa completa contro ogni attacco. Escaping e schema restano obbligatori.

Zod viene configurato `jitless` prima della costruzione degli schemi di dominio: la validazione non richiede compilazione dinamica né il probe `new Function`, anche in contesti di automazione che possono eseguire il probe e successivamente chiamare il parser dalla UI. Schema e formato non cambiano; gli invarianti continuano a essere verificati dalle stesse prove.

Le fixture Playwright sono bundle trusted compilati nel runner: vengono eseguite tramite `page.evaluate`, nel solo profilo di prova, invece di inserire script inline nel documento. Non si usa `bypassCSP`. Le prove XSS continuano a verificare testo escaped e assenza di elementi/handler eseguibili. Una prova separata su tre browser verifica realmente il blocco CSP di script inline e di script terzi, con violazioni osservate, e la successiva persistenza delle preferenze. La suite completa e i test PWA/Full+Resume verificano compatibilità con asset/Blob/SW e hosting sotto base.
