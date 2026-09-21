/* ============================================================
   Avvio dell'applicazione e definizione delle rotte
   ============================================================ */
import { h, clear, qs, qsa, toast, downloadFile } from './util.js';
import * as db from './db.js';
import * as S from './state.js';
import { vistaDashboard } from './views/dashboard.js';
import { vistaPazienti } from './views/pazienti.js';
import { vistaPaziente } from './views/paziente.js';
import { vistaCartella } from './views/cartella.js';
import { vistaFatture, vistaFattura } from './views/fatture.js';
import { vistaIncassi } from './views/incassi.js';
import { vistaAgenda } from './views/agenda.js';
import { vistaImpostazioni } from './views/impostazioni.js';
import { vistaImporta } from './views/importa.js';
import { vistaEsercizi } from './views/esercizi.js';
import { VERSIONE } from './versione.js';

const vista = () => document.getElementById('view');

/* ---------- Rotte ---------- */
S.rotta('/', async (r) => { briciole('Home'); await vistaDashboard(vista()); });
S.rotta('/pazienti', async () => { briciole('Pazienti'); await vistaPazienti(vista()); });
S.rotta('/paziente/:id', async ({ params }) => { briciole('Pazienti', 'Scheda'); await vistaPaziente(vista(), params); });
S.rotta('/paziente/:id/:tab', async ({ params }) => { briciole('Pazienti', 'Scheda'); await vistaPaziente(vista(), params); });
S.rotta('/cartella/:id', async ({ params }) => { briciole('Cartella clinica'); await vistaCartella(vista(), params); });
S.rotta('/cartella/:id/:tab', async ({ params }) => { briciole('Cartella clinica'); await vistaCartella(vista(), params); });
S.rotta('/agenda', async () => { briciole('Agenda'); await vistaAgenda(vista()); });
S.rotta('/fatture', async () => { briciole('Fatture'); await vistaFatture(vista()); });
S.rotta('/fattura/nuova/:pazienteId', async ({ params }) => {
  briciole('Fatture', 'Nuovo documento');
  await vistaFattura(vista(), { id: 'nuova', pazienteId: params.pazienteId });
});
S.rotta('/fattura/:id', async ({ params }) => { briciole('Fatture', 'Documento'); await vistaFattura(vista(), params); });
S.rotta('/incassi', async () => { briciole('Incassi'); await vistaIncassi(vista()); });
S.rotta('/esercizi', async () => { briciole('Esercizi'); await vistaEsercizi(vista(), {}); });
S.rotta('/esercizi/:id', async ({ params }) => { briciole('Esercizi', 'Scheda'); await vistaEsercizi(vista(), params); });
S.rotta('/importa', async () => { briciole('Impostazioni', 'Importa dati'); await vistaImporta(vista()); });
S.rotta('/impostazioni', async () => { briciole('Impostazioni'); await vistaImpostazioni(vista(), {}); });
S.rotta('/impostazioni/:tab', async ({ params }) => { briciole('Impostazioni'); await vistaImpostazioni(vista(), params); });

function briciole(...parti) {
  const c = document.getElementById('crumbs');
  clear(c);
  parti.forEach((p, i) => {
    if (i) c.appendChild(document.createTextNode(' / '));
    c.appendChild(i === parti.length - 1 ? h('strong', p) : document.createTextNode(p));
  });
}

/* ---------- Render ---------- */
async function render(match, path) {
  const root = vista();
  if (!match) {
    clear(root).appendChild(h('div', { class: 'card' },
      h('h2', 'Pagina non trovata'),
      h('p', 'L’indirizzo ' + path + ' non corrisponde ad alcuna sezione.'),
      h('a', { class: 'btn btn-primary', href: '#/' }, 'Torna alla Home')));
    return;
  }
  attivaNav(path);
  clear(root).appendChild(h('p', { class: 'faint' }, 'Caricamento…'));
  try {
    await match.handler(match);
  } catch (err) {
    console.error(err);
    clear(root).appendChild(h('div', { class: 'alert danger' },
      h('strong', 'Si è verificato un errore. '), err.message));
  }
  root.scrollIntoView({ block: 'start' });
  qs('#sidebar')?.classList.remove('open');
}

function attivaNav(path) {
  const radice = '/' + (path.split('/')[1] || '');
  const alias = { '/paziente': '/pazienti', '/cartella': '/pazienti', '/fattura': '/fatture', '/importa': '/impostazioni' };
  const attivo = alias[radice] || radice;
  qsa('#nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === attivo));
}

/* ---------- Avvio ---------- */
async function avvia() {
  S.applicaTema();
  try {
    await db.openDB();
  } catch (err) {
    clear(vista()).appendChild(h('div', { class: 'alert danger' },
      h('strong', 'Impossibile aprire l’archivio locale. '),
      err.message,
      h('p', { class: 'mb0 small' }, 'Verifica di non essere in navigazione privata e che il browser possa salvare i dati dei siti.')));
    return;
  }

  const imp = await S.imp();
  const nome = [imp.nome, imp.cognome].filter(Boolean).join(' ');
  document.getElementById('brandStudio').textContent = nome || 'Gestionale';
  document.getElementById('brandVersione').textContent = 'versione ' + VERSIONE;
  if (nome) document.title = `Gestionale OMPT — ${nome}`;

  document.getElementById('btnMenu')?.addEventListener('click', () => {
    qs('#sidebar')?.classList.toggle('open');
  });
  document.getElementById('btnTheme')?.addEventListener('click', () => {
    const t = S.ruotaTema();
    toast('Tema: ' + ({ auto: 'automatico', light: 'chiaro', dark: 'scuro' })[t]);
  });
  document.getElementById('btnBackup')?.addEventListener('click', async () => {
    const backup = await db.esportaTutto();
    downloadFile(db.nomeFileBackup(), JSON.stringify(backup, null, 2));
    toast('Backup scaricato.', 'ok');
  });

  promemoriaBackup();
  S.avviaRouter(render);
}

/** Ricorda di eseguire un backup se l'ultimo risale a piu' di una settimana fa. */
function promemoriaBackup() {
  const KEY = 'gestionale-ompt-ultimo-backup';
  try {
    const ultimo = localStorage.getItem(KEY);
    const settimana = 7 * 86400000;
    if (!ultimo || Date.now() - Number(ultimo) > settimana) {
      setTimeout(() => toast('Promemoria: scarica un backup dei dati (pulsante in basso a sinistra).'), 1500);
    }
    document.getElementById('btnBackup')?.addEventListener('click', () => {
      localStorage.setItem(KEY, String(Date.now()));
    });
  } catch { /* localStorage non disponibile: nessun promemoria */ }
}

avvia();
