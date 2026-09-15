/* ============================================================
   Renderer dichiarativo dei form della cartella clinica.
   Trasforma lo schema (schema/ompt.js) in campi editabili.
   ============================================================ */
import { h, clear, uid, isEmptyVal } from '../util.js';
import { bodyChart } from './bodychart.js';

const wClass = (w) => 'w-' + (w || 'full');

/** Quanti campi di una sezione risultano compilati. */
export function contaCompilati(sezione, dati) {
  const v = dati?.[sezione.id] || {};
  return sezione.fields.filter(f => f.t !== 'info' && !isEmptyVal(v[f.k])).length;
}

/** Il valore del campo ha un contenuto significativo? */
export const haValore = (val) => !isEmptyVal(val) && val !== 'No' && val !== 'Non indagato';

/* ------------------------------------------------------------------ */
/* Campo singolo                                                       */
/* ------------------------------------------------------------------ */
export function campo(f, valore, onSet, ctx = {}) {
  const idAttr = 'f-' + uid();
  const etichetta = f.l ? h('label', { for: idAttr }, f.l) : null;
  const hint = f.hint ? h('span', { class: 'hint' }, f.hint) : null;
  let controllo;

  switch (f.t) {
    case 'info':
      return h('div', { class: 'field ' + wClass(f.w) }, h('div', { class: 'alert info' }, f.l));

    case 'textarea':
      controllo = h('textarea', {
        id: idAttr, rows: f.rows || 3, value: valore ?? '',
        onInput: (e) => onSet(e.target.value)
      });
      break;

    case 'num':
      controllo = h('input', {
        id: idAttr, type: 'number', step: f.step || 'any', value: valore ?? '',
        min: f.min, max: f.max,
        onInput: (e) => onSet(e.target.value === '' ? '' : Number(e.target.value))
      });
      break;

    case 'date':
    case 'time':
    case 'text':
      controllo = h('input', {
        id: idAttr, type: f.t, value: valore ?? '',
        onInput: (e) => onSet(e.target.value)
      });
      break;

    case 'sel':
      controllo = h('select', { id: idAttr, onChange: (e) => onSet(e.target.value) },
        (f.o[0] === '' ? f.o : ['', ...f.o]).map(o =>
          h('option', { value: o, selected: (valore ?? '') === o }, o === '' ? '— seleziona —' : o)));
      break;

    case 'radio': {
      const set = h('div', { class: 'chip-set' });
      for (const o of f.o) {
        const on = valore === o;
        set.appendChild(h('label', {
          class: 'chip-opt' + (on ? ' on' : ''),
          onClick: (e) => { e.preventDefault(); onSet(on ? '' : o); }
        }, o));
      }
      controllo = set;
      break;
    }

    case 'chips': {
      const attuali = Array.isArray(valore) ? valore : [];
      const set = h('div', { class: 'chip-set' });
      for (const o of f.o) {
        const on = attuali.includes(o);
        set.appendChild(h('label', {
          class: 'chip-opt' + (on ? ' on' : ''),
          onClick: (e) => {
            e.preventDefault();
            onSet(on ? attuali.filter(x => x !== o) : [...attuali, o]);
          }
        }, o));
      }
      controllo = set;
      break;
    }

    case 'chk':
      return h('div', { class: 'field ' + wClass(f.w) },
        h('div', { class: 'check-row' },
          h('input', { id: idAttr, type: 'checkbox', checked: !!valore, onChange: (e) => onSet(e.target.checked) }),
          h('label', { for: idAttr }, f.l)),
        hint);

    case 'scale': {
      const v = valore === '' || valore == null ? 0 : Number(valore);
      const out = h('span', { class: 'scale-val' }, String(v));
      controllo = h('div', { class: 'scale' },
        h('input', {
          id: idAttr, type: 'range', min: 0, max: 10, step: 1, value: v,
          onInput: (e) => { out.textContent = e.target.value; onSet(Number(e.target.value)); }
        }), out);
      break;
    }

    case 'table':
      controllo = tabellaDinamica(f, Array.isArray(valore) ? valore : [], onSet);
      break;

    case 'body':
      controllo = bodyChart(valore, onSet, { readonly: ctx.readonly });
      break;

    case 'asterischi':
      controllo = rivalutazioneAsterischi(Array.isArray(valore) ? valore : [], onSet, ctx.asterischi || []);
      break;

    default:
      controllo = h('input', { id: idAttr, type: 'text', value: valore ?? '', onInput: (e) => onSet(e.target.value) });
  }

  return h('div', { class: 'field ' + wClass(f.w) }, etichetta, controllo, hint);
}

