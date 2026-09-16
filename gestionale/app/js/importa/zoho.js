/* ============================================================
   Importazione da Zoho Invoice (e da CSV simili)
   ------------------------------------------------------------
   Le intestazioni degli export cambiano con la lingua e la versione
   del programma di origine: invece di pretendere un tracciato fisso,
   ogni campo dichiara i nomi di colonna che lo possono rappresentare
   e la mappatura proposta resta modificabile dall'utente.
   ============================================================ */
import { numeroDaTesto, dataDaTesto, indovinaFormatoData } from './csv.js';
import { normalize, round2 } from '../util.js';

/** Confronto tollerante fra intestazioni: via accenti, spazi e punteggiatura. */
const chiave = (s) => normalize(s).replace(/[^a-z0-9]/g, '');

/* ------------------------------------------------------------------ */
/* Campi riconosciuti, per tipo di file                                */
/* ------------------------------------------------------------------ */
export const TRACCIATI = {
  contatti: {
    nome: 'Anagrafiche (Contacts)',
    descrizione: 'Il file dei contatti esportato da Zoho: diventa l’elenco dei pazienti.',
    campi: [
      { k: 'cognome', l: 'Cognome', alias: ['lastname', 'cognome', 'surname'] },
      { k: 'nome', l: 'Nome', alias: ['firstname', 'nome'] },
      { k: 'displayName', l: 'Nome visualizzato', alias: ['displayname', 'contactname', 'customername', 'companyname', 'nomevisualizzato'] },
      { k: 'email', l: 'E-mail', alias: ['emailid', 'email', 'emailaddress', 'posta', 'indirizzoemail'] },
      { k: 'telefono', l: 'Telefono', alias: ['mobilephone', 'phone', 'telefono', 'cellulare', 'mobile'] },
      { k: 'codiceFiscale', l: 'Codice fiscale', alias: ['codicefiscale', 'cf', 'taxid', 'cfpiva', 'fiscalcode'] },
      { k: 'partitaIva', l: 'Partita IVA', alias: ['partitaiva', 'piva', 'vatnumber', 'vatid'] },
      { k: 'indirizzo', l: 'Indirizzo', alias: ['billingaddress', 'billingstreet', 'indirizzo', 'billingstreet2', 'address'] },
      { k: 'cap', l: 'CAP', alias: ['billingcode', 'billingzip', 'cap', 'zipcode', 'postalcode'] },
      { k: 'citta', l: 'Città', alias: ['billingcity', 'citta', 'city'] },
      { k: 'provincia', l: 'Provincia', alias: ['billingstate', 'provincia', 'state'] },
      { k: 'note', l: 'Note', alias: ['notes', 'note', 'remarks'] }
    ]
  },

  fatture: {
    nome: 'Fatture (Invoices)',
    descrizione: 'L’export delle fatture. Zoho scrive una riga per ogni voce: le righe con lo stesso numero vengono ricomposte in un unico documento.',
    campi: [
      { k: 'numero', l: 'Numero fattura', alias: ['invoicenumber', 'numerofattura', 'numero', 'invoiceid'], obbligatorio: true },
      { k: 'data', l: 'Data', alias: ['invoicedate', 'datafattura', 'data', 'date'], obbligatorio: true },
      { k: 'scadenza', l: 'Scadenza', alias: ['duedate', 'scadenza', 'datascadenza'] },
      { k: 'cliente', l: 'Intestatario', alias: ['customername', 'clientname', 'cliente', 'contactname', 'displayname'], obbligatorio: true },
      { k: 'descrizione', l: 'Descrizione voce', alias: ['itemdesc', 'itemdescription', 'itemname', 'descrizione', 'description'] },
      { k: 'quantita', l: 'Quantità', alias: ['quantity', 'quantita', 'qty'] },
      { k: 'prezzo', l: 'Prezzo unitario', alias: ['itemprice', 'rate', 'prezzo', 'prezzounitario', 'unitprice'] },
      { k: 'importoRiga', l: 'Importo della voce', alias: ['itemtotal', 'amount', 'importo', 'totalevoce'] },
      { k: 'totale', l: 'Totale documento', alias: ['total', 'invoicetotal', 'totale', 'grandtotal'] },
      { k: 'saldo', l: 'Saldo da incassare', alias: ['balance', 'saldo', 'balancedue'] },
      { k: 'stato', l: 'Stato', alias: ['invoicestatus', 'status', 'stato'] },
      { k: 'note', l: 'Note', alias: ['notes', 'note', 'termsconditions'] }
    ]
  },

  incassi: {
    nome: 'Incassi (Customer Payments)',
    descrizione: 'I pagamenti ricevuti: vengono collegati alle fatture tramite il numero del documento.',
    campi: [
      { k: 'data', l: 'Data', alias: ['date', 'paymentdate', 'data', 'datapagamento'], obbligatorio: true },
      { k: 'importo', l: 'Importo', alias: ['invoicepaymentappliedamount', 'amountapplied', 'amount', 'importo'], obbligatorio: true },
      { k: 'numeroFattura', l: 'Numero fattura', alias: ['invoicenumber', 'numerofattura', 'invoice'], obbligatorio: true },
      { k: 'cliente', l: 'Intestatario', alias: ['customername', 'cliente', 'contactname'] },
      { k: 'metodo', l: 'Modalità', alias: ['mode', 'paymentmode', 'modalita', 'metodo'] },
      { k: 'note', l: 'Note', alias: ['description', 'note', 'notes', 'reference'] }
    ]
  }
};

