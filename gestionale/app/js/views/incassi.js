/* ============================================================
   Vista: registro degli incassi e riepiloghi economici
   ============================================================ */
import { 
  add, h, clear, fullName, fmtDate, fmtEUR, toast, nz, todayISO, num, round2, yearOf, monthOf, MESI, MESI_BREVI, downloadFile, toCSV
 } from '../util.js';
import { modal, conferma, tabella, badge, barChart, vuoto } from '../ui/kit.js';
import * as db from '../db.js';
import * as S from '../state.js';
import { calcolaTotali, statoFattura, numeroCompleto, METODI_PAGAMENTO } from '../fatture.js';

/* ------------------------------------------------------------------ */
/* Registrazione di un incasso                                         */
/* ------------------------------------------------------------------ */
export function registraIncasso(fattura, imp, onFatto) {
  const tot = calcolaTotali(fattura, imp);
  S.incassiDi(fattura.id).then(precedenti => {
    const st = statoFattura(fattura, precedenti, tot);
    const dati = {
      fatturaId: fattura.id,
      pazienteId: fattura.pazienteId,
      data: todayISO(),
      importo: round2(Math.max(0, st.residuo)),
      metodo: fattura.metodoPagamento || imp.metodoPagamentoDefault || 'Contanti',
      note: ''
    };

    modal({
      title: 'Registra incasso — ' + numeroCompleto(fattura),
      body: h('div',
        h('p', { class: 'faint small' },
          `Totale documento ${fmtEUR(tot.nettoAPagare)} · già incassato ${fmtEUR(st.incassato)} · residuo ${fmtEUR(Math.max(0, st.residuo))}`),
        h('div', { class: 'form-grid' },
          h('div', { class: 'field w-half' }, h('label', 'Data dell’incasso'),
            h('input', { type: 'date', value: dati.data, onInput: (e) => { dati.data = e.target.value; } })),
          h('div', { class: 'field w-half' }, h('label', 'Importo (€)'),
            h('input', { type: 'number', step: '0.01', value: dati.importo, onInput: (e) => { dati.importo = num(e.target.value, 0); } })),
          h('div', { class: 'field w-half' }, h('label', 'Metodo di pagamento'),
            h('select', { onChange: (e) => { dati.metodo = e.target.value; } },
              METODI_PAGAMENTO.map(m => h('option', { value: m, selected: m === dati.metodo }, m)))),
          h('div', { class: 'field w-half' }, h('label', 'Note'),
            h('input', { type: 'text', onInput: (e) => { dati.note = e.target.value; } })))),
      actions: [
        { label: 'Annulla' },
        {
          label: 'Registra', class: 'btn-primary', keepOpen: true, onClick: async (close) => {
            if (!(dati.importo > 0)) { toast('Indica un importo maggiore di zero.', 'err'); return false; }
            await db.put('incassi', dati);
            toast('Incasso registrato.', 'ok');
            close();
            onFatto?.();
          }
        }
      ]
    });
  });
}

