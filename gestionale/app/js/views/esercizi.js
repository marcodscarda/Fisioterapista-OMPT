/* ============================================================
   Vista: libreria degli esercizi
   ------------------------------------------------------------
   La libreria e' dello studio, non del singolo paziente: un
   esercizio si scrive una volta e si prescrive molte, adattando
   la dose al caso. Le foto stanno nell'archivio locale come il
   logo; i video restano collegamenti, perche' un filmato dentro
   IndexedDB renderebbe i backup ingestibili.
   ============================================================ */
import {
  add, h, clear, toast, nz, uid, todayISO, matches, downloadFile, pickFile, readFileText
} from '../util.js';
import { modal, conferma, tabella, badge, vuoto } from '../ui/kit.js';
import { caricaImmagine, MISURE_ESERCIZIO } from '../ui/immagini.js';
import { REGIONI, CATEGORIE, ATTREZZATURA, CAMPI_DOSE, CATALOGO, doseInRiga, protocolliPresenti } from '../schema/esercizi.js';
import { stampaEsercizio } from '../print.js';
import * as db from '../db.js';
import * as S from '../state.js';

const CHIAVE_SEMINATI = 'catalogo-seminato';

let _semina = null;

/*
   Una sola semina per volta. All'avvio la chiede main.js e, se si apre il
   gestionale direttamente sulla pagina Esercizi, la chiede anche la pagina:
   partendo insieme trovavano entrambe la libreria vuota e il catalogo finiva
   in archivio due volte.
*/
export function assicuraCatalogo() {
  if (_semina) return _semina;
  _semina = semina();
  _semina.then(() => { _semina = null; }, () => { _semina = null; });
  return _semina;
}

/*
   Alla prima apertura la libreria viene riempita con il catalogo di partenza.
   Agli aggiornamenti successivi arrivano solo le voci nuove: si tiene nota di
   quelle gia' proposte, cosi' un esercizio cancellato a mano non ricompare e
   uno modificato non viene sovrascritto.
*/
async function semina() {
  const presenti = await db.all('esercizi');
  const registro = await db.byId('contatori', CHIAVE_SEMINATI);
  const inLibreria = new Set(presenti.map(x => x.nome));
  const proposti = new Set(registro?.nomi || []);

  // Quali voci del catalogo proporre:
  // - libreria vuota: tutte, e' la prima apertura;
  // - libreria gia' popolata ma senza registro (aggiornamento da una versione
  //   che non lo teneva): solo quelle entrate in catalogo dopo, riconoscibili
  //   dal campo "da", per non far ricomparire cio' che era stato cancellato;
  // - con il registro: tutto cio' che non e' mai stato proposto.
  const candidate = registro
    ? CATALOGO.filter(v => !proposti.has(v.nome))
    : (presenti.length ? CATALOGO.filter(v => v.da) : CATALOGO);

  const nuovi = candidate.filter(v => !inLibreria.has(v.nome));
  for (const voce of nuovi) await db.put('esercizi', { ...voce, creatoIl: todayISO() });
  await db.put('contatori', {
    id: CHIAVE_SEMINATI,
    nomi: [...new Set([...proposti, ...CATALOGO.map(v => v.nome)])]
  });

  return nuovi.length ? db.all('esercizi') : presenti;
}

