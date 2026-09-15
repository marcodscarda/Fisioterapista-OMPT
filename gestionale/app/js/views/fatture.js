/* ============================================================
   Vista: elenco fatture ed editor del documento
   ============================================================ */
import { 
  add, h, clear, fullName, fmtDate, fmtEUR, toast, nz, todayISO, num, matches, downloadFile, toCSV, yearOf, round2
 } from '../util.js';
import { modal, conferma, tabella, badge, vuoto } from '../ui/kit.js';
import * as db from '../db.js';
import * as S from '../state.js';
import {
  calcolaTotali, statoFattura, numeroCompleto, rigaVuota, righeDaSedute,
  METODI_PAGAMENTO, calcolaScadenza
} from '../fatture.js';
import { stampaFattura, documentoFattura, anteprima, adattaAUnaPagina } from '../print.js';
import { registraIncasso } from './incassi.js';

/* ------------------------------------------------------------------ */
/* Elenco                                                              */
/* ------------------------------------------------------------------ */
export async function vistaFatture(root) {
  const [fatture, pazienti, incassi, imp] = await Promise.all([
    db.all('fatture'), S.mappaPazienti(), S.mappaIncassi(), S.imp()
  ]);
  fatture.sort((a, b) => (b.data || '').localeCompare(a.data || '') || (b.numero || 0) - (a.numero || 0));

  const anni = [...new Set(fatture.map(f => f.anno || yearOf(f.data)))].sort((a, b) => b - a);
  const stato = { anno: anni[0] || new Date().getFullYear(), q: '', filtro: 'tutte' };
  const lista = h('div', { class: 'card card-tight' });
  const riepilogo = h('div', { class: 'grid grid-4', style: { marginBottom: '16px' } });

  function calcolate() {
    return fatture.map(f => {
      const tot = calcolaTotali(f, imp);
      const st = statoFattura(f, incassi.get(f.id) || [], tot);
      return { f, tot, st, paziente: pazienti.get(f.pazienteId) };
    });
  }

  function render() {
    const tutte = calcolate();
    const filtrate = tutte
      .filter(r => stato.anno === 'tutti' || (r.f.anno || yearOf(r.f.data)) === Number(stato.anno))
      .filter(r => stato.filtro === 'tutte'
        || (stato.filtro === 'bozze' && !r.f.numero)
        || (stato.filtro === 'daincassare' && r.f.numero && ['aperta', 'parziale', 'scaduta'].includes(r.st.codice))
        || (stato.filtro === 'incassate' && r.st.codice === 'pagata'))
      .filter(r => matches(stato.q, fullName(r.paziente), numeroCompleto(r.f), r.f.note));

    const fatturato = round2(filtrate.filter(r => r.f.numero && !r.f.annullata).reduce((s, r) => s + r.tot.nettoAPagare, 0));
    const incassato = round2(filtrate.reduce((s, r) => s + r.st.incassato, 0));
    const residuo = round2(filtrate.filter(r => r.f.numero && !r.f.annullata).reduce((s, r) => s + Math.max(0, r.st.residuo), 0));

    add(clear(riepilogo), 
      box('Documenti', String(filtrate.length)),
      box('Fatturato', fmtEUR(fatturato), 'accent'),
      box('Incassato', fmtEUR(incassato), 'accent'),
      box('Da incassare', fmtEUR(residuo), residuo > 0 ? 'warn' : ''));

    clear(lista).appendChild(tabella({
      colonne: [
        { label: 'Numero', cell: (r) => h('div', h('strong', numeroCompleto(r.f)),
            r.f.annullata ? badge('annullata', 'danger') : null) },
        { label: 'Data', cell: (r) => h('span', { class: 'small' }, fmtDate(r.f.data)) },
        { label: 'Paziente', cell: (r) => h('div', fullName(r.paziente) || nz(r.f.intestatario, '—')) },
        { label: 'Totale', num: true, cell: (r) => fmtEUR(r.tot.nettoAPagare) },
        { label: 'Incassato', num: true, cell: (r) => r.st.incassato ? fmtEUR(r.st.incassato) : h('span', { class: 'faint' }, '—') },
        { label: 'Stato', cell: (r) => r.f.numero ? badge(r.st.label, r.st.kind) : badge('bozza', '') }
      ],
      righe: filtrate,
      onRowClick: (r) => S.vai('/fattura/' + r.f.id),
      vuotoTesto: 'Nessuna fattura per i filtri selezionati.'
    }));
  }

  add(clear(root), 
    h('div', { class: 'search-bar' },
      h('select', { onChange: (e) => { stato.anno = e.target.value; render(); } },
        [h('option', { value: 'tutti' }, 'Tutti gli anni'),
        ...anni.map(a => h('option', { value: a, selected: a === stato.anno }, String(a)))]),
      h('select', { onChange: (e) => { stato.filtro = e.target.value; render(); } },
        [['tutte', 'Tutte'], ['daincassare', 'Da incassare'], ['incassate', 'Incassate'], ['bozze', 'Bozze']]
          .map(([v, l]) => h('option', { value: v }, l))),
      h('input', { type: 'search', placeholder: 'Cerca per paziente o numero…', onInput: (e) => { stato.q = e.target.value; render(); } }),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-sm', onClick: () => esportaFatture(calcolate(), stato.anno) }, '⬇ CSV per il commercialista'),
      h('button', { class: 'btn btn-primary', onClick: () => scegliPaziente() }, '+ Nuova fattura')),
    riepilogo, lista);
  render();
}