/* ------------------------------------------------------------------ */
/* Vista registro                                                      */
/* ------------------------------------------------------------------ */
export async function vistaIncassi(root) {
  const [incassi, fatture, pazienti, imp] = await Promise.all([
    db.all('incassi'), db.all('fatture'), S.mappaPazienti(), S.imp()
  ]);
  const perFattura = new Map();
  for (const i of incassi) {
    if (!perFattura.has(i.fatturaId)) perFattura.set(i.fatturaId, []);
    perFattura.get(i.fatturaId).push(i);
  }
  const fatturaById = new Map(fatture.map(f => [f.id, f]));

  const anni = [...new Set([
    ...incassi.map(i => yearOf(i.data)),
    ...fatture.map(f => f.anno || yearOf(f.data)),
    new Date().getFullYear()
  ])].sort((a, b) => b - a);

  const stato = { anno: anni[0] };
  const contenuto = h('div');

  function render() {
    const anno = Number(stato.anno);
    const delPeriodo = incassi.filter(i => yearOf(i.data) === anno);
    const totale = round2(delPeriodo.reduce((s, i) => s + num(i.importo), 0));

    // Fatturato dell'anno e crediti aperti
    const fatturePeriodo = fatture.filter(f => f.numero && !f.annullata && (f.anno || yearOf(f.data)) === anno);
    const fatturato = round2(fatturePeriodo.reduce((s, f) => s + calcolaTotali(f, imp).nettoAPagare, 0));
    const aperte = fatture
      .filter(f => f.numero && !f.annullata)
      .map(f => ({ f, st: statoFattura(f, perFattura.get(f.id) || [], calcolaTotali(f, imp)) }))
      .filter(r => r.st.residuo > 0.009)
      .sort((a, b) => (a.f.scadenza || a.f.data || '').localeCompare(b.f.scadenza || b.f.data || ''));
    const creditiTotali = round2(aperte.reduce((s, r) => s + r.st.residuo, 0));

    // Serie mensile
    const perMese = Array.from({ length: 12 }, () => 0);
    for (const i of delPeriodo) perMese[monthOf(i.data) - 1] += num(i.importo);

    // Ripartizione per metodo
    const perMetodo = new Map();
    for (const i of delPeriodo) perMetodo.set(i.metodo || 'Non indicato', round2((perMetodo.get(i.metodo || 'Non indicato') || 0) + num(i.importo)));

    const mesiConDati = perMese.filter(v => v > 0).length;

    add(clear(contenuto), 
      h('div', { class: 'grid grid-4', style: { marginBottom: '16px' } },
        stat('Incassato ' + anno, fmtEUR(totale), 'accent'),
        stat('Fatturato ' + anno, fmtEUR(fatturato)),
        stat('Da incassare (tutti gli anni)', fmtEUR(creditiTotali), creditiTotali > 0 ? 'warn' : ''),
        stat('Media mensile', fmtEUR(mesiConDati ? totale / mesiConDati : 0),
          '', mesiConDati ? `su ${mesiConDati} mesi con incassi` : 'nessun incasso')),

      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h3', 'Incassi per mese')),
        barChart(perMese.map((v, i) => ({ etichetta: MESI_BREVI[i], valore: round2(v) })),
          { formatta: (v) => v ? Math.round(v).toLocaleString('it-IT') : '' })),

      h('div', { class: 'grid grid-2' },
        h('div', { class: 'card card-tight' },
          h('div', { class: 'card-head' }, h('h3', 'Per metodo di pagamento')),
          perMetodo.size
            ? tabella({
              colonne: [
                { label: 'Metodo', cell: (r) => r[0] },
                { label: 'Importo', num: true, cell: (r) => fmtEUR(r[1]) },
                { label: 'Quota', num: true, cell: (r) => totale ? Math.round(r[1] / totale * 100) + '%' : '—' }
              ],
              righe: [...perMetodo.entries()].sort((a, b) => b[1] - a[1])
            })
            : vuoto('Nessun incasso registrato nell’anno.')),

        h('div', { class: 'card card-tight' },
          h('div', { class: 'card-head' }, h('h3', 'Riepilogo mensile')),
          tabella({
            colonne: [
              { label: 'Mese', cell: (r) => r.mese },
              { label: 'Incassato', num: true, cell: (r) => r.valore ? fmtEUR(r.valore) : h('span', { class: 'faint' }, '—') }
            ],
            righe: perMese.map((v, i) => ({ mese: MESI[i], valore: round2(v) }))
          }))),

      h('div', { class: 'card card-tight' },
        h('div', { class: 'card-head' },
          h('h3', 'Crediti aperti'),
          h('span', { class: 'spacer' }),
          aperte.length ? badge(`${aperte.length} documenti · ${fmtEUR(creditiTotali)}`, 'warn') : badge('nessun credito aperto', 'ok')),
        tabella({
          colonne: [
            { label: 'Numero', cell: (r) => h('strong', numeroCompleto(r.f)) },
            { label: 'Paziente', cell: (r) => fullName(pazienti.get(r.f.pazienteId)) || '—' },
            { label: 'Data', cell: (r) => h('span', { class: 'small' }, fmtDate(r.f.data)) },
            { label: 'Scadenza', cell: (r) => h('span', { class: 'small' }, fmtDate(r.f.scadenza) || '—') },
            { label: 'Residuo', num: true, cell: (r) => fmtEUR(r.st.residuo) },
            { label: 'Stato', cell: (r) => badge(r.st.label, r.st.kind) },
            {
              label: '', cell: (r) => h('button', {
                class: 'btn btn-sm', onClick: (e) => { e.stopPropagation(); registraIncasso(r.f, imp, () => S.aggiorna()); }
              }, '💶 Incassa')
            }
          ],
          righe: aperte,
          onRowClick: (r) => S.vai('/fattura/' + r.f.id),
          vuotoTesto: 'Tutte le fatture emesse risultano incassate.'
        })),

      h('div', { class: 'card card-tight' },
        h('div', { class: 'card-head' }, h('h3', `Movimenti ${anno}`),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-sm', onClick: () => esporta(delPeriodo, fatturaById, pazienti, anno) }, '⬇ Esporta CSV')),
        tabella({
          colonne: [
            { label: 'Data', cell: (i) => fmtDate(i.data) },
            {
              label: 'Documento', cell: (i) => {
                const f = fatturaById.get(i.fatturaId);
                return f ? h('a', { href: '#/fattura/' + f.id }, numeroCompleto(f)) : h('span', { class: 'faint' }, 'documento rimosso');
              }
            },
            { label: 'Paziente', cell: (i) => fullName(pazienti.get(i.pazienteId ?? fatturaById.get(i.fatturaId)?.pazienteId)) || '—' },
            { label: 'Metodo', cell: (i) => h('span', { class: 'small' }, nz(i.metodo, '')) },
            { label: 'Note', cell: (i) => h('span', { class: 'small faint' }, nz(i.note, '')) },
            { label: 'Importo', num: true, cell: (i) => h('strong', fmtEUR(i.importo)) },
            {
              label: '', cell: (i) => h('button', {
                class: 'btn btn-ghost btn-sm', onClick: async (e) => {
                  e.stopPropagation();
                  if (!await conferma('Eliminare questo incasso?', { okLabel: 'Elimina', danger: true })) return;
                  await db.del('incassi', i.id);
                  toast('Incasso eliminato.', 'ok');
                  S.aggiorna();
                }
              }, '✕')
            }
          ],
          righe: delPeriodo.slice().sort((a, b) => (b.data || '').localeCompare(a.data || '')),
          vuotoTesto: 'Nessun incasso registrato per l’anno selezionato.'
        }))
    );
  }

  add(clear(root), 
    h('div', { class: 'search-bar' },
      h('label', { class: 'small faint' }, 'Anno'),
      h('select', { onChange: (e) => { stato.anno = e.target.value; render(); } },
        anni.map(a => h('option', { value: a, selected: a === stato.anno }, String(a))))),
    contenuto);
  render();
}

