#!/usr/bin/env node
/**
 * Server statico minimale (zero dipendenze) per avviare il gestionale in locale.
 *
 * Uso:  node server.js [porta] [--no-open] [--rete] [--codice=xxxx]
 *
 * Senza --rete l'ascolto e' limitato a 127.0.0.1: i dati clinici non sono
 * raggiungibili dagli altri dispositivi della rete.
 * Con --rete il gestionale diventa accessibile da telefono o tablet sulla
 * stessa rete Wi-Fi, protetto da un codice di accesso generato a ogni avvio.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));

/* Versione dichiarata in package.json. Per uso interno resta nella forma
   semver completa; all'utente si mostra la coppia "maiuscola.minore", la
   stessa che compare nella barra laterale (app/js/versione.js). */
const VERSIONE = JSON.parse(
  await readFile(join(ROOT, 'package.json'), 'utf8')
).version || '0.0.0';
const VERSIONE_BREVE = VERSIONE.split('.').slice(0, 2).join('.');
const argomenti = process.argv.slice(2);
const APRI_BROWSER = !argomenti.includes('--no-open');
const PORTA_INIZIALE = Number(argomenti.find(a => /^\d+$/.test(a)) || process.env.PORT || 4321);
// Quante porte provare in successione se quella scelta e' gia' occupata.
const MAX_PORTE_PROVATE = 12;

/* Accesso dalla rete locale: va chiesto esplicitamente, perche' espone il
   gestionale agli altri dispositivi collegati alla stessa rete. */
const IN_RETE = argomenti.includes('--rete') || argomenti.includes('--lan');
const INDIRIZZO = IN_RETE ? '0.0.0.0' : '127.0.0.1';
const codiceRichiesto = argomenti.find(a => a.startsWith('--codice='))?.split('=')[1];
// Alfabeto senza caratteri confondibili (0/O, 1/I/l): il codice si digita su un telefono.
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';
const CODICE = IN_RETE ? (codiceRichiesto || generaCodice(8)) : '';

function generaCodice(n) {
  const b = randomBytes(n);
  return Array.from(b, x => ALFABETO[x % ALFABETO.length]).join('');
}

/* Difesa elementare contro i tentativi a forza bruta sul codice:
   dieci codici sbagliati bloccano l'indirizzo per dieci minuti. */
const MAX_CODICI_SBAGLIATI = 10;
const FINESTRA_BLOCCO = 10 * 60_000;
const tentativi = new Map();
function troppiTentativi(ip) {
  const t = tentativi.get(ip);
  if (!t) return false;
  if (Date.now() - t.ultimo > FINESTRA_BLOCCO) { tentativi.delete(ip); return false; }
  return t.conteggio >= MAX_CODICI_SBAGLIATI;
}
function segnaFallimento(ip) {
  const t = tentativi.get(ip) || { conteggio: 0, ultimo: 0 };
  t.conteggio++;
  t.ultimo = Date.now();
  tentativi.set(ip, t);
}

/** Il codice e' corretto? Arriva come cookie oppure, la prima volta, come ?k= */
function autorizzato(req, url) {
  if (!IN_RETE) return true;
  const daUrl = url.searchParams.get('k');
  if (daUrl && daUrl === CODICE) return true;
  const cookie = /(?:^|;\s*)ompt_k=([^;]+)/.exec(req.headers.cookie || '');
  return !!cookie && cookie[1] === CODICE;
}

/** Indirizzi IPv4 dello studio, per digitarli sul telefono. */
function indirizziLocali() {
  return Object.values(networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal)
    .map(i => i.address);
}

const TIPI = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8'
};

const server = createServer(async (req, res) => {
  try {
    // Le barre iniziali vanno collassate prima di costruire l'URL: un target
    // come "//" fa fallire il parsing e "//host/percorso" verrebbe letto come
    // URL protocol-relative, con il pathname preso dalla stringa della richiesta.
    const target = (req.url || '/').replace(/^\/+/, '/');
    const url = new URL(target, 'http://localhost');

    if (IN_RETE) {
      const ip = req.socket.remoteAddress || '?';
      if (troppiTentativi(ip)) {
        res.writeHead(429, { 'Content-Type': 'text/html; charset=utf-8' })
          .end(paginaCodice('Troppi tentativi. Riprova fra dieci minuti.'));
        return;
      }
      if (!autorizzato(req, url)) {
        if (url.searchParams.get('k')) segnaFallimento(ip);
        res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' })
          .end(paginaCodice(url.searchParams.get('k') ? 'Codice errato.' : ''));
        return;
      }
      // Codice giusto nell'indirizzo: si memorizza e si ripulisce l'URL.
      if (url.searchParams.get('k') === CODICE) {
        tentativi.delete(ip);
        res.writeHead(302, {
          'Set-Cookie': `ompt_k=${CODICE}; Path=/; Max-Age=2592000; SameSite=Lax`,
          Location: url.pathname
        }).end();
        return;
      }
    }

    // Firma dell'applicazione: serve a un secondo avvio per capire che la
    // porta e' occupata dal gestionale stesso e non da un altro programma.
    if (url.pathname === '/__gestionale') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        .end(JSON.stringify({ app: 'gestionale-ompt', versione: VERSIONE }));
      return;
    }

    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filePath = join(ROOT, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Accesso negato');
      return;
    }
    const info = await stat(filePath);
    if (info.isDirectory()) {
      res.writeHead(302, { Location: pathname + '/' }).end();
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': TIPI[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    }).end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      .end('<h1>404</h1><p>Risorsa non trovata.</p>');
  }
});

