# La cartella clinica OMPT

## Impostazione

La cartella segue le fasi del **ragionamento clinico** proprio della formazione OMPT, coerenti con
gli *Educational Standards* IFOMPT: raccolta dei dati soggettivi → generazione di ipotesi →
esame fisico mirato a testarle → diagnosi fisioterapica → piano → rivalutazione continua.

L'ordine delle schede rispecchia questa sequenza e non è casuale: le **ipotesi si formulano prima**
dell'esame fisico, perché sono loro a determinare quali test eseguire, in quale ordine e con quale
dose.

## Elementi che il gestionale rende espliciti

### Severità, irritabilità e natura
Determinano quanto ci si può spingere nell'esame e nel trattamento. Un quadro molto irritabile
(poco stimolo per provocare, molto tempo per calmare) impone di fermarsi alla comparsa del sintomo
e di dosare con prudenza.

### Bandiere rosse
La sezione *Domande speciali* raccoglie i segnali di sospetto di patologia grave. Un reperto
positivo non è una diagnosi: impone approfondimento e, se indicato, invio medico. Il riquadro rosso
in cima alla cartella li ripropone a ogni apertura, così non restano sepolti nel testo.

La sindrome della **cauda equina** (ritenzione o incontinenza urinaria, incontinenza fecale,
anestesia a sella, deficit motorio bilaterale progressivo) è un'urgenza.

### Screening cervicale
La scheda dedicata segue l'*International Framework for Examination of the Cervical Region*
(IFOMPT, 2020), che riguarda **tutti gli interventi sulla regione cervicale**, non solo la
manipolazione. Raccoglie i sintomi di disfunzione arteriosa cervicale (5D & 3N), i fattori di rischio
vascolare e i segni di instabilità craniocervicale.

Il principio del framework è che **nessun test posizionale è di per sé predittivo**: la decisione si
basa sul quadro complessivo, sul ragionamento e sul rapporto rischio/beneficio discusso con il
paziente.

### Meccanismo del dolore
La classificazione IASP in **nocicettivo / neuropatico / nociplastico** orienta la scelta del
trattamento più della diagnosi strutturale. Il campo è presente due volte: come ipotesi prima
dell'esame e come conclusione dopo, perché è normale che si modifichi.

### Bandiere gialle, blu, nere, arancioni
Fattori psicologici individuali, percezione del lavoro, contesto e sistema, segni psichiatrici.
Sono tra i predittori più robusti di cronicizzazione e di mancato ritorno al lavoro.

### Asterischi (comparable signs)
Da 2 a 4 misure di riferimento, misurabili e rilevanti per il paziente, scelte nella valutazione
iniziale. Il gestionale li **ripropone automaticamente in ogni seduta** con il valore iniziale
accanto, così la rivalutazione diventa un gesto immediato e la risposta al trattamento è
documentata seduta per seduta.

### PROM e MCID
Un punteggio isolato dice poco. Conta la **variazione** rispetto alla differenza minima
clinicamente importante: il gestionale confronta prima e ultima compilazione e segnala se l'MCID è
superato. I valori di riferimento sono indicati nella scheda di ciascun questionario.

### Consenso
Il consenso informato è documentato nel piano. Per le tecniche manipolative ad alta velocità e
bassa ampiezza è raccomandato un consenso **scritto e specifico**: se il piano prevede
manipolazioni e il consenso scritto non risulta acquisito, il gestionale lo segnala nel riquadro di
allerta. Il modulo dedicato è stampabile dalla scheda paziente.

## Struttura di una seduta (SOAP)

- **S** — variazione dalla seduta precedente, durata dell'effetto del trattamento, eventi intercorsi,
  aderenza al programma domiciliare.
- **O** — rivalutazione degli asterischi, trattamento eseguito con il dosaggio, risposta immediata.
- **A** — l'ipotesi regge? l'effetto è quello atteso? cosa modificare?
- **P** — piano per la seduta successiva, programma domiciliare aggiornato, data del prossimo
  appuntamento (che alimenta l'agenda e il cruscotto).

## Personalizzare la cartella

Sezioni e campi sono definiti in `app/js/schema/ompt.js`. Per aggiungere una voce basta inserire un
campo nella sezione desiderata:

```js
{ k: 'chiaveUnivoca', l: 'Etichetta mostrata', t: 'textarea', w: 'half', rows: 3,
  hint: 'Testo di aiuto opzionale' }
```

Tipi disponibili: `text`, `textarea`, `num`, `date`, `sel`, `radio`, `chips` (scelta multipla),
`chk`, `scale` (0-10), `table` (righe dinamiche), `body` (body chart).
Aggiungendo `alert: true` il campo, quando valorizzato, compare nel riquadro di allerta.

I form e i documenti stampati si aggiornano da soli: non c'è altro da modificare.

## Riferimenti

- IFOMPT — *Educational Standards in Orthopaedic Manipulative Physical Therapy*.
- IFOMPT — *International Framework for Examination of the Cervical Region in relation to potential
  vascular pathologies of the neck prior to Orthopaedic Manual Therapy intervention* (2020).
- IASP — criteri per la classificazione del dolore nocicettivo, neuropatico e nociplastico.
- OMS — *Classificazione Internazionale del Funzionamento, della Disabilità e della Salute* (ICF).

I valori di MCID/MDC riportati nelle schede dei questionari provengono dalla letteratura di
riferimento per ciascuna scala e vanno intesi come indicativi: variano con la popolazione e il
contesto clinico.
