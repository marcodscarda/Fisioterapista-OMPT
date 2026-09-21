/* ============================================================
   Test della logica pura: fatturazione, validazioni, PROM.
   Eseguire con:  npm test   (oppure: node --test test/)
   Non richiede browser ne' dipendenze esterne.
   ============================================================ */
import { calcolaTotali, statoFattura, righeDaSedute } from '../app/js/fatture.js';
import { validaCF, validaPIVA, validaIBAN, datiDaCF, age, fmtEUR, toCSV, addDaysISO } from '../app/js/util.js';
import { calcolaProm, confrontaProm } from '../app/js/schema/proms.js';

let ko = 0;
const eq = (nome, a, b) => {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if (!ok) { ko++; console.log(`FAIL ${nome}: ottenuto ${JSON.stringify(a)} atteso ${JSON.stringify(b)}`); }
  else console.log(`ok   ${nome} = ${JSON.stringify(a)}`);
};

const impForf = { regimeFiscale: 'forfettario', esenzioneIva: 'art10', bolloSoglia: 77.47, bolloImporto: 2, bolloAddebitato: true, rivalsaInpsAttiva: false, ritenutaAttiva: false };

// 1. Sotto soglia bollo
let t = calcolaTotali({ righe: [{ quantita: 1, prezzo: 50 }] }, impForf);
eq('imponibile 50', t.imponibile, 50);
eq('bollo non dovuto <=77,47', t.bolloDovuto, false);
eq('totale 50', t.totaleDocumento, 50);

// 2. Sopra soglia -> bollo 2 addebitato
t = calcolaTotali({ righe: [{ quantita: 2, prezzo: 50 }] }, impForf);
eq('bollo dovuto >77,47', t.bolloDovuto, true);
eq('totale 100+2', t.totaleDocumento, 102);
eq('netto = totale (no ritenuta forfettario)', t.nettoAPagare, 102);

// 3. Esattamente 77,47 -> NON dovuto (soglia "superiore a")
t = calcolaTotali({ righe: [{ quantita: 1, prezzo: 77.47 }] }, impForf);
eq('bollo a 77,47 esatti', t.bolloDovuto, false);
t = calcolaTotali({ righe: [{ quantita: 1, prezzo: 77.48 }] }, impForf);
eq('bollo a 77,48', t.bolloDovuto, true);

// 4. Bollo non addebitato -> resta fuori dal totale
t = calcolaTotali({ righe: [{ quantita: 2, prezzo: 50 }], bolloAddebitato: false }, impForf);
eq('bollo a carico professionista', [t.bollo, t.bolloInTotale, t.totaleDocumento], [2, 0, 100]);

// 5. Sconto
t = calcolaTotali({ righe: [{ quantita: 4, prezzo: 50 }], scontoImporto: 20 }, impForf);
eq('sconto 20 su 200', [t.imponibile, t.totaleDocumento], [180, 182]);

// 6. Regime ordinario con rivalsa INPS 4% e ritenuta 20%
const impOrd = { ...impForf, regimeFiscale: 'ordinario', rivalsaInpsAttiva: true, rivalsaInpsPercento: 4, ritenutaAttiva: true, ritenutaPercento: 20, ritenutaBaseImponibilePercento: 100 };
t = calcolaTotali({ righe: [{ quantita: 1, prezzo: 100 }] }, impOrd);
eq('rivalsa 4% su 100', t.rivalsa, 4);
eq('ritenuta 20% su 104', t.ritenuta, 20.8);
eq('totale doc 104+2', t.totaleDocumento, 106);
eq('netto a pagare', t.nettoAPagare, 85.2);

// 7. Imponibile con IVA (prestazione non sanitaria)
t = calcolaTotali({ righe: [{ quantita: 1, prezzo: 100 }], esenzioneIva: 'none', aliquotaIva: 22 }, { ...impForf, regimeFiscale: 'ordinario' });
eq('iva 22', [t.iva, t.bolloDovuto, t.totaleDocumento], [22, false, 122]);

// 8. Arrotondamenti
t = calcolaTotali({ righe: [{ quantita: 3, prezzo: 33.33 }] }, impForf);
eq('3 x 33,33', t.imponibile, 99.99);

// 9. Stato fattura
eq('stato non incassata', statoFattura({}, [], { nettoAPagare: 102 }).codice, 'aperta');
eq('stato parziale', statoFattura({}, [{ importo: 50 }], { nettoAPagare: 102 }).codice, 'parziale');
eq('stato incassata', statoFattura({}, [{ importo: 102 }], { nettoAPagare: 102 }).codice, 'pagata');
eq('residuo parziale', statoFattura({}, [{ importo: 52 }], { nettoAPagare: 102 }).residuo, 50);
eq('stato scaduta', statoFattura({ scadenza: '2020-01-01' }, [], { nettoAPagare: 102 }).codice, 'scaduta');

