/* ============================================================
   Vista: cruscotto iniziale
   ============================================================ */
import { 
  add, h, clear, fullName, fmtDate, fmtEUR, nz, todayISO, num, round2, yearOf, monthOf, MESI, daysBetween
 } from '../util.js';
import { tabella, badge, vuoto } from '../ui/kit.js';
import * as db from '../db.js';
import * as S from '../state.js';
import { calcolaTotali, statoFattura, numeroCompleto } from '../fatture.js';

export async function vistaDashboard(root) {
  const [pazienti, episodi, sedute, fatture, incassi, imp] = await Promise.all([
    S.pazienti(), db.all('episodi'), db.all('sedute'), db.all('fatture'), db.all('incassi'), S.imp()
  ]);
  const pazById = new Map(pazienti.map(p => [p.id, p]));
  const oggi = todayISO();
  const anno = yearOf(oggi), mese = monthOf(oggi);

  const perFattura = new Map();
  for (const i of incassi) {
    if (!perFattura.has(i.fatturaId)) perFattura.set(i.fatturaId, []);
    perFattura.get(i.fatturaId).push(i);
  }

  const incassiAnno = round2(incassi.filter(i => yearOf(i.data) === anno).reduce((s, i) => s + num(i.importo), 0));
  const incassiMese = round2(incassi.filter(i => yearOf(i.data) === anno && monthOf(i.data) === mese).reduce((s, i) => s + num(i.importo), 0));
  const seduteMese = sedute.filter(s => yearOf(s.data) === anno && monthOf(s.data) === mese).length;
  const episodiAperti = episodi.filter(e => !e.chiuso);

  const crediti = fatture
    .filter(f => f.numero && !f.annullata)
    .map(f => ({ f, st: statoFattura(f, perFattura.get(f.id) || [], calcolaTotali(f, imp)) }))
    .filter(r => r.st.residuo > 0.009)
    .sort((a, b) => (a.f.scadenza || a.f.data || '').localeCompare(b.f.scadenza || b.f.data || ''));
  const creditiTotali = round2(crediti.reduce((s, r) => s + r.st.residuo, 0));

  const seduteNonFatturate = sedute.filter(s => !s.fatturaId && num(s.importo) > 0);
  const daFatturare = round2(seduteNonFatturate.reduce((s, x) => s + num(x.importo), 0));

  const prossimi = sedute
    .map(s => ({ data: s.dati?.planSeduta?.prossimaSeduta, paziente: pazById.get(s.pazienteId), episodioId: s.episodioId }))
    .filter(x => x.data && x.data >= oggi)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 8);

  const ultimeSedute = sedute.slice().sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 8);

  add(clear(root), 
    setupIncompleto(imp, pazienti.length),

    h('div', { class: 'grid grid-4', style: { marginBottom: '16px' } },
      stat('Pazienti attivi', String(pazienti.filter(p => !p.archiviato).length), 'accent'),
      stat('Episodi in corso', String(episodiAperti.length)),
      stat(`Sedute di ${MESI[mese - 1].toLowerCase()}`, String(seduteMese)),
      stat('Incassato nel mese', fmtEUR(incassiMese), 'accent', `${fmtEUR(incassiAnno)} nell’anno`)),

    h('div', { class: 'grid grid-2' },
      h('div', { class: 'card card-tight' },
        h('div', { class: 'card-head' },
          h('h3', 'Da incassare'),
          h('span', { class: 'spacer' }),
          creditiTotali > 0 ? badge(fmtEUR(creditiTotali), 'warn') : badge('tutto incassato', 'ok')),
        tabella({
          colonne: [
            { label: 'Documento', cell: (r) => h('strong', numeroCompleto(r.f)) },
            { label: 'Paziente', cell: (r) => fullName(pazById.get(r.f.pazienteId)) || '—' },
            { label: 'Scadenza', cell: (r) => {
                if (!r.f.scadenza) return h('span', { class: 'small faint' }, '—');
                const gg = daysBetween(r.f.scadenza, oggi);
                return h('span', { class: 'small' }, fmtDate(r.f.scadenza),
                  gg > 0 ? badge(`+${gg} gg`, 'danger') : null);
              } },
            { label: 'Residuo', num: true, cell: (r) => fmtEUR(r.st.residuo) }
          ],
          righe: crediti.slice(0, 8),
          onRowClick: (r) => S.vai('/fattura/' + r.f.id),
          vuotoTesto: 'Nessun credito aperto.'
        }),
        crediti.length > 8 ? h('a', { class: 'list-link small', href: '#/incassi' }, `Vedi tutti i ${crediti.length} crediti →`) : null),

      h('div', { class: 'card card-tight' },
        h('div', { class: 'card-head' },
          h('h3', 'Sedute da fatturare'),
          h('span', { class: 'spacer' }),
          seduteNonFatturate.length ? badge(fmtEUR(daFatturare), 'accent') : null),
        tabella({
          colonne: [
            { label: 'Data', cell: (s) => h('span', { class: 'small' }, fmtDate(s.data)) },
            { label: 'Paziente', cell: (s) => fullName(pazById.get(s.pazienteId)) || '—' },
            { label: 'Prestazione', cell: (s) => h('span', { class: 'small' }, nz(s.prestazione, '')) },
            { label: 'Importo', num: true, cell: (s) => fmtEUR(s.importo) }
          ],
          righe: seduteNonFatturate.slice().sort((a, b) => (a.data || '').localeCompare(b.data || '')).slice(0, 8),
          onRowClick: (s) => S.vai('/paziente/' + s.pazienteId + '/fatture'),
          vuotoTesto: 'Tutte le sedute sono state fatturate.'
        }))),

    h('div', { class: 'grid grid-2' },
      h('div', { class: 'card card-tight' },
        h('div', { class: 'card-head' }, h('h3', 'Prossimi appuntamenti')),
        prossimi.length
          ? h('div', prossimi.map(x => h('a', { class: 'list-link', href: '#/cartella/' + x.episodioId + '/sedute' },
            h('strong', fmtDate(x.data)), ' — ', fullName(x.paziente) || 'paziente')))
          : vuoto('Nessun appuntamento pianificato. Si popola indicando la data della prossima seduta nel piano SOAP.')),

      h('div', { class: 'card card-tight' },
        h('div', { class: 'card-head' }, h('h3', 'Ultime sedute')),
        ultimeSedute.length
          ? h('div', ultimeSedute.map(s => h('a', { class: 'list-link', href: '#/cartella/' + s.episodioId + '/sedute' },
            h('strong', fmtDate(s.data)), ' — ', fullName(pazById.get(s.pazienteId)) || 'paziente',
            h('span', { class: 'faint small' }, s.prestazione ? ' · ' + s.prestazione : ''))))
          : vuoto('Nessuna seduta registrata.')))
  );
}

