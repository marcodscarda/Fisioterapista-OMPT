/* ============================================================
   Vista: agenda degli appuntamenti
   ============================================================ */
import {
  add, h, clear, fullName, fmtDate, fmtDateLong, fmtEUR, nz, todayISO,
  addDaysISO, matches, num, uid, toast, MESI
} from '../util.js';
import { modal, conferma, tabella, badge, vuoto } from '../ui/kit.js';
import * as db from '../db.js';
import * as S from '../state.js';
import { scaricaICS, linkGoogleCalendar, etichettaEvento } from '../calendario.js';

const STATI = {
  programmato: { l: 'Programmato', k: '' },
  confermato: { l: 'Confermato', k: 'info' },
  effettuato: { l: 'Effettuato', k: 'ok' },
  disdetto: { l: 'Disdetto', k: 'danger' },
  assente: { l: 'Non presentato', k: 'warn' }
};

/** Lunedì della settimana che contiene la data indicata. */
function lunedi(iso) {
  const d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
  const giorno = (d.getDay() + 6) % 7;          // 0 = lunedì
  return addDaysISO(iso, -giorno);
}
const GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export async function vistaAgenda(root) {
  const [appuntamenti, pazienti, episodi, imp] = await Promise.all([
    S.appuntamenti(), S.mappaPazienti(), db.all('episodi'), S.imp()
  ]);
  const oggi = todayISO();
  const stato = { inizio: lunedi(oggi), q: '' };
  const contenuto = h('div');

  const ricarica = () => S.aggiorna();

  function render() {
    const giorni = Array.from({ length: 7 }, (_, i) => addDaysISO(stato.inizio, i));
    const fine = giorni[6];
    const dellaSettimana = appuntamenti
      .filter(a => a.data >= stato.inizio && a.data <= fine)
      .filter(a => matches(stato.q, fullName(pazienti.get(a.pazienteId)), a.prestazione, a.note));

    const perGiorno = new Map(giorni.map(g => [g, []]));
    for (const a of dellaSettimana) perGiorno.get(a.data)?.push(a);
    for (const elenco of perGiorno.values()) elenco.sort((x, y) => (x.ora || '').localeCompare(y.ora || ''));

    const totaleOre = dellaSettimana
      .filter(a => a.stato !== 'disdetto')
      .reduce((s, a) => s + num(a.durata, 0), 0) / 60;

    clear(contenuto);
    add(contenuto,
      h('div', { class: 'card' },
        h('div', { class: 'card-head' },
          h('button', { class: 'btn btn-sm', onClick: () => { stato.inizio = addDaysISO(stato.inizio, -7); render(); } }, '‹'),
          h('button', { class: 'btn btn-sm', onClick: () => { stato.inizio = lunedi(todayISO()); render(); } }, 'Questa settimana'),
          h('button', { class: 'btn btn-sm', onClick: () => { stato.inizio = addDaysISO(stato.inizio, 7); render(); } }, '›'),
          h('h3', { style: { marginLeft: '8px' } }, intervallo(stato.inizio, fine)),
          h('span', { class: 'spacer' }),
          h('span', { class: 'faint small' },
            `${dellaSettimana.filter(a => a.stato !== 'disdetto').length} appuntamenti · ${totaleOre.toFixed(1).replace('.', ',')} ore`)),
        h('div', { class: 'settimana' },
          giorni.map(g => colonnaGiorno(g, perGiorno.get(g) || [], pazienti, imp, episodi, ricarica)))));
  }

  const intervallo = (da, a) => {
    const d1 = new Date(da + 'T12:00:00'), d2 = new Date(a + 'T12:00:00');
    return d1.getMonth() === d2.getMonth()
      ? `${d1.getDate()}–${d2.getDate()} ${MESI[d1.getMonth()].toLowerCase()} ${d1.getFullYear()}`
      : `${d1.getDate()} ${MESI[d1.getMonth()].toLowerCase()} – ${d2.getDate()} ${MESI[d2.getMonth()].toLowerCase()} ${d2.getFullYear()}`;
  };

  add(clear(root),
    h('div', { class: 'search-bar' },
      h('input', {
        type: 'search', placeholder: 'Cerca paziente o prestazione…',
        onInput: (e) => { stato.q = e.target.value; render(); }
      }),
      h('span', { class: 'spacer' }),
      h('button', {
        class: 'btn btn-sm',
        onClick: () => esportaCalendario(appuntamenti, pazienti, imp)
      }, '⬇ Esporta per il calendario'),
      h('button', {
        class: 'btn btn-primary',
        onClick: () => editorAppuntamento(null, { data: todayISO() }, pazienti, imp, episodi, ricarica)
      }, '+ Nuovo appuntamento')),
    contenuto,
    prossimiInSospeso(appuntamenti, pazienti, imp, episodi, ricarica));
  render();
}

