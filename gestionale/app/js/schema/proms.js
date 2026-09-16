/* ============================================================
   PROM — Patient Reported Outcome Measures
   Definizione dei questionari, calcolo del punteggio e
   riferimenti per l'interpretazione (MCID/MDC di letteratura).
   ============================================================ */
import { round2 } from '../util.js';

const L06 = ['0', '1', '2', '3', '4', '5'];
const L05 = ['0', '1', '2', '3', '4'];
const L14 = ['1', '2', '3', '4'];
const L15 = ['1', '2', '3', '4', '5'];
const L07 = ['0', '1', '2', '3', '4', '5', '6'];

const items = (arr) => arr.map((l, i) => ({ k: 'i' + (i + 1), l }));
const somma = (v, n) => {
  let tot = 0, compilati = 0;
  for (let i = 1; i <= n; i++) {
    const x = v?.['i' + i];
    if (x !== '' && x != null) { tot += Number(x); compilati++; }
  }
  return { tot, compilati };
};

export const PROMS = {

  nprs: {
    id: 'nprs',
    nome: 'NPRS — Numeric Pain Rating Scale',
    breve: 'NPRS',
    descrizione: 'Intensità del dolore da 0 (nessun dolore) a 10 (il peggior dolore immaginabile).',
    scala: '0–10',
    direzione: 'basso-meglio',
    max: 10,
    mcid: 2,
    mcidNota: 'Variazione clinicamente rilevante ≈ 2 punti (o 30%).',
    items: [
      { k: 'i1', l: 'Dolore attuale', opts: L06.concat(['6', '7', '8', '9', '10']) },
      { k: 'i2', l: 'Dolore peggiore nell’ultima settimana', opts: L06.concat(['6', '7', '8', '9', '10']) },
      { k: 'i3', l: 'Dolore medio nell’ultima settimana', opts: L06.concat(['6', '7', '8', '9', '10']) }
    ],
    calcola(v) {
      const { tot, compilati } = somma(v, 3);
      if (!compilati) return null;
      return { punteggio: round2(tot / compilati), etichetta: `${round2(tot / compilati)}/10 (media)` };
    }
  },

  psfs: {
    id: 'psfs',
    nome: 'PSFS — Patient Specific Functional Scale',
    breve: 'PSFS',
    descrizione: 'Il paziente indica fino a 5 attività limitate dal problema e le valuta da 0 (incapace) a 10 (come prima).',
    scala: '0–10 (media)',
    direzione: 'alto-meglio',
    max: 10,
    mcid: 2,
    mcidNota: 'MCID ≈ 2 punti sulla media, 3 punti sulla singola attività.',
    attivitaLibere: true,
    items: [
      { k: 'a1', l: 'Attività 1', libera: true },
      { k: 'a2', l: 'Attività 2', libera: true },
      { k: 'a3', l: 'Attività 3', libera: true },
      { k: 'a4', l: 'Attività 4', libera: true },
      { k: 'a5', l: 'Attività 5', libera: true }
    ],
    calcola(v) {
      let tot = 0, n = 0;
      for (let i = 1; i <= 5; i++) {
        const val = v?.['a' + i + '_val'];
        if (val !== '' && val != null) { tot += Number(val); n++; }
      }
      if (!n) return null;
      return { punteggio: round2(tot / n), etichetta: `${round2(tot / n)}/10 su ${n} attività` };
    }
  },

  ndi: {
    id: 'ndi',
    nome: 'NDI — Neck Disability Index',
    breve: 'NDI',
    descrizione: 'Disabilità collegata al dolore cervicale. 10 item da 0 a 5.',
    scala: '0–100%',
    direzione: 'basso-meglio',
    max: 100,
    mcid: 7.5,
    mcidNota: 'MDC ≈ 10 punti percentuali; MCID ≈ 7,5. 0–8% nessuna disabilità, 10–28% lieve, 30–48% moderata, 50–68% severa, ≥72% completa.',
    itemOpts: L06,
    itemHint: '0 = nessun problema · 5 = problema massimo',
    items: items(['Intensità del dolore', 'Cura personale', 'Sollevare pesi', 'Leggere', 'Mal di testa', 'Concentrazione', 'Lavoro', 'Guida', 'Sonno', 'Attività ricreative']),
    calcola(v) {
      const { tot, compilati } = somma(v, 10);
      if (compilati < 8) return null;
      const perc = round2((tot / (compilati * 5)) * 100);
      const lab = perc < 10 ? 'nessuna disabilità' : perc < 30 ? 'lieve' : perc < 50 ? 'moderata' : perc < 72 ? 'severa' : 'completa';
      return { punteggio: perc, etichetta: `${perc}% — disabilità ${lab}`, grezzo: `${tot}/${compilati * 5}` };
    }
  },

  odi: {
    id: 'odi',
    nome: 'ODI — Oswestry Disability Index',
    breve: 'ODI',
    descrizione: 'Disabilità collegata al dolore lombare. 10 item da 0 a 5.',
    scala: '0–100%',
    direzione: 'basso-meglio',
    max: 100,
    mcid: 10,
    mcidNota: 'MDC ≈ 10 punti percentuali. 0–20% disabilità minima, 21–40% moderata, 41–60% severa, 61–80% invalidante, 81–100% allettato.',
    itemOpts: L06,
    itemHint: '0 = nessun problema · 5 = problema massimo',
    items: items(['Intensità del dolore', 'Cura personale', 'Sollevare pesi', 'Camminare', 'Stare seduto', 'Stare in piedi', 'Dormire', 'Vita sessuale', 'Vita sociale', 'Viaggiare']),
    calcola(v) {
      const { tot, compilati } = somma(v, 10);
      if (compilati < 8) return null;
      const perc = round2((tot / (compilati * 5)) * 100);
      const lab = perc <= 20 ? 'minima' : perc <= 40 ? 'moderata' : perc <= 60 ? 'severa' : perc <= 80 ? 'invalidante' : 'massima';
      return { punteggio: perc, etichetta: `${perc}% — disabilità ${lab}`, grezzo: `${tot}/${compilati * 5}` };
    }
  },

  quickdash: {
    id: 'quickdash',
    nome: 'QuickDASH — arto superiore',
    breve: 'QuickDASH',
    descrizione: 'Disabilità dell’arto superiore. 11 item da 1 a 5.',
    scala: '0–100',
    direzione: 'basso-meglio',
    max: 100,
    mcid: 15.9,
    mcidNota: 'MCID ≈ 16 punti; MDC ≈ 11. Servono almeno 10 item su 11 per un punteggio valido.',
    itemOpts: L15,
    itemHint: '1 = nessuna difficoltà · 5 = incapace',
    items: items(['Aprire un barattolo nuovo', 'Lavori domestici pesanti', 'Portare la spesa', 'Lavarsi la schiena', 'Usare un coltello', 'Attività ricreative impegnative', 'Interferenza con le attività sociali', 'Limitazione nel lavoro', 'Dolore all’arto', 'Formicolio', 'Difficoltà a dormire']),
    calcola(v) {
      const { tot, compilati } = somma(v, 11);
      if (compilati < 10) return null;
      const p = round2(((tot / compilati) - 1) * 25);
      return { punteggio: p, etichetta: `${p}/100`, grezzo: `${compilati} item` };
    }
  },

  lefs: {
    id: 'lefs',
    nome: 'LEFS — Lower Extremity Functional Scale',
    breve: 'LEFS',
    descrizione: 'Funzione dell’arto inferiore. 20 item da 0 a 4.',
    scala: '0–80',
    direzione: 'alto-meglio',
    max: 80,
    mcid: 9,
    mcidNota: 'MCID e MDC ≈ 9 punti.',
    itemOpts: L05,
    itemHint: '0 = attività impossibile · 4 = nessuna difficoltà',
    items: items(['Lavoro / attività domestiche', 'Hobby e sport', 'Entrare e uscire dal bagno', 'Camminare tra le stanze', 'Infilare le scarpe', 'Accovacciarsi', 'Sollevare un oggetto da terra', 'Attività leggere in casa', 'Attività pesanti in casa', 'Salire e scendere dall’auto', 'Camminare per 2 isolati', 'Camminare per 1,5 km', 'Salire 10 gradini', 'Scendere 10 gradini', 'Stare in piedi 1 ora', 'Stare seduto 1 ora', 'Correre in piano', 'Correre su terreno irregolare', 'Cambiare direzione correndo', 'Saltare']),
    calcola(v) {
      const { tot, compilati } = somma(v, 20);
      if (compilati < 18) return null;
      const p = compilati === 20 ? tot : round2((tot / compilati) * 20);
      return { punteggio: p, etichetta: `${p}/80 (${round2(p / 80 * 100)}% di funzione)` };
    }
  },

  spadi: {
    id: 'spadi',
    nome: 'SPADI — Shoulder Pain and Disability Index',
    breve: 'SPADI',
    descrizione: '5 item di dolore e 8 di disabilità, ciascuno da 0 a 10.',
    scala: '0–100%',
    direzione: 'basso-meglio',
    max: 100,
    mcid: 8,
    mcidNota: 'MCID ≈ 8–13 punti percentuali.',
    itemOpts: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    itemHint: '0 = nessun problema · 10 = il peggiore possibile',
    items: [
      ...items(['Dolore al suo peggio', 'Dolore coricato sul lato', 'Dolore nel raggiungere una mensola alta', 'Dolore nel toccare la nuca', 'Dolore nello spingere con il braccio']),
      ...items(['Lavarsi i capelli', 'Lavarsi la schiena', 'Indossare una maglietta', 'Abbottonare una camicia', 'Mettersi i pantaloni', 'Posizionare un oggetto su una mensola alta', 'Portare un peso di 10 kg', 'Togliere un oggetto dalla tasca posteriore'])
        .map((it, i) => ({ k: 'd' + (i + 1), l: it.l }))
    ],
    calcola(v) {
      const p = somma(v, 5);
      let dTot = 0, dN = 0;
      for (let i = 1; i <= 8; i++) {
        const x = v?.['d' + i];
        if (x !== '' && x != null) { dTot += Number(x); dN++; }
      }
      if (!p.compilati || !dN) return null;
      const dolore = round2((p.tot / (p.compilati * 10)) * 100);
      const disab = round2((dTot / (dN * 10)) * 100);
      const tot = round2((dolore + disab) / 2);
      return { punteggio: tot, etichetta: `${tot}% (dolore ${dolore}% · disabilità ${disab}%)` };
    }
  },

  tsk11: {
    id: 'tsk11',
    nome: 'TSK-11 — Tampa Scale for Kinesiophobia',
    breve: 'TSK-11',
    descrizione: 'Paura del movimento e della ri-lesione. 11 item da 1 a 4.',
    scala: '11–44',
    direzione: 'basso-meglio',
    max: 44,
    min: 11,
    mcid: 4,
    mcidNota: 'Punteggio ≥ 26 indica kinesiofobia clinicamente rilevante. MDC ≈ 4–5 punti.',
    itemOpts: L14,
    itemHint: '1 = fortemente in disaccordo · 4 = fortemente d’accordo',
    items: items([
      'Ho paura di farmi male se faccio esercizio',
      'Se ignorassi il dolore peggiorerebbe',
      'Il mio corpo mi dice che ho qualcosa di seriamente sbagliato',
      'Il dolore diminuirebbe se facessi esercizio',
      'Le persone non prendono sul serio la mia condizione',
      'Il mio problema ha messo a rischio il mio corpo per il resto della vita',
      'Il dolore significa sempre che mi sono fatto male',
      'Non è detto che un’attività che aumenta il dolore sia pericolosa',
      'Ho paura di potermi fare male accidentalmente',
      'Stare attento a non fare movimenti inutili è la cosa più sicura',
      'Non avrei tanto dolore se non ci fosse qualcosa di pericoloso nel mio corpo'
    ]),
    inversi: [4, 8, 11],
    calcola(v) {
      let tot = 0, n = 0;
      for (let i = 1; i <= 11; i++) {
        const x = v?.['i' + i];
        if (x === '' || x == null) continue;
        tot += this.inversi.includes(i) ? (5 - Number(x)) : Number(x);
        n++;
      }
      if (n < 11) return null;
      return { punteggio: tot, etichetta: `${tot}/44 — ${tot >= 26 ? 'kinesiofobia rilevante' : 'sotto la soglia clinica'}` };
    }
  },

  pcs: {
    id: 'pcs',
    nome: 'PCS — Pain Catastrophizing Scale',
    breve: 'PCS',
    descrizione: 'Catastrofizzazione del dolore: ruminazione, amplificazione, impotenza. 13 item da 0 a 4.',
    scala: '0–52',
    direzione: 'basso-meglio',
    max: 52,
    mcid: 6,
    mcidNota: 'Punteggio ≥ 30 indica catastrofizzazione clinicamente rilevante (circa 75° percentile).',
    itemOpts: L05,
    itemHint: '0 = per niente · 4 = moltissimo',
    items: items([
      'Continuo a pensare a quanto vorrei che il dolore finisse',
      'Sento che non ce la faccio più',
      'È terribile e penso che non migliorerà mai',
      'È tremendo e mi sento sopraffatto',
      'Non riesco a sopportarlo',
      'Ho paura che il dolore peggiori',
      'Continuo a pensare ad altri episodi dolorosi',
      'Desidero ansiosamente che il dolore passi',
      'Non riesco a togliermelo dalla testa',
      'Continuo a pensare a quanto fa male',
      'Continuo a pensare a quanto vorrei che smettesse',
      'Non posso fare nulla per ridurre l’intensità del dolore',
      'Mi chiedo se possa succedere qualcosa di grave'
    ]),
    calcola(v) {
      const { tot, compilati } = somma(v, 13);
      if (compilati < 13) return null;
      return { punteggio: tot, etichetta: `${tot}/52 — ${tot >= 30 ? 'catastrofizzazione rilevante' : 'nella norma'}` };
    }
  },

  fabq: {
    id: 'fabq',
    nome: 'FABQ — Fear-Avoidance Beliefs Questionnaire',
    breve: 'FABQ',
    descrizione: 'Convinzioni di paura-evitamento rispetto all’attività fisica e al lavoro.',
    scala: 'AF 0–24 · Lavoro 0–42',
    direzione: 'basso-meglio',
    max: 66,
    mcid: 4,
    mcidNota: 'FABQ-lavoro ≥ 34 e FABQ-attività fisica ≥ 15 sono associati a prognosi peggiore e a mancato ritorno al lavoro.',
    itemOpts: L07,
    itemHint: '0 = completamente in disaccordo · 6 = completamente d’accordo',
    items: [
      ...items([
        'Il dolore è stato causato dall’attività fisica',
        'L’attività fisica peggiora il mio dolore',
        'L’attività fisica potrebbe danneggiarmi',
        'Non dovrei fare attività fisica che peggiora il dolore',
        'Non posso fare attività fisica che peggiora il dolore'
      ]).map((it, i) => ({ k: 'af' + (i + 1), l: it.l })),
      ...items([
        'Il dolore è stato causato dal mio lavoro',
        'Il mio lavoro ha aggravato il dolore',
        'Ho diritto a un risarcimento per il dolore',
        'Il mio lavoro è troppo pesante per me',
        'Il mio lavoro peggiora o peggiorerebbe il dolore',
        'Il mio lavoro potrebbe danneggiarmi',
        'Non dovrei svolgere il mio lavoro con il dolore attuale',
        'Non posso svolgere il mio lavoro con il dolore attuale',
        'Non posso tornare al lavoro finché il dolore non sarà trattato',
        'Non penso che tornerò al lavoro entro 3 mesi',
        'Non penso che potrò tornare a quel lavoro'
      ]).map((it, i) => ({ k: 'lv' + (i + 1), l: it.l }))
    ],
    calcola(v) {
      // Sottoscala attività fisica: item 2,3,4,5 (af2..af5). Sottoscala lavoro: item 6,7,9,10,11,12,15 -> lv1,lv2,lv4,lv5,lv6,lv7,lv10
      const afKeys = ['af2', 'af3', 'af4', 'af5'];
      const lvKeys = ['lv1', 'lv2', 'lv4', 'lv5', 'lv6', 'lv7', 'lv10'];
      const sub = (keys) => {
        let t = 0, n = 0;
        for (const k of keys) { const x = v?.[k]; if (x !== '' && x != null) { t += Number(x); n++; } }
        return n === keys.length ? t : null;
      };
      const af = sub(afKeys), lv = sub(lvKeys);
      if (af == null && lv == null) return null;
      const parti = [];
      if (af != null) parti.push(`attività fisica ${af}/24`);
      if (lv != null) parti.push(`lavoro ${lv}/42`);
      return { punteggio: (af || 0) + (lv || 0), etichetta: parti.join(' · '), dettaglio: { af, lavoro: lv } };
    }
  },

  groc: {
    id: 'groc',
    nome: 'GROC — Global Rating of Change',
    breve: 'GROC',
    descrizione: 'Percezione globale di cambiamento rispetto all’inizio del trattamento, da -7 a +7.',
    scala: '-7 … +7',
    direzione: 'alto-meglio',
    max: 7,
    min: -7,
    mcid: 3,
    mcidNota: '≥ +3 indica un cambiamento clinicamente importante; ≥ +5 un cambiamento marcato.',
    items: [{ k: 'i1', l: 'Rispetto all’inizio del trattamento oggi sto…', opts: ['-7', '-6', '-5', '-4', '-3', '-2', '-1', '0', '1', '2', '3', '4', '5', '6', '7'] }],
    calcola(v) {
      const x = v?.i1;
      if (x === '' || x == null) return null;
      const n = Number(x);
      const lab = n >= 5 ? 'molto migliorato' : n >= 3 ? 'migliorato' : n >= 1 ? 'lievemente migliorato'
        : n === 0 ? 'invariato' : n >= -2 ? 'lievemente peggiorato' : n >= -4 ? 'peggiorato' : 'molto peggiorato';
      return { punteggio: n, etichetta: `${n > 0 ? '+' : ''}${n} — ${lab}` };
    }
  }
};

