/* ============================================================
   Generazione dei documenti cartacei:
   fattura, cartella clinica, informativa e consensi.
   ============================================================ */
import { h, clear, fmtDate, fmtDateLong, fmtEUR, fullName, nz, age, isEmptyVal, toast } from './util.js';
import { calcolaTotali, numeroCompleto, noteFattura } from './fatture.js';
import { CARTELLA, SEDUTA } from './schema/ompt.js';
import { doseInRiga } from './schema/esercizi.js';
import { PROMS, calcolaProm } from './schema/proms.js';

/* ------------------------------------------------------------------ */
/* Helper comuni                                                       */
/* ------------------------------------------------------------------ */
/** Riquadro con il logo, se caricato. L'altezza e' quella impostata dall'utente. */
export function logoStudio(imp) {
  if (!imp?.logo) return null;
  const mm = Number(imp.logoAltezzaMm) || 18;
  return h('img', {
    src: imp.logo,
    alt: '',
    class: 'doc-logo',
    style: { height: mm + 'mm', width: 'auto', maxWidth: '60mm', display: 'block', marginBottom: '2mm' }
  });
}

/** Firma scansionata, da apporre sopra la riga di firma. */
export function firmaStudio(imp) {
  if (!imp?.firma) return null;
  const mm = Number(imp.firmaAltezzaMm) || 15;
  return h('img', {
    src: imp.firma, alt: '',
    style: { height: mm + 'mm', width: 'auto', maxWidth: '55mm', display: 'block', margin: '0 auto -1mm' }
  });
}

export function intestazioneStudio(imp) {
  const nome = [imp.titolo, imp.nome, imp.cognome].filter(Boolean).join(' ').trim() || 'Studio di Fisioterapia';
  const via = [imp.indirizzo, [imp.cap, imp.citta].filter(Boolean).join(' '), imp.provincia ? `(${imp.provincia})` : '']
    .filter(Boolean).join(' — ');
  const righe = [];
  if (via) righe.push(via);
  const contatti = [imp.telefono && `Tel. ${imp.telefono}`, imp.email].filter(Boolean).join(' — ');
  if (contatti) righe.push(contatti);
  if (imp.partitaIva) righe.push(`P. IVA ${imp.partitaIva}`);
  if (imp.codiceFiscale && imp.codiceFiscale !== imp.partitaIva) righe.push(`C.F. ${imp.codiceFiscale}`);
  const albo = [imp.albo, imp.numeroAlbo && `n. ${imp.numeroAlbo}`, imp.ordineProvincia && `— ${imp.ordineProvincia}`]
    .filter(Boolean).join(' ');
  if (albo.trim()) righe.push(albo);
  return { nome, righe };
}

const blocco = (label, valore) => isEmptyVal(valore) ? null :
  h('div', { class: 'blk' }, h('span', { class: 'blk-l' }, label + ': '),
    h('span', { class: 'blk-v' }, Array.isArray(valore) ? valore.join(' · ') : String(valore)));

/* ------------------------------------------------------------------ */
/* Adattamento a una sola pagina                                       */
/* ------------------------------------------------------------------ */
const MM = 96 / 25.4;                    // pixel CSS per millimetro a 96 dpi
const ALTEZZA_UTILE_MM = 297 - 14 - 16;  // A4 meno i margini di @page
const LARGHEZZA_UTILE_MM = 210 - 14 - 14;
const BASE_PT = 10.5;
const MIN_PT = 7.5;

/**
 * Riduce la dimensione di base del documento finche' non entra in una pagina A4.
 * Il documento va gia' inserito nel DOM: l'altezza si puo' misurare solo da reso.
 * Sotto MIN_PT si rinuncia e si lascia impaginare su due pagine, perche' una
 * fattura illeggibile sarebbe peggio di una fattura su due fogli.
 * @returns {{adattato:boolean, punti:number}}
 */
export function adattaAUnaPagina(doc) {
  const massimo = ALTEZZA_UTILE_MM * MM;
  doc.style.fontSize = BASE_PT + 'pt';
  if (doc.getBoundingClientRect().height <= massimo) return { adattato: true, punti: BASE_PT };

  for (let pt = BASE_PT - 0.25; pt >= MIN_PT; pt -= 0.25) {
    doc.style.fontSize = pt + 'pt';
    if (doc.getBoundingClientRect().height <= massimo) return { adattato: true, punti: pt };
  }
  doc.style.fontSize = MIN_PT + 'pt';
  return { adattato: false, punti: MIN_PT };
}

/** Contenitore di misura fuori schermo, con la larghezza reale della pagina stampata. */
function conMisurazione(nodo, azione) {
  const culla = h('div', {
    style: {
      position: 'absolute', left: '-10000px', top: '0',
      width: LARGHEZZA_UTILE_MM + 'mm', visibility: 'hidden'
    },
    class: 'print-preview'
  }, nodo);
  document.body.appendChild(culla);
  try {
    return azione(nodo);
  } finally {
    culla.remove();
  }
}