function colonnaGiorno(giorno, elenco, pazienti, imp, episodi, ricarica) {
  const oggi = giorno === todayISO();
  const d = new Date(giorno + 'T12:00:00');
  return h('div', { class: 'giorno' + (oggi ? ' oggi' : '') },
    h('div', { class: 'giorno-testa' },
      h('span', { class: 'giorno-nome' }, GIORNI[(d.getDay() + 6) % 7]),
      h('span', { class: 'giorno-num' }, String(d.getDate())),
      h('button', {
        class: 'btn btn-ghost btn-sm', title: 'Aggiungi un appuntamento in questo giorno',
        onClick: () => editorAppuntamento(null, { data: giorno }, pazienti, imp, episodi, ricarica)
      }, '+')),
    h('div', { class: 'giorno-corpo' },
      elenco.length
        ? elenco.map(a => h('button', {
          class: 'appunt' + (a.stato === 'disdetto' ? ' disdetto' : ''),
          onClick: () => editorAppuntamento(a, null, pazienti, imp, episodi, ricarica)
        },
          h('span', { class: 'appunt-ora' }, nz(a.ora, '—')),
          h('span', { class: 'appunt-paz' }, fullName(pazienti.get(a.pazienteId)) || 'paziente'),
          a.prestazione ? h('span', { class: 'appunt-nota' }, a.prestazione) : null,
          a.stato && a.stato !== 'programmato' ? badge(STATI[a.stato]?.l || a.stato, STATI[a.stato]?.k) : null))
        : h('span', { class: 'faint small' }, '—')));
}

