/* ============================================================
   Libreria degli esercizi
   ------------------------------------------------------------
   Ogni esercizio descrive che cosa fare, come farlo e con che
   dose. La scheda che il paziente porta a casa nasce da qui:
   quello che non e' scritto in modo eseguibile non viene fatto.

   Struttura di un esercizio:
     nome, regione, categoria, obiettivo
     protocollo     facoltativo: il percorso a cui appartiene, per esempio
                    il post-operatorio di una sutura. Serve a ritrovare e
                    consegnare insieme gli esercizi di una stessa fase.
     da             versione in cui la voce e' entrata in catalogo. Serve a
                    recapitarla anche a chi ha gia' la libreria piena, senza
                    far ricomparire quello che aveva cancellato.
     posizione      posizione di partenza
     esecuzione     movimento, passo passo
     puntiChiave[]  i richiami che fanno la differenza
     erroriComuni[] cosa si sbaglia di solito
     respirazione
     dose { serie, ripetizioni, tenuta, durata, recupero, frequenza, carico, ritmo, rpe }
     progressione, regressione
     precauzioni, doloreAmmesso
     attrezzatura[]
     immagini[] { dataUrl, didascalia }   foto o disegni, ridimensionati
     video[]    { url, titolo }           collegamenti, non file
   ============================================================ */

export const REGIONI = [
  'Rachide cervicale', 'Rachide dorsale', 'Rachide lombare', 'Bacino e anca',
  'Spalla', 'Gomito', 'Polso e mano', 'Ginocchio', 'Caviglia e piede',
  'Equilibrio e vestibolo', 'Generale'
];

export const CATEGORIE = [
  'Mobilità', 'Allungamento', 'Rinforzo', 'Controllo motorio',
  'Propriocezione ed equilibrio', 'Vestibolare', 'Neurodinamica',
  'Aerobico', 'Respirazione', 'Educazione e gestione del carico'
];

export const ATTREZZATURA = [
  'Nessuna', 'Elastico', 'Manubri', 'Kettlebell', 'Bastone', 'Palla',
  'Fitball', 'Tappetino', 'Sedia', 'Muro', 'Gradino', 'Cuscino', 'Cuscino propriocettivo',
  'Bosu', 'Foam roller', 'Panca', 'Lettino', 'Corda', 'Cavigliera'
];

/** I campi del dosaggio, con l'unità: valgono sia in libreria sia nel programma. */
export const CAMPI_DOSE = [
  { k: 'serie', l: 'Serie', esempio: '3' },
  { k: 'ripetizioni', l: 'Ripetizioni', esempio: '10' },
  { k: 'tenuta', l: 'Tenuta', esempio: '5 secondi' },
  { k: 'durata', l: 'Durata', esempio: '2 minuti' },
  { k: 'recupero', l: 'Recupero', esempio: '60 secondi' },
  { k: 'frequenza', l: 'Frequenza', esempio: '1 volta al giorno' },
  { k: 'carico', l: 'Carico', esempio: 'elastico verde' },
  { k: 'ritmo', l: 'Ritmo', esempio: '3 secondi in discesa' },
  { k: 'rpe', l: 'Sforzo percepito (RPE)', esempio: '6/10' }
];

/** Riassume la dose in una riga leggibile, saltando i campi vuoti. */
export function doseInRiga(dose) {
  if (!dose) return '';
  const pezzi = [];
  if (dose.serie && dose.ripetizioni) pezzi.push(`${dose.serie} × ${dose.ripetizioni}`);
  else if (dose.serie) pezzi.push(`${dose.serie} serie`);
  else if (dose.ripetizioni) pezzi.push(`${dose.ripetizioni} ripetizioni`);
  if (dose.tenuta) pezzi.push(`tenuta ${dose.tenuta}`);
  if (dose.durata) pezzi.push(dose.durata);
  if (dose.ritmo) pezzi.push(dose.ritmo);
  if (dose.carico) pezzi.push(dose.carico);
  if (dose.recupero) pezzi.push(`recupero ${dose.recupero}`);
  if (dose.rpe) pezzi.push(`sforzo ${dose.rpe}`);
  if (dose.frequenza) pezzi.push(dose.frequenza);
  return pezzi.join(' · ');
}

/** I protocolli presenti in una libreria, in ordine alfabetico, senza ripetizioni. */
export function protocolliPresenti(esercizi) {
  const nomi = new Set();
  for (const es of esercizi || []) if (es?.protocollo) nomi.add(es.protocollo);
  return [...nomi].sort((a, b) => a.localeCompare(b, 'it'));
}

/** Unisce la dose della libreria con quella personalizzata per il paziente. */
export function doseEffettiva(esercizio, voce) {
  return { ...(esercizio?.dose || {}), ...(voce?.dose || {}) };
}

/* ------------------------------------------------------------------ */
/* Catalogo iniziale                                                   */
/* ------------------------------------------------------------------ */
/*
   Serve a non partire da una libreria vuota: sono esercizi di uso
   corrente, descritti nel formato della scheda. Vanno adattati al
   singolo paziente — la dose qui e' un punto di partenza, non una
   prescrizione. Si modificano, si duplicano e si cancellano come
   qualsiasi esercizio aggiunto a mano.
*/
/* Etichette e cautele del post-operatorio di cuffia: scritte una volta, cosi'
   restano identiche in tutto il percorso. Le settimane indicate sono quelle
   ricorrenti nei protocolli pubblicati; il riferimento resta il chirurgo. */
export const PROTOCOLLI_CUFFIA = [
  'Sutura della cuffia dei rotatori — fase 1 (passiva)',
  'Sutura della cuffia dei rotatori — fase 2 (attiva assistita)',
  'Sutura della cuffia dei rotatori — fase 3 (rinforzo)',
  'Sutura della cuffia dei rotatori — fase 4 (ritorno alle attività)'
];
const [CUFFIA_1, CUFFIA_2, CUFFIA_3, CUFFIA_4] = PROTOCOLLI_CUFFIA;
/** La fase passiva, la prima: nome storico tenuto per compatibilita'. */
export const PROTOCOLLO_CUFFIA = CUFFIA_1;

const CHIRURGO = 'Tempi e gradi concessi li stabilisce il chirurgo e dipendono da tendine suturato, dimensione della lesione e tecnica: questo esercizio va eseguito solo entro quei limiti.';
const SOTTOSCAPOLARE = 'Con sutura del sottoscapolare la rotazione esterna resta spesso bloccata a 0° per 4–6 settimane e poi si apre di una decina di gradi a settimana; estensione del braccio dietro il tronco e rotazione interna contro resistenza restano escluse più a lungo.';

const PRECAUZIONI_CUFFIA = CHIRURGO + ' In questa fase nessuna contrazione attiva della cuffia, nessun peso portato con il braccio operato, nessun appoggio per alzarsi. ' + SOTTOSCAPOLARE + ' Tutore rimesso subito dopo, se prescritto.';
const PRECAUZIONI_CUFFIA_2 = CHIRURGO + ' Fase di passaggio: il movimento si fa attivo ma il tendine sta ancora maturando. Niente sollevamento di pesi (di norma non oltre 1–1,5 kg), niente spinte, niente stretching forzato a fine corsa, nessuna ripetizione dentro un arco doloroso. Se compaiono compensi — spalla che sale verso l’orecchio, tronco che si inclina — o dolore che compare il giorno dopo, si torna all’assistito. ' + SOTTOSCAPOLARE;
const PRECAUZIONI_CUFFIA_3 = CHIRURGO + ' Il carico si aggiunge solo con movimento completo e indolore e senza compensi. Si sale di resistenza quando le ultime ripetizioni restano pulite, mai perché è passata una settimana. Dolore che resta oltre 24 ore o che cresce serie dopo serie significa tornare indietro di un gradino. ' + SOTTOSCAPOLARE;

const e = (o) => ({
  attrezzatura: [], puntiChiave: [], erroriComuni: [], immagini: [], video: [],
  origine: 'catalogo', ...o
});

