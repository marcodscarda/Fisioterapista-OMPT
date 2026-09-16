/* ============================================================
   Logica di fatturazione per prestazioni sanitarie
   ------------------------------------------------------------
   Riferimenti normativi applicati:
   - Esenzione IVA: art. 10, n. 18, D.P.R. 633/1972 (prestazioni
     sanitarie di diagnosi, cura e riabilitazione rese alla persona
     nell'esercizio di professioni sanitarie).
   - Imposta di bollo: D.P.R. 642/1972, all. A art. 13 — 2,00 euro
     su documenti esenti/non soggetti a IVA di importo superiore a
     77,47 euro; puo' essere addebitata al cliente (art. 15 D.P.R. 633/72,
     fuori campo IVA).
   - Regime forfettario: art. 1, commi 54-89, L. 190/2014. Niente IVA,
     niente ritenuta d'acconto.
   - Rivalsa INPS gestione separata 4%: art. 1, c. 212, L. 662/1996.
   - Detraibilita' per il paziente: spesa sanitaria, obbligo di
     pagamento tracciabile salvo le eccezioni di legge.
   ============================================================ */
import { round2, num, yearOf, addDaysISO, todayISO } from './util.js';

export const METODI_PAGAMENTO = [
  'Contanti', 'Bancomat / carta', 'Bonifico bancario', 'Assegno', 'Satispay', 'PayPal', 'Altro'
];

export const NOTE_ESENZIONE = {
  art10: 'Operazione esente da IVA ai sensi dell’art. 10, n. 18, D.P.R. 633/1972 — prestazione sanitaria resa alla persona nell’esercizio di professione sanitaria.',
  none: ''
};

export const NOTA_FORFETTARIO =
  'Operazione effettuata ai sensi dell’art. 1, commi da 54 a 89, della Legge n. 190/2014 — regime forfettario. ' +
  'Il compenso non è soggetto a ritenuta d’acconto ai sensi dell’art. 1, comma 67, della Legge n. 190/2014.';

export const NOTA_BOLLO =
  'Imposta di bollo di € 2,00 assolta sull’originale ai sensi del D.P.R. 642/1972 (all. A, art. 13) per importi superiori a € 77,47.';

export const NOTA_TRACCIABILITA =
  'Ai fini della detrazione fiscale il pagamento delle prestazioni sanitarie rese da strutture private deve avvenire con mezzi tracciabili, ' +
  'salvo le eccezioni previste dalla legge.';

export const NOTA_PRIVACY =
  'I dati personali sono trattati esclusivamente per finalità amministrativo-contabili e sanitarie, ai sensi del Reg. UE 2016/679.';

/** Riga vuota di default. */
export const rigaVuota = () => ({ descrizione: '', data: '', quantita: 1, prezzo: 0 });

/**
 * Calcola tutti i totali di una fattura.
 * @param {object} fattura     { righe, scontoImporto, bolloAddebitato, ... }
 * @param {object} imp         impostazioni dello studio
 * @returns {object} totali
 */
export function calcolaTotali(fattura, imp) {
  const righe = Array.isArray(fattura?.righe) ? fattura.righe : [];
  const imponibileLordo = round2(righe.reduce((s, r) => s + num(r.quantita, 0) * num(r.prezzo, 0), 0));
  const sconto = Math.min(round2(num(fattura?.scontoImporto, 0)), imponibileLordo);
  const imponibile = round2(imponibileLordo - sconto);

  const esente = (fattura?.esenzioneIva ?? imp?.esenzioneIva ?? 'art10') !== 'none';
  const aliquotaIva = esente ? 0 : num(fattura?.aliquotaIva, 22);
  const iva = esente ? 0 : round2(imponibile * aliquotaIva / 100);

  // Rivalsa INPS gestione separata (concorre alla base imponibile del documento)
  const rivalsaAttiva = fattura?.rivalsaAttiva ?? imp?.rivalsaInpsAttiva ?? false;
  const rivalsaPerc = num(fattura?.rivalsaPercento ?? imp?.rivalsaInpsPercento, 4);
  const rivalsa = rivalsaAttiva ? round2(imponibile * rivalsaPerc / 100) : 0;

  // Imposta di bollo: dovuta sui documenti esenti o non soggetti a IVA oltre la soglia
  const soglia = num(imp?.bolloSoglia, 77.47);
  const importoBollo = num(imp?.bolloImporto, 2);
  // Di norma il bollo segue la soglia di legge. Un documento puo' pero' forzarlo:
  // serve per i documenti importati, che devono conservare il totale con cui sono
  // stati realmente emessi, e per il bollo assolto in modo virtuale.
  const bolloDovuto = fattura?.bolloForzato === false ? false
    : fattura?.bolloForzato === true ? true
      : esente && round2(imponibile + rivalsa) > soglia;
  const bolloAddebitato = fattura?.bolloAddebitato ?? imp?.bolloAddebitato ?? true;
  const bollo = bolloDovuto ? importoBollo : 0;
  const bolloInTotale = bolloDovuto && bolloAddebitato ? importoBollo : 0;

  // Ritenuta d'acconto: non applicabile in regime forfettario
  const forfettario = (fattura?.regimeFiscale ?? imp?.regimeFiscale) === 'forfettario';
  const ritenutaAttiva = !forfettario && (fattura?.ritenutaAttiva ?? imp?.ritenutaAttiva ?? false);
  const ritenutaPerc = num(fattura?.ritenutaPercento ?? imp?.ritenutaPercento, 20);
  const baseRitenutaPerc = num(fattura?.ritenutaBasePercento ?? imp?.ritenutaBaseImponibilePercento, 100);
  const baseRitenuta = round2((imponibile + rivalsa) * baseRitenutaPerc / 100);
  const ritenuta = ritenutaAttiva ? round2(baseRitenuta * ritenutaPerc / 100) : 0;

  const totaleDocumento = round2(imponibile + rivalsa + iva + bolloInTotale);
  const nettoAPagare = round2(totaleDocumento - ritenuta);

  return {
    imponibileLordo, sconto, imponibile,
    esente, aliquotaIva, iva,
    rivalsaAttiva, rivalsaPerc, rivalsa,
    bolloDovuto, bolloAddebitato, bollo, bolloInTotale, soglia,
    bolloForzato: fattura?.bolloForzato ?? null,
    ritenutaAttiva, ritenutaPerc, baseRitenuta, ritenuta,
    totaleDocumento, nettoAPagare, forfettario
  };
}

