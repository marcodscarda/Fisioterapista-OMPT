/* ============================================================
   Vista: cartella clinica OMPT di un episodio di cura
   ============================================================ */
import { 
  add, h, clear, fullName, fmtDate, toast, nz, todayISO, uid, debounce, isEmptyVal, num, fmtEUR, downloadFile
 } from '../util.js';
import { modal, conferma, tabs, tabella, badge, barChart, vuoto } from '../ui/kit.js';
import { renderSezioni, haValore } from '../ui/form.js';
import { CARTELLA, SEDUTA } from '../schema/ompt.js';
import { PROMS, PROM_LIST, calcolaProm, confrontaProm, promSuggeriti } from '../schema/proms.js';
import * as db from '../db.js';
import * as S from '../state.js';
import { stampaCartella } from '../print.js';
import { vistaRagionamento } from './ragionamento.js';

export async function vistaCartella(root, { id, tab = 'soggettivo' }) {
  const ep = await db.byId('episodi', id);
  if (!ep) { clear(root).appendChild(h('div', { class: 'alert danger' }, 'Episodio non trovato.')); return; }
  const paz = await S.paziente(ep.pazienteId);
  const imp = await S.imp();
  const sedute = (await S.seduteEpisodio(id)).sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  if (!ep.cartella) ep.cartella = {};
  if (!Array.isArray(ep.proms)) ep.proms = [];

  const indicatore = h('span', { class: 'faint small' });
  const salva = debounce(async () => {
    await db.put('episodi', ep);
    indicatore.textContent = 'Salvato ' + new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, 700);
  const modificato = () => { indicatore.textContent = 'Modifiche in corso…'; salva(); };
  addEventListener('beforeunload', () => salva.flush(), { once: true });

  const testa = h('div', { class: 'card' },
    h('div', { class: 'card-head' },
      h('div', null,
        h('div', { class: 'faint small' },
          h('a', { href: '#/paziente/' + paz?.id }, '← ' + (fullName(paz) || 'Paziente'))),
        h('h1', { class: 'mb0' }, nz(ep.titolo, 'Episodio di cura')),
        h('div', { class: 'faint small' },
          [nz(ep.regione, ''), 'aperto il ' + fmtDate(ep.dataApertura),
            ep.chiuso ? 'chiuso il ' + fmtDate(ep.dataChiusura) : 'in corso'].filter(Boolean).join(' · '))),
      h('span', { class: 'spacer' }),
      indicatore,
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-sm', onClick: () => { salva.flush(); stampaCartella(ep, paz, sedute, imp, ep.proms); } }, '🖨 Stampa cartella'),
        h('button', { class: 'btn btn-sm', onClick: () => esportaEpisodio(ep, paz, sedute) }, '⬇ Esporta'),
        h('button', { class: 'btn btn-sm', onClick: () => modificaEpisodio(ep, salva) }, '✎ Dati episodio'),
        h('button', {
          class: 'btn btn-sm', onClick: async () => {
            ep.chiuso = !ep.chiuso;
            ep.dataChiusura = ep.chiuso ? todayISO() : '';
            await db.put('episodi', ep);
            toast(ep.chiuso ? 'Episodio chiuso.' : 'Episodio riaperto.', 'ok');
            S.aggiorna();
          }
        }, ep.chiuso ? '↺ Riapri' : '✓ Chiudi episodio'),
        h('button', {
          class: 'btn btn-sm btn-danger', onClick: async () => {
            if (!await conferma('Eliminare l’episodio e tutte le sedute collegate? L’operazione non è reversibile.',
              { title: 'Elimina episodio', okLabel: 'Elimina', danger: true })) return;
            for (const s of sedute) await db.del('sedute', s.id);
            await db.del('episodi', ep.id);
            toast('Episodio eliminato.', 'ok');
            S.vai('/paziente/' + ep.pazienteId);
          }
        }, '🗑'))),
    bannerAllerte(ep));

  const parti = CARTELLA.map(p => ({ key: p.key, label: p.label, badge: compilati(ep, p) }));
  const barra = tabs([...parti,
  { key: 'sedute', label: 'Sedute', badge: sedute.length },
  { key: 'proms', label: 'Questionari', badge: ep.proms.length },
  { key: 'supporto', label: '◈ Supporto' }],
    tab, (k) => S.vai(`/cartella/${id}/${k}`));

  const corpo = h('div');
  add(clear(root), testa, barra, corpo);

  const parte = CARTELLA.find(p => p.key === tab);
  if (parte) {
    if (!ep.cartella[parte.key]) ep.cartella[parte.key] = {};
    add(corpo, 
      h('div', { class: 'btn-row', style: { marginBottom: '10px' } },
        h('span', { class: 'faint small' }, 'Le modifiche vengono salvate automaticamente.'),
        h('span', { class: 'spacer' }),
        h('button', {
          class: 'btn btn-sm', onClick: (e) => {
            const aperti = corpo.querySelectorAll('details.sec[open]').length;
            corpo.querySelectorAll('details.sec').forEach(d => { d.open = aperti === 0; });
            e.target.textContent = aperti === 0 ? 'Comprimi tutto' : 'Espandi tutto';
          }
        }, 'Espandi tutto')),
      renderSezioni(parte.sections, ep.cartella[parte.key], modificato, {
        asterischi: asterischiDi(ep)
      }));
  } else if (tab === 'sedute') {
    renderSedute(corpo, ep, paz, sedute, imp);
  } else if (tab === 'supporto') {
    vistaRagionamento(corpo, ep, paz, salva);
  } else {
    renderProms(corpo, ep, modificato, salva);
  }
}

