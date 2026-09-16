/* ============================================================
   Body chart: mappa corporea anteriore/posteriore con marcatori
   numerati e descrizione dell'area sintomatica.
   Valore memorizzato: { marcatori: [{ n, vista, x, y, tipo, nota }] }
   ============================================================ */
import { h, clear } from '../util.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 120, H = 300;

/* Meta' destra della sagoma: offset rispetto all'asse centrale (x) e y assoluta.
   La meta' sinistra viene generata per specchiatura, cosi' la figura resta simmetrica. */
const META = [
  [8, 40], [9, 50],              // collo
  [26, 56], [32, 63],            // spalla
  [36, 90], [38, 118],           // braccio
  [40, 146], [41, 168],          // avambraccio
  [37, 178], [31, 176],          // mano
  [28, 150], [26, 122],          // avambraccio interno
  [24, 94], [22, 74],            // ascella
  [20, 80], [17, 106],           // fianco / vita
  [21, 128], [24, 142],          // bacino
  [22, 180], [19, 214],          // coscia / ginocchio
  [17, 248], [16, 276],          // gamba / caviglia
  [21, 291], [7, 291],           // piede
  [8, 276], [9, 248],
  [7, 214], [6, 180],
  [4, 152], [0, 140]             // interno coscia fino all'inguine
];

function sagomaPath() {
  const dx = META.map(([o, y]) => [60 + o, y]);
  const sx = META.slice(0, -1).map(([o, y]) => [60 - o, y]).reverse();
  const pts = [...dx, ...sx];
  return 'M' + pts.map(([x, y]) => `${x},${y}`).join(' L') + ' Z';
}

const TIPI = [
  { k: 'dolore', l: 'Dolore', colore: '#c62828' },
  { k: 'parestesia', l: 'Parestesie', colore: '#1565c0' },
  { k: 'ipoestesia', l: 'Ipoestesia', colore: '#6a1b9a' },
  { k: 'rigidita', l: 'Rigidità', colore: '#ef6c00' },
  { k: 'debolezza', l: 'Debolezza', colore: '#2e7d32' }
];
const coloreTipo = (t) => TIPI.find(x => x.k === t)?.colore || '#c62828';

function svgFigura(vista, marcatori, { onAdd, onSelect, selezionato, readonly }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '150');
  svg.setAttribute('height', '375');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', vista === 'front' ? 'Figura anteriore' : 'Figura posteriore');

  const mk = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };

  svg.appendChild(mk('ellipse', { cx: 60, cy: 24, rx: 15, ry: 19, class: 'bc-body' }));
  svg.appendChild(mk('path', { d: sagomaPath(), class: 'bc-body' }));

  if (vista === 'back') {
    svg.appendChild(mk('line', { x1: 60, y1: 58, x2: 60, y2: 132, class: 'bc-line' }));   // rachide
    svg.appendChild(mk('line', { x1: 44, y1: 70, x2: 76, y2: 70, class: 'bc-line' }));    // linea scapolare
  } else {
    svg.appendChild(mk('line', { x1: 48, y1: 96, x2: 72, y2: 96, class: 'bc-line' }));    // linea sottomammaria
    svg.appendChild(mk('line', { x1: 52, y1: 128, x2: 68, y2: 128, class: 'bc-line' }));  // ombelico
  }

  if (!readonly) {
    svg.addEventListener('click', (ev) => {
      if (ev.target.closest('.bc-marker, .bc-hit')) return;
      const p = svg.getBoundingClientRect();
      const x = ((ev.clientX - p.left) / p.width) * W;
      const y = ((ev.clientY - p.top) / p.height) * H;
      onAdd(vista, Math.round(x * 10) / 10, Math.round(y * 10) / 10);
    });
  }

  for (const m of marcatori.filter(m => m.vista === vista)) {
    const g = mk('g', { class: 'bc-hit', style: 'cursor:pointer' });
    const c = mk('circle', { cx: m.x, cy: m.y, r: 7, class: 'bc-marker', fill: coloreTipo(m.tipo) });
    if (selezionato === m.n) c.setAttribute('stroke-width', '3');
    const t = mk('text', { x: m.x, y: m.y + 3.2, class: 'bc-marker-txt' });
    t.textContent = String(m.n);
    g.appendChild(c); g.appendChild(t);
    g.addEventListener('click', (e) => { e.stopPropagation(); onSelect?.(m.n); });
    svg.appendChild(g);
  }
  return svg;
}

