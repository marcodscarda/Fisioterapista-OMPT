/* ============================================================
   Stato applicativo condiviso e router a hash
   ============================================================ */
import * as db from './db.js';

/* ---------- Impostazioni in cache ---------- */
let _imp = null;
export async function imp(forza = false) {
  if (!_imp || forza) _imp = await db.getImpostazioni();
  return _imp;
}
export async function salvaImp(nuove) {
  await db.salvaImpostazioni(nuove);
  _imp = null;
  return imp(true);
}

/* ---------- Router ---------- */
const rotte = [];
let _render = null;

/** Registra una rotta: pattern con segmenti ':param'. */
export function rotta(pattern, handler) {
  const parti = pattern.split('/').filter(Boolean);
  rotte.push({ parti, handler, pattern });
}

function risolvi(path) {
  const seg = path.split('/').filter(Boolean);
  for (const r of rotte) {
    if (r.parti.length !== seg.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < seg.length; i++) {
      if (r.parti[i].startsWith(':')) params[r.parti[i].slice(1)] = decodeURIComponent(seg[i]);
      else if (r.parti[i] !== seg[i]) { ok = false; break; }
    }
    if (ok) return { handler: r.handler, params };
  }
  return null;
}

export const percorso = () => (location.hash.replace(/^#/, '') || '/');
export const vai = (path) => { location.hash = path; };
export const sostituisci = (path) => location.replace('#' + path);

export function avviaRouter(render) {
  _render = render;
  addEventListener('hashchange', () => _render(risolvi(percorso()), percorso()));
  _render(risolvi(percorso()), percorso());
}

export const aggiorna = () => _render?.(risolvi(percorso()), percorso());

/* ---------- Tema ---------- */
const TEMA_KEY = 'gestionale-ompt-tema';
export function applicaTema(t) {
  const tema = t || leggiTema();
  if (tema === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', tema);
  try { localStorage.setItem(TEMA_KEY, tema); } catch { /* storage non disponibile */ }
}
export function leggiTema() {
  try { return localStorage.getItem(TEMA_KEY) || 'auto'; } catch { return 'auto'; }
}
export function ruotaTema() {
  const ordine = ['auto', 'light', 'dark'];
  const next = ordine[(ordine.indexOf(leggiTema()) + 1) % ordine.length];
  applicaTema(next);
  return next;
}

/* ---------- Helper dati ricorrenti ---------- */
export const pazienti = () => db.all('pazienti');
export const paziente = (id) => db.byId('pazienti', id);
export const episodiDi = (pazienteId) => db.byIndex('episodi', 'pazienteId', pazienteId);
export const seduteDi = (pazienteId) => db.byIndex('sedute', 'pazienteId', pazienteId);
export const seduteEpisodio = (episodioId) => db.byIndex('sedute', 'episodioId', episodioId);
export const fattureDi = (pazienteId) => db.byIndex('fatture', 'pazienteId', pazienteId);
export const incassiDi = (fatturaId) => db.byIndex('incassi', 'fatturaId', fatturaId);

/** Mappa fatturaId -> elenco incassi, per le viste che lavorano su molte fatture. */
export async function mappaIncassi() {
  const tutti = await db.all('incassi');
  const m = new Map();
  for (const i of tutti) {
    if (!m.has(i.fatturaId)) m.set(i.fatturaId, []);
    m.get(i.fatturaId).push(i);
  }
  return m;
}

/** Mappa pazienteId -> paziente. */
export async function mappaPazienti() {
  return new Map((await pazienti()).map(p => [p.id, p]));
}
