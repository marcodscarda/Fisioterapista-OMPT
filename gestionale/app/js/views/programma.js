/* ============================================================
   Vista: programma di esercizi di un episodio di cura
   ------------------------------------------------------------
   Il programma vive dentro l'episodio, non nella libreria: la
   libreria dice com'e' fatto l'esercizio, il programma dice cosa
   deve fare questo paziente e con che dose. Cosi' una modifica
   alla libreria non riscrive quello che e' gia' stato consegnato
   in termini di dose, ma aggiorna la descrizione, che e' giusto
   resti una sola.
   ============================================================ */
import { add, h, clear, toast, nz, todayISO, matches, fmtDate, fullName } from '../util.js';
import { modal, conferma, badge, vuoto } from '../ui/kit.js';
import { REGIONI, CATEGORIE, CAMPI_DOSE, doseInRiga, doseEffettiva } from '../schema/esercizi.js';
import { assicuraCatalogo, nuovoEsercizio } from './esercizi.js';
import { stampaProgramma, documentoProgramma, anteprima } from '../print.js';
import * as db from '../db.js';
import * as S from '../state.js';

/** Espande le voci del programma con l'esercizio di libreria e la dose effettiva. */
export function vociRisolte(programma, libreria) {
  const perId = new Map((libreria || []).map(x => [x.id, x]));
  return (programma?.voci || [])
    .map(v => {
      const esercizio = perId.get(v.esercizioId);
      if (!esercizio) return null;
      return { voce: v, esercizio, dose: doseEffettiva(esercizio, v), note: v.note || '' };
    })
    .filter(Boolean);
}

export async function vistaProgramma(root, ep, paz, salva) {
  const libreria = await assicuraCatalogo();
  const imp = await S.imp();
  if (!ep.programma) ep.programma = { note: '', voci: [], aggiornatoIl: '' };
  const prog = ep.programma;

  const elenco = h('div');

  const registra = () => {
    prog.aggiornatoIl = todayISO();
    salva();
  };

  function disegna() {
    const risolte = vociRisolte(prog, libreria);
    clear(elenco);

    if (!risolte.length) {
      elenco.appendChild(vuoto('Nessun esercizio nel programma. Aggiungine uno dalla libreria.'));
      return;
    }

    risolte.forEach((r, i) => {
      const scheda = h('div', { class: 'card prog-voce' });
      const dosaggio = h('div', { class: 'form-grid' });

      const disegnaDose = () => {
        clear(dosaggio);
        for (const c of CAMPI_DOSE) {
          const proprio = r.voce.dose?.[c.k];
          const diLibreria = r.esercizio.dose?.[c.k];
          add(dosaggio, h('div', { class: 'field w-third' },
            h('label', c.l),
            h('input', {
              type: 'text',
              value: proprio ?? diLibreria ?? '',
              placeholder: diLibreria || c.esempio,
              onInput: (ev) => {
                if (!r.voce.dose) r.voce.dose = {};
                const v = ev.target.value;
                // Uguale alla libreria: non si memorizza, cosi' la voce resta
                // agganciata al valore predefinito se un domani cambia.
                if (v === '' || v === diLibreria) delete r.voce.dose[c.k];
                else r.voce.dose[c.k] = v;
              },
              onChange: registra
            }),
            diLibreria && proprio && proprio !== diLibreria
              ? h('span', { class: 'hint' }, 'in libreria: ' + diLibreria)
              : null));
        }
      };
      disegnaDose();

      add(scheda,
        h('div', { class: 'card-head' },
          r.esercizio.immagini?.[0]
            ? h('img', { class: 'es-mini', src: r.esercizio.immagini[0].dataUrl, alt: '' })
            : null,
          h('div', null,
            h('strong', `${i + 1}. ${r.esercizio.nome}`),
            h('div', { class: 'faint small' },
              [r.esercizio.regione, r.esercizio.categoria].filter(Boolean).join(' · '))),
          h('span', { class: 'spacer' }),
          h('div', { class: 'btn-row' },
            h('button', {
              class: 'btn btn-sm', disabled: i === 0,
              title: 'Sposta su',
              onClick: () => { scambia(prog.voci, i, i - 1); registra(); disegna(); }
            }, '↑'),
            h('button', {
              class: 'btn btn-sm', disabled: i === risolte.length - 1,
              title: 'Sposta giù',
              onClick: () => { scambia(prog.voci, i, i + 1); registra(); disegna(); }
            }, '↓'),
            h('a', { class: 'btn btn-sm', href: '#/esercizi/' + r.esercizio.id, title: 'Apri nella libreria' }, '↗'),
            h('button', {
              class: 'btn btn-sm btn-danger',
              onClick: () => {
                prog.voci.splice(prog.voci.indexOf(r.voce), 1);
                registra(); disegna();
              }
            }, '🗑'))),
        h('p', { class: 'small faint' }, nz(r.esercizio.obiettivo, '')),
        h('details', { class: 'sec' },
          h('summary', 'Dosaggio per questo paziente — ' + (doseInRiga(r.dose) || 'da definire')),
          h('div', { class: 'sec-body' },
            dosaggio,
            h('div', { class: 'field w-full' },
              h('label', 'Nota per il paziente'),
              h('input', {
                type: 'text', value: r.voce.note || '',
                placeholder: 'Es. solo la mattina, prima della camminata',
                onInput: (ev) => { r.voce.note = ev.target.value; },
                onChange: registra
              })))));
      elenco.appendChild(scheda);
    });
  }

  add(clear(root),
    h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h2', { class: 'mb0' }, 'Programma di esercizi'),
        h('span', { class: 'spacer' }),
        prog.aggiornatoIl ? h('span', { class: 'faint small' }, 'aggiornato il ' + fmtDate(prog.aggiornatoIl)) : null,
        h('div', { class: 'btn-row' },
          h('button', {
            class: 'btn btn-sm',
            onClick: () => anteprimaProgramma(prog, libreria, paz, imp, ep)
          }, '👁 Anteprima'),
          h('button', {
            class: 'btn btn-sm',
            onClick: () => {
              const risolte = vociRisolte(prog, libreria);
              if (!risolte.length) { toast('Il programma è vuoto.', 'err'); return; }
              stampaProgramma({ ...prog, voci: risolte }, paz, imp, ep);
            }
          }, '🖨 Stampa per il paziente'),
          h('button', {
            class: 'btn btn-primary',
            onClick: () => scegliDallaLibreria(libreria, prog, () => { registra(); disegna(); })
          }, '+ Aggiungi esercizio'))),
      h('div', { class: 'field w-full' },
        h('label', 'Indicazioni generali'),
        h('textarea', {
          rows: 2, value: prog.note || '',
          placeholder: 'Es. eseguire la mattina, prima di colazione. Sospendere e chiamarmi se i sintomi scendono sotto il ginocchio.',
          onInput: (ev) => { prog.note = ev.target.value; },
          onChange: registra
        }),
        h('span', { class: 'hint' }, 'Compaiono in cima alla scheda consegnata al paziente.'))),
    elenco);
  disegna();
}