/* ------------------------------------------------------------------ */
/* Riepiloghi                                                          */
/* ------------------------------------------------------------------ */
function compilati(ep, parte) {
  let n = 0;
  for (const sez of parte.sections) {
    const v = ep.cartella?.[parte.key]?.[sez.id] || {};
    n += sez.fields.filter(f => f.t !== 'info' && !isEmptyVal(v[f.k])).length;
  }
  return n || null;
}

export function asterischiDi(ep) {
  const tab = ep.cartella?.diagnosi?.asterischi?.asterischi;
  return Array.isArray(tab) ? tab.filter(a => a.segno) : [];
}

function bannerAllerte(ep) {
  const trovate = [];
  for (const parte of CARTELLA) {
    for (const sez of parte.sections) {
      const v = ep.cartella?.[parte.key]?.[sez.id] || {};
      for (const f of sez.fields) {
        if (!f.alert) continue;
        const val = v[f.k];
        if (!haValore(val)) continue;
        trovate.push({ label: f.l, valore: Array.isArray(val) ? val.join(', ') : String(val) });
      }
    }
  }
  // Il consenso e' un requisito: segnalarlo quando manca, non quando c'e'.
  const piano = ep.cartella?.piano?.interventi || {};
  const consenso = piano.consensoInformato;
  const interventi = Array.isArray(piano.interventi) ? piano.interventi : [];
  const cartellaAvviata = CARTELLA.some(p => Object.keys(ep.cartella?.[p.key] || {}).length);
  if (cartellaAvviata && (!consenso || consenso === 'No')) {
    trovate.push({ label: 'Consenso informato', valore: 'non ancora registrato nel piano di trattamento' });
  }
  if (interventi.includes('Terapia manuale — manipolazione') && consenso !== 'Sì — scritto') {
    trovate.push({
      label: 'Consenso alle tecniche manipolative',
      valore: 'il piano prevede manipolazioni: per queste tecniche è raccomandato il consenso scritto e specifico'
    });
  }

  if (!trovate.length) return null;
  return h('div', { class: 'alert danger', style: { marginTop: '12px', marginBottom: 0 } },
    h('strong', '⚠ Elementi che richiedono attenzione'),
    h('ul', { style: { margin: '6px 0 0', paddingLeft: '20px' } },
      trovate.map(t => h('li', h('strong', t.label + ': '), t.valore))));
}

