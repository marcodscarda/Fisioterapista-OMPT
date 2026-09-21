/* ============================================================
   Ricerca globale
   ------------------------------------------------------------
   Una sola casella per pazienti, episodi, fatture ed esercizi:
   senza, bisogna sapere in quale sezione guardare prima ancora
   di sapere che cosa si sta cercando.

   Si apre con Ctrl/Cmd+K oppure dalla lente nella barra in alto.
   ============================================================ */
import { add, h, clear, fullName, fmtDate, fmtEUR, nz, matches } from '../util.js';
import { modal, badge, vuoto } from '../ui/kit.js';
import { numeroCompleto } from '../fatture.js';
import { doseInRiga } from '../schema/esercizi.js';
import * as db from '../db.js';
import * as S from '../state.js';

/** Raccoglie in una sola lista tutto cio' che vale la pena cercare. */
async function indice() {
  const [pazienti, episodi, fatture, esercizi] = await Promise.all([
    db.all('pazienti'), db.all('episodi'), db.all('fatture'), db.all('esercizi')
  ]);
  const perPaziente = new Map(pazienti.map(p => [p.id, p]));
  const voci = [];

  for (const p of pazienti) {
    voci.push({
      tipo: 'Paziente', icona: '👤', titolo: fullName(p),
      sotto: [p.codiceFiscale, p.telefono, p.citta].filter(Boolean).join(' · '),
      cerca: [fullName(p), p.codiceFiscale, p.telefono, p.email, p.citta, p.note].filter(Boolean),
      rotta: '/paziente/' + p.id,
      spento: !!p.archiviato
    });
  }
  for (const e of episodi) {
    const p = perPaziente.get(e.pazienteId);
    voci.push({
      tipo: 'Episodio', icona: '📋', titolo: nz(e.titolo, 'Episodio di cura'),
      sotto: [fullName(p), e.regione, e.dataApertura ? 'dal ' + fmtDate(e.dataApertura) : ''].filter(Boolean).join(' · '),
      cerca: [e.titolo, e.regione, fullName(p), e.cartella?.diagnosi?.diagnosi?.diagnosiFt].filter(Boolean),
      rotta: '/cartella/' + e.id,
      spento: !!e.chiuso
    });
  }
  for (const f of fatture) {
    const p = perPaziente.get(f.pazienteId);
    voci.push({
      tipo: 'Fattura', icona: '🧾', titolo: numeroCompleto(f),
      sotto: [fullName(p) || f.intestatario, fmtDate(f.data)].filter(Boolean).join(' · '),
      cerca: [numeroCompleto(f), fullName(p), f.intestatario, f.note,
        ...(f.righe || []).map(r => r.descrizione)].filter(Boolean),
      rotta: '/fattura/' + f.id,
      spento: !!f.annullata
    });
  }
  for (const x of esercizi) {
    voci.push({
      tipo: 'Esercizio', icona: '🏃', titolo: x.nome,
      sotto: [x.regione, x.categoria, doseInRiga(x.dose)].filter(Boolean).join(' · '),
      cerca: [x.nome, x.obiettivo, x.regione, x.categoria, x.esecuzione,
        (x.attrezzatura || []).join(' ')].filter(Boolean),
      rotta: '/esercizi/' + x.id
    });
  }
  return voci;
}

/** L'ordine conta piu' del numero dei risultati: prima chi inizia con il testo cercato. */
function ordina(voci, q) {
  const t = q.toLowerCase().trim();
  const peso = (v) => {
    const titolo = (v.titolo || '').toLowerCase();
    if (titolo.startsWith(t)) return 0;
    if (titolo.includes(t)) return 1;
    return 2;
  };
  return voci.slice().sort((a, b) => peso(a) - peso(b)
    || (a.spento ? 1 : 0) - (b.spento ? 1 : 0)
    || (a.titolo || '').localeCompare(b.titolo || '', 'it'));
}

export async function apriRicerca(testoIniziale = '') {
  const voci = await indice();
  const risultati = h('div', { class: 'ric-risultati' });
  let correnti = [];
  let evidenziato = 0;

  const disegna = (q) => {
    clear(risultati);
    if (!q.trim()) {
      correnti = [];
      add(risultati, h('p', { class: 'faint small', style: { padding: '12px' } },
        `Cerca fra ${voci.length} voci: pazienti, episodi di cura, fatture ed esercizi.`));
      return;
    }
    correnti = ordina(voci.filter(v => matches(q, ...v.cerca)), q).slice(0, 25);
    evidenziato = 0;
    if (!correnti.length) { add(risultati, vuoto('Nessun risultato per «' + q + '».')); return; }
    correnti.forEach((v, i) => {
      add(risultati, h('button', {
        type: 'button',
        class: 'ric-voce' + (v.spento ? ' spento' : '') + (i === evidenziato ? ' attiva' : ''),
        'data-i': String(i),
        onClick: () => vaiA(v)
      },
        h('span', { class: 'ric-icona' }, v.icona),
        h('span', { class: 'ric-testo' },
          h('strong', v.titolo),
          v.sotto ? h('span', { class: 'faint small' }, v.sotto) : null),
        badge(v.tipo)));
    });
  };

  let chiudi = () => {};
  const vaiA = (v) => { chiudi(); S.vai(v.rotta); };

  const muovi = (delta) => {
    if (!correnti.length) return;
    evidenziato = (evidenziato + delta + correnti.length) % correnti.length;
    risultati.querySelectorAll('.ric-voce').forEach((el, i) => {
      el.classList.toggle('attiva', i === evidenziato);
      if (i === evidenziato) el.scrollIntoView({ block: 'nearest' });
    });
  };

  const casella = h('input', {
    type: 'search', class: 'ric-input', placeholder: 'Cerca un paziente, una fattura, un esercizio…',
    value: testoIniziale, autofocus: true,
    onInput: (ev) => disegna(ev.target.value),
    onKeydown: (ev) => {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); muovi(1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); muovi(-1); }
      else if (ev.key === 'Enter' && correnti[evidenziato]) { ev.preventDefault(); vaiA(correnti[evidenziato]); }
    }
  });

  const finestra = modal({
    title: 'Cerca',
    size: 'lg',
    body: h('div', casella, risultati),
    actions: [{ label: 'Chiudi' }]
  });
  chiudi = () => finestra?.close?.();

  disegna(testoIniziale);
  setTimeout(() => casella.focus(), 30);
}

/** Scorciatoia da tastiera e pulsante nella barra in alto. */
export function attivaRicerca() {
  addEventListener('keydown', (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      apriRicerca();
    }
  });
  document.getElementById('btnCerca')?.addEventListener('click', () => apriRicerca());
}
