/* ============================================================
   Vista: importazione di dati da un altro gestionale
   ============================================================ */
import {
  add, h, clear, toast, pickFile, readFileText, fmtEUR, fmtDate, nz, fullName
} from '../util.js';
import { conferma, tabella, badge, vuoto } from '../ui/kit.js';
import { leggiTabella, rilevaSeparatore } from '../importa/csv.js';
import { TRACCIATI, TRASFORMA, riconosciTracciato, mappaturaProposta } from '../importa/zoho.js';
import { ESEGUI } from '../importa/esegui.js';
import * as S from '../state.js';

export async function vistaImporta(root) {
  const imp = await S.imp();
  const stato = {
    nomeFile: '', testo: '', separatore: '', intestazioni: [], dati: [],
    tipo: '', mappa: {}, opzioni: { aggiornaEsistenti: false, numerazione: 'storico', creaPazienti: true }
  };

  const zonaFile = h('div', { class: 'card' });
  const zonaMappa = h('div');
  const zonaAnteprima = h('div');
  const zonaEsito = h('div');

  /* -------------------------------------------------------------- */
  function renderScelta() {
    clear(zonaFile).append(
      h('div', { class: 'card-head' }, h('h2', '1. Scegli il file')),
      h('p', { class: 'faint small' },
        'In Zoho Invoice: menu ⋮ accanto a Contatti, Fatture o Pagamenti ricevuti → ' +
        '«Esporta» → formato CSV. Importa un file alla volta, nell’ordine: prima i contatti, poi le fatture, infine i pagamenti.'),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-primary', onClick: scegliFile }, '📄 Apri un file CSV'),
        stato.nomeFile ? h('span', { class: 'faint small' },
          `${stato.nomeFile} — ${stato.dati.length} righe, separatore «${stato.separatore === '\t' ? 'tabulazione' : stato.separatore}»`) : null));
  }

  async function scegliFile() {
    const file = await pickFile('.csv,text/csv,text/plain');
    if (!file) return;
    try {
      const testo = await readFileText(file);
      const separatore = rilevaSeparatore(testo);
      const { intestazioni, dati } = leggiTabella(testo, separatore);
      if (!dati.length) { toast('Il file non contiene righe di dati.', 'err'); return; }
      Object.assign(stato, { nomeFile: file.name, testo, separatore, intestazioni, dati });
      stato.tipo = riconosciTracciato(intestazioni) || '';
      stato.mappa = stato.tipo ? mappaturaProposta(stato.tipo, intestazioni) : {};
      renderScelta();
      renderMappa();
      renderAnteprima();
      clear(zonaEsito);
      toast(stato.tipo ? `Riconosciuto: ${TRACCIATI[stato.tipo].nome}.` : 'Tracciato non riconosciuto: scegli tu il tipo.',
        stato.tipo ? 'ok' : '');
    } catch (e) {
      toast('Lettura non riuscita: ' + e.message, 'err');
    }
  }

  /* -------------------------------------------------------------- */
  function renderMappa() {
    clear(zonaMappa);
    if (!stato.dati.length) return;
    const def = TRACCIATI[stato.tipo];

    const selettoreTipo = h('select', {
      onChange: (e) => {
        stato.tipo = e.target.value;
        stato.mappa = stato.tipo ? mappaturaProposta(stato.tipo, stato.intestazioni) : {};
        renderMappa(); renderAnteprima();
      }
    }, [h('option', { value: '' }, '— scegli —'),
    ...Object.entries(TRACCIATI).map(([k, v]) => h('option', { value: k, selected: k === stato.tipo }, v.nome))]);

    const corpo = h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', '2. Che cosa contiene e come si legge')),
      h('div', { class: 'field', style: { maxWidth: '360px' } }, h('label', 'Tipo di file'), selettoreTipo),
      def ? h('p', { class: 'faint small' }, def.descrizione) : null);

    if (def) {
      const righe = def.campi.map(campo => h('tr',
        h('td', h('strong', campo.l), campo.obbligatorio ? h('span', { style: { color: 'var(--danger)' } }, ' *') : null),
        h('td', h('select', {
          onChange: (e) => { stato.mappa[campo.k] = e.target.value; renderAnteprima(); }
        }, [h('option', { value: '' }, '— non importare —'),
        ...stato.intestazioni.map(i => h('option', { value: i, selected: stato.mappa[campo.k] === i }, i))])),
        h('td', { class: 'small faint' }, esempio(campo.k))));

      add(corpo,
        h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
          h('thead', h('tr', h('th', 'Campo del gestionale'), h('th', 'Colonna del file'), h('th', 'Esempio dal file'))),
          h('tbody', righe))),
        h('p', { class: 'faint small', style: { marginTop: '8px' } },
          'I campi con * sono necessari. La corrispondenza è proposta in automatico dalle intestazioni: correggila se qualcosa non torna.'));
    }
    zonaMappa.appendChild(corpo);
  }

  const esempio = (k) => {
    const colonna = stato.mappa[k];
    if (!colonna) return '';
    const v = stato.dati.find(r => String(r[colonna] ?? '').trim())?.[colonna];
    return v ? (String(v).length > 40 ? String(v).slice(0, 40) + '…' : String(v)) : '(vuota)';
  };

  /* -------------------------------------------------------------- */
  function renderAnteprima() {
    clear(zonaAnteprima);
    if (!stato.tipo || !stato.dati.length) return;
    const def = TRACCIATI[stato.tipo];
    const mancanti = def.campi.filter(c => c.obbligatorio && !stato.mappa[c.k]);

    let trasformati = [];
    let errore = '';
    try { trasformati = TRASFORMA[stato.tipo](stato.dati, stato.mappa); }
    catch (e) { errore = e.message; }

    const corpo = h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h2', '3. Controlla il risultato'),
        h('span', { class: 'spacer' }),
        badge(`${trasformati.length} elementi`, trasformati.length ? 'accent' : 'warn')));

    if (mancanti.length) {
      add(corpo, h('div', { class: 'alert danger' },
        'Mancano colonne necessarie: ' + mancanti.map(c => c.l).join(', ') + '.'));
    }
    if (errore) add(corpo, h('div', { class: 'alert danger' }, 'Errore nella lettura: ' + errore));

    if (trasformati.length) {
      add(corpo, anteprimaPer(stato.tipo, trasformati));
      add(corpo, opzioniPer(stato.tipo, stato.opzioni));
      add(corpo, h('div', { class: 'btn-row', style: { marginTop: '12px' } },
        h('button', {
          class: 'btn btn-primary',
          disabled: mancanti.length > 0,
          onClick: () => esegui(trasformati)
        }, `⬆ Importa ${trasformati.length} elementi`)));
    } else if (!errore && !mancanti.length) {
      add(corpo, vuoto('Nessun elemento utilizzabile con questa corrispondenza di colonne.'));
    }
    zonaAnteprima.appendChild(corpo);
  }

  const anteprimaPer = (tipo, elenco) => {
    const primi = elenco.slice(0, 8);
    if (tipo === 'contatti') {
      return tabella({
        colonne: [
          { label: 'Cognome e nome', cell: (c) => h('strong', [c.cognome, c.nome].filter(Boolean).join(' ')) },
          {
            label: 'Codice fiscale', cell: (c) => c.cfDaVerificare
              ? h('span', h('span', { class: 'small mono' }, c.codiceFiscale), ' ', badge('da verificare', 'warn'))
              : h('span', { class: 'small mono' }, nz(c.codiceFiscale, ''))
          },
          { label: 'Contatti', cell: (c) => h('span', { class: 'small' }, [c.telefono, c.email].filter(Boolean).join(' · ')) },
          { label: 'Città', cell: (c) => h('span', { class: 'small' }, nz(c.citta, '')) }
        ], righe: primi
      });
    }
    if (tipo === 'fatture') {
      return tabella({
        colonne: [
          { label: 'Numero', cell: (f) => h('strong', f.numeroOriginale) },
          { label: 'Data', cell: (f) => f.data ? fmtDate(f.data) : badge('data non letta', 'danger') },
          { label: 'Intestatario', cell: (f) => f.cliente },
          { label: 'Voci', num: true, cell: (f) => String(f.righe.length) },
          { label: 'Totale', num: true, cell: (f) => fmtEUR(f.sommaRighe) },
          {
            label: 'Scarto', num: true, cell: (f) => f.scarto
              ? badge(fmtEUR(f.scarto), 'warn') : h('span', { class: 'faint' }, '—')
          }
        ], righe: primi
      });
    }
    return tabella({
      colonne: [
        { label: 'Data', cell: (i) => i.data ? fmtDate(i.data) : badge('non letta', 'danger') },
        { label: 'Fattura', cell: (i) => i.numeroFattura },
        { label: 'Intestatario', cell: (i) => h('span', { class: 'small' }, nz(i.cliente, '')) },
        { label: 'Metodo', cell: (i) => h('span', { class: 'small' }, nz(i.metodo, '')) },
        { label: 'Importo', num: true, cell: (i) => fmtEUR(i.importo) }
      ], righe: primi
    });
  };

  const opzioniPer = (tipo, o) => {
    const riga = (etichetta, controllo, aiuto) => h('div', { class: 'field' },
      h('div', { class: 'check-row' }, controllo, h('label', etichetta)),
      aiuto ? h('span', { class: 'hint' }, aiuto) : null);

    if (tipo === 'contatti') {
      return h('div', { style: { marginTop: '12px' } },
        riga('Completa i pazienti già presenti con i dati mancanti',
          h('input', { type: 'checkbox', checked: o.aggiornaEsistenti, onChange: (e) => { o.aggiornaEsistenti = e.target.checked; } }),
          'I campi già compilati nel gestionale non vengono mai sovrascritti. Se lasci deselezionato, i pazienti esistenti vengono semplicemente saltati.'));
    }
    if (tipo === 'fatture') {
      return h('div', { style: { marginTop: '12px' } },
        h('div', { class: 'field', style: { maxWidth: '460px' } },
          h('label', 'Numerazione'),
          h('select', { onChange: (e) => { o.numerazione = e.target.value; } },
            [h('option', { value: 'storico', selected: o.numerazione === 'storico' }, 'Archivio storico — conserva i numeri di origine'),
            h('option', { value: 'continua', selected: o.numerazione === 'continua' }, 'Prosegui la stessa serie — il gestionale riparte dall’ultimo numero')]),
          h('span', { class: 'hint' },
            'Con «archivio storico» i documenti importati conservano il numero che avevano e non influenzano il progressivo del gestionale, ' +
            'che ripartirà da 1. Scegli «prosegui» se vuoi che la numerazione continui senza interruzioni.')),
        riga('Crea i pazienti mancanti dall’intestatario della fattura',
          h('input', { type: 'checkbox', checked: o.creaPazienti, onChange: (e) => { o.creaPazienti = e.target.checked; } }),
          'Utile se importi le fatture senza aver prima importato i contatti.'));
    }
    return h('p', { class: 'faint small', style: { marginTop: '12px' } },
      'Gli incassi vengono collegati alle fatture tramite il numero del documento: importa prima le fatture.');
  };

  /* -------------------------------------------------------------- */
  async function esegui(trasformati) {
    const ok = await conferma(
      h('div',
        h('p', `Importare ${trasformati.length} elementi da «${stato.nomeFile}»?`),
        h('p', { class: 'small faint' },
          'L’operazione è ripetibile: gli elementi già presenti vengono riconosciuti e saltati. ' +
          'Se qualcosa non torna puoi comunque ripristinare il backup.')),
      { title: 'Conferma importazione', okLabel: 'Importa' });
    if (!ok) return;

    try {
      const esito = await ESEGUI[stato.tipo](trasformati, ...(stato.tipo === 'fatture' ? [imp, stato.opzioni] : [stato.opzioni]));
      renderEsito(esito);
      toast('Importazione completata.', 'ok');
    } catch (e) {
      console.error(e);
      renderEsito({ avvisi: ['Importazione interrotta: ' + e.message] });
      toast('Importazione non riuscita: ' + e.message, 'err');
    }
  }

  function renderEsito(esito) {
    const numeri = Object.entries(esito)
      .filter(([k, v]) => typeof v === 'number' && v > 0)
      .map(([k, v]) => `${v} ${ETICHETTE_ESITO[k] || k}`);
    clear(zonaEsito).append(h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', '4. Esito')),
      numeri.length
        ? h('div', { class: 'alert ok' }, numeri.join(' · '))
        : h('div', { class: 'alert warn' }, 'Nessun elemento importato.'),
      esito.avvisi?.length
        ? h('details', { class: 'sec', open: esito.avvisi.length <= 5 },
          h('summary', `Avvisi (${esito.avvisi.length})`),
          h('div', { class: 'sec-body' },
            h('ul', { class: 'small', style: { paddingLeft: '18px' } }, esito.avvisi.slice(0, 50).map(a => h('li', a))),
            esito.avvisi.length > 50 ? h('p', { class: 'faint small' }, `…e altri ${esito.avvisi.length - 50}.`) : null))
        : null,
      h('div', { class: 'btn-row' },
        h('a', { class: 'btn', href: '#/pazienti' }, 'Vai ai pazienti'),
        h('a', { class: 'btn', href: '#/fatture' }, 'Vai alle fatture'),
        h('a', { class: 'btn', href: '#/incassi' }, 'Vai agli incassi'))));
    zonaEsito.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const ETICHETTE_ESITO = {
    creati: 'creati', create: 'fatture create', aggiornati: 'aggiornati',
    saltati: 'già presenti, saltati', saltate: 'già presenti, saltate',
    pazientiCreati: 'pazienti creati dall’intestatario', senzaFattura: 'senza fattura corrispondente'
  };

  /* -------------------------------------------------------------- */
  add(clear(root),
    h('div', { class: 'alert info' },
      h('strong', 'Importazione da un altro gestionale. '),
      'Funziona con gli export CSV di Zoho Invoice e, grazie alla corrispondenza modificabile delle colonne, ' +
      'anche con quelli di altri programmi. Prima di iniziare conviene scaricare un backup: ',
      h('a', { href: '#/impostazioni/dati' }, 'Impostazioni → Dati e backup'), '.'),
    zonaFile, zonaMappa, zonaAnteprima, zonaEsito);
  renderScelta();
}
