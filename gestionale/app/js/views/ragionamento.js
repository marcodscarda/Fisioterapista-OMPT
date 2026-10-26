/* ============================================================
   Vista: supporto al ragionamento clinico
   ============================================================ */
import { add, h, clear, toast } from '../util.js';
import { badge, vuoto } from '../ui/kit.js';
import { analizza } from '../ragionamento/index.js';

/**
 * @param {HTMLElement} root
 * @param {object} ep        episodio (modificabile: i pulsanti scrivono in cartella)
 * @param {object} paz
 * @param {function} salva   salvataggio ritardato dell'episodio
 */
export function vistaRagionamento(root, ep, paz, salva) {
  clear(root);
  const r = analizza(ep, paz, ep.proms || []);

  add(root, premessa());

  /* Urgenze e allerte ------------------------------------------------ */
  if (r.allerte.length) {
    add(root, h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h3', r.urgenza ? '⛔ Priorità: gestione dell’urgenza' : '⚠ Elementi da considerare prima di procedere')),
      r.allerte.map(a => h('div', {
        class: 'alert ' + (a.livello === 'urgente' ? 'danger' : 'warn'),
        style: { marginBottom: '8px' }
      },
        h('strong', a.testo),
        h('div', { style: { marginTop: '4px' } }, a.azione)))));
  }

  if (r.urgenza) {
    add(root, h('div', { class: 'card' },
      h('p', { class: 'mb0' },
        'Finché l’elemento di urgenza non è stato gestito, la diagnosi differenziale non è la priorità: ' +
        'le ipotesi non vengono proposte.')));
    return;
  }

  /* Meccanismo del dolore -------------------------------------------- */
  const m = r.meccanismo;
  add(root, h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h3', 'Meccanismo del dolore'),
      h('span', { class: 'spacer' }),
      badge(m.suggerito, m.suggerito === 'Da definire' ? '' : 'accent')),
    !m.coerenteConCartella
      ? h('div', { class: 'alert warn' },
        `In cartella è indicato «${ep.cartella?.ipotesi?.ragionamentoPre?.meccanismoDolore}», ` +
        `mentre gli elementi raccolti orientano verso «${m.suggerito}». Vale la pena rivedere la classificazione.`)
      : null,
    h('div', { class: 'grid grid-3' },
      Object.entries(m.indizi).map(([nome, elenco]) => h('div', null,
        h('h4', nome),
        elenco.length
          ? h('ul', { class: 'small', style: { paddingLeft: '18px', margin: 0 } }, elenco.map(i => h('li', i)))
          : h('p', { class: 'faint small mb0' }, 'nessun elemento')))),
    m.suggerito === 'Da definire'
      ? h('p', { class: 'faint small', style: { marginTop: '10px', marginBottom: 0 } },
        'Gli elementi raccolti non bastano a orientare il meccanismo: completa comportamento dei sintomi, qualità del dolore e questionari.')
      : null));

  /* Ipotesi ----------------------------------------------------------- */
  const cardIpotesi = h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h3', 'Ipotesi in ordine di sostegno'),
      h('span', { class: 'spacer' }),
      h('span', { class: 'faint small' }, 'ordinate dagli elementi presenti in cartella')));

  if (!r.ipotesi.length) {
    add(cardIpotesi, vuoto('Non ci sono ancora elementi sufficienti. Compila l’esame soggettivo — in particolare comportamento dei sintomi, irritabilità e bandiere — e indica la regione dell’episodio.'));
  } else {
    for (const i of r.ipotesi) {
      add(cardIpotesi, h('details', { class: 'sec', open: i.forza >= 60 },
        h('summary',
          h('strong', i.nome),
          h('span', { class: 'spacer' }),
          h('span', {
            style: {
              display: 'inline-block', width: '84px', height: '7px', borderRadius: '4px',
              background: 'var(--surface-3)', overflow: 'hidden', marginRight: '8px'
            }
          }, h('span', {
            style: {
              display: 'block', height: '100%', width: i.forza + '%',
              background: i.forza >= 60 ? 'var(--accent)' : 'var(--border-strong)'
            }
          })),
          h('span', { class: 'sec-count' }, i.forza + '%')),
        h('div', { class: 'sec-body' },
          i.favore.length ? h('div', null,
            h('h4', 'A favore'),
            h('ul', { style: { paddingLeft: '18px', margin: '0 0 10px' } },
              i.favore.map(f => h('li', f.testo,
                h('span', { class: 'faint small' }, f.peso >= 3 ? ' · elemento forte' : f.peso === 2 ? ' · elemento moderato' : ' · elemento debole'))))) : null,
          i.contro.length ? h('div', null,
            h('h4', 'Contro'),
            h('ul', { style: { paddingLeft: '18px', margin: '0 0 10px' } }, i.contro.map(f => h('li', f.testo)))) : null,
          i.chiarire.length ? h('div', null,
            h('h4', 'Per discriminare'),
            h('ul', { style: { paddingLeft: '18px', margin: '0 0 10px' } }, i.chiarire.map(t => h('li', t)))) : null,
          h('div', { class: 'btn-row' },
            h('button', {
              class: 'btn btn-sm',
              onClick: () => inserisciIpotesi(ep, i, salva)
            }, '↳ Usa come ipotesi principale'),
            h('button', {
              class: 'btn btn-sm',
              onClick: () => aggiungiAlternativa(ep, i, salva)
            }, '+ Aggiungi alle alternative')))));
    }
  }
  add(root, cardIpotesi);

  /* Esame fisico ------------------------------------------------------ */
  add(root, h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('h3', 'Come condurre l’esame fisico'),
      h('span', { class: 'spacer' }),
      badge(r.esame.dose.livello, r.esame.dose.livello.startsWith('Irritabilità alta') ? 'warn' : '')),
    h('h4', 'Dose e prudenza'),
    h('ul', { style: { paddingLeft: '18px' } }, r.esame.dose.indicazioni.map(i => h('li', i))),
    r.esame.test.length ? h('div', null,
      h('h4', { style: { marginTop: '14px' } }, 'Test proposti'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
        h('thead', h('tr', h('th', 'Test'), h('th', 'Perché'), h('th', 'Per quale ipotesi'))),
        h('tbody', r.esame.test.map(t => h('tr',
          h('td', h('strong', t.test)),
          h('td', { class: 'small' }, t.perche),
          h('td', { class: 'small faint' }, t.ipotesi))))))) : null,
    r.esame.test.length ? h('div', { class: 'btn-row', style: { marginTop: '10px' } },
      h('button', {
        class: 'btn btn-sm',
        onClick: () => inserisciPianoEsame(ep, r, salva)
      }, '↳ Inserisci nel piano dell’esame')) : null));

  /* Da chiarire -------------------------------------------------------- */
  if (r.daChiarire.length) {
    add(root, h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', 'Cosa chiarire per restringere il campo')),
      h('ul', { style: { paddingLeft: '18px', marginBottom: 0 } }, r.daChiarire.map(d => h('li', d)))));
  }

  /* Educazione --------------------------------------------------------- */
  if (r.educazione.length) {
    const card = h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h3', 'Note per l’educazione del paziente'),
        h('span', { class: 'spacer' }),
        h('button', {
          class: 'btn btn-sm',
          onClick: () => copiaEducazione(r)
        }, '⧉ Copia tutto')));
    for (const e of r.educazione) {
      add(card, h('details', { class: 'sec', open: true },
        h('summary', e.titolo, e.ipotesi ? h('span', { class: 'sec-count' }, e.ipotesi) : null),
        h('div', { class: 'sec-body' },
          h('ul', { style: { paddingLeft: '18px', marginBottom: 0 } }, e.punti.map(p => h('li', p))))));
    }
    add(root, card);
  }

  /* Lacune ------------------------------------------------------------- */
  if (r.lacune.length) {
    add(root, h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', 'Limiti di questa analisi')),
      h('p', { class: 'small' }, 'Dalla cartella mancano informazioni che pesano sulle conclusioni:'),
      h('ul', { class: 'small', style: { paddingLeft: '18px', marginBottom: 0 } }, r.lacune.map(l => h('li', l)))));
  }
}