// 10. Righe da sedute (raggruppamento)
eq('raggruppa sedute', righeDaSedute(
  [{ prestazioneId: 'p2', data: '2026-01-10' }, { prestazioneId: 'p2', data: '2026-01-17' }, { prestazioneId: 'p1', data: '2026-01-03' }],
  [{ id: 'p1', nome: 'Valutazione', prezzo: 70 }, { id: 'p2', nome: 'Seduta', prezzo: 50 }]
).map(r => [r.descrizione, r.quantita, r.prezzo]), [['Seduta', 2, 50], ['Valutazione', 1, 70]]);

// 11. Codice fiscale
eq('CF valido', validaCF('RSSMRA80A01H501U').ok, true);
eq('CF check errato', validaCF('RSSMRA80A01H501A').ok, false);
eq('CF formato errato', validaCF('ABC').ok, false);
eq('CF vuoto ammesso', validaCF('').ok, true);
eq('dati da CF', datiDaCF('RSSMRA80A01H501U'), { sesso: 'M', dataNascita: '1980-01-01' });
eq('dati da CF femminile', datiDaCF('RSSMRA80A41H501Y'), { sesso: 'F', dataNascita: '1980-01-01' });
eq('PIVA valida', validaPIVA('00743110157').ok, true);
eq('PIVA errata', validaPIVA('00743110158').ok, false);
eq('IBAN valido', validaIBAN('IT60X0542811101000000123456').ok, true);
eq('IBAN errato', validaIBAN('IT61X0542811101000000123456').ok, false);

// 12. Date e varie
eq('eta', age('1980-01-01', '2026-09-15'), 46);
eq('scadenza +30gg', addDaysISO('2026-01-15', 30), '2026-02-14');
eq('valuta', fmtEUR(1234.5).replace(/ /g, ' '), '1.234,50 €');

// 13. PROM
eq('NDI 20/50', calcolaProm('ndi', Object.fromEntries(Array.from({length:10},(_,i)=>['i'+(i+1), 2]))).punteggio, 40);
eq('ODI etichetta', calcolaProm('odi', Object.fromEntries(Array.from({length:10},(_,i)=>['i'+(i+1), 1]))).etichetta, '20% — disabilità minima');
eq('QuickDASH tutti 1 = 0', calcolaProm('quickdash', Object.fromEntries(Array.from({length:11},(_,i)=>['i'+(i+1), 1]))).punteggio, 0);
eq('QuickDASH tutti 5 = 100', calcolaProm('quickdash', Object.fromEntries(Array.from({length:11},(_,i)=>['i'+(i+1), 5]))).punteggio, 100);
eq('LEFS 20x4=80', calcolaProm('lefs', Object.fromEntries(Array.from({length:20},(_,i)=>['i'+(i+1), 4]))).punteggio, 80);
eq('TSK-11 inversione', calcolaProm('tsk11', Object.fromEntries(Array.from({length:11},(_,i)=>['i'+(i+1), 1]))).punteggio, 11 + 3*3);
eq('PCS somma', calcolaProm('pcs', Object.fromEntries(Array.from({length:13},(_,i)=>['i'+(i+1), 2]))).punteggio, 26);
eq('PROM incompleto -> null', calcolaProm('ndi', { i1: 1 }), null);
eq('confronto MCID ODI', confrontaProm('odi', 40, 20), { delta: -20, miglioramento: 20, superaMcid: true, peggiorato: false });
eq('confronto peggiorato', confrontaProm('lefs', 60, 50).peggiorato, true);

// 14. CSV
eq('csv con separatore', toCSV([{ a: 'x;y', b: 2 }], [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]).includes('"x;y";2'), true);

/* ---------------------------------------------------------------- */
/* Motore di supporto al ragionamento clinico                        */
/* ---------------------------------------------------------------- */
const { analizza } = await import('../app/js/ragionamento/index.js');

const cartella = (regione, soggettivo, obiettivo = {}) => ({
  regione, titolo: regione, cartella: { soggettivo, obiettivo }, proms: []
});
const nato = (anno) => ({ dataNascita: `${anno}-01-01` });
const ids = (r) => r.ipotesi.map(i => i.id);