/* ------------------------------------------------------------------ */
/* Riconoscimento automatico                                           */
/* ------------------------------------------------------------------ */

/** Quale tracciato somiglia di più alle intestazioni trovate nel file? */
export function riconosciTracciato(intestazioni) {
  const presenti = intestazioni.map(chiave);
  let migliore = null, punteggioMigliore = 0;
  for (const [tipo, def] of Object.entries(TRACCIATI)) {
    let punteggio = 0;
    for (const campo of def.campi) {
      if (campo.alias.some(a => presenti.includes(a))) punteggio += campo.obbligatorio ? 3 : 1;
    }
    if (punteggio > punteggioMigliore) { punteggioMigliore = punteggio; migliore = tipo; }
  }
  // Discriminante: solo le fatture hanno insieme numero documento e voci di dettaglio.
  return punteggioMigliore >= 3 ? migliore : null;
}

/** Mappatura proposta: per ogni campo, la prima colonna che corrisponde a un alias. */
export function mappaturaProposta(tipo, intestazioni) {
  const def = TRACCIATI[tipo];
  const mappa = {};
  if (!def) return mappa;
  const indice = new Map(intestazioni.map(h => [chiave(h), h]));
  for (const campo of def.campi) {
    for (const alias of campo.alias) {
      if (indice.has(alias)) { mappa[campo.k] = indice.get(alias); break; }
    }
  }
  return mappa;
}

/* ------------------------------------------------------------------ */
/* Trasformazione                                                      */
/* ------------------------------------------------------------------ */
const val = (riga, mappa, k) => (mappa[k] ? String(riga[mappa[k]] ?? '').trim() : '');

/** Divide un nome unico in cognome e nome, assumendo "Nome Cognome". */
export function dividiNome(completo) {
  const parti = String(completo || '').trim().split(/\s+/).filter(Boolean);
  if (!parti.length) return { nome: '', cognome: '' };
  if (parti.length === 1) return { nome: '', cognome: parti[0] };
  return { nome: parti.slice(0, -1).join(' '), cognome: parti.at(-1) };
}

export function trasformaContatti(dati, mappa) {
  const formato = indovinaFormatoData(dati.map(r => val(r, mappa, 'dataNascita')));
  return dati.map(riga => {
    let cognome = val(riga, mappa, 'cognome');
    let nome = val(riga, mappa, 'nome');
    const display = val(riga, mappa, 'displayName');
    if (!cognome && !nome && display) ({ nome, cognome } = dividiNome(display));
    return {
      nome, cognome,
      displayOriginale: display || [nome, cognome].filter(Boolean).join(' '),
      email: val(riga, mappa, 'email'),
      telefono: val(riga, mappa, 'telefono'),
      codiceFiscale: val(riga, mappa, 'codiceFiscale').toUpperCase(),
      partitaIva: val(riga, mappa, 'partitaIva'),
      indirizzo: val(riga, mappa, 'indirizzo'),
      cap: val(riga, mappa, 'cap'),
      citta: val(riga, mappa, 'citta'),
      provincia: val(riga, mappa, 'provincia'),
      note: val(riga, mappa, 'note'),
      _formatoData: formato
    };
  }).filter(c => c.cognome || c.nome);
}