/** Invia in stampa il nodo costruito. */
function stampa(nodo) {
  const root = document.getElementById('printRoot');
  clear(root).appendChild(nodo);
  const pulisci = () => { clear(root); removeEventListener('afterprint', pulisci); };
  addEventListener('afterprint', pulisci);
  setTimeout(() => window.print(), 60);
}

/* ------------------------------------------------------------------ */
/* FATTURA                                                             */
/* ------------------------------------------------------------------ */
export function documentoFattura(fattura, paziente, imp, { etichettaCopia = '' } = {}) {
  const tot = calcolaTotali(fattura, imp);
  const emittente = intestazioneStudio(imp);
  const tipo = fattura.tipoDocumento || imp.tipoDocumento || 'Fattura';

  const indirizzoPaz = [
    paziente?.indirizzo,
    [paziente?.cap, paziente?.citta].filter(Boolean).join(' '),
    paziente?.provincia ? `(${paziente.provincia})` : ''
  ].filter(Boolean).join(' — ');

  const doc = h('div', { class: 'doc' });

  doc.appendChild(h('div', { class: 'doc-head' },
    h('div', { class: 'issuer' },
      logoStudio(imp),
      h('div', { class: 'issuer-name' }, emittente.nome),
      imp.qualifica ? h('div', { class: 'issuer-role' }, imp.qualifica) : null,
      emittente.righe.map(r => h('div', r))),
    h('div', { class: 'doc-title' },
      h('h1', tipo),
      h('div', { class: 'doc-meta' },
        h('div', h('strong', 'N. ' + numeroCompleto(fattura))),
        h('div', 'del ' + fmtDate(fattura.data))),
      etichettaCopia ? h('div', { class: 'copy-mark' }, etichettaCopia) : null)
  ));

  doc.appendChild(h('div', { class: 'party' },
    h('div', { class: 'party-label' }, 'Intestatario'),
    h('div', { class: 'party-name' }, fullName(paziente) || fattura.intestatario || '—'),
    indirizzoPaz ? h('div', indirizzoPaz) : null,
    paziente?.codiceFiscale ? h('div', 'C.F. ' + paziente.codiceFiscale) : null,
    paziente?.partitaIva ? h('div', 'P. IVA ' + paziente.partitaIva) : null
  ));

  const righe = (fattura.righe || []).filter(r => !isEmptyVal(r.descrizione) || Number(r.prezzo));
  doc.appendChild(h('table', { class: 'inv' },
    h('thead', h('tr',
      h('th', { style: 'width:52%' }, 'Descrizione della prestazione'),
      h('th', { style: 'width:18%' }, 'Data/e'),
      h('th', { class: 'cnt', style: 'width:8%' }, 'Q.tà'),
      h('th', { class: 'num', style: 'width:11%' }, 'Prezzo'),
      h('th', { class: 'num', style: 'width:11%' }, 'Importo'))),
    h('tbody', righe.map(r => h('tr',
      h('td', r.descrizione || '—'),
      h('td', r.data && r.data.includes('…')
        ? r.data.split('…').map(s => fmtDate(s.trim())).join(' – ')
        : fmtDate(r.data)),
      h('td', { class: 'cnt' }, String(Number(r.quantita) || 1)),
      h('td', { class: 'num' }, fmtEUR(r.prezzo)),
      h('td', { class: 'num' }, fmtEUR((Number(r.quantita) || 1) * (Number(r.prezzo) || 0))))))
  ));

  const riga = (l, v, cls = '') => h('div', { class: cls }, h('span', l), h('span', { class: 'num' }, v));
  const totali = h('div', { class: 'totals avoid-break' });
  if (tot.sconto) {
    totali.appendChild(riga('Totale prestazioni', fmtEUR(tot.imponibileLordo)));
    totali.appendChild(riga('Sconto', '− ' + fmtEUR(tot.sconto)));
  }
  totali.appendChild(riga(tot.esente ? 'Imponibile (esente IVA art. 10 n. 18)' : 'Imponibile', fmtEUR(tot.imponibile)));
  if (tot.rivalsa) totali.appendChild(riga(`Rivalsa INPS ${tot.rivalsaPerc}%`, fmtEUR(tot.rivalsa)));
  if (tot.iva) totali.appendChild(riga(`IVA ${tot.aliquotaIva}%`, fmtEUR(tot.iva)));
  if (tot.bolloDovuto) {
    totali.appendChild(riga(
      tot.bolloAddebitato ? 'Imposta di bollo (art. 15 D.P.R. 633/72)' : 'Imposta di bollo assolta sull’originale',
      tot.bolloAddebitato ? fmtEUR(tot.bollo) : '—'));
  }
  totali.appendChild(riga('Totale documento', fmtEUR(tot.totaleDocumento), 'grand'));
  if (tot.ritenuta) {
    totali.appendChild(riga(`Ritenuta d’acconto ${tot.ritenutaPerc}%`, '− ' + fmtEUR(tot.ritenuta)));
    totali.appendChild(riga('Netto a pagare', fmtEUR(tot.nettoAPagare), 'grand'));
  }
  doc.appendChild(totali);

  const note = h('div', { class: 'notes' });
  if (tot.bolloDovuto && !tot.bolloAddebitato) {
    note.appendChild(h('div', { class: 'stamp-box' }, 'spazio per marca da bollo € 2,00'));
  } else if (tot.bolloDovuto) {
    note.appendChild(h('div', { class: 'stamp-box' }, 'marca da bollo € 2,00 da apporre sull’originale'));
  }
  const pag = [];
  if (fattura.metodoPagamento) pag.push('Modalità di pagamento: ' + fattura.metodoPagamento + '.');
  if (fattura.scadenza) pag.push('Pagamento entro il ' + fmtDate(fattura.scadenza) + '.');
  if (imp.iban && /bonifico/i.test(fattura.metodoPagamento || '')) {
    pag.push('IBAN: ' + imp.iban + (imp.banca ? ' — ' + imp.banca : '') + '.');
  }
  if (fattura.note) pag.push(fattura.note);
  if (pag.length) note.appendChild(h('p', h('strong', pag.join(' '))));
  for (const n of noteFattura(fattura, imp, tot)) note.appendChild(h('p', n));
  doc.appendChild(note);

  // Sulla fattura firma solo chi la emette: il documento attesta la prestazione
  // e il corrispettivo, e non richiede la sottoscrizione del paziente.
  doc.appendChild(h('div', { class: 'sign-row sign-row-single avoid-break' },
    h('div', { class: 'sign-col' },
      imp.firmaInFattura ? firmaStudio(imp) : null,
      h('div', { class: 'sign' }, 'Firma del professionista'))));

  return doc;
}

