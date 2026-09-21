/* ============================================================
   Vista: impostazioni dello studio, listino e backup
   ============================================================ */
import {
  add, h, clear, toast, num, uid, downloadFile, pickFile, readFileText, validaPIVA, validaCF, validaIBAN, fmtEUR, fmtDate
} from '../util.js';
import { modal, conferma, tabs, badge } from '../ui/kit.js';
import * as db from '../db.js';
import * as S from '../state.js';
import { backupDisponibile, salvaSuDisco, ultimoBackupAutomatico } from '../backup.js';
import { stampaModulo } from '../print.js';
import { caricaImmagine } from '../ui/immagini.js';
import { ETICHETTE } from '../calendario.js';

export async function vistaImpostazioni(root, { tab = 'studio' } = {}) {
  const imp = { ...(await S.imp()), listino: [...(await S.imp()).listino.map(l => ({ ...l }))] };

  const salva = async () => {
    const piva = validaPIVA(imp.partitaIva);
    if (!piva.ok) { toast('Partita IVA: ' + piva.msg, 'err'); return; }
    const cf = validaCF(imp.codiceFiscale);
    if (!cf.ok && String(imp.codiceFiscale || '').length === 16) { toast('Codice fiscale: ' + cf.msg, 'err'); return; }
    const iban = validaIBAN(imp.iban);
    if (!iban.ok) { toast('IBAN: ' + iban.msg, 'err'); return; }
    await S.salvaImp(imp);
    toast('Impostazioni salvate.', 'ok');
    S.aggiorna();
  };

  const campo = (k, label, { type = 'text', w = 'third', hint = '', opts = null, step = null } = {}) => {
    const el = opts
      ? h('select', { onChange: (e) => { imp[k] = e.target.value; } },
        opts.map(([v, l]) => h('option', { value: v, selected: String(imp[k] ?? '') === String(v) }, l)))
      : h('input', {
        type, step: step || (type === 'number' ? 'any' : null), value: imp[k] ?? '',
        onInput: (e) => { imp[k] = type === 'number' ? num(e.target.value, 0) : e.target.value; }
      });
    return h('div', { class: 'field w-' + w }, h('label', label), el, hint ? h('span', { class: 'hint' }, hint) : null);
  };

  const flag = (k, label, hint = '') => h('div', { class: 'field w-half' },
    h('div', { class: 'check-row' },
      h('input', { type: 'checkbox', checked: !!imp[k], onChange: (e) => { imp[k] = e.target.checked; } }),
      h('label', label)),
    hint ? h('span', { class: 'hint' }, hint) : null);

  const corpo = h('div');
  const barra = tabs([
    { key: 'studio', label: 'Studio e intestazione' },
    { key: 'fisco', label: 'Fisco e fatturazione' },
    { key: 'listino', label: 'Listino prestazioni' },
    { key: 'dati', label: 'Dati e backup' }
  ], tab, (k) => S.vai('/impostazioni/' + k));

  add(clear(root), barra, corpo);

  if (tab === 'studio') {
    add(corpo, 
      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Dati riportati sui documenti')),
        h('div', { class: 'form-grid' },
          campo('titolo', 'Titolo', { w: 'quarter', hint: 'Es. Dott.' }),
          campo('nome', 'Nome', { w: 'quarter' }),
          campo('cognome', 'Cognome', { w: 'half' }),
          campo('qualifica', 'Qualifica professionale', { w: 'full' }),
          campo('indirizzo', 'Indirizzo dello studio', { w: 'half' }),
          campo('cap', 'CAP', { w: 'quarter' }),
          campo('citta', 'Città', { w: 'quarter' }),
          campo('provincia', 'Provincia', { w: 'quarter' }),
          campo('telefono', 'Telefono', { w: 'quarter', type: 'tel' }),
          campo('email', 'E-mail', { w: 'quarter', type: 'email' }),
          campo('pec', 'PEC', { w: 'quarter', type: 'email' }),
          campo('albo', 'Dicitura di iscrizione all’albo', { w: 'half' }),
          campo('numeroAlbo', 'Numero di iscrizione', { w: 'quarter' }),
          campo('ordineProvincia', 'Ordine provinciale', { w: 'quarter', hint: 'Es. OFI Palermo' }))),
      riquadroLogo(imp),
      riquadroFirma(imp),
      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Calendario')),
        h('div', { class: 'alert info' },
          'Quando mandi un appuntamento a Google Calendar o esporti il file .ics, il titolo dell’evento finisce in un ' +
          'servizio in cloud. Un appuntamento di fisioterapia rivela una prestazione sanitaria: l’impostazione ' +
          'predefinita riporta le sole iniziali.'),
        h('div', { class: 'form-grid' },
          campo('calendarioEtichetta', 'Titolo degli eventi esportati', {
            w: 'half', opts: ETICHETTE.map(e => [e.valore, e.nome])
          }),
          campo('calendarioTestoGenerico', 'Dicitura generica', { w: 'half', hint: 'Usata se scegli il titolo generico.' }),
          campo('durataAppuntamentoDefault', 'Durata predefinita (min)', { w: 'third', type: 'number' }))),
      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Privacy e conservazione')),
        h('div', { class: 'form-grid' },
          campo('titolareTrattamento', 'Titolare del trattamento dei dati', { w: 'half', hint: 'Se vuoto viene usato il nominativo del professionista.' }),
          campo('dpoContatto', 'Referente per la protezione dei dati (facoltativo)', { w: 'half' }),
          campo('conservazioneAnni', 'Anni di conservazione della documentazione sanitaria', { w: 'third', type: 'number' })),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn btn-sm', onClick: () => stampaModulo('privacy', {}, imp) }, '🖨 Anteprima informativa privacy'),
          h('button', { class: 'btn btn-sm', onClick: () => stampaModulo('trattamento', {}, imp) }, '🖨 Consenso al trattamento'),
          h('button', { class: 'btn btn-sm', onClick: () => stampaModulo('manipolazione', {}, imp) }, '🖨 Consenso manipolazioni'))),
      bottoneSalva(salva));
  }

  if (tab === 'fisco') {
    add(corpo, 
      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Dati fiscali')),
        h('div', { class: 'form-grid' },
          campo('partitaIva', 'Partita IVA', { w: 'third' }),
          campo('codiceFiscale', 'Codice fiscale', { w: 'third' }),
          campo('regimeFiscale', 'Regime fiscale', {
            w: 'third',
            opts: [['forfettario', 'Forfettario (L. 190/2014)'], ['ordinario', 'Ordinario']]
          }),
          campo('tipoDocumento', 'Denominazione del documento', {
            w: 'third', opts: [['Fattura', 'Fattura'], ['Ricevuta sanitaria', 'Ricevuta sanitaria']],
            hint: 'Usa “Ricevuta sanitaria” solo se operi senza partita IVA.'
          }),
          campo('esenzioneIva', 'Trattamento IVA predefinito', {
            w: 'third',
            opts: [['art10', 'Esente art. 10 n. 18 D.P.R. 633/72'], ['none', 'Imponibile']]
          }),
          campo('copiePerFattura', 'Copie da stampare', { w: 'third', type: 'number', hint: 'Originale per il paziente + copia per te.' }))),

      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Imposta di bollo')),
        h('div', { class: 'alert info' },
          'Sui documenti esenti o non soggetti a IVA di importo superiore a € 77,47 va apposta una marca da bollo da € 2,00 (D.P.R. 642/1972). Può essere addebitata al paziente in quanto fuori campo IVA ai sensi dell’art. 15 D.P.R. 633/1972.'),
        h('div', { class: 'form-grid' },
          campo('bolloSoglia', 'Soglia (€)', { w: 'third', type: 'number', step: '0.01' }),
          campo('bolloImporto', 'Importo del bollo (€)', { w: 'third', type: 'number', step: '0.01' }),
          flag('bolloAddebitato', 'Addebita il bollo al paziente'))),

      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Rivalsa e ritenuta')),
        h('div', { class: 'alert info' },
          'In regime forfettario non si applica la ritenuta d’acconto (art. 1, c. 67, L. 190/2014): l’opzione resta disattivata automaticamente.'),
        h('div', { class: 'form-grid' },
          flag('rivalsaInpsAttiva', 'Applica di norma la rivalsa INPS gestione separata'),
          campo('rivalsaInpsPercento', 'Percentuale rivalsa', { w: 'quarter', type: 'number', step: '0.01' }),
          flag('ritenutaAttiva', 'Applica di norma la ritenuta d’acconto', 'Solo in regime ordinario e verso sostituti d’imposta.'),
          campo('ritenutaPercento', 'Percentuale ritenuta', { w: 'quarter', type: 'number', step: '0.01' }))),

      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Pagamenti')),
        h('div', { class: 'form-grid' },
          campo('metodoPagamentoDefault', 'Metodo predefinito', { w: 'third' }),
          campo('scadenzaGiorni', 'Giorni di scadenza', { w: 'third', type: 'number', hint: '0 = pagamento immediato.' }),
          campo('iban', 'IBAN', { w: 'third' }),
          campo('banca', 'Banca', { w: 'third' }),
          h('div', { class: 'field w-full' }, h('label', 'Note aggiuntive da stampare su ogni fattura'),
            h('textarea', { rows: 2, value: imp.noteFatturaLibere || '', onInput: (e) => { imp.noteFatturaLibere = e.target.value; } })))),
      bottoneSalva(salva));
  }

  if (tab === 'listino') {
    const zona = h('div');
    const renderListino = () => {
      add(clear(zona), 
        h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
          h('thead', h('tr', h('th', 'Prestazione'), h('th', 'Prezzo (€)'), h('th', 'Durata (min)'), h('th', ''))),
          h('tbody', imp.listino.map((l, i) => h('tr',
            h('td', h('input', { type: 'text', value: l.nome, onInput: (e) => { l.nome = e.target.value; } })),
            h('td', { style: { width: '130px' } }, h('input', { type: 'number', step: '0.01', value: l.prezzo, onInput: (e) => { l.prezzo = num(e.target.value, 0); } })),
            h('td', { style: { width: '130px' } }, h('input', { type: 'number', value: l.durata ?? '', onInput: (e) => { l.durata = num(e.target.value, 0); } })),
            h('td', { style: { width: '44px' } }, h('button', {
              class: 'btn btn-ghost btn-sm',
              onClick: () => { imp.listino.splice(i, 1); renderListino(); }
            }, '✕'))))))),
        h('button', {
          class: 'btn btn-sm', style: { marginTop: '8px' },
          onClick: () => { imp.listino.push({ id: uid('p'), nome: '', prezzo: 0, durata: 45 }); renderListino(); }
        }, '+ Aggiungi prestazione'));
    };
    renderListino();
    add(corpo, 
      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Listino delle prestazioni')),
        h('p', { class: 'faint small' }, 'Il listino alimenta le sedute e le righe di fattura. Modificare un prezzo non cambia i documenti già emessi.'),
        zona),
      bottoneSalva(salva));
  }

  if (tab === 'dati') {
    const stats = await db.statistiche();
    add(corpo, 
      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Dove sono conservati i dati')),
        h('div', { class: 'alert warn' },
          h('strong', 'I dati risiedono soltanto in questo browser, su questo computer.'),
          h('p', { class: 'mb0', style: { marginTop: '6px' } },
            'Non vengono inviati ad alcun server. Se svuoti i dati di navigazione, cambi browser o formatti il computer, i dati vanno persi. ' +
            'Esegui un backup con regolarità e conservane una copia cifrata in un luogo sicuro: la cartella clinica contiene dati appartenenti a categorie particolari (art. 9 GDPR).')),
        h('div', { class: 'grid grid-4' },
          ...Object.entries({
            pazienti: 'Pazienti', episodi: 'Episodi', sedute: 'Sedute', fatture: 'Fatture', incassi: 'Incassi'
          }).map(([k, l]) => h('div', { class: 'stat' },
            h('div', { class: 'stat-label' }, l),
            h('div', { class: 'stat-value' }, String(stats[k] ?? 0)))))),

      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Backup e ripristino')),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn btn-primary', onClick: () => esportaBackup() }, '⬇ Scarica backup completo'),
          h('button', { class: 'btn', onClick: () => importaBackup('unisci') }, '⬆ Ripristina unendo'),
          h('button', { class: 'btn', onClick: () => importaBackup('sostituisci') }, '⬆ Ripristina sostituendo tutto')),
        h('p', { class: 'faint small', style: { marginTop: '10px' } },
          '“Unendo” aggiorna i record con lo stesso identificativo e aggiunge i nuovi. “Sostituendo” svuota gli archivi prima di importare.')),

      riquadroBackupAutomatico(imp, salva),

      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Importazione da un altro gestionale')),
        h('p', { class: 'small' },
          'Se hai già fatturato con Zoho Invoice o con un altro programma, puoi portare qui anagrafiche, ' +
          'fatture e incassi partendo dagli export in CSV.'),
        h('a', { class: 'btn btn-primary', href: '#/importa' }, '⬆ Importa dati')),

      h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Azzeramento')),
        h('p', { class: 'small' }, 'Elimina definitivamente tutti i dati dal browser. Esegui prima un backup.'),
        h('button', { class: 'btn btn-danger', onClick: () => azzera() }, '🗑 Cancella tutti i dati')));
  }
}

