/* ============================================================
   Vista: scheda del singolo paziente
   ============================================================ */
import { add, h, clear, fullName, fmtDate, age, toast, nz, todayISO, uid, fmtEUR } from '../util.js';
import { modal, conferma, tabs, tabella, badge, vuoto } from '../ui/kit.js';
import * as db from '../db.js';
import * as S from '../state.js';
import { nuovoPaziente, eliminaPaziente } from './pazienti.js';
import { stampaModulo, MODULI, stampaCartella } from '../print.js';
import { calcolaTotali, statoFattura, numeroCompleto } from '../fatture.js';

export async function vistaPaziente(root, { id, tab = 'episodi' }) {
  const p = await S.paziente(id);
  if (!p) { clear(root).appendChild(h('div', { class: 'alert danger' }, 'Paziente non trovato.')); return; }

  const [episodi, sedute, fatture, incassi, imp] = await Promise.all([
    S.episodiDi(id), S.seduteDi(id), S.fattureDi(id), S.mappaIncassi(), S.imp()
  ]);
  episodi.sort((a, b) => (b.dataApertura || '').localeCompare(a.dataApertura || ''));
  sedute.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  fatture.sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  const anni = age(p.dataNascita);
  const testa = h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('div', null,
        h('h1', { class: 'mb0' }, fullName(p)),
        h('div', { class: 'faint small' },
          [p.dataNascita ? `${fmtDate(p.dataNascita)}${anni != null ? ` · ${anni} anni` : ''}` : null,
          p.codiceFiscale, p.professione].filter(Boolean).join(' · ') || 'Anagrafica da completare')),
      h('span', { class: 'spacer' }),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-sm', onClick: () => nuovoPaziente(p, () => S.aggiorna()) }, '✎ Modifica'),
        h('button', { class: 'btn btn-sm', onClick: () => menuModuli(p, imp) }, '🖨 Moduli'),
        h('button', {
          class: 'btn btn-sm',
          onClick: async () => { await db.put('pazienti', { ...p, archiviato: !p.archiviato }); toast(p.archiviato ? 'Paziente riattivato.' : 'Paziente archiviato.', 'ok'); S.aggiorna(); }
        }, p.archiviato ? '↺ Riattiva' : '📥 Archivia'),
        h('button', {
          class: 'btn btn-sm btn-danger',
          onClick: async () => { if (await eliminaPaziente(p)) S.vai('/pazienti'); }
        }, '🗑'))),
    h('div', { class: 'grid grid-4' },
      infoBox('Telefono', nz(p.telefono)),
      infoBox('E-mail', nz(p.email)),
      infoBox('Residenza', nz([p.indirizzo, p.citta].filter(Boolean).join(', '))),
      infoBox('Medico curante', nz(p.medicoCurante))),
    avvisiConsensi(p)
  );

  const contenuto = h('div');
  const barra = tabs([
    { key: 'episodi', label: 'Episodi di cura', badge: episodi.length },
    { key: 'sedute', label: 'Sedute', badge: sedute.length },
    { key: 'fatture', label: 'Fatture', badge: fatture.length },
    { key: 'anagrafica', label: 'Anagrafica' }
  ], tab, (k) => S.vai(`/paziente/${id}/${k}`));

  add(clear(root), testa, barra, contenuto);

  if (tab === 'episodi') renderEpisodi(contenuto, p, episodi, sedute);
  else if (tab === 'sedute') renderSedute(contenuto, p, episodi, sedute);
  else if (tab === 'fatture') renderFatture(contenuto, p, fatture, incassi, imp);
  else renderAnagrafica(contenuto, p);
}

const infoBox = (l, v) => h('div', null, h('div', { class: 'stat-label' }, l), h('div', { class: 'small' }, v));

function avvisiConsensi(p) {
  const c = p.consensi || {};
  const mancanti = [];
  if (!c.privacy) mancanti.push('informativa privacy');
  if (!c.trattamento) mancanti.push('consenso al trattamento');
  if (!mancanti.length) return null;
  return h('div', { class: 'alert warn', style: { marginTop: '12px', marginBottom: 0 } },
    '⚠ Consensi da acquisire: ' + mancanti.join(', ') + '. Stampali dal pulsante “Moduli”.');
}

