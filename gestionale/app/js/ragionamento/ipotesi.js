/* ============================================================
   Ipotesi diagnostiche e regole che le sostengono.
   ------------------------------------------------------------
   Ogni ipotesi dichiara:
     indizi   elementi a favore, con un peso
     contro   elementi che la rendono meno probabile
     chiarire dati mancanti che la discriminerebbero
     esame    test consigliati se l'ipotesi resta in gioco
     educa    messaggi educativi pertinenti

   I pesi sono ordinali, non probabilita': servono a ordinare le
   ipotesi e soprattutto a rendere esplicito il perche'. La decisione
   resta del clinico.
   ============================================================ */

const P = { forte: 3, medio: 2, debole: 1 };

/* Predicati ricorrenti ------------------------------------------------ */
const irritabilitaAlta = (c) => c.irritabilita === 'Alta';
/** Unico punto di verita' sull'irradiazione distale all'arto inferiore. */
const irradiazioneArtoInf = (c) => c.cerca(/sotto il ginocchio|polpacc|piede|alluce|gamba|coscia|arto inferiore|sciatic|cruralg/);
const segniNeurologici = (c) => c.sintomi.has('Debolezza muscolare') || c.umn.size > 0 ||
  c.sintomi.has('Ipoestesia') || c.sintomi.has('Anestesia') ||
  c.redflags.has('Deficit neurologico progressivo') || c.redflags.has('Deficit neurologico bilaterale');
const haParestesie = (c) => c.sintomi.has('Parestesie') || c.sintomi.has('Ipoestesia') || c.cerca(/formicol|intorpid|parestes/);
const dolorePersistente = (c) => c.cronico() || /Cronico/.test(c.natura);
const molteBandiereGialle = (c) => c.gialle.size >= 3;

