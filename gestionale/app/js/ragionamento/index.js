/* ============================================================
   Motore di supporto al ragionamento clinico
   ------------------------------------------------------------
   Deterministico e locale: nessun dato lascia il computer e ogni
   suggerimento espone le ragioni che lo sostengono.

   Non produce una diagnosi. Ordina ipotesi, propone che cosa
   verificare nell'esame fisico e quali messaggi educativi sono
   pertinenti; la decisione resta del clinico.
   ============================================================ */
import { contesto } from './contesto.js';
import { IPOTESI, perRegione } from './ipotesi.js';

/* ------------------------------------------------------------------ */
/* Allerte indipendenti dalle ipotesi                                  */
/* ------------------------------------------------------------------ */
const ALLERTE = [
  {
    livello: 'urgente',
    quando: (c) => c.redflags.has('Disturbi sfinterici (vescica/intestino)') ||
      c.redflags.has('Anestesia a sella') ||
      (c.redflags.has('Deficit neurologico bilaterale') && c.redflags.has('Deficit neurologico progressivo')),
    testo: 'Possibile sindrome della cauda equina',
    azione: 'Invio immediato in pronto soccorso. Non proseguire con la valutazione: ritenzione o incontinenza urinaria, incontinenza fecale, anestesia a sella e deficit motorio bilaterale progressivo configurano un’urgenza chirurgica.'
  },
  {
    id: 'cad',
    livello: 'urgente',
    quando: (c) => c.cad.size >= 2 || c.cad.has('Drop attacks') || c.cad.has('Disartria') || c.cad.has('Deficit nervi cranici'),
    testo: 'Segni compatibili con disfunzione arteriosa cervicale',
    azione: 'Non eseguire mobilizzazioni o manipolazioni cervicali. Invio medico urgente, secondo il framework IFOMPT per l’esame della regione cervicale.'
  },
  {
    livello: 'urgente',
    quando: (c) => c.instabilita.size >= 2 || c.instabilita.has('Artrite reumatoide') || c.instabilita.has('Sindrome di Down'),
    testo: 'Segni compatibili con instabilità craniocervicale',
    azione: 'Sospendere le tecniche sul rachide cervicale superiore e richiedere valutazione medica con imaging mirato.'
  },
  {
    livello: 'attenzione',
    quando: (c) => c.redflags.has('Storia di neoplasia') &&
      (c.redflags.has('Perdita di peso involontaria') || c.redflags.has('Dolore notturno non meccanico') || c.redflags.has('Dolore costante non modificabile')),
    testo: 'Combinazione di elementi che orienta verso una patologia sistemica',
    azione: 'Storia di neoplasia associata a dolore notturno non meccanico, calo ponderale o dolore costante richiede inquadramento medico prima di proseguire.'
  },
  {
    livello: 'attenzione',
    quando: (c) => (c.redflags.has('Osteoporosi nota') || c.redflags.has('Uso prolungato di corticosteroidi')) &&
      (c.redflags.has('Trauma minore con osteoporosi') || c.redflags.has('Trauma maggiore recente') || c.eta >= 70),
    testo: 'Possibile frattura da fragilità',
    azione: 'Evitare carichi e tecniche ad alta velocità sul distretto. Richiedere valutazione medica e imaging prima di procedere.'
  },
  {
    livello: 'attenzione',
    quando: (c) => c.redflags.has('Febbre / sudorazione notturna') || c.redflags.has('Infezione recente') || c.redflags.has('Uso di droghe per via endovenosa'),
    testo: 'Elementi compatibili con un processo infettivo',
    azione: 'Febbre, sudorazioni notturne o infezione recente in presenza di dolore spinale richiedono valutazione medica tempestiva.'
  },
  {
    id: 'umn',
    livello: 'attenzione',
    quando: (c) => c.umn.size > 0,
    testo: 'Segni di primo motoneurone rilevati',
    azione: 'Un reperto positivo fra Babinski, Hoffmann, clono o iperreflessia impone l’invio medico e la sospensione delle tecniche sul rachide cervicale.'
  },
  {
    livello: 'attenzione',
    quando: (c) => c.redflags.has('Terapia anticoagulante'),
    testo: 'Terapia anticoagulante in corso',
    azione: 'Evitare tecniche vigorose sui tessuti molli e manipolazioni; il rischio emorragico è aumentato.'
  },
  {
    livello: 'attenzione',
    quando: (c) => c.arancioni.size > 0,
    testo: 'Bandiere arancioni presenti',
    azione: 'La presenza di un disturbo psichiatrico conclamato richiede la collaborazione con la figura sanitaria di riferimento e può modificare obiettivi e tempi.'
  },
  {
    livello: 'attenzione',
    quando: (c) => /Sì/.test(c.invioMedico),
    testo: 'Invio medico già indicato in cartella',
    azione: 'Verificare che l’invio sia stato effettivamente attivato e annotare la risposta ricevuta.'
  }
];