/* ------------------------------------------------------------------ */
/* Tabella dinamica                                                    */
/* ------------------------------------------------------------------ */
function tabellaDinamica(f, righe, onSet) {
  const wrap = h('div');
  const dati = righe.map(r => ({ ...r }));

  const salva = () => onSet(dati.filter(r => Object.values(r).some(v => !isEmptyVal(v))));

  function render() {
    clear(wrap);
    const body = h('tbody');
    dati.forEach((riga, i) => {
      body.appendChild(h('tr',
        f.cols.map(c => h('td', { style: c.width ? { width: c.width } : null }, cellaInput(c, riga, salva))),
        h('td', { style: { width: '40px' } },
          h('button', {
            type: 'button', class: 'btn btn-ghost btn-sm', title: 'Elimina riga',
            onClick: () => { dati.splice(i, 1); salva(); render(); }
          }, '✕'))
      ));
    });
    wrap.appendChild(h('div', { class: 'table-wrap' },
      h('table', { class: 'tbl' },
        h('thead', h('tr', f.cols.map(c => h('th', c.l)), h('th', ''))),
        body)));
    if (!dati.length) wrap.appendChild(h('p', { class: 'faint small' }, 'Nessuna riga inserita.'));
    wrap.appendChild(h('button', {
      type: 'button', class: 'btn btn-sm', style: { marginTop: '6px' },
      onClick: () => { dati.push(Object.fromEntries(f.cols.map(c => [c.k, '']))); render(); }
    }, '+ Aggiungi riga'));
  }

  function cellaInput(c, riga, salva) {
    if (c.t === 'sel') {
      return h('select', { onChange: (e) => { riga[c.k] = e.target.value; salva(); } },
        c.o.map(o => h('option', { value: o, selected: (riga[c.k] ?? '') === o }, o || '—')));
    }
    return h('input', {
      type: c.t === 'num' ? 'number' : 'text',
      step: 'any',
      value: riga[c.k] ?? '',
      onInput: (e) => { riga[c.k] = e.target.value; },
      onChange: salva
    });
  }

  render();
  return wrap;
}

/* ------------------------------------------------------------------ */
/* Rivalutazione degli asterischi nella seduta                          */
/* ------------------------------------------------------------------ */
function rivalutazioneAsterischi(valori, onSet, asterischi) {
  const wrap = h('div');
  if (!asterischi.length) {
    return h('p', { class: 'faint small' },
      'Nessun asterisco definito nella valutazione: aggiungili nella scheda “Diagnosi” per poterli rivalutare a ogni seduta.');
  }
  const stato = asterischi.map(a => {
    const prec = valori.find(v => v.segno === a.segno) || {};
    return { segno: a.segno, baseline: a.baseline || '', valore: prec.valore || '', variazione: prec.variazione || '' };
  });
  const salva = () => onSet(stato.filter(s => !isEmptyVal(s.valore) || !isEmptyVal(s.variazione)));

  wrap.appendChild(h('div', { class: 'table-wrap' },
    h('table', { class: 'tbl' },
      h('thead', h('tr', h('th', 'Asterisco'), h('th', 'Iniziale'), h('th', 'Oggi'), h('th', 'Variazione'))),
      h('tbody', stato.map(s => h('tr',
        h('td', s.segno),
        h('td', { class: 'faint' }, s.baseline || '—'),
        h('td', h('input', {
          type: 'text', value: s.valore, placeholder: 'valore rilevato',
          onInput: (e) => { s.valore = e.target.value; }, onChange: salva
        })),
        h('td', { style: { width: '170px' } }, h('select', {
          onChange: (e) => { s.variazione = e.target.value; salva(); }
        }, ['', 'Migliorato', 'Invariato', 'Peggiorato', 'Risolto'].map(o =>
          h('option', { value: o, selected: s.variazione === o }, o || '—')))))))
    )));
  return wrap;
}

/* ------------------------------------------------------------------ */
/* Sezioni                                                             */
/* ------------------------------------------------------------------ */
/**
 * Costruisce i pannelli a fisarmonica di un gruppo di sezioni.
 * @param {Array} sezioni  schema delle sezioni
 * @param {object} dati    oggetto che contiene i valori, indicizzato per id di sezione
 * @param {function} onChange  invocata dopo ogni modifica
 */
export function renderSezioni(sezioni, dati, onChange, ctx = {}) {
  const box = h('div');
  for (const sez of sezioni) {
    if (!dati[sez.id]) dati[sez.id] = {};
    const valori = dati[sez.id];
    const contatore = h('span', { class: 'sec-count' });
    const aggiornaContatore = () => {
      const n = contaCompilati(sez, dati);
      contatore.textContent = n ? `${n}/${sez.fields.filter(f => f.t !== 'info').length}` : 'vuota';
    };

    const griglia = h('div', { class: 'form-grid' });
    for (const f of sez.fields) {
      griglia.appendChild(campo(f, valori[f.k], (v) => {
        valori[f.k] = v;
        aggiornaContatore();
        onChange?.(sez.id, f.k, v);
      }, ctx));
    }
    aggiornaContatore();

    box.appendChild(h('details', { class: 'sec', open: ctx.apriTutto || sez.open },
      h('summary', sez.title, contatore),
      h('div', { class: 'sec-body' },
        sez.sub ? h('p', { class: 'faint small' }, sez.sub) : null,
        griglia)));
  }
  return box;
}