/**
 * @param {object} opzioni  { copie } per forzare il numero di copie
 *   (una sola, per esempio, quando il documento va inviato via e-mail).
 */
export function stampaFattura(fattura, paziente, imp, opzioni = {}) {
  const copie = Math.max(1, Number(opzioni.copie ?? imp.copiePerFattura) || 1);
  const etichette = copie >= 2 ? ['Originale per il paziente', 'Copia per il professionista', 'Copia'] : [''];
  const wrap = h('div');
  let esito = { adattato: true, punti: BASE_PT };
  for (let i = 0; i < copie; i++) {
    const doc = documentoFattura(fattura, paziente, imp, { etichettaCopia: etichette[Math.min(i, etichette.length - 1)] });
    // Ogni copia viene misurata e rimpicciolita quanto basta a stare in un foglio.
    esito = conMisurazione(doc, adattaAUnaPagina);
    wrap.appendChild(doc);
  }
  if (!esito.adattato) {
    toast('La fattura ha troppe righe per stare in una pagina: verrà stampata su due fogli.');
  }
  stampa(wrap);
}

/* ------------------------------------------------------------------ */
/* CARTELLA CLINICA                                                    */
/* ------------------------------------------------------------------ */
export function valoreLeggibile(f, v) {
  if (isEmptyVal(v)) return null;
  if (f.t === 'body') {
    const m = v.marcatori || [];
    if (!m.length) return null;
    return m.sort((a, b) => a.n - b.n)
      .map(x => `[${x.n}] ${x.vista === 'front' ? 'anteriore' : 'posteriore'} — ${x.tipo}${x.nota ? ': ' + x.nota : ''}`)
      .join('\n');
  }
  if (Array.isArray(v)) {
    if (!v.length) return null;
    if (typeof v[0] === 'object') return v;   // tabella: gestita a parte
    return v.join(' · ');
  }
  if (f.t === 'scale') return `${v}/10`;
  // Le date si leggono nel formato italiano, non come le salva il browser.
  if (f.t === 'date') return fmtDate(v);
  return String(v);
}

function tabellaStampa(f, righe) {
  const cols = f.cols || Object.keys(righe[0] || {}).map(k => ({ k, l: k }));
  return h('table', { class: 'grid-t avoid-break' },
    h('thead', h('tr', cols.map(c => h('th', c.l)))),
    h('tbody', righe.map(r => h('tr', cols.map(c => h('td', nz(r[c.k], '—')))))));
}