export async function vistaEsercizi(root, { id } = {}) {
  const esercizi = await assicuraCatalogo();
  esercizi.sort((a, b) => (a.regione || '').localeCompare(b.regione || '', 'it')
    || (a.nome || '').localeCompare(b.nome || '', 'it'));

  if (id) { schedaEsercizio(root, esercizi.find(x => x.id === id), esercizi); return; }

  const stato = { q: '', regione: '', categoria: '', protocollo: '' };
  const protocolli = protocolliPresenti(esercizi);
  const lista = h('div', { class: 'card card-tight' });

  function render() {
    const filtrati = esercizi
      .filter(x => !stato.regione || x.regione === stato.regione)
      .filter(x => !stato.categoria || x.categoria === stato.categoria)
      .filter(x => !stato.protocollo || x.protocollo === stato.protocollo)
      .filter(x => matches(stato.q, x.nome, x.obiettivo, x.regione, x.categoria,
        (x.attrezzatura || []).join(' '), x.esecuzione, x.protocollo));

    clear(lista).appendChild(tabella({
      colonne: [
        {
          label: 'Esercizio', cell: (x) => h('div', { class: 'es-riga' },
            x.immagini?.[0]
              ? h('img', { class: 'es-mini', src: x.immagini[0].dataUrl, alt: '' })
              : h('span', { class: 'es-mini es-mini-vuota' }, '🏃'),
            h('div', null,
              h('strong', x.nome),
              h('div', { class: 'faint small' }, nz(x.obiettivo, '')),
              x.protocollo ? h('div', { class: 'faint small' }, '◆ ' + x.protocollo) : null))
        },
        { label: 'Regione', cell: (x) => h('span', { class: 'small' }, nz(x.regione, '—')) },
        { label: 'Tipo', cell: (x) => badge(nz(x.categoria, '—')) },
        { label: 'Dose', cell: (x) => h('span', { class: 'small faint' }, doseInRiga(x.dose) || '—') },
        {
          label: '', cell: (x) => h('span', { class: 'btn-row' },
            x.video?.length ? badge('video', 'accent') : null,
            x.immagini?.length > 1 ? badge(`${x.immagini.length} foto`) : null,
            h('span', { class: 'btn btn-sm' }, 'Apri →'))
        }
      ],
      righe: filtrati,
      onRowClick: (x) => S.vai('/esercizi/' + x.id),
      vuotoTesto: 'Nessun esercizio con questi filtri.'
    }));
  }

  add(clear(root),
    h('div', { class: 'search-bar' },
      h('select', { onChange: (ev) => { stato.regione = ev.target.value; render(); } },
        [h('option', { value: '' }, 'Tutte le regioni'), ...REGIONI.map(r => h('option', { value: r }, r))]),
      h('select', { onChange: (ev) => { stato.categoria = ev.target.value; render(); } },
        [h('option', { value: '' }, 'Tutti i tipi'), ...CATEGORIE.map(c => h('option', { value: c }, c))]),
      // La tendina dei protocolli serve solo a chi ne ha: senza, resterebbe un comando morto.
      protocolli.length
        ? h('select', { onChange: (ev) => { stato.protocollo = ev.target.value; render(); } },
          [h('option', { value: '' }, 'Tutti i protocolli'), ...protocolli.map(x => h('option', { value: x }, x))])
        : null,
      h('input', {
        type: 'search', placeholder: 'Cerca per nome, obiettivo, attrezzo…',
        onInput: (ev) => { stato.q = ev.target.value; render(); }
      }),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-sm', onClick: () => esportaLibreria(esercizi) }, '⬇ Esporta'),
      h('button', { class: 'btn btn-sm', onClick: () => importaLibreria() }, '⬆ Importa'),
      h('button', { class: 'btn btn-primary', onClick: () => nuovoEsercizio() }, '+ Nuovo esercizio')),
    h('p', { class: 'faint small' },
      `${esercizi.length} esercizi in libreria. Sono un punto di partenza da adattare: modificali, duplicali o cancellali liberamente.`),
    lista);
  render();
}

