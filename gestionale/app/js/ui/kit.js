/* ============================================================
   Componenti di interfaccia riutilizzabili
   ============================================================ */
import { h, clear, qs } from '../util.js';

/* ---------- Modale ---------- */
export function modal({ title, body, actions = [], size = '', onClose } = {}) {
  const root = document.getElementById('modalRoot');
  const close = () => {
    document.removeEventListener('keydown', onKey);
    clear(root);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);

  const foot = h('div', { class: 'modal-foot' },
    actions.map(a => h('button', {
      type: 'button',
      class: 'btn ' + (a.class || ''),
      onClick: () => { const r = a.onClick?.(close); if (r !== false && a.keepOpen !== true) close(); }
    }, a.label))
  );

  const box = h('div', { class: 'modal ' + size, role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'modal-head' },
      h('h3', title || ''),
      h('button', { type: 'button', class: 'btn btn-ghost btn-icon', 'aria-label': 'Chiudi', onClick: close }, '✕')),
    h('div', { class: 'modal-body' }, body),
    actions.length ? foot : null
  );

  const back = h('div', {
    class: 'modal-back',
    onClick: (e) => { if (e.target === back) close(); }
  }, box);

  clear(root).appendChild(back);
  setTimeout(() => qs('input,select,textarea,button', box)?.focus(), 30);
  return { close, box };
}

/** Conferma modale. Restituisce una Promise<boolean>. */
export function conferma(messaggio, { title = 'Conferma', okLabel = 'Conferma', danger = false } = {}) {
  return new Promise((resolve) => {
    let deciso = false;
    modal({
      title,
      body: typeof messaggio === 'string' ? h('p', { class: 'mb0' }, messaggio) : messaggio,
      onClose: () => { if (!deciso) resolve(false); },
      actions: [
        { label: 'Annulla', onClick: () => { deciso = true; resolve(false); } },
        { label: okLabel, class: danger ? 'btn-danger' : 'btn-primary', onClick: () => { deciso = true; resolve(true); } }
      ]
    });
  });
}

/** Richiesta di un valore testuale. Restituisce Promise<string|null>. */
export function chiedi({ title = 'Inserisci', label = '', value = '', type = 'text', hint = '', okLabel = 'Salva' } = {}) {
  return new Promise((resolve) => {
    let deciso = false;
    const input = h('input', { type, value });
    modal({
      title,
      body: h('div', { class: 'field' },
        label ? h('label', label) : null,
        input,
        hint ? h('span', { class: 'hint' }, hint) : null),
      onClose: () => { if (!deciso) resolve(null); },
      actions: [
        { label: 'Annulla', onClick: () => { deciso = true; resolve(null); } },
        { label: okLabel, class: 'btn-primary', onClick: () => { deciso = true; resolve(input.value.trim()); } }
      ]
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { deciso = true; resolve(input.value.trim()); document.querySelector('.modal-head .btn-ghost')?.click(); }
    });
  });
}

/* ---------- Schede ---------- */
export function tabs(items, active, onSelect) {
  return h('div', { class: 'tabs', role: 'tablist' },
    items.map(it => h('button', {
      type: 'button',
      role: 'tab',
      class: it.key === active ? 'active' : '',
      'aria-selected': it.key === active ? 'true' : 'false',
      onClick: () => onSelect(it.key)
    }, it.label, it.badge != null ? h('span', { class: 'sec-count' }, ' ' + it.badge) : null))
  );
}

/* ---------- Stato vuoto ---------- */
export const vuoto = (testo, azione) => h('div', { class: 'tbl-empty' }, h('p', { class: 'mb0' }, testo), azione || null);

/* ---------- Tabella ---------- */
export function tabella({ colonne, righe, onRowClick, vuotoTesto = 'Nessun elemento.' }) {
  if (!righe.length) return vuoto(vuotoTesto);
  return h('div', { class: 'table-wrap' },
    h('table', { class: 'tbl' },
      h('thead', h('tr', colonne.map(c => h('th', { class: c.num ? 'num' : '' }, c.label)))),
      h('tbody', righe.map(r => h('tr', {
        class: onRowClick ? 'row-link' : '',
        onClick: onRowClick ? (e) => { if (!e.target.closest('button,a,input,select')) onRowClick(r); } : null
      }, colonne.map(c => h('td', { class: c.num ? 'num' : '' }, c.cell(r))))))
    )
  );
}

/* ---------- Badge ---------- */
export const badge = (testo, kind = '') => h('span', { class: 'badge ' + kind }, testo);

/* ---------- Grafico a barre elementare ---------- */
export function barChart(dati, { formatta = (v) => v } = {}) {
  const max = Math.max(1, ...dati.map(d => Math.abs(d.valore)));
  return h('div', { class: 'bar-chart' },
    dati.map(d => h('div', { class: 'bar-col', title: `${d.etichetta}: ${formatta(d.valore)}` },
      h('span', { class: 'bar-lbl' }, d.valore ? formatta(d.valore) : ''),
      h('div', { class: 'bar' + (d.alt ? ' alt' : ''), style: { height: Math.round((Math.abs(d.valore) / max) * 110) + 'px' } }),
      h('span', { class: 'bar-lbl' }, d.etichetta)))
  );
}