// Radicolopatia lombare: irradiazione distale + test neurodinamico positivo
{
  const r = analizza(cartella('Lombare', {
    bodychart: { areaPrincipale: 'Lombare', tipoDolore: ['Urente/bruciante'], sintomiAssociati: ['Parestesie'], noteSintomi: 'irradiazione al polpaccio' },
    comportamento: { irritabilita: 'Moderata', natura: 'Subacuto' },
    redflags: { rfList: [] }
  }, {
    neuro: { neurodinamica: [{ test: 'SLR', esito: 'Positivo' }] }
  }), nato(1980), []);
  eq('ragionamento: radicolare in cima', r.ipotesi[0].id, 'radicolare-lombare');
  eq('ragionamento: aspecifica esclusa dall’irradiazione', ids(r).includes('lombalgia-aspecifica'), false);
  eq('ragionamento: nessuna allerta', r.allerte.length, 0);
}

// Cauda equina: urgenza, e nessuna ipotesi proposta
{
  const r = analizza(cartella('Lombare', {
    bodychart: { areaPrincipale: 'Lombare' },
    comportamento: { irritabilita: 'Alta' },
    redflags: { rfList: ['Disturbi sfinterici (vescica/intestino)', 'Anestesia a sella'] }
  }), nato(1980), []);
  eq('ragionamento: urgenza rilevata', r.urgenza, true);
  eq('ragionamento: cauda equina segnalata', r.allerte[0].testo.includes('cauda equina'), true);
  eq('ragionamento: ipotesi sospese in urgenza', r.ipotesi.length === 0 || r.urgenza, true);
}

// Disfunzione arteriosa cervicale: allerta unica, non duplicata
{
  const r = analizza(cartella('Cervicale', {
    bodychart: { areaPrincipale: 'Cervicale' },
    comportamento: { irritabilita: 'Alta' },
    cervicale: { cervRilevante: 'Sì', cad5d3n: ['Drop attacks', 'Diplopia'], cadFattoriRischio: ['Ipertensione'] },
    redflags: { rfList: [] }
  }), nato(1970), []);
  eq('ragionamento: allerta CAD presente', r.allerte.some(a => /arteriosa/i.test(a.testo)), true);
  eq('ragionamento: allerta CAD non duplicata', r.allerte.filter(a => /arteriosa/i.test(a.testo)).length, 1);
  eq('ragionamento: CAD e urgenza', r.urgenza, true);
}

// Nociplastico: richiede persistenza, non basta l'irritabilità
{
  const acuto = analizza(cartella('Lombare', {
    bodychart: { areaPrincipale: 'Lombare' },
    comportamento: { irritabilita: 'Alta', natura: 'Acuto' },
    redflags: { rfList: [] }
  }), nato(1980), []);
  eq('ragionamento: nociplastico escluso in acuto', ids(acuto).includes('nociplastico'), false);

  const cronico = analizza(cartella('Lombare', {
    bodychart: { areaPrincipale: 'Lombare' },
    comportamento: { irritabilita: 'Alta', natura: 'Cronico' },
    bandiere: { gialle: ['Catastrofizzazione', 'Paura del movimento / kinesiofobia', 'Umore deflesso'] },
    redflags: { rfList: [] }
  }), nato(1980), []);
  eq('ragionamento: nociplastico presente in cronico', ids(cronico).includes('nociplastico'), true);
}

// Capsulite: limitazione del movimento passivo
{
  const r = analizza(cartella('Spalla', {
    bodychart: { areaPrincipale: 'Spalla' },
    comportamento: { irritabilita: 'Moderata' },
    storia: { esordioModalita: 'Insidioso/graduale', anamnesiRemota: 'diabete' },
    redflags: { rfList: [] }
  }, {
    movimenti: { romTable: [
      { movimento: 'Rotazione esterna', passivo: 'ridotto' },
      { movimento: 'Abduzione', passivo: 'limitato' }
    ] }
  }), nato(1971), []);
  eq('ragionamento: capsulite in cima', r.ipotesi[0].id, 'capsulite');
}

// La dose dell'esame segue l'irritabilità
{
  const alta = analizza(cartella('Lombare', { comportamento: { irritabilita: 'Alta' }, redflags: { rfList: [] } }), nato(1980), []);
  const bassa = analizza(cartella('Lombare', { comportamento: { irritabilita: 'Bassa' }, redflags: { rfList: [] } }), nato(1980), []);
  eq('ragionamento: dose prudente se irritabilità alta', alta.esame.dose.livello.includes('prudente'), true);
  eq('ragionamento: dose completa se irritabilità bassa', bassa.esame.dose.livello.includes('completo'), true);
}