const stat = (l, v, cls = '', nota = '') => h('div', { class: 'stat ' + cls },
  h('div', { class: 'stat-label' }, l),
  h('div', { class: 'stat-value' }, v),
  nota ? h('div', { class: 'stat-note' }, nota) : null);

function esporta(incassi, fatture, pazienti, anno) {
  if (!incassi.length) { toast('Nessun incasso da esportare.', 'err'); return; }
  const righe = incassi.slice().sort((a, b) => (a.data || '').localeCompare(b.data || '')).map(i => {
    const f = fatture.get(i.fatturaId);
    return {
      data: fmtDate(i.data),
      documento: f ? numeroCompleto(f) : '',
      paziente: fullName(pazienti.get(i.pazienteId ?? f?.pazienteId)) || '',
      metodo: i.metodo || '',
      importo: num(i.importo).toFixed(2).replace('.', ','),
      note: i.note || ''
    };
  });
  downloadFile(`incassi-${anno}.csv`, toCSV(righe, [
    { key: 'data', label: 'Data' }, { key: 'documento', label: 'Documento' }, { key: 'paziente', label: 'Paziente' },
    { key: 'metodo', label: 'Metodo' }, { key: 'importo', label: 'Importo' }, { key: 'note', label: 'Note' }
  ]), 'text/csv');
  toast('Registro incassi esportato.', 'ok');
}