/* ------------------------------------------------------------------ */
/* Scheda di un esercizio                                              */
/* ------------------------------------------------------------------ */
function schedaEsercizio(root, es, tutti) {
  if (!es) {
    clear(root).appendChild(h('div', { class: 'alert danger' }, 'Esercizio non trovato.'));
    return;
  }
  const blocco = (titolo, contenuto) => contenuto
    ? h('div', { class: 'es-blocco' }, h('h3', { class: 'ant-sez' }, titolo), contenuto)
    : null;
  const testo = (t) => t ? h('div', { class: 'ant-valore' }, t) : null;
  const elenco = (voci) => voci?.length
    ? h('ul', { style: { margin: '2px 0 0', paddingLeft: '18px' } }, voci.map(v => h('li', v)))
    : null;

  add(clear(root),
    h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('div', null,
          h('div', { class: 'faint small' }, h('a', { href: '#/esercizi' }, '← Libreria esercizi')),
          h('h1', { class: 'mb0' }, es.nome),
          h('div', { class: 'faint small' }, [es.regione, es.categoria, es.protocollo].filter(Boolean).join(' · '))),
        h('span', { class: 'spacer' }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn btn-sm', onClick: () => stampaEsercizio(es) }, '🖨 Stampa'),
          h('button', { class: 'btn btn-sm', onClick: () => modificaEsercizio(es) }, '✎ Modifica'),
          h('button', { class: 'btn btn-sm', onClick: () => duplica(es) }, '⧉ Duplica'),
          h('button', { class: 'btn btn-sm btn-danger', onClick: () => elimina(es) }, '🗑'))),
      es.obiettivo ? h('p', { class: 'mb0' }, h('strong', 'Obiettivo: '), es.obiettivo) : null),

    es.immagini?.length || es.video?.length
      ? h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Immagini e video')),
        es.immagini?.length
          ? h('div', { class: 'es-galleria' }, es.immagini.map(im => h('figure', { class: 'es-figura' },
            h('img', { src: im.dataUrl, alt: im.didascalia || es.nome }),
            im.didascalia ? h('figcaption', im.didascalia) : null)))
          : null,
        es.video?.length
          ? h('div', { class: 'btn-row', style: { marginTop: '10px' } },
            es.video.map(v => h('a', {
              class: 'btn btn-sm', href: v.url, target: '_blank', rel: 'noopener noreferrer'
            }, '▶ ' + nz(v.titolo, 'Video'))))
          : null)
      : null,

    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', 'Come si esegue')),
      h('div', { class: 'ant-griglia' },
        blocco('Posizione di partenza', testo(es.posizione)),
        blocco('Esecuzione', testo(es.esecuzione)),
        blocco('Respirazione', testo(es.respirazione)),
        blocco('Attrezzatura', es.attrezzatura?.length ? testo(es.attrezzatura.join(' · ')) : null)),
      es.puntiChiave?.length || es.erroriComuni?.length
        ? h('div', { class: 'ant-griglia', style: { marginTop: '12px' } },
          blocco('Punti chiave', elenco(es.puntiChiave)),
          blocco('Errori comuni', elenco(es.erroriComuni)))
        : null),

    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', 'Dosaggio')),
      h('div', { class: 'ant-griglia' },
        CAMPI_DOSE.filter(c => es.dose?.[c.k]).map(c => h('div', { class: 'ant-voce' },
          h('div', { class: 'ant-label' }, c.l),
          h('div', { class: 'ant-valore' }, es.dose[c.k])))),
      !CAMPI_DOSE.some(c => es.dose?.[c.k]) ? vuoto('Dosaggio non indicato.') : null,
      h('div', { class: 'ant-griglia', style: { marginTop: '12px' } },
        blocco('Progressione', testo(es.progressione)),
        blocco('Regressione', testo(es.regressione)))),

    es.precauzioni || es.doloreAmmesso
      ? h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('h2', 'Sicurezza')),
        h('div', { class: 'ant-griglia' },
          blocco('Dolore ammesso', testo(es.doloreAmmesso)),
          blocco('Precauzioni', testo(es.precauzioni))))
      : null,

    es.note ? h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', 'Note')), testo(es.note)) : null);
}

/* ------------------------------------------------------------------ */
/* Creazione e modifica                                                */
/* ------------------------------------------------------------------ */
const VUOTO = () => ({
  nome: '', regione: 'Generale', categoria: 'Rinforzo', protocollo: '', obiettivo: '',
  posizione: '', esecuzione: '', respirazione: '',
  puntiChiave: [], erroriComuni: [], attrezzatura: [],
  dose: {}, progressione: '', regressione: '', precauzioni: '', doloreAmmesso: '',
  immagini: [], video: [], note: '', origine: 'mio'
});

export function nuovoEsercizio(iniziale, alSalvataggio) {
  modificaEsercizio({ ...VUOTO(), ...(iniziale || {}) }, alSalvataggio);
}

