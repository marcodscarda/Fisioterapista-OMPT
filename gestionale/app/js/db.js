/* ============================================================
   Persistenza locale su IndexedDB.
   Nessun dato esce dal computer: nessuna chiamata di rete.
   ============================================================ */
import { uid, todayISO } from './util.js';

const DB_NAME = 'gestionale-ompt';
const DB_VERSION = 1;

/** store -> indici da creare */
const STORES = {
  settings: [],                                   // singolo record id:'studio'
  pazienti: ['cognome', 'creatoIl'],
  episodi: ['pazienteId', 'dataApertura'],
  sedute: ['pazienteId', 'episodioId', 'data'],
  fatture: ['pazienteId', 'anno', 'data', 'numeroCompleto'],
  incassi: ['fatturaId', 'data'],
  contatori: []                                   // id: 'fatture-2026' -> { ultimo }
};

let _db = null;

export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      for (const [name, indexes] of Object.entries(STORES)) {
        const store = db.objectStoreNames.contains(name)
          ? ev.target.transaction.objectStore(name)
          : db.createObjectStore(name, { keyPath: 'id' });
        for (const idx of indexes) {
          if (!store.indexNames.contains(idx)) store.createIndex(idx, idx, { unique: false });
        }
      }
    };
    req.onsuccess = () => {
      _db = req.result;
      _db.onversionchange = () => { _db.close(); _db = null; };
      resolve(_db);
    };
    req.onerror = () => reject(req.error || new Error('Impossibile aprire il database locale.'));
    req.onblocked = () => reject(new Error('Database bloccato da un altro tab: chiudi le altre schede del gestionale.'));
  });
}

function tx(storeNames, mode = 'readonly') {
  return openDB().then(db => db.transaction(storeNames, mode));
}

const wrap = (req) => new Promise((res, rej) => {
  req.onsuccess = () => res(req.result);
  req.onerror = () => rej(req.error);
});

/* ---------- CRUD generico ---------- */
export async function all(store) {
  const t = await tx(store);
  return wrap(t.objectStore(store).getAll());
}

export async function byId(store, id) {
  if (!id) return null;
  const t = await tx(store);
  return (await wrap(t.objectStore(store).get(id))) || null;
}

export async function byIndex(store, index, value) {
  const t = await tx(store);
  return wrap(t.objectStore(store).index(index).getAll(value));
}

export async function put(store, record) {
  const now = new Date().toISOString();
  const rec = { ...record };
  if (!rec.id) rec.id = uid();
  if (!rec.creatoIl) rec.creatoIl = now;
  rec.modificatoIl = now;
  const t = await tx(store, 'readwrite');
  await wrap(t.objectStore(store).put(rec));
  await done(t);
  return rec;
}

export async function putMany(store, records) {
  if (!records.length) return [];
  const t = await tx(store, 'readwrite');
  const os = t.objectStore(store);
  const out = [];
  for (const r of records) {
    const rec = { ...r, id: r.id || uid(), creatoIl: r.creatoIl || new Date().toISOString(), modificatoIl: new Date().toISOString() };
    os.put(rec);
    out.push(rec);
  }
  await done(t);
  return out;
}

export async function del(store, id) {
  const t = await tx(store, 'readwrite');
  await wrap(t.objectStore(store).delete(id));
  return done(t);
}

export async function clearStore(store) {
  const t = await tx(store, 'readwrite');
  await wrap(t.objectStore(store).clear());
  return done(t);
}

const done = (t) => new Promise((res, rej) => {
  t.oncomplete = () => res();
  t.onerror = () => rej(t.error);
  t.onabort = () => rej(t.error || new Error('Transazione annullata.'));
});

/* ---------- Numerazione progressiva fatture ---------- */
/**
 * Riserva il numero successivo per l'anno indicato, in modo atomico.
 * La numerazione delle fatture deve essere progressiva e senza salti.
 */
export async function prossimoNumeroFattura(anno) {
  const key = `fatture-${anno}`;
  const t = await tx(['contatori', 'fatture'], 'readwrite');
  const cont = await wrap(t.objectStore('contatori').get(key));
  // Allinea il contatore al massimo effettivamente presente (robusto dopo un ripristino da backup).
  const emesse = await wrap(t.objectStore('fatture').index('anno').getAll(Number(anno)));
  const maxEmesso = emesse.reduce((m, f) => Math.max(m, Number(f.numero) || 0), 0);
  const prossimo = Math.max(Number(cont?.ultimo) || 0, maxEmesso) + 1;
  t.objectStore('contatori').put({ id: key, anno: Number(anno), ultimo: prossimo });
  await done(t);
  return prossimo;
}

