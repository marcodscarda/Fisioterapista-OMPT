/* ============================================================
   Vista: agenda delle sedute
   ============================================================ */
import { add, h, clear, fullName, fmtDate, fmtDateLong, fmtEUR, nz, todayISO, addDaysISO, matches } from '../util.js';
import { tabella, badge, vuoto } from '../ui/kit.js';
import * as db from '../db.js';
import * as S from '../state.js';

export async function vistaAgenda(root) {
  const [sedute, pazienti, episodi] = await Promise.all([db.all('sedute'), S.mappaPazienti(), db.all('episodi')]);
  const titoloEp = new Map(episodi.map(e => [e.id, e.titolo]));
  const oggi = todayISO();

  const stato = { periodo: 'mese', q: '' };
  const contenuto = h('div');

  const intervalli = {
    settimana: () => [addDaysISO(oggi, -7), addDaysISO(oggi, 7)],
    mese: () => [addDaysISO(oggi, -30), addDaysISO(oggi, 30)],
    futuro: () => [oggi, '9999-12-31'],
    tutto: () => ['0000-01-01', '9999-12-31']
  };

  function render() {
    const [da, a] = intervalli[stato.periodo]();
    const filtrate = sedute
      .filter(s => s.data && s.data >= da && s.data <= a)
      .filter(s => matches(stato.q, fullName(pazienti.get(s.pazienteId)), s.prestazione, titoloEp.get(s.episodioId)))
      .sort((x, y) => (y.data || '').localeCompare(x.data || '') || (y.ora || '').localeCompare(x.ora || ''));

    // Appuntamenti pianificati nel piano SOAP
    const pianificati = sedute
      .map(s => ({ data: s.dati?.planSeduta?.prossimaSeduta, pazienteId: s.pazienteId, episodioId: s.episodioId }))
      .filter(x => x.data && x.data >= oggi)
      .sort((x, y) => x.data.localeCompare(y.data));

    const perGiorno = new Map();
    for (const s of filtrate) {
      if (!perGiorno.has(s.data)) perGiorno.set(s.data, []);
      perGiorno.get(s.data).push(s);
    }

    add(clear(contenuto), 
      pianificati.length
        ? h('div', { class: 'card card-tight' },
          h('div', { class: 'card-head' }, h('h3', 'Appuntamenti pianificati'), h('span', { class: 'spacer' }), badge(String(pianificati.length), 'accent')),
          h('div', pianificati.slice(0, 12).map(x => h('a', { class: 'list-link', href: '#/cartella/' + x.episodioId + '/sedute' },
            h('strong', fmtDateLong(x.data)), ' — ', fullName(pazienti.get(x.pazienteId)) || 'paziente'))))
        : null,
      perGiorno.size
        ? h('div', [...perGiorno.entries()].map(([data, righe]) => h('div', { class: 'card card-tight' },
          h('div', { class: 'card-head' },
            h('h3', fmtDateLong(data)),
            data === oggi ? badge('oggi', 'accent') : null,
            h('span', { class: 'spacer' }),
            h('span', { class: 'faint small' }, `${righe.length} sedute`)),
          tabella({
            colonne: [
              { label: 'Ora', cell: (s) => h('span', { class: 'small' }, nz(s.ora, '—')) },
              { label: 'Paziente', cell: (s) => h('strong', fullName(pazienti.get(s.pazienteId)) || '—') },
              { label: 'Episodio', cell: (s) => h('span', { class: 'small faint' }, nz(titoloEp.get(s.episodioId), '')) },
              { label: 'Prestazione', cell: (s) => h('span', { class: 'small' }, nz(s.prestazione, '')) },
              { label: 'Durata', cell: (s) => h('span', { class: 'small' }, s.durata ? s.durata + '′' : '—') },
              { label: 'Importo', num: true, cell: (s) => s.importo ? fmtEUR(s.importo) : '—' },
              { label: 'Fatturata', cell: (s) => s.fatturaId ? badge('sì', 'ok') : badge('no', 'warn') }
            ],
            righe,
            onRowClick: (s) => S.vai('/cartella/' + s.episodioId + '/sedute')
          }))))
        : h('div', { class: 'card' }, vuoto('Nessuna seduta nel periodo selezionato.'))
    );
  }

  add(clear(root), 
    h('div', { class: 'search-bar' },
      h('select', { onChange: (e) => { stato.periodo = e.target.value; render(); } },
        [['settimana', 'Ultima e prossima settimana'], ['mese', 'Ultimo e prossimo mese'], ['futuro', 'Da oggi in poi'], ['tutto', 'Tutto lo storico']]
          .map(([v, l]) => h('option', { value: v, selected: v === stato.periodo }, l))),
      h('input', { type: 'search', placeholder: 'Cerca paziente o prestazione…', onInput: (e) => { stato.q = e.target.value; render(); } })),
    contenuto);
  render();
}
