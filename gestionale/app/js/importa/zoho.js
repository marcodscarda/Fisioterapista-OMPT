/* ============================================================
   Importazione da Zoho Invoice (e da CSV simili)
   ------------------------------------------------------------
   Le intestazioni degli export cambiano con la lingua e la versione
   del programma di origine: invece di pretendere un tracciato fisso,
   ogni campo dichiara i nomi di colonna che lo possono rappresentare
   e la mappatura proposta resta modificabile dall'utente.
   ============================================================ */
import { numeroDaTesto, dataDaTesto, indovinaFormatoData, indovinaFormatoNumero } from './csv.js';
import { normalize, round2, validaCF } from '../util.js';

/** Titoli che precedono il nome negli export ("Sig.ra Maria Rossi"). */
const TITOLI = /^\s*(sig\.?\s*ra|sig\.?\s*na|sig\.?|dott\.?\s*ssa|dott\.?|dr\.?\s*ssa|dr\.?|prof\.?\s*ssa|prof\.?|ing\.?|avv\.?|egr\.?|gent\.?\s*ma)\s+/i;

/** Toglie il titolo onorifico, se presente, anche ripetuto. */
export function senzaTitolo(nome) {
  let s = String(nome || '').trim();
  let precedente;
  do { precedente = s; s = s.replace(TITOLI, '').trim(); } while (s !== precedente);
  return s;
}

/** Codice fiscale di persona fisica: schema e carattere di controllo. */
const CF_SCHEMA = /\b[A-Za-z]{6}\d{2}[A-Za-z]\d{2}[A-Za-z]\d{3}[A-Za-z]\b/g;

/**
 * Cerca un codice fiscale in tutti i campi della riga.
 * Negli export reali finisce dove capita: in un campo dedicato, nel campo
 * dell'indirizzo, o dentro un blocco di testo con dentro anche via e CAP.
 * Ha la precedenza un codice con il carattere di controllo corretto; se non
 * ce n'e' nessuno viene restituito comunque il primo che ha la forma giusta,
 * perche' un refuso nell'archivio di origine e' un dato da correggere, non da
 * buttare: chi importa se lo ritrova segnalato fra gli avvisi.
 */
export function cercaCodiceFiscale(riga) {
  let ripiego = '';
  for (const valore of Object.values(riga || {})) {
    for (const candidato of String(valore ?? '').toUpperCase().match(CF_SCHEMA) || []) {
      if (validaCF(candidato).ok) return candidato;
      if (!ripiego) ripiego = candidato;
    }
  }
  return ripiego;
}

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
      { k: 'telefono2', l: 'Telefono (secondo campo)', alias: ['phone', 'billingphone', 'telefono2'] },
      { k: 'codiceFiscale', l: 'Codice fiscale', alias: ['codicefiscale', 'cf', 'taxid', 'cfpiva', 'fiscalcode'] },
      { k: 'partitaIva', l: 'Partita IVA', alias: ['partitaiva', 'piva', 'vatnumber', 'vatid'] },
      { k: 'indirizzo', l: 'Indirizzo', alias: ['billingstreet2', 'billingaddress', 'billingstreet', 'indirizzo', 'address'] },
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
      { k: 'numero', l: 'Numero fattura', alias: ['invoicenumber', 'numerofattura', 'numero', 'numerodocumento', 'invoiceid'], obbligatorio: true },
      { k: 'data', l: 'Data', alias: ['invoicedate', 'datafattura', 'data', 'date', 'datadifornitura', 'issueddate'], obbligatorio: true },
      { k: 'scadenza', l: 'Scadenza', alias: ['duedate', 'scadenza', 'datascadenza'] },
      { k: 'cliente', l: 'Intestatario', alias: ['customername', 'clientname', 'cliente', 'contactname', 'displayname'], obbligatorio: true },
      { k: 'descrizione', l: 'Descrizione voce', alias: ['itemdesc', 'itemdescription', 'itemname', 'descrizione', 'description'] },
      { k: 'quantita', l: 'Quantità', alias: ['quantity', 'quantita', 'qty'] },
      { k: 'sconto', l: 'Sconto sulla voce', alias: ['discountamount', 'scontoimporto'] },
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
      { k: 'data', l: 'Data', alias: ['date', 'paymentdate', 'data', 'datapagamento', 'datapagamentocliente'], obbligatorio: true },
      { k: 'importo', l: 'Importo', alias: ['importoapplicatoallafattura', 'invoicepaymentappliedamount', 'amountapplied', 'importoapplicato', 'amount', 'importo'], obbligatorio: true },
      { k: 'numeroFattura', l: 'Numero fattura', alias: ['invoicenumber', 'numerofattura', 'invoice'], obbligatorio: true },
      { k: 'cliente', l: 'Intestatario', alias: ['customername', 'cliente', 'contactname'] },
      { k: 'metodo', l: 'Modalità', alias: ['mode', 'paymentmode', 'modalita', 'metodo', 'modalitadipagamento'] },
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
  const parti = senzaTitolo(completo).split(/\s+/).filter(Boolean);
  if (!parti.length) return { nome: '', cognome: '' };
  if (parti.length === 1) return { nome: '', cognome: parti[0] };
  return { nome: parti.slice(0, -1).join(' '), cognome: parti.at(-1) };
}