export const CATALOGO = [

  /* ---------- Rachide lombare ---------- */
  e({
    nome: 'Retroversione del bacino supino',
    regione: 'Rachide lombare', categoria: 'Controllo motorio',
    obiettivo: 'Ritrovare il controllo attivo della posizione del bacino e ridurre la rigidità di difesa.',
    attrezzatura: ['Tappetino'],
    posizione: 'Supino, ginocchia flesse, piedi appoggiati alla larghezza del bacino, braccia lungo i fianchi.',
    esecuzione: 'Appiattisci lentamente la curva lombare contro il pavimento ruotando il bacino all’indietro, mantieni, poi torna alla posizione neutra senza inarcare.',
    puntiChiave: ['Il movimento parte dal bacino, non dalle gambe', 'Glutei e addome restano morbidi', 'Ampiezza piccola: è un esercizio di controllo, non di forza'],
    erroriComuni: ['Spingere con i piedi sollevando il bacino', 'Trattenere il respiro', 'Cercare la massima escursione'],
    respirazione: 'Espira mentre appiattisci, inspira tornando in neutro.',
    dose: { serie: '2', ripetizioni: '10', tenuta: '5 secondi', frequenza: '1–2 volte al giorno', ritmo: 'lento' },
    progressione: 'Stessa cosa in piedi contro il muro, poi seduto.',
    regressione: 'Ampiezza minore, senza tenuta.',
    doloreAmmesso: 'Nessun aumento del dolore. Un fastidio lieve che sparisce subito è accettabile.'
  }),
  e({
    nome: 'Cat-camel (gatto-cammello)',
    regione: 'Rachide lombare', categoria: 'Mobilità',
    obiettivo: 'Mobilizzare la colonna in flesso-estensione con carico minimo.',
    attrezzatura: ['Tappetino'],
    posizione: 'Quadrupedia, mani sotto le spalle, ginocchia sotto le anche.',
    esecuzione: 'Inarca lentamente la schiena verso l’alto portando il mento al petto, poi lascia scendere il dorso aprendo il torace. Muoviti nell’ampiezza che non provoca dolore.',
    puntiChiave: ['Movimento continuo e lento, senza fermarsi ai fine corsa', 'Le braccia restano ferme', 'Coinvolgi tutta la colonna, non solo la zona lombare'],
    erroriComuni: ['Spingere ai fine corsa', 'Andare troppo veloce', 'Muovere solo il collo'],
    respirazione: 'Espira inarcando, inspira scendendo.',
    dose: { serie: '1', ripetizioni: '10–15', frequenza: '1–2 volte al giorno', ritmo: 'lento e continuo' },
    progressione: 'Aumentare le ripetizioni; aggiungere pause nelle direzioni meglio tollerate.',
    regressione: 'Eseguire seduto su una sedia.',
    doloreAmmesso: 'Fino a 3/10, purché rientri entro pochi minuti.'
  }),
  e({
    nome: 'Bird dog',
    regione: 'Rachide lombare', categoria: 'Controllo motorio',
    obiettivo: 'Controllo del tronco durante il movimento degli arti, senza carico compressivo.',
    attrezzatura: ['Tappetino'],
    posizione: 'Quadrupedia, colonna in posizione neutra, sguardo al pavimento.',
    esecuzione: 'Allunga un braccio in avanti e la gamba opposta indietro fino all’altezza del tronco, mantieni, poi torna con controllo e cambia lato.',
    puntiChiave: ['Il bacino non ruota: immagina un bicchiere d’acqua sulla schiena', 'Allunga, non sollevare in alto', 'Il collo resta in linea con la colonna'],
    erroriComuni: ['Inarcare la zona lombare', 'Ruotare il bacino', 'Sollevare troppo l’arto'],
    respirazione: 'Respira normalmente durante la tenuta, senza bloccare il fiato.',
    dose: { serie: '3', ripetizioni: '8 per lato', tenuta: '5 secondi', recupero: '30 secondi', frequenza: '3–4 volte a settimana' },
    progressione: 'Aumentare la tenuta; aggiungere un elastico; passare alla versione con appoggio instabile.',
    regressione: 'Solo braccio o solo gamba, oppure con il piede che striscia sul pavimento.',
    doloreAmmesso: 'Nessun dolore durante l’esecuzione.'
  }),
  e({
    nome: 'Ponte a due gambe',
    regione: 'Bacino e anca', categoria: 'Rinforzo',
    obiettivo: 'Rinforzo dei glutei e degli estensori d’anca, con lavoro di controllo lombopelvico.',
    attrezzatura: ['Tappetino'],
    posizione: 'Supino, ginocchia flesse a circa 90°, piedi alla larghezza del bacino, braccia lungo i fianchi.',
    esecuzione: 'Spingi sui talloni e solleva il bacino fino ad allineare ginocchia, anche e spalle; mantieni, poi scendi vertebra per vertebra.',
    puntiChiave: ['La spinta parte dai talloni', 'Non salire oltre l’allineamento: l’estensione viene dall’anca, non dalla schiena', 'I glutei lavorano, la zona lombare resta tranquilla'],
    erroriComuni: ['Inarcare la zona lombare in cima', 'Spingere sulle punte dei piedi', 'Salire di slancio'],
    respirazione: 'Espira salendo, inspira scendendo.',
    dose: { serie: '3', ripetizioni: '12', tenuta: '3 secondi', recupero: '45 secondi', frequenza: '3 volte a settimana', rpe: '6–7/10' },
    progressione: 'Ponte a una gamba; piedi su rialzo; bilanciere o manubrio sul bacino.',
    regressione: 'Ampiezza ridotta; solo contrazione dei glutei senza sollevare.',
    doloreAmmesso: 'Fino a 3/10, che non peggiora nelle 24 ore successive.'
  }),
  e({
    nome: 'Estensioni ripetute in decubito prono (McKenzie)',
    regione: 'Rachide lombare', categoria: 'Mobilità',
    obiettivo: 'Verificare e sfruttare la centralizzazione dei sintomi nelle lombalgie con preferenza direzionale in estensione.',
    attrezzatura: ['Tappetino'],
    posizione: 'Prono, mani sotto le spalle come per una piegata sulle braccia.',
    esecuzione: 'Spingi con le braccia sollevando il tronco e lasciando il bacino aderente al lettino; sali fino al limite confortevole, mantieni un istante e torna giù.',
    puntiChiave: ['Il bacino non si stacca', 'Glutei e schiena restano rilassati: spingono le braccia', 'Osserva dove vanno i sintomi: devono avvicinarsi alla colonna, non allontanarsi'],
    erroriComuni: ['Contrarre i glutei', 'Salire di scatto', 'Continuare se il dolore scende lungo la gamba'],
    respirazione: 'Espira salendo.',
    dose: { serie: '1', ripetizioni: '10', frequenza: 'ogni 2–3 ore nella fase acuta', ritmo: 'una spinta ogni 2 secondi' },
    progressione: 'Sovrapressione del terapista; estensione in piedi.',
    regressione: 'Appoggio sui gomiti mantenuto per 1–2 minuti.',
    precauzioni: 'Interrompere se i sintomi si spostano verso il piede (periferizzazione).',
    doloreAmmesso: 'Il dolore lombare può aumentare, purché i sintomi alla gamba si riducano o risalgano.'
  }),

  /* ---------- Rachide cervicale ---------- */
  e({
    nome: 'Flessione craniocervicale (chin tuck)',
    regione: 'Rachide cervicale', categoria: 'Controllo motorio',
    obiettivo: 'Attivare i flessori profondi del collo, di solito poco reclutati nel dolore cervicale.',
    attrezzatura: ['Tappetino'],
    posizione: 'Supino, ginocchia flesse, capo appoggiato, sguardo al soffitto. Un asciugamano arrotolato sotto la nuca aiuta a trovare la posizione neutra.',
    esecuzione: 'Fai un lieve cenno di assenso con il capo, come per avvicinare il mento alla gola, senza sollevare la testa dal lettino. Mantieni, poi rilascia.',
    puntiChiave: ['Il movimento è piccolo e profondo, non una forzatura', 'La testa resta appoggiata', 'I muscoli superficiali del collo non devono sporgere'],
    erroriComuni: ['Sollevare il capo', 'Spingere il mento con forza', 'Contrarre le spalle'],
    respirazione: 'Respira normalmente durante la tenuta.',
    dose: { serie: '3', ripetizioni: '10', tenuta: '10 secondi', recupero: '10 secondi', frequenza: '1–2 volte al giorno' },
    progressione: 'Stessa cosa seduto, poi in piedi contro il muro; aggiungere il sollevamento del capo di pochi millimetri.',
    regressione: 'Tenuta più breve, meno ripetizioni.',
    doloreAmmesso: 'Nessun aumento del dolore né comparsa di capogiro.'
  }),
  e({
    nome: 'Rotazione cervicale attiva assistita',
    regione: 'Rachide cervicale', categoria: 'Mobilità',
    obiettivo: 'Recuperare l’ampiezza di rotazione nel range non doloroso.',
    posizione: 'Seduto, schiena appoggiata, spalle rilassate, sguardo davanti a sé.',
    esecuzione: 'Ruota lentamente il capo verso un lato fino al primo limite confortevole, mantieni un istante e torna al centro. Alterna i lati.',
    puntiChiave: ['Fermarsi al primo limite, non spingere oltre', 'Il tronco non ruota', 'Movimento lento e uguale nelle due direzioni'],
    erroriComuni: ['Compensare con la spalla', 'Movimenti a scatto', 'Cercare il massimo range ogni volta'],
    respirazione: 'Espira ruotando.',
    dose: { serie: '2', ripetizioni: '8 per lato', tenuta: '2 secondi', frequenza: '2–3 volte al giorno', ritmo: 'lento' },
    progressione: 'Aumentare l’ampiezza; aggiungere la rotazione con lo sguardo fisso su un bersaglio.',
    regressione: 'Ampiezza ridotta, meno ripetizioni.',
    precauzioni: 'Sospendere e riferire in caso di capogiro, sbandamento, disturbi visivi o nausea.',
    doloreAmmesso: 'Fino a 2–3/10, che scompare subito dopo.'
  }),
  e({
    nome: 'Riposizionamento cervicale con puntatore laser',
    regione: 'Rachide cervicale', categoria: 'Propriocezione ed equilibrio',
    obiettivo: 'Riallenare il senso di posizione del capo, spesso alterato nel dolore cervicale cronico e nel colpo di frusta.',
    attrezzatura: ['Muro'],
    posizione: 'Seduto a circa 90 cm dal muro, con una torcia o un puntatore fissato su una fascia in testa; un bersaglio disegnato sul muro all’altezza degli occhi.',
    esecuzione: 'Centra il bersaglio, chiudi gli occhi, ruota il capo di lato, poi torna dove credi fosse il centro. Apri gli occhi e osserva lo scarto.',
    puntiChiave: ['Il ritorno deve essere lento e senza correzioni', 'Non sbirciare', 'Annota lo scarto: è la misura che deve ridursi'],
    erroriComuni: ['Correggere a occhi aperti prima di controllare', 'Movimenti troppo ampi all’inizio'],
    dose: { serie: '3', ripetizioni: '6 per direzione', frequenza: '1 volta al giorno' },
    progressione: 'Aumentare l’ampiezza; provare in piedi; aggiungere flesso-estensione.',
    regressione: 'Ampiezze piccole; occhi socchiusi.',
    doloreAmmesso: 'Nessuno.'
  }),

  /* ---------- Spalla ---------- */
  e({
    nome: 'Rotazione esterna con elastico',
    regione: 'Spalla', categoria: 'Rinforzo',
    obiettivo: 'Rinforzo dei rotatori esterni, cardine della gestione del dolore di spalla.',
    attrezzatura: ['Elastico'],
    posizione: 'In piedi, gomito flesso a 90° e tenuto vicino al fianco, avambraccio davanti al corpo; un asciugamano arrotolato sotto l’ascella aiuta a mantenere la posizione.',
    esecuzione: 'Ruota l’avambraccio verso l’esterno tirando l’elastico, mantieni un istante, poi torna lentamente controllando il ritorno.',
    puntiChiave: ['Il gomito resta incollato al fianco', 'Il movimento è di rotazione, non di trazione all’indietro', 'Il ritorno controllato vale quanto la spinta'],
    erroriComuni: ['Allontanare il gomito dal corpo', 'Ruotare il tronco', 'Lasciar tornare l’elastico di colpo'],
    respirazione: 'Espira nella fase di spinta.',
    dose: { serie: '3', ripetizioni: '12', recupero: '60 secondi', frequenza: '3 volte a settimana', carico: 'elastico che rende faticose le ultime 2 ripetizioni', ritmo: '3 secondi nel ritorno', rpe: '6–7/10' },
    progressione: 'Elastico più resistente; braccio a 45° e poi a 90° di abduzione.',
    regressione: 'Elastico più leggero; isometria alla stessa angolazione contro il muro.',
    doloreAmmesso: 'Fino a 3–4/10 durante l’esercizio, che rientra entro 24 ore.'
  }),
  e({
    nome: 'Scivolamento al muro (wall slide)',
    regione: 'Spalla', categoria: 'Controllo motorio',
    obiettivo: 'Coordinare il movimento della scapola con l’elevazione del braccio.',
    attrezzatura: ['Muro'],
    posizione: 'In piedi di fronte al muro, avambracci appoggiati, gomiti all’altezza delle spalle.',
    esecuzione: 'Fai scivolare gli avambracci verso l’alto lungo il muro lasciando che le scapole ruotino e salgano; scendi con lo stesso controllo.',
    puntiChiave: ['Le scapole devono ruotare, non bloccarsi in basso', 'Le costole restano abbassate: non inarcare la schiena', 'Sali fino a dove il movimento resta fluido'],
    erroriComuni: ['Inarcare la zona lombare', 'Alzare le spalle verso le orecchie di scatto', 'Forzare oltre il punto in cui compare dolore'],
    respirazione: 'Espira salendo.',
    dose: { serie: '3', ripetizioni: '10', frequenza: '4–5 volte a settimana', ritmo: 'lento' },
    progressione: 'Aggiungere un elastico attorno ai polsi; eseguire in ginocchio davanti al muro.',
    regressione: 'Ampiezza ridotta; esecuzione da seduto.',
    doloreAmmesso: 'Fino a 3/10.'
  }),
  e({
    nome: 'Isometria in abduzione al muro',
    regione: 'Spalla', categoria: 'Rinforzo',
    obiettivo: 'Carico isometrico utile nelle fasi irritabili, quando il movimento è poco tollerato.',
    attrezzatura: ['Muro'],
    posizione: 'In piedi di fianco al muro, gomito flesso a 90°, braccio lungo il fianco, con un asciugamano fra gomito e muro.',
    esecuzione: 'Spingi il gomito contro il muro con una forza submassimale e mantieni, senza che il braccio si muova.',
    puntiChiave: ['Spinta graduale, non un colpo', 'Circa il 50–70% della forza massima', 'Respira normalmente durante la tenuta'],
    erroriComuni: ['Trattenere il respiro', 'Spingere al massimo', 'Inclinare il tronco'],
    dose: { serie: '5', tenuta: '30–45 secondi', recupero: '60 secondi', frequenza: '1 volta al giorno', rpe: '5–7/10' },
    progressione: 'Passare al movimento con elastico quando l’irritabilità si riduce.',
    regressione: 'Tenuta più breve e forza minore.',
    doloreAmmesso: 'Fino a 3–4/10 durante la tenuta, purché non aumenti fra una serie e l’altra.'
  }),

  /* ---------- Spalla — sutura della cuffia dei rotatori, fase passiva ---------- */
  /*
     I quattro esercizi che seguono formano la fase 1 del post-operatorio: si
     muove la spalla senza far lavorare i tendini suturati. Il razionale sta nel
     campo Note di ciascuno. I gradi indicati sono quelli più comuni nelle
     prime settimane: vanno sempre riportati a quanto prescritto dal chirurgo.
  */
  e({
    nome: 'Elevazione assistita dall’arto sano, da supino',
    regione: 'Spalla', categoria: 'Mobilità',
    protocollo: PROTOCOLLO_CUFFIA, da: '1.3',
    obiettivo: 'Recuperare l’elevazione passiva della spalla operata senza chiedere lavoro ai tendini suturati.',
    attrezzatura: ['Lettino'],
    posizione: 'Supino sul letto, ginocchia leggermente flesse, cuscino basso sotto la testa. Braccio operato lungo il fianco con il gomito esteso; la mano sana afferra il polso o il dorso della mano operata.',
    esecuzione: 'La mano sana porta il braccio operato verso il soffitto e poi verso la testa, restando nel piano del corpo. Fermati al limite concesso — nelle prime settimane in genere fra 90° e 120° — oppure prima, se compare dolore. Mantieni un istante e riaccompagna giù lentamente, senza lasciar cadere il braccio.',
    puntiChiave: [
      'Il braccio operato resta un peso morto: il lavoro lo fa l’arto sano',
      'Gomito esteso e pollice verso l’alto per tutta la salita',
      'La spalla non si alza verso l’orecchio: lascia la scapola morbida',
      'Movimento lento, nessun molleggio al punto massimo'
    ],
    erroriComuni: [
      'Aiutare con i muscoli della spalla operata (l’esercizio diventa attivo e perde la sua protezione)',
      'Spingere oltre il limite concesso per “guadagnare gradi”',
      'Inarcare la schiena o ruotare il tronco per salire di più',
      'Trattenere il respiro nello sforzo'
    ],
    respirazione: 'Espira mentre sali, inspira scendendo.',
    dose: { serie: '2–3', ripetizioni: '10', tenuta: '2–3 secondi al punto massimo concesso', frequenza: '3–5 volte al giorno', ritmo: 'lento' },
    progressione: 'Aumentare i gradi secondo il protocollo; poi elevazione assistita con bastone da seduto e, quando concessa, elevazione attiva assistita.',
    regressione: 'Ampiezza ridotta a 60–90°, senza tenuta; gomito flesso per accorciare il braccio di leva.',
    precauzioni: PRECAUZIONI_CUFFIA,
    doloreAmmesso: 'Tensione sopportabile fino a 2–3/10 che si spegne appena torni giù. Nessun dolore acuto, nessuna sensazione di strappo: in quel caso fermati e riferiscilo.',
    note: 'Da supino il letto sostiene il peso dell’arto e la gravità non chiede alla cuffia di stabilizzare la testa omerale: è la via più sicura per mantenere l’escursione nelle settimane in cui la sutura sta guarendo. La mobilizzazione passiva precoce, nelle lesioni piccole e medie, migliora l’escursione nei primi mesi senza aumentare in modo significativo il rischio di nuova lesione; nelle lesioni ampie prevalgono i protocolli più prudenti. Per questo il riferimento resta l’indicazione del chirurgo.'
  }),
  e({
    nome: 'Elevazione delle scapole da seduto (spallucce)',
    regione: 'Spalla', categoria: 'Mobilità',
    protocollo: PROTOCOLLO_CUFFIA, da: '1.3',
    obiettivo: 'Mantenere mobile il cingolo scapolare e ridurre la rigidità di difesa mentre la cuffia resta protetta.',
    attrezzatura: ['Sedia'],
    posizione: 'Seduto su una sedia con appoggio, piedi a terra, schiena dritta. Braccio operato sostenuto dal tutore oppure appoggiato in grembo su un cuscino.',
    esecuzione: 'Alza entrambe le spalle verso le orecchie, mantieni un istante, poi lasciale scendere completamente. Quando il movimento è ben tollerato, aggiungi un piccolo avvicinamento delle scapole verso la colonna, sempre senza muovere il braccio.',
    puntiChiave: [
      'Si muove la scapola, non il braccio: l’arto operato resta appoggiato e fermo',
      'Lasciar scendere fa parte dell’esercizio: molla del tutto, non restare a metà',
      'Collo lungo e mandibola morbida',
      'Movimento lento e uguale da entrambi i lati'
    ],
    erroriComuni: [
      'Portare la testa in avanti mentre si alzano le spalle',
      'Spingere con la mano operata sul cuscino per aiutarsi',
      'Eseguire di scatto',
      'Trattenere il respiro'
    ],
    respirazione: 'Inspira mentre alzi, espira lasciando scendere.',
    dose: { serie: '2–3', ripetizioni: '10–15', tenuta: '2 secondi', frequenza: '2–3 volte al giorno', ritmo: 'lento' },
    progressione: 'Aggiungere retrazione e poi circonduzione della scapola; quando concesso, controllo scapolare con il braccio sostenuto.',
    regressione: 'Solo elevazione, ampiezza ridotta, senza tenuta.',
    precauzioni: 'Se il movimento tira sulla zona della sutura o sulla ferita, ridurre l’ampiezza. Nessuna spinta e nessun sollevamento con il braccio operato. ' + PRECAUZIONI_CUFFIA,
    doloreAmmesso: 'Nessun dolore nella spalla operata. Un lieve affaticamento al collo o fra le scapole è accettabile e passa con il riposo.',
    note: 'Gli elevatori della scapola — trapezio superiore ed elevatore della scapola — non fanno parte della cuffia e non sono coinvolti nella sutura: si possono attivare presto senza mettere in tensione la riparazione. Serve a due cose: conservare lo scorrimento scapolo-toracico, che si perde in fretta con il tutore, e dare al paziente qualcosa da fare attivamente in una fase in cui tutto il resto è passivo, cosa che riduce il senso di impotenza e la rigidità antalgica del cingolo.'
  }),
  e({
    nome: 'Esercizi pendolari di Codman',
    regione: 'Spalla', categoria: 'Mobilità',
    protocollo: PROTOCOLLO_CUFFIA, da: '1.3',
    obiettivo: 'Mobilità passiva dolce e riduzione del dolore sfruttando il peso del braccio, senza attivare la cuffia.',
    attrezzatura: ['Sedia'],
    posizione: 'In piedi, piedi alla larghezza delle anche con un piede leggermente avanti. Busto inclinato in avanti di 30–45°, mano sana appoggiata a un tavolo o alla spalliera di una sedia. Braccio operato che pende libero, gomito esteso, tutore rimosso.',
    esecuzione: 'Sposta il peso del corpo con le gambe e il tronco in modo da far oscillare il braccio come un pendolo: prima avanti e indietro, poi di lato, poi piccoli cerchi in un senso e nell’altro. L’oscillazione nasce dal movimento del corpo; il braccio si limita a seguire.',
    puntiChiave: [
      'Il braccio è completamente rilassato: se senti i muscoli della spalla lavorare, stai muovendo il braccio invece del tronco',
      'Oscillazioni e cerchi piccoli, 20–30 cm, non ampi',
      'Il braccio non supera l’orizzontale',
      'Appoggio sempre stabile con la mano sana'
    ],
    erroriComuni: [
      'Muovere attivamente la spalla: è l’errore più frequente e annulla lo scopo dell’esercizio',
      'Cerchi troppo ampi, che spostano il movimento verso i gradi non concessi',
      'Restare in piedi eretti senza inclinare il busto, così il braccio non pende',
      'Tenere il gomito flesso'
    ],
    respirazione: 'Respira liberamente: non c’è una fase di sforzo.',
    dose: { serie: '2–3', durata: '30–60 secondi per direzione', frequenza: '3–4 volte al giorno', ritmo: 'oscillazione lenta e regolare' },
    progressione: 'Aumentare la durata, non l’ampiezza. L’ampiezza si allarga solo quando il protocollo lo prevede.',
    regressione: 'Solo avanti e indietro, oscillazione minima; da seduto con il braccio che pende di lato.',
    precauzioni: 'Interrompere in caso di dolore acuto, formicolio alla mano o capogiro nella posizione inclinata. Con problemi lombari rilevanti, appoggiarsi bene e ridurre l’inclinazione del busto. Nessun peso al braccio o al polso in questa fase. ' + PRECAUZIONI_CUFFIA,
    doloreAmmesso: 'Fino a 2–3/10, in genere in riduzione durante l’esecuzione. Se il dolore aumenta oscillazione dopo oscillazione, sospendi.',
    note: 'Il pendolo è passivo solo se il motore è il tronco: eseguito così l’attività elettrica del sovraspinato resta bassa, mentre se il paziente muove il braccio diventa un esercizio attivo e perde la sua ragione d’essere nel post-operatorio. Vale la pena farlo eseguire davanti a sé almeno una volta e correggerlo: è l’esercizio più frequentemente sbagliato di questa fase. L’oscillazione ampia, inoltre, porta la spalla in gradi che il protocollo non concede ancora. Va però ridimensionata l’aspettativa: misurazioni cinematiche su volontari sani mostrano che il pendolo produce pochissimo movimento gleno-omerale e scapolo-toracico, perché quasi tutto lo spostamento viene dal tronco. È quindi utile come gestione del dolore e come primo contatto con il movimento, non come mezzo principale per mantenere l’escursione: quella in questa fase arriva dalla mobilizzazione assistita.'
  }),
  e({
    nome: 'Abduzione passiva con bastone, da supino',
    regione: 'Spalla', categoria: 'Mobilità',
    protocollo: PROTOCOLLO_CUFFIA, da: '1.3',
    obiettivo: 'Recuperare l’abduzione passiva entro i gradi concessi, con la cuffia inattiva e il braccio sostenuto.',
    attrezzatura: ['Bastone', 'Lettino'],
    posizione: 'Supino sul letto, ginocchia flesse. Entrambe le mani impugnano il bastone alla larghezza delle spalle, braccia appoggiate lungo il corpo, palmo della mano operata rivolto verso l’alto.',
    esecuzione: 'Con la mano sana spingi il bastone in modo da allontanare il braccio operato dal fianco, lasciandolo scivolare sul letto o appena sopra. Resta leggermente in avanti rispetto alla linea delle spalle, nel piano della scapola. Fermati al limite concesso — di norma 60–90° nelle prime settimane — mantieni un istante, poi riaccompagna al fianco lentamente.',
    puntiChiave: [
      'Il bastone è la guida, la mano sana il motore: la spalla operata non spinge',
      'Braccio leggermente avanti, nel piano della scapola, mai dietro la linea del corpo',
      'Nessuna rotazione esterna aggiunta, se non concessa',
      'Fermarsi al grado stabilito anche quando sembrerebbe possibile andare oltre'
    ],
    erroriComuni: [
      'Portare il braccio dietro il piano del corpo',
      'Combinare abduzione e rotazione esterna, la posizione che mette più in tensione la riparazione',
      'Spingere il bastone con il braccio operato',
      'Superare i gradi concessi perché “non fa male”'
    ],
    respirazione: 'Espira mentre allontani il braccio dal fianco.',
    dose: { serie: '2–3', ripetizioni: '10', tenuta: '2–3 secondi', frequenza: '3–4 volte al giorno', ritmo: 'lento' },
    progressione: 'Aumentare i gradi secondo il protocollo; poi abduzione assistita da seduto e, quando concessa, attiva assistita.',
    regressione: 'Ampiezza 30–60°, senza tenuta, mantenendo il braccio appoggiato al letto per tutto il movimento.',
    precauzioni: 'Con sutura del sottoscapolare non associare rotazione esterna o estensione all’abduzione. Nessun movimento con la mano dietro la schiena. Interrompere in caso di dolore acuto o sensazione di cedimento. ' + PRECAUZIONI_CUFFIA,
    doloreAmmesso: 'Tensione fino a 2–3/10 che rientra subito al ritorno. Nessun dolore acuto.',
    note: 'Il bastone serve a dosare: l’arto sano percepisce la resistenza e si ferma prima, cosa che una mano appoggiata sul braccio fa con meno precisione. La posizione supina toglie alla cuffia il compito di sostenere l’arto. Restare nel piano della scapola riduce il conflitto sotto-acromiale rispetto all’abduzione pura sul piano frontale; l’associazione fra abduzione e rotazione esterna è invece la combinazione che allunga di più la riparazione del sovraspinato, e va evitata finché il protocollo non la concede.'
  }),

  e({
    nome: 'Flesso-estensione di gomito con avambraccio sostenuto',
    regione: 'Gomito', categoria: 'Mobilità',
    protocollo: CUFFIA_1, da: '1.5',
    obiettivo: 'Conservare la mobilità completa del gomito mentre la spalla sta ferma nel tutore.',
    attrezzatura: ['Sedia'],
    posizione: 'Seduto su una sedia con schienale, tutore slacciato. Il braccio resta appoggiato al fianco e l’avambraccio è sostenuto: dalla mano sana sotto il polso, oppure appoggiato su un cuscino in grembo.',
    esecuzione: 'Piega lentamente il gomito portando la mano verso la spalla fino a dove arriva senza forzare, poi distendilo del tutto. La spalla non si muove: braccio incollato al fianco per tutto il movimento. Aggiungi poi, a gomito piegato a 90°, la rotazione dell’avambraccio: palmo in su, palmo in giù.',
    puntiChiave: [
      'Si muove solo il gomito: se la spalla si sposta, il braccio non è abbastanza appoggiato',
      'Arrivare ogni volta alla distensione completa, non fermarsi a metà',
      'Movimento lento, senza slanci e senza molleggiare a fine corsa',
      'Più volte al giorno, poco per volta: è la frequenza che conta'
    ],
    erroriComuni: [
      'Staccare il gomito dal fianco e trasformarlo in un movimento di spalla',
      'Fermarsi sempre a metà estensione, che è il modo più rapido per irrigidire il gomito',
      'Farlo una volta sola al giorno, a lungo, invece di poco e spesso',
      'Tenere il tutore allacciato e muovere solo le dita'
    ],
    respirazione: 'Respira normalmente: non c’è una fase di sforzo.',
    dose: { serie: '1–2', ripetizioni: '10–15', frequenza: '4–5 volte al giorno', ritmo: 'lento' },
    progressione: 'Nessuna progressione di carico in questa fase: resta un movimento libero. Quando il tutore viene tolto, il gomito segue naturalmente i movimenti di spalla.',
    regressione: 'Ampiezza minore, con l’avambraccio che resta appoggiato al cuscino per tutto il movimento.',
    precauzioni: 'Non usare il braccio operato per sollevare, spingere o sostenere nulla: muovere il gomito a vuoto è un’altra cosa dal farlo lavorare. Nessuna rotazione del braccio e nessuna estensione dietro il tronco. ' + PRECAUZIONI_CUFFIA,
    doloreAmmesso: 'Nessun dolore alla spalla. Un senso di rigidità al gomito nei primi giorni è normale e cala muovendolo.',
    note: 'È il motivo per cui i protocolli post-operatori prescrivono movimento attivo di gomito, polso e mano dal primo giorno pur tenendo il tutore: il gomito tenuto fermo a 90° per settimane perde l’estensione in fretta, e recuperarla dopo costa più del recupero della spalla. Un protocollo lo riassume come mantenere la mobilità completa di collo, gomito, polso e mano mentre la spalla è protetta. Non carica la riparazione perché bicipite brachiale e tricipite non fanno parte della cuffia: va però tenuto conto che un capo lungo del bicipite tenodesizzato o trasferito cambia le indicazioni, ed è una cosa da chiedere al chirurgo.'
  }),
  e({
    nome: 'Mano e polso: pompa, presa e rotazione dell’avambraccio',
    regione: 'Polso e mano', categoria: 'Mobilità',
    protocollo: CUFFIA_1, da: '1.5',
    obiettivo: 'Tenere in movimento le articolazioni distali e aiutare il riassorbimento del gonfiore della mano.',
    attrezzatura: ['Palla'],
    posizione: 'Seduto, avambraccio appoggiato sul bracciolo o su un cuscino, con la mano più in alto del gomito quando è possibile.',
    esecuzione: 'Apri e chiudi la mano lentamente, arrivando ogni volta a dita completamente distese e poi a pugno morbido. Stringi una pallina o un panno arrotolato per qualche secondo e lascia. Muovi poi il polso in alto e in basso e ruota l’avambraccio, palmo in su e palmo in giù.',
    puntiChiave: [
      'Aprire del tutto conta quanto chiudere: le dita si irrigidiscono in flessione',
      'Tenere la mano sollevata rispetto al gomito aiuta il gonfiore a defluire',
      'Stretta decisa ma non massimale, senza trattenere il respiro',
      'Poco e spesso durante la giornata'
    ],
    erroriComuni: [
      'Stringere forte dimenticando di aprire',
      'Tenere la mano abbandonata in basso tutto il giorno dentro il tutore',
      'Muovere il polso facendo partire anche la spalla',
      'Aspettare che il gonfiore passi da solo'
    ],
    respirazione: 'Libera.',
    dose: { serie: '1–2', ripetizioni: '15–20', tenuta: '3 secondi nella presa', frequenza: '4–5 volte al giorno' },
    progressione: 'Quando il gonfiore è passato basta mantenere il movimento libero di dita e polso.',
    regressione: 'Solo apertura e chiusura della mano, senza presa e senza movimento del polso.',
    precauzioni: 'Dita fredde, formicolio persistente, gonfiore che aumenta invece di calare o dolore che cambia natura vanno riferiti: non sono cose da gestire con l’esercizio. ' + PRECAUZIONI_CUFFIA,
    doloreAmmesso: 'Nessuno nella spalla; alla mano solo la tensione del gonfiore, che cala muovendola.',
    note: 'Il gonfiore della mano nei primi giorni è dovuto all’arto tenuto fermo e in basso: la contrazione ritmica dei muscoli dell’avambraccio spinge il ritorno venoso e linfatico, e tenere la mano più in alto del gomito sfrutta la gravità nella direzione giusta. I protocolli lo abbinano al ghiaccio sulla spalla nella stessa fase. Serve anche a cogliere presto un problema diverso: formicolii o dita fredde non sono effetti dell’intervento da aspettare pazientemente.'
  }),
  e({
    nome: 'Mobilità attiva del collo con tutore',
    regione: 'Rachide cervicale', categoria: 'Mobilità',
    protocollo: CUFFIA_1, da: '1.5',
    obiettivo: 'Evitare che collo e trapezio si irrigidiscano nelle settimane con il tutore.',
    attrezzatura: ['Sedia'],
    posizione: 'Seduto, schiena appoggiata, piedi a terra, tutore indossato e braccio sostenuto.',
    esecuzione: 'Ruota lentamente la testa a destra e a sinistra fino a dove va senza tirare; inclina l’orecchio verso la spalla da un lato e dall’altro; porta il mento verso il petto. Fermati un istante al limite comodo di ogni direzione, poi torna al centro. Fra una serie e l’altra lascia scendere le spalle con un respiro lungo.',
    puntiChiave: [
      'Ampiezza comoda, non massima: non è uno stretching',
      'Le spalle restano basse e ferme mentre la testa si muove',
      'Il lato operato va mobilizzato quanto l’altro, anche se dà più impaccio',
      'Lasciar scendere le spalle fa parte dell’esercizio'
    ],
    erroriComuni: [
      'Tirare con la mano per guadagnare gradi',
      'Alzare la spalla operata insieme alla testa',
      'Trattenere il respiro',
      'Saltarlo perché il problema sembra solo di spalla'
    ],
    respirazione: 'Espira mentre torni al centro; un respiro lungo fra le serie.',
    dose: { serie: '1–2', ripetizioni: '5–8 per direzione', frequenza: '2–3 volte al giorno', ritmo: 'lento' },
    progressione: 'Quando il tutore viene lasciato, si prosegue senza sostegno del braccio e si aggiungono i movimenti del cingolo scapolare.',
    regressione: 'Solo rotazioni, con ampiezza ridotta.',
    precauzioni: 'Capogiro, disturbi visivi, formicolii al braccio o dolore che si irradia sotto il gomito non appartengono a questo esercizio: sospendere e riferire. ' + PRECAUZIONI_CUFFIA,
    doloreAmmesso: 'Tensione muscolare fino a 2–3/10 che passa al ritorno. Nessun dolore alla spalla operata.',
    note: 'Un protocollo post-operatorio pone fra gli obiettivi della prima fase il mantenimento della mobilità completa del rachide cervicale, insieme a gomito, polso e mano; altri aggiungono il rilassamento del trapezio superiore e il lavoro sulla postura. Il motivo è pratico: con il tutore la spalla sale e la testa si porta in avanti, e dopo qualche settimana il collo diventa un secondo problema che il paziente sente spesso più della spalla. Costa pochi minuti al giorno e previene una consulenza in più.'
  }),
  e({
    nome: 'Rotazione esterna passiva con bastone, da supino',
    regione: 'Spalla', categoria: 'Mobilità',
    protocollo: CUFFIA_1, da: '1.5',
    obiettivo: 'Recuperare la rotazione esterna passiva entro il limite concesso, senza attivare la cuffia.',
    attrezzatura: ['Bastone', 'Lettino'],
    posizione: 'Supino, ginocchia flesse. Braccio operato lungo il fianco con il gomito piegato a 90° e un asciugamano arrotolato fra gomito e tronco. Entrambe le mani impugnano il bastone.',
    esecuzione: 'Con la mano sana spingi il bastone in modo da ruotare l’avambraccio operato verso l’esterno, come se aprissi una porta, tenendo il gomito fermo contro l’asciugamano. Fermati al grado concesso dal chirurgo — spesso 0° nelle prime settimane dopo sutura del sottoscapolare, 30–45° negli altri casi — mantieni un istante, poi riaccompagna al centro.',
    puntiChiave: [
      'Il gomito non si stacca dal fianco e non scivola indietro',
      'Ruota l’avambraccio, non la spalla: il braccio resta dov’è',
      'Il limite è un numero scritto nel protocollo, non la sensazione del momento',
      'Il ritorno è lento quanto l’andata'
    ],
    erroriComuni: [
      'Lasciare che il gomito si allontani dal tronco',
      'Aggiungere estensione portando il braccio dietro la linea del corpo',
      'Spingere oltre il limite perché non fa male',
      'Eseguirlo seduti, dove il peso del braccio entra nel movimento'
    ],
    respirazione: 'Espira mentre apri.',
    dose: { serie: '2–3', ripetizioni: '10', tenuta: '2–3 secondi', frequenza: '3–4 volte al giorno', ritmo: 'lento' },
    progressione: 'I gradi si aprono secondo il protocollo: dopo sutura del sottoscapolare si procede spesso di una decina di gradi a settimana. Poi rotazione esterna attiva assistita e infine attiva.',
    regressione: 'Ampiezza dimezzata, senza tenuta, con l’asciugamano più spesso sotto il gomito.',
    precauzioni: 'È il movimento che mette più in tensione una sutura del sottoscapolare e, in combinazione con l’abduzione, quella del sovraspinato: il limite non si supera mai per iniziativa. Nessuna estensione associata. ' + PRECAUZIONI_CUFFIA,
    doloreAmmesso: 'Tensione fino a 2–3/10 che rientra subito. Qualsiasi dolore acuto in avanti, verso la zona del sottoscapolare, è un segnale di stop.',
    note: 'La posizione di riposo descritta come più sicura dopo la riparazione è circa 30° di elevazione nel piano della scapola con 0–60° di rotazione esterna, che è quanto mantiene un tutore in abduzione: l’asciugamano sotto il gomito riproduce la stessa idea durante l’esercizio. I protocolli per sutura del sottoscapolare bloccano la rotazione esterna a 0° per 4–6 settimane e poi la aprono gradualmente; quelli per il sovraspinato partono in genere da 30–45°. Sono numeri che vanno letti sul protocollo del singolo paziente, non applicati per categoria.'
  }),
  e({
    nome: 'Tutore, sonno e postura dopo la sutura di cuffia',
    regione: 'Spalla', categoria: 'Educazione e gestione del carico',
    protocollo: CUFFIA_1, da: '1.5',
    obiettivo: 'Mettere il paziente in condizione di proteggere la riparazione nelle ventiquattro ore, non solo durante gli esercizi.',
    attrezzatura: ['Cuscino'],
    posizione: 'Vale nella giornata intera: a letto, in poltrona, in piedi.',
    esecuzione: 'Tieni il tutore per il tempo che ti è stato indicato, anche di notte, e toglilo solo per gli esercizi e per l’igiene. Per dormire, preferisci la posizione semi-seduta o supina con un cuscino sotto il braccio operato, così che il gomito resti leggermente in avanti rispetto al tronco e non cada indietro. Non appoggiarti sul lato operato. Per alzarti dal letto o dalla poltrona usa solo il braccio sano. Vesti prima il braccio operato e spoglialo per ultimo. Il ghiaccio sulla spalla, 15–20 minuti più volte al giorno nei primi giorni, aiuta dolore e gonfiore.',
    puntiChiave: [
      'Il gomito non deve mai cadere dietro la linea del tronco: è la posizione che tira sulla riparazione',
      'Niente peso con il braccio operato, nemmeno una borsa della spesa leggera o un cane al guinzaglio',
      'Il tutore protegge quando è indossato bene: controlla che sostenga davvero il gomito',
      'Le prime notti sono la parte più difficile: la posizione semi-seduta è quasi sempre la soluzione'
    ],
    erroriComuni: [
      'Togliere il tutore di notte perché dà fastidio',
      'Usare il braccio operato per puntellarsi quando ci si alza',
      'Lasciare il braccio penzoloni a lungo fuori dal tutore',
      'Riprendere la guida prima dell’indicazione del chirurgo'
    ],
    respirazione: 'Non pertinente.',
    dose: { frequenza: 'ogni giorno, fino a indicazione contraria del chirurgo' },
    progressione: 'Il tutore si abbandona gradualmente secondo l’indicazione: prima in casa, poi fuori. I protocolli pubblicati vanno da 2 a 6 settimane di uso continuativo a seconda della lesione.',
    regressione: 'Non pertinente.',
    precauzioni: 'Febbre, arrossamento o secrezione dalla ferita, dolore in netto aumento, gonfiore improvviso del braccio o perdita di sensibilità vanno riferiti subito: non sono cose da attendere al controllo successivo. ' + CHIRURGO,
    doloreAmmesso: 'Un dolore sordo che cala nelle prime due settimane è atteso. Un dolore che aumenta di giorno in giorno non lo è.',
    note: 'È la voce che il paziente legge più volte, e l’unica che agisce sulle ventiquattro ore invece che sui dieci minuti di esercizio. Le indicazioni ricorrono in tutti i protocolli consultati: uso continuativo del tutore nella prima fase, posizione di riposo in leggera elevazione nel piano della scapola, ghiaccio, divieto di carico. La durata del tutore è la variabile che cambia di più fra protocolli (2–6 settimane): va scritta sulla scheda del singolo paziente.'
  }),

  /* ---------- Spalla — sutura della cuffia, fase attiva assistita ---------- */
  /*
     Fase 2, in genere fra la sesta e la dodicesima settimana: il movimento
     diventa prima assistito e poi attivo, il tendine sta ancora maturando e il
     carico resta fuori. I protocolli pubblicati concordano sulla sequenza e
     divergono sulle settimane: il riferimento resta il chirurgo.
  */
  e({
    nome: 'Elevazione attiva assistita con bastone, da supino a seduto',
    regione: 'Spalla', categoria: 'Mobilità',
    protocollo: CUFFIA_2, da: '1.5',
    obiettivo: 'Passare dal movimento passivo a quello attivo per gradi, riducendo l’aiuto a mano a mano che il controllo torna.',
    attrezzatura: ['Bastone', 'Lettino'],
    posizione: 'Si comincia da supino, poi inclinati a circa 45° con dei cuscini dietro la schiena, infine seduti. Entrambe le mani impugnano il bastone alla larghezza delle spalle.',
    esecuzione: 'Porta il bastone verso l’alto usando quanto serve dell’arto sano e lasciando che il braccio operato partecipi per la sua parte. Sali fino al limite concesso, mantieni un istante, scendi lentamente controllando il ritorno. Quando il movimento è pulito, aumenta l’inclinazione del busto: supino, poi 45°, poi seduto.',
    puntiChiave: [
      'L’aiuto dell’arto sano è il minimo necessario, non il massimo possibile',
      'Il tronco resta fermo: niente inclinazione all’indietro per guadagnare gradi',
      'La spalla non sale verso l’orecchio: se succede, riduci l’ampiezza',
      'La discesa controllata è la parte che fa il lavoro'
    ],
    erroriComuni: [
      'Passare troppo presto alla posizione seduta, dove la gravità pesa tutta sulla cuffia',
      'Lasciar cadere il braccio nel ritorno',
      'Compensare con la scapola che si alza',
      'Ripetere dentro un arco che fa male'
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    dose: { serie: '2–3', ripetizioni: '10', tenuta: '2 secondi in alto', recupero: '30 secondi', frequenza: '1–2 volte al giorno', ritmo: '3 secondi in discesa' },
    progressione: 'Dall’inclinazione supina a quella seduta, poi elevazione attiva senza bastone, prima da supino e infine in piedi.',
    regressione: 'Si torna all’inclinazione precedente, o all’elevazione assistita dall’arto sano senza bastone.',
    precauzioni: PRECAUZIONI_CUFFIA_2,
    doloreAmmesso: 'Fino a 3/10 durante il movimento, che rientra entro pochi minuti e non lascia strascichi il giorno dopo.',
    note: 'La progressione per inclinazione è il cuore di questa fase: coricati la gravità scarica la cuffia, seduti la carica per intero, e i gradi intermedi permettono di dosare. Un protocollo molto usato la scandisce come supino, poi 45°, poi del tutto eretto nell’arco di tre settimane. Il criterio vero non è la settimana ma la qualità: se la spalla sale verso l’orecchio o il tronco si inclina, l’inclinazione è stata aumentata troppo presto.'
  }),
  e({
    nome: 'Elevazione assistita con carrucola',
    regione: 'Spalla', categoria: 'Mobilità',
    protocollo: CUFFIA_2, da: '1.5',
    obiettivo: 'Guadagnare elevazione con un aiuto dosabile dal paziente stesso, quando il movimento assistito è già tollerato.',
    attrezzatura: ['Corda', 'Sedia'],
    posizione: 'Seduto sotto la carrucola fissata alla porta, schiena dritta, una maniglia per mano.',
    esecuzione: 'Tira verso il basso con il braccio sano per far salire quello operato, in avanti o leggermente di lato nel piano della scapola. Sali fino al limite comodo, mantieni un istante, poi accompagna la discesa frenando con il braccio sano: non lasciare che il braccio operato cada.',
    puntiChiave: [
      'La salita è guidata, la discesa è frenata: entrambe lente',
      'Il tronco resta appoggiato e fermo',
      'Nel piano della scapola, leggermente in avanti, non di lato puro',
      'Fermarsi prima del punto in cui la spalla scatta o fa male'
    ],
    erroriComuni: [
      'Usarla come stretching, tirando oltre il limite',
      'Molleggiare in alto',
      'Lasciar precipitare il braccio nel ritorno',
      'Introdurla troppo presto, quando serve ancora il movimento puramente passivo'
    ],
    respirazione: 'Espira salendo.',
    dose: { serie: '2–3', ripetizioni: '10–12', tenuta: '2 secondi', frequenza: '1–2 volte al giorno', ritmo: 'lento' },
    progressione: 'Ridurre progressivamente l’aiuto del braccio sano fino all’elevazione attiva.',
    regressione: 'Tornare all’assistito con bastone da supino, dove il letto sostiene il braccio.',
    precauzioni: 'Si introduce dopo la sesta settimana, o quando il protocollo lo prevede. Non è un esercizio passivo: va dosato come un assistito. ' + PRECAUZIONI_CUFFIA_2,
    doloreAmmesso: 'Fino a 3/10 durante, senza aumento il giorno successivo.',
    note: 'Va collocata con cura: la misura dell’attività elettrica del sovraspinato durante la carrucola arriva intorno al 17% della contrazione massima, contro circa il 5% della mobilizzazione passiva continua. Non è quindi un esercizio passivo, come talvolta viene presentato, ma un assistito a tutti gli effetti: prima della sesta settimana è fuori posto nella maggior parte dei protocolli.'
  }),
  e({
    nome: 'Risalita al muro con la mano (wall walk)',
    regione: 'Spalla', categoria: 'Mobilità',
    protocollo: CUFFIA_2, da: '1.5',
    obiettivo: 'Guadagnare elevazione in piedi con il muro che sostiene parte del peso del braccio.',
    attrezzatura: ['Muro'],
    posizione: 'In piedi di fronte al muro, a un passo di distanza, mano operata appoggiata al muro all’altezza della spalla.',
    esecuzione: 'Fai camminare le dita verso l’alto lungo il muro, avvicinandoti di un passo se serve, fino al limite comodo. Resta qualche secondo, poi torna giù camminando con le dita, senza lasciar cadere il braccio.',
    puntiChiave: [
      'Le dita camminano: il braccio non viene lanciato verso l’alto',
      'La spalla resta bassa, il collo lungo',
      'Nessuna inclinazione del tronco di lato per salire di più',
      'La discesa è lenta quanto la salita'
    ],
    erroriComuni: [
      'Inarcare la schiena o inclinarsi per guadagnare centimetri',
      'Alzare la spalla verso l’orecchio',
      'Fermarsi solo quando fa male invece che al limite comodo',
      'Farlo di lato prima che l’elevazione in avanti sia buona'
    ],
    respirazione: 'Espira salendo.',
    dose: { serie: '2–3', ripetizioni: '8–10', tenuta: '3–5 secondi in alto', frequenza: '1–2 volte al giorno', ritmo: 'lento' },
    progressione: 'Prima in avanti, poi di lato quando il protocollo lo concede; infine elevazione attiva senza appoggio.',
    regressione: 'Partire più lontano dal muro e salire meno; oppure tornare all’assistito con bastone.',
    precauzioni: 'L’abduzione sopra i 90° resta spesso esclusa fino alla settima-dodicesima settimana. ' + PRECAUZIONI_CUFFIA_2,
    doloreAmmesso: 'Fino a 3/10, che rientra entro pochi minuti.',
    note: 'Il muro fa due cose: sostiene una parte del peso dell’arto, e dà un riferimento visibile di quanto si è saliti, che per il paziente vale più di qualsiasi spiegazione sulla progressione. Attenzione al compenso: è l’esercizio in cui il tronco si inclina più facilmente, e il centimetro guadagnato in quel modo non è elevazione di spalla.'
  }),
  e({
    nome: 'Retrazione e depressione attiva delle scapole',
    regione: 'Spalla', categoria: 'Controllo motorio',
    protocollo: CUFFIA_2, da: '1.5',
    obiettivo: 'Ritrovare il controllo attivo della scapola, che sostiene il movimento del braccio quando torna attivo.',
    attrezzatura: ['Sedia'],
    posizione: 'Seduto o in piedi, braccia rilassate lungo il corpo, sterno leggermente sollevato.',
    esecuzione: 'Avvicina le scapole verso la colonna e portale leggermente verso il basso, come se le mettessi nelle tasche posteriori. Mantieni, poi lascia andare completamente. Il braccio non si muove.',
    puntiChiave: [
      'Il movimento è piccolo: si sente fra le scapole, non nelle braccia',
      'Le spalle vanno indietro e in basso, non su',
      'Lasciar andare del tutto fra una ripetizione e l’altra',
      'Il collo resta morbido'
    ],
    erroriComuni: [
      'Alzare le spalle verso le orecchie',
      'Inarcare la zona lombare e spingere in fuori le costole',
      'Stringere forte trattenendo il respiro',
      'Muovere le braccia invece delle scapole'
    ],
    respirazione: 'Espira mentre stringi, inspira lasciando.',
    dose: { serie: '2–3', ripetizioni: '10', tenuta: '5 secondi', frequenza: '1–2 volte al giorno' },
    progressione: 'Con elastico leggero quando il protocollo concede la resistenza, poi in posizioni con il braccio più elevato.',
    regressione: 'Tenuta più breve, da seduto con le braccia sostenute.',
    precauzioni: 'Niente resistenza elastica finché non è concessa: in questa fase è un esercizio di controllo, non di forza. ' + PRECAUZIONI_CUFFIA_2,
    doloreAmmesso: 'Nessun dolore alla spalla operata; affaticamento fra le scapole accettabile.',
    note: 'I protocolli per lesioni ampie mettono il lavoro posturale, il rilassamento del trapezio superiore e la retrazione-depressione scapolare attiva prima ancora dell’inizio del movimento attivo assistito di spalla, perché la scapola è la base da cui parte l’elevazione. Lavorarla non carica la sutura e prepara il terreno: quando il braccio torna attivo, una scapola che non sa stabilizzarsi produce proprio quei compensi — spalla che sale, tronco che si inclina — che poi si fatica a togliere.'
  }),
  e({
    nome: 'Elevazione attiva nel piano della scapola, da supino',
    regione: 'Spalla', categoria: 'Controllo motorio',
    protocollo: CUFFIA_2, da: '1.5',
    obiettivo: 'Primo movimento attivo della spalla operata, con la gravità scaricata dal letto.',
    attrezzatura: ['Lettino'],
    posizione: 'Supino, ginocchia flesse, braccio operato lungo il fianco, pollice rivolto al soffitto.',
    esecuzione: 'Solleva il braccio verso il soffitto con le tue forze, leggermente in avanti rispetto alla linea delle spalle, fino al limite concesso. Mantieni un istante e scendi lentamente. Se il braccio non sale da solo in modo pulito, aiutalo con l’arto sano nella sola salita e scendi da solo.',
    puntiChiave: [
      'Pollice verso l’alto: il movimento è nel piano della scapola, non di lato puro',
      'Sali solo fin dove il movimento resta fluido e senza compensi',
      'Scendere lentamente è più importante che salire in alto',
      'Fermarsi appena la spalla comincia a salire verso l’orecchio'
    ],
    erroriComuni: [
      'Partire con uno strappo per vincere il primo tratto',
      'Trattenere il respiro nello sforzo',
      'Insistere oltre il punto in cui compare il compenso',
      'Passare subito alla posizione seduta'
    ],
    respirazione: 'Espira salendo.',
    dose: { serie: '2–3', ripetizioni: '8–10', recupero: '30 secondi', frequenza: '1 volta al giorno', ritmo: '3 secondi in discesa' },
    progressione: 'Aumentare l’inclinazione del busto fino alla posizione seduta, poi in piedi; infine aggiungere un carico leggero quando il protocollo lo concede.',
    regressione: 'Salita assistita dall’arto sano e sola discesa attiva; oppure ampiezza ridotta.',
    precauzioni: 'Nessun peso in mano in questa fase. Se il movimento attivo è possibile solo con compensi evidenti, è troppo presto. ' + PRECAUZIONI_CUFFIA_2,
    doloreAmmesso: 'Fino a 3/10 durante, senza aumento nelle 24 ore successive.',
    note: 'È il momento di verità del percorso: la differenza fra un’elevazione attiva pulita e una ottenuta a forza di compensi si decide qui. La posizione supina toglie quasi del tutto il momento gravitazionale e permette di isolare il controllo; la variante utile quando il braccio non parte è la salita assistita con discesa attiva, che sfrutta il lavoro eccentrico, in genere meglio tollerato della concentrica.'
  }),
  e({
    nome: 'Isometrie submassimali della spalla, al fianco',
    regione: 'Spalla', categoria: 'Rinforzo',
    protocollo: CUFFIA_2, da: '1.5',
    obiettivo: 'Primo carico sulla cuffia riparata, senza movimento e con intensità dosabile.',
    attrezzatura: ['Muro'],
    posizione: 'In piedi o seduto, gomito flesso a 90° e tenuto al fianco con un asciugamano arrotolato sotto l’ascella.',
    esecuzione: 'Spingi contro una resistenza che non cede — il muro, la mano opposta, lo stipite — senza che il braccio si muova. Lavora in quattro direzioni, una per volta: rotazione esterna, rotazione interna, elevazione in avanti, abduzione. Spinta graduale, mantieni, poi rilascia con la stessa gradualità.',
    puntiChiave: [
      'Circa la metà della forza massima: è un carico, non una prova di forza',
      'La spinta sale e scende gradualmente, mai di colpo',
      'Il gomito resta al fianco e il tronco fermo',
      'Respira normalmente durante la tenuta'
    ],
    erroriComuni: [
      'Spingere al massimo fin dalla prima serie',
      'Trattenere il respiro',
      'Lasciare che il braccio si muova: diventa un altro esercizio',
      'Cominciare dalla rotazione interna dopo sutura del sottoscapolare'
    ],
    respirazione: 'Normale e continua durante la tenuta.',
    dose: { serie: '3–5', tenuta: '10–30 secondi', recupero: '30–60 secondi', frequenza: '1 volta al giorno', rpe: '4–6/10' },
    progressione: 'Aumentare la tenuta e poi l’intensità; passare all’elastico leggero quando il protocollo apre al rinforzo dinamico, in genere dalla dodicesima settimana.',
    regressione: 'Tenute brevi, intensità minore, solo nelle direzioni indolori.',
    precauzioni: 'Si introduce quando il protocollo lo prevede, in genere fra l’ottava e la dodicesima settimana. Dopo sutura del sottoscapolare la rotazione interna contro resistenza resta esclusa più a lungo delle altre direzioni. ' + PRECAUZIONI_CUFFIA_2,
    doloreAmmesso: 'Fino a 3–4/10 durante la tenuta, purché non aumenti fra una serie e l’altra e non lasci dolore notturno.',
    note: 'L’isometria è il modo più controllabile di ricominciare a caricare: niente movimento, quindi niente arco doloroso, e intensità regolabile dal paziente stesso. I protocolli la collocano nella fase del movimento attivo, fra l’ottava e la dodicesima settimana; quelli per sutura del sottoscapolare partono dall’ottava con le isometrie di deltoide e cuffia e il lavoro contro resistenza degli stabilizzatori della scapola. Prima di aggiungere resistenza dinamica conviene che la tenuta sia indolore in tutte le direzioni concesse.'
  }),

  /* ---------- Spalla — sutura della cuffia, rinforzo e ritorno ---------- */
  /*
     Fase 3 (in genere dalla dodicesima settimana) e fase 4 (dalla sedicesima
     in avanti). Qui si torna a caricare: la progressione segue i criteri —
     movimento completo, assenza di compensi, dolore che non si trascina —
     non il calendario.
  */
  e({
    nome: 'Rotazione esterna con elastico dopo sutura di cuffia',
    regione: 'Spalla', categoria: 'Rinforzo',
    protocollo: CUFFIA_3, da: '1.5',
    obiettivo: 'Rinforzare i rotatori esterni, il gruppo che più spesso resta debole dopo la riparazione.',
    attrezzatura: ['Elastico'],
    posizione: 'In piedi di fianco al punto di ancoraggio, gomito flesso a 90° e tenuto al fianco con un asciugamano arrotolato sotto l’ascella.',
    esecuzione: 'Ruota l’avambraccio verso l’esterno tirando l’elastico, fermati al grado concesso, mantieni un istante e torna lentamente controllando il ritorno. Il gomito resta incollato al fianco per tutto il movimento.',
    puntiChiave: [
      'Si parte dall’elastico più leggero che esista, anche se sembra inutile',
      'Il gomito non si stacca e non scivola indietro',
      'Il ritorno frenato è la metà utile dell’esercizio',
      'Nessun dolore durante e nessun dolore notturno dopo'
    ],
    erroriComuni: [
      'Partire con un elastico da persona sana',
      'Allontanare il gomito dal fianco',
      'Ruotare il tronco invece della spalla',
      'Aumentare la resistenza ogni settimana per abitudine'
    ],
    respirazione: 'Espira nella spinta.',
    dose: { serie: '3', ripetizioni: '12–15', recupero: '60 secondi', frequenza: '3 volte a settimana', carico: 'elastico leggerissimo all’inizio', ritmo: '3 secondi nel ritorno', rpe: '5–6/10' },
    progressione: 'Elastico via via più resistente; poi braccio a 45° e infine a 90° di abduzione, quando il movimento resta pulito.',
    regressione: 'Isometria nella stessa posizione; elastico più leggero; ampiezza ridotta.',
    precauzioni: 'Non prima della dodicesima settimana, salvo diversa indicazione. ' + PRECAUZIONI_CUFFIA_3,
    doloreAmmesso: 'Fino a 3/10 durante, che rientra entro 24 ore. Dolore notturno nei giorni successivi significa che il carico era troppo.',
    note: 'I protocolli collocano il rinforzo con elastico fra la decima e la tredicesima settimana, con resistenze leggere e progressione lenta. La differenza con la stessa esercitazione nel paziente non operato sta tutta nel punto di partenza e nella velocità di salita: qui il tendine ha una storia, e il criterio per aumentare è la qualità delle ultime ripetizioni, non il tempo trascorso.'
  }),
  e({
    nome: 'Rotazione interna con elastico dopo sutura di cuffia',
    regione: 'Spalla', categoria: 'Rinforzo',
    protocollo: CUFFIA_3, da: '1.5',
    obiettivo: 'Rinforzare i rotatori interni rispettando i tempi del sottoscapolare, quando è coinvolto.',
    attrezzatura: ['Elastico'],
    posizione: 'In piedi di fianco al punto di ancoraggio, con il lato operato più vicino, gomito a 90° al fianco e asciugamano sotto l’ascella.',
    esecuzione: 'Porta l’avambraccio verso l’ombelico tirando l’elastico, mantieni un istante, poi lascia tornare lentamente fino alla posizione di partenza senza superarla verso l’esterno.',
    puntiChiave: [
      'Il gomito resta al fianco: non si porta avanti né indietro',
      'Non andare oltre la posizione neutra nel ritorno',
      'Movimento corto e pulito, non ampio',
      'Il tronco resta fermo'
    ],
    erroriComuni: [
      'Ruotare il tronco per aumentare la resistenza percepita',
      'Lasciar tornare l’elastico di colpo oltre il neutro',
      'Introdurla presto dopo sutura del sottoscapolare',
      'Usarla come esercizio principale: i rotatori esterni ne hanno più bisogno'
    ],
    respirazione: 'Espira nella spinta.',
    dose: { serie: '3', ripetizioni: '12–15', recupero: '60 secondi', frequenza: '3 volte a settimana', carico: 'elastico leggero', ritmo: '3 secondi nel ritorno', rpe: '5–6/10' },
    progressione: 'Elastico più resistente; poi in posizioni con il braccio più elevato, quando concesso.',
    regressione: 'Isometria di rotazione interna contro la mano opposta.',
    precauzioni: 'Dopo sutura del sottoscapolare il rinforzo in rotazione interna è spesso escluso fino alla dodicesima settimana: è il tendine riparato a lavorare. ' + PRECAUZIONI_CUFFIA_3,
    doloreAmmesso: 'Fino a 3/10 durante. Dolore in avanti, nella zona del sottoscapolare, è un segnale di stop.',
    note: 'Dopo riparazione del sottoscapolare la rotazione interna attiva viene evitata per circa sei settimane e quella contro resistenza fino alla dodicesima: è la direzione in cui il tendine riparato tira direttamente. Nel post-operatorio del sovraspinato la cautela è minore, ma il principio resta: la direzione che mette in tensione la sutura è l’ultima a essere caricata.'
  }),
  e({
    nome: 'Remata con elastico',
    regione: 'Spalla', categoria: 'Rinforzo',
    protocollo: CUFFIA_3, da: '1.5',
    obiettivo: 'Rinforzare gli stabilizzatori della scapola, che reggono la spalla nei gesti quotidiani.',
    attrezzatura: ['Elastico'],
    posizione: 'In piedi di fronte al punto di ancoraggio, all’altezza del petto, braccia tese in avanti, piedi alla larghezza delle anche.',
    esecuzione: 'Tira i gomiti indietro lungo i fianchi avvicinando le scapole alla colonna, mantieni un istante e torna lentamente in avanti lasciando che le scapole si distendano.',
    puntiChiave: [
      'Il movimento parte dalle scapole, le braccia seguono',
      'I gomiti restano vicini al corpo',
      'Le spalle non salgono verso le orecchie',
      'Il ritorno è lento e completo'
    ],
    erroriComuni: [
      'Tirare con le braccia tenendo le scapole bloccate',
      'Inarcare la zona lombare e portare le costole in fuori',
      'Alzare le spalle',
      'Elastico troppo duro, che costringe a compensare'
    ],
    respirazione: 'Espira tirando.',
    dose: { serie: '3', ripetizioni: '12', recupero: '60 secondi', frequenza: '3 volte a settimana', carico: 'elastico che rende faticose le ultime 2 ripetizioni', ritmo: '3 secondi nel ritorno', rpe: '6/10' },
    progressione: 'Elastico più resistente; remata a un braccio solo; in appoggio su un ginocchio per togliere l’aiuto del tronco.',
    regressione: 'Elastico più leggero; da seduto, con il tronco appoggiato.',
    precauzioni: PRECAUZIONI_CUFFIA_3,
    doloreAmmesso: 'Fino a 3/10, in rientro entro 24 ore.',
    note: 'I protocolli inseriscono la remata nella fase di rinforzo, fra la decima e la sedicesima settimana, insieme a scaption e rotazione esterna. Vale come lavoro di base del cingolo: carica i muscoli che tengono la scapola senza chiedere alla cuffia riparata il gesto sopra la testa, e per molti pazienti è il primo esercizio in cui si sentono di nuovo forti, il che conta nel percorso quanto il muscolo.'
  }),
  e({
    nome: 'Elevazione nel piano della scapola con carico leggero (scaption)',
    regione: 'Spalla', categoria: 'Rinforzo',
    protocollo: CUFFIA_3, da: '1.5',
    obiettivo: 'Riportare forza nel gesto che serve davvero: alzare il braccio in avanti.',
    attrezzatura: ['Manubri'],
    posizione: 'In piedi, piedi alla larghezza delle anche, braccia lungo il corpo, un peso leggero in mano, pollice verso l’alto.',
    esecuzione: 'Alza il braccio in avanti e leggermente di lato, a circa 30° dalla linea del corpo, fino all’altezza della spalla. Mantieni un istante e scendi lentamente. Si comincia senza peso e, quando il movimento resta pulito, si aggiunge mezzo chilo per volta.',
    puntiChiave: [
      'Nel piano della scapola, non di lato puro',
      'Fermarsi all’altezza della spalla finché il protocollo non concede di più',
      'La spalla non sale verso l’orecchio: se succede, il peso è troppo',
      'Discesa lenta e controllata'
    ],
    erroriComuni: [
      'Aggiungere peso prima di avere un movimento pulito a mani vuote',
      'Inclinare il tronco all’indietro per aiutare la salita',
      'Salire oltre il limite concesso',
      'Fare molte ripetizioni veloci invece di poche lente'
    ],
    respirazione: 'Espira salendo.',
    dose: { serie: '3', ripetizioni: '10–12', recupero: '60 secondi', frequenza: '3 volte a settimana', carico: 'si parte a mani vuote, poi 0,5–1 kg', ritmo: '3 secondi in discesa', rpe: '5–6/10' },
    progressione: 'Dal movimento supino a quello in piedi, poi carico crescente e infine oltre i 90°, quando concesso.',
    regressione: 'Senza peso; oppure da supino, dove la gravità pesa meno.',
    precauzioni: 'Il carico si aggiunge solo con elevazione completa e indolore e senza compensi. ' + PRECAUZIONI_CUFFIA_3,
    doloreAmmesso: 'Fino a 3/10 durante, senza dolore notturno nei giorni seguenti.',
    note: 'La scaption progredisce dal supino all’eretto a mano a mano che l’escursione torna: è la traduzione in esercizio del gesto che il paziente aspetta di poter rifare. Il piano della scapola, circa 30° in avanti rispetto al frontale, è la direzione in cui lo spazio sotto-acromiale è più generoso e la cuffia lavora in migliore allineamento.'
  }),
  e({
    nome: 'Y e T in prono per gli stabilizzatori della scapola',
    regione: 'Spalla', categoria: 'Rinforzo',
    protocollo: CUFFIA_3, da: '1.5',
    obiettivo: 'Rinforzare trapezio medio e inferiore, che tengono la scapola durante i gesti sopra la testa.',
    attrezzatura: ['Lettino'],
    posizione: 'Prono sul letto con il braccio operato fuori dal bordo, oppure in piedi con il busto inclinato in avanti e appoggiato.',
    esecuzione: 'T: porta il braccio di lato all’altezza della spalla, pollice verso l’alto, mantieni e scendi. Y: portalo in diagonale verso l’alto, a circa 45° dalla testa, con il pollice in alto. Il movimento parte dall’avvicinamento della scapola alla colonna.',
    puntiChiave: [
      'Parte la scapola, poi il braccio',
      'Ampiezza fino all’altezza della spalla, non oltre, all’inizio',
      'Il collo resta lungo e la spalla non sale',
      'A mani vuote finché il movimento non è pulito'
    ],
    erroriComuni: [
      'Partire con il peso',
      'Inarcare la zona lombare per sollevare di più',
      'Alzare la spalla verso l’orecchio',
      'Fare la Y prima che la T sia controllata'
    ],
    respirazione: 'Espira salendo.',
    dose: { serie: '2–3', ripetizioni: '10 per esercizio', tenuta: '2 secondi in alto', recupero: '60 secondi', frequenza: '2–3 volte a settimana', carico: 'a mani vuote, poi 0,5 kg', rpe: '5–6/10' },
    progressione: 'Aggiungere un carico leggero; aumentare la tenuta; passare alla posizione in piedi inclinata senza appoggio.',
    regressione: 'Solo T, ampiezza ridotta, con il braccio che scivola sul letto.',
    precauzioni: 'La posizione prona può essere scomoda sulla ferita e sul torace nelle prime settimane della fase: in quel caso si usa la variante inclinata in piedi. ' + PRECAUZIONI_CUFFIA_3,
    doloreAmmesso: 'Fino a 3/10, senza strascichi il giorno dopo.',
    note: 'I programmi delle fasi avanzate aggiungono il lavoro periscapolare in prono, Y e T, insieme alle progressioni di spinta. Il senso è che la cuffia riparata lavora bene solo su una scapola che tiene: rinforzare l’una senza l’altra lascia a metà il recupero del gesto sopra la testa, che è quello per cui il paziente si è operato.'
  }),
  e({
    nome: 'Spinte progressive in appoggio (dal muro al pavimento)',
    regione: 'Spalla', categoria: 'Rinforzo',
    protocollo: CUFFIA_4, da: '1.5',
    obiettivo: 'Riportare la spalla a reggere il peso del corpo, nella fase finale del recupero.',
    attrezzatura: ['Muro'],
    posizione: 'Si comincia in piedi di fronte al muro, mani all’altezza delle spalle; si prosegue su un piano via via più basso — tavolo, panca — e infine a terra, in appoggio sulle ginocchia.',
    esecuzione: 'Piega i gomiti avvicinando il petto all’appoggio, controllando la discesa, poi spingi tornando indietro. A fine spinta allontana leggermente le scapole dalla colonna, senza inarcare la schiena.',
    puntiChiave: [
      'Si cambia livello solo quando il precedente è indolore e pulito',
      'Il corpo resta in linea: niente bacino che sprofonda',
      'Gomiti vicini al corpo, non aperti a 90°',
      'La discesa è più lenta della spinta'
    ],
    erroriComuni: [
      'Passare al pavimento troppo presto',
      'Aprire i gomiti a croce',
      'Lasciarsi cadere nella discesa',
      'Proseguire nonostante il dolore in avanti sulla spalla'
    ],
    respirazione: 'Inspira scendendo, espira spingendo.',
    dose: { serie: '3', ripetizioni: '8–12', recupero: '60–90 secondi', frequenza: '2–3 volte a settimana', ritmo: '3 secondi in discesa', rpe: '6–7/10' },
    progressione: 'Appoggio sempre più basso, fino al pavimento; poi piedi al posto delle ginocchia.',
    regressione: 'Si torna all’appoggio più alto, dove il carico è minore.',
    precauzioni: 'Il carico in appoggio sul braccio operato arriva tardi: non prima della sedicesima settimana e solo con il consenso del chirurgo, soprattutto dopo riparazioni ampie. ' + PRECAUZIONI_CUFFIA_3,
    doloreAmmesso: 'Fino a 3/10 durante, che rientra entro 24 ore.',
    note: 'Nei programmi delle fasi finali le progressioni di spinta compaiono insieme al lavoro periscapolare: servono a chiudere il percorso per chi deve tornare a lavori manuali, a sport di appoggio o semplicemente a rialzarsi da terra con sicurezza. Il carico in appoggio è però l’ultima cosa che una cuffia riparata è pronta a sostenere: si introduce per gradi e si abbandona senza esitazione se la spalla risponde male.'
  }),
  e({
    nome: 'Ritorno al lavoro e ai gesti sopra la testa',
    regione: 'Spalla', categoria: 'Educazione e gestione del carico',
    protocollo: CUFFIA_4, da: '1.5',
    obiettivo: 'Riportare la spalla alle attività reali con una progressione decisa in anticipo, invece che a tentativi.',
    attrezzatura: ['Nessuna'],
    posizione: 'Si applica alle attività della giornata, non a un esercizio.',
    esecuzione: 'Scegli insieme al paziente i tre o quattro gesti che contano davvero — sollevare una cassa, stendere il bucato, lavorare con le braccia in alto, dormire sul lato operato — e affrontali uno per volta. Per ciascuno si parte da una quantità sicuramente tollerata, si tiene la stessa per qualche giorno, e si aumenta solo se nelle 24 ore successive non è cambiato nulla. Si cambia un elemento per volta: o il peso, o la durata, o l’altezza.',
    puntiChiave: [
      'Un gesto alla volta e un elemento alla volta: altrimenti non si sa che cosa ha fatto male',
      'La regola delle 24 ore: se il giorno dopo la spalla è come prima, il carico era giusto',
      'I gesti sopra la testa e il peso lontano dal corpo sono gli ultimi ad arrivare',
      'Tornare a dormire sul lato operato è spesso l’ultimo traguardo: non è un segnale di fallimento'
    ],
    erroriComuni: [
      'Riprendere tutto insieme il giorno in cui finisce la fisioterapia',
      'Misurare il recupero sul dolore del momento invece che sulla risposta del giorno dopo',
      'Tornare a lavori pesanti o sopra la testa senza il consenso del chirurgo',
      'Smettere gli esercizi di rinforzo appena si sta bene'
    ],
    respirazione: 'Non pertinente.',
    dose: { frequenza: 'rivalutazione ogni 1–2 settimane' },
    progressione: 'Criteri ricorrenti per considerare chiuso il percorso: escursione completa e indolore nei gesti richiesti, forza entro il 10% del lato sano, nessun compenso visibile, dolore 0–2/10 nell’attività, e via libera del chirurgo. Per lo sport i tempi riportati vanno dai 4 ai 9 mesi secondo la lesione e la disciplina.',
    regressione: 'Si torna all’ultimo livello tollerato e si riparte da lì, senza considerarlo un passo indietro.',
    precauzioni: 'Il ritorno a sport di lancio, a lavori sopra la testa e al carico pesante passa dal chirurgo. Un dolore che ricompare con il carico dopo mesi di quiete merita una rivalutazione, non solo più esercizi. ' + CHIRURGO,
    doloreAmmesso: '0–2/10 nelle attività, senza dolore notturno.',
    note: 'I criteri di dimissione che ricorrono nei protocolli sono tre: escursione completa e indolore nel gesto richiesto, forza confrontabile con il lato sano — spesso entro il 10% — e un test funzionale superato senza compensi. Il calendario serve a pianificare, i criteri a decidere. Questa voce esiste perché la parte del percorso in cui si perdono i risultati non è la riabilitazione, ma le settimane subito dopo, quando il paziente è lasciato solo a dosare.'
  }),

  /* ---------- Ginocchio e anca ---------- */
  e({
    nome: 'Squat su sedia',
    regione: 'Ginocchio', categoria: 'Rinforzo',
    obiettivo: 'Rinforzo di quadricipite e glutei in uno schema che serve nella vita quotidiana.',
    attrezzatura: ['Sedia'],
    posizione: 'In piedi davanti a una sedia, piedi alla larghezza delle anche.',
    esecuzione: 'Scendi indietro con il bacino fino a sfiorare la sedia, controllando la discesa, poi risali spingendo con tutto il piede.',
    puntiChiave: ['Le ginocchia seguono la punta dei piedi', 'Il peso è distribuito su tutto il piede', 'La discesa è più lenta della salita'],
    erroriComuni: ['Lasciarsi cadere sulla sedia', 'Ginocchia che cedono verso l’interno', 'Sollevare i talloni'],
    respirazione: 'Inspira scendendo, espira risalendo.',
    dose: { serie: '3', ripetizioni: '10–12', recupero: '60 secondi', frequenza: '3 volte a settimana', ritmo: '3 secondi in discesa', rpe: '6–7/10' },
    progressione: 'Sedia più bassa; squat senza appoggio; carico fra le mani.',
    regressione: 'Sedia più alta; appoggio delle mani sui braccioli.',
    doloreAmmesso: 'Fino a 3–5/10 nel dolore femororotuleo, purché rientri entro 24 ore.'
  }),
  e({
    nome: 'Step down dal gradino',
    regione: 'Ginocchio', categoria: 'Controllo motorio',
    obiettivo: 'Controllo dell’arto inferiore in carico monopodalico, fondamentale per scale e discese.',
    attrezzatura: ['Gradino'],
    posizione: 'In piedi su un gradino basso, un piede al bordo, mani libere o appoggiate leggermente.',
    esecuzione: 'Scendi lentamente con l’altro piede fino a sfiorare il pavimento con il tallone, senza scaricare il peso, poi risali.',
    puntiChiave: ['Il ginocchio in appoggio resta allineato sopra il piede', 'Il bacino resta orizzontale', 'Discesa lenta e silenziosa'],
    erroriComuni: ['Ginocchio che collassa verso l’interno', 'Bacino che cade dal lato libero', 'Appoggiare il peso sul piede che scende'],
    respirazione: 'Espira risalendo.',
    dose: { serie: '3', ripetizioni: '8–10 per lato', recupero: '60 secondi', frequenza: '3 volte a settimana', ritmo: '3 secondi in discesa' },
    progressione: 'Gradino più alto; carico in mano; occhi chiusi nella fase finale.',
    regressione: 'Gradino più basso; appoggio delle mani.',
    doloreAmmesso: 'Fino a 3/10.'
  }),
  e({
    nome: 'Abduzione d’anca in decubito laterale',
    regione: 'Bacino e anca', categoria: 'Rinforzo',
    obiettivo: 'Rinforzo dei glutei medio e minimo, che governano la stabilità del bacino nel cammino.',
    attrezzatura: ['Tappetino'],
    posizione: 'Sul fianco, gamba sotto flessa, gamba sopra distesa in linea con il tronco.',
    esecuzione: 'Solleva la gamba verso l’alto restando nel piano del corpo, mantieni un istante e scendi con controllo.',
    puntiChiave: ['La gamba non va in avanti: resta in linea', 'Il bacino non ruota indietro', 'Il piede resta parallelo al pavimento'],
    erroriComuni: ['Ruotare il bacino', 'Portare la gamba in avanti', 'Salire troppo in alto'],
    respirazione: 'Espira salendo.',
    dose: { serie: '3', ripetizioni: '12–15 per lato', recupero: '45 secondi', frequenza: '3 volte a settimana' },
    progressione: 'Elastico sopra le ginocchia o alle caviglie; cavigliera.',
    regressione: 'Ampiezza ridotta; ginocchio flesso.',
    doloreAmmesso: 'Fino a 3/10; evitare la compressione laterale dell’anca se dolorosa.'
  }),

  /* ---------- Caviglia e piede ---------- */
  e({
    nome: 'Sollevamento sulle punte',
    regione: 'Caviglia e piede', categoria: 'Rinforzo',
    obiettivo: 'Carico progressivo del tricipite surale e del tendine d’Achille.',
    attrezzatura: ['Muro', 'Gradino'],
    posizione: 'In piedi, avampiedi sul bordo di un gradino, mani appoggiate al muro per l’equilibrio.',
    esecuzione: 'Sali sulle punte il più possibile, mantieni un istante, poi scendi lentamente lasciando andare il tallone sotto il livello del gradino.',
    puntiChiave: ['La discesa, lenta, è la parte che conta', 'Il peso resta sull’alluce e sul secondo dito', 'Ginocchia distese nella versione per l’Achille, flesse per il soleo'],
    erroriComuni: ['Scendere di colpo', 'Spostare il peso sul bordo esterno del piede', 'Aiutarsi troppo con le braccia'],
    respirazione: 'Espira salendo.',
    dose: { serie: '3', ripetizioni: '12', recupero: '60 secondi', frequenza: 'a giorni alterni', ritmo: '3 secondi in discesa', rpe: '6–7/10' },
    progressione: 'Su una gamba sola; zaino con carico; versione a ginocchio flesso.',
    regressione: 'A due gambe sul pavimento, senza far scendere il tallone.',
    doloreAmmesso: 'Fino a 5/10 nelle tendinopatie, purché il mattino dopo la rigidità non sia peggiorata.'
  }),
  e({
    nome: 'Equilibrio monopodalico',
    regione: 'Caviglia e piede', categoria: 'Propriocezione ed equilibrio',
    obiettivo: 'Recupero del controllo posturale dopo distorsione e prevenzione delle recidive.',
    posizione: 'In piedi accanto a un appoggio sicuro, su un piede, ginocchio leggermente flesso.',
    esecuzione: 'Mantieni l’equilibrio senza appoggiarti, con l’altro piede sollevato a pochi centimetri da terra.',
    puntiChiave: ['Le dita del piede restano rilassate, non ad artiglio', 'Lo sguardo è fisso davanti', 'Un appoggio deve essere sempre a portata di mano'],
    erroriComuni: ['Irrigidire tutto il corpo', 'Tenere lo sguardo a terra', 'Esercitarsi senza un appoggio vicino'],
    dose: { serie: '3', durata: '30 secondi per lato', recupero: '30 secondi', frequenza: '1 volta al giorno' },
    progressione: 'Occhi chiusi; superficie morbida; movimenti del braccio o del capo; lancio di una palla.',
    regressione: 'Appoggio di un dito al muro; tempi più brevi.',
    doloreAmmesso: 'Nessuno.'
  }),

  /* ---------- Equilibrio e vestibolo ---------- */
  e({
    nome: 'Stabilizzazione dello sguardo x1',
    regione: 'Equilibrio e vestibolo', categoria: 'Vestibolare',
    obiettivo: 'Adattamento del riflesso vestibolo-oculomotore: lo sguardo resta stabile mentre il capo si muove.',
    attrezzatura: ['Muro'],
    posizione: 'Seduto, con un bersaglio (una lettera su un foglio) fissato al muro a circa un metro, all’altezza degli occhi.',
    esecuzione: 'Guarda il bersaglio e ruota il capo a destra e sinistra mantenendo la lettera sempre a fuoco e leggibile. La velocità è quella massima alla quale il bersaglio resta nitido.',
    puntiChiave: ['Il bersaglio deve restare nitido: se si sfoca, rallenta', 'Il movimento del capo è ampio quanto basta, non massimale', 'Un po’ di capogiro durante l’esercizio è atteso'],
    erroriComuni: ['Muovere gli occhi insieme al capo', 'Andare troppo veloce', 'Interrompere al primo sintomo'],
    respirazione: 'Normale.',
    dose: { serie: '3', durata: '1 minuto ciascuna', frequenza: '3–4 volte al giorno, per un totale di circa 12 minuti', recupero: 'il tempo che il capogiro rientri' },
    progressione: 'In piedi, poi in piedi a base ristretta; movimento verticale; sfondo complesso; da camminare.',
    regressione: 'Durata più breve, velocità minore, posizione seduta.',
    precauzioni: 'Eseguire in sicurezza, seduti, se compare instabilità.',
    doloreAmmesso: 'Il capogiro può aumentare durante l’esercizio: deve rientrare entro pochi minuti dalla fine.'
  }),
  e({
    nome: 'Stabilizzazione dello sguardo x2',
    regione: 'Equilibrio e vestibolo', categoria: 'Vestibolare',
    obiettivo: 'Progressione della stabilizzazione dello sguardo, con bersaglio e capo che si muovono in direzioni opposte.',
    posizione: 'Seduto o in piedi, con un bersaglio tenuto in mano all’altezza degli occhi.',
    esecuzione: 'Muovi il bersaglio in una direzione e il capo nella direzione opposta, mantenendo la lettera a fuoco.',
    puntiChiave: ['Bersaglio e capo si muovono insieme, in senso contrario', 'La nitidezza comanda la velocità', 'Ampiezze contenute'],
    erroriComuni: ['Muovere solo il bersaglio', 'Perdere la coordinazione e accelerare'],
    dose: { serie: '3', durata: '1 minuto ciascuna', frequenza: '2–3 volte al giorno' },
    progressione: 'In piedi; base ristretta; camminando.',
    regressione: 'Tornare alla versione x1.',
    doloreAmmesso: 'Capogiro che rientra entro pochi minuti.'
  }),
  e({
    nome: 'Cammino con rotazioni del capo',
    regione: 'Equilibrio e vestibolo', categoria: 'Propriocezione ed equilibrio',
    obiettivo: 'Riportare il controllo dell’equilibrio dentro il cammino, dove serve davvero.',
    posizione: 'In piedi, in un corridoio, con una parete a portata di mano.',
    esecuzione: 'Cammina in linea retta ruotando il capo a destra e a sinistra ogni due passi, mantenendo direzione e velocità.',
    puntiChiave: ['La traiettoria deve restare dritta', 'Le rotazioni sono ampie ma non brusche', 'Il corridoio offre un appoggio in caso di sbandamento'],
    erroriComuni: ['Rallentare fino a fermarsi', 'Ridurre le rotazioni fino ad annullarle', 'Esercitarsi in spazi aperti senza appoggi'],
    dose: { serie: '3', durata: '1 minuto', frequenza: '1–2 volte al giorno' },
    progressione: 'Rotazioni verticali; occhi chiusi per brevi tratti; superficie morbida; ambiente affollato.',
    regressione: 'Rotazioni più lente; mano che sfiora il muro.',
    precauzioni: 'Sempre con un appoggio raggiungibile; mai in cima a una scala.',
    doloreAmmesso: 'Instabilità lieve accettabile, cadute mai.'
  }),
  e({
    nome: 'Esercizi di Brandt-Daroff',
    regione: 'Equilibrio e vestibolo', categoria: 'Vestibolare',
    obiettivo: 'Abituazione domiciliare nella vertigine posizionale, quando le manovre liberatorie non sono praticabili o come mantenimento.',
    attrezzatura: ['Lettino'],
    posizione: 'Seduto sul bordo del letto.',
    esecuzione: 'Coricati rapidamente su un fianco con il capo ruotato di 45° verso l’alto, resta finché la vertigine passa e ancora 30 secondi, torna seduto per 30 secondi, poi ripeti dall’altro lato.',
    puntiChiave: ['Il passaggio è rapido, la permanenza è lunga', 'Aspettare che la vertigine si esaurisca prima di rialzarsi', 'Il capo va ruotato, non solo appoggiato'],
    erroriComuni: ['Muoversi troppo lentamente', 'Rialzarsi appena arriva la vertigine', 'Interrompere dopo un giorno'],
    dose: { serie: '5 cicli', frequenza: '3 volte al giorno', durata: 'fino a 2 settimane' },
    progressione: 'Ridurre la frequenza man mano che i sintomi si esauriscono.',
    regressione: 'Meno cicli, due volte al giorno.',
    precauzioni: 'Non indicato in presenza di segnali di allarme o di sospetta causa centrale. Attenzione in caso di problemi cervicali importanti.',
    doloreAmmesso: 'Vertigine attesa durante l’esecuzione, che deve ridursi di giorno in giorno.'
  }),

  /* ---------- Generale ---------- */
  e({
    nome: 'Respirazione diaframmatica',
    regione: 'Generale', categoria: 'Respirazione',
    obiettivo: 'Ridurre l’attivazione generale e la tensione muscolare di difesa; utile come rientro dopo gli esercizi provocativi.',
    attrezzatura: ['Tappetino'],
    posizione: 'Supino, ginocchia flesse, una mano sul petto e una sull’addome.',
    esecuzione: 'Inspira dal naso lasciando salire la mano sull’addome mentre quella sul petto resta ferma; espira lentamente dalla bocca, più a lungo dell’inspirazione.',
    puntiChiave: ['L’espirazione dura circa il doppio dell’inspirazione', 'Nessuno sforzo: se serve fatica, stai esagerando', 'Le spalle restano ferme'],
    erroriComuni: ['Gonfiare il petto', 'Respirare troppo profondamente fino a sentire capogiro', 'Contare in modo rigido'],
    dose: { durata: '5 minuti', frequenza: '1–2 volte al giorno' },
    progressione: 'Eseguire seduto e poi in piedi; usarla prima di un’attività temuta.',
    regressione: 'Durata più breve.',
    doloreAmmesso: 'Nessuno.'
  }),
  e({
    nome: 'Cammino a passo sostenuto',
    regione: 'Generale', categoria: 'Aerobico',
    obiettivo: 'Attività aerobica di base: incide su dolore persistente, sonno e tolleranza al carico.',
    posizione: 'All’aperto o su tapis roulant, con calzature comode.',
    esecuzione: 'Cammina a un ritmo che permette di parlare ma non di cantare, mantenendolo per tutta la durata prevista.',
    puntiChiave: ['Il ritmo si misura dal respiro, non dal passo', 'Meglio regolare e quotidiano che intenso e saltuario', 'Aumentare di poco per volta, circa il 10% a settimana'],
    erroriComuni: ['Partire con volumi troppo alti nei giorni buoni', 'Fermarsi del tutto nei giorni storti'],
    dose: { durata: '20–30 minuti', frequenza: '4–5 volte a settimana', rpe: '4–6/10' },
    progressione: 'Aumentare durata, poi ritmo, poi pendenza.',
    regressione: 'Frazionare in due uscite da 10 minuti.',
    doloreAmmesso: 'Un aumento fino a 3/10 che rientra entro 24 ore è accettabile.'
  })
];