function sezioneStampa(sez, dati) {
  const v = dati?.[sez.id] || {};
  const contenuti = [];
  for (const f of sez.fields) {
    if (f.t === 'info') continue;
    const val = valoreLeggibile(f, v[f.k]);
    if (val == null) continue;
    if (Array.isArray(val)) {
      contenuti.push(h('h3', { class: 'sub-h' }, f.l));
      contenuti.push(tabellaStampa(f, val));
    } else {
      contenuti.push(blocco(f.l, val));
    }
  }
  if (!contenuti.length) return null;
  return h('div', { class: 'avoid-break' }, h('h2', { class: 'sec-h' }, sez.title), contenuti);
}

export function documentoCartella(episodio, paziente, sedute, imp, promCompilazioni = [], { includiSedute = true } = {}) {
  const emittente = intestazioneStudio(imp);
  const doc = h('div', { class: 'doc' });

  doc.appendChild(h('div', { class: 'rec-title' },
    imp.logoInDocumentiClinici && imp.logo
      ? h('div', { style: { display: 'flex', justifyContent: 'center', marginBottom: '2mm' } }, logoStudio(imp))
      : null,
    h('h1', 'Cartella clinica fisioterapica'),
    h('div', { class: 'sub' }, 'Valutazione e trattamento secondo il modello di ragionamento clinico OMPT / IFOMPT'),
    h('div', { class: 'sub' }, emittente.nome + (imp.qualifica ? ' — ' + imp.qualifica : ''))));

  const anni = age(paziente?.dataNascita);
  doc.appendChild(h('dl', { class: 'kv' },
    h('dt', 'Paziente'), h('dd', fullName(paziente) || '—'),
    h('dt', 'Data di nascita'), h('dd', `${fmtDate(paziente?.dataNascita) || '—'}${anni != null ? ` (${anni} anni)` : ''}`),
    h('dt', 'Codice fiscale'), h('dd', nz(paziente?.codiceFiscale)),
    h('dt', 'Episodio di cura'), h('dd', nz(episodio?.titolo)),
    h('dt', 'Data di apertura'), h('dd', fmtDate(episodio?.dataApertura) || '—'),
    h('dt', 'Regione interessata'), h('dd', nz(episodio?.regione)),
    h('dt', 'Stato'), h('dd', episodio?.chiuso ? 'Chiuso il ' + fmtDate(episodio.dataChiusura) : 'In corso')
  ));

  for (const parte of CARTELLA) {
    const dati = episodio?.cartella?.[parte.key] || {};
    const sezioni = parte.sections.map(s => sezioneStampa(s, dati)).filter(Boolean);
    if (!sezioni.length) continue;
    doc.appendChild(h('h2', { class: 'sec-h' }, parte.label.toUpperCase()));
    doc.appendChild(h('div', sezioni));
  }

  if (promCompilazioni.length) {
    doc.appendChild(h('h2', { class: 'sec-h' }, 'Questionari (PROM)'));
    doc.appendChild(h('table', { class: 'grid-t' },
      h('thead', h('tr', h('th', 'Data'), h('th', 'Questionario'), h('th', 'Punteggio'), h('th', 'Note'))),
      h('tbody', promCompilazioni.map(c => {
        const r = calcolaProm(c.promId, c.valori);
        return h('tr', h('td', fmtDate(c.data)), h('td', PROMS[c.promId]?.nome || c.promId),
          h('td', r ? r.etichetta : 'incompleto'), h('td', nz(c.note, '')));
      }))));
  }

  if (includiSedute && sedute.length) {
    doc.appendChild(h('h2', { class: 'sec-h' }, 'Diario delle sedute (SOAP)'));
    for (const s of sedute) {
      const blocchi = [];
      for (const sez of SEDUTA) {
        const v = s.dati?.[sez.id] || {};
        for (const f of sez.fields) {
          const val = valoreLeggibile(f, v[f.k]);
          if (val == null) continue;
          if (Array.isArray(val)) { blocchi.push(h('h3', { class: 'sub-h' }, f.l)); blocchi.push(tabellaStampa(f, val)); }
          else blocchi.push(blocco(f.l, val));
        }
      }
      doc.appendChild(h('div', { class: 'avoid-break', style: 'margin-bottom:4mm' },
        h('h3', { class: 'sub-h' },
          `Seduta n. ${s.numero || '—'} — ${fmtDate(s.data)}${s.durata ? ` (${s.durata} min)` : ''}${s.prestazione ? ' — ' + s.prestazione : ''}`),
        blocchi.length ? blocchi : h('div', { class: 'blk' }, 'Nessuna annotazione.')));
    }
  }

  doc.appendChild(h('div', { class: 'footer-note' },
    `Documento generato il ${fmtDateLong(new Date().toLocaleDateString('sv-SE'))}. ` +
    `Contiene dati appartenenti a categorie particolari (art. 9 Reg. UE 2016/679): conservare in luogo sicuro e consegnare solo all’interessato o a soggetti da lui autorizzati. ` +
    `Conservazione prevista: ${imp.conservazioneAnni || 10} anni.`));

  doc.appendChild(h('div', { class: 'sign-row avoid-break' },
    h('div', { class: 'sign-col' },
      imp.firmaInDocumentiClinici ? firmaStudio(imp) : null,
      h('div', { class: 'sign' }, 'Firma del fisioterapista')),
    h('div', { class: 'sign-col' }, h('div', { class: 'sign' }, 'Data'))));

  return doc;
}

