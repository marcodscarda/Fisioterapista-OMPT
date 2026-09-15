#!/usr/bin/env node
/**
 * Server statico minimale (zero dipendenze) per avviare il gestionale in locale.
 *
 * Uso:  node server.js [porta] [--no-open]
 *
 * L'ascolto e' volutamente limitato a 127.0.0.1: i dati clinici non devono
 * essere raggiungibili dagli altri dispositivi della rete.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const argomenti = process.argv.slice(2);
const APRI_BROWSER = !argomenti.includes('--no-open');
const PORTA_INIZIALE = Number(argomenti.find(a => /^\d+$/.test(a)) || process.env.PORT || 4321);
const MAX_TENTATIVI = 12;

const TIPI = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
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
  console.log('  │  Gestionale OMPT avviato                    │');
  console.log('  └─────────────────────────────────────────────┘\n');
  console.log(`  Indirizzo:  ${indirizzo}\n`);
  if (porta !== PORTA_INIZIALE) console.log(`  (la porta ${PORTA_INIZIALE} era gia' occupata)\n`);
  console.log('  Lascia aperta questa finestra mentre usi il gestionale.');
  console.log('  Per chiudere: premi Ctrl+C oppure chiudi la finestra.\n');
  if (APRI_BROWSER) apriBrowser(indirizzo);
});

/** Se la porta e' occupata prova con la successiva: evita di dover chiudere altre finestre. */
function avvia(porta, tentativo = 0) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && tentativo < MAX_TENTATIVI) {
      avvia(porta + 1, tentativo + 1);
      return;
    }
    console.error('\n  Impossibile avviare il server: ' + err.message + '\n');
    process.exit(1);
  });
  server.listen(porta, '127.0.0.1');
}

avvia(PORTA_INIZIALE);
