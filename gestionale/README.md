# Gestionale OMPT

Gestionale per fisioterapista specializzato in terapia manuale: **cartella clinica secondo il
ragionamento clinico OMPT/IFOMPT**, **fatturazione cartacea** per pazienti privati e **registro
degli incassi**.

Funziona interamente nel browser, senza account e senza connessione: i dati restano sul computer.

---

## Avvio

Serve solo Node.js (oppure un qualunque server statico).

```bash
cd gestionale
npm start            # avvia su http://127.0.0.1:4321
```

In alternativa, senza Node:

```bash
python3 -m http.server 4321      # poi apri http://127.0.0.1:4321
```

> Non aprire `index.html` con un doppio clic: i moduli JavaScript richiedono il protocollo `http://`.

Il server ascolta solo su `127.0.0.1`, quindi non è raggiungibile da altri dispositivi della rete.

Per i test della logica di calcolo:

```bash
npm test
```

---

## Cosa fa

### Cartella clinica OMPT / IFOMPT

Ogni paziente può avere più **episodi di cura**, ciascuno con la propria cartella articolata
secondo le fasi del ragionamento clinico:

| Sezione | Contenuto |
|---|---|
| **Esame soggettivo** | body chart interattiva, caratteristiche e comportamento dei sintomi nelle 24 h, aggravanti/allevianti, severità e irritabilità, storia attuale e passata, **domande speciali e bandiere rosse**, **screening cervicale secondo il framework IFOMPT**, bandiere gialle/blu/nere/arancioni |
| **Ipotesi** | ipotesi principale e alternative, fonti dei sintomi, **meccanismo del dolore** (nocicettivo / neuropatico / nociplastico), fattori contribuenti, precauzioni e controindicazioni, piano dell'esame |
| **Esame fisico** | osservazione, ROM attivo/passivo con end-feel, movimenti ripetuti, esame neurologico (dermatomeri, miotomi MRC, riflessi, segni di primo motoneurone), test neurodinamici, PAIVM/PPIVM, palpazione, test speciali, forza e performance |
| **Diagnosi** | diagnosi fisioterapica, classificazione **ICF**, fattori prognostici, **asterischi (comparable signs)** |
| **Piano** | obiettivi SMART condivisi, interventi e razionale, dosaggio e progressione, programma domiciliare, criteri di dimissione, consenso informato |
| **Esito** | dimissione, GROC, raccomandazioni, follow-up |

Caratteristiche utili nella pratica:

- **Body chart** anteriore/posteriore: si clicca sulla figura per aggiungere aree numerate, ognuna
  con tipo di sintomo (dolore, parestesia, ipoestesia, rigidità, debolezza) e descrizione.
- **Riquadro di allerta** in cima alla cartella: raccoglie automaticamente bandiere rosse, segni di
  disfunzione arteriosa cervicale, controindicazioni e consensi mancanti.
- **Asterischi** definiti una volta e **riproposti automaticamente in ogni seduta** per la rivalutazione.
- **Diario sedute in formato SOAP**, con grafico dell'andamento NPRS.
- **Salvataggio automatico** mentre si scrive.

### Questionari (PROM)

NPRS, PSFS, NDI, ODI, QuickDASH, LEFS, SPADI, TSK-11, PCS, FABQ, GROC.

Il punteggio è calcolato secondo l'algoritmo di ciascuna scala (comprese le inversioni del TSK-11 e
le sottoscale di FABQ e SPADI), con confronto tra prima e ultima compilazione rispetto all'**MCID**
di letteratura e grafico dell'andamento. I questionari pertinenti sono suggeriti in base alla
regione corporea dell'episodio.

### Fatturazione cartacea

- Numerazione **progressiva per anno**, assegnata al momento dell'emissione e mai riutilizzata.
  Una fattura emessa non si cancella: si annulla, così la numerazione resta senza salti.
- Le **sedute non fatturate** si importano nel documento con un clic, raggruppate per prestazione.
- Calcolo automatico di: esenzione IVA art. 10 n. 18, **imposta di bollo** oltre soglia,
  rivalsa INPS, ritenuta d'acconto, sconto, scadenza.
- **Anteprima di stampa a schermo** e stampa in più copie (originale per il paziente + copia per lo studio),
  con riquadro per la marca da bollo, note di legge e spazi per le firme.
- Esportazione **CSV per il commercialista**.

Dettagli e riferimenti normativi: [`docs/fatturazione.md`](docs/fatturazione.md).

### Incassi

Un documento può essere incassato in una o più tranche. Il registro mostra incassato per mese e per
metodo di pagamento, fatturato dell'anno, **crediti aperti** con evidenza dei giorni di ritardo, e
consente l'esportazione in CSV.

### Modulistica

Stampa precompilata di: informativa e consenso privacy, consenso informato al trattamento
fisioterapico, **consenso specifico alle tecniche manipolative**, consenso per paziente minorenne.

---

## Dove finiscono i dati

I dati sono salvati nell'**IndexedDB del browser**, su questo computer. Non esiste alcun server:
nessuna informazione viene trasmessa.

Ne discendono due conseguenze pratiche:

1. **Il backup è responsabilità tua.** Il pulsante *Backup* in basso a sinistra scarica un file JSON
   con tutto l'archivio. Svuotare i dati di navigazione, cambiare browser o computer significa
   perdere i dati. L'app ricorda il backup se è passata più di una settimana.
2. **Il file di backup contiene dati sanitari** (categorie particolari, art. 9 GDPR): va conservato
   su supporto cifrato, non in una cartella sincronizzata in chiaro né inviato per e-mail.

Vedi [`docs/privacy-gdpr.md`](docs/privacy-gdpr.md).

---

## Struttura del progetto

```
gestionale/
├── index.html              guscio dell'applicazione
├── server.js               server statico locale (zero dipendenze)
├── app/
│   ├── css/                stili applicazione e stampa
│   └── js/
│       ├── db.js           persistenza IndexedDB, backup, numerazione fatture
│       ├── fatture.js      calcoli fiscali (bollo, IVA, rivalsa, ritenuta, stato incasso)
│       ├── print.js        fattura, cartella clinica, consensi da stampare
│       ├── state.js        router a hash e stato condiviso
│       ├── schema/         schema della cartella OMPT e definizione dei PROM
│       ├── ui/             renderer dei form, body chart, componenti
│       └── views/          le schermate
├── docs/                   note cliniche, fiscali e privacy
└── test/                   test della logica pura (npm test)
```

La cartella clinica è **dichiarativa**: `app/js/schema/ompt.js` descrive sezioni e campi, e sia i
form sia i documenti stampati derivano da lì. Per aggiungere una voce all'esame obiettivo basta
aggiungere un campo allo schema.

---

## Avvertenza

Le automazioni fiscali riflettono la normativa richiamata in `docs/fatturazione.md` e vanno
**verificate con il proprio commercialista**, soprattutto dopo ogni legge di bilancio. Il software
prepara il documento cartaceo: non gestisce la fatturazione elettronica né l'invio al Sistema
Tessera Sanitaria.