/* ------------------------------------------------------------------ */
/* Meccanismo del dolore                                               */
/* ------------------------------------------------------------------ */
function classificaMeccanismo(c) {
  const indizi = { Nocicettivo: [], Neuropatico: [], Nociplastico: [] };

  if (c.aggravanti.length && c.allevianti.length) indizi.Nocicettivo.push('Rapporto chiaro e riproducibile fra sintomi, posizioni e carichi');
  if (/Intermittente/.test(c.andamentoSintomi)) indizi.Nocicettivo.push('Andamento intermittente, tipico del dolore meccanico');
  if (/Acuto|Subacuto/.test(c.natura)) indizi.Nocicettivo.push('Fase acuta o subacuta coerente con un processo tissutale');
  if (c.qualita.has('Sordo') || c.qualita.has('Profondo')) indizi.Nocicettivo.push('Qualità sorda o profonda del dolore');

  if (c.sintomi.has('Parestesie') || c.sintomi.has('Ipoestesia') || c.sintomi.has('Anestesia')) {
    indizi.Neuropatico.push('Sintomi sensitivi negativi o positivi riferiti');
  }
  if (c.qualita.has('Urente/bruciante') || c.qualita.has('Elettrico')) indizi.Neuropatico.push('Dolore urente o a scossa elettrica');
  if (c.neuroPositivo(/./)) indizi.Neuropatico.push('Almeno un test neurodinamico positivo');
  if (c.cerca(/dermatomer|distribuzione.*(radic|nerv)/)) indizi.Neuropatico.push('Distribuzione compatibile con un territorio neuroanatomico');
  if (c.sintomi.has('Debolezza muscolare')) indizi.Neuropatico.push('Debolezza muscolare riferita');

  if (c.cronico()) indizi.Nociplastico.push('Persistenza oltre i tre mesi');
  if (c.irritabilita === 'Alta') indizi.Nociplastico.push('Irritabilità alta, con lungo tempo di ritorno alla base');
  if (c.prom('pcs') >= 30) indizi.Nociplastico.push(`Catastrofizzazione elevata (PCS ${c.prom('pcs')})`);
  if (c.prom('tsk11') >= 26) indizi.Nociplastico.push(`Kinesiofobia rilevante (TSK-11 ${c.prom('tsk11')})`);
  if (c.gialle.size >= 3) indizi.Nociplastico.push(`${c.gialle.size} bandiere gialle rilevate`);
  if (c.andamentoSintomi === 'Costante') indizi.Nociplastico.push('Dolore costante, poco modificabile dalla posizione');
  if (c.cerca(/sproporzion|diffus|tutto il corpo/)) indizi.Nociplastico.push('Distribuzione o intensità sproporzionate rispetto al reperto atteso');

  const punteggi = Object.entries(indizi).map(([k, v]) => [k, v.length]).sort((a, b) => b[1] - a[1]);
  const [primo, secondo] = punteggi;
  // Un solo indizio non basta a orientare il meccanismo: meglio dichiararlo
  // indefinito che suggerire una classificazione su base troppo esile.
  let suggerito = 'Da definire';
  if (primo[1] >= 2) {
    suggerito = (secondo[1] > 0 && primo[1] - secondo[1] <= 1) ? 'Misto' : primo[0];
  }
  return { suggerito, indizi, coerenteConCartella: !c.meccanismoIpotizzato || c.meccanismoIpotizzato === suggerito };
}

