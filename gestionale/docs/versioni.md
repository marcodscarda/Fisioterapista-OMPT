# Versioni del gestionale

Il numero di versione è scritto in un solo punto (`app/js/versione.js` e `package.json`)
e compare **sotto il marchio OMPT nella barra laterale**, così è sempre chiaro quale
versione si sta usando.

La forma è `maiuscola.minore`:

- la cifra **minore** cambia con le funzioni nuove e le correzioni, che si aggiungono
  senza toccare il lavoro già fatto;
- la cifra **maiuscola** cambia quando serve attenzione da parte tua: qualcosa si fa in
  modo diverso, oppure i dati esistenti vanno convertiti.

---

## 1.5 — 26 ottobre 2026

**Il protocollo di cuffia diventa completo: quattro fasi, 22 esercizi**
- Alla fase passiva si aggiungono **flesso-estensione di gomito con avambraccio
  sostenuto**, **mano e polso** (pompa, presa, prono-supinazione), **mobilità attiva
  del collo**, **rotazione esterna passiva con bastone** e una voce di educazione su
  **tutore, sonno e postura**: con il tutore si irrigidisce anche quello che non è
  stato operato.
- Nuova **fase 2 (attiva assistita)**, circa 6–12 settimane: elevazione assistita con
  bastone da supino a seduto, carrucola, risalita al muro, retrazione e depressione
  scapolare, elevazione attiva nel piano della scapola da supino, isometrie
  submassimali.
- Nuova **fase 3 (rinforzo)**, dalla dodicesima: rotazione esterna e interna con
  elastico, remata, scaption con carico leggero, Y e T in prono.
- Nuova **fase 4 (ritorno alle attività)**, dalla sedicesima: spinte progressive in
  appoggio e una voce sul ritorno al lavoro e ai gesti sopra la testa, con i criteri
  di dimissione che ricorrono nei protocolli (escursione completa e indolore, forza
  entro il 10% del lato sano, nessun compenso, dolore 0–2/10, via libera del chirurgo).
- La nota degli esercizi di Codman è stata precisata: l'attività elettrica resta bassa,
  ma il movimento gleno-omerale prodotto è minimo, quindi è gestione del dolore e primo
  contatto con il movimento, non il mezzo principale per mantenere l'escursione. Chi ha
  già l'esercizio in libreria conserva la versione precedente, perché gli aggiornamenti
  non sovrascrivono le voci esistenti.

**Attenzione clinica.** Settimane e gradi sono quelli ricorrenti nei protocolli
pubblicati, che fra loro divergono: il riferimento resta il protocollo del chirurgo. Le
fonti usate sono elencate in `docs/esercizi.md`; una linea guida italiana specifica sulla
riabilitazione post-operatoria della cuffia non è stata trovata.

---

## 1.4 — 26 ottobre 2026

**La scheda degli esercizi diventa un file da mandare al paziente**
- In libreria ogni esercizio ha una **casella da spuntare**: si scelgono quelli che
  servono — la casella in testata prende tutti quelli elencati, comoda dopo aver
  filtrato per protocollo — e compare la barra *Scheda per il paziente*.
- Da lì si indica il nome (facoltativo) e le indicazioni generali, poi si stampa
  oppure si scarica il **file da inviare**. Gli esercizi seguono l'ordine in cui
  sono stati spuntati.
- Il file è una pagina HTML autonoma: impaginazione e immagini stanno dentro, quindi
  si apre su qualsiasi telefono o computer anche senza collegamento e senza il
  gestionale. Sul telefono il testo va a tutta larghezza; dal menu del browser il
  paziente può stamparla o salvarla come PDF.
- Lo stesso file si scarica dal programma dentro l'episodio di cura, con le dosi
  personalizzate del paziente: pulsante *File per il paziente*, accanto alla stampa.

Il file contiene indicazioni cliniche e, se compilato, il nome del paziente: va
trattato come un documento clinico e inviato sul canale concordato con lui.

---

## 1.3 — 26 ottobre 2026

**Protocollo post-operatorio: sutura della cuffia dei rotatori, fase passiva**
- Quattro esercizi nuovi in libreria, descritti per la consegna al paziente:
  *elevazione assistita dall'arto sano da supino*, *elevazione delle scapole da
  seduto (spallucce)*, *esercizi pendolari di Codman*, *abduzione passiva con
  bastone da supino*. Ognuno porta obiettivo, posizione, esecuzione passo passo,
  punti chiave, errori comuni, dose, progressione, regressione, precauzioni,
  dolore ammesso e, nelle note, il razionale per il terapista.
- Gli esercizi possono appartenere a un **protocollo**: un testo libero che li
  tiene insieme. In libreria compare una tendina per filtrarli, la ricerca li
  trova per nome del protocollo e il protocollo si legge sulla scheda e sulla
  stampa del singolo esercizio.
- Le voci nuove del catalogo arrivano anche a chi ha gia' la libreria piena:
  vengono aggiunte solo quelle entrate dopo, e quello che era stato cancellato
  a mano non ricompare.

**Attenzione clinica.** I gradi e i tempi indicati sono i piu' comuni delle
prime settimane: valgono come punto di partenza e vanno sempre riportati al
protocollo del chirurgo, che dipende dal tendine suturato, dalla dimensione
della lesione e dalla tecnica.

---

## 1.2 — 26 ottobre 2026

**Modifiche della cartella non piu' perse cambiando scheda**
- Risolta una perdita di dati silenziosa. La cartella salva da sola poco dopo
  l'ultima modifica; cambiando scheda entro quell'attimo, la cartella veniva
  ricostruita rileggendo l'episodio ancora vecchio e il salvataggio successivo
  riportava indietro quanto appena inserito. Capitava per esempio segnando una
  bandiera rossa e passando subito a un'altra scheda.
