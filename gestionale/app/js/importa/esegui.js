/* ============================================================
   Scrittura in archivio dei dati importati
   ------------------------------------------------------------
   L'importazione e' ripetibile: i pazienti gia' presenti vengono
   riconosciuti e non duplicati, le fatture gia' importate vengono
   saltate. Cosi' un secondo tentativo, dopo aver corretto la
   mappatura, non moltiplica i dati.
   ============================================================ */
import { normalize, fullName, uid, round2, yearOf, todayISO, validaCF } from '../util.js';
import { traduciMetodo, senzaTitolo } from './zoho.js';
import * as db from '../db.js';

// Il confronto ignora titoli, punteggiatura e spazi ripetuti: gli export
// scrivono "Sig.ra Maria Rossi" dove l'anagrafica ha "Rossi Maria".
const chiaveNome = (cognome, nome) => normalize(senzaTitolo([cognome, nome].filter(Boolean).join(' ')))
  .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const chiaveCF = (cf) => normalize(cf).replace(/[^a-z0-9]/g, '');

/** Indice dei pazienti esistenti, per codice fiscale e per nome. */
async function indicePazienti() {
  const esistenti = await db.all('pazienti');
  const perCF = new Map(), perNome = new Map();
  for (const p of esistenti) {
    if (p.codiceFiscale) perCF.set(chiaveCF(p.codiceFiscale), p);
    perNome.set(chiaveNome(p.cognome, p.nome), p);
    // Anche la forma invertita: gli export non concordano sull'ordine.
    perNome.set(chiaveNome(p.nome, p.cognome), p);
  }
  return { perCF, perNome };
}

const trovaPaziente = (idx, { codiceFiscale, cognome, nome, displayOriginale }) => {
  if (codiceFiscale) {
    const p = idx.perCF.get(chiaveCF(codiceFiscale));
    if (p) return p;
  }
  return idx.perNome.get(chiaveNome(cognome, nome))
    || (displayOriginale ? idx.perNome.get(chiaveNome(displayOriginale, '')) : null)
    || null;
};

function registra(idx, paziente) {
  if (paziente.codiceFiscale) idx.perCF.set(chiaveCF(paziente.codiceFiscale), paziente);
  idx.perNome.set(chiaveNome(paziente.cognome, paziente.nome), paziente);
  idx.perNome.set(chiaveNome(paziente.nome, paziente.cognome), paziente);
}

/* ------------------------------------------------------------------ */
/* Anagrafiche                                                         */
/* ------------------------------------------------------------------ */
export async function importaContatti(contatti, { aggiornaEsistenti = false } = {}) {
  const idx = await indicePazienti();
  const esito = { creati: 0, aggiornati: 0, saltati: 0, avvisi: [] };

  for (const c of contatti) {
    const cf = validaCF(c.codiceFiscale);
    if (!cf.ok) {
      // Il valore si conserva comunque: scartarlo perderebbe un dato che
      // l'utente puo' correggere, e la segnalazione gli dice dove intervenire.
      esito.avvisi.push(`${c.displayOriginale || c.cognome}: codice fiscale «${c.codiceFiscale}» non supera il controllo, importato ugualmente — va verificato.`);
    }
    const dati = {
      cognome: c.cognome, nome: c.nome,
      codiceFiscale: cf.ok && !cf.empty ? cf.value : (c.codiceFiscale || ''),
      partitaIva: c.partitaIva, email: c.email, telefono: c.telefono,
      indirizzo: c.indirizzo, cap: c.cap, citta: c.citta, provincia: c.provincia,
      note: c.note, origine: 'import'
    };

    const esistente = trovaPaziente(idx, c);
    if (esistente) {
      if (!aggiornaEsistenti) { esito.saltati++; continue; }
      // Si completano solo i campi vuoti: quanto inserito a mano ha la precedenza.
      const unito = { ...esistente };
      for (const [k, v] of Object.entries(dati)) if (v && !unito[k]) unito[k] = v;
      const salvato = await db.put('pazienti', unito);
      registra(idx, salvato);
      esito.aggiornati++;
    } else {
      const salvato = await db.put('pazienti', { ...dati, consensi: {} });
      registra(idx, salvato);
      esito.creati++;
    }
  }
  return esito;
}