const scambia = (arr, a, b) => { [arr[a], arr[b]] = [arr[b], arr[a]]; };

function anteprimaProgramma(prog, libreria, paz, imp, ep) {
  const risolte = vociRisolte(prog, libreria);
  modal({
    title: 'Anteprima della scheda',
    size: 'lg',
    body: anteprima(documentoProgramma({ ...prog, voci: risolte }, paz, imp, ep)),
    actions: [
      { label: 'Chiudi' },
      { label: '🖨 Stampa', class: 'btn-primary', onClick: () => stampaProgramma({ ...prog, voci: risolte }, paz, imp, ep) }
    ]
  });
}

/* ------------------------------------------------------------------ */
/* Scelta dalla libreria                                               */
/* ------------------------------------------------------------------ */
function scegliDallaLibreria(libreria, prog, fatto) {
  const stato = { q: '', regione: '', categoria: '' };
  const risultati = h('div', { class: 'scelta-esercizi' });
  const giaDentro = () => new Set((prog.voci || []).map(v => v.esercizioId));

  function render() {
    const dentro = giaDentro();
    const filtrati = libreria
      .filter(x => !stato.regione || x.regione === stato.regione)
      .filter(x => !stato.categoria || x.categoria === stato.categoria)
      .filter(x => matches(stato.q, x.nome, x.obiettivo, x.regione, x.categoria));
    clear(risultati);
    if (!filtrati.length) { risultati.appendChild(vuoto('Nessun esercizio con questi filtri.')); return; }
    for (const x of filtrati) {
      const presente = dentro.has(x.id);
      risultati.appendChild(h('div', { class: 'scelta-riga' + (presente ? ' presente' : '') },
        x.immagini?.[0]
          ? h('img', { class: 'es-mini', src: x.immagini[0].dataUrl, alt: '' })
          : h('span', { class: 'es-mini es-mini-vuota' }, '🏃'),
        h('div', { style: { flex: '1', minWidth: '0' } },
          h('strong', x.nome),
          h('div', { class: 'faint small' },
            [x.regione, x.categoria].filter(Boolean).join(' · '),
            x.dose ? ' — ' + doseInRiga(x.dose) : '')),
        presente
          ? badge('già nel programma', 'ok')
          : h('button', {
            class: 'btn btn-sm btn-primary',
            onClick: () => {
              prog.voci = prog.voci || [];
              prog.voci.push({ esercizioId: x.id, dose: {}, note: '' });
              fatto();
              render();
            }
          }, '+ Aggiungi')));
    }
  }

  modal({
    title: 'Scegli dalla libreria',
    size: 'lg',
    body: h('div',
      h('div', { class: 'search-bar', style: { marginBottom: '10px' } },
        h('select', { onChange: (ev) => { stato.regione = ev.target.value; render(); } },
          [h('option', { value: '' }, 'Tutte le regioni'), ...REGIONI.map(r => h('option', { value: r }, r))]),
        h('select', { onChange: (ev) => { stato.categoria = ev.target.value; render(); } },
          [h('option', { value: '' }, 'Tutti i tipi'), ...CATEGORIE.map(c => h('option', { value: c }, c))]),
        h('input', {
          type: 'search', placeholder: 'Cerca…', autofocus: true,
          onInput: (ev) => { stato.q = ev.target.value; render(); }
        })),
      risultati),
    actions: [
      {
        label: '+ Crea nuovo esercizio', onClick: () => {
          nuovoEsercizio({}, (salvato) => {
            libreria.push(salvato);
            prog.voci = prog.voci || [];
            prog.voci.push({ esercizioId: salvato.id, dose: {}, note: '' });
            fatto();
          });
        }
      },
      { label: 'Chiudi', class: 'btn-primary' }
    ]
  });
  render();
}