/** Appuntamenti passati non ancora chiusi: vanno segnati come effettuati o disdetti. */
function prossimiInSospeso(appuntamenti, pazienti, imp, episodi, ricarica) {
  const oggi = todayISO();
  const sospesi = appuntamenti
    .filter(a => a.data < oggi && ['programmato', 'confermato'].includes(a.stato || 'programmato'))
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  if (!sospesi.length) return null;
  return h('div', { class: 'card card-tight' },
    h('div', { class: 'card-head' },
      h('h3', 'Appuntamenti passati da chiudere'),
      h('span', { class: 'spacer' }),
      badge(String(sospesi.length), 'warn')),
    tabella({
      colonne: [
        { label: 'Data', cell: (a) => fmtDate(a.data) },
        { label: 'Ora', cell: (a) => h('span', { class: 'small' }, nz(a.ora, '')) },
        { label: 'Paziente', cell: (a) => fullName(pazienti.get(a.pazienteId)) || '—' },
        { label: 'Prestazione', cell: (a) => h('span', { class: 'small' }, nz(a.prestazione, '')) },
        {
          label: '', cell: (a) => h('div', { class: 'btn-row' },
            h('button', {
              class: 'btn btn-sm', onClick: async (e) => {
                e.stopPropagation();
                await db.put('appuntamenti', { ...a, stato: 'effettuato' });
                toast('Segnato come effettuato.', 'ok');
                ricarica();
              }
            }, '✓ Effettuato'),
            h('button', {
              class: 'btn btn-sm', onClick: async (e) => {
                e.stopPropagation();
                await db.put('appuntamenti', { ...a, stato: 'assente' });
                toast('Segnato come non presentato.', 'ok');
                ricarica();
              }
            }, '✕ Assente'))
        }
      ],
      righe: sospesi.slice(0, 10),
      onRowClick: (a) => editorAppuntamento(a, null, pazienti, imp, episodi, ricarica)
    }));
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */
function editorAppuntamento(esistente, preimpostazioni, pazienti, imp, episodi, ricarica) {
  const a = esistente
    ? { ...esistente }
    : {
      id: uid(), pazienteId: '', episodioId: '',
      data: preimpostazioni?.data || todayISO(), ora: '09:00',
      durata: num(imp.durataAppuntamentoDefault, 45),
      prestazioneId: '', prestazione: '', importo: 0,
      stato: 'programmato', note: '', luogo: ''
    };

  const elencoPazienti = [...pazienti.values()]
    .filter(p => !p.archiviato)
    .sort((x, y) => fullName(x).localeCompare(fullName(y), 'it'));
  const listino = imp.listino || [];

  const anteprimaEtichetta = h('span', { class: 'hint' });
  const aggiornaEtichetta = () => {
    anteprimaEtichetta.textContent = a.pazienteId
      ? 'Nel calendario esterno comparirà: «' + etichettaEvento(a, pazienti.get(a.pazienteId), imp) + '»'
      : '';
  };

  const campoImporto = h('input', {
    type: 'number', step: '0.01', value: a.importo ?? 0,
    onInput: (e) => { a.importo = num(e.target.value, 0); }
  });

  const corpo = h('div', { class: 'form-grid' },
    h('div', { class: 'field w-full' }, h('label', 'Paziente *'),
      h('select', {
        onChange: (e) => { a.pazienteId = e.target.value; a.episodioId = ''; aggiornaEtichetta(); }
      }, [h('option', { value: '' }, '— seleziona —'),
      ...elencoPazienti.map(p => h('option', { value: p.id, selected: p.id === a.pazienteId }, fullName(p)))])),

    h('div', { class: 'field w-third' }, h('label', 'Data'),
      h('input', { type: 'date', value: a.data, onInput: (e) => { a.data = e.target.value; } })),
    h('div', { class: 'field w-third' }, h('label', 'Ora'),
      h('input', { type: 'time', value: a.ora, onInput: (e) => { a.ora = e.target.value; aggiornaEtichetta(); } })),
    h('div', { class: 'field w-third' }, h('label', 'Durata (min)'),
      h('input', { type: 'number', min: '5', step: '5', value: a.durata, onInput: (e) => { a.durata = num(e.target.value, 45); } })),

    h('div', { class: 'field w-two-thirds' }, h('label', 'Prestazione'),
      h('select', {
        onChange: (e) => {
          const voce = listino.find(l => l.id === e.target.value);
          a.prestazioneId = e.target.value;
          a.prestazione = voce?.nome || '';
          if (voce) { a.importo = voce.prezzo; campoImporto.value = voce.prezzo; a.durata = voce.durata || a.durata; }
          aggiornaEtichetta();
        }
      }, [h('option', { value: '' }, '— nessuna —'),
      ...listino.map(l => h('option', { value: l.id, selected: l.id === a.prestazioneId }, `${l.nome} — € ${l.prezzo}`))])),
    h('div', { class: 'field w-third' }, h('label', 'Importo (€)'), campoImporto),

    h('div', { class: 'field w-half' }, h('label', 'Stato'),
      h('select', { onChange: (e) => { a.stato = e.target.value; } },
        Object.entries(STATI).map(([k, v]) => h('option', { value: k, selected: k === a.stato }, v.l)))),
    h('div', { class: 'field w-half' }, h('label', 'Luogo (se diverso dallo studio)'),
      h('input', { type: 'text', value: a.luogo || '', onInput: (e) => { a.luogo = e.target.value; } })),

    h('div', { class: 'field w-full' }, h('label', 'Note'),
      h('textarea', { rows: 2, value: a.note || '', onInput: (e) => { a.note = e.target.value; } })),
    h('div', { class: 'field w-full' }, anteprimaEtichetta)
  );
  aggiornaEtichetta();

  const azioni = [
    esistente ? {
      label: '🗑 Elimina', class: 'btn-danger', keepOpen: true, onClick: async (close) => {
        if (!await conferma('Eliminare questo appuntamento?', { okLabel: 'Elimina', danger: true })) return false;
        await db.del('appuntamenti', a.id);
        toast('Appuntamento eliminato.', 'ok');
        close();
        ricarica();
      }
    } : null,
    { label: 'Annulla' },
    {
      label: 'Salva', class: 'btn-primary', keepOpen: true, onClick: async (close) => {
        if (!a.pazienteId) { toast('Seleziona il paziente.', 'err'); return false; }
        if (!a.data || !a.ora) { toast('Indica data e ora.', 'err'); return false; }
        await db.put('appuntamenti', a);
        toast('Appuntamento salvato.', 'ok');
        close();
        ricarica();
      }
    }
  ].filter(Boolean);

  const { box } = modal({
    title: esistente ? 'Appuntamento' : 'Nuovo appuntamento',
    size: 'lg',
    body: h('div', corpo,
      h('hr'),
      h('h4', 'Calendario esterno'),
      h('p', { class: 'faint small' },
        'Il gestionale non si collega al tuo account: sei tu a decidere, ogni volta, che cosa finisce nel calendario. ' +
        'Con «Apri in Google Calendar» si apre l’evento già compilato e lo salvi tu; il file .ics si importa in Google, Apple o Outlook.'),
      h('div', { class: 'btn-row' },
        h('button', {
          class: 'btn btn-sm', onClick: () => {
            if (!a.pazienteId) { toast('Seleziona prima il paziente.', 'err'); return; }
            window.open(linkGoogleCalendar(a, pazienti.get(a.pazienteId), imp), '_blank', 'noopener');
          }
        }, '📅 Apri in Google Calendar'),
        h('button', {
          class: 'btn btn-sm', onClick: () => {
            if (!a.pazienteId) { toast('Seleziona prima il paziente.', 'err'); return; }
            scaricaICS([a], pazienti, imp, `appuntamento-${a.data}.ics`);
            toast('File .ics scaricato.', 'ok');
          }
        }, '⬇ Scarica .ics'))),
    actions: azioni
  });
  return box;
}

/* ------------------------------------------------------------------ */
/* Esportazione                                                        */
/* ------------------------------------------------------------------ */
function esportaCalendario(appuntamenti, pazienti, imp) {
  const oggi = todayISO();
  const futuri = appuntamenti.filter(a => a.data >= oggi && a.stato !== 'disdetto');
  modal({
    title: 'Esporta per il calendario',
    body: h('div',
      h('p', { class: 'faint small' },
        'Il file .ics si importa in Google Calendar (Impostazioni → Importa ed esporta), in Apple Calendario o in Outlook. ' +
        'È un’istantanea: modifiche successive nel gestionale non si propagano al calendario già importato.'),
      h('div', { class: 'alert info' },
        h('strong', 'Che cosa esce: '),
        `l’etichetta degli eventi è impostata su «${(imp.calendarioEtichetta || 'iniziali')}». ` +
        'Puoi cambiarla in Impostazioni → Studio → Calendario.'),
      h('p', null, `Appuntamenti futuri disponibili: ${futuri.length}. In archivio in totale: ${appuntamenti.length}.`)),
    actions: [
      { label: 'Annulla' },
      {
        label: `⬇ Solo i futuri (${futuri.length})`, onClick: () => {
          if (!futuri.length) { toast('Nessun appuntamento futuro.', 'err'); return; }
          scaricaICS(futuri, pazienti, imp, `agenda-${oggi}.ics`);
          toast('Calendario esportato.', 'ok');
        }
      },
      {
        label: `⬇ Tutti (${appuntamenti.length})`, class: 'btn-primary', onClick: () => {
          if (!appuntamenti.length) { toast('Nessun appuntamento in archivio.', 'err'); return; }
          scaricaICS(appuntamenti, pazienti, imp, `agenda-completa-${oggi}.ics`);
          toast('Calendario esportato.', 'ok');
        }
      }
    ]
  });
}
