/* ============================================================
   Schema della cartella clinica OMPT / IFOMPT
   ------------------------------------------------------------
   Struttura conforme agli Standard Formativi IFOMPT (Educational
   Standards, dimensione del ragionamento clinico) e all'International
   Framework for Examination of the Cervical Region (IFOMPT 2020).
   Lo schema e' dichiarativo: il renderer in ui/form.js lo trasforma
   in campi, e print.js lo trasforma nel documento cartaceo.

   Tipi di campo:
     text | textarea | num | date | time | sel | radio | chk | chips
     scale (NPRS 0-10) | table | body (body chart) | info
   Proprieta':
     k  chiave      l  etichetta     t  tipo          w  larghezza
     o  opzioni     hint  aiuto      rows  righe      cols  colonne (table)
     alert: true    -> il valore acceso viene evidenziato come segnale d'allarme
   ============================================================ */

export const SI_NO_ND = ['Sì', 'No', 'Non indagato'];
const LATO = ['—', 'Destro', 'Sinistro', 'Bilaterale', 'Centrale'];

/* ------------------------------------------------------------------ */
/* 1. ESAME SOGGETTIVO                                                 */
/* ------------------------------------------------------------------ */
export const SOGGETTIVO = [
  {
    id: 'invio',
    title: 'Dati dell’episodio di cura',
    fields: [
      { k: 'dataValutazione', l: 'Data della valutazione', t: 'date', w: 'third' },
      { k: 'motivoConsulto', l: 'Motivo del consulto (parole del paziente)', t: 'textarea', w: 'two-thirds', rows: 2,
        hint: 'Riportare la formulazione spontanea del paziente, tra virgolette.' },
      { k: 'inviatoDa', l: 'Inviato da', t: 'sel', w: 'third',
        o: ['Accesso diretto', 'Medico di medicina generale', 'Ortopedico', 'Fisiatra', 'Neurologo', 'Reumatologo', 'Altro specialista', 'Altro professionista sanitario', 'Passaparola'] },
      { k: 'diagnosiMedica', l: 'Diagnosi medica riferita', t: 'text', w: 'two-thirds' },
      { k: 'esamiStrumentali', l: 'Esami strumentali e referti', t: 'textarea', w: 'full', rows: 3,
        hint: 'Tipo di esame, data, reperti principali. Ricordare che i reperti di imaging vanno correlati alla clinica.' },
      { k: 'professione', l: 'Attività lavorativa e richieste fisiche', t: 'text', w: 'half' },
      { k: 'sportHobby', l: 'Sport, hobby e livello di attività', t: 'text', w: 'half' }
    ]
  },
  {
    id: 'bodychart',
    title: 'Body chart e caratteristiche dei sintomi',
    fields: [
      { k: 'bodyChart', l: 'Mappa corporea', t: 'body', w: 'full',
        hint: 'Clicca sulla figura per aggiungere un’area sintomatica numerata; descrivi ciascuna area nell’elenco a lato.' },
      { k: 'areaPrincipale', l: 'Area principale', t: 'text', w: 'half' },
      { k: 'latoPrincipale', l: 'Lato', t: 'sel', w: 'quarter', o: LATO },
      { k: 'dominanza', l: 'Dominanza', t: 'sel', w: 'quarter', o: ['—', 'Destrimane', 'Mancino', 'Ambidestro'] },
      { k: 'tipoDolore', l: 'Qualità del sintomo', t: 'chips', w: 'full',
        o: ['Sordo', 'Profondo', 'Urente/bruciante', 'Trafittivo', 'Pulsante', 'Crampiforme', 'Elettrico', 'Costrittivo', 'Rigidità', 'Pesantezza', 'Formicolio', 'Intorpidimento', 'Debolezza'] },
      { k: 'nprsAttuale', l: 'NPRS attuale', t: 'scale', w: 'third' },
      { k: 'nprsPeggiore', l: 'NPRS nelle ultime 24h (peggiore)', t: 'scale', w: 'third' },
      { k: 'nprsMigliore', l: 'NPRS nelle ultime 24h (migliore)', t: 'scale', w: 'third' },
      { k: 'costanteIntermittente', l: 'Andamento', t: 'radio', w: 'half',
        o: ['Costante', 'Costante con esacerbazioni', 'Intermittente'] },
      { k: 'relazioneAree', l: 'Relazione tra le aree sintomatiche', t: 'text', w: 'half',
        hint: 'Compaiono insieme? Una precede l’altra? Sono indipendenti?' },
      { k: 'sintomiAssociati', l: 'Sintomi associati', t: 'chips', w: 'full',
        o: ['Parestesie', 'Ipoestesia', 'Anestesia', 'Debolezza muscolare', 'Instabilità/cedimenti', 'Blocchi articolari', 'Click/scrosci', 'Gonfiore', 'Rigidità mattutina', 'Cefalea', 'Vertigini', 'Nausea'] },
      { k: 'noteSintomi', l: 'Note sui sintomi', t: 'textarea', w: 'full', rows: 2 }
    ]
  },
  {
    id: 'comportamento',
    title: 'Comportamento dei sintomi nelle 24 ore',
    fields: [
      { k: 'notte', l: 'Notte', t: 'textarea', w: 'half', rows: 3,
        hint: 'Posizione di riposo, risvegli, capacità di riaddormentarsi, dolore non posizionale.' },
      { k: 'mattino', l: 'Mattino', t: 'textarea', w: 'half', rows: 3,
        hint: 'Rigidità al risveglio e sua durata, primi movimenti.' },
      { k: 'giornata', l: 'Corso della giornata', t: 'textarea', w: 'half', rows: 2 },
      { k: 'sera', l: 'Sera', t: 'textarea', w: 'half', rows: 2 },
      { k: 'aggravanti', l: 'Fattori aggravanti', t: 'table', w: 'full',
        cols: [
          { k: 'attivita', l: 'Attività / posizione', t: 'text' },
          { k: 'tempoInsorgenza', l: 'Tempo di insorgenza', t: 'text', width: '130px' },
          { k: 'intensita', l: 'NPRS', t: 'num', width: '70px' },
          { k: 'recupero', l: 'Tempo di recupero', t: 'text', width: '130px' }
        ],
        hint: 'Base per la stima di severità e irritabilità e per la scelta della dose di trattamento.' },
      { k: 'allevianti', l: 'Fattori allevianti', t: 'table', w: 'full',
        cols: [
          { k: 'strategia', l: 'Posizione / strategia', t: 'text' },
          { k: 'effetto', l: 'Effetto ottenuto', t: 'text' },
          { k: 'tempo', l: 'Tempo di sollievo', t: 'text', width: '130px' }
        ] },
      { k: 'severita', l: 'Severità', t: 'radio', w: 'third', o: ['Bassa', 'Moderata', 'Alta'],
        hint: 'Quanto il sintomo limita l’attività e impone di interromperla.' },
      { k: 'irritabilita', l: 'Irritabilità', t: 'radio', w: 'third', o: ['Bassa', 'Moderata', 'Alta'],
        hint: 'Poco stimolo per provocare, molto tempo per calmare = alta irritabilità.' },
      { k: 'natura', l: 'Natura / stadio', t: 'radio', w: 'third', o: ['Acuto', 'Subacuto', 'Cronico', 'Riacutizzazione su cronico'] }
    ]
  },
  {
    id: 'storia',
    title: 'Storia attuale e passata',
    fields: [
      { k: 'esordioData', l: 'Data di esordio', t: 'text', w: 'third', hint: 'Anche approssimativa (es. "circa 3 mesi fa").' },
      { k: 'esordioModalita', l: 'Modalità di esordio', t: 'sel', w: 'third',
        o: ['Traumatico', 'Da sovraccarico', 'Insidioso/graduale', 'Post-chirurgico', 'Improvviso senza causa apparente', 'Altro'] },
      { k: 'andamento', l: 'Andamento dall’esordio', t: 'sel', w: 'third',
        o: ['In miglioramento', 'Stabile', 'In peggioramento', 'Fluttuante'] },
      { k: 'meccanismoLesione', l: 'Meccanismo lesionale / evento scatenante', t: 'textarea', w: 'full', rows: 2 },
      { k: 'trattamentiPrecedenti', l: 'Trattamenti effettuati per questo problema e risposta', t: 'textarea', w: 'full', rows: 3,
        hint: 'Cosa è stato fatto, per quanto tempo, con quale effetto: orienta la prognosi e la scelta terapeutica.' },
      { k: 'episodiPrecedenti', l: 'Episodi precedenti analoghi', t: 'textarea', w: 'full', rows: 2,
        hint: 'Numero, frequenza, durata, modalità di risoluzione.' },
      { k: 'anamnesiRemota', l: 'Anamnesi patologica remota, interventi, comorbidità', t: 'textarea', w: 'full', rows: 3 },
      { k: 'farmaci', l: 'Farmaci in uso (tipo, dose, efficacia)', t: 'textarea', w: 'half', rows: 2 },
      { k: 'allergie', l: 'Allergie e intolleranze', t: 'text', w: 'half' }
    ]
  },
  {
    id: 'redflags',
    title: 'Domande speciali e bandiere rosse',
    sub: 'Screening per patologia grave e per condizioni non di competenza fisioterapica. Un reperto positivo richiede approfondimento e, se indicato, invio medico.',
    fields: [
      { k: 'statoSaluteGenerale', l: 'Stato di salute generale', t: 'text', w: 'full' },
      { k: 'rfList', l: 'Segnali di allarme presenti', t: 'chips', w: 'full', alert: true,
        o: [
          'Perdita di peso involontaria', 'Febbre / sudorazione notturna', 'Storia di neoplasia',
          'Dolore notturno non meccanico', 'Dolore costante non modificabile', 'Malessere generale',
          'Trauma maggiore recente', 'Trauma minore con osteoporosi', 'Uso prolungato di corticosteroidi',
          'Terapia anticoagulante', 'Osteoporosi nota', 'Uso di droghe per via endovenosa',
          'Infezione recente', 'Chirurgia recente', 'Immunosoppressione',
          'Deficit neurologico progressivo', 'Deficit neurologico bilaterale', 'Disturbi dell’andatura',
          'Disturbi sfinterici (vescica/intestino)', 'Anestesia a sella', 'Disfunzione sessuale di nuova insorgenza',
          'Età < 20 o > 55 anni al primo episodio', 'Dolore toracico / addominale irradiato',
          'Claudicatio', 'Gravidanza in corso'
        ],
        hint: 'Cauda equina: ritenzione o incontinenza urinaria, incontinenza fecale, anestesia a sella, deficit motorio bilaterale progressivo = urgenza.' },
      { k: 'rfNote', l: 'Approfondimento sui segnali rilevati', t: 'textarea', w: 'full', rows: 3 },
      { k: 'inviuMedico', l: 'Necessità di invio / consulto medico', t: 'radio', w: 'half', alert: true,
        o: ['No', 'Sì — non urgente', 'Sì — urgente'] },
      { k: 'inviuMedicoNote', l: 'A chi e per cosa', t: 'text', w: 'half' }
    ]
  },
  {
    id: 'cervicale',
    title: 'Screening del rachide cervicale (IFOMPT Framework)',
    sub: 'Da compilare quando la regione cervicale è coinvolta nell’esame o nel trattamento, in particolare prima di tecniche di mobilizzazione/manipolazione. Riferimento: International Framework for Examination of the Cervical Region, IFOMPT 2020.',
    fields: [
      { k: 'cervRilevante', l: 'Screening cervicale pertinente al caso', t: 'radio', w: 'half', o: ['No', 'Sì'] },
      { k: 'cad5d3n', l: 'Sintomi di disfunzione arteriosa cervicale (5D & 3N)', t: 'chips', w: 'full', alert: true,
        o: ['Dizziness (vertigini)', 'Diplopia', 'Disartria', 'Disfagia', 'Drop attacks', 'Nausea', 'Nistagmo', 'Intorpidimento perimandibolare', 'Cefalea inusuale e improvvisa', 'Dolore cervicale inusuale e improvviso', 'Sindrome di Horner', 'Atassia / incoordinazione', 'Deficit nervi cranici'] },
      { k: 'cadFattoriRischio', l: 'Fattori di rischio vascolare', t: 'chips', w: 'full', alert: true,
        o: ['Ipertensione', 'Ipercolesterolemia', 'Cardiopatia', 'Diabete', 'Fumo', 'Coagulopatia', 'Terapia anticoagulante', 'Contraccettivi orali', 'Emicrania', 'Trauma cervicale recente', 'Infezione recente', 'Pregressa dissezione arteriosa', 'Gravidanza / post-partum recente'] },
      { k: 'instabilitaSintomi', l: 'Segni di instabilità craniocervicale', t: 'chips', w: 'full', alert: true,
        o: ['Sensazione di “testa che cade”', 'Necessità di sostenere il capo', 'Parestesie facciali/labiali', 'Segni bilaterali o a quadrante', 'Nistagmo', 'Lump in gola', 'Artrite reumatoide', 'Sindrome di Down', 'Trauma cervicale maggiore', 'Chirurgia cervicale recente'] },
      { k: 'pressioneArteriosa', l: 'Pressione arteriosa rilevata', t: 'text', w: 'third', hint: 'Consigliata in presenza di fattori di rischio.' },
      { k: 'cervTestEseguiti', l: 'Test funzionali cervicali eseguiti ed esito', t: 'textarea', w: 'two-thirds', rows: 2,
        hint: 'Es. mantenimento delle posizioni di fine range, Sharp-Purser, test del legamento alare/transverso, esame dei nervi cranici. Il test posizionale non è predittivo di per sé: conta il quadro complessivo.' },
      { k: 'cervConclusione', l: 'Conclusione dello screening e implicazioni sul trattamento', t: 'textarea', w: 'full', rows: 2, alert: true }
    ]
  },
  {
    id: 'bandiere',
    title: 'Bandiere gialle, blu, nere e arancioni',
    sub: 'Fattori psicosociali, lavorativi e di contesto che influenzano prognosi e scelta degli interventi.',
    fields: [
      { k: 'gialle', l: 'Bandiere gialle — fattori psicologici individuali', t: 'chips', w: 'full',
        o: ['Paura del movimento / kinesiofobia', 'Catastrofizzazione', 'Evitamento delle attività', 'Convinzione che il dolore sia dannoso', 'Aspettative negative sul recupero', 'Bassa autoefficacia', 'Iperviglianza', 'Umore deflesso', 'Ansia', 'Disturbi del sonno', 'Passività nel trattamento', 'Locus of control esterno'] },
      { k: 'blu', l: 'Bandiere blu — percezione del lavoro', t: 'chips', w: 'full',
        o: ['Lavoro percepito come dannoso', 'Insoddisfazione lavorativa', 'Scarso supporto dei colleghi', 'Rapporto conflittuale con i superiori', 'Elevate richieste fisiche', 'Scarso controllo sul proprio lavoro'] },
      { k: 'nere', l: 'Bandiere nere — contesto e sistema', t: 'chips', w: 'full',
        o: ['Contenzioso in corso', 'Pratica assicurativa / INAIL aperta', 'Richiesta di invalidità', 'Assenza prolungata dal lavoro', 'Mansione non modificabile', 'Difficoltà economiche', 'Scarso supporto familiare'] },
      { k: 'arancioni', l: 'Bandiere arancioni — segni psichiatrici', t: 'chips', w: 'full', alert: true,
        o: ['Depressione maggiore', 'Disturbo d’ansia conclamato', 'Disturbo post-traumatico da stress', 'Abuso di sostanze', 'Disturbo di personalità'] },
      { k: 'bandiereNote', l: 'Note e implicazioni per la gestione', t: 'textarea', w: 'full', rows: 3 },
      { k: 'aspettative', l: 'Aspettative e obiettivi del paziente', t: 'textarea', w: 'full', rows: 2,
        hint: 'Cosa si aspetta dal trattamento, cosa vuole tornare a fare, in quanto tempo.' }
    ]
  }
];

