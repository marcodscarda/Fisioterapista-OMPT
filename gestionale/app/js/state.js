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

/* ---------- Lavoro in sospeso fra una pagina e l'altra ---------- */
/* Una pagina che salva in differita (la cartella clinica) lascia qui il modo di
   completare il salvataggio. Va svolto PRIMA di costruire la pagina nuova:
   altrimenti quella rilegge dall'archivio dati ancora vecchi e, al salvataggio
   successivo, li riscrive sopra le modifiche appena fatte. */
let _inSospeso = null;
let _ascoltaChiusura = false;
export const inSospeso = (completa) => {
  _inSospeso = completa;
  // Un solo ascoltatore della chiusura per tutta la vita della pagina:
  // registrarne uno a ogni schermata farebbe scrivere, al momento di chiudere,
  // anche le copie vecchie dei dati rimaste nelle schermate precedenti.
  if (!_ascoltaChiusura) {
    addEventListener('beforeunload', () => {
      try { _inSospeso?.(); } catch (e) { console.error(e); }
    });
    _ascoltaChiusura = true;
  }
};
export async function completaInSospeso() {
  const completa = _inSospeso;
  _inSospeso = null;
  if (completa) { try { await completa(); } catch (e) { console.error(e); } }
}

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
export const appuntamenti = () => db.all('appuntamenti');
export const appuntamentiDi = (pazienteId) => db.byIndex('appuntamenti', 'pazienteId', pazienteId);
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