/**
 * Riquadro di caricamento di un'immagine delle impostazioni (logo o firma).
 * @param {object} cfg  chiavi del campo immagine e dell'altezza, testi, opzioni
 */
function riquadroImmagine(imp, cfg) {
  const anteprima = h('div', {
    style: {
      background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      padding: '14px', minHeight: '86px', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }
  });
  const info = h('span', { class: 'hint' });

  const disegna = () => {
    clear(anteprima);
    if (imp[cfg.chiave]) {
      anteprima.appendChild(h('img', {
        src: imp[cfg.chiave], alt: cfg.titolo,
        style: { height: (Number(imp[cfg.chiaveAltezza]) || 18) * 3.78 + 'px', width: 'auto', maxWidth: '100%' }
      }));
    } else {
      anteprima.appendChild(h('span', { style: { color: '#999', fontSize: '.85rem' } }, cfg.vuoto));
    }
  };
  disegna();

  const scegli = async () => {
    const file = await pickFile('image/png,image/jpeg,image/*');
    if (!file) return;
    try {
      const { dataUrl, larghezza, altezza, kb } = await caricaImmagine(file);
      imp[cfg.chiave] = dataUrl;
      info.textContent = `Caricata: ${larghezza}×${altezza} px, ${kb} kB.`;
      info.style.color = 'var(--ok)';
      disegna();
      toast(cfg.titolo + ' caricata. Ricordati di salvare le impostazioni.', 'ok');
    } catch (e) {
      info.textContent = e.message;
      info.style.color = 'var(--danger)';
      toast(e.message, 'err');
    }
  };

  return h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', cfg.titolo)),
    h('p', { class: 'faint small' }, cfg.descrizione),
    h('div', { class: 'grid grid-2' },
      anteprima,
      h('div', null,
        h('div', { class: 'btn-row', style: { marginBottom: '10px' } },
          h('button', { class: 'btn btn-primary btn-sm', onClick: scegli }, '⬆ Carica un’immagine'),
          imp[cfg.chiave] ? h('button', {
            class: 'btn btn-sm btn-danger',
            onClick: () => { imp[cfg.chiave] = ''; info.textContent = ''; disegna(); toast('Immagine rimossa. Salva per confermare.'); }
          }, '🗑 Rimuovi') : null),
        info,
        h('div', { class: 'field', style: { marginTop: '10px' } },
          h('label', 'Altezza di stampa (mm)'),
          h('input', {
            type: 'number', min: '5', max: '40', step: '1', value: imp[cfg.chiaveAltezza] ?? 18,
            onInput: (e) => { imp[cfg.chiaveAltezza] = num(e.target.value, 18); disegna(); }
          }),
          h('span', { class: 'hint' }, cfg.suggerimentoAltezza)),
        (cfg.opzioni || []).map(o => h('div', { class: 'check-row' },
          h('input', {
            type: 'checkbox', checked: !!imp[o.chiave],
            onChange: (e) => { imp[o.chiave] = e.target.checked; }
          }),
          h('label', o.etichetta))))));
}