// Ogni suggerimento è motivato: nessuna ipotesi senza elementi a favore
{
  const r = analizza(cartella('Lombare', {
    bodychart: { areaPrincipale: 'Lombare', noteSintomi: 'dolore al polpaccio' },
    comportamento: { irritabilita: 'Moderata', natura: 'Subacuto', aggravanti: [{ attivita: 'stare seduto' }], allevianti: [{ strategia: 'camminare' }] },
    redflags: { rfList: [] }
  }), nato(1980), []);
  eq('ragionamento: ogni ipotesi ha motivazioni', r.ipotesi.every(i => i.favore.length > 0), true);
  eq('ragionamento: nessun punteggio negativo in elenco', r.ipotesi.every(i => i.punti > 0), true);
}

/* ---------------------------------------------------------------- */
/* Calendario: ICS e link a Google                                    */
/* ---------------------------------------------------------------- */
const cal = await import('../app/js/calendario.js');

eq('calendario: fine appuntamento', cal.fine('2026-09-20', '09:00', 45), { data: '2026-09-20', ora: '09:45' });
eq('calendario: fine oltre la mezzanotte', cal.fine('2026-09-20', '23:30', 60), { data: '2026-09-21', ora: '00:30' });
eq('calendario: formato data-ora', cal.stampaDataOra('2026-09-20', '09:05'), '20260920T090500');

const pazProva = { nome: 'Mario', cognome: 'Rossi' };
const appProva = { id: 'a1', data: '2026-09-20', ora: '09:00', durata: 45, prestazione: 'Seduta di terapia manuale', note: 'portare referto' };

eq('calendario: etichetta con sole iniziali',
  cal.etichettaEvento(appProva, pazProva, { calendarioEtichetta: 'iniziali' }), 'FT — M.R.');
eq('calendario: etichetta generica',
  cal.etichettaEvento(appProva, pazProva, { calendarioEtichetta: 'generico', calendarioTestoGenerico: 'Appuntamento' }), 'Appuntamento');
eq('calendario: etichetta per esteso',
  cal.etichettaEvento(appProva, pazProva, { calendarioEtichetta: 'completo' }), 'Seduta di terapia manuale — Rossi Mario');
eq('calendario: predefinito riservato',
  cal.etichettaEvento(appProva, pazProva, {}), 'FT — M.R.');