export const PROM_LIST = Object.values(PROMS);

/** Restituisce i PROM suggeriti per una regione corporea. */
export function promSuggeriti(regione) {
  const r = String(regione || '').toLowerCase();
  const base = ['nprs', 'psfs'];
  if (/cervic|collo|nuca|cefal/.test(r)) return [...base, 'ndi', 'tsk11'];
  if (/lomb|schiena|dorso|sacro|anca/.test(r)) return [...base, 'odi', 'fabq', 'tsk11'];
  if (/spall|scapol/.test(r)) return [...base, 'spadi', 'quickdash'];
  if (/gomito|polso|mano|braccio/.test(r)) return [...base, 'quickdash'];
  if (/ginocch|caviglia|piede|gamba|coscia/.test(r)) return [...base, 'lefs'];
  return base;
}

/** Calcola il punteggio di una compilazione. */
export function calcolaProm(promId, valori) {
  const def = PROMS[promId];
  if (!def) return null;
  try { return def.calcola(valori || {}); } catch { return null; }
}

/** Confronto tra due compilazioni dello stesso PROM rispetto all'MCID. */
export function confrontaProm(promId, primo, ultimo) {
  const def = PROMS[promId];
  if (!def || primo == null || ultimo == null) return null;
  const delta = round2(ultimo - primo);
  const miglioramento = def.direzione === 'basso-meglio' ? -delta : delta;
  return {
    delta,
    miglioramento: round2(miglioramento),
    superaMcid: def.mcid != null && miglioramento >= def.mcid,
    peggiorato: miglioramento < 0
  };
}