/* ------------------------------------------------------------------ */
/* Dose dell'esame fisico                                              */
/* ------------------------------------------------------------------ */
function doseEsame(c) {
  if (c.irritabilita === 'Alta') {
    return {
      livello: 'Irritabilità alta — esame prudente',
      indicazioni: [
        'Fermarsi alla prima comparsa del sintomo, senza cercarne la riproduzione piena.',
        'Evitare sovrapressioni e serie di movimenti ripetuti.',
        'Limitare il numero di test per seduta e distanziarli, lasciando che i sintomi tornino alla base.',
        'Rivalutare gli asterischi subito dopo, per cogliere un eventuale peggioramento indotto dall’esame.'
      ]
    };
  }
  if (c.irritabilita === 'Bassa') {
    return {
      livello: 'Irritabilità bassa — esame completo',
      indicazioni: [
        'Riprodurre il segno comparabile e applicare sovrapressione.',
        'Utilizzare movimenti combinati, quadranti e movimenti ripetuti.',
        'Aggiungere test funzionali sotto carico e prove di performance.'
      ]
    };
  }
  return {
    livello: c.irritabilita === 'Moderata' ? 'Irritabilità moderata — esame graduale' : 'Irritabilità non ancora definita',
    indicazioni: c.irritabilita === 'Moderata'
      ? [
        'Riprodurre parzialmente il sintomo, senza portarlo al massimo.',
        'Applicare la sovrapressione con cautela e solo dove necessario.',
        'Rivalutare un asterisco dopo i test più provocativi.'
      ]
      : [
        'Definire severità e irritabilità prima di scegliere la dose dell’esame: sono i due parametri che stabiliscono fin dove spingersi.'
      ]
  };
}

/* ------------------------------------------------------------------ */
/* Analisi                                                             */
/* ------------------------------------------------------------------ */
/**
 * @param {object} episodio  episodio di cura con la cartella
 * @param {object} paziente
 * @param {Array}  proms     compilazioni dei questionari
 */
export function analizza(episodio, paziente, proms = []) {
  const c = contesto(episodio, paziente, proms);

  /* Allerte */
  const allerte = ALLERTE.filter(a => { try { return a.quando(c); } catch { return false; } })
    .map(({ id, livello, testo, azione }) => ({ id, livello, testo, azione }));

  /* Ipotesi */
  const candidate = perRegione(c);
  const valutate = candidate.map(ip => {
    const favore = [], contro = [], chiarire = [];
    let punti = 0;
    for (const r of ip.indizi) {
      try { if (r.se(c)) { punti += r.p; favore.push({ peso: r.p, testo: r.t }); } } catch { /* regola non applicabile */ }
    }
    for (const r of (ip.contro || [])) {
      try { if (r.se(c)) { punti -= r.p; contro.push({ peso: r.p, testo: r.t }); } } catch { /* idem */ }
    }
    for (const r of (ip.chiarire || [])) {
      try { if (r.se(c)) chiarire.push(r.t); } catch { /* idem */ }
    }
    return {
      id: ip.id, nome: ip.nome, punti, favore, contro, chiarire,
      esame: ip.esame || [], educa: ip.educa,
      allerta: ip.allerta || null, allertaId: ip.allertaId || null, azione: ip.azione || null
    };
  })
    .filter(v => v.punti > 0)
    .sort((a, b) => b.punti - a.punti);

  const massimo = valutate[0]?.punti || 1;
  for (const v of valutate) v.forza = Math.round((v.punti / massimo) * 100);

  /* Ipotesi con allerta propria: confluiscono nelle allerte, senza duplicare
     quelle gia' emesse dalle regole indipendenti (collegate per identificativo). */
  for (const v of valutate) {
    if (!v.allerta) continue;
    if (v.allertaId && allerte.some(a => a.id === v.allertaId)) continue;
    allerte.push({ id: v.id, livello: v.allerta, testo: v.nome, azione: v.azione });
  }
  allerte.sort((a, b) => (a.livello === 'urgente' ? 0 : 1) - (b.livello === 'urgente' ? 0 : 1));
  const urgenza = allerte.some(a => a.livello === 'urgente');

  /* Piano dell'esame fisico: test delle prime ipotesi, senza ripetizioni */
  const inCima = valutate.slice(0, 3);
  const test = [];
  const visti = new Set();
  for (const v of inCima) {
    for (const t of v.esame) {
      const chiave = t.test.toLowerCase().slice(0, 40);
      if (visti.has(chiave)) continue;
      visti.add(chiave);
      test.push({ ...t, ipotesi: v.nome });
    }
  }

  /* Educazione */
  const educazione = inCima.filter(v => v.educa).map(v => ({ ...v.educa, ipotesi: v.nome }));
  const educazioneBandiere = educazionePerBandiere(c);
  if (educazioneBandiere) educazione.push(educazioneBandiere);

  /* Dati mancanti che cambierebbero le conclusioni */
  const daChiarire = [...new Set(inCima.flatMap(v => v.chiarire))];
  const lacune = lacuneCartella(c);

  return {
    ipotesi: valutate,
    // In presenza di un'urgenza la priorita' non e' la diagnosi differenziale:
    // la vista lo segnala e mette le ipotesi in secondo piano.
    urgenza,
    meccanismo: classificaMeccanismo(c),
    allerte,
    esame: { dose: doseEsame(c), test },
    educazione,
    daChiarire,
    lacune,
    contesto: c
  };
}