const box = (l, v, cls = '') => h('div', { class: 'stat ' + cls },
  h('div', { class: 'stat-label' }, l), h('div', { class: 'stat-value' }, v));

async function scegliPaziente() {
  const pazienti = (await S.pazienti()).filter(p => !p.archiviato)
    .sort((a, b) => fullName(a).localeCompare(fullName(b), 'it'));
  if (!pazienti.length) { toast('Registra prima un paziente.', 'err'); return; }
  let scelto = '';
  modal({
    title: 'Intestatario della fattura',
    body: h('div', { class: 'field' },
      h('label', 'Paziente'),
      h('select', { onChange: (e) => { scelto = e.target.value; } },
        [h('option', { value: '' }, '— seleziona —'),
        ...pazienti.map(p => h('option', { value: p.id }, fullName(p)))])),
    actions: [
      { label: 'Annulla' },
      {
        label: 'Continua', class: 'btn-primary', keepOpen: true, onClick: (close) => {
          if (!scelto) { toast('Seleziona un paziente.', 'err'); return false; }
          close();
          S.vai('/fattura/nuova/' + scelto);
        }
      }
    ]
  });
}

function esportaFatture(righe, anno) {
  const dati = righe.filter(r => r.f.numero).map(r => ({
    numero: numeroCompleto(r.f),
    data: fmtDate(r.f.data),
    intestatario: fullName(r.paziente) || r.f.intestatario || '',
    codiceFiscale: r.paziente?.codiceFiscale || '',
    imponibile: r.tot.imponibile.toFixed(2).replace('.', ','),
    rivalsa: r.tot.rivalsa.toFixed(2).replace('.', ','),
    iva: r.tot.iva.toFixed(2).replace('.', ','),
    bollo: r.tot.bolloInTotale.toFixed(2).replace('.', ','),
    totale: r.tot.totaleDocumento.toFixed(2).replace('.', ','),
    ritenuta: r.tot.ritenuta.toFixed(2).replace('.', ','),
    netto: r.tot.nettoAPagare.toFixed(2).replace('.', ','),
    incassato: r.st.incassato.toFixed(2).replace('.', ','),
    stato: r.st.label,
    annullata: r.f.annullata ? 'SÌ' : ''
  }));
  if (!dati.length) { toast('Nessuna fattura emessa da esportare.', 'err'); return; }
  downloadFile(`fatture-${anno}.csv`, toCSV(dati, [
    { key: 'numero', label: 'Numero' }, { key: 'data', label: 'Data' }, { key: 'intestatario', label: 'Intestatario' },
    { key: 'codiceFiscale', label: 'Codice fiscale' }, { key: 'imponibile', label: 'Imponibile' },
    { key: 'rivalsa', label: 'Rivalsa INPS' }, { key: 'iva', label: 'IVA' }, { key: 'bollo', label: 'Bollo addebitato' },
    { key: 'totale', label: 'Totale documento' }, { key: 'ritenuta', label: 'Ritenuta' }, { key: 'netto', label: 'Netto a pagare' },
    { key: 'incassato', label: 'Incassato' }, { key: 'stato', label: 'Stato' }, { key: 'annullata', label: 'Annullata' }
  ]), 'text/csv');
  toast('Registro esportato.', 'ok');
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */
export async function vistaFattura(root, { id, pazienteId }) {
  const imp = await S.imp();
  let f;
  if (id === 'nuova') {
    const anno = new Date().getFullYear();
    f = {
      pazienteId, data: todayISO(), anno,
      numero: null,
      tipoDocumento: imp.tipoDocumento,
      righe: [],
      scontoImporto: 0,
      esenzioneIva: imp.esenzioneIva,
      regimeFiscale: imp.regimeFiscale,
      bolloAddebitato: imp.bolloAddebitato,
      rivalsaAttiva: imp.rivalsaInpsAttiva,
      ritenutaAttiva: imp.ritenutaAttiva,
      metodoPagamento: imp.metodoPagamentoDefault,
      scadenza: calcolaScadenza(todayISO(), imp.scadenzaGiorni),
      note: '',
      opposizioneSts: false
    };
  } else {
    f = await db.byId('fatture', id);
    if (!f) { clear(root).appendChild(h('div', { class: 'alert danger' }, 'Fattura non trovata.')); return; }
  }

  const paz = await S.paziente(f.pazienteId);
  if (paz && f.opposizioneSts == null) f.opposizioneSts = !!paz.consensi?.opposizioneSts;
  const incassi = f.id ? await S.incassiDi(f.id) : [];
  const emessa = !!f.numero;

  const pannelloTotali = h('div', { class: 'card' });
  const notaPagina = h('span', { class: 'faint small' });
  const zonaRighe = h('div');
  const zonaAnteprima = h('div');

  const salva = async ({ silenzioso = false } = {}) => {
    f = await db.put('fatture', { ...f, anno: f.anno || yearOf(f.data) });
    if (!silenzioso) toast('Fattura salvata.', 'ok');
    return f;
  };

  function aggiorna() {
    const tot = calcolaTotali(f, imp);
    const st = statoFattura(f, incassi, tot);

    const riga = (l, v, forte = false) => h('div', {
      style: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: forte ? '700' : '400' }
    }, h('span', l), h('span', { class: 'mono' }, v));

    add(clear(pannelloTotali), 
      h('div', { class: 'card-head' }, h('h3', 'Totali')),
      tot.sconto ? riga('Totale prestazioni', fmtEUR(tot.imponibileLordo)) : null,
      tot.sconto ? riga('Sconto', '− ' + fmtEUR(tot.sconto)) : null,
      riga(tot.esente ? 'Imponibile (esente IVA)' : 'Imponibile', fmtEUR(tot.imponibile)),
      tot.rivalsa ? riga(`Rivalsa INPS ${tot.rivalsaPerc}%`, fmtEUR(tot.rivalsa)) : null,
      tot.iva ? riga(`IVA ${tot.aliquotaIva}%`, fmtEUR(tot.iva)) : null,
      tot.bolloDovuto
        ? riga(tot.bolloAddebitato ? 'Bollo addebitato' : 'Bollo a tuo carico', fmtEUR(tot.bollo))
        : h('div', { class: 'faint small', style: { padding: '3px 0' } }, `Bollo non dovuto (soglia € ${tot.soglia})`),
      h('hr', { style: { margin: '8px 0' } }),
      riga('Totale documento', fmtEUR(tot.totaleDocumento), true),
      tot.ritenuta ? riga(`Ritenuta ${tot.ritenutaPerc}%`, '− ' + fmtEUR(tot.ritenuta)) : null,
      tot.ritenuta ? riga('Netto a pagare', fmtEUR(tot.nettoAPagare), true) : null,
      h('div', {
        class: 'small',
        style: { marginTop: '10px', color: tot.bolloDovuto ? 'var(--warn)' : 'var(--ok)' }
      }, tot.bolloDovuto
        ? '✉ Invio digitale non sufficiente: la marca da bollo va apposta fisicamente sull’originale consegnato al paziente.'
        : '✉ Nessun bollo dovuto: il documento può essere inviato via e-mail.'),
      emessa ? h('div', { style: { marginTop: '10px' } },
        badge(st.label, st.kind),
        st.incassato ? h('div', { class: 'small', style: { marginTop: '6px' } },
          `Incassato ${fmtEUR(st.incassato)}${st.residuo > 0 ? ` — residuo ${fmtEUR(st.residuo)}` : ''}`) : null) : null
    );

    // L'anteprima subisce lo stesso adattamento della stampa, cosi' quello che
    // si vede a schermo e' quello che esce dalla stampante.
    const docAnteprima = documentoFattura(f, paz, imp,
      { etichettaCopia: imp.copiePerFattura >= 2 ? 'Originale per il paziente' : '' });
    clear(zonaAnteprima).appendChild(anteprima(docAnteprima));
    const esito = adattaAUnaPagina(docAnteprima);
    clear(notaPagina).append(
      esito.adattato
        ? (esito.punti < 10.5
          ? `Ridotta al ${Math.round(esito.punti / 10.5 * 100)}% per entrare in una pagina.`
          : 'Entra in una pagina.')
        : 'Troppe righe per una sola pagina: verranno stampati due fogli.');
    notaPagina.className = 'faint small' + (esito.adattato ? '' : ' ');
    notaPagina.style.color = esito.adattato ? '' : 'var(--warn)';
  }

  function renderRighe() {
    clear(zonaRighe);
    const body = h('tbody');
    f.righe.forEach((r, i) => {
      const importo = h('td', { class: 'num mono' }, fmtEUR((num(r.quantita, 1)) * num(r.prezzo, 0)));
      const ricalcola = () => { importo.textContent = fmtEUR(num(r.quantita, 1) * num(r.prezzo, 0)); aggiorna(); };
      body.appendChild(h('tr',
        h('td', { style: { minWidth: '210px' } }, h('input', { type: 'text', value: r.descrizione || '', onInput: (e) => { r.descrizione = e.target.value; }, onChange: aggiorna })),
        h('td', { style: { width: '150px' } }, h('input', { type: 'text', value: r.data || '', placeholder: 'aaaa-mm-gg', onInput: (e) => { r.data = e.target.value; }, onChange: aggiorna })),
        h('td', { style: { width: '80px' } }, h('input', { type: 'number', step: '1', min: '0', value: r.quantita ?? 1, onInput: (e) => { r.quantita = num(e.target.value, 0); ricalcola(); } })),
        h('td', { style: { width: '110px' } }, h('input', { type: 'number', step: '0.01', value: r.prezzo ?? 0, onInput: (e) => { r.prezzo = num(e.target.value, 0); ricalcola(); } })),
        importo,
        h('td', { style: { width: '40px' } }, h('button', { class: 'btn btn-ghost btn-sm', onClick: () => { f.righe.splice(i, 1); renderRighe(); aggiorna(); } }, '✕'))
      ));
    });

    add(zonaRighe, 
      h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
        h('thead', h('tr', h('th', { style: { minWidth: '210px' } }, 'Descrizione'), h('th', 'Data/e'), h('th', 'Q.tà'), h('th', 'Prezzo'), h('th', { class: 'num' }, 'Importo'), h('th', ''))),
        body)),
      f.righe.length ? null : h('p', { class: 'faint small' }, 'Nessuna riga: aggiungine una dal listino o manualmente.'),
      h('div', { class: 'btn-row', style: { marginTop: '8px' } },
        h('button', { class: 'btn btn-sm', onClick: () => { f.righe.push(rigaVuota()); renderRighe(); aggiorna(); } }, '+ Riga manuale'),
        ...(imp.listino || []).map(l => h('button', {
          class: 'btn btn-sm',
          onClick: () => { f.righe.push({ descrizione: l.nome, data: '', quantita: 1, prezzo: l.prezzo }); renderRighe(); aggiorna(); }
        }, `+ ${l.nome.length > 32 ? l.nome.slice(0, 32) + '…' : l.nome}`)),
        h('button', { class: 'btn btn-sm btn-primary', onClick: () => importaSedute(f, renderRighe, aggiorna, imp) }, '+ Sedute non fatturate'))
    );
  }

  const campo = (label, el, w = 'third', hint = '') =>
    h('div', { class: 'field w-' + w }, h('label', label), el, hint ? h('span', { class: 'hint' }, hint) : null);

  const intestazione = h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('div', null,
        h('div', { class: 'faint small' }, h('a', { href: '#/paziente/' + paz?.id }, '← ' + (fullName(paz) || 'Paziente'))),
        h('h1', { class: 'mb0' }, (f.tipoDocumento || 'Fattura') + ' ' + numeroCompleto(f))),
      emessa ? h('button', {
        class: 'btn btn-sm btn-ghost', title: 'Modifica il numero del documento',
        onClick: () => modificaNumero(f, imp, salva)
      }, '✎ numero') : null,
      h('span', { class: 'spacer' }),
      emessa ? badge('emessa', 'ok') : badge('bozza', 'warn')),
    h('div', { class: 'form-grid' },
      campo('Tipo di documento', h('select', { onChange: (e) => { f.tipoDocumento = e.target.value; aggiorna(); } },
        ['Fattura', 'Ricevuta sanitaria', 'Nota di credito'].map(o => h('option', { value: o, selected: (f.tipoDocumento || 'Fattura') === o }, o)))),
      campo('Data del documento', h('input', {
        type: 'date', value: f.data, onChange: (e) => {
          f.data = e.target.value;
          f.anno = yearOf(f.data);
          f.scadenza = calcolaScadenza(f.data, imp.scadenzaGiorni);
          aggiorna();
        }
      }), 'third', emessa ? 'Attenzione: la data deve restare coerente con la numerazione progressiva.' : ''),
      campo('Scadenza del pagamento', h('input', { type: 'date', value: f.scadenza || '', onChange: (e) => { f.scadenza = e.target.value; aggiorna(); } })),
      campo('Modalità di pagamento', h('select', { onChange: (e) => { f.metodoPagamento = e.target.value; aggiorna(); } },
        ['', ...METODI_PAGAMENTO].map(o => h('option', { value: o, selected: (f.metodoPagamento || '') === o }, o || '—')))),
      campo('Sconto (€)', h('input', {
        type: 'number', step: '0.01', value: f.scontoImporto || 0,
        onInput: (e) => { f.scontoImporto = num(e.target.value, 0); aggiorna(); }
      })),
      campo('Regime', h('select', { onChange: (e) => { f.regimeFiscale = e.target.value; aggiorna(); } },
        [['forfettario', 'Forfettario'], ['ordinario', 'Ordinario']].map(([v, l]) =>
          h('option', { value: v, selected: (f.regimeFiscale || imp.regimeFiscale) === v }, l)))),
      h('div', { class: 'field w-full' },
        h('div', { class: 'check-grid' },
          checkbox('Prestazione esente IVA (art. 10 n. 18)', (f.esenzioneIva ?? imp.esenzioneIva) !== 'none',
            (v) => { f.esenzioneIva = v ? 'art10' : 'none'; aggiorna(); }),
          checkbox('Addebita l’imposta di bollo al paziente', f.bolloAddebitato ?? imp.bolloAddebitato,
            (v) => { f.bolloAddebitato = v; aggiorna(); }),
          checkbox('Applica rivalsa INPS', f.rivalsaAttiva ?? imp.rivalsaInpsAttiva,
            (v) => { f.rivalsaAttiva = v; aggiorna(); }),
          checkbox('Applica ritenuta d’acconto', f.ritenutaAttiva ?? imp.ritenutaAttiva,
            (v) => { f.ritenutaAttiva = v; aggiorna(); }),
          checkbox('Opposizione al Sistema Tessera Sanitaria', !!f.opposizioneSts,
            (v) => { f.opposizioneSts = v; aggiorna(); }))),
      h('div', { class: 'field w-full' }, h('label', 'Note da riportare in fattura'),
        h('textarea', { rows: 2, value: f.note || '', onInput: (e) => { f.note = e.target.value; }, onChange: aggiorna }))
    ));

  const azioni = h('div', { class: 'btn-row', style: { marginBottom: '16px' } },
    h('button', { class: 'btn btn-primary', onClick: async () => { await salva(); S.aggiorna(); } }, '💾 Salva'),
    !emessa ? h('button', { class: 'btn', onClick: () => emetti() }, '📌 Emetti e numera') : null,
    emessa ? h('button', { class: 'btn', onClick: () => stampaFattura(f, paz, imp) }, '🖨 Stampa') : null,
    emessa ? h('button', {
      class: 'btn', title: 'Una sola copia, con la firma, da salvare in PDF e inviare',
      onClick: () => versioneEmail(f, paz, imp)
    }, '📧 Versione per e-mail') : null,
    emessa && !f.annullata ? h('button', {
      class: 'btn', onClick: () => registraIncasso(f, imp, () => S.aggiorna())
    }, '💶 Registra incasso') : null,
    h('span', { class: 'spacer' }),
    emessa ? h('button', {
      class: 'btn btn-sm', onClick: async () => {
        if (!await conferma(f.annullata ? 'Ripristinare la fattura?' : 'Annullare la fattura? Il numero resta assegnato e non viene riutilizzato, come richiede la numerazione progressiva.',
          { title: 'Annulla fattura', okLabel: 'Conferma' })) return;
        f.annullata = !f.annullata;
        await salva({ silenzioso: true });
        S.aggiorna();
      }
    }, f.annullata ? '↺ Ripristina' : '⊘ Annulla documento') : null,
    h('button', {
      class: 'btn btn-sm btn-danger', onClick: async () => {
        if (!f.id) { S.vai('/fatture'); return; }
        if (emessa) {
          toast('Una fattura emessa non si elimina: usa “Annulla documento” per non creare salti di numerazione.', 'err');
          return;
        }
        if (!await conferma('Eliminare questa bozza?', { okLabel: 'Elimina', danger: true })) return;
        await scollegaSedute(f.id);
        await db.del('fatture', f.id);
        toast('Bozza eliminata.', 'ok');
        S.vai('/fatture');
      }
    }, '🗑'));

  async function emetti() {
    if (!f.righe.length) { toast('Aggiungi almeno una riga prima di emettere il documento.', 'err'); return; }
    const anno = yearOf(f.data);
    const prossimo = await db.anteprimaNumeroFattura(anno);
    if (!await conferma(
      h('div',
        h('p', `Assegnare il numero ${prossimo}/${anno} a questo documento?`),
        h('p', { class: 'small faint' }, 'Il numero resterà modificabile dal pulsante «✎ numero», ma la numerazione deve restare progressiva e senza salti nell’anno solare.')),
      { title: 'Emetti documento', okLabel: 'Emetti' })) return;
    f.numero = await db.prossimoNumeroFattura(anno);
    f.anno = anno;
    f.numeroCompleto = `${f.numero}/${anno}`;
    await salva({ silenzioso: true });
    toast(`Documento emesso con il numero ${f.numeroCompleto}.`, 'ok');
    S.vai('/fattura/' + f.id);
  }

  add(clear(root), 
    azioni,
    intestazione,
    h('div', { class: 'grid grid-2' },
      h('div', h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h3', 'Prestazioni')), zonaRighe)),
      h('div', pannelloTotali,
        emessa && incassi.length ? h('div', { class: 'card card-tight' },
          h('div', { class: 'card-head' }, h('h3', 'Incassi registrati')),
          tabella({
            colonne: [
              { label: 'Data', cell: (i) => fmtDate(i.data) },
              { label: 'Metodo', cell: (i) => h('span', { class: 'small' }, nz(i.metodo, '')) },
              { label: 'Importo', num: true, cell: (i) => fmtEUR(i.importo) },
              { label: '', cell: (i) => h('button', {
                  class: 'btn btn-ghost btn-sm', onClick: async () => {
                    if (!await conferma('Eliminare questo incasso?', { okLabel: 'Elimina', danger: true })) return;
                    await db.del('incassi', i.id); toast('Incasso eliminato.', 'ok'); S.aggiorna();
                  }
                }, '✕') }
            ],
            righe: incassi
          })) : null)),
    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', 'Anteprima di stampa'),
        h('span', { class: 'spacer' }),
        notaPagina,
        h('span', { class: 'faint small' }, ` · ${imp.copiePerFattura || 1} copie`)),
      zonaAnteprima)
  );

  renderRighe();
  aggiorna();
}

