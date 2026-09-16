# Agenda e calendari esterni

L'agenda gestisce gli **appuntamenti** in una vista settimanale: giorno per giorno, con ora,
paziente, prestazione, durata e stato (programmato, confermato, effettuato, disdetto, non
presentato). Gli appuntamenti passati non ancora chiusi vengono elencati sotto la settimana, per
non lasciarli in sospeso.

Gli appuntamenti sono un archivio a sé: non vanno confusi con le **sedute**, che documentano ciò che
è stato effettivamente fatto e finiscono nella cartella clinica.

## Collegamento con Google Calendar

Il gestionale **non si collega al tuo account Google**. Offre due strade in cui sei tu a decidere,
volta per volta, che cosa esce:

**Apri in Google Calendar** — dalla scheda dell'appuntamento, apre Google Calendar con l'evento già
compilato (titolo, data, ora, durata, luogo). Premi Salva tu. Non serve alcuna autorizzazione né
configurazione.

**File .ics** — scaricabile per il singolo appuntamento o per l'intera agenda, dal pulsante
*Esporta per il calendario*. Si importa in Google Calendar (Impostazioni → Importa ed esporta), in
Apple Calendario o in Outlook. È un'istantanea: le modifiche successive nel gestionale non si
propagano al calendario già importato.

## Che cosa finisce nel calendario

Un appuntamento di fisioterapia, associato a un nome, **rivela una prestazione sanitaria**. Per
questo il titolo dell'evento esportato è configurabile in *Impostazioni → Studio → Calendario*:

| Impostazione | Titolo dell'evento |
|---|---|
| **Solo iniziali** (predefinito) | `FT — M.R.` |
| Dicitura generica | `Appuntamento` |
| Nome per esteso | `Seduta di terapia manuale — Rossi Mario` |

Con la dicitura generica non escono né il nome né la prestazione: nemmeno nella descrizione
dell'evento. L'anteprima nella scheda dell'appuntamento mostra sempre il titolo che verrà usato,
prima di esportare.

## Perché non c'è una sincronizzazione automatica

Una sincronizzazione bidirezionale con Google Calendar richiederebbe:

1. un **progetto Google Cloud** creato da te, con Calendar API abilitata e un OAuth Client ID
   autorizzato per `http://127.0.0.1:4321`;
2. il caricamento degli script di Google nella pagina, che farebbe venir meno la proprietà attuale
   del gestionale di non contattare alcun server esterno;
3. il **trasferimento continuo e automatico** dei dati degli appuntamenti a Google, non più su
   decisione puntuale ma per ogni modifica — con le conseguenze già descritte in
   [`privacy-gdpr.md`](privacy-gdpr.md) riguardo ai dati che rivelano prestazioni sanitarie.

I primi due punti sono lavoro tecnico; il terzo è una scelta che spetta al titolare del trattamento.
Finché non è presa, l'esportazione resta puntuale e sotto controllo.

Se in futuro vuoi la sincronizzazione automatica, i pezzi da aggiungere sono: il flusso OAuth con
Google Identity Services, la creazione e l'aggiornamento degli eventi tramite Calendar API,
la memorizzazione dell'identificativo dell'evento su ciascun appuntamento per poterlo aggiornare o
cancellare, e la gestione dei conflitti quando lo stesso appuntamento viene modificato da entrambe
le parti.