/* ------------------------------------------------------------------ */
/* 2. IPOTESI PRE-ESAME FISICO                                         */
/* ------------------------------------------------------------------ */
export const IPOTESI = [
  {
    id: 'ragionamentoPre',
    title: 'Ipotesi pre-esame fisico',
    sub: 'Formulazione delle ipotesi prima dell’esame obiettivo: guida la selezione e l’ordine dei test.',
    fields: [
      { k: 'ipotesiPrincipale', l: 'Ipotesi principale', t: 'textarea', w: 'full', rows: 2 },
      { k: 'ipotesiAlternative', l: 'Ipotesi alternative / diagnosi differenziale', t: 'textarea', w: 'full', rows: 3 },
      { k: 'fonteSintomi', l: 'Possibili fonti dei sintomi', t: 'chips', w: 'full',
        o: ['Articolare', 'Discale', 'Muscolo-tendinea', 'Legamentosa', 'Neurale periferica', 'Radicolare', 'Fasciale', 'Ossea', 'Viscerale referita', 'Vascolare', 'Sistema nervoso centrale'] },
      { k: 'meccanismoDolore', l: 'Meccanismo del dolore dominante', t: 'radio', w: 'full',
        o: ['Nocicettivo', 'Neuropatico', 'Nociplastico', 'Misto'],
        hint: 'Classificazione IASP. Nocicettivo: proporzionale, meccanico, localizzato. Neuropatico: distribuzione neuroanatomica, segni negativi/positivi. Nociplastico: sproporzionato, diffuso, ipersensibilità diffusa, comorbidità.' },
      { k: 'meccanismoNote', l: 'Elementi a supporto della classificazione', t: 'textarea', w: 'full', rows: 2 },
      { k: 'fattoriContribuenti', l: 'Fattori contribuenti', t: 'textarea', w: 'full', rows: 3,
        hint: 'Biomeccanici, ergonomici, di carico allenante, comportamentali, psicosociali, sistemici.' },
      { k: 'precauzioni', l: 'Precauzioni all’esame e al trattamento', t: 'textarea', w: 'half', rows: 3, alert: true },
      { k: 'controindicazioni', l: 'Controindicazioni', t: 'textarea', w: 'half', rows: 3, alert: true },
      { k: 'pianoEsame', l: 'Piano dell’esame fisico', t: 'textarea', w: 'full', rows: 2,
        hint: 'Quali test, in che ordine, con quale dose (fino a insorgenza/riproduzione parziale/totale del sintomo).' }
    ]
  }
];

