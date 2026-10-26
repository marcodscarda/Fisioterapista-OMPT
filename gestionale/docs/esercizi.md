# Esercizi e programma domiciliare

Due cose distinte che lavorano insieme:

- la **libreria** (voce *Esercizi* nel menu) è dello studio: un esercizio si scrive una
  volta e si prescrive molte;
- il **programma** sta dentro l'episodio di cura del singolo paziente (scheda *Esercizi*
  nella cartella): dice quali esercizi fa **questo** paziente e con che dose.

Così una correzione alla descrizione di un esercizio si riflette su tutti i pazienti che
ce l'hanno, mentre la dose resta quella decisa per ciascuno.

## Che cosa contiene un esercizio

| | |
|---|---|
| **Obiettivo** | A cosa serve, in una frase |
| **Posizione di partenza** | Da dove si parte |
| **Esecuzione** | Il movimento, passo passo, come lo spiegheresti a voce |
| **Punti chiave** | I richiami che fanno la differenza |
| **Errori comuni** | Cosa si sbaglia di solito |
| **Respirazione** | Quando inspirare ed espirare |
| **Attrezzatura** | Cosa serve |
| **Dosaggio** | Serie, ripetizioni, tenuta, durata, recupero, frequenza, carico, ritmo, RPE |
| **Progressione / regressione** | Come si rende più difficile o più facile |
| **Dolore ammesso** | Quanto fastidio è accettabile ed entro quando deve rientrare |
| **Precauzioni** | Quando non farlo, quando fermarsi |
| **Protocollo** | Facoltativo: il percorso a cui appartiene, per raggrupparlo con gli altri |
| **Note** | Il razionale, per te: non finisce sulla scheda del paziente |

Il campo **dolore ammesso** vale la pena compilarlo sempre: è la domanda che il paziente
si fa davvero a casa, e senza una risposta scritta o smette al primo fastidio o insiste
quando non dovrebbe.

## Immagini e video

Le **immagini** si caricano dalla scheda dell'esercizio: vengono ridotte e salvate
nell'archivio locale, come il logo. Finiscono quindi dentro ogni backup, perciò conviene
tenerne poche per esercizio — una o due bastano, e sono quelle che compaiono sulla scheda
stampata.

I **video** restano **collegamenti**, non file: un filmato dentro l'archivio del browser
lo renderebbe pesantissimo e i backup ingestibili. Puoi incollare un link di YouTube, di
Vimeo o di una cartella condivisa. Due avvertenze pratiche:

- se il video è privato o "non in elenco", verifica che il paziente riesca ad aprirlo;
- i link compaiono per esteso sulla scheda stampata, così restano utilizzabili anche
  dalla carta.

## Protocolli

Un esercizio può dichiarare il **protocollo** a cui appartiene: un testo libero, per
esempio *Sutura della cuffia dei rotatori — fase 1 (passiva)*. Tutti gli esercizi con lo
stesso testo si tengono insieme:

- in libreria compare una tendina per mostrare solo quelli di un protocollo;
- la ricerca (anche quella globale, Ctrl/Cmd+K) li trova digitando il nome del protocollo;
- il protocollo si legge sulla scheda dell'esercizio e sulla sua stampa;
- scegliendo gli esercizi per un paziente basta cercare il protocollo per averli tutti
  davanti.

Il campo è facoltativo e si scrive a mano: scegli tu i nomi e le fasi. Conviene ripetere
lo stesso testo identico, altrimenti i filtri vedono due protocolli diversi.

### Sutura della cuffia dei rotatori — fase 1 (passiva)

Il catalogo comprende i quattro esercizi di questa fase: *elevazione assistita dall'arto
sano da supino*, *elevazione delle scapole da seduto (spallucce)*, *esercizi pendolari di
Codman*, *abduzione passiva con bastone da supino*. L'idea comune è muovere la spalla
senza far lavorare i tendini suturati: il motore è l'arto sano o il tronco, mai la cuffia
operata. Nelle **note** di ciascuno c'è il razionale, che resta per te e non finisce sulla
scheda del paziente.

I gradi indicati (per esempio 90–120° di elevazione, 60–90° di abduzione) e i tempi sono
quelli più comuni delle prime settimane: **il riferimento resta il protocollo del
chirurgo**, che cambia con il tendine suturato, la dimensione della lesione e la tecnica.
Con sutura del sottoscapolare, rotazione esterna ed estensione restano limitate più a
lungo. Modifica i quattro esercizi di conseguenza: sono voci di libreria come tutte le
altre.

## Il catalogo di partenza

Alla prima apertura la libreria contiene **26 esercizi** su rachide lombare e cervicale,
spalla (compresi i quattro del protocollo di cuffia), anca, ginocchio, caviglia,
equilibrio e vestibolo, più alcuni generali (respirazione, cammino).

Servono a non partire dal vuoto. **Sono modificabili, duplicabili e cancellabili** come
qualsiasi altro: la dose indicata è un punto di partenza ragionevole, non una prescrizione,
e va adattata al singolo paziente. Se il tuo modo di spiegare un esercizio è diverso,
riscrivilo: la libreria deve parlare come parli tu, perché quello che il paziente legge a
casa deve suonare come quello che ha sentito in studio.

Quando un aggiornamento del gestionale porta esercizi nuovi, questi arrivano anche a chi
ha già la libreria piena: vengono aggiunte **solo le voci nuove**, e quelle che avevi
cancellato non ricompaiono.

## Comporre il programma

Nella cartella dell'episodio, scheda **Esercizi**:

1. **Aggiungi esercizio** apre la libreria, con i filtri per regione e tipo. Un esercizio
   già inserito viene mostrato come tale, così non lo aggiungi due volte.
2. Le frecce **↑ ↓** cambiano l'ordine: è l'ordine in cui il paziente li troverà sulla
   scheda, quindi mettili nella sequenza in cui vanno eseguiti.
3. Aprendo **Dosaggio per questo paziente** puoi cambiare qualsiasi campo. Un campo
   lasciato uguale a quello della libreria non viene memorizzato: resta agganciato al
   valore predefinito, e se un domani lo cambi in libreria cambia anche qui.
4. La **nota per il paziente** è la riga specifica per lui («solo la mattina», «prima
   della camminata»).
5. Le **indicazioni generali** in cima valgono per tutto il programma.

## La scheda da consegnare

**Stampa per il paziente** produce un foglio con, per ogni esercizio: foto, obiettivo,
posizione, esecuzione, punti chiave, errori da evitare, dose in evidenza, cosa fare se fa
male e i link ai video. In fondo c'è una riga che invita a sospendere e a contattarti se i
sintomi peggiorano e non rientrano entro 24 ore.

**Anteprima** mostra a schermo esattamente quello che verrà stampato, prima di consumare
carta.

## Spostare la libreria su un altro computer

Dalla pagina *Esercizi*, **⬇ Esporta** produce un JSON con la sola libreria — nessun dato
di pazienti — e **⬆ Importa** lo rilegge. Gli esercizi con un nome già presente vengono
saltati, quindi l'importazione si può ripetere senza creare doppioni.
