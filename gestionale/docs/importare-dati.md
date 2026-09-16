# Portare qui i dati da un altro gestionale

La procedura si apre dal pulsante **⬆ Importa fatture** in alto nella pagina *Fatture*, oppure da
**Impostazioni → Dati e backup → Importa dati**. È pensata sugli export di Zoho Invoice, ma la
corrispondenza fra le colonne è modificabile, quindi funziona con qualunque CSV che contenga le
stesse informazioni.

Lo stesso pulsante serve anche dopo il primo travaso: se più avanti ti ritrovi altre fatture da
caricare — un export di un anno precedente, un elenco preparato in un foglio di calcolo — passi di
lì e ripeti la procedura. Quel che è già in archivio viene riconosciuto e saltato.

## Che cosa esportare da Zoho Invoice

Tre file, da importare **in quest'ordine**:

| # | In Zoho | File | Che cosa diventa |
|---|---|---|---|
| 1 | Contatti → ⋮ → Esporta | `Contacts.csv` / `Contatti.csv` | i pazienti |
| 2 | Fatture → ⋮ → Esporta | `Invoice.csv` / `Fattura.csv` | le fatture, con le loro voci |
| 3 | Pagamenti ricevuti → ⋮ → Esporta | `Customer_Payment.csv` / `Pagamento_cliente.csv` | gli incassi |

I nomi cambiano a seconda della lingua dell'interfaccia di Zoho: le intestazioni vengono riconosciute
in entrambe.

L'ordine conta: le fatture si agganciano ai pazienti per nome, e gli incassi si agganciano alle
fatture per numero del documento.

Scegli il formato **CSV**. Se Zoho propone di scegliere le colonne, esportale tutte: quelle che non
servono vengono semplicemente ignorate.

## Come funziona la procedura

1. **Scegli il file.** Il separatore (`,` o `;`) viene rilevato da solo, insieme alla codifica.
2. **Controlla la corrispondenza delle colonne.** Il tipo di file e l'abbinamento fra le colonne e i
   campi del gestionale sono proposti automaticamente a partire dalle intestazioni; accanto a ogni
   campo vedi un valore preso dal file, per accorgerti subito di un abbinamento sbagliato. I campi
   contrassegnati con `*` sono necessari.
3. **Guarda l'anteprima.** Mostra i primi elementi già trasformati: date convertite, importi
   interpretati, voci raggruppate.
4. **Importa.** Al termine ottieni il conteggio di ciò che è stato creato, aggiornato o saltato, con
   l'elenco degli avvisi.

**La procedura è ripetibile.** I pazienti già presenti vengono riconosciuti (per codice fiscale, o
per nome e cognome anche invertiti) e non duplicati; le fatture già importate vengono saltate in base
al numero di origine; gli incassi in base a documento, data e importo. Se la prima corrispondenza fra
le colonne era sbagliata puoi correggerla e ripetere senza moltiplicare i dati.

## Dettagli che vale la pena conoscere

**Date ambigue.** `03/04/2026` può essere il 3 aprile o il 4 marzo. Il gestionale guarda l'intera
colonna: se da qualche parte compare un giorno maggiore di 12, deduce il formato e lo applica a
tutte le righe. Se la colonna è ambigua dall'inizio alla fine, assume il formato italiano
(giorno/mese). Controlla l'anteprima.

**Importi.** Sono riconosciute sia la scrittura italiana (`1.234,56`) sia quella anglosassone
(`1,234.56`), con o senza simbolo di valuta. Quando una colonna è ambigua — `40.000` può valere
quaranta o quarantamila — viene letta tutta la colonna: se da qualche parte compare un numero che
con il punto come separatore delle migliaia sarebbe scritto male (`1000.000`), il punto viene trattato
come separatore decimale in tutte le righe. È il caso degli export di Zoho, dove `40.000` sono
quaranta euro.

**Fatture su più righe.** Zoho scrive una riga per ogni voce della fattura: le righe con lo stesso
numero vengono ricomposte in un unico documento con più voci.

**Il totale di origine viene conservato.** Se il totale dichiarato nel file non coincide con la somma
delle voci, il gestionale capisce perché: una differenza in meno diventa uno sconto, una differenza
pari all'imposta di bollo fa sì che il bollo risulti applicato (o non applicato) esattamente come nel
documento originale. Se lo scarto resta inspiegato la fattura viene importata ugualmente e la
differenza ti viene segnalata, così puoi controllarla.

**Numerazione.** Puoi scegliere fra due comportamenti:

- *Archivio storico* (predefinito): i documenti conservano il numero che avevano (`INV-000123`) e
  **non** influenzano il progressivo del gestionale, che partirà da 1 per le nuove fatture.
- *Prosegui la stessa serie*: dal numero di origine vengono lette le cifre finali, così la
  numerazione del gestionale riprende da dove si era fermata.

**Codici fiscali.** Negli export reali il codice fiscale finisce dove capita: in un campo suo, nel
campo dell'indirizzo, o dentro un blocco di testo insieme a via e CAP. Il gestionale lo cerca in
tutta la riga e prende quello con il carattere di controllo corretto. Un codice che non supera il
controllo viene importato ugualmente — così non perdi il dato — ma compare con l'etichetta *da
verificare* già nell'anteprima, e poi fra gli avvisi.

**Indirizzi su più righe.** Quando via, comune, provincia e CAP sono ammassati in un unico campo
(`Via degli Astronauti 61 bis` / `90072 Altofonte (PA)`), vengono separati nei campi giusti. Una riga
viene letta come località solo se porta un CAP o una sigla di provincia, così una via non finisce per
sbaglio nel campo del comune.

**Titoli davanti al nome.** `Sig.ra`, `Dott.`, `Prof.` e simili vengono tolti dal nome del paziente e
ignorati anche quando si confrontano i nomi per riconoscere un paziente già presente.

**Fatture annullate.** Gli stati `Void` o simili vengono importati come documenti annullati.

**Prima di iniziare, scarica un backup.** Se qualcosa non va, il ripristino riporta tutto com'era.

## Che cosa non viene importato

Preventivi, note di credito, prodotti a magazzino, tasse riga per riga e allegati. Vengono importati
anagrafiche, documenti con le loro voci e incassi: quanto serve a ricostruire lo storico e i registri.