function premessa() {
  return h('div', { class: 'alert info' },
    h('strong', 'Supporto al ragionamento, non una diagnosi. '),
    'I suggerimenti derivano da regole cliniche esplicite applicate a quanto hai scritto in cartella: ' +
    'ogni voce mostra le ragioni che la sostengono, così puoi valutarle e scartarle. ' +
    'Il sistema non conosce il paziente, non vede ciò che non è stato scritto e non sostituisce il tuo giudizio. ',
    h('span', { class: 'faint' }, 'L’elaborazione avviene sul tuo computer: nessun dato viene inviato altrove.'));
}

/* ------------------------------------------------------------------ */
/* Inserimento in cartella                                             */
/* ------------------------------------------------------------------ */
function percorso(ep) {
  ep.cartella ||= {};
  ep.cartella.ipotesi ||= {};
  ep.cartella.ipotesi.ragionamentoPre ||= {};
  return ep.cartella.ipotesi.ragionamentoPre;
}

function inserisciIpotesi(ep, ipotesi, salva) {
  const r = percorso(ep);
  const motivi = ipotesi.favore.map(f => '· ' + f.testo).join('\n');
  r.ipotesiPrincipale = `${ipotesi.nome}\nElementi a sostegno:\n${motivi}`;
  salva.flush?.() ?? salva();
  toast('Ipotesi inserita nella scheda «Ipotesi e ragionamento».', 'ok');
}

function aggiungiAlternativa(ep, ipotesi, salva) {
  const r = percorso(ep);
  const riga = `${ipotesi.nome} (elementi a favore: ${ipotesi.favore.length}${ipotesi.contro.length ? `, contro: ${ipotesi.contro.length}` : ''})`;
  r.ipotesiAlternative = [r.ipotesiAlternative, riga].filter(Boolean).join('\n');
  salva.flush?.() ?? salva();
  toast('Aggiunta alle ipotesi alternative.', 'ok');
}

function inserisciPianoEsame(ep, analisi, salva) {
  const r = percorso(ep);
  const testo = [
    analisi.esame.dose.livello + '.',
    ...analisi.esame.dose.indicazioni.map(i => '· ' + i),
    '',
    'Test:',
    ...analisi.esame.test.map(t => `· ${t.test} — ${t.perche}`)
  ].join('\n');
  r.pianoEsame = [r.pianoEsame, testo].filter(Boolean).join('\n\n');
  salva.flush?.() ?? salva();
  toast('Piano dell’esame inserito in cartella.', 'ok');
}

async function copiaEducazione(analisi) {
  const testo = analisi.educazione
    .map(e => e.titolo + '\n' + e.punti.map(p => '· ' + p).join('\n'))
    .join('\n\n');
  try {
    await navigator.clipboard.writeText(testo);
    toast('Note educative copiate negli appunti.', 'ok');
  } catch {
    toast('Copia non riuscita: il browser l’ha impedita. Seleziona il testo manualmente.', 'err');
  }
}