/**
 * Stampa una sola copia, pensata per essere salvata in PDF e inviata.
 * Se e' dovuta la marca da bollo l'invio digitale non basta: l'originale
 * cartaceo con il bollo va comunque consegnato.
 */
async function versioneEmail(f, paz, imp) {
  const tot = calcolaTotali(f, imp);
  if (!imp.firma) {
    const procedi = await conferma(
      h('div',
        h('p', 'Non hai ancora caricato la firma: il documento uscirà con la riga di firma vuota.'),
        h('p', { class: 'small faint' }, 'Puoi caricarla in Impostazioni → Studio → Firma.')),
      { title: 'Firma non impostata', okLabel: 'Stampa comunque' });
    if (!procedi) return;
  }
  if (tot.bolloDovuto) {
    const procedi = await conferma(
      h('div',
        h('p', `Il documento supera € ${tot.soglia} ed è soggetto a imposta di bollo.`),
        h('p', { class: 'small' },
          'La marca da bollo da € 2,00 va apposta fisicamente sull’originale consegnato al paziente: ' +
          'l’invio della sola copia digitale non assolve l’imposta, salvo bollo virtuale autorizzato.')),
      { title: 'Marca da bollo dovuta', okLabel: 'Ho capito, procedi' });
    if (!procedi) return;
  }
  stampaFattura(f, paz, imp, { copie: 1 });
  toast('Nella finestra di stampa scegli «Salva come PDF» per ottenere il file da allegare.');
}