/* ------------------------------------------------------------------ */
/* 3. ESAME FISICO                                                     */
/* ------------------------------------------------------------------ */
export const OBIETTIVO = [
  {
    id: 'osservazione',
    title: 'Osservazione e screening',
    fields: [
      { k: 'osservazione', l: 'Osservazione generale, postura, atteggiamento antalgico', t: 'textarea', w: 'full', rows: 3 },
      { k: 'trofismoCute', l: 'Trofismo, cute, gonfiore, colorito', t: 'textarea', w: 'half', rows: 2 },
      { k: 'deambulazione', l: 'Deambulazione e transizioni posturali', t: 'textarea', w: 'half', rows: 2 },
      { k: 'screeningAdiacenti', l: 'Screening delle regioni adiacenti', t: 'textarea', w: 'full', rows: 2,
        hint: 'Escludere o includere le regioni che possono riferire sintomi nell’area in esame.' },
      { k: 'testFunzionaleDimostrato', l: 'Movimento funzionale dimostrato dal paziente', t: 'textarea', w: 'full', rows: 2,
        hint: 'Chiedere al paziente di riprodurre il gesto che provoca i sintomi; base per un asterisco funzionale.' }
    ]
  },
  {
    id: 'movimenti',
    title: 'Movimenti attivi e passivi',
    fields: [
      { k: 'romTable', l: 'Range di movimento', t: 'table', w: 'full',
        cols: [
          { k: 'movimento', l: 'Movimento', t: 'text' },
          { k: 'attivo', l: 'Attivo', t: 'text', width: '110px' },
          { k: 'passivo', l: 'Passivo', t: 'text', width: '110px' },
          { k: 'dolore', l: 'Dolore (NPRS)', t: 'text', width: '100px' },
          { k: 'endFeel', l: 'End-feel', t: 'sel', width: '140px',
            o: ['', 'Capsulare', 'Osseo', 'Molle', 'Elastico', 'Spasmo', 'Vuoto', 'Springy block'] },
          { k: 'note', l: 'Qualità / note', t: 'text' }
        ],
        hint: 'Indicare quantità (gradi o % del range atteso), qualità del movimento e comportamento del dolore durante l’arco.' },
      { k: 'sovrapressione', l: 'Sovrapressioni ed esiti', t: 'textarea', w: 'half', rows: 2 },
      { k: 'combinati', l: 'Movimenti combinati / quadranti', t: 'textarea', w: 'half', rows: 2 },
      { k: 'ripetuti', l: 'Movimenti ripetuti e preferenza direzionale', t: 'textarea', w: 'full', rows: 2,
        hint: 'Centralizzazione/periferizzazione dei sintomi, effetto duraturo dopo la serie.' }
    ]
  },
  {
    id: 'neuro',
    title: 'Esame neurologico e neurodinamico',
    fields: [
      { k: 'neuroIndicato', l: 'Esame neurologico indicato', t: 'radio', w: 'third', o: ['No', 'Sì'] },
      { k: 'dermatomeri', l: 'Sensibilità / dermatomeri', t: 'textarea', w: 'two-thirds', rows: 2 },
      { k: 'miotomi', l: 'Forza segmentaria / miotomi (MRC 0-5)', t: 'table', w: 'full',
        cols: [
          { k: 'livello', l: 'Livello / muscolo', t: 'text' },
          { k: 'dx', l: 'Destra', t: 'sel', width: '90px', o: ['', '0', '1', '2', '3', '3+', '4-', '4', '4+', '5'] },
          { k: 'sx', l: 'Sinistra', t: 'sel', width: '90px', o: ['', '0', '1', '2', '3', '3+', '4-', '4', '4+', '5'] },
          { k: 'note', l: 'Note', t: 'text' }
        ] },
      { k: 'riflessi', l: 'Riflessi osteotendinei', t: 'text', w: 'full' },
      { k: 'segniUMN', l: 'Segni di primo motoneurone', t: 'chips', w: 'full', alert: true,
        o: ['Babinski positivo', 'Clono', 'Hoffmann positivo', 'Iperreflessia', 'Ipertono spastico', 'Atassia'] },
      { k: 'neurodinamica', l: 'Test neurodinamici', t: 'table', w: 'full',
        cols: [
          { k: 'test', l: 'Test', t: 'sel', o: ['', 'SLR', 'SLR crociato', 'Slump', 'PKB (femorale)', 'ULNT1 mediano', 'ULNT2a mediano', 'ULNT2b radiale', 'ULNT3 ulnare', 'Altro'] },
          { k: 'lato', l: 'Lato', t: 'sel', width: '110px', o: ['', 'Dx', 'Sx', 'Bilaterale'] },
          { k: 'range', l: 'Range raggiunto', t: 'text', width: '120px' },
          { k: 'sintomi', l: 'Sintomi evocati', t: 'text' },
          { k: 'differenziazione', l: 'Differenziazione strutturale', t: 'text' },
          { k: 'esito', l: 'Esito', t: 'sel', width: '110px', o: ['', 'Positivo', 'Negativo', 'Dubbio'] }
        ] },
      { k: 'palpazioneNervi', l: 'Palpazione dei tronchi nervosi e allodinia meccanica', t: 'text', w: 'full' }
    ]
  },
  {
    id: 'accessori',
    title: 'Esame accessorio e palpazione',
    fields: [
      { k: 'paivm', l: 'Movimenti accessori (PAIVM / PPIVM)', t: 'table', w: 'full',
        cols: [
          { k: 'segmento', l: 'Segmento / articolazione', t: 'text', width: '150px' },
          { k: 'direzione', l: 'Direzione', t: 'text', width: '150px' },
          { k: 'resistenza', l: 'Resistenza', t: 'sel', width: '120px', o: ['', 'Normale', 'Ridotta', 'Aumentata', 'Rigida'] },
          { k: 'dolore', l: 'Dolore', t: 'text', width: '110px' },
          { k: 'spasmo', l: 'Spasmo', t: 'sel', width: '100px', o: ['', 'Assente', 'Presente'] },
          { k: 'note', l: 'Risposta sintomatica / note', t: 'text' }
        ],
        hint: 'Annotare la relazione tra dolore e resistenza (movement diagram) e la riproduzione del comparable sign.' },
      { k: 'palpazione', l: 'Palpazione: temperatura, tono, dolorabilità, trigger point', t: 'textarea', w: 'full', rows: 3 },
      { k: 'testSpeciali', l: 'Test speciali / cluster', t: 'table', w: 'full',
        cols: [
          { k: 'test', l: 'Test o cluster', t: 'text' },
          { k: 'lato', l: 'Lato', t: 'sel', width: '100px', o: ['', 'Dx', 'Sx', 'Bilaterale'] },
          { k: 'esito', l: 'Esito', t: 'sel', width: '120px', o: ['', 'Positivo', 'Negativo', 'Dubbio', 'Non eseguito'] },
          { k: 'note', l: 'Note', t: 'text' }
        ],
        hint: 'Interpretare i test all’interno di un cluster e alla luce della probabilità pre-test, non isolatamente.' }
    ]
  },
  {
    id: 'funzione',
    title: 'Forza, controllo motorio e performance',
    fields: [
      { k: 'forza', l: 'Valutazione della forza (dinamometria, MRC, test funzionali)', t: 'textarea', w: 'full', rows: 3 },
      { k: 'controlloMotorio', l: 'Controllo motorio e stabilità', t: 'textarea', w: 'full', rows: 3 },
      { k: 'testPerformance', l: 'Test di performance', t: 'table', w: 'full',
        cols: [
          { k: 'test', l: 'Test', t: 'text' },
          { k: 'risultato', l: 'Risultato', t: 'text', width: '140px' },
          { k: 'riferimento', l: 'Valore di riferimento / arto sano', t: 'text', width: '180px' },
          { k: 'note', l: 'Note', t: 'text' }
        ],
        hint: 'Es. single leg hop test, heel raise test, timed up and go, grip strength, 6 minute walk test.' },
      { k: 'misureAggiuntive', l: 'Altre misure (circonferenze, goniometria, gonfiore)', t: 'textarea', w: 'full', rows: 2 }
    ]
  }
];