function modificaEpisodio(ep, salva) {
  modal({
    title: 'Dati dell’episodio',
    body: h('div', { class: 'form-grid' },
      h('div', { class: 'field w-full' }, h('label', 'Titolo'),
        h('input', { type: 'text', value: ep.titolo || '', onInput: (e) => { ep.titolo = e.target.value; } })),
      h('div', { class: 'field w-half' }, h('label', 'Regione corporea'),
        h('input', { type: 'text', value: ep.regione || '', onInput: (e) => { ep.regione = e.target.value; } })),
      h('div', { class: 'field w-half' }, h('label', 'Data di apertura'),
        h('input', { type: 'date', value: ep.dataApertura || '', onInput: (e) => { ep.dataApertura = e.target.value; } }))),
    actions: [{ label: 'Annulla' }, { label: 'Salva', class: 'btn-primary', onClick: () => { salva.flush(); S.aggiorna(); } }]
  });
}

function esportaEpisodio(ep, paz, sedute) {
  downloadFile(`cartella-${(paz?.cognome || 'paziente').toLowerCase()}-${ep.dataApertura || todayISO()}.json`,
    JSON.stringify({ paziente: paz, episodio: ep, sedute }, null, 2));
  toast('Cartella esportata in formato JSON.', 'ok');
}

