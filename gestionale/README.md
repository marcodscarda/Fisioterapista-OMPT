# Gestionale OMPT

Gestionale per fisioterapista specializzato in terapia manuale: **cartella clinica secondo il
ragionamento clinico OMPT/IFOMPT**, **fatturazione cartacea** per pazienti privati e **registro
degli incassi**.

Funziona interamente nel browser, senza account e senza connessione: i dati restano sul computer.

---

## Come si apre

Una volta sola, la prima volta:

1. **Scarica i file.** Vai alla pagina del progetto su GitHub, premi il pulsante verde
   **Code** e scegli **Download ZIP**. Finché le modifiche non sono state unite al ramo
   principale, seleziona prima il ramo giusto dal menu a tendina in alto a sinistra
   (quello che inizia con `claude/`).
2. **Estrai la cartella** (doppio clic sul file scaricato) e spostala dove preferisci —
   per esempio in *Documenti*. Tienila lì: è la cartella del gestionale.
3. **Installa Node.js**, se non ce l'hai: <https://nodejs.org/it/download>, versione **LTS**,
   avanti-avanti. Serve solo a far funzionare il gestionale sul tuo computer.

Poi, tutte le volte che vuoi usarlo, apri la cartella `gestionale` e fai **doppio clic** su:

| Se hai… | Fai doppio clic su |
|---|---|
| Mac | **Avvia gestionale.command** |
| Windows | **Avvia gestionale.bat** |

Si apre una finestra con scritto *Gestionale OMPT avviato* e il gestionale compare da solo nel
browser. **Lascia quella finestra aperta** mentre lavori: è il gestionale che gira. Per chiudere
tutto, chiudi la finestra.

Se il browser non si apre da solo, nella finestra c'è scritto l'indirizzo da copiare: di norma
<http://127.0.0.1:4321>.

### Su Mac, al primo avvio: «non può essere aperto»

macOS blocca per principio gli script scaricati da internet. Compare un avviso con i pulsanti
*Sposta nel Cestino* e *Annulla*.

**Clicca Annulla** — il file non ha niente che non va. Poi scegli una delle due strade.

**Strada A — la più rapida, non serve password.** Aggira il blocco senza sbloccare nulla:

1. Apri l'app **Terminale** (Cmd+Spazio, scrivi `terminale`, Invio).
2. Scrivi `bash` seguito da **uno spazio**.
3. **Trascina** il file *Avvia gestionale.command* dentro la finestra del Terminale: il percorso
   si scrive da solo.
4. Premi **Invio**.

Il gestionale parte. Le volte successive basta premere la **freccia su** nel Terminale per
richiamare il comando, e Invio.

**Strada B — sblocca il doppio clic una volta per sempre:**

1. Menu  → **Impostazioni di Sistema**.
2. **Privacy e sicurezza** → scorri fino in fondo, sezione **Sicurezza**.
3. Trovi la riga «*"Avvia gestionale.command" è stato bloccato*» con accanto **Apri comunque**:
   cliccalo e conferma con password o Touch ID.
4. Torna sul file, **doppio clic**, e stavolta clicca **Apri**.

Da quel momento il doppio clic funziona sempre.

> Se al punto 3 non vedi quella riga, compare solo **dopo** un tentativo di apertura e resta per
> circa un'ora: rifai il doppio clic, premi *Annulla*, e torna subito in *Privacy e sicurezza*.

Su macOS Monterey e precedenti basta il **clic destro** sul file → **Apri** → **Apri**.

Il blocco riguarda solo i file estratti da uno ZIP scaricato: con `git clone` macOS non li marca e
il doppio clic funziona subito.

### Su Windows, al primo avvio: «Windows ha protetto il PC»

Se compare la finestra azzurra di SmartScreen, clicca **Ulteriori informazioni** e poi
**Esegui comunque**. Anche qui succede solo la prima volta.

**In alternativa, con una riga di Terminale** (più veloce se te la cavi): apri *Terminale*, scrivi
`xattr -d com.apple.quarantine ` (con lo spazio finale), trascina dentro la finestra il file
*Avvia gestionale.command* e premi Invio. Il blocco sparisce.

Questo blocco riguarda **solo** il file scaricato da internet. Se invece prelevi il progetto con
`git clone`, macOS non lo marca e il doppio clic funziona subito.

### Dal telefono

Con `npm start -- --rete` il gestionale diventa raggiungibile da telefono e tablet sulla stessa rete
Wi-Fi, protetto da un codice di accesso generato a ogni avvio; una volta aperto si può aggiungere
alla schermata Home e si comporta come un'app. I dati restano sul computer: il telefono è una
finestra su quell'archivio, non una copia. Condizioni e cautele:
[`docs/da-telefono.md`](docs/da-telefono.md).

### Note

- **Non aprire `index.html` con un doppio clic**: il browser blocca i file aperti in quel modo e
  il gestionale resterebbe bianco. Serve l'avviatore.