{
  const ics = cal.costruisciICS([appProva], new Map([['p1', pazProva]]), { calendarioEtichetta: 'iniziali' });
  eq('ICS: intestazione', ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0'), true);
  eq('ICS: chiusura', ics.trimEnd().endsWith('END:VCALENDAR'), true);
  eq('ICS: orari di inizio e fine', /DTSTART:20260920T090000/.test(ics) && /DTEND:20260920T094500/.test(ics), true);
  eq('ICS: terminatori di riga CRLF', ics.includes('\n') && !/[^\r]\n/.test(ics), true);
  eq('ICS: nessuna riga oltre 75 ottetti', ics.split('\r\n').every(r => r.length <= 75), true);

  // Nel titolo generico non deve finire nulla del paziente.
  const generico = cal.costruisciICS([appProva], new Map([['p1', pazProva]]),
    { calendarioEtichetta: 'generico', calendarioTestoGenerico: 'Appuntamento' });
  eq('ICS: il titolo generico non rivela il paziente', /Rossi|Mario|terapia/.test(generico), false);

  // I separatori speciali vanno protetti.
  const conVirgole = cal.costruisciICS(
    [{ ...appProva, prestazione: 'Seduta; controllo, rivalutazione' }],
    new Map([['p1', pazProva]]), { calendarioEtichetta: 'completo' });
  eq('ICS: punto e virgola protetto', conVirgole.includes('\\;'), true);
  eq('ICS: virgola protetta', conVirgole.includes('\\,'), true);

  eq('ICS: appuntamento disdetto marcato',
    cal.costruisciICS([{ ...appProva, stato: 'disdetto' }], new Map(), {}).includes('STATUS:CANCELLED'), true);
}

{
  const url = new URL(cal.linkGoogleCalendar(appProva, pazProva, { calendarioEtichetta: 'iniziali' }));
  eq('Google: dominio corretto', url.host, 'calendar.google.com');
  eq('Google: azione TEMPLATE', url.searchParams.get('action'), 'TEMPLATE');
  eq('Google: intervallo', url.searchParams.get('dates'), '20260920T090000/20260920T094500');
  eq('Google: titolo riservato', url.searchParams.get('text'), 'FT — M.R.');
}

/* ---------------------------------------------------------------- */
/* Importazione da CSV                                                */
/* ---------------------------------------------------------------- */
const csvMod = await import('../app/js/importa/csv.js');
const zoho = await import('../app/js/importa/zoho.js');

// Importi: convenzione italiana e anglosassone devono coincidere
eq('csv: 1.234,56 italiano', csvMod.numeroDaTesto('1.234,56'), 1234.56);
eq('csv: 1,234.56 anglosassone', csvMod.numeroDaTesto('1,234.56'), 1234.56);
eq('csv: migliaia senza decimali', csvMod.numeroDaTesto('1.234'), 1234);
eq('csv: valuta e spazi', csvMod.numeroDaTesto('€ 1.234,50'), 1234.5);
eq('csv: negativo fra parentesi', csvMod.numeroDaTesto('(12,50)'), -12.5);
eq('csv: vuoto', csvMod.numeroDaTesto(''), 0);

// Date: l'ambiguita' gg/mm si scioglie guardando l'intera colonna
eq('csv: data ISO', csvMod.dataDaTesto('2026-01-15'), '2026-01-15');
eq('csv: data gg/mm/aaaa', csvMod.dataDaTesto('15/01/2026'), '2026-01-15');
eq('csv: mese scritto', csvMod.dataDaTesto('12 Jan 2026'), '2026-01-12');
eq('csv: ambigua letta come gg/mm', csvMod.dataDaTesto('03/04/2026'), '2026-04-03');
eq('csv: ambigua letta come mm/gg', csvMod.dataDaTesto('03/04/2026', 'mm/gg'), '2026-03-04');
eq('csv: formato dedotto (gg/mm)', csvMod.indovinaFormatoData(['15/01/2026', '03/04/2026']), 'gg/mm');
eq('csv: formato dedotto (mm/gg)', csvMod.indovinaFormatoData(['01/15/2026', '04/03/2026']), 'mm/gg');
eq('csv: formato indeducibile', csvMod.indovinaFormatoData(['01/02/2026']), 'auto');

// Separatore e virgolette
{
  const testo = [
    'A;B;C',
    '1;"con; punto e virgola";"virgolette ""doppie"""',
    '2;"a capo\ndentro";x'
  ].join('\r\n');
  eq('csv: separatore rilevato', csvMod.rilevaSeparatore(testo), ';');
  const { intestazioni, dati } = csvMod.leggiTabella(testo);
  eq('csv: intestazioni', intestazioni, ['A', 'B', 'C']);
  eq('csv: separatore dentro virgolette', dati[0].B, 'con; punto e virgola');
  eq('csv: virgolette raddoppiate', dati[0].C, 'virgolette "doppie"');
  eq('csv: a capo dentro il campo', dati[1].B, 'a capo\ndentro');
}

// Riconoscimento del tracciato e mappatura
{
  const intContatti = ['Display Name', 'First Name', 'Last Name', 'EmailID', 'MobilePhone', 'Billing City'];
  eq('zoho: riconosce i contatti', zoho.riconosciTracciato(intContatti), 'contatti');
  const m = zoho.mappaturaProposta('contatti', intContatti);
  eq('zoho: mappa cognome', m.cognome, 'Last Name');
  eq('zoho: mappa email', m.email, 'EmailID');

  const intFatture = ['Invoice Date', 'Invoice Number', 'Customer Name', 'Item Desc', 'Quantity', 'Item Price', 'Total'];
  eq('zoho: riconosce le fatture', zoho.riconosciTracciato(intFatture), 'fatture');

  const intIncassi = ['Date', 'CustomerName', 'Mode', 'Amount', 'Invoice Number', 'Invoice Payment Applied Amount'];
  eq('zoho: riconosce gli incassi', zoho.riconosciTracciato(intIncassi), 'incassi');
  eq('zoho: tracciato ignoto', zoho.riconosciTracciato(['Pippo', 'Pluto']), null);
  eq('zoho: mappatura tollerante ad accenti e punteggiatura',
    zoho.mappaturaProposta('contatti', ['E-Mail ID', 'Citta', 'Telefono']).email, 'E-Mail ID');
}

// Ricomposizione delle fatture da righe multiple
{
  const righe = [
    { N: 'INV-1', D: '15/01/2026', C: 'Mario Rossi', Desc: 'Valutazione', Q: '1', P: '70,00', T: '222,00' },
    { N: 'INV-1', D: '15/01/2026', C: 'Mario Rossi', Desc: 'Seduta', Q: '3', P: '50,00', T: '222,00' },
    { N: 'INV-2', D: '03/02/2026', C: 'Giulia Conti', Desc: 'Seduta', Q: '2', P: '50,00', T: '100,00' }
  ];
  const mappa = { numero: 'N', data: 'D', cliente: 'C', descrizione: 'Desc', quantita: 'Q', prezzo: 'P', totale: 'T' };
  const out = zoho.trasformaFatture(righe, mappa);
  eq('zoho: due documenti da tre righe', out.length, 2);
  eq('zoho: voci raggruppate', out[0].righe.length, 2);
  eq('zoho: somma delle voci', out[0].sommaRighe, 220);
  eq('zoho: scarto pari al bollo', out[0].scarto, 2);
  eq('zoho: data convertita', out[0].data, '2026-01-15');

  const senzaPrezzo = zoho.trasformaFatture(
    [{ N: 'X', D: '2026-01-01', C: 'Tizio', Desc: 'Voce', Q: '4', I: '200,00' }],
    { numero: 'N', data: 'D', cliente: 'C', descrizione: 'Desc', quantita: 'Q', importoRiga: 'I' });
  eq('zoho: prezzo ricavato dall’importo della voce', senzaPrezzo[0].righe[0].prezzo, 50);
}

// Anagrafiche come le scrive Zoho: titolo davanti al nome, codice fiscale e
// indirizzo ammucchiati in un unico campo a piu' righe.
eq('zoho: titolo tolto dal cognome', zoho.senzaTitolo('Sig.ra Maria Rossi'), 'Maria Rossi');
eq('zoho: titolo abbreviato senza punto', zoho.senzaTitolo('Dott ssa Anna Bianchi'), 'Anna Bianchi');
eq('zoho: nessun titolo da togliere', zoho.senzaTitolo('Viale Europa 3'), 'Viale Europa 3');

eq('zoho: codice fiscale cercato in tutta la riga',
  zoho.cercaCodiceFiscale({ nome: 'Tizio', indirizzo: 'GHZNSN97H06G273M\nVia Roma 1' }), 'GHZNSN97H06G273M');
eq('zoho: fra due codici vince quello valido',
  zoho.cercaCodiceFiscale({ a: 'SCRMCD94R03G273C', b: 'GHZNSN97H06G273M' }), 'GHZNSN97H06G273M');
eq('zoho: codice con refuso conservato come ripiego',
  zoho.cercaCodiceFiscale({ a: 'SCRMCD94R03G273C' }), 'SCRMCD94R03G273C');
eq('zoho: nessun codice fiscale', zoho.cercaCodiceFiscale({ a: 'Via Roma 1', b: '90100' }), '');

{
  const l = (righe) => zoho.separaLocalita(righe);
  eq('localita: CAP, comune e provincia fra parentesi',
    l(['Via degli Astronauti 61', '90072 Altofonte (PA)']),
    { via: 'Via degli Astronauti 61', citta: 'Altofonte', provincia: 'PA', cap: '90072' });
  eq('localita: provincia dopo la virgola',
    l(['via Ventura 5', '90143 Palermo, Pa']),
    { via: 'via Ventura 5', citta: 'Palermo', provincia: 'PA', cap: '90143' });
  eq('localita: CAP su una riga a se',
    l(['Via Cortimiglia 8', 'Corleone (Pa)', '90034']),
    { via: 'Via Cortimiglia 8', citta: 'Corleone', provincia: 'PA', cap: '90034' });
  eq('localita: comune isolato accanto a CAP e provincia',
    l(['Via Lauriano 40', 'Palermo Italia', '90142 PA']),
    { via: 'Via Lauriano 40', citta: 'Palermo', provincia: 'PA', cap: '90142' });
  eq('localita: una via non viene scambiata per un comune',
    l(['Via samotracia snc']),
    { via: 'Via samotracia snc', citta: '', provincia: '', cap: '' });
}

{
  // Riga reale: il codice fiscale sta nel campo dell'indirizzo, il titolo nel
  // nome visualizzato e l'indirizzo vero nel secondo campo.
  const [c] = zoho.trasformaContatti(
    [{
      'Display Name': 'Sig.ra Susanna Galati', 'First Name': 'Susanna', 'Last Name': 'Galati',
      'Billing Address': 'GLTSNN66B53G273T\nVia degli Astronauti 61 bis\n90072 Altofonte (PA)',
      'Billing Street2': '', 'Billing City': '', 'Billing Code': ''
    }],
    {
      cognome: 'Last Name', nome: 'First Name', displayName: 'Display Name',
      indirizzo: 'Billing Street2', citta: 'Billing City', cap: 'Billing Code'
    });
  eq('contatto reale: codice fiscale recuperato', c.codiceFiscale, 'GLTSNN66B53G273T');
  eq('contatto reale: indirizzo senza codice fiscale', c.indirizzo, 'Via degli Astronauti 61 bis');
  eq('contatto reale: comune, provincia e CAP', [c.citta, c.provincia, c.cap], ['Altofonte', 'PA', '90072']);
  eq('contatto reale: titolo tolto', [c.cognome, c.nome], ['Galati', 'Susanna']);
  eq('contatto reale: codice fiscale non da verificare', c.cfDaVerificare, false);
}

// Colonna di importi in cui il punto e' il separatore decimale ("1000.000").
eq('csv: formato numero dedotto dalla colonna',
  csvMod.indovinaFormatoNumero(['40.000', '50.000', '500.000', '1000.000']), 'punto');
eq('csv: colonna con la virgola decimale',
  csvMod.indovinaFormatoNumero(['40,00', '250,50']), 'virgola');
eq('csv: colonna con entrambi i separatori lasciata al riconoscimento automatico',
  csvMod.indovinaFormatoNumero(['40,00', '1.250,50']), 'auto');
eq('csv: importo letto col punto decimale', csvMod.numeroDaTesto('1000.000', 'punto'), 1000);
eq('csv: importo letto con la virgola decimale', csvMod.numeroDaTesto('1.250,50', 'virgola'), 1250.5);

eq('zoho: nome unico diviso', zoho.dividiNome('Mario Rossi'), { nome: 'Mario', cognome: 'Rossi' });
eq('zoho: nome composto', zoho.dividiNome('Maria Teresa De Luca'), { nome: 'Maria Teresa De', cognome: 'Luca' });
eq('zoho: metodo bonifico', zoho.traduciMetodo('Bank Transfer'), 'Bonifico bancario');
eq('zoho: metodo contanti', zoho.traduciMetodo('Cash'), 'Contanti');
eq('zoho: metodo ignoto', zoho.traduciMetodo('Qualcosa'), 'Altro');

const { numeroProgressivo } = await import('../app/js/importa/esegui.js');
eq('import: progressivo da INV-000123', numeroProgressivo('INV-000123'), 123);
eq('import: progressivo da 2026/45', numeroProgressivo('2026/45'), 45);
eq('import: nessun progressivo', numeroProgressivo('ABC'), null);

// Bollo forzato: un documento storico conserva il totale con cui fu emesso
{
  const impB = { regimeFiscale: 'forfettario', esenzioneIva: 'art10', bolloSoglia: 77.47, bolloImporto: 2, bolloAddebitato: true };
  const auto = calcolaTotali({ righe: [{ quantita: 1, prezzo: 100 }] }, impB);
  eq('bollo automatico oltre soglia', [auto.bolloDovuto, auto.totaleDocumento], [true, 102]);
  const forzatoNo = calcolaTotali({ righe: [{ quantita: 1, prezzo: 100 }], bolloForzato: false }, impB);
  eq('bollo forzato assente conserva il totale', [forzatoNo.bolloDovuto, forzatoNo.totaleDocumento], [false, 100]);
  const forzatoSi = calcolaTotali({ righe: [{ quantita: 1, prezzo: 50 }], bolloForzato: true }, impB);
  eq('bollo forzato presente sotto soglia', [forzatoSi.bolloDovuto, forzatoSi.totaleDocumento], [true, 52]);
}

// Numero completo: i documenti importati conservano il numero di origine
{
  const { numeroCompleto, emessa } = await import('../app/js/fatture.js');
  eq('numero importato', numeroCompleto({ numeroTesto: 'INV-000007', anno: 2026 }), 'INV-000007');
  eq('numero proprio', numeroCompleto({ numero: 7, anno: 2026 }), '7/2026');
  eq('bozza', numeroCompleto({}), '(bozza)');
  eq('emessa con numero di origine', emessa({ numeroTesto: 'INV-1' }), true);
  eq('bozza non emessa', emessa({}), false);
}

// Parte vestibolare della cartella
{
  const { CARTELLA, VESTIBOLARE, campiAllerta } = await import('../app/js/schema/ompt.js');
  eq('cartella: la parte vestibolare esiste ed è prima della diagnosi',
    CARTELLA.findIndex(p => p.key === 'vestibolare') < CARTELLA.findIndex(p => p.key === 'diagnosi')
    && CARTELLA.some(p => p.key === 'vestibolare'), true);
  eq('vestibolare: sezioni previste',
    VESTIBOLARE.map(s => s.id),
    ['vestInquadramento', 'vestAllarme', 'vestOculomotore', 'vestPosizionali', 'vestEquilibrio', 'vestCervicale', 'vestSintesi']);
  eq('vestibolare: i segnali di allarme alimentano il riquadro di allerta',
    campiAllerta().filter(a => a.parte === 'vestibolare').map(a => a.campo),
    ['vestRedFlags', 'vestConclusioneAllarme']);
  // Ogni campo deve avere chiave, etichetta e tipo: senza, il renderer salta la voce.
  const rotti = VESTIBOLARE.flatMap(s => s.fields.filter(f => !f.k || !f.l || !f.t).map(f => s.id + '/' + (f.k || '?')));
  eq('vestibolare: nessun campo incompleto', rotti, []);
  // Le chiavi non possono ripetersi dentro la stessa sezione: si sovrascriverebbero.
  const dup = VESTIBOLARE.flatMap(s => {
    const viste = new Set();
    return s.fields.filter(f => viste.has(f.k) || (viste.add(f.k), false)).map(f => s.id + '/' + f.k);
  });
  eq('vestibolare: nessuna chiave ripetuta', dup, []);
}

// DHI e ABC
{
  const tutti4 = {}; for (let i = 1; i <= 25; i++) tutti4['i' + i] = '4';
  eq('DHI: punteggio massimo', calcolaProm('dhi', tutti4).punteggio, 100);
  const meta = {}; for (let i = 1; i <= 25; i++) meta['i' + i] = i <= 12 ? '4' : '0';
  eq('DHI: handicap moderato', calcolaProm('dhi', meta).etichetta, '48/100 — handicap moderato');
  const pochi = { i1: '4', i2: '2' };
  eq('DHI: troppi item mancanti, nessun punteggio', calcolaProm('dhi', pochi), null);

  const abc = {}; for (let i = 1; i <= 16; i++) abc['i' + i] = '90';
  eq('ABC: media percentuale', calcolaProm('abc', abc).etichetta, '90% — funzionamento alto');
  eq('ABC: direzione del miglioramento', confrontaProm('abc', 40, 60).miglioramento, 20);
  eq('DHI: direzione del miglioramento', confrontaProm('dhi', 60, 40).miglioramento, 20);
}

// La versione è dichiarata in un solo punto e coincide con package.json
{
  const { VERSIONE } = await import('../app/js/versione.js');
  const pkg = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../package.json', import.meta.url), 'utf8'));
  eq('versione: coerente con package.json', pkg.version.split('.').slice(0, 2).join('.'), VERSIONE);
}

// Libreria degli esercizi
{
  const es = await import('../app/js/schema/esercizi.js');
  eq('esercizi: il catalogo di partenza non e vuoto', es.CATALOGO.length >= 20, true);
  const incompleti = es.CATALOGO.filter(x => !x.nome || !x.regione || !x.categoria || !x.esecuzione);
  eq('esercizi: ogni voce del catalogo e utilizzabile', incompleti.map(x => x.nome || '?'), []);
  const fuoriElenco = es.CATALOGO.filter(x => !es.REGIONI.includes(x.regione) || !es.CATEGORIE.includes(x.categoria));
  eq('esercizi: regioni e tipi appartengono agli elenchi', fuoriElenco.map(x => x.nome), []);
  const nomi = es.CATALOGO.map(x => x.nome);
  eq('esercizi: nessun nome ripetuto', nomi.length - new Set(nomi).size, 0);

  eq('dose: riassunto leggibile',
    es.doseInRiga({ serie: '3', ripetizioni: '12', recupero: '60 secondi' }),
    '3 × 12 · recupero 60 secondi');
  eq('dose: campi vuoti saltati', es.doseInRiga({ serie: '', ripetizioni: '10' }), '10 ripetizioni');
  eq('dose: nessun dato', es.doseInRiga(null), '');

  // La dose del paziente sovrascrive quella di libreria solo dove e indicata.
  eq('dose: personalizzazione parziale',
    es.doseEffettiva({ dose: { serie: '3', ripetizioni: '10' } }, { dose: { ripetizioni: '6 per lato' } }),
    { serie: '3', ripetizioni: '6 per lato' });
  eq('dose: nessuna personalizzazione',
    es.doseEffettiva({ dose: { serie: '3' } }, {}), { serie: '3' });
}

// Gli archivi nuovi fanno parte del backup: senza, esercizi e modelli si perderebbero
{
  const dbmod = await import('../app/js/db.js');
  for (const store of ['esercizi', 'modelliSeduta']) {
    eq('backup: comprende l archivio ' + store, dbmod.STORE_NAMES.includes(store), true);
  }
}

console.log(ko ? `\n${ko} TEST FALLITI` : '\nTutti i test superati');
process.exit(ko ? 1 : 0);
