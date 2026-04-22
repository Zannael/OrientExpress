# OrientExpress

Applicazione web realizzata con React e Vite per stimare il costo finale di importazione dal Giappone verso l'Italia.

Il progetto unisce due elementi principali:

- una pagina informativa che riassume la ricerca su proxy, fiscalita e logistica;
- una dashboard interattiva che calcola il prezzo finale di arrivo in Italia partendo da costi, cambio, IVA, dazio e fee accessorie.

## Obiettivo del progetto

OrientExpress aiuta a rispondere a una domanda pratica: quanto costa davvero comprare dal Giappone tramite proxy e ricevere il pacco in Italia?

L'app non si limita a moltiplicare il prezzo per `1.22`, ma separa il calcolo in blocchi:

- costo articolo;
- commissioni del proxy;
- spedizione interna in Giappone;
- spedizione internazionale;
- dazio;
- IVA;
- costi accessori finali del corriere e del pagamento.

## Funzionalita principali

### 1. Pagina report

La home page presenta un riepilogo leggibile della ricerca contenuta in `deep-research-report.md`.

Include:

- punti chiave sulla convenienza dell'import dal Giappone;
- confronto sintetico tra proxy come ZenMarket, Neokyo, Buyee e FROM JAPAN;
- note pratiche su fiscalita italiana ed europea;
- formula operativa per stimare il costo reale di importazione.

### 2. Dashboard di simulazione

La pagina `/dashboard` consente di simulare il costo finale di un ordine.

L'utente puo impostare:

- categoria prodotto;
- nome del prodotto;
- prezzo articolo in JPY;
- fee del proxy;
- spedizione interna in Giappone;
- optional del proxy;
- spedizione internazionale;
- assicurazione o imballo;
- cambio JPY/EUR;
- aliquota IVA;
- aliquota dazio;
- fee del corriere;
- contributo italiano;
- commissione di cambio;
- modalita IOSS;
- scenario normativo attuale o simulazione luglio 2026.

Il risultato mostra:

- totale stimato;
- prezzo del solo articolo convertito in euro;
- differenza tra costo prodotto e costo finale;
- scomposizione dettagliata delle singole voci.

### 3. Import automatico da link prodotto

La dashboard integra un endpoint locale `/api/scrape-product` che prova a leggere una pagina prodotto esterna e a importare alcuni dati utili.

Attualmente il parser contiene logiche dedicate per:

- ZenMarket;
- Neokyo;
- Buyee;
- FROM JAPAN.

Quando disponibile, l'import recupera:

- titolo prodotto;
- prezzo;
- venditore;
- condizione;
- ID articolo;
- informazioni sulla spedizione interna;
- immagini del prodotto.

Le immagini importate possono essere aperte in una gallery con viewer fullscreen.

## Stack tecnico

- React 19
- Vite 8
- Tailwind CSS 4 tramite plugin Vite
- ESLint 9
- Cheerio per il parsing HTML lato server locale
- `curl` come fallback per alcune richieste bloccate o incomplete

## Architettura del progetto

```text
OrientExpress/
|-- deep-research-report.md
|-- eslint.config.js
|-- index.html
|-- package.json
|-- scraper/
|   `-- productScraper.js
|-- src/
|   |-- App.jsx
|   |-- App.css
|   |-- index.css
|   |-- main.jsx
|   `-- assets/
`-- vite.config.js
```

## File principali

- `src/App.jsx`: contiene l'interfaccia principale, la home informativa e la dashboard di calcolo.
- `scraper/productScraper.js`: contiene la logica di scraping e normalizzazione dei dati prodotto dai siti supportati.
- `vite.config.js`: configura Vite, Tailwind e un middleware locale che espone l'API `/api/scrape-product`.
- `deep-research-report.md`: documento sorgente con la ricerca estesa su proxy, fiscalita, spedizioni e formula di calcolo.

## Requisiti

Prima di avviare il progetto assicurati di avere installato:

- Node.js 18 o superiore;
- npm;
- `curl` disponibile nel sistema.

`curl` e usato come fallback dal middleware di scraping in alcuni casi in cui la richiesta `fetch` standard restituisce HTML incompleto o pagine protette.

## Installazione

```bash
npm install
```

## Avvio in sviluppo

```bash
npm run dev
```

Avvia il server di sviluppo Vite, tipicamente su `http://localhost:5173`.

Pagine disponibili:

- `/` per il report sintetico;
- `/dashboard` per il calcolatore.

## Build produzione

```bash
npm run build
```

Genera l'output nella cartella `dist/`.

## Anteprima build

```bash
npm run preview
```

Nota: in locale `npm run preview` mantiene disponibile anche l'endpoint `/api/scrape-product` tramite il middleware Vite. Nel deploy su GitHub Pages questa funzione non e disponibile, perche GitHub Pages ospita solo file statici.

## Controllo lint

```bash
npm run lint
```

## Logica di calcolo

La dashboard usa una formula modulare ispirata alla ricerca allegata:

```text
B = (prezzo articolo + fee proxy + spedizione in Giappone + optional) x cambio
L = (spedizione internazionale + assicurazione/imballo) x cambio
CV = B + L
Dazio = 0 sotto 150 EUR oggi, oppure quota fissa 3 EUR nello scenario luglio 2026;
        sopra 150 EUR si applica l'aliquota dazio configurata
IVA = aliquota x (CV + dazio)
Totale = CV + dazio + IVA + fee accessorie
```

Il progetto include preset iniziali per alcune categorie:

- manga o libro fisico;
- action figure;
- console;
- videogioco fisico;
- altro.

Ogni categoria imposta valori iniziali per IVA, dazio e nota esplicativa.

## Supporto scraping

Lo scraping e pensato come supporto pratico, non come garanzia assoluta di estrazione dati.

Limiti da considerare:

- alcuni siti cambiano markup frequentemente;
- alcune piattaforme attivano protezioni anti-bot;
- in presenza di blocchi Cloudflare o simili, l'endpoint restituisce un errore controllato;
- i dati recuperati vanno comunque verificati prima di usarli come base economica reale.

Nel deploy GitHub Pages il blocco di import da link viene disabilitato automaticamente.

## Deploy su GitHub Pages

Il repository include il workflow `.github/workflows/deploy-pages.yml`.

Comportamento del workflow:

- si attiva su push nel branch `main`;
- puo essere eseguito anche manualmente da `Actions`;
- esegue `npm ci` e `npm run build`;
- pubblica il contenuto di `dist/` su GitHub Pages.

Adattamenti inclusi per Pages:

- base path Vite calcolato automaticamente dal nome del repository GitHub;
- navigazione interna resa compatibile con Pages tramite hash route per la dashboard;
- scraping disabilitato nel deploy statico.

## Note importanti

- I dati fiscali e doganali presenti nel progetto hanno finalita informative e di simulazione.
- La classificazione TARIC reale di un prodotto va sempre verificata caso per caso.
- Le regole doganali possono cambiare nel tempo.
- Il calcolatore e utile per stime operative, non sostituisce consulenza fiscale o doganale professionale.

## Possibili sviluppi futuri

- supporto a piu marketplace e proxy;
- salvataggio locale delle simulazioni;
- confronto side-by-side tra piu servizi proxy;
- aggiornamento dinamico del cambio;
- regole fiscali configurabili da file o pannello amministrativo;
- esportazione PDF o CSV delle simulazioni.

## Script disponibili

```json
{
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

## Licenza

Nessuna licenza e attualmente dichiarata nel repository.