- Il gestionale funziona **senza connessione a internet**.
- Se la porta 4321 è occupata da un altro programma, ne viene scelta un'altra in automatico.
- Il server ascolta solo su `127.0.0.1`: nessun altro dispositivo della rete può raggiungerlo.

### Per chi usa il terminale

```bash
cd gestionale
npm start                        # apre il browser da solo
npm start -- 8080 --no-open      # porta a scelta, senza aprire il browser
npm start -- --rete              # accessibile da telefono sulla stessa Wi-Fi
npm test                         # test della logica di calcolo
```

Senza Node, dalla cartella `gestionale`: `python3 -m http.server 4321`, poi apri
<http://127.0.0.1:4321> a mano.

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

### Importazione da un altro gestionale

Se hai già fatturato con **Zoho Invoice** (o con un altro programma che esporta in CSV), anagrafiche,
fatture e incassi si portano qui da *Impostazioni → Dati e backup → Importa dati*. Il tipo di file e
la corrispondenza fra le colonne sono proposti in automatico e restano modificabili; l'anteprima
mostra il risultato prima di scrivere. La procedura è ripetibile senza creare duplicati, ricompone le
fatture che l'export scrive su più righe e conserva il totale con cui ciascun documento fu emesso.
Dettagli: [`docs/importare-dati.md`](docs/importare-dati.md).

### Supporto al ragionamento clinico

Una scheda dedicata legge la cartella e propone il **meccanismo del dolore** più coerente, le
**ipotesi diagnostiche ordinate** con gli elementi a favore e contro, **come condurre l'esame
fisico** (dose in base all'irritabilità e test consigliati, ciascuno con il suo perché), che cosa
chiarire per restringere il campo e le **note per l'educazione** del paziente. Con un clic
l'ipotesi scelta o il piano dell'esame finiscono in cartella.

È un sistema a **regole esplicite, eseguito in locale**: ogni suggerimento mostra le ragioni che lo
sostengono e nessun dato lascia il computer. Non è una diagnosi e non sostituisce il giudizio
clinico. In presenza di un'urgenza (sospetta cauda equina, disfunzione arteriosa cervicale,
instabilità craniocervicale…) la diagnosi differenziale viene messa da parte e resta l'indicazione
all'invio.

Dettagli, limiti e come aggiungere una regola: [`docs/supporto-ragionamento.md`](docs/supporto-ragionamento.md).

### Questionari (PROM)

NPRS, PSFS, NDI, ODI, QuickDASH, LEFS, SPADI, TSK-11, PCS, FABQ, GROC.

Il punteggio è calcolato secondo l'algoritmo di ciascuna scala (comprese le inversioni del TSK-11 e
le sottoscale di FABQ e SPADI), con confronto tra prima e ultima compilazione rispetto all'**MCID**
di letteratura e grafico dell'andamento. I questionari pertinenti sono suggeriti in base alla
regione corporea dell'episodio.

### Agenda e appuntamenti

Vista settimanale con ora, paziente, prestazione, durata e stato dell'appuntamento; gli
appuntamenti passati rimasti aperti vengono elencati per essere chiusi. Ogni appuntamento si può
aprire in **Google Calendar** con un clic (evento precompilato, lo salvi tu) oppure esportare in
**.ics** per Google, Apple o Outlook, singolarmente o per l'intera agenda.

Il titolo dell'evento esportato è configurabile e per impostazione predefinita riporta le sole
iniziali, perché un appuntamento di fisioterapia associato a un nome rivela una prestazione
sanitaria. Dettagli e motivo per cui non c'è una sincronizzazione automatica:
[`docs/agenda-calendario.md`](docs/agenda-calendario.md).

### Fatturazione cartacea

- Numerazione **progressiva per anno**, assegnata al momento dell'emissione e mai riutilizzata.
  Una fattura emessa non si cancella: si annulla, così la numerazione resta senza salti.
- Le **sedute non fatturate** si importano nel documento con un clic, raggruppate per prestazione.
- Calcolo automatico di: esenzione IVA art. 10 n. 18, **imposta di bollo** oltre soglia,
  rivalsa INPS, ritenuta d'acconto, sconto, scadenza.
- **Numerazione modificabile**: il numero assegnato si può correggere, con controllo dei duplicati
  e avviso se si creerebbe un salto.
- **Logo e firma** caricabili dalle impostazioni, ridimensionati automaticamente. La firma viene
  stampata sopra la riga di firma, così la fattura si può inviare via e-mail già firmata; se è
  dovuta la marca da bollo il gestionale avvisa che l'originale cartaceo resta necessario.
- **Adattamento a una pagina**: fatture e moduli di consenso vengono misurati e rimpiccioliti quanto
  basta per stare in un foglio A4; se davvero non ci stanno il gestionale avvisa, invece di renderli
  illeggibili.
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
│       ├── importa/       lettura CSV e importazione da altri gestionali
│       ├── ragionamento/   motore di supporto clinico: contesto, ipotesi, regole
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