function educazionePerBandiere(c) {
  const punti = [];
  if (c.gialle.has('Paura del movimento / kinesiofobia') || c.prom('tsk11') >= 26) {
    punti.push('Affrontare esplicitamente la paura del movimento: spiegare che il movimento graduale è sicuro e costituisce parte della cura.');
    punti.push('Impostare un’esposizione graduale alle attività temute, concordando insieme i passi.');
  }
  if (c.gialle.has('Catastrofizzazione') || c.prom('pcs') >= 30) {
    punti.push('Riconoscere e normalizzare la preoccupazione, poi ricondurla a fatti: prognosi attesa, storia naturale, dati di esito.');
  }
  if (c.gialle.has('Convinzione che il dolore sia dannoso')) {
    punti.push('Chiarire la distinzione fra dolore e danno: un aumento transitorio dei sintomi durante l’esercizio non indica un peggioramento.');
  }
  if (c.gialle.has('Aspettative negative sul recupero')) {
    punti.push('Esplorare le aspettative: sono fra i predittori più forti dell’esito e vanno discusse apertamente.');
  }
  if (c.gialle.has('Passività nel trattamento')) {
    punti.push('Spostare il baricentro verso un ruolo attivo: la terapia manuale accompagna l’esercizio, non lo sostituisce.');
  }
  if (c.blu.size) {
    punti.push('Affrontare la dimensione lavorativa: modifiche temporanee della mansione e rientro graduale riducono il rischio di cronicizzazione.');
  }
  if (c.nere.size) {
    punti.push('Tenere conto dei fattori di contesto (contenziosi, pratiche assicurative): influenzano la prognosi e vanno gestiti con trasparenza.');
  }
  if (!punti.length) return null;
  return { titolo: 'Educazione mirata ai fattori psicosociali rilevati', punti, ipotesi: null };
}

/** Informazioni assenti che limitano l'affidabilita' dell'analisi. */
function lacuneCartella(c) {
  const mancano = [];
  if (!c.episodio?.regione) mancano.push('la regione corporea dell’episodio, che determina quali ipotesi vengono considerate');
  if (!c.irritabilita) mancano.push('la stima di irritabilità, che determina la dose dell’esame');
  if (!c.severita) mancano.push('la stima di severità');
  if (!c.natura) mancano.push('la natura o stadio del problema (acuto, subacuto, cronico)');
  if (!c.aggravanti.length) mancano.push('i fattori aggravanti');
  if (!c.allevianti.length) mancano.push('i fattori allevianti');
  if (!c.episodio?.cartella?.soggettivo?.redflags?.rfList && !c.episodio?.cartella?.soggettivo?.redflags?.statoSaluteGenerale) {
    mancano.push('lo screening delle bandiere rosse, senza il quale nessuna conclusione è sicura');
  }
  if (c.eta == null) mancano.push('la data di nascita del paziente, che pesa su più ipotesi');
  return mancano;
}

export { IPOTESI };
