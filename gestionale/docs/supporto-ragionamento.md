# Supporto al ragionamento clinico

La scheda **Supporto** di ogni episodio legge quanto hai scritto in cartella e propone:

- il **meccanismo del dolore** più coerente con gli elementi raccolti;
- le **ipotesi diagnostiche** ordinate, ciascuna con gli elementi a favore e contro;
- **come condurre l'esame fisico**: dose e prudenza in base all'irritabilità, test consigliati con il
  motivo di ciascuno;
- che cosa **chiarire** per restringere il campo;
- **note per l'educazione** del paziente, pertinenti al quadro e alle bandiere rilevate.

## Che cosa è, e che cosa non è

È un **sistema a regole esplicite**, non un modello linguistico. Ogni suggerimento nasce da condizioni
scritte nel codice (`app/js/ragionamento/ipotesi.js`) e mostra sempre le ragioni che lo sostengono,
così puoi valutarle una per una e scartarle.

Questa scelta ha tre conseguenze pratiche:

1. **Nessun dato esce dal computer.** L'elaborazione è locale. Inviare una cartella clinica a un
   modello in cloud significherebbe trasferire dati di categoria particolare (art. 9 GDPR) a un
   fornitore terzo, con necessità di base giuridica, informativa aggiornata e accordo di
   responsabile del trattamento.
2. **È verificabile.** Puoi leggere la regola che ha prodotto un suggerimento, contestarla e
   modificarla. Un modello generativo non offre questa garanzia e può produrre affermazioni
   plausibili ma inventate — in ambito clinico è un rischio concreto.
3. **È deterministico.** Le stesse informazioni producono sempre lo stesso risultato, ed è coperto
   da test automatici.

Il limite è altrettanto netto: **il sistema conosce solo ciò che è stato scritto in cartella**, non
coglie sfumature, non vede il paziente e non sostituisce il ragionamento clinico. Non produce una
diagnosi. La sezione *Limiti di questa analisi* elenca le informazioni mancanti che pesano sulle
conclusioni.

## Come vengono ordinate le ipotesi

Ogni ipotesi dichiara elementi **a favore** (peso forte, moderato, debole), elementi **contro** che
sottraggono punteggio, e dati da **chiarire** che la discriminerebbero. Il punteggio è ordinale:
serve a mettere in fila le ipotesi e a rendere esplicito il perché, **non è una probabilità**.

Alcune ipotesi hanno un **requisito**: senza di esso non vengono nemmeno considerate. Per esempio il
dolore nociplastico richiede la persistenza oltre i tre mesi, così la sola irritabilità alta non lo
fa emergere in un quadro acuto.

## Priorità alle urgenze

Alcune combinazioni generano un'**allerta**, indipendente dalle ipotesi: sospetta sindrome della
cauda equina, segni di disfunzione arteriosa cervicale, instabilità craniocervicale, sospetta
frattura da fragilità, segni di primo motoneurone, elementi compatibili con infezione o patologia
sistemica.

Quando è presente un'allerta **urgente** le ipotesi non vengono proposte: la priorità è l'invio, non
la diagnosi differenziale.

## Regioni coperte

Rachide lombare, rachide cervicale, spalla, ginocchio, caviglia e piede, più le ipotesi trasversali
valide per ogni distretto. Per le regioni non ancora coperte compaiono solo le ipotesi trasversali,
le allerte e le indicazioni sulla dose dell'esame.

## Aggiungere o modificare una regola

Le ipotesi sono dati, non codice sparso. Per aggiungerne una basta una voce in
`app/js/ragionamento/ipotesi.js`:

```js
{
  id: 'identificativo-univoco',
  nome: 'Nome mostrato nell’elenco',
  regioni: ['ginocch'],              // '*' per renderla valida ovunque
  requisito: (c) => c.eta >= 40,     // facoltativo: senza, l’ipotesi è esclusa
  indizi: [
    { p: P.forte, t: 'Motivo mostrato all’utente', se: (c) => c.cerca(/parola chiave/) }
  ],
  contro: [ { p: P.medio, t: '…', se: (c) => … } ],
  chiarire: [ { t: 'Che cosa raccogliere', se: (c) => … } ],
  esame: [ { test: 'Nome del test', perche: 'che cosa dirimerebbe' } ],
  educa: { titolo: '…', punti: ['…'] }
}
```

Il contesto `c` offre i campi normalizzati della cartella (`c.eta`, `c.irritabilita`, `c.redflags`,
`c.romTable`…) e alcuni aiuti: `c.cerca(/regex/)` cerca in tutti i campi liberi, `c.inRegione(...)`,
`c.testPositivo(/nome/)`, `c.neuroPositivo(/slr/)`, `c.prom('odi')`.

Dopo ogni modifica conviene eseguire `npm test`, che verifica l'ordinamento nei casi tipici e il
comportamento sulle urgenze.

## Se in futuro servisse un modello linguistico

È tecnicamente possibile affiancare un LLM, per esempio per riformulare le note educative nel
linguaggio del singolo paziente. Prima però vanno risolti alcuni punti: quali dati verrebbero
inviati e con quale minimizzazione, con quale fornitore e con quale accordo di responsabile del
trattamento, come aggiornare l'informativa e come verificare quello che il modello produce.
Finché non sono chiariti, l'elaborazione resta locale.
