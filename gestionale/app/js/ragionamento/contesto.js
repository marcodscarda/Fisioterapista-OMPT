/* ============================================================
   Normalizzazione della cartella in un contesto interrogabile
   dalle regole di ragionamento.
   ============================================================ */
import { normalize, age, num } from '../util.js';
import { calcolaProm } from '../schema/proms.js';

const insieme = (v) => new Set(Array.isArray(v) ? v : []);

/**
 * Costruisce il contesto a partire dall'episodio.
 * Tutti i campi liberi confluiscono in un testo unico normalizzato, cosi' una
 * regola puo' cogliere un reperto anche quando e' stato scritto a mano invece
 * di essere selezionato da un elenco.
 */
export function contesto(episodio, paziente, proms = []) {
  const c = episodio?.cartella || {};
  const sog = c.soggettivo || {};
  const obj = c.obiettivo || {};
  const ip = c.ipotesi?.ragionamentoPre || {};

  const bc = sog.bodychart || {};
  const comp = sog.comportamento || {};
  const storia = sog.storia || {};
  const rf = sog.redflags || {};
  const cerv = sog.cervicale || {};
  const band = sog.bandiere || {};

  const liberi = [
    sog.invio?.motivoConsulto, sog.invio?.diagnosiMedica, sog.invio?.esamiStrumentali,
    sog.invio?.professione, sog.invio?.sportHobby,
    bc.areaPrincipale, bc.relazioneAree, bc.noteSintomi,
    ...(bc.bodyChart?.marcatori || []).map(m => m.nota || ''),
    comp.notte, comp.mattino, comp.giornata, comp.sera,
    ...(comp.aggravanti || []).map(a => [a.attivita, a.tempoInsorgenza, a.recupero].join(' ')),
    ...(comp.allevianti || []).map(a => [a.strategia, a.effetto, a.tempo].join(' ')),
    storia.esordioData, storia.esordioModalita, storia.andamento, storia.meccanismoLesione,
    storia.trattamentiPrecedenti, storia.episodiPrecedenti, storia.anamnesiRemota, storia.farmaci,
    rf.statoSaluteGenerale, rf.rfNote, rf.inviuMedicoNote,
    cerv.cervTestEseguiti, cerv.cervConclusione,
    band.bandiereNote, band.aspettative,
    ip.ipotesiPrincipale, ip.ipotesiAlternative, ip.meccanismoNote, ip.fattoriContribuenti,
    obj.osservazione?.osservazione, obj.osservazione?.deambulazione, obj.osservazione?.screeningAdiacenti,
    obj.movimenti?.sovrapressione, obj.movimenti?.combinati, obj.movimenti?.ripetuti,
    obj.neuro?.dermatomeri, obj.neuro?.riflessi, obj.neuro?.palpazioneNervi,
    obj.accessori?.palpazione, obj.funzione?.forza, obj.funzione?.controlloMotorio,
    ...(obj.movimenti?.romTable || []).map(r => [r.movimento, r.note].join(' ')),
    ...(obj.accessori?.testSpeciali || []).map(t => [t.test, t.esito, t.note].join(' ')),
    episodio?.titolo, episodio?.regione
  ].filter(Boolean).join(' \n ');

  const testo = normalize(liberi);
  const regione = normalize([episodio?.regione, episodio?.titolo, bc.areaPrincipale].filter(Boolean).join(' '));

  const promPunteggi = {};
  for (const compilazione of proms) {
    const r = calcolaProm(compilazione.promId, compilazione.valori);
    if (!r) continue;
    const prec = promPunteggi[compilazione.promId];
    // Si tiene la compilazione piu' recente.
    if (!prec || (compilazione.data || '') >= prec.data) {
      promPunteggi[compilazione.promId] = { punteggio: r.punteggio, data: compilazione.data || '', etichetta: r.etichetta };
    }
  }

  const testiSpeciali = obj.accessori?.testSpeciali || [];
  const neurodinamica = obj.neuro?.neurodinamica || [];

  return {
    episodio, paziente,
    regione,
    eta: age(paziente?.dataNascita, sog.invio?.dataValutazione),
    nprsAttuale: num(bc.nprsAttuale, null),
    nprsPeggiore: num(bc.nprsPeggiore, null),
    qualita: insieme(bc.tipoDolore),
    sintomi: insieme(bc.sintomiAssociati),
    andamentoSintomi: bc.costanteIntermittente || '',
    lato: bc.latoPrincipale || '',
    irritabilita: comp.irritabilita || '',
    severita: comp.severita || '',
    natura: comp.natura || '',
    aggravanti: comp.aggravanti || [],
    allevianti: comp.allevianti || [],
    esordio: storia.esordioModalita || '',
    andamento: storia.andamento || '',
    redflags: insieme(rf.rfList),
    invioMedico: rf.inviuMedico || '',
    cad: insieme(cerv.cad5d3n),
    cadRischi: insieme(cerv.cadFattoriRischio),
    instabilita: insieme(cerv.instabilitaSintomi),
    cervRilevante: cerv.cervRilevante === 'Sì',
    gialle: insieme(band.gialle),
    blu: insieme(band.blu),
    nere: insieme(band.nere),
    arancioni: insieme(band.arancioni),
    umn: insieme(obj.neuro?.segniUMN),
    neuroIndicato: obj.neuro?.neuroIndicato === 'Sì',
    neurodinamica,
    testiSpeciali,
    romTable: obj.movimenti?.romTable || [],
    meccanismoIpotizzato: ip.meccanismoDolore || '',
    fonteIpotizzata: insieme(ip.fonteSintomi),

    proms: promPunteggi,
    prom: (id) => promPunteggi[id]?.punteggio ?? null,

    testo,
    /** Cerca un'espressione in tutti i campi liberi della cartella. */
    cerca: (re) => re.test(testo),
    /** La regione dell'episodio corrisponde a una delle chiavi indicate? */
    inRegione: (...chiavi) => chiavi.some(k => regione.includes(k)),
    /** Un test speciale risulta positivo? Il confronto e' sul nome scritto dall'utente. */
    testPositivo: (re) => testiSpeciali.some(t => re.test(normalize(t.test)) && /positiv/i.test(t.esito || '')),
    testEseguito: (re) => testiSpeciali.some(t => re.test(normalize(t.test)) && t.esito),
    neuroPositivo: (re) => neurodinamica.some(t => re.test(normalize(t.test)) && /positiv/i.test(t.esito || '')),
    neuroEseguito: (re) => neurodinamica.some(t => re.test(normalize(t.test)) && t.esito),
    cronico: () => /cronic/i.test(comp.natura || '') || /\b\d+\s*(mes|ann)/.test(normalize(storia.esordioData || ''))
  };
}
