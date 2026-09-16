/* ============================================================
   Lettura di file CSV
   ------------------------------------------------------------
   Gli export dei gestionali variano per separatore, codifica e
   convenzioni numeriche: il parser rileva da solo il separatore,
   toglie il BOM e gestisce virgolette ed escape.
   ============================================================ */

/** Rileva il separatore contando le occorrenze fuori dalle virgolette nella prima riga. */
export function rilevaSeparatore(testo) {
  const primaRiga = testo.split(/\r?\n/, 1)[0] || '';
  const candidati = [';', ',', '\t', '|'];
  let migliore = ',', massimo = 0;
  for (const sep of candidati) {
    let conteggio = 0, dentroVirgolette = false;
    for (let i = 0; i < primaRiga.length; i++) {
      const c = primaRiga[i];
      if (c === '"') dentroVirgolette = !dentroVirgolette;
      else if (c === sep && !dentroVirgolette) conteggio++;
    }
    if (conteggio > massimo) { massimo = conteggio; migliore = sep; }
  }
  return migliore;
}

/**
 * Converte un testo CSV in una matrice di stringhe.
 * Rispetta le virgolette, i doppi apici di escape e i ritorni a capo interni.
 */
export function leggiCSV(testo, separatore) {
  const sep = separatore || rilevaSeparatore(testo);
  const pulito = testo.replace(/^﻿/, '');          // via il BOM di Excel
  const righe = [];
  let campo = '', riga = [], dentroVirgolette = false;

  for (let i = 0; i < pulito.length; i++) {
    const c = pulito[i];
    if (dentroVirgolette) {
      if (c === '"') {
        if (pulito[i + 1] === '"') { campo += '"'; i++; }  // "" = virgoletta letterale
        else dentroVirgolette = false;
      } else campo += c;
      continue;
    }
    if (c === '"') { dentroVirgolette = true; continue; }
    if (c === sep) { riga.push(campo); campo = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { riga.push(campo); righe.push(riga); riga = []; campo = ''; continue; }
    campo += c;
  }
  if (campo !== '' || riga.length) { riga.push(campo); righe.push(riga); }

  return righe
    .map(r => r.map(v => v.trim()))
    .filter(r => r.some(v => v !== ''));               // via le righe completamente vuote
}

/** Prima riga come intestazione, le altre come oggetti indicizzati per colonna. */
export function leggiTabella(testo, separatore) {
  const righe = leggiCSV(testo, separatore);
  if (!righe.length) return { intestazioni: [], dati: [] };
  const intestazioni = righe[0].map(h => h.trim());
  const dati = righe.slice(1).map(r => {
    const o = {};
    intestazioni.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return o;
  });
  return { intestazioni, dati };
}

/* ------------------------------------------------------------------ */
/* Conversioni                                                         */
/* ------------------------------------------------------------------ */

/**
 * Interpreta un importo scritto con convenzioni diverse.
 * "1.234,56" (italiana) e "1,234.56" (anglosassone) devono dare lo stesso numero.
 */
export function numeroDaTesto(v, formato = 'auto') {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  let s = String(v ?? '').trim().replace(/[€$£\s ]/g, '');
  if (!s) return 0;
  const negativo = /^\(.*\)$/.test(s);
  if (negativo) s = s.slice(1, -1);

  // Se l'analisi dell'intera colonna ha stabilito quale sia il separatore
  // decimale, quella conclusione vale piu' di qualunque euristica sul singolo
  // valore: "500.000" da solo sembra migliaia, ma in una colonna che contiene
  // anche "1000.000" il punto e' per forza decimale.
  if (formato === 'punto') {
    const diretto = Number(s.replace(/,/g, ''));
    return Number.isFinite(diretto) ? (negativo ? -diretto : diretto) : 0;
  }
  if (formato === 'virgola') {
    const diretto = Number(s.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(diretto) ? (negativo ? -diretto : diretto) : 0;
  }

  const ultimaVirgola = s.lastIndexOf(',');
  const ultimoPunto = s.lastIndexOf('.');
  if (ultimaVirgola > -1 && ultimoPunto > -1) {
    // Il separatore decimale è quello più a destra.
    if (ultimaVirgola > ultimoPunto) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (ultimaVirgola > -1) {
    // Una sola virgola: decimale se seguita da 1-2 cifre, altrimenti migliaia.
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  } else if (ultimoPunto > -1) {
    // Solo punti. Piu' di uno sono per forza migliaia; uno seguito da esattamente
    // tre cifre e' quasi sempre migliaia ("1.234"), altrimenti e' il decimale.
    const quantiPunti = (s.match(/\./g) || []).length;
    if (quantiPunti > 1 || /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return negativo ? -n : n;
}

/**
 * Determina il separatore decimale guardando l'intera colonna.
 * Un valore isolato come "500.000" e' ambiguo; se pero' nella stessa colonna
 * compare "1000.000" o "40.00", il punto non puo' essere separatore di
 * migliaia e la lettura giusta vale per tutti i valori.
 * @returns {'punto'|'virgola'|'auto'}
 */
export function indovinaFormatoNumero(valori) {
  let conVirgola = 0, puntoNonRaggruppabile = 0, entrambi = 0;
  for (const v of valori) {
    const t = String(v ?? '').trim().replace(/[^0-9.,-]/g, '');
    if (!t || !/[0-9]/.test(t)) continue;
    const haPunto = t.includes('.'), haVirgola = t.includes(',');
    if (haPunto && haVirgola) { entrambi++; continue; }
    if (haVirgola) { conVirgola++; continue; }
    // Compatibile con i separatori di migliaia? (1-3 cifre, poi gruppi da 3)
    if (haPunto && !/^-?[0-9]{1,3}(\.[0-9]{3})+$/.test(t)) puntoNonRaggruppabile++;
  }
  if (entrambi) return 'auto';                   // ogni valore si legge da se'
  if (puntoNonRaggruppabile) return 'punto';
  if (conVirgola) return 'virgola';
  return 'auto';
}

const MESI_EN = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const MESI_IT = { gen: 1, feb: 2, mar: 3, apr: 4, mag: 5, giu: 6, lug: 7, ago: 8, set: 9, ott: 10, nov: 11, dic: 12 };

/**
 * Normalizza una data in formato ISO (aaaa-mm-gg).
 * Riconosce ISO, gg/mm/aaaa, mm/gg/aaaa e le forme con mese scritto.
 * @param {string} v
 * @param {'auto'|'gg/mm'|'mm/gg'} preferenza  come sciogliere l'ambiguità fra le due forme numeriche
 */
export function dataDaTesto(v, preferenza = 'auto') {
  const s = String(v ?? '').trim();
  if (!s) return '';

  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return iso(m[1], m[2], m[3]);

  // Mese scritto: "12 Jan 2026", "12-gen-2026"
  m = s.match(/^(\d{1,2})[\s\-/]+([a-zA-Zàù]{3,})[\s\-/]+(\d{4})/);
  if (m) {
    const sigla = m[2].slice(0, 3).toLowerCase();
    const mese = MESI_EN[sigla] ?? MESI_IT[sigla];
    if (mese) return iso(m[3], mese, m[1]);
  }
  m = s.match(/^([a-zA-Z]{3,})[\s\-/]+(\d{1,2}),?[\s\-/]+(\d{4})/);
  if (m) {
    const mese = MESI_EN[m[1].slice(0, 3).toLowerCase()];
    if (mese) return iso(m[3], mese, m[2]);
  }

  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    let [, a, b, anno] = m;
    if (anno.length === 2) anno = (Number(anno) > 70 ? '19' : '20') + anno;
    const primo = Number(a), secondo = Number(b);
    // Se uno dei due supera 12 non c'è ambiguità.
    if (primo > 12) return iso(anno, secondo, primo);
    if (secondo > 12) return iso(anno, primo, secondo);
    return preferenza === 'mm/gg' ? iso(anno, primo, secondo) : iso(anno, secondo, primo);
  }
  return '';
}

const iso = (a, m, g) => `${String(a).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(g).padStart(2, '0')}`;

/**
 * Le due forme numeriche sono indistinguibili riga per riga: si guarda l'intera
 * colonna e si sceglie la lettura compatibile con tutti i valori.
 */
export function indovinaFormatoData(valori) {
  let primoOltre12 = 0, secondoOltre12 = 0;
  for (const v of valori) {
    const m = String(v ?? '').trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (!m) continue;
    if (Number(m[1]) > 12) primoOltre12++;
    if (Number(m[2]) > 12) secondoOltre12++;
  }
  if (primoOltre12 && !secondoOltre12) return 'gg/mm';
  if (secondoOltre12 && !primoOltre12) return 'mm/gg';
  return 'auto';
}