/* ------------------------------------------------------------------ */
/* 4. DIAGNOSI E RAGIONAMENTO                                          */
/* ------------------------------------------------------------------ */
export const DIAGNOSI = [
  {
    id: 'diagnosi',
    title: 'Diagnosi fisioterapica e ragionamento clinico',
    fields: [
      { k: 'diagnosiFt', l: 'Diagnosi fisioterapica', t: 'textarea', w: 'full', rows: 3,
        hint: 'Descrizione del problema in termini di funzione, non solo di struttura.' },
      { k: 'meccanismoConferma', l: 'Meccanismo del dolore confermato dopo l’esame', t: 'radio', w: 'full',
        o: ['Nocicettivo', 'Neuropatico', 'Nociplastico', 'Misto'] },
      { k: 'icfMenomazioni', l: 'ICF — menomazioni di funzione e struttura', t: 'textarea', w: 'full', rows: 2 },
      { k: 'icfAttivita', l: 'ICF — limitazioni delle attività', t: 'textarea', w: 'half', rows: 2 },
      { k: 'icfPartecipazione', l: 'ICF — restrizioni della partecipazione', t: 'textarea', w: 'half', rows: 2 },
      { k: 'icfContestuali', l: 'ICF — fattori ambientali e personali', t: 'textarea', w: 'full', rows: 2 },
      { k: 'fattoriProgFav', l: 'Fattori prognostici favorevoli', t: 'textarea', w: 'half', rows: 2 },
      { k: 'fattoriProgSfav', l: 'Fattori prognostici sfavorevoli', t: 'textarea', w: 'half', rows: 2 },
      { k: 'prognosi', l: 'Prognosi e tempi attesi', t: 'textarea', w: 'full', rows: 2 }
    ]
  },
  {
    id: 'asterischi',
    title: 'Asterischi (comparable signs)',
    sub: 'Misure di riferimento rivalutate a ogni seduta per verificare l’effetto del trattamento.',
    fields: [
      { k: 'asterischi', l: 'Asterischi', t: 'table', w: 'full',
        cols: [
          { k: 'segno', l: 'Segno / test', t: 'text' },
          { k: 'tipo', l: 'Tipo', t: 'sel', width: '130px', o: ['', 'Funzionale', 'Movimento', 'Palpatorio', 'Neurodinamico', 'PROM', 'Altro'] },
          { k: 'baseline', l: 'Valore iniziale', t: 'text', width: '160px' },
          { k: 'obiettivo', l: 'Valore atteso', t: 'text', width: '150px' }
        ],
        hint: 'Sceglierne 2-4, misurabili e rilevanti per il paziente. Vengono riproposti automaticamente nella rivalutazione di ogni seduta.' }
    ]
  }
];