/* ------------------------------------------------------------------ */
/* Fatture                                                             */
/* ------------------------------------------------------------------ */
/** Ultime cifre del numero di origine, per proseguire la stessa serie. */
export const numeroProgressivo = (testo) => {
  const m = String(testo || '').match(/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
};

const STATI_ANNULLATI = /void|annullat|cancell/i;

export async function importaFatture(fatture, imp, {
  numerazione = 'storico',      // 'storico' conserva il numero di origine, 'continua' alimenta il progressivo
  creaPazienti = true
} = {}) {
  const idx = await indicePazienti();
  const gia = new Set((await db.all('fatture')).map(f => f.numeroTesto || '').filter(Boolean));
  const esito = { create: 0, saltate: 0, pazientiCreati: 0, avvisi: [] };

  for (const f of fatture) {
    if (gia.has(f.numeroOriginale)) { esito.saltate++; continue; }
    if (!f.data) {
      esito.avvisi.push(`Fattura ${f.numeroOriginale}: data non riconosciuta, saltata.`);
      esito.saltate++;
      continue;
    }

    const { nome, cognome } = dividi(f.cliente);
    let paziente = trovaPaziente(idx, { cognome, nome, displayOriginale: f.cliente });
    if (!paziente) {
      if (!creaPazienti) {
        esito.avvisi.push(`Fattura ${f.numeroOriginale}: intestatario «${f.cliente}» non trovato fra i pazienti, saltata.`);
        esito.saltate++;
        continue;
      }
      paziente = await db.put('pazienti', { cognome, nome, consensi: {}, origine: 'import' });
      registra(idx, paziente);
      esito.pazientiCreati++;
    }

    const anno = yearOf(f.data);
    const progressivo = numerazione === 'continua' ? numeroProgressivo(f.numeroOriginale) : null;

    // Un documento storico deve conservare il totale con cui e' stato emesso.
    // Si ricostruisce quindi come si arriva al totale dichiarato: un ammanco
    // rispetto alle voci e' uno sconto, e il bollo viene forzato a presente o
    // assente a seconda di quale delle due letture quadra.
    const importoBollo = Number(imp.bolloImporto ?? 2);
    const soglia = Number(imp.bolloSoglia ?? 77.47);
    const sconto = f.scarto < -0.009 ? round2(-f.scarto) : 0;
    const imponibile = round2(f.sommaRighe - sconto);
    const bolloDaSoglia = imponibile > soglia;
    const totaleConBollo = round2(imponibile + (bolloDaSoglia ? importoBollo : 0));

    let bolloForzato = null;
    let scartoInspiegato = 0;
    if (f.totaleDichiarato > 0) {
      if (Math.abs(f.totaleDichiarato - totaleConBollo) < 0.01) bolloForzato = null;
      else if (Math.abs(f.totaleDichiarato - imponibile) < 0.01) bolloForzato = false;
      else if (Math.abs(f.totaleDichiarato - round2(imponibile + importoBollo)) < 0.01) bolloForzato = true;
      else scartoInspiegato = round2(f.totaleDichiarato - totaleConBollo);
    }

    await db.put('fatture', {
      pazienteId: paziente.id,
      data: f.data,
      anno,
      numero: progressivo,
      numeroTesto: f.numeroOriginale,
      tipoDocumento: imp.tipoDocumento || 'Fattura',
      righe: f.righe,
      // Lo scarto fra totale dichiarato e somma delle voci diventa uno sconto,
      // cosi' il totale del documento importato resta quello di origine.
      scontoImporto: sconto,
      bolloForzato,
      esenzioneIva: imp.esenzioneIva,
      regimeFiscale: imp.regimeFiscale,
      bolloAddebitato: imp.bolloAddebitato,
      rivalsaAttiva: false,
      ritenutaAttiva: false,
      metodoPagamento: '',
      scadenza: f.scadenza || '',
      note: f.note || '',
      annullata: STATI_ANNULLATI.test(f.stato || ''),
      origine: 'import',
      statoOrigine: f.stato || ''
    });
    gia.add(f.numeroOriginale);
    esito.create++;

    if (scartoInspiegato) {
      esito.avvisi.push(
        `Fattura ${f.numeroOriginale}: il totale dichiarato (${f.totaleDichiarato}) non coincide con quello ricalcolato (${totaleConBollo}), scarto ${scartoInspiegato}. Il documento è stato importato: verifica le voci.`);
    }
  }
  return esito;
}

const dividi = (completo) => {
  const parti = senzaTitolo(completo).split(/\s+/).filter(Boolean);
  if (!parti.length) return { nome: '', cognome: 'Sconosciuto' };
  if (parti.length === 1) return { nome: '', cognome: parti[0] };
  return { nome: parti.slice(0, -1).join(' '), cognome: parti.at(-1) };
};

/* ------------------------------------------------------------------ */
/* Incassi                                                             */
/* ------------------------------------------------------------------ */
export async function importaIncassi(incassi) {
  const fatture = await db.all('fatture');
  const perNumero = new Map();
  for (const f of fatture) {
    if (f.numeroTesto) perNumero.set(normalize(f.numeroTesto), f);
    if (f.numero) perNumero.set(normalize(`${f.numero}/${f.anno}`), f);
  }
  const esistenti = await db.all('incassi');
  // Un incasso e' gia' presente se coincidono documento, data e importo.
  const gia = new Set(esistenti.map(i => `${i.fatturaId}|${i.data}|${round2(i.importo)}`));
  const esito = { creati: 0, saltati: 0, senzaFattura: 0, avvisi: [] };

  for (const i of incassi) {
    const f = perNumero.get(normalize(i.numeroFattura));
    if (!f) {
      esito.senzaFattura++;
      esito.avvisi.push(`Incasso del ${i.data || '?'} di ${i.importo}: nessuna fattura con numero «${i.numeroFattura}».`);
      continue;
    }
    const impronta = `${f.id}|${i.data}|${round2(i.importo)}`;
    if (gia.has(impronta)) { esito.saltati++; continue; }
    await db.put('incassi', {
      fatturaId: f.id,
      pazienteId: f.pazienteId,
      data: i.data || todayISO(),
      importo: round2(i.importo),
      metodo: traduciMetodo(i.metodo),
      note: i.note || '',
      origine: 'import'
    });
    gia.add(impronta);
    esito.creati++;
  }
  return esito;
}

export const ESEGUI = {
  contatti: importaContatti,
  fatture: importaFatture,
  incassi: importaIncassi
};