/**
 * Modifica manuale del numero del documento.
 * La numerazione dovrebbe restare progressiva e priva di salti, ma la
 * responsabilita' e' di chi tiene la contabilita': il gestionale avverte e
 * impedisce solo i duplicati, che sarebbero un errore certo.
 */
async function modificaNumero(f, imp, salva) {
  const anno = f.anno || yearOf(f.data);
  const tutte = await db.byIndex('fatture', 'anno', Number(anno));
  const usati = tutte.filter(x => x.id !== f.id && x.numero).map(x => Number(x.numero)).sort((a, b) => a - b);

  let nuovo = f.numero;
  const avviso = h('div', { class: 'hint' });
  const campo = h('input', {
    type: 'number', min: '1', step: '1', value: f.numero,
    onInput: (e) => {
      nuovo = num(e.target.value, 0);
      const doppio = usati.includes(nuovo);
      avviso.textContent = doppio
        ? `Il numero ${nuovo}/${anno} è già assegnato a un altro documento.`
        : (nuovo > 0 && usati.length && nuovo > Math.max(...usati) + 1)
          ? `Attenzione: si creerebbe un salto nella numerazione (l’ultimo assegnato è ${Math.max(...usati)}).`
          : '';
      avviso.style.color = doppio ? 'var(--danger)' : 'var(--warn)';
    }
  });

  modal({
    title: 'Modifica il numero del documento',
    body: h('div',
      h('div', { class: 'alert warn' },
        'La numerazione delle fatture deve essere progressiva e senza salti nell’anno solare. ' +
        'Modificala solo per correggere un errore, non per riordinare documenti già consegnati.'),
      h('div', { class: 'form-grid' },
        h('div', { class: 'field w-half' },
          h('label', 'Numero'), campo, avviso),
        h('div', { class: 'field w-half' },
          h('label', 'Anno'),
          h('input', { type: 'text', value: anno, disabled: true }),
          h('span', { class: 'hint' }, 'Segue la data del documento.'))),
      usati.length
        ? h('p', { class: 'faint small' }, `Numeri già assegnati nel ${anno}: ${usati.join(', ')}.`)
        : h('p', { class: 'faint small' }, `Nessun altro documento numerato nel ${anno}.`)),
    actions: [
      { label: 'Annulla' },
      {
        label: 'Salva numero', class: 'btn-primary', keepOpen: true,
        onClick: async (close) => {
          if (!(nuovo > 0) || !Number.isInteger(nuovo)) { toast('Il numero deve essere un intero maggiore di zero.', 'err'); return false; }
          if (usati.includes(nuovo)) { toast(`Il numero ${nuovo}/${anno} è già assegnato.`, 'err'); return false; }
          f.numero = nuovo;
          f.numeroCompleto = `${nuovo}/${anno}`;
          await salva({ silenzioso: true });
          // Il contatore si riallinea da solo al massimo presente in archivio.
          toast(`Documento rinumerato: ${f.numeroCompleto}.`, 'ok');
          close();
          S.aggiorna();
        }
      }
    ]
  });
}