/* ------------------------------------------------------------------ */
/* Diario delle sedute                                                 */
/* ------------------------------------------------------------------ */
function renderSedute(root, ep, paz, sedute, imp) {
  clear(root);
  add(root, 
    h('div', { class: 'btn-row', style: { marginBottom: '12px' } },
      h('span', { class: 'faint small' }, 'Ogni seduta segue la struttura SOAP e rivaluta automaticamente gli asterischi definiti nella valutazione.'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-primary', onClick: () => nuovaSeduta(ep, paz, sedute, imp) }, '+ Nuova seduta')),
    h('div', { class: 'card card-tight' }, tabella({
      colonne: [
        { label: 'N.', cell: (s) => h('strong', String(s.numero || '—')) },
        { label: 'Data', cell: (s) => h('div', fmtDate(s.data), h('div', { class: 'faint small' }, nz(s.ora, ''))) },
        { label: 'Prestazione', cell: (s) => h('span', { class: 'small' }, nz(s.prestazione, '')) },
        { label: 'Variazione', cell: (s) => {
            const v = s.dati?.soggettivoSeduta?.variazione;
            if (!v) return h('span', { class: 'faint' }, '—');
            const kind = /Molto migliorato|Migliorato/.test(v) ? 'ok' : /Peggiorato/.test(v) ? 'danger' : '';
            return badge(v, kind);
          } },
        { label: 'NPRS', num: true, cell: (s) => {
            const n = s.dati?.soggettivoSeduta?.nprs;
            return h('span', n === '' || n == null ? { class: 'faint' } : {}, n === '' || n == null ? '—' : `${n}/10`);
          } },
        { label: 'Importo', num: true, cell: (s) => s.importo ? fmtEUR(s.importo) : h('span', { class: 'faint' }, '—') },
        { label: 'Fatturata', cell: (s) => s.fatturaId ? badge('sì', 'ok') : badge('no', 'warn') }
      ],
      righe: sedute,
      onRowClick: (s) => editorSeduta(ep, paz, s, sedute, imp),
      vuotoTesto: 'Nessuna seduta registrata per questo episodio.'
    })),
    graficoNprs(sedute)
  );
}

function graficoNprs(sedute) {
  const dati = sedute
    .filter(s => s.dati?.soggettivoSeduta?.nprs != null && s.dati.soggettivoSeduta.nprs !== '')
    .map(s => ({ etichetta: fmtDate(s.data).slice(0, 5), valore: Number(s.dati.soggettivoSeduta.nprs) }));
  if (dati.length < 2) return null;
  return h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h3', 'Andamento del dolore (NPRS)')),
    barChart(dati, { formatta: (v) => String(v) }));
}

async function nuovaSeduta(ep, paz, sedute, imp) {
  const ultimo = sedute.reduce((m, s) => Math.max(m, Number(s.numero) || 0), 0);
  const prestazioneDefault = imp.listino?.[ultimo === 0 ? 0 : 1] || imp.listino?.[0];
  const s = await db.put('sedute', {
    pazienteId: ep.pazienteId,
    episodioId: ep.id,
    numero: ultimo + 1,
    data: todayISO(),
    ora: '',
    durata: prestazioneDefault?.durata || 45,
    prestazioneId: prestazioneDefault?.id || '',
    prestazione: prestazioneDefault?.nome || '',
    importo: prestazioneDefault?.prezzo ?? 0,
    dati: {}
  });
  editorSeduta(ep, paz, s, [...sedute, s], imp);
}

function editorSeduta(ep, paz, seduta, sedute, imp) {
  const s = { ...seduta, dati: { ...(seduta.dati || {}) } };
  const salva = debounce(async () => { await db.put('sedute', s); stato.textContent = 'Salvato'; }, 600);
  const stato = h('span', { class: 'faint small' });
  const tocca = () => { stato.textContent = 'Modifiche in corso…'; salva(); };

  const listino = imp.listino || [];
  const campoImporto = h('input', {
    type: 'number', step: '0.01', value: s.importo ?? 0,
    onInput: (e) => { s.importo = num(e.target.value); tocca(); }
  });
  const intestazione = h('div', { class: 'form-grid' },
    h('div', { class: 'field w-quarter' }, h('label', 'Numero'),
      h('input', { type: 'number', value: s.numero || '', onInput: (e) => { s.numero = num(e.target.value); tocca(); } })),
    h('div', { class: 'field w-quarter' }, h('label', 'Data'),
      h('input', { type: 'date', value: s.data || '', onInput: (e) => { s.data = e.target.value; tocca(); } })),
    h('div', { class: 'field w-quarter' }, h('label', 'Ora'),
      h('input', { type: 'time', value: s.ora || '', onInput: (e) => { s.ora = e.target.value; tocca(); } })),
    h('div', { class: 'field w-quarter' }, h('label', 'Durata (min)'),
      h('input', { type: 'number', value: s.durata || '', onInput: (e) => { s.durata = num(e.target.value); tocca(); } })),
    h('div', { class: 'field w-two-thirds' }, h('label', 'Prestazione'),
      h('select', {
        onChange: (e) => {
          const voce = listino.find(l => l.id === e.target.value);
          s.prestazioneId = e.target.value;
          s.prestazione = voce?.nome || '';
          if (voce) { s.importo = voce.prezzo; campoImporto.value = voce.prezzo; }
          tocca();
        }
      }, [h('option', { value: '' }, '— nessuna —'),
      ...listino.map(l => h('option', { value: l.id, selected: l.id === s.prestazioneId }, `${l.nome} — € ${l.prezzo}`))])),
    h('div', { class: 'field w-third' }, h('label', 'Importo (€)'), campoImporto)
  );

  const corpo = h('div',
    h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, h('span', { class: 'spacer' }), stato),
    intestazione,
    s.fatturaId ? h('div', { class: 'alert info' }, 'Seduta già inclusa in una fattura.') : null,
    renderSezioni(SEDUTA, s.dati, tocca, { asterischi: asterischiDi(ep), apriTutto: true }));

  modal({
    title: `Seduta n. ${s.numero || ''} — ${fullName(paz)}`,
    size: 'lg',
    body: corpo,
    onClose: () => { salva.flush(); S.aggiorna(); },
    actions: [
      {
        label: '🗑 Elimina', class: 'btn-danger', keepOpen: true, onClick: async (close) => {
          if (s.fatturaId) { toast('La seduta è collegata a una fattura: scollegala prima di eliminarla.', 'err'); return false; }
          if (!await conferma('Eliminare questa seduta?', { title: 'Elimina seduta', okLabel: 'Elimina', danger: true })) return false;
          salva.cancel();
          await db.del('sedute', s.id);
          toast('Seduta eliminata.', 'ok');
          close();
          S.aggiorna();
        }
      },
      { label: 'Chiudi', class: 'btn-primary' }
    ]
  });
}

