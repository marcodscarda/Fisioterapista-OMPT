# Usare il gestionale dal telefono

I dati vivono nel browser del computer su cui gira il gestionale. Il telefono non ne tiene una copia:
si collega al computer e ne mostra le stesse schermate. Ne discendono due condizioni: **il computer
dev'essere acceso con il gestionale avviato**, e i due dispositivi devono essere sulla **stessa rete
Wi-Fi**.

## Come si fa

Sul computer, avvia il gestionale in modalità rete:

```bash
cd gestionale
npm start -- --rete
```

Chi usa gli avviatori può fare doppio clic come sempre e poi, nella finestra che si apre, nulla
cambia: per la modalità rete serve il comando qui sopra.

Nella finestra compaiono un indirizzo e un codice:

```
  DA TELEFONO O TABLET, sulla stessa rete Wi-Fi:

     http://192.168.1.50:4321/?k=hq7m2xkp

  Codice di accesso:  hq7m2xkp
```

Sul telefono apri il browser e digita quell'indirizzo — con il codice già dentro non ti verrà
chiesto altro. Se preferisci, digita solo `http://192.168.1.50:4321` e inserisci il codice nella
schermata che compare.

Il codice resta valido su quel telefono per trenta giorni, quindi si digita una volta sola.

## Aggiungerlo alla schermata Home

Una volta aperto, conviene salvarlo come applicazione:

- **iPhone/iPad (Safari)**: pulsante Condividi → *Aggiungi a Home*.
- **Android (Chrome)**: menu ⋮ → *Aggiungi a schermata Home* o *Installa app*.

Compare un'icona come quella di una qualsiasi app e il gestionale si apre a schermo intero, senza la
barra degli indirizzi.

## Che cosa sapere prima di usarlo

Attivando `--rete` il gestionale diventa raggiungibile **da tutti i dispositivi collegati a quella
rete**, non solo dal tuo telefono. Il codice di accesso è l'unica barriera, e dopo dieci tentativi
sbagliati l'indirizzo viene bloccato per dieci minuti.

Tre conseguenze pratiche:

1. **Usalo solo su una rete di cui ti fidi**: quella dello studio o di casa. Non su un Wi-Fi
   pubblico o condiviso con estranei.
2. **Il collegamento non è cifrato.** Fra computer e telefono i dati viaggiano in chiaro: chi
   controlla la rete potrebbe leggerli. Per un uso oltre la rete dello studio serve una VPN.
3. **Chiudi la finestra quando hai finito.** Senza `--rete` il gestionale torna a essere
   raggiungibile solo dal computer su cui gira, che è la configurazione predefinita.

Se vuoi cambiare il codice a ogni avvio, basta riavviare: ne viene generato uno nuovo. Per fissarne
uno tuo: `npm start -- --rete --codice=iltuocodice`.

## E se volessi i dati anche offline sul telefono?

Non è la stessa cosa. Il gestionale potrebbe girare autonomamente nel browser del telefono, ma
avrebbe un **archivio separato** da quello del computer: due elenchi di pazienti che divergono al
primo inserimento. Per tenerli allineati servirebbe una sincronizzazione, cioè un server che
custodisce i dati — l'opposto della scelta di fondo di questo gestionale, che tiene tutto in locale.

Finché l'archivio è uno solo, il telefono è una finestra su quello del computer. Per spostare i dati
da un computer a un altro si usa il backup.