/** Sola lettura: quale numero verrebbe assegnato, senza consumarlo. */
export async function anteprimaNumeroFattura(anno) {
  const cont = await byId('contatori', `fatture-${anno}`);
  const emesse = await byIndex('fatture', 'anno', Number(anno));
  const maxEmesso = emesse.reduce((m, f) => Math.max(m, Number(f.numero) || 0), 0);
  return Math.max(Number(cont?.ultimo) || 0, maxEmesso) + 1;
}

/* ---------- Impostazioni studio ---------- */
export const IMPOSTAZIONI_DEFAULT = {
  id: 'studio',
  // Intestazione
  titolo: 'Dott.',
  nome: '',
  cognome: '',
  qualifica: 'Fisioterapista specializzato in Terapia Manuale (OMPT)',
  indirizzo: '',
  cap: '',
  citta: '',
  provincia: '',
  telefono: '',
  email: '',
  pec: '',
  sitoWeb: '',
  logo: '',                        // data URL, ridimensionato al caricamento
  logoAltezzaMm: 18,               // altezza di stampa del logo
  logoInDocumentiClinici: true,
  // Dati fiscali
  partitaIva: '',
  codiceFiscale: '',
  albo: 'Iscritto all\'Albo dei Fisioterapisti',
  numeroAlbo: '',
  ordineProvincia: '',
  regimeFiscale: 'forfettario',   // forfettario | ordinario
  // Opzioni fattura
  tipoDocumento: 'Fattura',        // Fattura | Ricevuta sanitaria
  esenzioneIva: 'art10',          // art10 | none
  bolloSoglia: 77.47,
  bolloImporto: 2.00,
  bolloAddebitato: true,
  rivalsaInpsAttiva: false,
  rivalsaInpsPercento: 4,
  ritenutaAttiva: false,
  ritenutaPercento: 20,
  ritenutaBaseImponibilePercento: 100,
  metodoPagamentoDefault: 'Contanti',
  iban: '',
  banca: '',
  scadenzaGiorni: 0,
  noteFatturaLibere: '',
  copiePerFattura: 2,
  // Listino prestazioni
  listino: [
    { id: 'p1', nome: 'Valutazione fisioterapica OMPT (prima visita)', prezzo: 70, durata: 60 },
    { id: 'p2', nome: 'Seduta di terapia manuale ed esercizio terapeutico', prezzo: 50, durata: 45 },
    { id: 'p3', nome: 'Rivalutazione e aggiornamento del programma', prezzo: 50, durata: 45 },
    { id: 'p4', nome: 'Seduta domiciliare', prezzo: 70, durata: 60 }
  ],
  // Privacy
  titolareTrattamento: '',
  dpoContatto: '',
  conservazioneAnni: 10
};

export async function getImpostazioni() {
  const s = await byId('settings', 'studio');
  return { ...IMPOSTAZIONI_DEFAULT, ...(s || {}) };
}

export const salvaImpostazioni = (s) => put('settings', { ...s, id: 'studio' });

/* ---------- Backup ---------- */
export async function esportaTutto() {
  const data = {};
  for (const store of Object.keys(STORES)) data[store] = await all(store);
  return {
    formato: 'gestionale-ompt-backup',
    versione: DB_VERSION,
    esportatoIl: new Date().toISOString(),
    data
  };
}

/**
 * Ripristina un backup.
 * modo 'sostituisci' azzera gli archivi; 'unisci' sovrascrive solo i record con lo stesso id.
 */
export async function importaTutto(backup, modo = 'sostituisci') {
  if (!backup || backup.formato !== 'gestionale-ompt-backup' || !backup.data) {
    throw new Error('File di backup non riconosciuto.');
  }
  const conteggi = {};
  for (const store of Object.keys(STORES)) {
    const records = backup.data[store];
    if (!Array.isArray(records)) continue;
    if (modo === 'sostituisci') await clearStore(store);
    await putMany(store, records);
    conteggi[store] = records.length;
  }
  return conteggi;
}

export async function statistiche() {
  const out = {};
  for (const store of Object.keys(STORES)) out[store] = (await all(store)).length;
  return out;
}

/** Nome file suggerito per il backup del giorno. */
export const nomeFileBackup = () => `backup-gestionale-ompt-${todayISO()}.json`;

export const STORE_NAMES = Object.keys(STORES);
