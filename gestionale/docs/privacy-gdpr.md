# Dati sanitari e GDPR

La cartella clinica contiene **dati relativi alla salute**, che il Regolamento UE 2016/679
classifica tra le *categorie particolari di dati personali* (art. 9). Comportano obblighi più
stringenti dei dati comuni.

## Che cosa fa il gestionale

- **Non trasmette nulla.** Non ci sono chiamate di rete, né analytics, né CDN esterni: tutto il
  codice è servito in locale. L'archivio vive nell'IndexedDB del browser.
- Il server incluso (`server.js`) ascolta **solo su `127.0.0.1`**: non è raggiungibile da altri
  dispositivi della rete.
- Stampa l'**informativa** e i moduli di **consenso** precompilati con i dati dello studio.
- Segnala nella scheda paziente i consensi non ancora acquisiti.
- Riporta su ogni cartella stampata l'avvertenza sulla natura dei dati e la durata di conservazione.

## Che cosa resta a carico tuo

1. **Titolarità del trattamento.** Il titolare sei tu: nomina, informativa e registro dei trattamenti
   (art. 30 GDPR, dovuto quando si trattano dati sanitari anche da parte di piccoli studi) sono tuoi.
2. **Sicurezza del dispositivo** (art. 32). Il gestionale protegge quanto il computer su cui gira:
   - cifratura del disco (BitLocker, FileVault, LUKS);
   - account con password e blocco schermo automatico;
   - nessun profilo browser condiviso con altri.
3. **Backup.** Il file JSON scaricato **non è cifrato**. Va conservato su supporto cifrato o dentro
   un archivio protetto da password; non va lasciato in cartelle sincronizzate in chiaro né inviato
   per e-mail. Tienine almeno una copia fuori sede.
4. **Conservazione.** La documentazione sanitaria va conservata per il periodo previsto (nel
   gestionale l'impostazione predefinita è 10 anni, modificabile). I documenti fiscali seguono i
   termini tributari.
5. **Diritti dell'interessato** (artt. 15-22). Il paziente può chiedere copia della propria cartella:
   si usa *Stampa cartella* o *Esporta*. Per la cancellazione va considerato che l'obbligo legale di
   conservazione prevale sul diritto all'oblio finché il termine non è decorso.
6. **Data breach** (artt. 33-34). Il furto o smarrimento del computer o di un backup non cifrato
   contenente dati sanitari è una violazione da valutare, con notifica al Garante entro 72 ore nei
   casi previsti.
7. **Minori.** Il consenso è prestato da chi esercita la responsabilità genitoriale: è disponibile il
   modulo dedicato.

## Se il gestionale viene pubblicato online

Il codice è pubblicabile senza problemi: non contiene dati. Ma se lo si serve da un sito pubblico
(per esempio GitHub Pages), l'archivio resta comunque **nel browser di chi lo apre** — quindi i dati
non finiscono in rete, ma la pagina sarebbe accessibile a chiunque conosca l'indirizzo, e chi si
sedesse al tuo computer vedrebbe il tuo archivio.

Per un uso clinico reale la raccomandazione è **tenerlo in locale** e avviarlo con `npm start`.
