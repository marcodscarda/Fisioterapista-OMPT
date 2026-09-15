# Fisioterapista-OMPT

Repository di uno studio di fisioterapia specializzato in terapia manuale (OMPT), a Palermo.

## Contenuto

### [`gestionale/`](gestionale/) — gestionale dello studio

Applicazione locale per la gestione dei pazienti:

- **cartella clinica** strutturata secondo il ragionamento clinico OMPT/IFOMPT — esame soggettivo con
  body chart, bandiere rosse e screening cervicale, ipotesi, esame fisico, diagnosi, asterischi,
  piano di trattamento, diario sedute in formato SOAP;
- **questionari PROM** (NPRS, PSFS, NDI, ODI, QuickDASH, LEFS, SPADI, TSK-11, PCS, FABQ, GROC) con
  calcolo del punteggio e confronto rispetto all'MCID;
- **fatturazione cartacea** per pazienti privati, con numerazione progressiva, esenzione IVA
  art. 10 n. 18, imposta di bollo e stampa in più copie;
- **registro incassi** con crediti aperti, riepiloghi mensili ed esportazione CSV;
- **modulistica** privacy e consensi informati, precompilata e pronta da stampare.

Funziona offline: i dati restano nel browser, nessuna informazione viene trasmessa.

```bash
cd gestionale
npm start        # http://127.0.0.1:4321
```

Documentazione: [uso e struttura](gestionale/README.md) ·
[cartella OMPT](gestionale/docs/cartella-ompt.md) ·
[fatturazione](gestionale/docs/fatturazione.md) ·
[privacy e GDPR](gestionale/docs/privacy-gdpr.md).

### Sito vetrina

Sito statico (HTML + CSS) responsive e ottimizzato per la SEO, pubblicabile con GitHub Pages.
Non ancora presente in questo repository.

> Il gestionale contiene dati sanitari e va tenuto in locale: non va pubblicato insieme al sito.