const stat = (l, v, cls = '', nota = '') => h('div', { class: 'stat ' + cls },
  h('div', { class: 'stat-label' }, l),
  h('div', { class: 'stat-value' }, v),
  nota ? h('div', { class: 'stat-note' }, nota) : null);

function setupIncompleto(imp, numPazienti) {
  const mancanti = [];
  if (!imp.cognome) mancanti.push('nome e cognome del professionista');
  if (!imp.partitaIva && imp.tipoDocumento === 'Fattura') mancanti.push('partita IVA');
  if (!imp.indirizzo) mancanti.push('indirizzo dello studio');
  if (!mancanti.length && numPazienti) return null;

  return h('div', { class: 'card' },
    h('h2', numPazienti ? 'Completa la configurazione' : 'Benvenuto nel gestionale'),
    mancanti.length
      ? h('p', 'Prima di emettere fatture completa: ' + mancanti.join(', ') + '.')
      : h('p', 'Registra il primo paziente per iniziare: potrai compilare la cartella clinica OMPT, annotare le sedute ed emettere le fatture.'),
    h('div', { class: 'btn-row' },
      mancanti.length ? h('a', { class: 'btn btn-primary', href: '#/impostazioni' }, '⚙ Vai alle impostazioni') : null,
      h('a', { class: 'btn' + (mancanti.length ? '' : ' btn-primary'), href: '#/pazienti' }, '👥 Pazienti')));
}