const riquadroLogo = (imp) => riquadroImmagine(imp, {
  chiave: 'logo', chiaveAltezza: 'logoAltezzaMm',
  titolo: 'Logo',
  vuoto: 'Nessun logo caricato',
  descrizione: 'Compare in alto a sinistra sulle fatture e, se vuoi, anche sulla cartella clinica e sui moduli di consenso. ' +
    'L’immagine viene ridimensionata al caricamento per non appesantire l’archivio e i backup.',
  suggerimentoAltezza: 'Indicativamente 15-20 mm su una fattura A4.',
  opzioni: [{ chiave: 'logoInDocumentiClinici', etichetta: 'Usa il logo anche su cartella clinica e consensi' }]
});

const riquadroFirma = (imp) => riquadroImmagine(imp, {
  chiave: 'firma', chiaveAltezza: 'firmaAltezzaMm',
  titolo: 'Firma',
  vuoto: 'Nessuna firma caricata',
  descrizione: 'Firma su un foglio bianco, fotografala o scansionala e caricala qui: verrà stampata sopra la riga di firma, ' +
    'così puoi inviare la fattura via e-mail senza doverla firmare a mano. Sfondo chiaro e inchiostro scuro danno il risultato migliore.',
  suggerimentoAltezza: 'Indicativamente 12-18 mm.',
  opzioni: [
    { chiave: 'firmaInFattura', etichetta: 'Apponi la firma sulle fatture' },
    { chiave: 'firmaInDocumentiClinici', etichetta: 'Apponi la firma sulla cartella clinica' }
  ]
});