/**
 * Ricompone le fatture: piu' righe con lo stesso numero sono le voci di un solo
 * documento. Il totale dichiarato viene confrontato con la somma delle voci.
 */
export function trasformaFatture(dati, mappa) {
  const formato = indovinaFormatoData(dati.map(r => val(r, mappa, 'data')));
  const perNumero = new Map();

  for (const riga of dati) {
    const numero = val(riga, mappa, 'numero');
    if (!numero) continue;
    if (!perNumero.has(numero)) {
      perNumero.set(numero, {
        numeroOriginale: numero,
        data: dataDaTesto(val(riga, mappa, 'data'), formato),
        scadenza: dataDaTesto(val(riga, mappa, 'scadenza'), formato),
        cliente: val(riga, mappa, 'cliente'),
        stato: val(riga, mappa, 'stato'),
        note: val(riga, mappa, 'note'),
        totaleDichiarato: numeroDaTesto(val(riga, mappa, 'totale')),
        saldoDichiarato: numeroDaTesto(val(riga, mappa, 'saldo')),
        righe: []
      });
    }
    const f = perNumero.get(numero);
    const descrizione = val(riga, mappa, 'descrizione');
    const quantita = numeroDaTesto(val(riga, mappa, 'quantita')) || 1;
    let prezzo = numeroDaTesto(val(riga, mappa, 'prezzo'));
    const importoRiga = numeroDaTesto(val(riga, mappa, 'importoRiga'));
    // Se manca il prezzo unitario lo si ricava dall'importo della voce.
    if (!prezzo && importoRiga) prezzo = round2(importoRiga / (quantita || 1));
    if (descrizione || prezzo) {
      f.righe.push({ descrizione: descrizione || 'Prestazione', data: '', quantita, prezzo });
    }
  }

  return [...perNumero.values()].map(f => {
    const sommaRighe = round2(f.righe.reduce((s, r) => s + r.quantita * r.prezzo, 0));
    return {
      ...f,
      sommaRighe,
      // Uno scarto oltre il centesimo va mostrato: di solito significa sconti,
      // imposte o arrotondamenti che il file non riporta voce per voce.
      scarto: f.totaleDichiarato ? round2(f.totaleDichiarato - sommaRighe) : 0,
      _formatoData: formato
    };
  }).filter(f => f.righe.length);
}

export function trasformaIncassi(dati, mappa) {
  const formato = indovinaFormatoData(dati.map(r => val(r, mappa, 'data')));
  return dati.map(riga => ({
    data: dataDaTesto(val(riga, mappa, 'data'), formato),
    importo: numeroDaTesto(val(riga, mappa, 'importo')),
    numeroFattura: val(riga, mappa, 'numeroFattura'),
    cliente: val(riga, mappa, 'cliente'),
    metodo: val(riga, mappa, 'metodo'),
    note: val(riga, mappa, 'note'),
    _formatoData: formato
  })).filter(i => i.importo > 0 && i.numeroFattura);
}

export const TRASFORMA = {
  contatti: trasformaContatti,
  fatture: trasformaFatture,
  incassi: trasformaIncassi
};

/** Metodo di pagamento Zoho tradotto nelle voci del gestionale. */
export function traduciMetodo(m) {
  const s = normalize(m);
  if (/cash|contant/.test(s)) return 'Contanti';
  if (/bank.*transfer|bonifico|wire/.test(s)) return 'Bonifico bancario';
  if (/card|carta|bancomat|pos|credit/.test(s)) return 'Bancomat / carta';
  if (/check|cheque|assegno/.test(s)) return 'Assegno';
  if (/paypal/.test(s)) return 'PayPal';
  if (/satispay/.test(s)) return 'Satispay';
  return m ? 'Altro' : 'Contanti';
}