/**
 * Componente body chart.
 * @param {object} valore  { marcatori: [] }
 * @param {function} onChange  chiamata a ogni modifica con il nuovo valore
 */
export function bodyChart(valore, onChange, { readonly = false } = {}) {
  const stato = { marcatori: Array.isArray(valore?.marcatori) ? valore.marcatori.map(m => ({ ...m })) : [], sel: null };
  const box = h('div', { class: 'bodychart' });

  const emetti = () => onChange?.({ marcatori: stato.marcatori });

  function render() {
    clear(box);
    const onAdd = (vista, x, y) => {
      const n = stato.marcatori.reduce((m, k) => Math.max(m, k.n), 0) + 1;
      stato.marcatori.push({ n, vista, x, y, tipo: 'dolore', nota: '' });
      stato.sel = n;
      emetti();
      render();
    };
    const onSelect = (n) => { stato.sel = stato.sel === n ? null : n; render(); };

    box.appendChild(h('div', { class: 'bodychart-canvas' },
      h('div', { class: 'small faint center' }, 'Anteriore'),
      svgFigura('front', stato.marcatori, { onAdd, onSelect, selezionato: stato.sel, readonly })));
    box.appendChild(h('div', { class: 'bodychart-canvas' },
      h('div', { class: 'small faint center' }, 'Posteriore'),
      svgFigura('back', stato.marcatori, { onAdd, onSelect, selezionato: stato.sel, readonly })));

    const lato = h('div', { class: 'bodychart-side' });
    if (!stato.marcatori.length) {
      lato.appendChild(h('p', { class: 'faint small' },
        readonly ? 'Nessuna area segnalata.' : 'Clicca sulla figura per segnare un’area sintomatica.'));
    }
    for (const m of stato.marcatori.slice().sort((a, b) => a.n - b.n)) {
      const riga = h('div', {
        class: 'card',
        style: { padding: '10px 12px', marginBottom: '8px', borderLeft: `4px solid ${coloreTipo(m.tipo)}` }
      });
      riga.appendChild(h('div', { class: 'btn-row', style: { marginBottom: '6px' } },
        h('strong', `Area ${m.n}`),
        h('span', { class: 'faint small' }, m.vista === 'front' ? 'anteriore' : 'posteriore'),
        h('span', { class: 'spacer' }),
        readonly ? null : h('button', {
          type: 'button', class: 'btn btn-ghost btn-sm', title: 'Elimina area',
          onClick: () => {
            stato.marcatori = stato.marcatori.filter(x => x.n !== m.n);
            emetti(); render();
          }
        }, '✕')));
      if (readonly) {
        riga.appendChild(h('div', { class: 'small' },
          TIPI.find(t => t.k === m.tipo)?.l || 'Dolore', m.nota ? ' — ' + m.nota : ''));
      } else {
        riga.appendChild(h('select', {
          onChange: (e) => { m.tipo = e.target.value; emetti(); render(); },
          style: { marginBottom: '6px' }
        }, TIPI.map(t => h('option', { value: t.k, selected: t.k === m.tipo }, t.l))));
        riga.appendChild(h('input', {
          type: 'text', value: m.nota || '', placeholder: 'Descrizione (qualità, profondità, irradiazione…)',
          onInput: (e) => { m.nota = e.target.value; },
          onChange: () => emetti()
        }));
      }
      lato.appendChild(riga);
    }
    box.appendChild(lato);
  }

  render();
  return box;
}

export const TIPI_SINTOMO = TIPI;