const bottoneSalva = (salva) => h('div', { class: 'btn-row end', style: { position: 'sticky', bottom: '12px' } },
  h('button', { class: 'btn btn-primary', onClick: salva }, '💾 Salva impostazioni'));

async function esportaBackup() {
  const backup = await db.esportaTutto();
  downloadFile(db.nomeFileBackup(), JSON.stringify(backup, null, 2));
  toast('Backup scaricato.', 'ok');
}

async function importaBackup(modo) {
  const file = await pickFile('.json,application/json');
  if (!file) return;
  let backup;
  try {
    backup = JSON.parse(await readFileText(file));
  } catch {
    toast('Il file non è un JSON valido.', 'err');
    return;
  }
  const n = Object.entries(backup?.data || {}).map(([k, v]) => `${Array.isArray(v) ? v.length : 0} ${k}`).join(', ');
  const ok = await conferma(
    h('div',
      h('p', modo === 'sostituisci'
        ? 'Tutti i dati attuali verranno cancellati e sostituiti con quelli del backup.'
        : 'I record del backup verranno aggiunti; quelli con lo stesso identificativo saranno sovrascritti.'),
      h('p', { class: 'small faint' }, 'Contenuto del file: ' + (n || 'non riconosciuto') +
        (backup?.esportatoIl ? ` — esportato il ${fmtDate(backup.esportatoIl.slice(0, 10))}` : ''))),
    { title: 'Ripristina backup', okLabel: 'Ripristina', danger: modo === 'sostituisci' });
  if (!ok) return;
  try {
    const conteggi = await db.importaTutto(backup, modo);
    await S.imp(true);
    toast('Ripristino completato: ' + Object.entries(conteggi).map(([k, v]) => `${v} ${k}`).join(', '), 'ok');
    S.aggiorna();
  } catch (e) {
    toast('Ripristino non riuscito: ' + e.message, 'err');
  }
}

