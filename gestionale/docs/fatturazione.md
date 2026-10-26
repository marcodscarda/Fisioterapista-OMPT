# Fatturazione delle prestazioni fisioterapiche

Questa pagina documenta **che cosa calcola il gestionale e su quale base**, così da poterlo
verificare con il proprio commercialista. Non sostituisce una consulenza fiscale: le regole
cambiano, tipicamente con la legge di bilancio.

---

## 1. Esenzione IVA

Le prestazioni sanitarie di diagnosi, cura e riabilitazione rese alla persona nell'esercizio delle
professioni sanitarie sono **esenti da IVA** ai sensi dell'**art. 10, n. 18, D.P.R. 633/1972**.

Il gestionale applica l'esenzione per impostazione predefinita e stampa la dicitura in fattura.
Si può disattivare per singolo documento (opzione *Prestazione esente IVA*) quando la prestazione
non ha finalità di cura — per esempio consulenze non sanitarie o attività didattiche — nel qual
caso viene applicata l'aliquota ordinaria.

## 2. Imposta di bollo

Sui documenti **esenti o non soggetti a IVA** di importo **superiore a € 77,47** va applicata una
marca da bollo da **€ 2,00** (D.P.R. 642/1972, allegato A, art. 13).

- La soglia è **"superiore a"**: a € 77,47 esatti il bollo non è dovuto, a € 77,48 sì.
- Il bollo può essere **addebitato al paziente**: in tal caso è un rimborso di anticipazione in nome
  e per conto ai sensi dell'**art. 15 D.P.R. 633/1972**, quindi fuori campo IVA, e si somma al totale.
- Se non viene addebitato resta a carico del professionista: il gestionale lo segnala nei totali ma
  non lo somma al documento, e in stampa riserva comunque lo spazio per la marca.
- La marca va **apposta materialmente sull'originale** consegnato al paziente.

Soglia e importo sono modificabili in *Impostazioni → Fisco*, per non dover toccare il codice se la
norma cambia.

## 3. Regime forfettario

In regime forfettario (**art. 1, commi 54-89, L. 190/2014**):

- non si applica l'IVA;
- **non si applica la ritenuta d'acconto** (art. 1, comma 67): il gestionale disattiva l'opzione
  quando il regime selezionato è forfettario, anche se la spunta fosse attiva nelle impostazioni;
- in fattura viene stampata la dicitura di appartenenza al regime.

## 4. Rivalsa INPS gestione separata

Chi è iscritto alla gestione separata INPS può addebitare al cliente una rivalsa del **4%**
(art. 1, comma 212, L. 662/1996). Il gestionale la calcola sull'imponibile e la include nella base
imponibile del documento; è disattivata per impostazione predefinita.

## 5. Ritenuta d'acconto

Applicabile solo **fuori dal regime forfettario** e solo quando il committente è sostituto d'imposta
(art. 25 D.P.R. 600/1973) — quindi di norma **non** verso un paziente privato. Il gestionale la
calcola sul totale di imponibile e rivalsa e la sottrae dal netto a pagare.

## 6. Ordine di calcolo

```
imponibile lordo   = Σ (quantità × prezzo)
imponibile         = imponibile lordo − sconto
rivalsa INPS       = imponibile × %rivalsa                (se attiva)
IVA                = imponibile × aliquota                (0 se esente)
bollo dovuto       = esente E (imponibile + rivalsa) > soglia
totale documento   = imponibile + rivalsa + IVA + bollo   (bollo solo se addebitato)
ritenuta           = (imponibile + rivalsa) × %ritenuta   (mai in forfettario)
netto a pagare     = totale documento − ritenuta
```

Tutti gli importi sono arrotondati al centesimo. I casi limite (soglia del bollo, sconti,
arrotondamenti, ritenuta in forfettario) sono coperti dai test in `test/logica.test.mjs`.

## 7. Numerazione

La numerazione è **progressiva per anno solare** e viene assegnata solo al momento dell'emissione:
finché il documento è in bozza non consuma numeri. Il contatore si riallinea automaticamente al
numero più alto presente in archivio, così un ripristino da backup non genera duplicati.

Una fattura emessa **non può essere eliminata**: si può solo *annullare*, mantenendo il numero
occupato. È la condizione perché la numerazione risulti priva di salti in caso di controllo.

## 8. Detraibilità per il paziente

Per detrarre la spesa sanitaria il paziente deve conservare il documento e, per le prestazioni rese
da strutture private, il pagamento deve essere avvenuto con **mezzi tracciabili**, salvo le eccezioni
previste dalla legge. La dicitura è stampata automaticamente in calce.

## 9. Sistema Tessera Sanitaria

Se il paziente **si oppone** all'invio dei dati di spesa al Sistema TS, la spesa non confluisce nella
dichiarazione precompilata: l'opposizione si registra nell'anagrafica del paziente, viene riportata
sul documento e va conservata agli atti.

> Il gestionale **non trasmette** nulla al Sistema TS e non emette fattura elettronica: prepara il
> documento cartaceo. L'invio resta da fare con i canali abituali (portale STS, gestionale del
> commercialista, software di fatturazione elettronica dove obbligatoria).

## 10. Documento senza partita IVA

Chi opera con prestazione occasionale può impostare *Denominazione del documento* su
**"Ricevuta sanitaria"** in *Impostazioni → Fisco*. Restano comunque applicabili le regole sul bollo.