export function stampaCartella(...args) { stampa(documentoCartella(...args)); }

/* ------------------------------------------------------------------ */
/* MODULISTICA: informativa privacy e consensi                         */
/* ------------------------------------------------------------------ */
const p = (...t) => h('p', ...t);

export function documentoModulo(tipo, paziente, imp) {
  const emittente = intestazioneStudio(imp);
  const titolare = imp.titolareTrattamento || emittente.nome;
  const doc = h('div', { class: 'doc' });

  doc.appendChild(h('div', { class: 'doc-head' },
    h('div', { class: 'issuer' },
      imp.logoInDocumentiClinici ? logoStudio(imp) : null,
      h('div', { class: 'issuer-name' }, emittente.nome),
      imp.qualifica ? h('div', { class: 'issuer-role' }, imp.qualifica) : null,
      emittente.righe.map(r => h('div', r))),
    h('div', { class: 'doc-title' }, h('h1', { style: 'font-size:1.143em' }, TITOLI[tipo] || 'Modulo'))));

  const anagrafica = h('div', { class: 'party' },
    h('div', { class: 'party-label' }, 'Il/La sottoscritto/a'),
    h('div', { class: 'party-name' }, fullName(paziente) || '________________________________________'),
    h('div', `nato/a il ${fmtDate(paziente?.dataNascita) || '____/____/________'}${paziente?.luogoNascita ? ' a ' + paziente.luogoNascita : ''}`),
    h('div', 'C.F. ' + nz(paziente?.codiceFiscale, '________________________')));
  doc.appendChild(anagrafica);

  doc.appendChild(h('div', { class: 'consent-body' }, CORPI[tipo](titolare, imp)));

  doc.appendChild(h('div', { class: 'sign-row avoid-break' },
    h('div', { class: 'sign' }, 'Luogo e data'),
    h('div', { class: 'sign' }, 'Firma del paziente (o di chi esercita la responsabilità genitoriale)')));

  return doc;
}

const TITOLI = {
  privacy: 'Informativa e consenso al trattamento dei dati personali',
  trattamento: 'Consenso informato al trattamento fisioterapico',
  manipolazione: 'Consenso informato alle tecniche di terapia manuale e manipolativa',
  minore: 'Consenso al trattamento di paziente minorenne'
};

