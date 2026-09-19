/* ============================================================
   Anteprima della cartella clinica
   ------------------------------------------------------------
   Vista di sola lettura di quanto e' gia' stato scritto: serve a
   ripassare il caso prima della seduta senza aprire una per una
   le sezioni del modulo di compilazione.

   Mostra soltanto i campi compilati. Ogni sezione riporta il
   collegamento al punto corrispondente del modulo, cosi' da poter
   passare dalla lettura alla correzione in un clic.
   ============================================================ */
import { add, h, clear, fmtDate, nz, fullName, age } from '../util.js';
import { badge, vuoto } from '../ui/kit.js';
import { CARTELLA, SEDUTA } from '../schema/ompt.js';
import { PROMS, calcolaProm, confrontaProm } from '../schema/proms.js';
import { valoreLeggibile } from '../print.js';
import * as S from '../state.js';

/** Cerca la definizione di un campo nello schema, per etichetta e formato. */
function campoDi(parteK, sezK, campoK) {
  const parte = CARTELLA.find(p => p.key === parteK);
  const sez = parte?.sections.find(s => s.id === sezK);
  return sez?.fields.find(f => f.k === campoK) || null;
}

/** Una singola voce leggibile presa dalla cartella, o null se non compilata. */
function voceDi(ep, parteK, sezK, campoK) {
  const campo = campoDi(parteK, sezK, campoK);
  if (!campo) return null;
  const val = valoreLeggibile(campo, ep.cartella?.[parteK]?.[sezK]?.[campoK]);
  if (val == null) return null;
  return { label: campo.l, valore: val, campo, allerta: !!campo.alert };
}

/** Testo dei campi compilati di una sezione, gia' pronti per la lettura. */
function vociSezione(sez, datiParte) {
  const v = datiParte?.[sez.id] || {};
  const voci = [];
  for (const f of sez.fields) {
    if (f.t === 'info') continue;
    const val = valoreLeggibile(f, v[f.k]);
    if (val == null) continue;
    voci.push({ label: f.l, valore: val, campo: f, allerta: !!f.alert });
  }
  return voci;
}

const tabellaVoce = (campo, righe) => {
  const cols = campo.cols || Object.keys(righe[0] || {}).map(k => ({ k, l: k }));
  return h('div', { class: 'table-wrap' }, h('table', { class: 'tbl tbl-mini' },
    h('thead', h('tr', cols.map(c => h('th', c.l)))),
    h('tbody', righe.map(r => h('tr', cols.map(c => h('td', nz(r[c.k], '—'))))))));
};

const voceRiga = (voce) => h('div', {
  // Le tabelle occupano tutta la riga: incolonnarle stretta le renderebbe illeggibili.
  class: 'ant-voce' + (Array.isArray(voce.valore) ? ' ant-voce-largo' : '') + (voce.allerta ? ' ant-allerta' : '')
},
  h('div', { class: 'ant-label' }, voce.label),
  Array.isArray(voce.valore)
    ? tabellaVoce(voce.campo, voce.valore)
    : h('div', { class: 'ant-valore' }, String(voce.valore)));

/**
 * Costruisce l'anteprima completa di un episodio.
 * @param {object} ep        episodio con la sua cartella
 * @param {object} opzioni   { paz, sedute, onVai }
 */
