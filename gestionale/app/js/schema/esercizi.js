/* ============================================================
   Libreria degli esercizi
   ------------------------------------------------------------
   Ogni esercizio descrive che cosa fare, come farlo e con che
   dose. La scheda che il paziente porta a casa nasce da qui:
   quello che non e' scritto in modo eseguibile non viene fatto.

   Struttura di un esercizio:
     nome, regione, categoria, obiettivo
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
  'Fitball', 'Tappetino', 'Sedia', 'Muro', 'Gradino', 'Cuscino propriocettivo',
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