const CORPI = {
  privacy: (titolare, imp) => [
    p('dichiara di aver ricevuto l’informativa resa ai sensi degli artt. 13 e 14 del Regolamento UE 2016/679 (GDPR) e di essere stato informato di quanto segue.'),
    h('ol', { style: 'padding-left:6mm' },
      h('li', h('strong', 'Titolare del trattamento: '), titolare, imp.email ? ` — ${imp.email}` : '', imp.dpoContatto ? ` — Referente per la protezione dei dati: ${imp.dpoContatto}` : ''),
      h('li', h('strong', 'Finalità: '), 'esecuzione della valutazione e del trattamento fisioterapico, compilazione e conservazione della cartella clinica, adempimenti amministrativi, contabili e fiscali connessi alla prestazione sanitaria.'),
      h('li', h('strong', 'Base giuridica: '), 'art. 6, par. 1, lett. b) e c) e art. 9, par. 2, lett. h) GDPR — trattamento necessario per finalità di medicina preventiva, diagnosi e terapia sanitaria, nonché per obblighi di legge.'),
      h('li', h('strong', 'Categorie di dati: '), 'dati anagrafici e di contatto, dati relativi alla salute (categoria particolare, art. 9 GDPR), dati fiscali necessari alla fatturazione.'),
      h('li', h('strong', 'Destinatari: '), 'i dati non sono diffusi. Possono essere comunicati, solo se necessario, al professionista incaricato degli adempimenti contabili e fiscali, al Sistema Tessera Sanitaria per la dichiarazione dei redditi precompilata (salvo opposizione dell’interessato), e alle autorità nei casi previsti dalla legge.'),
      h('li', h('strong', 'Conservazione: '), `la documentazione sanitaria è conservata per ${imp.conservazioneAnni || 10} anni; i documenti fiscali per il periodo previsto dalla normativa tributaria.`),
      h('li', h('strong', 'Diritti dell’interessato: '), 'accesso, rettifica, cancellazione, limitazione, opposizione e portabilità (artt. 15-22 GDPR), nonché diritto di proporre reclamo al Garante per la protezione dei dati personali.'),
      h('li', h('strong', 'Natura del conferimento: '), 'il conferimento dei dati sanitari è necessario per l’erogazione della prestazione; il rifiuto rende impossibile procedere al trattamento fisioterapico.')),
    p(h('strong', 'Dichiarazione di consenso')),
    p('Preso atto dell’informativa, il/la sottoscritto/a:'),
    h('ul', { style: 'padding-left:1.4em; list-style:none' },
      h('li', '☐ presta   ☐ nega   il consenso al trattamento dei propri dati relativi alla salute per le finalità di cura sopra indicate;'),
      h('li', '☐ presta   ☐ nega   il consenso all’invio dei dati di spesa sanitaria al Sistema Tessera Sanitaria (in caso di opposizione la spesa non comparirà nella dichiarazione precompilata);'),
      h('li', '☐ presta   ☐ nega   il consenso all’invio di comunicazioni relative agli appuntamenti tramite telefono, SMS o e-mail;'),
      h('li', '☐ presta   ☐ nega   il consenso alla comunicazione di informazioni sul proprio stato di salute ai seguenti familiari: ________________________________.'))
  ],

  trattamento: (titolare, imp) => [
    p('dichiara di essere stato/a informato/a in modo chiaro e comprensibile, con possibilità di porre domande e ricevere risposte, in merito al percorso fisioterapico proposto.'),
    h('ol', { style: 'padding-left:6mm' },
      h('li', h('strong', 'Valutazione: '), 'il percorso inizia con una valutazione che comprende raccolta anamnestica, esame fisico, test di movimento, palpazione ed eventuali test neurologici e neurodinamici, finalizzata a formulare una diagnosi fisioterapica.'),
      h('li', h('strong', 'Trattamento proposto: '), 'può comprendere educazione e informazione sul dolore, esercizio terapeutico, tecniche di terapia manuale, mobilizzazioni articolari e dei tessuti molli, tecniche neurodinamiche, terapia fisica strumentale e programma di esercizi a domicilio.'),
      h('li', h('strong', 'Benefici attesi: '), 'riduzione del dolore, recupero della mobilità e della forza, miglioramento della funzione e della capacità di svolgere le attività quotidiane, lavorative e sportive.'),
      h('li', h('strong', 'Effetti indesiderati possibili: '), 'indolenzimento muscolare transitorio, aumento temporaneo dei sintomi nelle 24-48 ore successive alla seduta, affaticamento, in rari casi ematomi superficiali o reazioni cutanee. Tali eventi sono generalmente lievi e autolimitanti.'),
      h('li', h('strong', 'Alternative: '), 'sono state illustrate le alternative disponibili, compresa l’astensione dal trattamento, con i relativi vantaggi e svantaggi.'),
      h('li', h('strong', 'Collaborazione richiesta: '), 'il risultato dipende anche dall’aderenza al programma di esercizi e alle indicazioni ricevute. È necessario segnalare tempestivamente ogni variazione dei sintomi o del proprio stato di salute, l’assunzione di nuovi farmaci e ogni nuova diagnosi.'),
      h('li', h('strong', 'Revocabilità: '), 'il consenso può essere revocato in qualsiasi momento, senza conseguenze sul diritto a ricevere assistenza.')),
    p('Il/La sottoscritto/a, ritenendo di aver compreso quanto esposto,'),
    p(h('strong', '☐ ACCONSENTE      ☐ NON ACCONSENTE'), ' all’esecuzione del trattamento fisioterapico proposto.')
  ],

  manipolazione: (titolare, imp) => [
    p('dichiara di essere stato/a specificamente informato/a in merito alle tecniche di terapia manuale, comprese le tecniche di mobilizzazione e le tecniche manipolative ad alta velocità e bassa ampiezza (HVLA), che potranno essere applicate nel corso del trattamento.'),
    h('ol', { style: 'padding-left:6mm' },
      h('li', h('strong', 'In che cosa consistono: '), 'la mobilizzazione è un movimento passivo, lento e graduato, dell’articolazione. La manipolazione è una spinta rapida e di piccola ampiezza, condotta entro il limite anatomico dell’articolazione, spesso accompagnata da un rumore articolare (cavitazione), che non indica danno.'),
      h('li', h('strong', 'Benefici attesi: '), 'riduzione del dolore e miglioramento della mobilità articolare, generalmente in associazione all’esercizio terapeutico.'),
      h('li', h('strong', 'Effetti indesiderati comuni e transitori: '), 'indolenzimento locale, rigidità, stanchezza, cefalea, che si risolvono di norma entro 24-48 ore.'),
      h('li', h('strong', 'Eventi avversi gravi: '), 'sono rari. In letteratura sono descritti, a carico del rachide cervicale, eventi di natura vascolare (fra cui la dissezione dell’arteria vertebrale o carotidea) e, più in generale, lesioni neurologiche o fratture in presenza di fragilità ossea. Per ridurre tale rischio viene eseguito uno screening specifico dei fattori di rischio e dei segni e sintomi di allarme, secondo il quadro di riferimento internazionale IFOMPT per l’esame della regione cervicale.'),
      h('li', h('strong', 'Controindicazioni: '), 'la tecnica non viene eseguita in presenza di controindicazioni quali sospetta frattura o instabilità, osteoporosi severa, neoplasia, infezione, terapia anticoagulante non controllata, sintomi neurologici progressivi, segni di disfunzione arteriosa cervicale, artrite reumatoide con coinvolgimento del rachide cervicale superiore.'),
      h('li', h('strong', 'Alternative: '), 'sono disponibili approcci alternativi (mobilizzazione a bassa velocità, esercizio terapeutico, educazione) che possono essere adottati in luogo della manipolazione, su preferenza del paziente.'),
      h('li', h('strong', 'Revocabilità: '), 'il consenso può essere revocato in qualunque momento, anche durante la seduta.')),
    p('Il/La sottoscritto/a dichiara di aver compreso le informazioni ricevute, di aver avuto la possibilità di porre domande e di aver ottenuto risposte soddisfacenti, e pertanto'),
    p(h('strong', '☐ ACCONSENTE      ☐ NON ACCONSENTE'), ' all’esecuzione di tecniche di terapia manuale, comprese le tecniche manipolative ad alta velocità e bassa ampiezza.'),
    p({ class: 'small' }, 'Distretti per i quali il consenso è prestato: ☐ rachide cervicale  ☐ rachide dorsale  ☐ rachide lombare  ☐ arti  ☐ altro: ______________________')
  ],

  minore: (titolare, imp) => [
    p('in qualità di ☐ genitore ☐ tutore ☐ soggetto esercente la responsabilità genitoriale del/della minore:'),
    p(h('strong', 'Cognome e nome del minore: '), '_________________________________________  nato/a il ____/____/________'),
    p('dichiara di aver ricevuto l’informativa sul trattamento dei dati personali e le informazioni relative al percorso fisioterapico proposto, di averne compreso finalità, benefici attesi, possibili effetti indesiderati e alternative, e'),
    p(h('strong', '☐ ACCONSENTE      ☐ NON ACCONSENTE'), ' all’esecuzione della valutazione e del trattamento fisioterapico sul minore sopra indicato, nonché al trattamento dei relativi dati sanitari per le finalità di cura.'),
    p({ class: 'small' }, 'In caso di esercizio congiunto della responsabilità genitoriale, il consenso si intende prestato da entrambi i genitori. Il firmatario dichiara, sotto la propria responsabilità, di agire anche in nome e per conto dell’altro genitore.'),
    h('div', { class: 'sign-row' },
      h('div', { class: 'sign' }, 'Firma del primo genitore/tutore'),
      h('div', { class: 'sign' }, 'Firma del secondo genitore (se presente)'))
  ]
};