export function riepilogoCartella(ep, { paz = null, sedute = [], onVai = null } = {}) {
  const radice = h('div', { class: 'anteprima' });
  const proms = Array.isArray(ep.proms) ? ep.proms : [];

  /* --- Intestazione --- */
  const anni = age(paz?.dataNascita);
  add(radice, h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('div', null,
        h('h2', { class: 'mb0' }, nz(ep.titolo, 'Episodio di cura')),
        h('div', { class: 'faint small' },
          [paz ? fullName(paz) + (anni != null ? `, ${anni} anni` : '') : null,
            nz(ep.regione, ''),
            'aperto il ' + fmtDate(ep.dataApertura),
            ep.chiuso ? 'chiuso il ' + fmtDate(ep.dataChiusura) : 'in corso'
          ].filter(Boolean).join(' · '))),
      h('span', { class: 'spacer' }),
      badge(`${sedute.length} sedute`, sedute.length ? 'accent' : ''),
      proms.length ? badge(`${proms.length} questionari`, 'accent') : null)));

  /* --- Sintesi clinica in evidenza --- */
  // Le quattro risposte che servono per prime quando si riapre un caso.
  const sintesi = [
    ['diagnosi', 'diagnosi', 'diagnosiFt'],
    ['ipotesi', 'ragionamentoPre', 'ipotesiPrincipale'],
    ['ipotesi', 'ragionamentoPre', 'meccanismoDolore'],
    ['vestibolare', 'vestSintesi', 'vestClassificazione'],
    ['piano', 'obiettivi', 'obiettiviTab'],
    ['piano', 'interventi', 'interventi']
  ].map(([parteK, sezK, campoK]) => voceDi(ep, parteK, sezK, campoK)).filter(Boolean);
  if (sintesi.length) {
    add(radice, h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', 'In sintesi')),
      h('div', { class: 'ant-sintesi' }, sintesi.map(v => voceRiga(v)))));
  }

  /* --- Asterischi: il riferimento di ogni rivalutazione --- */
  const asterischi = (ep.cartella?.diagnosi?.asterischi?.asterischi || []).filter(a => a?.segno);
  if (asterischi.length) {
    add(radice, h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', 'Asterischi (comparable signs)')),
      h('div', { class: 'table-wrap' }, h('table', { class: 'tbl tbl-mini' },
        h('thead', h('tr', h('th', 'Segno'), h('th', 'Valore iniziale'), h('th', 'Note'))),
        h('tbody', asterischi.map(a => h('tr',
          h('td', h('strong', a.segno)), h('td', nz(a.valore, '—')), h('td', nz(a.note, '—')))))))));
  }

  /* --- Le parti della cartella --- */
  let qualcosa = false;
  for (const parte of CARTELLA) {
    const datiParte = ep.cartella?.[parte.key] || {};
    const sezioni = parte.sections
      .map(sez => ({ sez, voci: vociSezione(sez, datiParte) }))
      .filter(x => x.voci.length);
    if (!sezioni.length) continue;
    qualcosa = true;
    const corpo = h('div');
    for (const { sez, voci } of sezioni) {
      add(corpo,
        h('h3', { class: 'ant-sez' }, sez.title),
        h('div', { class: 'ant-griglia' }, voci.map(v => voceRiga(v))));
    }
    add(radice, h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h2', parte.label),
        h('span', { class: 'spacer' }),
        onVai ? h('button', { class: 'btn btn-sm', onClick: () => onVai(parte.key) }, '✎ Apri e modifica') : null),
      corpo));
  }

  /* --- Questionari, con l'andamento fra prima e ultima compilazione --- */
  if (proms.length) {
    const perProm = new Map();
    for (const c of [...proms].sort((a, b) => (a.data || '').localeCompare(b.data || ''))) {
      if (!perProm.has(c.promId)) perProm.set(c.promId, []);
      perProm.get(c.promId).push(c);
    }
    const righe = [];
    for (const [promId, lista] of perProm) {
      const def = PROMS[promId];
      const primo = calcolaProm(promId, lista[0]?.valori);
      const ultimo = calcolaProm(promId, lista[lista.length - 1]?.valori);
      const conf = primo && ultimo && lista.length > 1
        ? confrontaProm(promId, primo.punteggio, ultimo.punteggio) : null;
      righe.push(h('tr',
        h('td', h('strong', def?.breve || promId), h('div', { class: 'faint small' }, `${lista.length} compilazioni`)),
        h('td', h('span', { class: 'small' }, fmtDate(lista[0]?.data)), h('div', null, primo ? primo.etichetta : '—')),
        h('td', h('span', { class: 'small' }, fmtDate(lista[lista.length - 1]?.data)), h('div', null, ultimo ? ultimo.etichetta : '—')),
        h('td', conf
          ? badge(`${conf.miglioramento > 0 ? '+' : ''}${conf.miglioramento}${conf.superaMcid ? ' · oltre l’MCID' : ''}`,
            conf.superaMcid ? 'ok' : conf.peggiorato ? 'danger' : '')
          : h('span', { class: 'faint' }, '—'))));
    }
    add(radice, h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h2', 'Questionari'),
        h('span', { class: 'spacer' }),
        onVai ? h('button', { class: 'btn btn-sm', onClick: () => onVai('proms') }, '✎ Apri') : null),
      h('div', { class: 'table-wrap' }, h('table', { class: 'tbl tbl-mini' },
        h('thead', h('tr', h('th', 'Questionario'), h('th', 'Prima'), h('th', 'Ultima'), h('th', 'Variazione'))),
        h('tbody', righe)))));
  }

  /* --- Ultime sedute: quel che conta ricordare prima di rivedere il paziente --- */
  if (sedute.length) {
    const ultime = [...sedute].sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 5);
    const blocchi = ultime.map(s => {
      const voci = [];
      for (const sez of SEDUTA) {
        for (const v of vociSezione(sez, s.dati || {})) voci.push(v);
      }
      return h('div', { class: 'ant-seduta' },
        h('div', { class: 'ant-seduta-testa' },
          h('strong', `Seduta n. ${s.numero || '—'}`),
          h('span', { class: 'faint small' },
            [fmtDate(s.data), s.durata ? s.durata + ' min' : null, s.prestazione].filter(Boolean).join(' · '))),
        voci.length
          ? h('div', { class: 'ant-griglia' }, voci.map(v => voceRiga(v)))
          : h('div', { class: 'faint small' }, 'Nessuna annotazione.'));
    });
    add(radice, h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h2', 'Ultime sedute'),
        h('span', { class: 'spacer' }),
        sedute.length > 5 ? h('span', { class: 'faint small' }, `le più recenti 5 di ${sedute.length}`) : null,
        onVai ? h('button', { class: 'btn btn-sm', onClick: () => onVai('sedute') }, '✎ Apri') : null),
      blocchi));
  }

  if (!qualcosa && !sedute.length && !proms.length) {
    add(radice, h('div', { class: 'card' },
      vuoto('La cartella è ancora vuota: compila l’esame soggettivo per vedere qui il riepilogo.')));
  }
  return radice;
}

/** Anteprima dentro la cartella, come prima scheda. */
export function vistaAnteprima(root, ep, paz, sedute) {
  add(clear(root),
    h('div', { class: 'btn-row', style: { marginBottom: '10px' } },
      h('span', { class: 'faint small' },
        'Sola lettura: qui trovi tutto quello che è già stato inserito, per riconsultarlo senza aprire le singole sezioni.'),
      h('span', { class: 'spacer' })),
    riepilogoCartella(ep, { paz, sedute, onVai: (k) => S.vai(`/cartella/${ep.id}/${k}`) }));
}