/* ------------------------------------------------------------------ */
/* 5. PIANO DI TRATTAMENTO                                             */
/* ------------------------------------------------------------------ */
export const PIANO = [
  {
    id: 'obiettivi',
    title: 'Obiettivi condivisi',
    fields: [
      { k: 'obiettiviTab', l: 'Obiettivi SMART', t: 'table', w: 'full',
        cols: [
          { k: 'obiettivo', l: 'Obiettivo', t: 'text' },
          { k: 'orizzonte', l: 'Orizzonte', t: 'sel', width: '140px', o: ['', 'Breve termine', 'Medio termine', 'Lungo termine'] },
          { k: 'misura', l: 'Come si misura', t: 'text', width: '200px' },
          { k: 'scadenza', l: 'Entro', t: 'text', width: '120px' }
        ],
        hint: 'Specifici, misurabili, raggiungibili, rilevanti, temporizzati; condivisi con il paziente.' }
    ]
  },
  {
    id: 'interventi',
    title: 'Interventi e dosaggio',
    fields: [
      { k: 'interventi', l: 'Interventi previsti', t: 'chips', w: 'full',
        o: ['Educazione e rassicurazione', 'Neuroscienze del dolore', 'Terapia manuale — mobilizzazione', 'Terapia manuale — manipolazione', 'Tecniche sui tessuti molli', 'Mobilizzazione neurodinamica', 'Esercizio terapeutico', 'Rinforzo progressivo', 'Controllo motorio', 'Esercizio aerobico', 'Ricondizionamento al carico', 'Gestione del ritorno allo sport', 'Ergonomia e gestione del carico', 'Esposizione graduale', 'Taping', 'Terapia fisica strumentale', 'Idrokinesiterapia', 'Programma domiciliare'] },
      { k: 'ragionaleInterventi', l: 'Razionale della scelta', t: 'textarea', w: 'full', rows: 3,
        hint: 'Collegare ogni intervento all’ipotesi, al meccanismo del dolore e agli obiettivi del paziente.' },
      { k: 'dosaggio', l: 'Dosaggio e progressione', t: 'textarea', w: 'full', rows: 3 },
      { k: 'frequenza', l: 'Frequenza prevista', t: 'text', w: 'third' },
      { k: 'seduteStimate', l: 'Numero di sedute stimato', t: 'num', w: 'third' },
      { k: 'rivalutazioneOgni', l: 'Rivalutazione formale ogni', t: 'text', w: 'third', hint: 'Es. ogni 4 sedute o ogni 3 settimane.' },
      { k: 'esercizioDomiciliare', l: 'Programma domiciliare consegnato', t: 'textarea', w: 'full', rows: 3 },
      { k: 'criteriDimissione', l: 'Criteri di dimissione', t: 'textarea', w: 'full', rows: 2 },
      { k: 'consensoInformato', l: 'Consenso informato raccolto', t: 'radio', w: 'half',
        o: ['No', 'Sì — verbale', 'Sì — scritto'],
        hint: 'Per le tecniche di manipolazione ad alta velocità è raccomandato il consenso scritto e specifico.' },
      { k: 'consensoData', l: 'Data del consenso', t: 'date', w: 'half' }
    ]
  }
];