export function stampaModulo(tipo, paziente, imp) {
  const doc = documentoModulo(tipo, paziente, imp);
  // Un consenso che finisce su due fogli e' scomodo da far firmare e archiviare.
  const esito = conMisurazione(doc, adattaAUnaPagina);
  if (!esito.adattato) toast('Il modulo non entra in una pagina: verrà stampato su due fogli.');
  stampa(doc);
}

export const MODULI = Object.entries(TITOLI).map(([k, v]) => ({ key: k, label: v }));

/** Anteprima a schermo di un documento gia' costruito. */
export const anteprima = (nodo) => h('div', { class: 'print-preview' }, nodo);
export { stampa as inviaInStampa };

/* ------------------------------------------------------------------ */
/* ESERCIZI: scheda singola e programma per il paziente                */
/* ------------------------------------------------------------------ */

/** Blocco di un esercizio, riusato dalla scheda singola e dal programma. */
function bloccoEsercizio(es, dose, note, numero) {
  const riga = (etichetta, valore) => valore
    ? h('div', { class: 'ex-riga' }, h('span', { class: 'ex-lbl' }, etichetta), h('span', valore))
    : null;
  const punti = (etichetta, voci) => voci?.length
    ? h('div', { class: 'ex-riga' },
      h('span', { class: 'ex-lbl' }, etichetta),
      h('ul', { class: 'ex-ul' }, voci.map(v => h('li', v))))
    : null;

  const foto = (es.immagini || []).slice(0, 2);
  return h('div', { class: 'ex avoid-break' },
    h('h3', { class: 'ex-nome' }, (numero ? numero + '. ' : '') + es.nome),
    es.obiettivo ? h('div', { class: 'ex-obiettivo' }, es.obiettivo) : null,
    foto.length
      ? h('div', { class: 'ex-foto' }, foto.map(im => h('figure', null,
        h('img', { src: im.dataUrl, alt: '' }),
        im.didascalia ? h('figcaption', im.didascalia) : null)))
      : null,
    h('div', { class: 'ex-corpo' },
      riga('Posizione', es.posizione),
      riga('Esecuzione', es.esecuzione),
      riga('Respirazione', es.respirazione),
      punti('Punti chiave', es.puntiChiave),
      punti('Errori da evitare', es.erroriComuni),
      riga('Attrezzatura', (es.attrezzatura || []).join(', ')),
      h('div', { class: 'ex-riga ex-dose' },
        h('span', { class: 'ex-lbl' }, 'Quanto'),
        h('span', h('strong', doseInRiga(dose) || 'da concordare'))),
      riga('Se fa male', es.doloreAmmesso),
      riga('Attenzione', es.precauzioni),
      riga('Nota per te', note),
      (es.video || []).length
        ? h('div', { class: 'ex-riga' },
          h('span', { class: 'ex-lbl' }, 'Video'),
          h('span', es.video.map(v => h('div', { class: 'ex-url' }, (v.titolo ? v.titolo + ': ' : '') + v.url))))
        : null));
}