function menuModuli(p, imp) {
  modal({
    title: 'Stampa modulistica',
    body: h('div',
      h('p', { class: 'small faint' }, 'I moduli vengono precompilati con i dati anagrafici del paziente e con l’intestazione dello studio.'),
      h('div', { class: 'btn-row' },
        MODULI.map(m => h('button', { class: 'btn', onClick: () => stampaModulo(m.key, p, imp) }, '🖨 ' + m.label)))),
    actions: [{ label: 'Chiudi' }]
  });
}

/* ------------------------------------------------------------------ */
/* Episodi                                                             */
/* ------------------------------------------------------------------ */
function renderEpisodi(root, p, episodi, sedute) {
  const perEpisodio = new Map();
  for (const s of sedute) perEpisodio.set(s.episodioId, (perEpisodio.get(s.episodioId) || 0) + 1);

  add(clear(root), 
    h('div', { class: 'btn-row', style: { marginBottom: '12px' } },
      h('span', { class: 'faint small' }, 'Ogni episodio di cura contiene una cartella clinica OMPT completa e il proprio diario di sedute.'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-primary', onClick: () => creaEpisodio(p) }, '+ Nuovo episodio di cura')),
    h('div', { class: 'card card-tight' }, tabella({
      colonne: [
        { label: 'Episodio', cell: (e) => h('div', h('strong', nz(e.titolo, 'Senza titolo')),
            h('div', { class: 'faint small' }, nz(e.regione, 'regione non indicata'))) },
        { label: 'Apertura', cell: (e) => h('span', { class: 'small' }, fmtDate(e.dataApertura)) },
        { label: 'Sedute', cell: (e) => h('span', { class: 'small' }, String(perEpisodio.get(e.id) || 0)) },
        { label: 'Stato', cell: (e) => e.chiuso ? badge('chiuso il ' + fmtDate(e.dataChiusura)) : badge('in corso', 'accent') },
        { label: '', cell: () => h('span', { class: 'btn btn-sm' }, 'Apri cartella →') }
      ],
      righe: episodi,
      onRowClick: (e) => S.vai(`/cartella/${e.id}`),
      vuotoTesto: 'Nessun episodio di cura. Creane uno per iniziare la valutazione.'
    })));
}

async function creaEpisodio(p) {
  const dati = { titolo: '', regione: '', dataApertura: todayISO() };
  modal({
    title: 'Nuovo episodio di cura',
    body: h('div', { class: 'form-grid' },
      h('div', { class: 'field w-full' }, h('label', 'Titolo / problema principale *'),
        h('input', { type: 'text', placeholder: 'Es. Lombalgia con irradiazione all’arto inferiore destro', onInput: (e) => { dati.titolo = e.target.value; } })),
      h('div', { class: 'field w-half' }, h('label', 'Regione corporea'),
        h('select', { onChange: (e) => { dati.regione = e.target.value; } },
          ['', 'Cervicale', 'Cervico-brachiale', 'Dorsale', 'Lombare', 'Lombo-pelvica', 'Spalla', 'Gomito', 'Polso e mano', 'Anca', 'Ginocchio', 'Caviglia e piede', 'Temporo-mandibolare', 'Multidistrettuale']
            .map(o => h('option', { value: o }, o || '— seleziona —')))),
      h('div', { class: 'field w-half' }, h('label', 'Data di apertura'),
        h('input', { type: 'date', value: dati.dataApertura, onInput: (e) => { dati.dataApertura = e.target.value; } }))),
    actions: [
      { label: 'Annulla' },
      {
        label: 'Crea e apri la cartella', class: 'btn-primary', keepOpen: true,
        onClick: async (close) => {
          if (!dati.titolo.trim()) { toast('Indica il problema principale.', 'err'); return false; }
          const ep = await db.put('episodi', {
            pazienteId: p.id, ...dati, chiuso: false,
            cartella: { soggettivo: { invio: { dataValutazione: dati.dataApertura } } },
            proms: []
          });
          close();
          S.vai('/cartella/' + ep.id);
        }
      }
    ]
  });
}

/* ------------------------------------------------------------------ */
/* Sedute                                                              */
/* ------------------------------------------------------------------ */
function renderSedute(root, p, episodi, sedute) {
  const titoloEp = new Map(episodi.map(e => [e.id, e.titolo]));
  add(clear(root), h('div', { class: 'card card-tight' }, tabella({
    colonne: [
      { label: 'Data', cell: (s) => h('div', h('strong', fmtDate(s.data)), h('div', { class: 'faint small' }, nz(s.ora, ''))) },
      { label: 'Episodio', cell: (s) => h('span', { class: 'small' }, nz(titoloEp.get(s.episodioId), 'episodio rimosso')) },
      { label: 'Prestazione', cell: (s) => h('span', { class: 'small' }, nz(s.prestazione, '')) },
      { label: 'Durata', cell: (s) => h('span', { class: 'small' }, s.durata ? s.durata + ' min' : '—') },
      { label: 'Importo', num: true, cell: (s) => h('span', { class: 'small' }, s.importo ? fmtEUR(s.importo) : '—') },
      { label: 'Fatturata', cell: (s) => s.fatturaId ? badge('sì', 'ok') : badge('no', 'warn') }
    ],
    righe: sedute,
    onRowClick: (s) => S.vai(`/cartella/${s.episodioId}/sedute`),
    vuotoTesto: 'Nessuna seduta registrata.'
  })));
}

/* ------------------------------------------------------------------ */
/* Fatture del paziente                                                */
/* ------------------------------------------------------------------ */
function renderFatture(root, p, fatture, incassi, imp) {
  add(clear(root), 
    h('div', { class: 'btn-row', style: { marginBottom: '12px' } },
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-primary', onClick: () => S.vai('/fattura/nuova/' + p.id) }, '+ Nuova fattura')),
    h('div', { class: 'card card-tight' }, tabella({
      colonne: [
        { label: 'Numero', cell: (f) => h('strong', numeroCompleto(f)) },
        { label: 'Data', cell: (f) => h('span', { class: 'small' }, fmtDate(f.data)) },
        { label: 'Totale', num: true, cell: (f) => fmtEUR(calcolaTotali(f, imp).nettoAPagare) },
        { label: 'Stato', cell: (f) => {
            const st = statoFattura(f, incassi.get(f.id) || [], calcolaTotali(f, imp));
            return badge(st.label, st.kind);
          } }
      ],
      righe: fatture,
      onRowClick: (f) => S.vai('/fattura/' + f.id),
      vuotoTesto: 'Nessuna fattura emessa a questo paziente.'
    })));
}

/* ------------------------------------------------------------------ */
/* Anagrafica in sola lettura                                          */
/* ------------------------------------------------------------------ */
function renderAnagrafica(root, p) {
  const c = p.consensi || {};
  const riga = (l, v) => h('div', { class: 'field' }, h('span', { class: 'field-label' }, l), h('div', nz(v)));
  add(clear(root), h('div', { class: 'card' },
    h('div', { class: 'grid grid-3' },
      riga('Cognome e nome', fullName(p)),
      riga('Sesso', p.sesso),
      riga('Data di nascita', fmtDate(p.dataNascita)),
      riga('Luogo di nascita', p.luogoNascita),
      riga('Codice fiscale', p.codiceFiscale),
      riga('Partita IVA', p.partitaIva),
      riga('Telefono', p.telefono),
      riga('E-mail', p.email),
      riga('Professione', p.professione),
      riga('Indirizzo', [p.indirizzo, p.cap, p.citta, p.provincia].filter(Boolean).join(' ')),
      riga('Medico curante', p.medicoCurante),
      riga('Contatto di emergenza', p.contattoEmergenza)),
    p.note ? h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Note'), h('div', { style: { whiteSpace: 'pre-wrap' } }, p.note)) : null,
    h('h4', { style: { marginTop: '16px' } }, 'Consensi'),
    h('div', { class: 'chip-set' },
      [['privacy', 'Privacy'], ['trattamento', 'Trattamento fisioterapico'], ['manipolazione', 'Tecniche manipolative'], ['comunicazioni', 'Promemoria appuntamenti']]
        .map(([k, l]) => badge(l + (c[k] ? ' ✓' : ' ✕'), c[k] ? 'ok' : 'warn')),
      c.opposizioneSts ? badge('Opposizione Sistema TS', 'info') : null),
    c.dataConsensi ? h('p', { class: 'faint small', style: { marginTop: '8px' } }, 'Raccolti il ' + fmtDate(c.dataConsensi)) : null
  ));
}