/* ------------------------------------------------------------------ */
/* 6. ESITO E DIMISSIONE                                               */
/* ------------------------------------------------------------------ */
export const ESITO = [
  {
    id: 'esito',
    title: 'Esito e dimissione',
    fields: [
      { k: 'dataDimissione', l: 'Data di dimissione', t: 'date', w: 'third' },
      { k: 'esitoGlobale', l: 'Esito', t: 'sel', w: 'third',
        o: ['', 'Risoluzione completa', 'Netto miglioramento', 'Miglioramento parziale', 'Invariato', 'Peggiorato', 'Interrotto dal paziente', 'Inviato ad altro professionista'] },
      { k: 'groc', l: 'GROC (da -7 a +7)', t: 'num', w: 'third', hint: 'Global Rating of Change riferito dal paziente.' },
      { k: 'asterischiFinali', l: 'Asterischi alla dimissione', t: 'textarea', w: 'full', rows: 3 },
      { k: 'raccomandazioni', l: 'Raccomandazioni e prevenzione delle recidive', t: 'textarea', w: 'full', rows: 3 },
      { k: 'followUp', l: 'Follow-up programmato', t: 'text', w: 'full' },
      { k: 'noteFinali', l: 'Note conclusive', t: 'textarea', w: 'full', rows: 3 }
    ]
  }
];

