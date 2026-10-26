/* ============================================================
   Vista: elenco pazienti e scheda anagrafica
   ============================================================ */
import { 
  add, h, clear, fullName, fmtDate, age, matches, toast, validaCF, validaPIVA, datiDaCF, titleCase, todayISO, downloadFile, toCSV, nz
 } from '../util.js';
import { modal, conferma, tabella, badge, vuoto } from '../ui/kit.js';
import * as db from '../db.js';
import * as S from '../state.js';

/* ------------------------------------------------------------------ */
/* Form anagrafica                                                     */
/* ------------------------------------------------------------------ */
export function formPaziente(paziente = {}) {
  const p = { consensi: {}, ...paziente, consensi: { ...(paziente.consensi || {}) } };
  const campi = {};
  const errCF = h('span', { class: 'hint' });

  const inp = (k, label, { type = 'text', w = 'half', hint = '', opts = null, onBlur = null } = {}) => {
    const el = opts
      ? h('select', { onChange: (e) => { p[k] = e.target.value; } },
        opts.map(o => h('option', { value: o, selected: (p[k] || '') === o }, o || '— seleziona —')))
      : h('input', { type, value: p[k] ?? '', onInput: (e) => { p[k] = e.target.value; }, onBlur });
    campi[k] = el;
    return h('div', { class: 'field w-' + w }, h('label', label), el, hint ? h('span', { class: 'hint' }, hint) : null);
  };

  const chk = (k, label) => h('div', { class: 'field w-half' },
    h('div', { class: 'check-row' },
      h('input', { type: 'checkbox', checked: !!p.consensi[k], onChange: (e) => { p.consensi[k] = e.target.checked; } }),
      h('label', label)));

  const cfField = inp('codiceFiscale', 'Codice fiscale', {
    w: 'third',
    onBlur: (e) => {
      const v = e.target.value.toUpperCase().trim();
      e.target.value = v; p.codiceFiscale = v;
      const res = validaCF(v);
      errCF.textContent = res.ok ? '' : res.msg;
      errCF.style.color = res.ok ? '' : 'var(--danger)';
      if (res.ok && !res.empty) {
        const d = datiDaCF(v);
        if (d) {
          if (!p.dataNascita) { p.dataNascita = d.dataNascita; campi.dataNascita.value = d.dataNascita; }
          if (!p.sesso) { p.sesso = d.sesso === 'F' ? 'Femminile' : 'Maschile'; campi.sesso.value = p.sesso; }
          errCF.textContent = 'Codice valido: data di nascita e sesso compilati automaticamente.';
          errCF.style.color = 'var(--ok)';
        }
      }
    }
  });
  cfField.appendChild(errCF);

  const corpo = h('div', { class: 'form-grid' },
    h('h4', { class: 'w-full' }, 'Anagrafica'),
    inp('cognome', 'Cognome *', { w: 'third', onBlur: (e) => { p.cognome = titleCase(e.target.value); e.target.value = p.cognome; } }),
    inp('nome', 'Nome *', { w: 'third', onBlur: (e) => { p.nome = titleCase(e.target.value); e.target.value = p.nome; } }),
    inp('sesso', 'Sesso', { w: 'third', opts: ['', 'Femminile', 'Maschile', 'Altro'] }),
    inp('dataNascita', 'Data di nascita', { type: 'date', w: 'third' }),
    inp('luogoNascita', 'Luogo di nascita', { w: 'third' }),
    cfField,

    h('h4', { class: 'w-full' }, 'Contatti e residenza'),
    inp('telefono', 'Telefono', { type: 'tel', w: 'third' }),
    inp('email', 'E-mail', { type: 'email', w: 'third' }),
    inp('professione', 'Professione', { w: 'third' }),
    inp('indirizzo', 'Indirizzo', { w: 'half' }),
    inp('cap', 'CAP', { w: 'quarter' }),
    inp('citta', 'Città', { w: 'quarter' }),
    inp('provincia', 'Provincia', { w: 'quarter', hint: 'Sigla, es. PA' }),
    inp('partitaIva', 'Partita IVA (se la fattura è intestata a un’azienda)', { w: 'two-thirds' }),

    h('h4', { class: 'w-full' }, 'Dati sanitari di contesto'),
    inp('medicoCurante', 'Medico curante', { w: 'half' }),
    inp('contattoEmergenza', 'Contatto in caso di necessità', { w: 'half' }),
    h('div', { class: 'field w-full' }, h('label', 'Note generali'),
      h('textarea', { rows: 2, value: p.note || '', onInput: (e) => { p.note = e.target.value; } })),

    h('h4', { class: 'w-full' }, 'Consensi acquisiti'),
    chk('privacy', 'Informativa privacy consegnata e consenso raccolto'),
    chk('trattamento', 'Consenso informato al trattamento fisioterapico'),
    chk('manipolazione', 'Consenso specifico per tecniche manipolative'),
    chk('comunicazioni', 'Consenso a promemoria via telefono/SMS/e-mail'),
    h('div', { class: 'field w-half' },
      h('div', { class: 'check-row' },
        h('input', { type: 'checkbox', checked: !!p.consensi.opposizioneSts, onChange: (e) => { p.consensi.opposizioneSts = e.target.checked; } }),
        h('label', 'Opposizione all’invio al Sistema Tessera Sanitaria')),
      h('span', { class: 'hint' }, 'Se selezionato, le spese non confluiscono nella dichiarazione precompilata.')),
    inp('dataConsensi', 'Data di raccolta dei consensi', { type: 'date', w: 'half' })
  );

  return { corpo, dati: p };
}