- Ora il salvataggio in sospeso viene completato **prima** di ricostruire la
  pagina, a ogni spostamento e alla chiusura.
- Alla chiusura della pagina resta un solo salvataggio di guardia: prima ogni
  scheda aperta ne lasciava uno, e i piu' vecchi potevano riscrivere dati
  superati.

**Archivio locale: apertura piu' robusta**
- Risolto l'errore *«Impossibile aprire l'archivio locale — An attempt was made to open a
  database using a lower version than the existing version»*. Capitava aprendo una copia
  del gestionale piu' vecchia dei dati salvati (per esempio una cartella precedente
  rimasta sul computer, o l'icona sulla Scrivania che puntava ancora a quella): il
  browser rifiutava l'apertura e il gestionale non partiva.
- Ora il gestionale si adatta all'archivio che trova: se i dati appartengono a una
  versione piu' recente li apre comunque, in sola aggiunta, senza perdere nulla.
- Se l'archivio e' davvero incompatibile il messaggio dice **quali versioni** sono in
  gioco e cosa fare, invece di incolpare la navigazione privata.
- All'avvio l'archivio viene aperto una volta sola anche quando piu' parti
  dell'interfaccia lo chiedono insieme.

---

## 1.1 — 21 settembre 2026

**Esercizi**
- Nuova sezione **Esercizi**: la libreria dello studio. Ogni esercizio porta obiettivo,
  posizione di partenza, esecuzione passo passo, punti chiave, errori comuni,
  respirazione, attrezzatura, dosaggio su nove campi, progressione, regressione, dolore
  ammesso e precauzioni. Con **immagini** e collegamenti a **video**.
- **22 esercizi di partenza** su rachide, spalla, anca, ginocchio, caviglia, equilibrio e
  vestibolo, così la libreria non è vuota al primo accesso. Sono modificabili, duplicabili
  e cancellabili: la dose indicata è un punto di partenza, non una prescrizione.
- Dentro l'episodio di cura c'è la scheda **Esercizi**: si scelgono dalla libreria, si
  riordinano, si personalizza la dose campo per campo. Da lì si stampa la **scheda da
  consegnare al paziente**, con foto, descrizione, dose e link ai video.
- La libreria si esporta e si importa in JSON, per spostarla fra computer senza portarsi
  dietro i dati dei pazienti.

**Copia automatica su disco**
- All'avvio il gestionale salva da solo una copia completa in una cartella del computer
  (`Documenti/Backup Gestionale OMPT`), conservando le ultime 30. Si attiva e si regola da
  *Impostazioni → Dati e backup*. Il file **non è cifrato**: quella cartella va trattata
  come l'archivio di carta.

**Ricerca globale**
- Una sola casella per pazienti, episodi, fatture ed esercizi. Si apre con **Ctrl/Cmd+K**
  o dalla lente in alto a destra; si naviga con le frecce e si apre con Invio.

**Altro**
- **Modelli di seduta**: una seduta già compilata si salva come modello e si riusa, invece
  di riscrivere ogni volta la stessa cosa.
- **Episodi fermi** in Home: gli episodi aperti senza sedute da almeno 4 settimane e senza
  appuntamenti in programma. Sono i pazienti che si perdono per strada.
- **Grafici nell'anteprima** della cartella: andamento del dolore e dei questionari, invece
  della sola tabella.

---

## 1.0 — 19 settembre 2026

Prima versione numerata. Raccoglie tutto il lavoro fatto finora e aggiunge:

**Cartella clinica**
- Nuova parte **Equilibrio e vestibolo**: sette sezioni per la valutazione dei disturbi
  dell'equilibrio e vestibolari, dall'inquadramento del sintomo alle manovre liberatorie
  fino al programma riabilitativo. Dettagli e riferimenti in
  [`equilibrio-vestibolare.md`](equilibrio-vestibolare.md).
- Nuova scheda **Anteprima**, che ora è la prima che si apre: mostra in sola lettura
  tutto quanto è già stato scritto, con le ultime sedute e l'andamento dei questionari.
  La stessa anteprima si apre dall'elenco degli episodi, senza entrare nella cartella.
- Due nuovi questionari: **DHI** (Dizziness Handicap Inventory) e
  **ABC** (Activities-specific Balance Confidence), proposti in automatico quando
  l'episodio riguarda vertigini o equilibrio.
- Le schede della cartella vanno a capo invece di scorrere in orizzontale: con dieci
  voci quelle in fondo restavano nascoste.

**Fatturazione**
- Tolta la riga per la firma del paziente: la fattura la firma solo chi la emette.

**Apertura del gestionale**
- Su Mac l'icona sulla Scrivania viene **proposta al primo avvio**, dentro la finestra di
  *Avvia gestionale.command*: basta premere `s`. È l'unico file che l'utente ha già
  sbloccato, mentre qualunque altro file scaricato verrebbe bloccato di nuovo da macOS —
  chiedendolo da lì l'ostacolo non si ripresenta. Su Windows resta il doppio clic su
  *Crea icona sul desktop.bat*.
- Se il gestionale è già in funzione, un secondo avvio non ne apre una seconda copia:
  riporta semplicemente in primo piano la finestra del browser. Prima, in quel caso,
  partiva una seconda copia su un'altra porta — e siccome il browser tiene un archivio
  separato per ogni porta, quella copia appariva **vuota**, con l'aria di aver perso
  tutti i dati.

**Interfaccia**
- Icona accanto alla scritta OMPT nella barra laterale.
- La versione in uso è indicata sotto il marchio.