/* ------------------------------------------------------------------ */
/* PROM                                                                */
/* ------------------------------------------------------------------ */
function renderProms(root, ep, modificato, salva) {
  clear(root);
  const suggeriti = promSuggeriti(ep.regione || ep.titolo);

  const perProm = new Map();
  for (const c of ep.proms) {
    if (!perProm.has(c.promId)) perProm.set(c.promId, []);
    perProm.get(c.promId).push(c);
  }
  for (const arr of perProm.values()) arr.sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  add(root, h('div', { class: 'btn-row', style: { marginBottom: '12px' } },
    h('span', { class: 'faint small' }, 'Suggeriti per questa regione: ' + suggeriti.map(k => PROMS[k].breve).join(', ')),
    h('span', { class: 'spacer' }),
    h('button', { class: 'btn btn-primary', onClick: () => scegliProm(ep, suggeriti, modificato, salva) }, '+ Compila questionario')));

  if (!ep.proms.length) {
    root.appendChild(h('div', { class: 'card' }, vuoto('Nessun questionario compilato. I PROM documentano l’esito dal punto di vista del paziente e servono a verificare il superamento della differenza minima clinicamente importante (MCID).')));
    return;
  }

  for (const [promId, compilazioni] of perProm) {
    const def = PROMS[promId];
    const primo = calcolaProm(promId, compilazioni[0].valori)?.punteggio;
    const ultimo = calcolaProm(promId, compilazioni.at(-1).valori)?.punteggio;
    const conf = confrontaProm(promId, primo, ultimo);

    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h3', def?.nome || promId),
        h('span', { class: 'spacer' }),
        conf && compilazioni.length > 1
          ? badge(
            `${conf.miglioramento >= 0 ? 'Miglioramento' : 'Peggioramento'} di ${Math.abs(conf.miglioramento)} punti` +
            (conf.superaMcid ? ' — supera l’MCID' : def?.mcid != null ? ` — MCID ${def.mcid}` : ''),
            conf.superaMcid ? 'ok' : conf.peggiorato ? 'danger' : 'warn')
          : null),
      def?.mcidNota ? h('p', { class: 'faint small' }, def.mcidNota) : null,
      tabella({
        colonne: [
          { label: 'Data', cell: (c) => fmtDate(c.data) },
          { label: 'Punteggio', cell: (c) => { const r = calcolaProm(c.promId, c.valori); return r ? r.etichetta : h('span', { class: 'faint' }, 'incompleto'); } },
          { label: 'Note', cell: (c) => h('span', { class: 'small faint' }, nz(c.note, '')) },
          {
            label: '', cell: (c) => h('div', { class: 'btn-row' },
              h('button', { class: 'btn btn-sm', onClick: () => compilaProm(ep, c.promId, c, modificato, salva) }, '✎'),
              h('button', {
                class: 'btn btn-sm btn-danger', onClick: async () => {
                  if (!await conferma('Eliminare questa compilazione?', { okLabel: 'Elimina', danger: true })) return;
                  ep.proms = ep.proms.filter(x => x.id !== c.id);
                  salva.flush(); S.aggiorna();
                }
              }, '✕'))
          }
        ],
        righe: compilazioni
      }),
      compilazioni.length > 1
        ? barChart(compilazioni.map(c => ({
          etichetta: fmtDate(c.data).slice(0, 5),
          valore: calcolaProm(c.promId, c.valori)?.punteggio ?? 0
        })), { formatta: (v) => String(v) })
        : null
    ));
  }
}