export async function nuovoPaziente(paziente = {}, onSalvato) {
  const { corpo, dati } = formPaziente(paziente);
  modal({
    title: paziente.id ? 'Modifica paziente' : 'Nuovo paziente',
    size: 'lg',
    body: corpo,
    actions: [
      { label: 'Annulla' },
      {
        label: 'Salva', class: 'btn-primary', keepOpen: true,
        onClick: async (close) => {
          if (!dati.cognome?.trim() || !dati.nome?.trim()) { toast('Nome e cognome sono obbligatori.', 'err'); return false; }
          const cf = validaCF(dati.codiceFiscale);
          if (!cf.ok) { toast('Codice fiscale non valido: ' + cf.msg, 'err'); return false; }
          const piva = validaPIVA(dati.partitaIva);
          if (!piva.ok) { toast('Partita IVA non valida: ' + piva.msg, 'err'); return false; }
          const salvato = await db.put('pazienti', dati);
          toast('Paziente salvato.', 'ok');
          close();
          onSalvato?.(salvato);
        }
      }
    ]
  });
}

/* ------------------------------------------------------------------ */
/* Elenco                                                              */
/* ------------------------------------------------------------------ */
export async function vistaPazienti(root) {
  const tutti = await S.pazienti();
  const episodi = await db.all('episodi');
  const sedute = await db.all('sedute');

  const perPaziente = new Map();
  for (const e of episodi) {
    const v = perPaziente.get(e.pazienteId) || { episodi: 0, aperti: 0, ultima: '' };
    v.episodi++; if (!e.chiuso) v.aperti++;
    perPaziente.set(e.pazienteId, v);
  }
  for (const s of sedute) {
    const v = perPaziente.get(s.pazienteId) || { episodi: 0, aperti: 0, ultima: '' };
    if ((s.data || '') > (v.ultima || '')) v.ultima = s.data || '';
    perPaziente.set(s.pazienteId, v);
  }

  const stato = { q: '', mostraArchiviati: false };
  const lista = h('div', { class: 'card card-tight' });

  function render() {
    const filtrati = tutti
      .filter(p => stato.mostraArchiviati || !p.archiviato)
      .filter(p => matches(stato.q, fullName(p), p.telefono, p.email, p.codiceFiscale, p.citta))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), 'it'));

    clear(lista);
    lista.appendChild(tabella({
      colonne: [
        { label: 'Paziente', cell: (p) => h('div', h('strong', fullName(p)),
            p.archiviato ? h('span', { class: 'badge', style: { marginLeft: '6px' } }, 'archiviato') : null,
            h('div', { class: 'faint small' },
              [p.dataNascita ? `${fmtDate(p.dataNascita)} (${age(p.dataNascita)} anni)` : null, p.citta].filter(Boolean).join(' · '))) },
        { label: 'Contatti', cell: (p) => h('div', { class: 'small' }, h('div', nz(p.telefono, '')), h('div', { class: 'faint' }, nz(p.email, ''))) },
        { label: 'Episodi', cell: (p) => {
            const v = perPaziente.get(p.id) || {};
            return h('div', { class: 'small' },
              `${v.episodi || 0} episodi`,
              v.aperti ? badge(`${v.aperti} in corso`, 'accent') : null);
          } },
        { label: 'Ultima seduta', cell: (p) => h('span', { class: 'small faint' }, fmtDate(perPaziente.get(p.id)?.ultima) || '—') },
        { label: '', cell: (p) => h('span', { class: 'btn btn-sm' }, 'Apri →') }
      ],
      righe: filtrati,
      onRowClick: (p) => S.vai('/paziente/' + p.id),
      vuotoTesto: stato.q ? 'Nessun paziente corrisponde alla ricerca.' : 'Nessun paziente registrato: inizia aggiungendone uno.'
    }));
    conteggio.textContent = `${filtrati.length} di ${tutti.length}`;
  }

  const conteggio = h('span', { class: 'faint small' });
  const ricerca = h('input', {
    type: 'search', placeholder: 'Cerca per nome, telefono, codice fiscale…',
    onInput: (e) => { stato.q = e.target.value; render(); }
  });

  add(clear(root), 
    h('div', { class: 'search-bar' },
      ricerca,
      h('label', { class: 'check-row' },
        h('input', { type: 'checkbox', onChange: (e) => { stato.mostraArchiviati = e.target.checked; render(); } }),
        h('span', { class: 'small' }, 'Mostra archiviati')),
      conteggio,
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-sm', onClick: () => esportaCsv(tutti) }, '⬇ Esporta CSV'),
      h('button', { class: 'btn btn-primary', onClick: () => nuovoPaziente({}, (p) => S.vai('/paziente/' + p.id)) }, '+ Nuovo paziente')),
    lista
  );
  render();
}