/**
 * Numero completo nel formato "7/2026".
 * I documenti importati da un altro gestionale conservano il numero di origine
 * (per esempio "INV-000123"), che non e' necessariamente un intero.
 */
export const numeroCompleto = (f) =>
  f?.numeroTesto ? f.numeroTesto
    : f?.numero ? `${f.numero}/${f.anno || yearOf(f.data)}`
      : '(bozza)';

/** Il documento e' stato emesso, cioe' ha un numero definitivo? */
export const emessa = (f) => !!(f?.numero || f?.numeroTesto);

/** Totale incassato per una fattura. */
export const totaleIncassato = (incassi) => round2((incassi || []).reduce((s, i) => s + num(i.importo, 0), 0));

/**
 * Stato dell'incasso di una fattura.
 * @returns {{codice:string,label:string,kind:string,residuo:number,incassato:number}}
 */
export function statoFattura(fattura, incassi, totali) {
  const atteso = round2(num(totali?.nettoAPagare ?? fattura?.totali?.nettoAPagare, 0));
  const incassato = totaleIncassato(incassi);
  const residuo = round2(atteso - incassato);

  if (fattura?.annullata) return { codice: 'annullata', label: 'Annullata', kind: 'danger', residuo: 0, incassato };
  if (atteso > 0 && residuo <= 0.009) return { codice: 'pagata', label: 'Incassata', kind: 'ok', residuo: 0, incassato };
  if (incassato > 0) return { codice: 'parziale', label: 'Incasso parziale', kind: 'warn', residuo, incassato };

  const scadenza = fattura?.scadenza;
  if (scadenza && scadenza < todayISO()) return { codice: 'scaduta', label: 'Scaduta', kind: 'danger', residuo, incassato };
  return { codice: 'aperta', label: 'Da incassare', kind: 'info', residuo, incassato };
}

/** Data di scadenza a partire dalla data documento e dai giorni impostati. */
export const calcolaScadenza = (dataDoc, giorni) =>
  num(giorni, 0) > 0 ? addDaysISO(dataDoc, num(giorni, 0)) : '';

/** Righe generate a partire da un elenco di sedute da fatturare. */
export function righeDaSedute(sedute, listino) {
  const perTipo = new Map();
  for (const s of sedute) {
    const voce = listino.find(l => l.id === s.prestazioneId) || null;
    const chiave = voce?.id || s.tipoSeduta || 'seduta';
    const descr = voce?.nome || s.tipoSeduta || 'Seduta di fisioterapia';
    const prezzo = num(s.importo ?? voce?.prezzo, 0);
    const k = chiave + '|' + prezzo;
    if (!perTipo.has(k)) perTipo.set(k, { descrizione: descr, quantita: 0, prezzo, date: [] });
    const r = perTipo.get(k);
    r.quantita += 1;
    if (s.data) r.date.push(s.data);
  }
  return Array.from(perTipo.values()).map(r => ({
    descrizione: r.descrizione,
    data: r.date.sort().length
      ? (r.date.length === 1 ? r.date[0] : `${r.date[0]} … ${r.date.at(-1)}`)
      : '',
    quantita: r.quantita,
    prezzo: r.prezzo
  }));
}

/** Note di piede calcolate per il documento cartaceo. */
export function noteFattura(fattura, imp, totali) {
  const note = [];
  if (totali.esente) note.push(NOTE_ESENZIONE.art10);
  if (totali.forfettario) note.push(NOTA_FORFETTARIO);
  if (totali.bolloDovuto) {
    note.push(NOTA_BOLLO + (totali.bolloAddebitato
      ? ' Imposta di bollo addebitata al cliente ai sensi dell’art. 15 D.P.R. 633/1972 (fuori campo IVA).'
      : ' Imposta di bollo a carico del professionista.'));
  }
  if (totali.ritenutaAttiva) {
    note.push(`Ritenuta d’acconto ${totali.ritenutaPerc}% ai sensi dell’art. 25 D.P.R. 600/1973: il cliente, in qualità di sostituto d’imposta, versa € ${totali.ritenuta.toFixed(2)}.`);
  }
  if (fattura?.opposizioneSts) {
    note.push('Il paziente ha manifestato opposizione all’invio dei dati al Sistema Tessera Sanitaria per la dichiarazione precompilata.');
  }
  note.push(NOTA_TRACCIABILITA);
  if (imp?.noteFatturaLibere) note.push(imp.noteFatturaLibere);
  note.push(NOTA_PRIVACY);
  return note;
}