function scegliProm(ep, suggeriti, modificato, salva) {
  modal({
    title: 'Scegli il questionario',
    body: h('div',
      h('h4', 'Suggeriti'),
      h('div', { class: 'btn-row', style: { marginBottom: '14px' } },
        suggeriti.map(k => h('button', { class: 'btn btn-primary btn-sm', onClick: () => { chiudiModale(); compilaProm(ep, k, null, modificato, salva); } }, PROMS[k].breve))),
      h('h4', 'Tutti i questionari'),
      h('div', { class: 'btn-row' },
        PROM_LIST.map(d => h('button', { class: 'btn btn-sm', onClick: () => { chiudiModale(); compilaProm(ep, d.id, null, modificato, salva); } }, d.breve)))),
    actions: [{ label: 'Annulla' }]
  });
}
const chiudiModale = () => document.querySelector('.modal-head .btn-ghost')?.click();

function compilaProm(ep, promId, esistente, modificato, salva) {
  const def = PROMS[promId];
  if (!def) return;
  const c = esistente
    ? { ...esistente, valori: { ...esistente.valori } }
    : { id: uid(), promId, data: todayISO(), valori: {}, note: '' };

  const risultato = h('div', { class: 'alert info', style: { position: 'sticky', bottom: 0 } });
  const aggiorna = () => {
    const r = calcolaProm(promId, c.valori);
    clear(risultato);
    add(risultato, h('strong', 'Punteggio: '), r ? r.etichetta : 'compilare tutti gli item richiesti');
  };

  const corpo = h('div');
  add(corpo, 
    h('p', { class: 'faint small' }, def.descrizione + (def.itemHint ? ' — ' + def.itemHint : '')),
    h('div', { class: 'form-grid' },
      h('div', { class: 'field w-half' }, h('label', 'Data di compilazione'),
        h('input', { type: 'date', value: c.data, onInput: (e) => { c.data = e.target.value; } }))));

  const lista = h('div');
  for (const it of def.items) {
    if (it.libera) {
      // PSFS: attivita' descritta dal paziente + punteggio
      lista.appendChild(h('div', { class: 'form-grid', style: { alignItems: 'end' } },
        h('div', { class: 'field w-two-thirds' }, h('label', it.l),
          h('input', {
            type: 'text', placeholder: 'Attività indicata dal paziente', value: c.valori[it.k] || '',
            onInput: (e) => { c.valori[it.k] = e.target.value; }
          })),
        h('div', { class: 'field w-third' }, h('label', 'Punteggio 0–10'),
          h('select', {
            onChange: (e) => { c.valori[it.k + '_val'] = e.target.value; aggiorna(); }
          }, ['', ...Array.from({ length: 11 }, (_, i) => String(i))].map(o =>
            h('option', { value: o, selected: String(c.valori[it.k + '_val'] ?? '') === o }, o || '—'))))));
      continue;
    }
    const opts = it.opts || def.itemOpts || ['0', '1', '2', '3', '4', '5'];
    lista.appendChild(h('div', { class: 'form-grid', style: { alignItems: 'center' } },
      h('div', { class: 'field w-two-thirds', style: { marginBottom: '6px' } }, h('span', { class: 'small' }, it.l)),
      h('div', { class: 'field w-third', style: { marginBottom: '6px' } },
        h('select', {
          onChange: (e) => { c.valori[it.k] = e.target.value; aggiorna(); }
        }, ['', ...opts].map(o => h('option', { value: o, selected: String(c.valori[it.k] ?? '') === o }, o || '—'))))));
  }
  add(corpo, lista,
    h('div', { class: 'field' }, h('label', 'Note'),
      h('textarea', { rows: 2, value: c.note || '', onInput: (e) => { c.note = e.target.value; } })),
    risultato);
  aggiorna();

  modal({
    title: def.nome,
    size: 'lg',
    body: corpo,
    actions: [
      { label: 'Annulla' },
      {
        label: 'Salva', class: 'btn-primary', onClick: () => {
          const i = ep.proms.findIndex(x => x.id === c.id);
          if (i >= 0) ep.proms[i] = c; else ep.proms.push(c);
          salva.flush();
          toast('Questionario salvato.', 'ok');
          S.aggiorna();
        }
      }
    ]
  });
}
