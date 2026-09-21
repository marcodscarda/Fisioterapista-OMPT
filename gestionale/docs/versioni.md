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