/* ------------------------------------------------------------------ */
/* Sezioni della seduta (SOAP)                                         */
/* ------------------------------------------------------------------ */
export const SEDUTA = [
  {
    id: 'soggettivoSeduta',
    title: 'S — Soggettivo',
    fields: [
      { k: 'variazione', l: 'Variazione dalla seduta precedente', t: 'sel', w: 'third',
        o: ['', 'Molto migliorato', 'Migliorato', 'Invariato', 'Peggiorato', 'Molto peggiorato'] },
      { k: 'nprs', l: 'NPRS attuale', t: 'scale', w: 'third' },
      { k: 'aderenza', l: 'Aderenza al programma domiciliare', t: 'sel', w: 'third',
        o: ['', 'Completa', 'Parziale', 'Assente', 'Non applicabile'] },
      { k: 'soggettivo', l: 'Riferito dal paziente', t: 'textarea', w: 'full', rows: 3,
        hint: 'Risposta al trattamento precedente (durata dell’effetto), eventi intercorsi, nuovi sintomi.' }
    ]
  },
  {
    id: 'oggettivoSeduta',
    title: 'O — Oggettivo',
    fields: [
      { k: 'rivalutazione', l: 'Rivalutazione degli asterischi', t: 'asterischi', w: 'full' },
      { k: 'trattamento', l: 'Trattamento eseguito', t: 'table', w: 'full',
        cols: [
          { k: 'intervento', l: 'Tecnica / esercizio', t: 'text' },
          { k: 'distretto', l: 'Distretto', t: 'text', width: '150px' },
          { k: 'dose', l: 'Dose (grado, serie, ripetizioni, tempo)', t: 'text', width: '220px' },
          { k: 'rispostaImmediata', l: 'Risposta immediata', t: 'text' }
        ] },
      { k: 'oggettivoNote', l: 'Altri reperti', t: 'textarea', w: 'full', rows: 2 }
    ]
  },
  {
    id: 'assessmentSeduta',
    title: 'A — Assessment',
    fields: [
      { k: 'assessment', l: 'Interpretazione', t: 'textarea', w: 'full', rows: 3,
        hint: 'L’ipotesi regge? Il trattamento ha prodotto l’effetto atteso sugli asterischi? Cosa modificare?' }
    ]
  },
  {
    id: 'planSeduta',
    title: 'P — Plan',
    fields: [
      { k: 'plan', l: 'Piano per la seduta successiva', t: 'textarea', w: 'full', rows: 3 },
      { k: 'domiciliare', l: 'Programma domiciliare aggiornato', t: 'textarea', w: 'full', rows: 2 },
      { k: 'prossimaSeduta', l: 'Data prossimo appuntamento', t: 'date', w: 'third' }
    ]
  }
];

/* Raccolta completa, usata da stampa ed esportazione */
export const CARTELLA = [
  { key: 'soggettivo', label: 'Esame soggettivo', sections: SOGGETTIVO },
  { key: 'ipotesi', label: 'Ipotesi e ragionamento', sections: IPOTESI },
  { key: 'obiettivo', label: 'Esame fisico', sections: OBIETTIVO },
  { key: 'diagnosi', label: 'Diagnosi', sections: DIAGNOSI },
  { key: 'piano', label: 'Piano di trattamento', sections: PIANO },
  { key: 'esito', label: 'Esito', sections: ESITO }
];

/** Elenco piatto dei campi contrassegnati come allerta, per il riepilogo in cima alla cartella. */
export function campiAllerta() {
  const out = [];
  for (const parte of CARTELLA) {
    for (const sec of parte.sections) {
      for (const f of sec.fields) {
        if (f.alert) out.push({ parte: parte.key, sezione: sec.id, campo: f.k, label: f.l });
      }
    }
  }
  return out;
}