/** Un numero di telefono scritto da Excel puo' iniziare con un apice. */
const pulisciTelefono = (t) => String(t || '').replace(/^'+/, '').trim();

/** Il CAP italiano: cinque cifre isolate. */
const CAP = /\b\d{5}\b/;

/** Lo stato, quando l'export lo scrive per esteso dentro l'indirizzo. */
const PAESE = /\b(italia|italy)\b/gi;

/** Parole con cui comincia un indirizzo: servono a non scambiarlo per un comune. */
const VIA = /^(via|viale|v\.le|vicolo|piazza|p\.zza|piazzale|corso|c\.so|largo|strada|contrada|c\/da|salita|discesa|lungomare|localita|località|loc\.|fraz\.?|frazione|res\.|residence|scala|palazzo|interno|int\.|n\.|snc)\b/i;

/**
 * Riga di sola localita': "90072 Altofonte (PA)", "90143 Palermo, Pa",
 * "Corleone (Pa)", "90146 Palermo". Perche' una riga sia letta come localita'
 * e non come parte della via deve portare un CAP o una sigla di provincia:
 * senza uno dei due "Via samotracia snc" sarebbe indistinguibile da un comune.
 */
const LOCALITA = /^(?:(\d{5})\s+)?([A-Za-zÀ-ÿ'’.\- ]{3,40}?)(?:\s*[,(]\s*([A-Za-zÀ-ÿ]{2})\)?)?(?:\s+(\d{5}))?$/;

/** Riga con il solo CAP e la sigla della provincia: "90142 PA". */
const CAP_PROV = /^(\d{5})\s+([A-Za-zÀ-ÿ]{2})$/;

/**
 * Divide le righe avanzate di un blocco indirizzo in via, comune, provincia e
 * CAP. Negli export reali l'indirizzo e' spesso un unico campo a piu' righe.
 */
export function separaLocalita(righe) {
  const via = [];
  let citta = '', provincia = '', cap = '';
  for (const riga of righe) {
    const r = riga.replace(PAESE, '').replace(/\s*,\s*$/, '').trim();
    if (!r) continue;
    if (/^\d{5}$/.test(r)) { cap = cap || r; continue; }
    const solo = CAP_PROV.exec(r);
    if (solo) { cap = cap || solo[1]; provincia = provincia || solo[2].toUpperCase(); continue; }
    const m = VIA.test(r) ? null : LOCALITA.exec(r);
    if (m && (m[1] || m[3] || m[4])) {
      cap = cap || m[1] || m[4] || '';
      citta = citta || m[2].trim();
      if (m[3]) provincia = provincia || m[3].toUpperCase();
      continue;
    }
    via.push(r);
  }
  // Se il comune e' rimasto su una riga tutta sua ("Palermo Italia"), lo si
  // riconosce solo quando il blocco ha gia' dato un CAP o una provincia.
  if (!citta && (cap || provincia)) {
    const i = via.findIndex(r => !/\d/.test(r) && !VIA.test(r) && r.split(/\s+/).length <= 3);
    if (i >= 0) citta = via.splice(i, 1)[0];
  }
  return { via: via.join(' ').replace(/\s+/g, ' ').trim(), citta, provincia, cap };
}

export function trasformaContatti(dati, mappa) {
  return dati.map(riga => {
    let cognome = senzaTitolo(val(riga, mappa, 'cognome'));
    let nome = senzaTitolo(val(riga, mappa, 'nome'));
    const display = senzaTitolo(val(riga, mappa, 'displayName'));
    if (!cognome && !nome && display) ({ nome, cognome } = dividiNome(display));

    // Il codice fiscale si cerca prima nel campo mappato, poi ovunque nella riga.
    const cfMappato = val(riga, mappa, 'codiceFiscale').toUpperCase();
    const codiceFiscale = validaCF(cfMappato).ok && cfMappato ? cfMappato : (cercaCodiceFiscale(riga) || cfMappato);
    const cfDaVerificare = !!codiceFiscale && !validaCF(codiceFiscale).ok;

    // Indirizzo, CAP e citta' possono essere finiti tutti insieme in un unico
    // campo a piu' righe: si recupera quel che manca da li', scartando il
    // codice fiscale e il nome, che non fanno parte dell'indirizzo.
    let indirizzo = val(riga, mappa, 'indirizzo');
    let cap = val(riga, mappa, 'cap');
    let citta = val(riga, mappa, 'citta');
    let provincia = val(riga, mappa, 'provincia');
    const blocchi = [val(riga, mappa, 'indirizzo'), val(riga, mappa, 'codiceFiscale'), val(riga, mappa, 'note')]
      .concat(Object.values(riga).filter(v => typeof v === 'string' && v.includes('\n')));
    const avanzo = [...new Set(blocchi.join('\n').split('\n'))]
      .map(r => senzaTitolo(r.trim()))
      .filter(Boolean)
      .filter(r => r.toUpperCase() !== codiceFiscale)
      .filter(r => normalize(r) !== normalize(display));
    const sciolto = separaLocalita(avanzo);

    if (!indirizzo || /^\d{5}$/.test(indirizzo) || indirizzo.toUpperCase() === codiceFiscale) {
      indirizzo = sciolto.via;
    }
    if (!citta) citta = sciolto.citta;
    if (!provincia) provincia = sciolto.provincia;
    if (!cap) {
      cap = sciolto.cap || (CAP.exec([val(riga, mappa, 'indirizzo'), ...avanzo].join(' ')) || [''])[0];
    }

    return {
      nome, cognome,
      displayOriginale: display || [nome, cognome].filter(Boolean).join(' '),
      email: val(riga, mappa, 'email'),
      telefono: pulisciTelefono(val(riga, mappa, 'telefono') || val(riga, mappa, 'telefono2')),
      codiceFiscale,
      cfDaVerificare,
      partitaIva: val(riga, mappa, 'partitaIva'),
      indirizzo,
      cap,
      citta,
      provincia,
      note: val(riga, mappa, 'note')
    };
  }).filter(c => c.cognome || c.nome);
}

/**
 * Ricompone le fatture: piu' righe con lo stesso numero sono le voci di un solo
 * documento. Il totale dichiarato viene confrontato con la somma delle voci.
 */
export function trasformaFatture(dati, mappa) {
  const formato = indovinaFormatoData(dati.map(r => val(r, mappa, 'data')));
  const fPrezzo = indovinaFormatoNumero(dati.map(r => val(r, mappa, 'prezzo')));
  const fImporto = indovinaFormatoNumero(dati.map(r => val(r, mappa, 'importoRiga')));
  const fTotale = indovinaFormatoNumero(dati.map(r => val(r, mappa, 'totale')));
  const fQuantita = indovinaFormatoNumero(dati.map(r => val(r, mappa, 'quantita')));
  const perNumero = new Map();

  for (const riga of dati) {
    const numero = val(riga, mappa, 'numero');
    if (!numero) continue;
    if (!perNumero.has(numero)) {
      perNumero.set(numero, {
        numeroOriginale: numero,
        data: dataDaTesto(val(riga, mappa, 'data'), formato),
        scadenza: dataDaTesto(val(riga, mappa, 'scadenza'), formato),
        cliente: senzaTitolo(val(riga, mappa, 'cliente')),
        stato: val(riga, mappa, 'stato'),
        note: val(riga, mappa, 'note'),
        totaleDichiarato: numeroDaTesto(val(riga, mappa, 'totale'), fTotale),
        saldoDichiarato: numeroDaTesto(val(riga, mappa, 'saldo'), fTotale),
        righe: []
      });
    }
    const f = perNumero.get(numero);
    const descrizione = val(riga, mappa, 'descrizione');
    const quantita = numeroDaTesto(val(riga, mappa, 'quantita'), fQuantita) || 1;
    let prezzo = numeroDaTesto(val(riga, mappa, 'prezzo'), fPrezzo);
    const importoRiga = numeroDaTesto(val(riga, mappa, 'importoRiga'), fImporto);
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
  const fImporto = indovinaFormatoNumero(dati.map(r => val(r, mappa, 'importo')));
  return dati.map(riga => ({
    data: dataDaTesto(val(riga, mappa, 'data'), formato),
    importo: numeroDaTesto(val(riga, mappa, 'importo'), fImporto),
    numeroFattura: val(riga, mappa, 'numeroFattura'),
    cliente: senzaTitolo(val(riga, mappa, 'cliente')),
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
