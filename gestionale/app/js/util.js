/* ============================================================
   Utility condivise
   ============================================================ */

/* ---------- Hyperscript minimale (niente innerHTML: niente XSS) ---------- */
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props && (typeof props !== 'object' || Array.isArray(props) || props instanceof Node)) {
    children.unshift(props);
    props = null;
  }
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v; // solo per markup generato internamente
    else if (k in el && k !== 'list' && k !== 'form' && k !== 'size') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(6)) {
    if (c == null || c === false || c === true) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/** Aggiunge figli a un elemento ignorando null/false/undefined.
 *  Necessario perche' Element.append() nativo convertirebbe null nella stringa "null". */
export function add(el, ...children) { append(el, children); return el; }

export const frag = (...children) => { const f = document.createDocumentFragment(); append(f, children); return f; };
export const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Identificatori ---------- */
export function uid(prefix = '') {
  const rnd = crypto.getRandomValues(new Uint8Array(9));
  return prefix + Date.now().toString(36) + '-' + Array.from(rnd, b => b.toString(36).padStart(2, '0')).join('').slice(0, 10);
}

/* ---------- Numeri e valuta ---------- */
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const num = (v, dflt = 0) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : dflt;
  if (v == null || v === '') return dflt;
  const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : dflt;
};
// useGrouping esplicito: la regola CLDR italiana ometterebbe il punto sotto le 5 cifre,
// ma sui documenti contabili il separatore di migliaia e' atteso gia' da 1.000,00.
const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const dec2 = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
export const fmtEUR = (n) => eur.format(round2(num(n)));
export const fmtNum = (n) => dec2.format(round2(num(n)));

/* ---------- Date ---------- */
export const todayISO = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD in ora locale
export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return (y && m && d) ? `${d}/${m}/${y}` : String(iso);
}
export function fmtDateLong(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? String(iso)
    : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}
export const yearOf = (iso) => Number(String(iso || '').slice(0, 4)) || new Date().getFullYear();
export const monthOf = (iso) => Number(String(iso || '').slice(5, 7)) || 0;
export const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
export const MESI_BREVI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export function age(birthISO, atISO) {
  if (!birthISO) return null;
  const b = new Date(String(birthISO).slice(0, 10));
  const at = new Date(String(atISO || todayISO()).slice(0, 10));
  if (Number.isNaN(b.getTime()) || Number.isNaN(at.getTime())) return null;
  let a = at.getFullYear() - b.getFullYear();
  const m = at.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < b.getDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}

export function daysBetween(fromISO, toISO) {
  const a = new Date(String(fromISO).slice(0, 10)), b = new Date(String(toISO || todayISO()).slice(0, 10));
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / 86400000);
}

export function addDaysISO(iso, days) {
  const d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + Number(days || 0));
  return d.toLocaleDateString('sv-SE');
}

