/* ============================================================
   Ponte verso i calendari esterni (Google, Apple, Outlook)
   ------------------------------------------------------------
   Due strade, entrambe senza account collegati e senza chiavi:
     - un file .ics, importabile in qualunque calendario;
     - un link che apre Google Calendar con l'evento precompilato.

   Che cosa esce dal gestionale lo decide l'utente: l'etichetta
   dell'evento puo' riportare il nome completo, le sole iniziali o
   una dicitura generica. Un appuntamento in un calendario in cloud
   rivela comunque una prestazione sanitaria, quindi la scelta
   predefinita e' la piu' riservata.
   ============================================================ */
import { fullName, initials, downloadFile, todayISO } from './util.js';

export const ETICHETTE = [
  { valore: 'iniziali', nome: 'Solo iniziali (es. «FT — M.R.»)' },
  { valore: 'generico', nome: 'Dicitura generica (es. «Appuntamento»)' },
  { valore: 'completo', nome: 'Nome e cognome per esteso' }
];

/** Testo dell'evento secondo il livello di riservatezza scelto. */
export function etichettaEvento(appuntamento, paziente, imp) {
  const modo = imp?.calendarioEtichetta || 'iniziali';
  const prestazione = appuntamento.prestazione || 'Seduta';
  if (modo === 'completo') return `${prestazione} — ${fullName(paziente) || 'paziente'}`;
  if (modo === 'generico') return imp?.calendarioTestoGenerico || 'Appuntamento';
  const sigle = initials(paziente);
  return `FT — ${sigle ? sigle.split('').join('.') + '.' : 'paziente'}`;
}

/** Descrizione dell'evento: fuori dal titolo, e solo se l'utente la vuole. */
function descrizioneEvento(appuntamento, paziente, imp) {
  if (imp?.calendarioEtichetta === 'generico') return '';
  const righe = [];
  if (appuntamento.prestazione) righe.push(appuntamento.prestazione);
  if (appuntamento.note) righe.push(appuntamento.note);
  return righe.join('\n');
}

/* ---------- Date e orari ---------- */
const soloCifre = (s) => String(s || '').replace(/\D/g, '');

/** "2026-09-20" + "09:00" -> "20260920T090000" (ora locale, senza fuso). */
export function stampaDataOra(dataISO, ora) {
  const d = soloCifre(dataISO).slice(0, 8);
  const t = (soloCifre(ora) + '0000').slice(0, 6);
  return `${d}T${t}`;
}

/** Somma i minuti di durata restituendo data e ora di fine. */
export function fine(dataISO, ora, durataMin) {
  const [h, m] = String(ora || '00:00').split(':').map(Number);
  const d = new Date(`${String(dataISO).slice(0, 10)}T00:00:00`);
  d.setHours(h || 0, (m || 0) + (Number(durataMin) || 45), 0, 0);
  const p = (n) => String(n).padStart(2, '0');
  return {
    data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    ora: `${p(d.getHours())}:${p(d.getMinutes())}`
  };
}

/* ---------- ICS ---------- */
const escICS = (s) => String(s || '')
  .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
  .replace(/\r?\n/g, '\\n');

/** Il formato ICS impone righe non piu' lunghe di 75 ottetti. */
function piega(riga) {
  const out = [];
  let resto = riga;
  while (resto.length > 74) {
    out.push(resto.slice(0, 74));
    resto = ' ' + resto.slice(74);
  }
  out.push(resto);
  return out.join('\r\n');
}

function evento(appuntamento, paziente, imp) {
  const f = fine(appuntamento.data, appuntamento.ora, appuntamento.durata);
  const righe = [
    'BEGIN:VEVENT',
    `UID:${appuntamento.id}@gestionale-ompt`,
    `DTSTAMP:${stampaDataOra(todayISO(), '00:00')}Z`,
    `DTSTART:${stampaDataOra(appuntamento.data, appuntamento.ora)}`,
    `DTEND:${stampaDataOra(f.data, f.ora)}`,
    `SUMMARY:${escICS(etichettaEvento(appuntamento, paziente, imp))}`
  ];
  const descrizione = descrizioneEvento(appuntamento, paziente, imp);
  if (descrizione) righe.push(`DESCRIPTION:${escICS(descrizione)}`);
  const luogo = appuntamento.luogo || [imp?.indirizzo, imp?.citta].filter(Boolean).join(', ');
  if (luogo) righe.push(`LOCATION:${escICS(luogo)}`);
  if (appuntamento.stato === 'disdetto') righe.push('STATUS:CANCELLED');
  righe.push('END:VEVENT');
  return righe.map(piega).join('\r\n');
}

/** Calendario ICS con gli appuntamenti indicati. */
export function costruisciICS(appuntamenti, pazientiById, imp) {
  const corpo = appuntamenti
    .filter(a => a.data && a.ora)
    .map(a => evento(a, pazientiById.get(a.pazienteId), imp))
    .join('\r\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gestionale OMPT//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    corpo,
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

export function scaricaICS(appuntamenti, pazientiById, imp, nomeFile = 'appuntamenti.ics') {
  downloadFile(nomeFile, costruisciICS(appuntamenti, pazientiById, imp), 'text/calendar');
}

/* ---------- Google Calendar ---------- */
/**
 * Indirizzo che apre Google Calendar con l'evento gia' compilato.
 * Non serve alcuna autorizzazione: e' l'utente a premere «Salva», e quindi
 * a decidere consapevolmente che quel dato finisce nel proprio calendario.
 */
export function linkGoogleCalendar(appuntamento, paziente, imp) {
  const f = fine(appuntamento.data, appuntamento.ora, appuntamento.durata);
  const parametri = new URLSearchParams({
    action: 'TEMPLATE',
    text: etichettaEvento(appuntamento, paziente, imp),
    dates: `${stampaDataOra(appuntamento.data, appuntamento.ora)}/${stampaDataOra(f.data, f.ora)}`
  });
  const descrizione = descrizioneEvento(appuntamento, paziente, imp);
  if (descrizione) parametri.set('details', descrizione);
  const luogo = appuntamento.luogo || [imp?.indirizzo, imp?.citta].filter(Boolean).join(', ');
  if (luogo) parametri.set('location', luogo);
  return 'https://calendar.google.com/calendar/render?' + parametri.toString();
}
