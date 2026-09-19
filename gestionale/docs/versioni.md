# Versioni del gestionale

Il numero di versione è scritto in un solo punto (`app/js/versione.js` e `package.json`)
e compare **sotto il marchio OMPT nella barra laterale**, così è sempre chiaro quale
versione si sta usando.

La forma è `maiuscola.minore`:

- la cifra **minore** cambia con le migliorie e le correzioni;
- la cifra **maiuscola** cambia quando cambia il modo di lavorare: nuove parti della
  cartella, nuovi archivi, cose che richiedono di rileggere le istruzioni.

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
- Doppio clic su **Crea icona sul desktop** e l'icona compare sulla Scrivania
  (o sul Desktop su Windows): da lì il gestionale si apre in un colpo solo.
- Se il gestionale è già in funzione, un secondo avvio non ne apre una seconda copia:
  riporta semplicemente in primo piano la finestra del browser. Prima, in quel caso,
  partiva una seconda copia su un'altra porta — e siccome il browser tiene un archivio
  separato per ogni porta, quella copia appariva **vuota**, con l'aria di aver perso
  tutti i dati.

**Interfaccia**
- Icona accanto alla scritta OMPT nella barra laterale.
- La versione in uso è indicata sotto il marchio.