/* ---------- Testo ---------- */
export const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
export const titleCase = (s) => String(s || '').toLowerCase().replace(/(^|[\s'’-])([a-zà-ù])/g, (_, p, c) => p + c.toUpperCase());
export const fullName = (p) => p ? [p.cognome, p.nome].filter(Boolean).join(' ').trim() : '';
export const initials = (p) => ((p?.nome || '')[0] || '').toUpperCase() + ((p?.cognome || '')[0] || '').toUpperCase();
export const nz = (v, dflt = '—') => (v == null || v === '' || (Array.isArray(v) && !v.length)) ? dflt : v;

export function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
export const matches = (needle, ...haystack) => {
  const n = normalize(needle).trim();
  if (!n) return true;
  const hay = normalize(haystack.filter(Boolean).join(' '));
  return n.split(/\s+/).every(part => hay.includes(part));
};

/* ---------- Codice fiscale ---------- */
const CF_ODD = { '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21, A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23 };
const CF_EVEN = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9, K: 10, L: 11, M: 12, N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19, U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25 };
const CF_REST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Validazione formale del codice fiscale persona fisica (16 caratteri). */
export function validaCF(cf) {
  const s = String(cf || '').toUpperCase().replace(/\s/g, '');
  if (!s) return { ok: true, empty: true };
  if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(s)) {
    return { ok: false, msg: 'Formato non valido (16 caratteri, schema RSSMRA80A01H501U).' };
  }
  let sum = 0;
  for (let i = 0; i < 15; i++) sum += (i % 2 === 0 ? CF_ODD : CF_EVEN)[s[i]];
  if (CF_REST[sum % 26] !== s[15]) return { ok: false, msg: 'Carattere di controllo errato: verificare il codice.' };
  return { ok: true, value: s };
}

/** Validazione formale della partita IVA italiana (11 cifre, checksum Luhn). */
export function validaPIVA(piva) {
  const s = String(piva || '').replace(/\D/g, '');
  if (!s) return { ok: true, empty: true };
  if (s.length !== 11) return { ok: false, msg: 'La partita IVA deve avere 11 cifre.' };
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    let d = Number(s[i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  if (sum % 10 !== 0) return { ok: false, msg: 'Codice di controllo della partita IVA errato.' };
  return { ok: true, value: s };
}

/** Sesso e data di nascita ricavati dal codice fiscale (utile per precompilare). */
export function datiDaCF(cf) {
  const v = validaCF(cf);
  if (!v.ok || v.empty) return null;
  const s = v.value;
  const mesi = { A: 1, B: 2, C: 3, D: 4, E: 5, H: 6, L: 7, M: 8, P: 9, R: 10, S: 11, T: 12 };
  const mese = mesi[s[8]];
  if (!mese) return null;
  let giorno = Number(s.slice(9, 11));
  const sesso = giorno > 40 ? 'F' : 'M';
  if (giorno > 40) giorno -= 40;
  const yy = Number(s.slice(6, 8));
  const nowYY = new Date().getFullYear() % 100;
  const secolo = yy <= nowYY ? 2000 : 1900;
  const iso = `${secolo + yy}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
  return { sesso, dataNascita: iso };
}

/* ---------- IBAN (controllo formale) ---------- */
export function validaIBAN(iban) {
  const s = String(iban || '').toUpperCase().replace(/\s/g, '');
  if (!s) return { ok: true, empty: true };
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return { ok: false, msg: 'Formato IBAN non valido.' };
  const re = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => c.charCodeAt(0) - 55);
  let rest = 0;
  for (const ch of re) rest = (rest * 10 + Number(ch)) % 97;
  return rest === 1 ? { ok: true, value: s } : { ok: false, msg: 'Codice di controllo IBAN errato.' };
}

/* ---------- File ---------- */
export function downloadFile(filename, content, mime = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function pickFile(accept = '.json') {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', accept, style: { display: 'none' } });
    input.addEventListener('change', () => { resolve(input.files[0] || null); input.remove(); });
    document.body.appendChild(input);
    input.click();
  });
}

export const readFileText = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result));
  r.onerror = () => rej(r.error);
  r.readAsText(file, 'utf-8');
});

/** Converte un array di oggetti in CSV con separatore ';' (Excel italiano). */
export function toCSV(rows, headers) {
  const cols = headers || (rows[0] ? Object.keys(rows[0]) : []);
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const labels = cols.map(c => typeof c === 'string' ? c : c.label);
  const keys = cols.map(c => typeof c === 'string' ? c : c.key);
  return '﻿' + [labels.map(esc).join(';'), ...rows.map(r => keys.map(k => esc(r[k])).join(';'))].join('\r\n');
}

/* ---------- Toast ---------- */
export function toast(msg, kind = '') {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const el = h('div', { class: 'toast ' + kind }, msg);
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

/* ---------- Debounce ---------- */
export function debounce(fn, ms = 300) {
  let t;
  const wrapped = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  wrapped.cancel = () => clearTimeout(t);
  wrapped.flush = (...args) => { clearTimeout(t); fn(...args); };
  return wrapped;
}

/** Legge un valore annidato: get(obj, 'a.b.c') */
export function get(obj, path, dflt) {
  const v = String(path).split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  return v === undefined ? dflt : v;
}
/** Scrive un valore annidato creando gli oggetti mancanti. */
export function set(obj, path, value) {
  const keys = String(path).split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys.at(-1)] = value;
  return obj;
}

export const clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
export const isEmptyVal = (v) => v == null || v === '' || v === false || (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