function modificaEsercizio(originale, alSalvataggio) {
  const es = JSON.parse(JSON.stringify(originale));
  es.immagini = es.immagini || [];
  es.video = es.video || [];
  es.dose = es.dose || {};

  const campo = (label, chiave, opzioni = {}) => {
    const input = opzioni.righe
      ? h('textarea', { rows: opzioni.righe, value: es[chiave] || '', onInput: (ev) => { es[chiave] = ev.target.value; } })
      : h('input', { type: 'text', value: es[chiave] || '', onInput: (ev) => { es[chiave] = ev.target.value; } });
    return h('div', { class: 'field ' + (opzioni.w || 'w-full') },
      h('label', label), input,
      opzioni.hint ? h('span', { class: 'hint' }, opzioni.hint) : null);
  };
  const scelta = (label, chiave, voci, w = 'w-half') => h('div', { class: 'field ' + w },
    h('label', label),
    h('select', { onChange: (ev) => { es[chiave] = ev.target.value; } },
      voci.map(v => h('option', { value: v, selected: es[chiave] === v }, v))));
  /** Elenco puntato modificabile: una voce per riga. */
  const righe = (label, chiave, hint) => h('div', { class: 'field w-half' },
    h('label', label),
    h('textarea', {
      rows: 4, value: (es[chiave] || []).join('\n'),
      onInput: (ev) => { es[chiave] = ev.target.value.split('\n').map(r => r.trim()).filter(Boolean); }
    }),
    h('span', { class: 'hint' }, hint));

  const galleria = h('div', { class: 'es-galleria' });
  const disegnaGalleria = () => {
    clear(galleria);
    for (const [i, im] of es.immagini.entries()) {
      galleria.appendChild(h('figure', { class: 'es-figura' },
        h('img', { src: im.dataUrl, alt: '' }),
        h('input', {
          type: 'text', placeholder: 'Didascalia', value: im.didascalia || '',
          onInput: (ev) => { im.didascalia = ev.target.value; }
        }),
        h('button', {
          type: 'button', class: 'btn btn-sm btn-danger',
          onClick: () => { es.immagini.splice(i, 1); disegnaGalleria(); }
        }, '🗑 Togli')));
    }
    if (!es.immagini.length) galleria.appendChild(h('p', { class: 'faint small mb0' }, 'Nessuna immagine.'));
  };
  disegnaGalleria();

  const elencoVideo = h('div');
  const disegnaVideo = () => {
    clear(elencoVideo);
    for (const [i, v] of es.video.entries()) {
      elencoVideo.appendChild(h('div', { class: 'btn-row', style: { marginBottom: '6px' } },
        h('input', {
          type: 'text', placeholder: 'Titolo', value: v.titolo || '', style: { maxWidth: '180px' },
          onInput: (ev) => { v.titolo = ev.target.value; }
        }),
        h('input', {
          type: 'url', placeholder: 'https://…', value: v.url || '', style: { flex: '1' },
          onInput: (ev) => { v.url = ev.target.value; }
        }),
        h('button', {
          type: 'button', class: 'btn btn-sm btn-danger',
          onClick: () => { es.video.splice(i, 1); disegnaVideo(); }
        }, '🗑')));
    }
    if (!es.video.length) elencoVideo.appendChild(h('p', { class: 'faint small mb0' }, 'Nessun video collegato.'));
  };
  disegnaVideo();

  async function aggiungiImmagine() {
    const file = await pickFile('image/*');
    if (!file) return;
    try {
      const { dataUrl, kb } = await caricaImmagine(file, MISURE_ESERCIZIO);
      es.immagini.push({ dataUrl, didascalia: '' });
      disegnaGalleria();
      toast(`Immagine aggiunta (${kb} kB).`, 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }

  modal({
    title: es.id ? 'Modifica esercizio' : 'Nuovo esercizio',
    size: 'lg',
    body: h('div',
      h('div', { class: 'form-grid' },
        campo('Nome *', 'nome', { w: 'w-full' }),
        scelta('Regione', 'regione', REGIONI),
        scelta('Tipo', 'categoria', CATEGORIE),
        campo('Protocollo', 'protocollo', { w: 'w-full', hint: 'Facoltativo: il percorso a cui appartiene, per esempio “Sutura della cuffia dei rotatori — fase 1 (passiva)”. Gli esercizi con lo stesso testo si filtrano insieme.' }),
        campo('Obiettivo', 'obiettivo', { w: 'w-full', righe: 2, hint: 'A cosa serve, in una frase.' }),
        campo('Posizione di partenza', 'posizione', { w: 'w-full', righe: 2 }),
        campo('Esecuzione', 'esecuzione', { w: 'w-full', righe: 4, hint: 'Il movimento, passo passo, come lo spiegheresti a voce.' }),
        righe('Punti chiave', 'puntiChiave', 'Una per riga: i richiami che fanno la differenza.'),
        righe('Errori comuni', 'erroriComuni', 'Una per riga: cosa si sbaglia di solito.'),
        campo('Respirazione', 'respirazione', { w: 'w-half' }),
        h('div', { class: 'field w-half' },
          h('label', 'Attrezzatura'),
          h('input', {
            type: 'text', list: 'attrezzatura-nota', value: (es.attrezzatura || []).join(', '),
            onInput: (ev) => { es.attrezzatura = ev.target.value.split(',').map(x => x.trim()).filter(Boolean); }
          }),
          h('datalist', { id: 'attrezzatura-nota' }, ATTREZZATURA.map(a => h('option', { value: a }))),
          h('span', { class: 'hint' }, 'Separata da virgole.'))),

      h('h3', { class: 'ant-sez' }, 'Dosaggio'),
      h('div', { class: 'form-grid' },
        CAMPI_DOSE.map(c => h('div', { class: 'field w-third' },
          h('label', c.l),
          h('input', {
            type: 'text', placeholder: c.esempio, value: es.dose[c.k] || '',
            onInput: (ev) => { es.dose[c.k] = ev.target.value; }
          })))),
      h('div', { class: 'form-grid' },
        campo('Progressione', 'progressione', { w: 'w-half', righe: 2 }),
        campo('Regressione', 'regressione', { w: 'w-half', righe: 2 })),

      h('h3', { class: 'ant-sez' }, 'Sicurezza'),
      h('div', { class: 'form-grid' },
        campo('Dolore ammesso', 'doloreAmmesso', { w: 'w-half', righe: 2, hint: 'Quanto fastidio è accettabile e entro quando deve rientrare.' }),
        campo('Precauzioni', 'precauzioni', { w: 'w-half', righe: 2, hint: 'Quando non farlo, quando fermarsi.' })),

      h('h3', { class: 'ant-sez' }, 'Immagini'),
      h('p', { class: 'faint small' },
        'Le foto vengono ridotte e salvate nell’archivio locale, quindi finiscono anche nei backup: tienine poche per esercizio.'),
      galleria,
      h('div', { class: 'btn-row', style: { marginTop: '8px' } },
        h('button', { type: 'button', class: 'btn btn-sm', onClick: aggiungiImmagine }, '📷 Aggiungi immagine')),

      h('h3', { class: 'ant-sez' }, 'Video'),
      h('p', { class: 'faint small' },
        'I video restano collegamenti (YouTube, Vimeo, un file sul tuo computer): non vengono copiati nell’archivio, ' +
        'che diventerebbe enorme. Se il video è privato, verifica che il paziente possa aprirlo.'),
      elencoVideo,
      h('div', { class: 'btn-row', style: { marginTop: '8px' } },
        h('button', {
          type: 'button', class: 'btn btn-sm',
          onClick: () => { es.video.push({ titolo: '', url: '' }); disegnaVideo(); }
        }, '▶ Aggiungi video')),

      h('div', { class: 'form-grid', style: { marginTop: '12px' } },
        campo('Note interne', 'note', { w: 'w-full', righe: 2, hint: 'Non compaiono sulla scheda del paziente.' }))),
    actions: [
      { label: 'Annulla' },
      {
        label: 'Salva', class: 'btn-primary', keepOpen: true, onClick: async (chiudi) => {
          if (!es.nome.trim()) { toast('Il nome è obbligatorio.', 'err'); return false; }
          es.modificatoIl = todayISO();
          if (!es.creatoIl) es.creatoIl = todayISO();
          const salvato = await db.put('esercizi', es);
          chiudi();
          toast('Esercizio salvato.', 'ok');
          if (alSalvataggio) alSalvataggio(salvato);
          else S.aggiorna();
        }
      }
    ]
  });
}

async function duplica(es) {
  const copia = { ...JSON.parse(JSON.stringify(es)), id: undefined, nome: es.nome + ' (copia)', origine: 'mio' };
  delete copia.id;
  const salvato = await db.put('esercizi', { ...copia, creatoIl: todayISO() });
  toast('Esercizio duplicato.', 'ok');
  S.vai('/esercizi/' + salvato.id);
}

async function elimina(es) {
  if (!await conferma(`Eliminare “${es.nome}” dalla libreria? I programmi già consegnati restano invariati.`,
    { title: 'Elimina esercizio', okLabel: 'Elimina', danger: true })) return;
  await db.del('esercizi', es.id);
  toast('Esercizio eliminato.', 'ok');
  S.vai('/esercizi');
}

/* ------------------------------------------------------------------ */
/* Scambio della libreria fra computer                                 */
/* ------------------------------------------------------------------ */
function esportaLibreria(esercizi) {
  downloadFile(`esercizi-${todayISO()}.json`,
    JSON.stringify({ tipo: 'libreria-esercizi-ompt', esportatoIl: todayISO(), esercizi }, null, 2));
  toast(`${esercizi.length} esercizi esportati.`, 'ok');
}

async function importaLibreria() {
  const file = await pickFile('.json,application/json');
  if (!file) return;
  let dati;
  try { dati = JSON.parse(await readFileText(file)); }
  catch { toast('Il file non è un JSON valido.', 'err'); return; }
  const voci = Array.isArray(dati?.esercizi) ? dati.esercizi : Array.isArray(dati) ? dati : null;
  if (!voci) { toast('Il file non contiene una libreria di esercizi.', 'err'); return; }

  const presenti = await db.all('esercizi');
  const perNome = new Map(presenti.map(x => [(x.nome || '').toLowerCase().trim(), x]));
  let nuovi = 0, saltati = 0;
  for (const v of voci) {
    if (!v?.nome) continue;
    if (perNome.has(v.nome.toLowerCase().trim())) { saltati++; continue; }
    await db.put('esercizi', { ...v, id: undefined, creatoIl: todayISO() });
    nuovi++;
  }
  toast(`${nuovi} esercizi aggiunti${saltati ? `, ${saltati} già presenti e saltati` : ''}.`, 'ok');
  S.aggiorna();
}