/** Scheda di un singolo esercizio, per la libreria. */
export function documentoEsercizio(es, imp = {}) {
  const doc = h('div', { class: 'doc' });
  doc.appendChild(h('div', { class: 'rec-title' },
    h('h1', es.nome),
    h('div', { class: 'sub' }, [es.regione, es.categoria].filter(Boolean).join(' · '))));
  doc.appendChild(bloccoEsercizio(es, es.dose, ''));
  if (es.progressione || es.regressione) {
    doc.appendChild(h('div', { class: 'ex avoid-break' },
      es.progressione ? h('div', { class: 'ex-riga' }, h('span', { class: 'ex-lbl' }, 'Progressione'), h('span', es.progressione)) : null,
      es.regressione ? h('div', { class: 'ex-riga' }, h('span', { class: 'ex-lbl' }, 'Regressione'), h('span', es.regressione)) : null));
  }
  return doc;
}

export function stampaEsercizio(es, imp = {}) { stampa(documentoEsercizio(es, imp)); }

/**
 * Programma domiciliare da consegnare al paziente.
 * @param {object} programma  { voci:[{esercizio, dose, note}], note, aggiornatoIl }
 */
export function documentoProgramma(programma, paziente, imp, episodio) {
  const emittente = intestazioneStudio(imp);
  const doc = h('div', { class: 'doc' });

  doc.appendChild(h('div', { class: 'rec-title' },
    imp.logoInDocumentiClinici && imp.logo
      ? h('div', { style: { display: 'flex', justifyContent: 'center', marginBottom: '2mm' } }, logoStudio(imp))
      : null,
    h('h1', 'Programma di esercizi'),
    h('div', { class: 'sub' }, emittente.nome + (imp.qualifica ? ' — ' + imp.qualifica : ''))));

  doc.appendChild(h('dl', { class: 'kv' },
    h('dt', 'Per'), h('dd', fullName(paziente) || '—'),
    h('dt', 'Data'), h('dd', fmtDateLong(programma?.aggiornatoIl || new Date().toLocaleDateString('sv-SE'))),
    episodio?.titolo ? h('dt', 'Riferimento') : null,
    episodio?.titolo ? h('dd', episodio.titolo) : null));

  if (programma?.note) {
    doc.appendChild(h('div', { class: 'note-box' }, h('p', { class: 'mb0' }, programma.note)));
  }

  const voci = programma?.voci || [];
  if (!voci.length) {
    doc.appendChild(h('p', 'Nessun esercizio nel programma.'));
  } else {
    voci.forEach((v, i) => doc.appendChild(bloccoEsercizio(v.esercizio, v.dose, v.note, i + 1)));
  }

  doc.appendChild(h('div', { class: 'footer-note' },
    'Esegui gli esercizi come sono descritti: se qualcosa non torna, o se i sintomi peggiorano e non rientrano ' +
    'entro 24 ore, sospendi e contattami. Questo programma è stato preparato per te e non è trasferibile ad altri.'));

  doc.appendChild(h('div', { class: 'sign-row sign-row-single avoid-break' },
    h('div', { class: 'sign-col' },
      imp.firmaInDocumentiClinici ? firmaStudio(imp) : null,
      h('div', { class: 'sign' }, 'Firma del fisioterapista'))));

  return doc;
}

export function stampaProgramma(...args) { stampa(documentoProgramma(...args)); }