export const IPOTESI = [

  /* ---------------------------------------------------------------- */
  /* Trasversali                                                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'nociplastico',
    nome: 'Dolore persistente con sensibilizzazione (nociplastico)',
    regioni: ['*'],
    requisito: dolorePersistente,
    indizi: [
      { p: P.forte, t: 'Durata superiore a tre mesi', se: dolorePersistente },
      { p: P.forte, t: 'Dolore sproporzionato rispetto al danno tissutale atteso', se: (c) => c.cerca(/sproporzion|nessuna causa|non spiegab|diffus/) },
      { p: P.medio, t: 'Distribuzione diffusa o non anatomica dei sintomi', se: (c) => (c.episodio?.cartella?.soggettivo?.bodychart?.bodyChart?.marcatori || []).length >= 3 },
      { p: P.medio, t: 'Irritabilità alta con lunga persistenza dopo lo stimolo', se: irritabilitaAlta },
      { p: P.medio, t: 'Catastrofizzazione clinicamente rilevante (PCS ≥ 30)', se: (c) => c.prom('pcs') >= 30 },
      { p: P.medio, t: 'Kinesiofobia clinicamente rilevante (TSK-11 ≥ 26)', se: (c) => c.prom('tsk11') >= 26 },
      { p: P.medio, t: 'Più bandiere gialle presenti', se: molteBandiereGialle },
      { p: P.debole, t: 'Disturbi del sonno riferiti', se: (c) => c.gialle.has('Disturbi del sonno') || c.cerca(/non dorm|sonno disturbat|insonn/) },
      { p: P.debole, t: 'Dolore costante non modificabile dalla posizione', se: (c) => c.andamentoSintomi === 'Costante' }
    ],
    contro: [
      { p: P.medio, t: 'Quadro acuto e chiaramente meccanico', se: (c) => /Acuto/.test(c.natura) && c.allevianti.length > 0 },
      { p: P.medio, t: 'Rapporto chiaro e riproducibile con il carico', se: (c) => c.aggravanti.length >= 2 && !dolorePersistente(c) }
    ],
    chiarire: [
      { t: 'Somministrare la PCS per quantificare la catastrofizzazione', se: (c) => c.prom('pcs') == null },
      { t: 'Somministrare la TSK-11 per quantificare la paura del movimento', se: (c) => c.prom('tsk11') == null },
      { t: 'Verificare la presenza di ipersensibilità diffusa (allodinia, iperalgesia in sedi non coinvolte)', se: () => true }
    ],
    esame: [
      { test: 'Mappatura della sensibilità oltre l’area sintomatica', perche: 'documentare un’ipersensibilità che eccede il territorio della lesione' },
      { test: 'Test di sommazione temporale e tolleranza al carico progressivo', perche: 'valutare la modulazione del dolore più che la struttura' }
    ],
    educa: {
      titolo: 'Educazione al dolore persistente',
      punti: [
        'Spiegare che dolore e danno non coincidono: un sistema nervoso sensibilizzato produce dolore anche senza lesione in atto.',
        'Usare l’analogia dell’allarme tarato troppo sensibile, che suona anche quando non c’è pericolo.',
        'Evitare linguaggio nocebo («schiena fragile», «vertebra fuori posto», «usura»): sono espressioni che aumentano paura e disabilità.',
        'Ridimensionare il peso dei reperti di imaging: alterazioni degenerative sono frequenti anche in persone senza dolore.',
        'Obiettivo primario: riprendere gradualmente le attività, non attendere l’assenza di dolore.',
        'Curare sonno, attività fisica regolare e gestione dello stress, che modulano direttamente la sensibilità al dolore.'
      ]
    }
  },

  /* ---------------------------------------------------------------- */
  /* Rachide lombare                                                   */
  /* ---------------------------------------------------------------- */
  {
    id: 'radicolare-lombare',
    nome: 'Dolore radicolare / radicolopatia lombare',
    regioni: ['lomb', 'sacro', 'schiena', 'dorso'],
    indizi: [
      { p: P.forte, t: 'Irradiazione distale all’arto inferiore', se: irradiazioneArtoInf },
      { p: P.forte, t: 'Test neurodinamico positivo (SLR o Slump)', se: (c) => c.neuroPositivo(/slr|slump/) },
      { p: P.medio, t: 'Parestesie o ipoestesia in distribuzione dermatomerica', se: haParestesie },
      { p: P.medio, t: 'Dolore di qualità urente o elettrica', se: (c) => c.qualita.has('Urente/bruciante') || c.qualita.has('Elettrico') },
      { p: P.medio, t: 'Deficit di forza segmentario riferito', se: (c) => c.sintomi.has('Debolezza muscolare') },
      { p: P.debole, t: 'Sintomi peggiorati dalla posizione seduta prolungata', se: (c) => c.aggravanti.some(a => /sedut|seduto|scrivania|auto|guida/i.test(a.attivita || '')) }
    ],
    contro: [
      { p: P.medio, t: 'Sintomi confinati alla regione lombare, senza irradiazione', se: (c) => !irradiazioneArtoInf(c) },
      { p: P.debole, t: 'Test neurodinamici eseguiti e negativi', se: (c) => c.neuroEseguito(/slr|slump/) && !c.neuroPositivo(/slr|slump/) }
    ],
    chiarire: [
      { t: 'Eseguire e registrare SLR e Slump con differenziazione strutturale', se: (c) => !c.neuroEseguito(/slr|slump/) },
      { t: 'Completare l’esame neurologico: dermatomeri, miotomi (MRC) e riflessi', se: (c) => !c.neuroIndicato }
    ],
    esame: [
      { test: 'SLR con differenziazione (dorsiflessione di caviglia, flessione cervicale)', perche: 'distinguere una sensibilizzazione neurale da una limitazione muscolare posteriore' },
      { test: 'Slump test', perche: 'sensibile per il coinvolgimento neurale quando lo SLR è dubbio' },
      { test: 'Esame neurologico: L4 (tibiale anteriore, rotuleo), L5 (estensore alluce), S1 (flessori plantari, achilleo)', perche: 'stabilire se vi è compromissione di conduzione e non solo di sensibilità' },
      { test: 'Movimenti ripetuti con ricerca di centralizzazione', perche: 'la centralizzazione ha valore prognostico favorevole e orienta la direzione di trattamento' },
      { test: 'Palpazione e movimenti accessori dei segmenti L4-S1', perche: 'individuare il livello comparabile' }
    ],
    educa: {
      titolo: 'Educazione nel dolore radicolare',
      punti: [
        'Spiegare la storia naturale: la maggior parte dei quadri radicolari migliora nell’arco di settimane o pochi mesi.',
        'Chiarire che l’ernia discale spesso si riduce spontaneamente e che la chirurgia è riservata a casi selezionati.',
        'Indicare le posizioni di scarico che alleviano i sintomi e le strategie per le attività quotidiane.',
        'Insegnare i segnali che impongono di ricontattare subito: disturbi urinari o intestinali, anestesia a sella, deficit di forza progressivo.',
        'Mantenere l’attività entro la soglia dei sintomi: il riposo a letto prolungato peggiora l’esito.'
      ]
    }
  },
  {
    id: 'stenosi-lombare',
    nome: 'Stenosi del canale lombare / claudicatio neurogena',
    regioni: ['lomb', 'sacro', 'schiena'],
    indizi: [
      { p: P.forte, t: 'Sintomi agli arti inferiori indotti dal cammino e alleviati dalla flessione del tronco', se: (c) => c.cerca(/claudicat|cammin.*(dolor|ferma|sint)|carrello|bicicletta.*meglio|in avanti.*meglio|flession.*sollie/) },
      { p: P.medio, t: 'Età pari o superiore a 60 anni', se: (c) => c.eta >= 60 },
      { p: P.medio, t: 'Sollievo in posizione seduta o piegandosi in avanti', se: (c) => c.allevianti.some(a => /sedut|piegat|avanti|flession|bicicletta/i.test(a.strategia || '')) },
      { p: P.medio, t: 'Sintomi bilaterali agli arti inferiori', se: (c) => c.lato === 'Bilaterale' },
      { p: P.debole, t: 'Peggioramento in estensione o in stazione eretta prolungata', se: (c) => c.aggravanti.some(a => /in piedi|estension|cammin/i.test(a.attivita || '')) }
    ],
    contro: [
      { p: P.medio, t: 'Età inferiore ai 50 anni', se: (c) => c.eta != null && c.eta < 50 },
      { p: P.medio, t: 'Sintomi peggiorati dalla flessione e alleviati dall’estensione', se: (c) => c.cerca(/flession.*peggio|estension.*meglio/) }
    ],
    chiarire: [
      { t: 'Quantificare la distanza di cammino che provoca i sintomi e il tempo di recupero', se: (c) => !c.cerca(/metri|minuti di cammino|isolat/) },
      { t: 'Verificare i polsi periferici per escludere una claudicatio vascolare', se: () => true }
    ],
    esame: [
      { test: 'Test del cammino su tapis roulant in piano e in salita', perche: 'la claudicatio neurogena migliora in salita (tronco flesso), quella vascolare no' },
      { test: 'Two-stage treadmill test', perche: 'discrimina origine neurogena e vascolare' },
      { test: 'Estensione lombare sostenuta e posizione flessa', perche: 'riprodurre e alleviare il quadro in modo controllato' },
      { test: 'Palpazione dei polsi tibiale posteriore e pedidio', perche: 'escludere una componente arteriosa periferica' }
    ],
    educa: {
      titolo: 'Educazione nella stenosi lombare',
      punti: [
        'Spiegare il meccanismo posizionale: lo spazio per le radici aumenta in flessione e si riduce in estensione.',
        'Proporre strategie pratiche: soste programmate, uso del carrello, cyclette al posto del cammino prolungato.',
        'Impostare un programma di cammino a intervalli, aumentando gradualmente la distanza tolerata.',
        'Chiarire che il quadro è tipicamente stabile nel tempo e che la chirurgia è un’opzione, non un obbligo.'
      ]
    }
  },
  {
    id: 'lombalgia-aspecifica',
    nome: 'Lombalgia aspecifica a dominanza nocicettiva',
    regioni: ['lomb', 'sacro', 'schiena', 'dorso'],
    indizi: [
      { p: P.medio, t: 'Dolore meccanico, chiaramente legato a posizioni e carichi', se: (c) => c.aggravanti.length > 0 && c.allevianti.length > 0 },
      { p: P.medio, t: 'Sintomi localizzati, senza irradiazione distale', se: (c) => !irradiazioneArtoInf(c) },
      { p: P.medio, t: 'Assenza di segni neurologici', se: (c) => !haParestesie(c) && !segniNeurologici(c) },
      { p: P.debole, t: 'Nessuna bandiera rossa rilevata', se: (c) => c.redflags.size === 0 },
      { p: P.debole, t: 'Esordio da sovraccarico o gesto incongruo', se: (c) => /sovraccarico|Traumatico/.test(c.esordio) }
    ],
    contro: [
      { p: P.forte, t: 'Presenza di bandiere rosse', se: (c) => c.redflags.size > 0 },
      { p: P.forte, t: 'Irradiazione distale all’arto inferiore', se: irradiazioneArtoInf },
      { p: P.medio, t: 'Segni di compromissione neurologica', se: segniNeurologici },
      { p: P.medio, t: 'Test neurodinamico positivo', se: (c) => c.neuroPositivo(/slr|slump|pkb/) }
    ],
    chiarire: [
      { t: 'Classificare secondo la preferenza direzionale con i movimenti ripetuti', se: () => true }
    ],
    esame: [
      { test: 'Movimenti attivi nei tre piani con sovrapressione (se l’irritabilità lo consente)', perche: 'individuare il pattern comparabile' },
      { test: 'Movimenti ripetuti e preferenza direzionale', perche: 'orientare la direzione dell’esercizio' },
      { test: 'Movimenti accessori PA centrali e unilaterali L1-S1', perche: 'localizzare il livello sintomatico' },
      { test: 'Controllo motorio del tronco e test di resistenza', perche: 'individuare i fattori contribuenti modificabili' }
    ],
    educa: {
      titolo: 'Educazione nella lombalgia aspecifica',
      punti: [
        'Rassicurare: è la forma più comune e ha prognosi favorevole; non indica danno strutturale grave.',
        'Sconsigliare l’imaging in assenza di bandiere rosse: non cambia la gestione e può generare preoccupazione inutile.',
        'Incoraggiare il mantenimento dell’attività e il rientro precoce al lavoro, adattando i carichi.',
        'Spiegare che la colonna è robusta e adattabile: il movimento la nutre, l’immobilità la indebolisce.',
        'Concordare un programma di esercizio progressivo, scegliendo un’attività gradita al paziente.'
      ]
    }
  },
  {
    id: 'infiammatorio-assiale',
    nome: 'Sospetto dolore assiale infiammatorio (spondiloartrite)',
    regioni: ['lomb', 'sacro', 'dorso', 'schiena'],
    allerta: 'attenzione',
    azione: 'Considerare l’invio reumatologico: il quadro infiammatorio richiede inquadramento specialistico ed esami mirati.',
    indizi: [
      { p: P.forte, t: 'Rigidità mattutina prolungata, oltre i 30-60 minuti', se: (c) => c.cerca(/rigidit.*(4\d|[6-9]\d|un'ora|1 ora|ore)|mattin.*(un'ora|ore)/) },
      { p: P.forte, t: 'Esordio prima dei 45 anni con dolore di durata superiore a 3 mesi', se: (c) => c.eta != null && c.eta < 45 && dolorePersistente(c) },
      { p: P.medio, t: 'Miglioramento con il movimento e peggioramento con il riposo', se: (c) => c.cerca(/movimento.*meglio|riposo.*peggio|migliora.*cammin/) },
      { p: P.medio, t: 'Risvegli notturni nella seconda metà della notte', se: (c) => c.cerca(/second.*met.*notte|si sveglia.*(tre|quattro|3|4)/) },
      { p: P.debole, t: 'Anamnesi di psoriasi, uveite o malattia infiammatoria intestinale', se: (c) => c.cerca(/psorias|uveit|crohn|colite ulcer|rettocolite/) }
    ],
    contro: [
      { p: P.medio, t: 'Dolore chiaramente meccanico, alleviato dal riposo', se: (c) => c.cerca(/riposo.*meglio|sdraiat.*meglio/) }
    ],
    chiarire: [
      { t: 'Indagare durata esatta della rigidità mattutina, risvegli notturni e risposta ai FANS', se: () => true },
      { t: 'Chiedere di psoriasi, uveiti, disturbi intestinali e familiarità per spondiloartriti', se: () => true }
    ],
    esame: [
      { test: 'Mobilità del rachide: test di Schober modificato, espansibilità toracica', perche: 'documentare una eventuale riduzione della mobilità assiale' },
      { test: 'Valutazione delle sacroiliache e delle entesi', perche: 'l’entesite è caratteristica del gruppo delle spondiloartriti' }
    ],
    educa: {
      titolo: 'Educazione nel sospetto dolore infiammatorio',
      punti: [
        'Spiegare la differenza tra dolore meccanico e infiammatorio e perché serve un inquadramento medico.',
        'Anticipare che l’esercizio regolare è parte del trattamento anche dopo la diagnosi.',
        'Non promettere risoluzione con la sola terapia manuale: il percorso va condiviso con lo specialista.'
      ]
    }
  },

  /* ---------------------------------------------------------------- */
  /* Rachide cervicale                                                 */
  /* ---------------------------------------------------------------- */
  {
    id: 'radicolopatia-cervicale',
    nome: 'Radicolopatia cervicale',
    regioni: ['cervic', 'collo', 'brachial', 'nuca'],
    indizi: [
      { p: P.forte, t: 'Test di Spurling positivo', se: (c) => c.testPositivo(/spurling/) },
      { p: P.forte, t: 'ULNT1 positivo', se: (c) => c.neuroPositivo(/ulnt1|mediano/) },
      { p: P.medio, t: 'Sollievo con la distrazione cervicale', se: (c) => c.testPositivo(/distrazion/) || c.cerca(/distrazion.*sollie|trazion.*meglio/) },
      { p: P.medio, t: 'Irradiazione all’arto superiore con parestesie', se: (c) => haParestesie(c) && c.cerca(/braccio|avambraccio|mano|dita|arto superiore/) },
      { p: P.medio, t: 'Rotazione cervicale verso il lato sintomatico inferiore a 60°', se: (c) => c.cerca(/rotazion.*(<|meno di|inferiore).*60|rotazione limitata/) },
      { p: P.debole, t: 'Dolore che peggiora con l’estensione cervicale', se: (c) => c.aggravanti.some(a => /estension|guardare in alto|indietro/i.test(a.attivita || '')) }
    ],
    contro: [
      { p: P.medio, t: 'Nessuna irradiazione all’arto superiore', se: (c) => !c.cerca(/braccio|mano|dita|arto superiore|avambraccio/) }
    ],
    chiarire: [
      { t: 'Completare il cluster di Wainner: Spurling, distrazione, ULNT1, rotazione < 60°', se: (c) => !c.testEseguito(/spurling/) || !c.neuroEseguito(/ulnt1/) },
      { t: 'Esame neurologico di C5-T1: miotomi, dermatomeri, riflessi', se: (c) => !c.neuroIndicato }
    ],
    esame: [
      { test: 'Cluster di Wainner (Spurling, distrazione, ULNT1, rotazione ipsilaterale < 60°)', perche: 'tre item su quattro positivi aumentano nettamente la probabilità post-test' },
      { test: 'Esame neurologico C5-T1', perche: 'documentare l’eventuale compromissione di conduzione' },
      { test: 'Screening della spalla', perche: 'il dolore di spalla può simulare una radicolopatia e viceversa' }
    ],
    educa: {
      titolo: 'Educazione nella radicolopatia cervicale',
      punti: [
        'Rassicurare sulla prognosi: la maggior parte dei casi migliora senza chirurgia.',
        'Indicare posizioni di scarico e adattamenti per sonno e postazione di lavoro.',
        'Spiegare i segnali di allarme da riferire subito: deficit di forza progressivo, disturbi dell’equilibrio o della manualità fine.'
      ]
    }
  },
  {
    id: 'cefalea-cervicogenica',
    nome: 'Cefalea cervicogenica',
    regioni: ['cervic', 'collo', 'nuca', 'cefal', 'testa'],
    indizi: [
      { p: P.forte, t: 'Cefalea unilaterale che origina dalla regione occipitale', se: (c) => c.cerca(/cefale|mal di testa|emicran|nuca|occipit/) && c.lato !== 'Bilaterale' },
      { p: P.medio, t: 'Cefalea riprodotta dai movimenti o dalle posizioni del collo', se: (c) => c.cerca(/movimento del collo.*(testa|cefale)|posizion.*cefale/) },
      { p: P.medio, t: 'Riduzione della mobilità cervicale superiore', se: (c) => c.testPositivo(/flexion.rotation|flessione.rotazione|fRT/i) || c.cerca(/flexion rotation|limitazione c1|c1-c2/) },
      { p: P.debole, t: 'Dolore cervicale associato', se: (c) => c.cerca(/collo|cervical/) }
    ],
    contro: [
      { p: P.medio, t: 'Cefalea bilaterale pulsante con nausea e fotofobia (orienta a emicrania)', se: (c) => c.cerca(/fotofob|fonofob/) && c.sintomi.has('Nausea') }
    ],
    chiarire: [
      { t: 'Eseguire il flexion-rotation test per la mobilità C1-C2', se: (c) => !c.testEseguito(/flexion|rotation/) },
      { t: 'Verificare la riproduzione della cefalea con i movimenti accessori cervicali superiori', se: () => true }
    ],
    esame: [
      { test: 'Flexion-rotation test', perche: 'valuta la rotazione C1-C2, tipicamente ridotta nella cefalea cervicogenica' },
      { test: 'Movimenti accessori su C0-C3 con ricerca della riproduzione della cefalea', perche: 'il criterio diagnostico chiave è la riproducibilità dalla cervicale' },
      { test: 'Cranio-cervical flexion test', perche: 'valutare il controllo dei flessori profondi, spesso deficitario' }
    ],
    educa: {
      titolo: 'Educazione nella cefalea cervicogenica',
      punti: [
        'Spiegare l’origine cervicale del dolore percepito al capo, tramite la convergenza trigemino-cervicale.',
        'Rivedere ergonomia della postazione, uso dei dispositivi e posizione durante il sonno.',
        'Impostare esercizi per i flessori cervicali profondi, con progressione lenta e costante.',
        'Distinguere dall’emicrania: se compaiono aura, fotofobia marcata o nausea intensa, va rivalutata la diagnosi.'
      ]
    }
  },
  {
    id: 'mielopatia',
    nome: 'Sospetta mielopatia cervicale',
    regioni: ['cervic', 'collo', 'nuca'],
    allerta: 'urgente',
    allertaId: 'umn',
    azione: 'Sospendere le tecniche sul rachide cervicale e inviare a valutazione medica: la mielopatia è progressiva e richiede inquadramento neurochirurgico.',
    indizi: [
      { p: P.forte, t: 'Segni di primo motoneurone (Babinski, Hoffmann, clono, iperreflessia)', se: (c) => c.umn.size > 0 },
      { p: P.forte, t: 'Disturbi dell’andatura o dell’equilibrio', se: (c) => c.cerca(/andatura|equilibr|barcoll|instabil.*cammin/) },
      { p: P.medio, t: 'Perdita di destrezza nelle mani', se: (c) => c.cerca(/destrezz|bottoni|oggetti.*cadono|manualit/) },
      { p: P.medio, t: 'Sintomi bilaterali agli arti', se: (c) => c.lato === 'Bilaterale' && c.cerca(/mano|braccio|arti/) },
      { p: P.debole, t: 'Disturbi sfinterici', se: (c) => c.redflags.has('Disturbi sfinterici (vescica/intestino)') }
    ],
    contro: [],
    chiarire: [
      { t: 'Eseguire Hoffmann, Babinski, clono e valutare l’andatura in tandem', se: (c) => c.umn.size === 0 }
    ],
    esame: [
      { test: 'Segno di Hoffmann e di Babinski, ricerca del clono', perche: 'segni di compromissione del primo motoneurone' },
      { test: 'Andatura in tandem e test di Romberg', perche: 'valutare l’atassia' },
      { test: 'Valutazione della destrezza fine della mano', perche: 'la perdita di destrezza è un segno precoce' }
    ],
    educa: {
      titolo: 'Comunicazione nel sospetto di mielopatia',
      punti: [
        'Spiegare con chiarezza, senza allarmismo, la necessità di una valutazione medica prima di proseguire.',
        'Elencare i segnali che impongono di rivolgersi al pronto soccorso: peggioramento rapido della forza, della marcia o disturbi sfinterici.'
      ]
    }
  },
  {
    id: 'cad',
    nome: 'Sospetta disfunzione arteriosa cervicale',
    regioni: ['cervic', 'collo', 'nuca', 'cefal'],
    allerta: 'urgente',
    allertaId: 'cad',
    azione: 'Non eseguire tecniche di mobilizzazione o manipolazione cervicale. Inviare con urgenza a valutazione medica secondo il framework IFOMPT.',
    indizi: [
      { p: P.forte, t: 'Sintomi del gruppo 5D & 3N presenti', se: (c) => c.cad.size > 0 },
      { p: P.forte, t: 'Cefalea o dolore cervicale insoliti e a esordio improvviso', se: (c) => c.cad.has('Cefalea inusuale e improvvisa') || c.cad.has('Dolore cervicale inusuale e improvviso') },
      { p: P.medio, t: 'Più fattori di rischio vascolare', se: (c) => c.cadRischi.size >= 2 },
      { p: P.medio, t: 'Pregressa dissezione arteriosa o trauma cervicale recente', se: (c) => c.cadRischi.has('Pregressa dissezione arteriosa') || c.cadRischi.has('Trauma cervicale recente') }
    ],
    contro: [],
    chiarire: [
      { t: 'Completare lo screening cervicale IFOMPT: 5D & 3N, fattori di rischio, esame dei nervi cranici, pressione arteriosa', se: (c) => !c.cervRilevante }
    ],
    esame: [
      { test: 'Misurazione della pressione arteriosa', perche: 'parte della stratificazione del rischio vascolare' },
      { test: 'Esame dei nervi cranici', perche: 'individuare segni di compromissione del circolo posteriore' },
      { test: 'Mantenimento delle posizioni di fine range solo se il quadro complessivo lo consente', perche: 'nessun test posizionale è di per sé predittivo: conta il ragionamento complessivo' }
    ],
    educa: {
      titolo: 'Comunicazione nel sospetto di disfunzione arteriosa',
      punti: [
        'Spiegare perché non si procede con tecniche cervicali e perché serve una valutazione medica.',
        'Indicare i sintomi per cui rivolgersi immediatamente al pronto soccorso.'
      ]
    }
  },
  {
    id: 'cervicalgia-meccanica',
    nome: 'Cervicalgia meccanica aspecifica',
    regioni: ['cervic', 'collo', 'nuca'],
    indizi: [
      { p: P.forte, t: 'Nessuna bandiera rossa e nessun segnale di disfunzione arteriosa', se: (c) => c.redflags.size === 0 && c.cad.size === 0 },
      { p: P.medio, t: 'Dolore riprodotto dai movimenti cervicali', se: (c) => c.aggravanti.some(a => /collo|cervical|girare|guardare/i.test(a.attivita || '')) },
      { p: P.medio, t: 'Sintomi localizzati al collo e al cingolo scapolare', se: (c) => !c.cerca(/mano|dita|avambraccio/) },
      { p: P.debole, t: 'Postura di lavoro prolungata al videoterminale', se: (c) => c.cerca(/videotermin|computer|scrivania|ufficio|pc/) }
    ],
    contro: [
      { p: P.medio, t: 'Segni neurologici o irradiazione distale', se: (c) => haParestesie(c) || c.umn.size > 0 }
    ],
    chiarire: [],
    esame: [
      { test: 'Movimenti attivi cervicali con sovrapressione, se l’irritabilità lo consente', perche: 'individuare il movimento comparabile' },
      { test: 'Movimenti accessori C2-C7', perche: 'localizzare il segmento sintomatico' },
      { test: 'Cranio-cervical flexion test e resistenza dei flessori profondi', perche: 'il deficit di controllo è un fattore contribuente frequente' }
    ],
    educa: {
      titolo: 'Educazione nella cervicalgia',
      punti: [
        'Rassicurare: il dolore cervicale è comune e raramente indica un problema grave.',
        'Sfatare l’idea di una postura «giusta» unica: la postura migliore è quella che cambia spesso.',
        'Introdurre pause attive e movimento frequente durante il lavoro sedentario.',
        'Impostare esercizio per forza e resistenza del collo, che ha buone prove di efficacia.'
      ]
    }
  },

  /* ---------------------------------------------------------------- */
  /* Spalla                                                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'dolore-subacromiale',
    nome: 'Dolore subacromiale / tendinopatia della cuffia',
    regioni: ['spall', 'scapol', 'braccio'],
    indizi: [
      { p: P.forte, t: 'Dolore con le attività sopra la testa', se: (c) => c.aggravanti.some(a => /sopra la testa|alto|mensola|pettinar|stender/i.test(a.attivita || '')) || c.cerca(/sopra la testa|overhead/) },
      { p: P.medio, t: 'Arco doloroso nell’elevazione attiva', se: (c) => c.cerca(/arco dolorso|arco dolo|60.*120/) },
      { p: P.medio, t: 'Dolore notturno sul lato coinvolto', se: (c) => c.cerca(/notte.*lato|coricat.*spalla|dorme.*lato/) },
      { p: P.medio, t: 'Test di conflitto o di forza della cuffia positivi', se: (c) => c.testPositivo(/hawkins|neer|jobe|empty can|resisted|infraspinat/) },
      { p: P.debole, t: 'Movimento passivo conservato', se: (c) => c.romTable.some(r => /spalla|elevazion|abduzion/i.test(r.movimento || '') && /norm|compl|conserv/i.test(r.passivo || '')) }
    ],
    contro: [
      { p: P.forte, t: 'Limitazione marcata anche del movimento passivo', se: (c) => c.romTable.some(r => /rotazion.*estern|elevazion/i.test(r.movimento || '') && /ridott|limitat|\d{1,2}%/i.test(r.passivo || '')) }
    ],
    chiarire: [
      { t: 'Confrontare ROM attivo e passivo: la conservazione del passivo distingue dal quadro capsulare', se: (c) => !c.romTable.length },
      { t: 'Valutare la forza in rotazione esterna e in elevazione per stimare l’integrità della cuffia', se: () => true }
    ],
    esame: [
      { test: 'ROM attivo e passivo a confronto', perche: 'distinguere il dolore subacromiale dalla capsulite' },
      { test: 'Test di forza: Jobe, rotazione esterna resistita, lift-off, belly press', perche: 'individuare il tendine più coinvolto e l’eventuale lesione' },
      { test: 'Screening cervicale', perche: 'la cervicale può riferire dolore alla spalla' },
      { test: 'Valutazione del controllo scapolare e del carico allenante', perche: 'i fattori contribuenti guidano il programma di esercizio' }
    ],
    educa: {
      titolo: 'Educazione nel dolore di spalla',
      punti: [
        'Spiegare che l’esercizio progressivo è il trattamento di prima scelta, con esiti paragonabili alla chirurgia nella maggior parte dei casi.',
        'Chiarire che i reperti di imaging (tendinopatia, lesioni parziali) sono comuni anche in spalle non dolorose.',
        'Insegnare a gestire il carico: il dolore durante l’esercizio entro livelli accettabili non è dannoso.',
        'Anticipare i tempi: il miglioramento richiede tipicamente alcuni mesi di lavoro costante.'
      ]
    }
  },
  {
    id: 'capsulite',
    nome: 'Capsulite adesiva (spalla congelata)',
    regioni: ['spall', 'scapol'],
    indizi: [
      { p: P.forte, t: 'Limitazione del movimento passivo in più direzioni', se: (c) => c.romTable.filter(r => /ridott|limitat/i.test(r.passivo || '')).length >= 2 },
      { p: P.forte, t: 'Rotazione esterna passiva marcatamente ridotta', se: (c) => c.romTable.some(r => /rotazion.*estern/i.test(r.movimento || '') && /ridott|limitat/i.test(r.passivo || '')) },
      { p: P.medio, t: 'Esordio insidioso con dolore notturno importante', se: (c) => /Insidioso/.test(c.esordio) && c.cerca(/notte|nottur/) },
      { p: P.medio, t: 'Diabete o disfunzione tiroidea in anamnesi', se: (c) => c.cerca(/diabet|tiroid/) },
      { p: P.debole, t: 'Età fra i 40 e i 60 anni', se: (c) => c.eta >= 40 && c.eta <= 65 }
    ],
    contro: [
      { p: P.medio, t: 'Movimento passivo conservato', se: (c) => c.romTable.some(r => /norm|compl|conserv/i.test(r.passivo || '')) }
    ],
    chiarire: [
      { t: 'Misurare in gradi la rotazione esterna passiva a braccio addotto, confrontandola con il lato sano', se: () => true }
    ],
    esame: [
      { test: 'Goniometria passiva di rotazione esterna, abduzione e rotazione interna', perche: 'il pattern capsulare è il criterio dirimente' },
      { test: 'Confronto sistematico con il lato controlaterale', perche: 'quantificare la perdita reale di movimento' }
    ],
    educa: {
      titolo: 'Educazione nella capsulite adesiva',
      punti: [
        'Spiegare le fasi del quadro (dolorosa, di rigidità, di risoluzione) e i tempi lunghi, spesso di 12-24 mesi.',
        'Nella fase dolorosa privilegiare il controllo del dolore; la mobilizzazione aggressiva è controproducente.',
        'Rassicurare sulla tendenza alla risoluzione, chiarendo che il percorso richiede pazienza.',
        'Insegnare esercizi domiciliari entro una soglia di dolore tollerabile, da svolgere con frequenza.'
      ]
    }
  },

  /* ---------------------------------------------------------------- */
  /* Arto inferiore                                                    */
  /* ---------------------------------------------------------------- */
  {
    id: 'femoro-rotuleo',
    nome: 'Dolore femoro-rotuleo',
    regioni: ['ginocch', 'rotul', 'patell'],
    indizi: [
      { p: P.forte, t: 'Dolore peritotuleo con scale, accovacciamento o seduta prolungata', se: (c) => c.aggravanti.some(a => /scal|accovacc|squat|sedut|cinema|auto/i.test(a.attivita || '')) },
      { p: P.medio, t: 'Dolore anteriore di ginocchio a esordio graduale', se: (c) => /Insidioso|sovraccarico/i.test(c.esordio) },
      { p: P.medio, t: 'Assenza di blocchi articolari veri', se: (c) => !c.sintomi.has('Blocchi articolari') },
      { p: P.debole, t: 'Crepitio o scrosci riferiti', se: (c) => c.sintomi.has('Click/scrosci') }
    ],
    contro: [
      { p: P.medio, t: 'Blocchi articolari veri o cedimenti', se: (c) => c.sintomi.has('Blocchi articolari') || c.sintomi.has('Instabilità/cedimenti') },
      { p: P.medio, t: 'Trauma distorsivo con versamento precoce', se: (c) => /Traumatico/.test(c.esordio) && c.sintomi.has('Gonfiore') }
    ],
    chiarire: [
      { t: 'Valutare forza di quadricipite e abduttori d’anca, e il controllo del valgo dinamico', se: () => true }
    ],
    esame: [
      { test: 'Squat monopodalico con osservazione del valgo dinamico', perche: 'individuare il deficit di controllo prossimale' },
      { test: 'Forza isometrica di quadricipite e abduttori d’anca', perche: 'i deficit sono bersaglio diretto del trattamento' },
      { test: 'Palpazione delle faccette rotulee e test di compressione', perche: 'confermare l’origine femoro-rotulea' },
      { test: 'Screening meniscale e legamentoso', perche: 'escludere le alternative traumatiche' }
    ],
    educa: {
      titolo: 'Educazione nel dolore femoro-rotuleo',
      punti: [
        'Spiegare che la cartilagine non è «consumata»: il dolore riflette un sovraccarico relativo, modificabile.',
        'Impostare una gestione del carico: ridurre temporaneamente le attività provocative senza fermarsi del tutto.',
        'Chiarire che il rinforzo di quadricipite e anca è il trattamento con le prove migliori, e richiede almeno 3 mesi.',
        'Definire una soglia di dolore accettabile durante l’esercizio, con recupero entro 24 ore.'
      ]
    }
  },
  {
    id: 'tendinopatia-achillea',
    nome: 'Tendinopatia achillea',
    regioni: ['caviglia', 'piede', 'achill', 'gamba', 'polpacc'],
    indizi: [
      { p: P.forte, t: 'Dolore localizzato al tendine d’Achille, peggiore all’inizio dell’attività', se: (c) => c.cerca(/achill|tendine.*(tallone|calcagn)/) },
      { p: P.medio, t: 'Rigidità mattutina localizzata che si riduce col movimento', se: (c) => c.cerca(/rigidit.*mattin|primi passi/) },
      { p: P.medio, t: 'Aumento recente del carico di allenamento', se: (c) => c.cerca(/aument.*(corsa|allenament|km|carico)|ripres.*attivit/) },
      { p: P.debole, t: 'Dolore che migliora durante il riscaldamento e ricompare dopo', se: (c) => c.cerca(/riscaldament|dopo l'attivit|a freddo/) }
    ],
    contro: [
      { p: P.forte, t: 'Deficit improvviso di forza con impossibilità di sollevarsi sull’avampiede', se: (c) => c.cerca(/non riesce.*punt|rottura|schiocco|colpo/) }
    ],
    chiarire: [
      { t: 'Quantificare la tolleranza al carico: numero di heel raise monopodalici e dolore associato', se: () => true }
    ],
    esame: [
      { test: 'Heel raise test monopodalico, contando le ripetizioni', perche: 'misura oggettiva della capacità di carico, utile come asterisco' },
      { test: 'Palpazione del tendine e dell’inserzione calcaneare', perche: 'distinguere forma di corpo tendineo e inserzionale, che si trattano diversamente' },
      { test: 'Test di Thompson', perche: 'escludere una rottura completa' }
    ],
    educa: {
      titolo: 'Educazione nella tendinopatia',
      punti: [
        'Spiegare che il tendine risponde al carico progressivo: il riposo completo lo indebolisce.',
        'Definire la regola del dolore accettabile durante e dopo l’esercizio, con normalizzazione entro 24 ore.',
        'Anticipare tempi realistici: il recupero richiede tipicamente 3-6 mesi di lavoro costante.',
        'Nella forma inserzionale evitare inizialmente la dorsiflessione di caviglia sotto carico, che comprime il tendine.'
      ]
    }
  }
];

/** Ipotesi applicabili alla regione indicata. */
export const perRegione = (c) =>
  IPOTESI.filter(i => (i.regioni.includes('*') || i.regioni.some(r => c.regione.includes(r))))
    .filter(i => { try { return !i.requisito || i.requisito(c); } catch { return true; } });