function checkbox(label, valore, onChange) {
  return h('div', { class: 'check-row' },
    h('input', { type: 'checkbox', checked: !!valore, onChange: (e) => onChange(e.target.checked) }),
    h('label', label));
}

async function scollegaSedute(fatturaId) {
  const tutte = await db.all('sedute');
  for (const s of tutte.filter(s => s.fatturaId === fatturaId)) {
    await db.put('sedute', { ...s, fatturaId: null });
  }
}

/* ------------------------------------------------------------------ */
/* Importazione delle sedute non ancora fatturate                      */
/* ------------------------------------------------------------------ */
async function importaSedute(f, renderRighe, aggiorna, imp) {
  const sedute = (await S.seduteDi(f.pazienteId))
    .filter(s => !s.fatturaId)
    .sort((a, b) => (a.data || '').localeCompare(b.data || ''));
  if (!sedute.length) { toast('Nessuna seduta da fatturare per questo paziente.'); return; }

  const scelte = new Set(sedute.map(s => s.id));
  const corpo = h('div',
    h('p', { class: 'faint small' }, 'Le sedute selezionate vengono raggruppate per prestazione e collegate alla fattura.'),
    h('div', sedute.map(s => h('div', { class: 'check-row' },
      h('input', {
        type: 'checkbox', checked: true,
        onChange: (e) => { e.target.checked ? scelte.add(s.id) : scelte.delete(s.id); }
      }),
      h('label', `${fmtDate(s.data)} — ${nz(s.prestazione, 'seduta')} — ${fmtEUR(s.importo)}`)))));

  modal({
    title: 'Sedute da fatturare',
    body: corpo,
    actions: [
      { label: 'Annulla' },
      {
        label: 'Aggiungi alla fattura', class: 'btn-primary', keepOpen: true, onClick: async (close) => {
          const selezionate = sedute.filter(s => scelte.has(s.id));
          if (!selezionate.length) { toast('Seleziona almeno una seduta.', 'err'); return false; }
          f.righe.push(...righeDaSedute(selezionate, imp.listino || []));
          const salvata = await db.put('fatture', { ...f, anno: f.anno || yearOf(f.data) });
          Object.assign(f, salvata);
          for (const s of selezionate) await db.put('sedute', { ...s, fatturaId: f.id });
          close();
          renderRighe();
          aggiorna();
          toast(`${selezionate.length} sedute collegate alla fattura.`, 'ok');
        }
      }
    ]
  });
}
