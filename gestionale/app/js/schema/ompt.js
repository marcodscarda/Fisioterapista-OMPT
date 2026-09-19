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
/* 3-bis. EQUILIBRIO E SISTEMA VESTIBOLARE                             */
/* ------------------------------------------------------------------ */
/*
   Sezione speciale, da compilare quando il motivo del consulto e' una
   vertigine, un capogiro, un'instabilita' o una caduta.

   Riferimenti adottati:
   - Barany Society, International Classification of Vestibular Disorders
     (ICVD): definizione dei sintomi (ICVD-I, 2009) e criteri diagnostici
     per VPPB (2015), malattia di Meniere (2015), emicrania vestibolare
     (2012, revisione 2022), PPPD (2017), vestibolopatia bilaterale (2017),
     presbivestibolopatia (2019), vestibolopatia unilaterale acuta (2022).
   - TiTrATE (Newman-Toker): l'inquadramento parte da timing e trigger,
     non dalla qualita' del sintomo, che il paziente descrive in modo
     poco affidabile.
   - HINTS / HINTS-plus (Kattah 2009) nella sindrome vestibolare acuta.
   - Vestibular Rehabilitation for Peripheral Vestibular Hypofunction:
     Clinical Practice Guideline, aggiornamento 2022 (APTA, Academy of
     Neurologic Physical Therapy), per esercizio e dosaggio.
   - AAO-HNSF Clinical Practice Guideline: Benign Paroxysmal Positional
     Vertigo (update 2017) per test posizionali e manovre.
*/
export const VESTIBOLARE = [
  {
    id: 'vestInquadramento',
    title: 'Inquadramento del sintomo (timing e trigger)',
    sub: 'La classificazione parte da quando compare il sintomo e da che cosa lo scatena, non da come il paziente lo descrive: la qualità riferita («gira», «sbanda», «testa leggera») non distingue le diagnosi in modo affidabile. Terminologia secondo l’International Classification of Vestibular Disorders della Bárány Society.',
    fields: [
      { k: 'vestRilevante', l: 'Valutazione vestibolare pertinente al caso', t: 'radio', w: 'half', o: ['No', 'Sì'],
        hint: 'Compila questa parte se il paziente riferisce vertigine, capogiro, instabilità, oscillopsia o cadute.' },
      { k: 'vestTipoSintomo', l: 'Tipo di sintomo riferito', t: 'chips', w: 'full',
        o: ['Vertigine (illusione di movimento)', 'Capogiro / testa leggera (dizziness)', 'Instabilità posturale (unsteadiness)', 'Oscillopsia', 'Vertigine visiva (ambienti complessi)', 'Sfocamento con il movimento del capo'] },
      { k: 'vestTiming', l: 'Andamento temporale (timing)', t: 'radio', w: 'full',
        o: ['Episodico spontaneo', 'Episodico scatenato', 'Acuto continuo (sindrome vestibolare acuta)', 'Cronico continuo', 'Progressivo'],
        hint: 'Episodico scatenato → VPPB, ipotensione ortostatica. Episodico spontaneo → emicrania vestibolare, Ménière, TIA. Acuto continuo → neurite vestibolare o ictus: qui si applica l’HINTS.' },
      { k: 'vestDurata', l: 'Durata del singolo episodio', t: 'sel', w: 'third',
        o: ['—', 'Secondi', 'Meno di 1 minuto', 'Da 1 a 20 minuti', 'Da 20 minuti a 12 ore', 'Da 12 a 24 ore', 'Giorni', 'Costante'],
        hint: 'Secondi con trigger posizionale → VPPB. Da 20 minuti a 12 ore → Ménière. Da minuti a giorni con emicrania → emicrania vestibolare.' },
      { k: 'vestEsordio', l: 'Esordio e decorso dall’inizio', t: 'textarea', w: 'two-thirds', rows: 2,
        hint: 'Da quanto, come è iniziato, che cosa lo ha preceduto (infezione, trauma, stress), come è cambiato.' },
      { k: 'vestTrigger', l: 'Fattori scatenanti', t: 'chips', w: 'full',
        o: ['Rotolarsi nel letto', 'Coricarsi o alzarsi dal letto', 'Guardare in alto (estensione del capo)', 'Flettere il capo in avanti', 'Movimenti rapidi del capo', 'Passare alla stazione eretta', 'Ambienti visivamente affollati (supermercato, folla)', 'Schermi e scorrimento', 'Camminare al buio o su fondo irregolare', 'Rumori intensi (fenomeno di Tullio)', 'Valsalva, starnuto, colpo di tosse', 'Sforzo fisico', 'Nessun fattore riconoscibile'] },
      { k: 'vestUditivi', l: 'Sintomi uditivi associati', t: 'chips', w: 'full',
        o: ['Ipoacusia', 'Ipoacusia fluttuante', 'Acufene', 'Ovattamento auricolare (fullness)', 'Iperacusia', 'Autofonia', 'Otorrea', 'Otalgia', 'Nessuno'],
        hint: 'La presenza di sintomi uditivi orienta verso una causa otologica e richiede valutazione audiologica.' },
      { k: 'vestNeuroveg', l: 'Corteo neurovegetativo ed emicranico', t: 'chips', w: 'full',
        o: ['Nausea', 'Vomito', 'Sudorazione', 'Cefalea durante l’episodio', 'Fotofobia', 'Fonofobia', 'Aura visiva', 'Cinetosi (mal d’auto/mare)'] },
      { k: 'vestEmicrania', l: 'Storia di emicrania (criteri ICHD-3)', t: 'radio', w: 'third', o: SI_NO_ND },
      { k: 'vestAnsia', l: 'Ansia, attacchi di panico o ipervigilanza posturale', t: 'radio', w: 'third', o: SI_NO_ND,
        hint: 'Elemento costitutivo del PPPD, non un giudizio sul paziente: va indagato e spiegato.' },
      { k: 'vestCadute', l: 'Cadute negli ultimi 12 mesi (numero)', t: 'num', w: 'third',
        hint: 'Due o più cadute, oppure una caduta con trauma, identificano un paziente ad alto rischio.' },
      { k: 'vestPrecedenti', l: 'Anamnesi otoneurologica e generale', t: 'chips', w: 'full',
        o: ['Trauma cranico o colpo di frusta', 'Precedenti episodi di VPPB', 'Neurite vestibolare pregressa', 'Malattia di Ménière', 'Chirurgia otologica', 'Otite media cronica', 'Neurinoma dell’acustico', 'Ictus o TIA', 'Sclerosi multipla', 'Parkinson o parkinsonismi', 'Neuropatia periferica', 'Diabete', 'Deficit visivo o cataratta recente', 'Cambio recente di occhiali o lenti progressive'] },
      { k: 'vestFarmaci', l: 'Farmaci in uso', t: 'textarea', w: 'full', rows: 2,
        hint: 'Annotare in particolare sedativi vestibolari e benzodiazepine (rallentano il compenso), antiipertensivi, antidepressivi, antiepilettici, aminoglicosidi e chemioterapici ototossici.' },
      { k: 'vestImpatto', l: 'Impatto su autonomia, guida, lavoro e partecipazione', t: 'textarea', w: 'full', rows: 2 }
    ]
  },
  {
    id: 'vestAllarme',
    title: 'Segnali di allarme e sospetto di causa centrale',
    sub: 'Da verificare prima di qualunque test provocativo o manovra. Un solo elemento presente impone il confronto con il medico e, in caso di sindrome vestibolare acuta, l’invio urgente.',
    fields: [
      { k: 'vestRedFlags', l: 'Segnali di allarme', t: 'chips', w: 'full', alert: true,
        o: ['Cefalea improvvisa e intensissima (“a rombo di tuono”)', 'Deficit neurologici focali', 'Diplopia', 'Disartria', 'Disfagia', 'Ipostenia o ipoestesia di un emilato', 'Atassia del tronco che impedisce la stazione eretta', 'Ipoacusia acuta unilaterale di nuova insorgenza', 'Nistagmo verticale puro o torsionale puro', 'Nistagmo che cambia direzione con la direzione dello sguardo', 'Nistagmo non soppresso dalla fissazione', 'Skew deviation', 'Head Impulse Test normale in vertigine acuta continua', 'Dolore cervicale o occipitale inusuale e improvviso', 'Sincope o drop attack', 'Perdita di coscienza'] },
      { k: 'vestHints', l: 'HINTS — solo nella sindrome vestibolare acuta continua in atto', t: 'sel', w: 'half',
        o: ['Non applicabile', 'Quadro periferico (HIT patologico, nistagmo unidirezionale, nessuna skew)', 'Quadro centrale (anche un solo elemento: HIT normale, nistagmo direzione-mutevole, skew presente)', 'Non valutabile'],
        hint: 'La batteria si applica soltanto a una vertigine acuta continua in corso, da esaminatore allenato. In quel contesto un quadro “centrale” è più sensibile della risonanza precoce nell’individuare un ictus. Non va usata nelle vertigini episodiche o già risolte.' },
      { k: 'vestOrtostatica', l: 'Pressione arteriosa in clino e in ortostatismo (1’ e 3’)', t: 'text', w: 'half',
        hint: 'Calo ≥ 20 mmHg di sistolica o ≥ 10 mmHg di diastolica: ipotensione ortostatica.' },
      { k: 'vestConclusioneAllarme', l: 'Conclusione dello screening e decisione assunta', t: 'textarea', w: 'full', rows: 2, alert: true,
        hint: 'Compilare solo quando c’è qualcosa da segnalare: il contenuto compare nel riquadro di allerta in cima alla cartella.' }
    ]
  },
  {
    id: 'vestOculomotore',
    title: 'Esame oculomotore e riflesso vestibolo-oculomotore',
    sub: 'La ricerca del nistagmo va fatta rimuovendo la fissazione (occhiali di Frenzel, videoculoscopia o, in mancanza, test di Frenzel improvvisato al buio): il nistagmo periferico viene soppresso dalla fissazione e senza questo accorgimento sfugge.',
    fields: [
      { k: 'vestNistagmo', l: 'Nistagmo spontaneo (senza fissazione)', t: 'sel', w: 'half',
        o: ['Assente', 'Orizzontale-torsionale unidirezionale', 'Orizzontale puro unidirezionale', 'Verticale verso l’alto (upbeat)', 'Verticale verso il basso (downbeat)', 'Torsionale puro', 'Direzione mutevole', 'Non valutato'] },
      { k: 'vestNistagmoLato', l: 'Fase rapida diretta verso', t: 'sel', w: 'quarter', o: LATO },
      { k: 'vestFissazione', l: 'Effetto della fissazione', t: 'sel', w: 'quarter',
        o: ['Non valutato', 'Il nistagmo si sopprime (orienta al periferico)', 'Il nistagmo non si sopprime (orienta al centrale)', 'Non applicabile'] },
      { k: 'vestGazeEvoked', l: 'Nistagmo evocato dallo sguardo eccentrico', t: 'radio', w: 'third', o: SI_NO_ND },
      { k: 'vestInseguimento', l: 'Inseguimento lento (smooth pursuit)', t: 'sel', w: 'third',
        o: ['Non valutato', 'Fluido', 'Saccadico'] },
      { k: 'vestSaccadi', l: 'Saccadi', t: 'sel', w: 'third',
        o: ['Non valutate', 'Normometriche', 'Ipometriche', 'Ipermetriche', 'Rallentate'] },
      { k: 'vestHitDx', l: 'Head Impulse Test — destro', t: 'sel', w: 'third',
        o: ['Non valutato', 'Normale', 'Saccade di rifissazione palese (deficit)', 'Saccade coperta (sospetto deficit)'] },
      { k: 'vestHitSx', l: 'Head Impulse Test — sinistro', t: 'sel', w: 'third',
        o: ['Non valutato', 'Normale', 'Saccade di rifissazione palese (deficit)', 'Saccade coperta (sospetto deficit)'] },
      { k: 'vestHsn', l: 'Nistagmo da head shaking', t: 'sel', w: 'third',
        o: ['Non valutato', 'Assente', 'Verso il lato sano (deficit controlaterale)', 'Verso il lato leso', 'Perverted: verticale dopo scuotimento orizzontale (sospetto centrale)'] },
      { k: 'vestSkew', l: 'Skew deviation (cover test alternato)', t: 'radio', w: 'third', o: SI_NO_ND },
      { k: 'vestDva', l: 'Acuità visiva dinamica — righe perse', t: 'num', w: 'third',
        hint: 'Differenza fra acuità statica e acuità con oscillazione del capo a 2 Hz. Una perdita di 3 o più righe indica un deficit del riflesso vestibolo-oculomotore.' },
      { k: 'vestVibrazione', l: 'Nistagmo da vibrazione mastoidea', t: 'sel', w: 'third',
        o: ['Non valutato', 'Assente', 'Presente, verso il lato sano', 'Presente, verso il lato leso'] },
      { k: 'vestStrumentali', l: 'Esami strumentali otoneurologici', t: 'textarea', w: 'full', rows: 2,
        hint: 'vHIT con guadagno del VOR per canale, prove caloriche, VEMP cervicali e oculari, video-oculografia, audiometria tonale, posturografia: riportare data e reperti.' },
      { k: 'vestNoteOculo', l: 'Note sull’esame oculomotore', t: 'textarea', w: 'full', rows: 2 }
    ]
  },
  {
    id: 'vestPosizionali',
    title: 'Test posizionali e manovre liberatorie (VPPB)',
    sub: 'Riferimento: Clinical Practice Guideline on Benign Paroxysmal Positional Vertigo (AAO-HNSF, aggiornamento 2017) e criteri diagnostici della Bárány Society (2015). I test vanno eseguiti senza fissazione e mantenendo la posizione almeno 30 secondi.',
    fields: [
      { k: 'vestDixDx', l: 'Dix-Hallpike destro', t: 'sel', w: 'half',
        o: ['Non eseguito', 'Negativo', 'Positivo — nistagmo verso l’alto e torsionale geotropo (canale posteriore destro)', 'Positivo — nistagmo verso il basso (canale anteriore o forma apogeotropa del posteriore)', 'Positivo — nistagmo atipico o persistente', 'Sintomi senza nistagmo'] },
      { k: 'vestDixSx', l: 'Dix-Hallpike sinistro', t: 'sel', w: 'half',
        o: ['Non eseguito', 'Negativo', 'Positivo — nistagmo verso l’alto e torsionale geotropo (canale posteriore sinistro)', 'Positivo — nistagmo verso il basso (canale anteriore o forma apogeotropa del posteriore)', 'Positivo — nistagmo atipico o persistente', 'Sintomi senza nistagmo'] },
      { k: 'vestRoll', l: 'Supine roll test (canale laterale)', t: 'sel', w: 'half',
        o: ['Non eseguito', 'Negativo', 'Nistagmo geotropo (canalolitiasi del canale laterale)', 'Nistagmo apogeotropo (cupololitiasi o braccio anteriore)', 'Atipico'],
        hint: 'Da eseguire sempre quando il Dix-Hallpike è negativo ma la storia è tipica.' },
      { k: 'vestLatoLaterale', l: 'Lato affetto presunto nel canale laterale', t: 'sel', w: 'half', o: LATO,
        hint: 'Nella forma geotropa è il lato in cui il nistagmo è più intenso; nella forma apogeotropa il lato in cui è meno intenso.' },
      { k: 'vestLatenza', l: 'Latenza, durata e faticabilità del nistagmo', t: 'text', w: 'full',
        hint: 'La VPPB tipica ha latenza di pochi secondi, durata inferiore al minuto e si esaurisce con la ripetizione. Un nistagmo posizionale immediato, persistente e non faticabile fa sospettare una causa centrale.' },
      { k: 'vestCanale', l: 'Canale identificato', t: 'sel', w: 'half',
        o: ['—', 'Posteriore destro', 'Posteriore sinistro', 'Laterale destro', 'Laterale sinistro', 'Anteriore destro', 'Anteriore sinistro', 'Coinvolgimento multicanale', 'Non determinabile'] },
      { k: 'vestRecidive', l: 'Episodi di VPPB precedenti (numero)', t: 'num', w: 'quarter' },
      { k: 'vestManovre', l: 'Manovre eseguite', t: 'chips', w: 'full',
        o: ['Epley (canale posteriore)', 'Semont (canale posteriore)', 'Semont-plus', 'Gufoni per forma geotropa', 'Gufoni per forma apogeotropa', 'Barbecue roll / Lempert 360°', 'Zuma e Maia', 'Yacovino / deep head hanging (canale anteriore)', 'Brandt-Daroff come esercizio domiciliare'] },
      { k: 'vestEsitoManovra', l: 'Esito al test di controllo', t: 'sel', w: 'half',
        o: ['Non rivalutato', 'Risolto — test di controllo negativo', 'Migliorato, da ripetere', 'Conversione di canale', 'Invariato'],
        hint: 'Il controllo va fatto nella stessa seduta e ripetuto all’incontro successivo: è l’unico modo per sapere se la manovra ha funzionato.' },
      { k: 'vestNoteVppb', l: 'Note e indicazioni date al paziente', t: 'textarea', w: 'full', rows: 2,
        hint: 'Le restrizioni posturali dopo la manovra non sono raccomandate di routine. Vanno invece spiegati la possibilità di instabilità residua per qualche giorno e il rischio di recidiva, con le istruzioni per riconoscerla.' }
    ]
  },
  {
    id: 'vestEquilibrio',
    title: 'Equilibrio, cammino e rischio di caduta',
    sub: 'Misure con valori di riferimento noti, così da poter dimostrare il cambiamento. Compilare almeno una misura dell’equilibrio statico, una del cammino e una del rischio di caduta.',
    fields: [
      { k: 'vestRomberg', l: 'Romberg', t: 'sel', w: 'third',
        o: ['Non eseguito', 'Normale', 'Instabile a occhi chiusi', 'Instabile anche a occhi aperti'] },
      { k: 'vestCtsib', l: 'mCTSIB — condizioni (secondi di tenuta, max 30)', t: 'table', w: 'full',
        cols: [
          { k: 'condizione', l: 'Condizione', t: 'sel', o: ['Superficie ferma, occhi aperti', 'Superficie ferma, occhi chiusi', 'Gommapiuma, occhi aperti', 'Gommapiuma, occhi chiusi'] },
          { k: 'secondi', l: 'Secondi', t: 'num', width: '90px' },
          { k: 'oscillazioni', l: 'Oscillazioni / strategia osservata', t: 'text' }
        ],
        hint: 'Il confronto fra le quattro condizioni dice quale canale sensoriale il paziente sta usando: caduta solo sulla gommapiuma a occhi chiusi orienta a un deficit vestibolare; peggioramento a occhi chiusi su entrambe le superfici a un deficit propriocettivo.' },
      { k: 'vestMonopodalico', l: 'Appoggio monopodalico (secondi, occhi aperti / chiusi)', t: 'text', w: 'third' },
      { k: 'vestFukuda', l: 'Unterberger-Fukuda — rotazione in gradi', t: 'text', w: 'third',
        hint: 'Test di scarsa specificità da solo: ha valore solo dentro un quadro coerente.' },
      { k: 'vestFga', l: 'FGA — Functional Gait Assessment (su 30)', t: 'num', w: 'third',
        hint: 'Punteggio ≤ 22/30 associato a maggior rischio di caduta negli adulti con disfunzione vestibolare. Differenza minima rilevabile ≈ 4 punti.' },
      { k: 'vestDgi', l: 'DGI — Dynamic Gait Index (su 24)', t: 'num', w: 'third',
        hint: 'Punteggio ≤ 19/24 associato a rischio di caduta.' },
      { k: 'vestMiniBest', l: 'Mini-BESTest (su 28)', t: 'num', w: 'third' },
      { k: 'vestBerg', l: 'Berg Balance Scale (su 56)', t: 'num', w: 'third' },
      { k: 'vestTug', l: 'Timed Up and Go (secondi)', t: 'num', w: 'third',
        hint: 'Tempo ≥ 13,5 secondi associato a rischio di caduta nell’anziano; utile anche la versione con doppio compito.' },
      { k: 'vestVelocita', l: 'Velocità del cammino (m/s)', t: 'num', w: 'third',
        hint: 'Sotto 1,0 m/s indica una mobilità ridotta; sotto 0,6 m/s una limitazione marcata.' },
      { k: 'vest5sts', l: 'Five Times Sit to Stand (secondi)', t: 'num', w: 'third' },
      { k: 'vestDipendenzaVisiva', l: 'Dipendenza visiva o intolleranza agli ambienti complessi', t: 'radio', w: 'third', o: SI_NO_ND },
      { k: 'vestAusili', l: 'Ausili per il cammino', t: 'sel', w: 'third',
        o: ['Nessuno', 'Bastone', 'Due bastoni', 'Deambulatore', 'Appoggio a persona', 'Carrozzina'] },
      { k: 'vestNoteEquilibrio', l: 'Note sull’equilibrio e sul cammino', t: 'textarea', w: 'full', rows: 2 }
    ]
  },
  {
    id: 'vestCervicale',
    title: 'Contributo cervicale',
    sub: 'La vertigine cervicogena è una diagnosi di esclusione: richiede che siano state escluse le cause vestibolari e centrali e che ci sia una stretta relazione temporale fra i sintomi e il dolore o la rigidità cervicale. Compilare anche lo screening cervicale nell’esame soggettivo.',
    fields: [
      { k: 'vestCervSospetto', l: 'Sospetto contributo cervicogeno', t: 'radio', w: 'third', o: SI_NO_ND },
      { k: 'vestJpe', l: 'Errore di riposizionamento cervicale (JPE, gradi)', t: 'text', w: 'third',
        hint: 'Errore medio superiore a circa 4,5° considerato alterato. Riportare la direzione più compromessa.' },
      { k: 'vestSpnt', l: 'Smooth Pursuit Neck Torsion test', t: 'sel', w: 'third',
        o: ['Non eseguito', 'Negativo', 'Positivo (inseguimento peggiora in torsione)'] },
      { k: 'vestTorsione', l: 'Test di torsione cervicale (tronco ruotato, capo fermo)', t: 'sel', w: 'half',
        o: ['Non eseguito', 'Negativo', 'Positivo — nistagmo o sintomi in torsione'] },
      { k: 'vestNoteCerv', l: 'Note', t: 'textarea', w: 'full', rows: 2 }
    ]
  },
  {
    id: 'vestSintesi',
    title: 'Inquadramento vestibolare e programma',
    sub: 'Riferimento per l’esercizio e il dosaggio: Vestibular Rehabilitation for Peripheral Vestibular Hypofunction — Clinical Practice Guideline, aggiornamento 2022, Academy of Neurologic Physical Therapy (APTA).',
    fields: [
      { k: 'vestClassificazione', l: 'Inquadramento ipotizzato', t: 'sel', w: 'full',
        o: ['—', 'VPPB', 'Vestibolopatia unilaterale acuta / neurite vestibolare', 'Ipofunzione vestibolare unilaterale cronica', 'Vestibolopatia bilaterale', 'Malattia di Ménière', 'Emicrania vestibolare', 'PPPD — capogiro posturale-percettivo persistente', 'Vertigine parossistica', 'Deiscenza del canale semicircolare superiore', 'Presbivestibolopatia', 'Vertigine cervicogena (per esclusione)', 'Instabilità multifattoriale dell’anziano', 'Ipotensione ortostatica', 'Sospetta causa centrale — inviato al medico', 'Non ancora definito'] },
      { k: 'vestMotivazione', l: 'Elementi a sostegno e contro l’inquadramento', t: 'textarea', w: 'full', rows: 3,
        hint: 'Quali reperti lo sostengono, quali no, che cosa resta da chiarire e come lo si chiarirà.' },
      { k: 'vestEsercizi', l: 'Programma riabilitativo', t: 'chips', w: 'full',
        o: ['Stabilizzazione dello sguardo x1', 'Stabilizzazione dello sguardo x2', 'Adattamento con target multipli', 'Sostituzione: saccadi e inseguimento anticipatorio', 'Abituazione: esposizione graduata ai movimenti provocativi', 'Equilibrio statico con progressione sensoriale', 'Equilibrio dinamico e cammino', 'Cammino con movimenti del capo', 'Esposizione a stimoli optocinetici e ambienti complessi', 'Doppio compito motorio-cognitivo', 'Rinforzo degli arti inferiori', 'Esercizio aerobico', 'Manovre liberatorie', 'Educazione e rassicurazione'] },
      { k: 'vestDose', l: 'Dosaggio e progressione', t: 'textarea', w: 'full', rows: 3,
        hint: 'Indicazioni della linea guida: esercizi di stabilizzazione dello sguardo distribuiti in più sedute quotidiane, per un totale indicativo di circa 12 minuti al giorno nell’ipofunzione unilaterale acuta o subacuta e di 20 minuti al giorno in quella cronica, fino a 20–40 minuti nella vestibolopatia bilaterale, insieme a esercizi di equilibrio e cammino, per 4–6 settimane nell’unilaterale e 5–7 nella bilaterale. Vanno adattati al singolo e progrediti in difficoltà, non ripetuti identici.' },
      { k: 'vestEducazione', l: 'Educazione e indicazioni al paziente', t: 'textarea', w: 'full', rows: 3,
        hint: 'Punti utili: un po’ di sintomi durante gli esercizi è atteso e non dannoso; l’uso prolungato di sedativi vestibolari rallenta il compenso e va concordato con il medico; il movimento e il rientro nelle attività favoriscono il recupero; come comportarsi in caso di recidiva.' },
      { k: 'vestSicurezza', l: 'Prevenzione delle cadute e sicurezza domestica', t: 'textarea', w: 'full', rows: 2,
        hint: 'Illuminazione notturna, tappeti, calzature, scale, revisione dei farmaci e della vista, necessità di ausili.' },
      { k: 'vestRivalutazione', l: 'Misure di esito scelte e quando rivalutare', t: 'text', w: 'full',
        hint: 'Indicare le misure che verranno ripetute (es. DHI, ABC, FGA, acuità visiva dinamica) e la data della rivalutazione.' }
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
  { key: 'vestibolare', label: 'Equilibrio e vestibolo', sections: VESTIBOLARE },
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