function esportaCsv(pazienti) {
  if (!pazienti.length) { toast('Nessun paziente da esportare.'); return; }
  const righe = pazienti.map(p => ({
    cognome: p.cognome, nome: p.nome, dataNascita: fmtDate(p.dataNascita), codiceFiscale: p.codiceFiscale || '',
    telefono: p.telefono || '', email: p.email || '',
    indirizzo: [p.indirizzo, p.cap, p.citta, p.provincia].filter(Boolean).join(' '),
    professione: p.professione || ''
  }));
  downloadFile(`pazienti-${todayISO()}.csv`, toCSV(righe, [
    { key: 'cognome', label: 'Cognome' }, { key: 'nome', label: 'Nome' }, { key: 'dataNascita', label: 'Data di nascita' },
    { key: 'codiceFiscale', label: 'Codice fiscale' }, { key: 'telefono', label: 'Telefono' }, { key: 'email', label: 'E-mail' },
    { key: 'indirizzo', label: 'Indirizzo' }, { key: 'professione', label: 'Professione' }
  ]), 'text/csv');
  toast('Elenco esportato.', 'ok');
}

/** Eliminazione con cancellazione a cascata. */
export async function eliminaPaziente(p) {
  const ok = await conferma(
    h('div',
      h('p', `Eliminare definitivamente ${fullName(p)}?`),
      h('p', { class: 'small' }, 'Verranno cancellati anche episodi, sedute, fatture e incassi collegati. L’operazione non è reversibile: valuta prima di archiviare il paziente.')),
    { title: 'Elimina paziente', okLabel: 'Elimina tutto', danger: true });
  if (!ok) return false;

  const episodi = await S.episodiDi(p.id);
  const sedute = await S.seduteDi(p.id);
  const fatture = await S.fattureDi(p.id);
  for (const f of fatture) {
    for (const i of await S.incassiDi(f.id)) await db.del('incassi', i.id);
    await db.del('fatture', f.id);
  }
  for (const s of sedute) await db.del('sedute', s.id);
  for (const e of episodi) await db.del('episodi', e.id);
  await db.del('pazienti', p.id);
  toast('Paziente eliminato.', 'ok');
  return true;
}