/** Pagina mostrata a chi arriva senza il codice di accesso. */
function paginaCodice(errore) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Gestionale OMPT</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f4f6f8;
color:#16212b;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:20px}
.c{background:#fff;padding:28px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.08);max-width:360px;width:100%}
h1{font-size:1.1rem;margin:0 0 6px}p{color:#5b6b7b;font-size:.9rem;line-height:1.5}
input{font:inherit;width:100%;padding:10px;border:1px solid #c3ccd7;border-radius:7px;margin:10px 0;box-sizing:border-box}
button{font:inherit;font-weight:600;width:100%;padding:10px;border:0;border-radius:7px;background:#0f6f6a;color:#fff;cursor:pointer}
.e{color:#b3261e;font-size:.85rem}</style></head><body><div class="c">
<h1>Gestionale OMPT</h1>
<p>Inserisci il codice di accesso mostrato nella finestra del gestionale sul computer.</p>
${errore ? `<p class="e">${errore}</p>` : ''}
<form method="GET" action="/"><input name="k" autofocus autocapitalize="off" autocomplete="off"
spellcheck="false" placeholder="codice di accesso"><button type="submit">Entra</button></form>
</div></body></html>`;
}

/** Apre il browser predefinito del sistema sull'indirizzo indicato. */
function apriBrowser(indirizzo) {
  const [comando, argomentiApertura] = process.platform === 'darwin'
    ? ['open', [indirizzo]]
    : process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', indirizzo]]
      : ['xdg-open', [indirizzo]];
  try {
    const figlio = spawn(comando, argomentiApertura, { stdio: 'ignore', detached: true });
    // Il fallimento di spawn arriva come evento asincrono: senza questo listener
    // un sistema privo del comando di apertura farebbe terminare il server
    // subito dopo l'avvio con un 'error' non gestito.
    figlio.on('error', () => {
      console.log('  (non sono riuscito ad aprire il browser da solo: apri tu l’indirizzo qui sopra)\n');
    });
    figlio.unref();
  } catch {
    // Nessun browser apribile automaticamente: l'indirizzo resta stampato a schermo.
  }
}

// Registrato una sola volta: passare il callback a ogni listen() lascerebbe
// in coda i callback dei tentativi falliti, che poi verrebbero eseguiti tutti
// insieme al primo bind riuscito.
server.on('listening', () => {
  const porta = server.address().port;
  const indirizzo = `http://127.0.0.1:${porta}/`;
  console.log('\n  ┌─────────────────────────────────────────────┐');
  console.log('  │' + `  Gestionale OMPT ${VERSIONE_BREVE} avviato`.padEnd(45) + '│');
  console.log('  └─────────────────────────────────────────────┘\n');
  console.log(`  Indirizzo:  ${indirizzo}\n`);
  if (porta !== PORTA_INIZIALE) console.log(`  (la porta ${PORTA_INIZIALE} era gia' occupata)\n`);

  if (IN_RETE) {
    console.log('  DA TELEFONO O TABLET, sulla stessa rete Wi-Fi:\n');
    for (const ip of indirizziLocali()) console.log(`     http://${ip}:${porta}/?k=${CODICE}`);
    console.log(`\n  Codice di accesso:  ${CODICE}\n`);
    console.log('  Attenzione: il gestionale e\' ora raggiungibile dagli altri dispositivi');
    console.log('  collegati a questa rete. Usalo solo su una rete di cui ti fidi e chiudi');
    console.log('  questa finestra quando hai finito. Il collegamento non e\' cifrato.\n');
  }

  console.log('  Lascia aperta questa finestra mentre usi il gestionale.');
  console.log('  Per chiudere: premi Ctrl+C oppure chiudi la finestra.\n');
  if (APRI_BROWSER) apriBrowser(indirizzo);
});

/**
 * La porta e' occupata dal gestionale stesso?
 * Distinguere i due casi e' importante: ogni porta e' un'origine diversa per
 * il browser, quindi far ripartire una seconda copia su un'altra porta
 * aprirebbe un archivio vuoto, con l'aria di aver perso tutti i dati.
 */
async function gestionaleGiaAvviato(porta) {
  try {
    const risposta = await fetch(`http://127.0.0.1:${porta}/__gestionale`, {
      signal: AbortSignal.timeout(1500)
    });
    if (!risposta.ok) return false;
    const dati = await risposta.json();
    return dati?.app === 'gestionale-ompt';
  } catch {
    return false;   // porta occupata da qualcos'altro, o nessuna risposta utile
  }
}

/**
 * Avvio. Se il gestionale e' gia' in funzione si apre semplicemente la finestra
 * del browser su quello: il secondo doppio clic diventa immediato.
 * Se invece la porta e' di un altro programma si prova la successiva.
 */
async function avvia(porta, tentativo = 0) {
  if (await gestionaleGiaAvviato(porta)) {
    const indirizzo = `http://127.0.0.1:${porta}/`;
    console.log('\n  Il gestionale era gia\' avviato: apro la finestra su ' + indirizzo + '\n');
    if (APRI_BROWSER) apriBrowser(indirizzo);
    // Un istante per lasciar partire il browser prima di chiudere il processo.
    setTimeout(() => process.exit(0), 800);
    return;
  }
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && tentativo < MAX_PORTE_PROVATE) {
      avvia(porta + 1, tentativo + 1);
      return;
    }
    console.error('\n  Impossibile avviare il server: ' + err.message + '\n');
    process.exit(1);
  });
  server.listen(porta, INDIRIZZO);
}

avvia(PORTA_INIZIALE);