async function azzera() {
  if (!await conferma(
    h('div',
      h('p', h('strong', 'Verranno eliminati definitivamente tutti i pazienti, le cartelle, le fatture e gli incassi.')),
      h('p', { class: 'small' }, 'L’operazione non è reversibile. Scarica prima un backup.')),
    { title: 'Cancella tutti i dati', okLabel: 'Ho fatto il backup, cancella', danger: true })) return;
  for (const store of db.STORE_NAMES) await db.clearStore(store);
  await S.imp(true);
  toast('Tutti i dati sono stati cancellati.', 'ok');
  S.vai('/');
}


/* ------------------------------------------------------------------ */
/* Backup automatico su disco                                          */
/* ------------------------------------------------------------------ */
/**
 * Il riquadro si adatta a quello che il server sa fare: se il gestionale e'
 * aperto senza il suo server, scrivere su disco e' impossibile e dirlo e'
 * piu' utile che mostrare un interruttore che non farebbe nulla.
 */
function riquadroBackupAutomatico(imp, salva) {
  const corpo = h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', 'Copia automatica su disco')),
    h('p', { class: 'faint small' }, 'Verifica in corso…'));

  backupDisponibile().then(stato => {
    clear(corpo);
    if (!stato) {
      add(corpo,
        h('div', { class: 'card-head' }, h('h2', 'Copia automatica su disco')),
        h('div', { class: 'alert warn' },
          h('strong', 'Non disponibile in questa modalità. '),
          'La copia automatica la scrive il server locale del gestionale: apri il programma con ' +
          '«Avvia gestionale» (o con l’icona sulla Scrivania) e comparirà qui.'));
      return;
    }

    const ultimo = ultimoBackupAutomatico();
    const attivo = imp.backupAutomatico !== false;
    const elenco = h('div');
    const disegnaElenco = (file) => {
      clear(elenco);
      if (!file.length) { add(elenco, h('p', { class: 'faint small mb0' }, 'Nessuna copia ancora salvata.')); return; }
      add(elenco, h('div', { class: 'table-wrap' }, h('table', { class: 'tbl tbl-mini' },
        h('thead', h('tr', h('th', 'File'), h('th', 'Quando'), h('th', 'Dimensione'))),
        h('tbody', file.slice(0, 8).map(f => h('tr',
          h('td', h('span', { class: 'small mono' }, f.nome)),
          h('td', h('span', { class: 'small' }, new Date(f.modificatoIl).toLocaleString('it-IT'))),
          h('td', h('span', { class: 'small' }, Math.max(1, Math.round(f.byte / 1024)) + ' kB'))))))));
      if (file.length > 8) add(elenco, h('p', { class: 'faint small' }, `…e altre ${file.length - 8}.`));
    };
    disegnaElenco(stato.file);

    add(corpo,
      h('div', { class: 'card-head' },
        h('h2', 'Copia automatica su disco'),
        h('span', { class: 'spacer' }),
        badge(attivo ? 'attiva' : 'disattivata', attivo ? 'ok' : '')),
      h('p', { class: 'small' },
        'All’avvio il gestionale salva da solo una copia completa dei dati in una cartella del tuo computer, ' +
        'e conserva le ultime ' + stato.daTenere + '.'),
      h('div', { class: 'field w-full' },
        h('label', 'Cartella'),
        h('input', { type: 'text', value: stato.cartella, readonly: true }),
        h('span', { class: 'hint' },
          'Per cambiarla, avvia il gestionale con --backup=/percorso/della/cartella.')),
      h('div', { class: 'check-row' },
        h('input', {
          type: 'checkbox', id: 'backup-auto', checked: attivo,
          onChange: (ev) => { imp.backupAutomatico = ev.target.checked; salva(); }
        }),
        h('label', { for: 'backup-auto' }, 'Salva una copia automaticamente all’avvio')),
      h('div', { class: 'field', style: { maxWidth: '260px' } },
        h('label', 'Non più spesso di'),
        h('select', {
          onChange: (ev) => { imp.backupOgniOre = Number(ev.target.value); salva(); }
        }, [[6, 'ogni 6 ore'], [24, 'una volta al giorno'], [72, 'ogni 3 giorni'], [168, 'una volta a settimana']]
          .map(([v, l]) => h('option', { value: v, selected: (Number(imp.backupOgniOre) || 24) === v }, l)))),
      ultimo
        ? h('p', { class: 'faint small' }, 'Ultima copia automatica: ' + ultimo.toLocaleString('it-IT') + '.')
        : h('p', { class: 'faint small' }, 'Nessuna copia automatica ancora eseguita da questo browser.'),
      h('div', { class: 'alert warn' },
        h('strong', 'Il file non è cifrato. '),
        'Contiene la cartella clinica dei tuoi pazienti: tratta quella cartella come tratteresti l’archivio di carta, ' +
        'e valuta di tenerla su un disco cifrato (su Mac, FileVault).'),
      h('div', { class: 'btn-row' },
        h('button', {
          class: 'btn btn-primary', onClick: async (ev) => {
            const bottone = ev.target;
            bottone.disabled = true;
            try {
              const esito = await salvaSuDisco();
              toast('Copia salvata: ' + esito.nome, 'ok');
              disegnaElenco((await backupDisponibile())?.file || []);
            } catch (err) {
              toast('Copia non riuscita: ' + err.message, 'err');
            } finally {
              bottone.disabled = false;
            }
          }
        }, '💾 Salva una copia adesso')),
      h('h3', { class: 'ant-sez' }, 'Copie presenti'),
      elenco);
  });

  return corpo;
}
