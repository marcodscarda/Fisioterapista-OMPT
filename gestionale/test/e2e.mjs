/* ============================================================
   Test end-to-end dell'interfaccia.
   Percorre il flusso completo: paziente -> episodio -> cartella
   -> seduta -> PROM -> fattura -> incasso -> backup -> stampa.

   Richiede Playwright (non incluso tra le dipendenze) e il server
   gia' avviato:

     npm start                       # in un terminale
     npm i -D playwright             # una tantum
     node test/e2e.mjs               # in un altro terminale
   ============================================================ */
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4321/';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack||'').split('\n').slice(0,4).join('\n')));

const step = async (nome, fn) => {
  try { await fn(); console.log('ok   ' + nome); }
  catch (e) { console.log('FAIL ' + nome + ': ' + e.message); errors.push('STEP ' + nome + ': ' + e.message); }
};

await page.goto(BASE, { waitUntil: 'networkidle' });

await step('cruscotto caricato', async () => {
  await page.waitForSelector('.stat, .card h2', { timeout: 5000 });
  const t = await page.textContent('#view');
  if (!/Benvenuto|Pazienti attivi/.test(t)) throw new Error('contenuto inatteso: ' + t.slice(0,120));
});

await step('navigazione pazienti', async () => {
  await page.click('a[data-nav="/pazienti"]');
  await page.waitForSelector('button:has-text("Nuovo paziente")', { timeout: 5000 });
});

await step('creazione paziente', async () => {
  await page.click('button:has-text("Nuovo paziente")');
  await page.waitForSelector('.modal');
  const campi = page.locator('.modal input[type=text]');
  await page.locator('.modal .field:has(label:text-is("Cognome *")) input').fill('rossi');
  await page.locator('.modal .field:has(label:text-is("Nome *")) input').fill('mario');
  await page.locator('.modal .field:has(label:text-is("Codice fiscale")) input').fill('RSSMRA80A01H501U');
  await page.locator('.modal .field:has(label:text-is("Codice fiscale")) input').blur();
  await page.waitForTimeout(150);
  const nascita = await page.locator('.modal .field:has(label:text-is("Data di nascita")) input').inputValue();
  if (nascita !== '1980-01-01') throw new Error('data di nascita non precompilata dal CF: ' + nascita);
  await page.click('.modal-foot button:has-text("Salva")');
  await page.waitForSelector('h1:has-text("Rossi Mario")', { timeout: 5000 });
});

await step('creazione episodio', async () => {
  await page.click('button:has-text("Nuovo episodio")');
  await page.waitForSelector('.modal');
  await page.fill('.modal input[type=text]', 'Lombalgia acuta destra');
  await page.selectOption('.modal select', 'Lombare');
  await page.click('.modal-foot button:has-text("Crea")');
  await page.waitForSelector('h1:has-text("Lombalgia acuta destra")', { timeout: 5000 });
});

await step('compilazione esame soggettivo', async () => {
  await page.click('details.sec:has-text("Body chart") > summary');
  await page.waitForSelector('.bodychart svg');
  const box = await page.locator('.bodychart-canvas svg').first().boundingBox();
  await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.45);
  await page.waitForSelector('.bodychart-side .card', { timeout: 3000 });
  // NPRS
  await page.locator('.field:has(label:text-is("NPRS attuale")) input[type=range]').fill('7');
  const v = await page.locator('.field:has(label:text-is("NPRS attuale")) .scale-val').textContent();
  if (v !== '7') throw new Error('scala NPRS non aggiornata: ' + v);
});

await step('selezione multipla a pastiglie (accumula, non sostituisce)', async () => {
  // Regressione: lo stato veniva letto da una variabile catturata al primo
  // disegno, quindi le pastiglie non si evidenziavano e ogni clic sostituiva
  // la scelta precedente invece di aggiungersi.
  await page.click('.tabs button:has-text("Esame soggettivo")').catch(() => {});
  await page.click('details.sec:has-text("Body chart") > summary').catch(() => {});
  const campo = page.locator('.field:has(label:text-is("Qualità del sintomo"))');
  for (const o of ['Profondo', 'Urente/bruciante', 'Trafittivo']) {
    await campo.locator(`.chip-opt:text-is("${o}")`).click();
    await page.waitForTimeout(120);
  }
  const attive = await campo.locator('.chip-opt.on').allTextContents();
  if (attive.length !== 3) throw new Error('attese 3 pastiglie attive senza ricaricare, trovate: ' + JSON.stringify(attive));

  // Un secondo clic deseleziona soltanto quella voce.
  await campo.locator('.chip-opt:text-is("Trafittivo")').click();
  await page.waitForTimeout(120);
  const dopo = await campo.locator('.chip-opt.on').allTextContents();
  if (dopo.length !== 2 || dopo.includes('Trafittivo')) throw new Error('deselezione errata: ' + JSON.stringify(dopo));

  // E il dato salvato deve coincidere con quanto mostrato.
  await page.waitForTimeout(900);
  const salvate = await page.evaluate(async () => {
    const db = await import('/app/js/db.js');
    const ep = (await db.all('episodi'))[0];
    return ep.cartella?.soggettivo?.bodychart?.tipoDolore || [];
  });
  if (salvate.length !== 2) throw new Error('in archivio attese 2 voci, trovate: ' + JSON.stringify(salvate));
});

await step('bandiere rosse evidenziate', async () => {
  await page.click('.tabs button:has-text("Esame soggettivo")').catch(()=>{});
  await page.click('details.sec:has-text("Domande speciali") > summary');
  await page.click('.chip-opt:has-text("Storia di neoplasia")');
  await page.waitForTimeout(900); // attende il salvataggio automatico
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.alert.danger', { timeout: 5000 });
  const t = await page.textContent('.alert.danger');
  if (!/neoplasia/i.test(t)) throw new Error('banner allerte non mostra il reperto: ' + t);
});

await step('asterischi e seduta SOAP', async () => {
  await page.click('.tabs button:has-text("Diagnosi")');
  await page.click('details.sec:has-text("Asterischi") > summary');
  await page.click('button:has-text("+ Aggiungi riga")');
  await page.locator('.sec-body table.tbl tbody tr td').first().locator('input').fill('Flessione lombare');
  await page.locator('.sec-body table.tbl tbody tr td').first().locator('input').blur();
  await page.waitForTimeout(900);

  await page.click('.tabs button:has-text("Sedute")');
  await page.click('button:has-text("+ Nuova seduta")');
  await page.waitForSelector('.modal');
  const t = await page.textContent('.modal-body');
  if (!/Flessione lombare/.test(t)) throw new Error('asterisco non riproposto nella rivalutazione della seduta');
  await page.locator('.modal .field:has(label:text-is("NPRS attuale")) input[type=range]').fill('4');
  await page.click('.modal-head button[aria-label="Chiudi"]');
  await page.waitForTimeout(800);
  await page.waitForSelector('table.tbl tbody tr:has-text("4/10")', { timeout: 5000 });
});

await step('questionario PROM con punteggio', async () => {
  await page.click('.tabs button:has-text("Questionari")');
  await page.click('button:has-text("+ Compila questionario")');
  await page.waitForSelector('.modal');
  await page.click('.modal button:has-text("ODI")');
  await page.waitForSelector('.modal:has-text("Oswestry")');
  const selects = page.locator('.modal-body select');
  const n = await selects.count();
  for (let i = 0; i < n; i++) await selects.nth(i).selectOption('2').catch(()=>{});
  const res = await page.textContent('.modal-body .alert.info');
  if (!/40%/.test(res)) throw new Error('punteggio ODI atteso 40%, ottenuto: ' + res);
  await page.click('.modal-foot button:has-text("Salva")');
  await page.waitForSelector('.card:has-text("Oswestry")', { timeout: 5000 });
});

await step('supporto al ragionamento', async () => {
  await page.click('.tabs button:has-text("Supporto")');
  await page.waitForSelector('.alert.info:has-text("non una diagnosi")', { timeout: 5000 });
  const t = await page.textContent('#view');
  for (const atteso of ['Meccanismo del dolore', 'Ipotesi in ordine di sostegno', 'Come condurre l’esame fisico']) {
    if (!t.includes(atteso)) throw new Error('manca la sezione: ' + atteso);
  }
  // Il caso di prova ha una bandiera rossa (storia di neoplasia): deve emergere
  // almeno un elemento da considerare prima di procedere.
  const ipotesi = await page.locator('.card:has(h3:text-is("Ipotesi in ordine di sostegno")) details.sec').count();
  const allerte = await page.locator('.alert.danger, .alert.warn').count();
  if (ipotesi === 0 && allerte === 0) throw new Error('né ipotesi né allerte prodotte');

  // Il pulsante deve scrivere davvero in cartella.
  if (ipotesi > 0) {
    await page.click('button:has-text("Usa come ipotesi principale")');
    await page.waitForTimeout(600);
    const scritta = await page.evaluate(async () => {
      const db = await import('/app/js/db.js');
      const ep = (await db.all('episodi'))[0];
      return ep.cartella?.ipotesi?.ragionamentoPre?.ipotesiPrincipale || '';
    });
    if (!scritta.includes('Elementi a sostegno')) throw new Error('ipotesi non inserita in cartella: ' + scritta.slice(0, 80));
  }
});

await step('impostazioni studio', async () => {
  await page.click('a[data-nav="/impostazioni"]');
  await page.waitForSelector('h2:has-text("Dati riportati")');
  await page.locator('.field:has(label:text-is("Cognome")) input').fill('Bianchi');
  await page.locator('.field:has(label:text-is("Nome")) input').fill('Laura');
  await page.locator('.field:has(label:text-is("Indirizzo dello studio")) input').fill('Via Roma 1');
  await page.locator('.field:has(label:text-is("Città")) input').fill('Palermo');
  await page.click('button:has-text("Salva impostazioni")');
  await page.waitForTimeout(400);
  await page.click('.tabs button:has-text("Fisco")');
  await page.waitForSelector('h2:has-text("Dati fiscali")');
  await page.locator('.field:has(label:text-is("Partita IVA")) input').fill('00743110157');
  await page.click('button:has-text("Salva impostazioni")');
  await page.waitForTimeout(400);
  const err = await page.locator('.toast.err').count();
  if (err) throw new Error('errore nel salvataggio impostazioni: ' + await page.textContent('.toast.err'));
});

await step('partita IVA non valida rifiutata', async () => {
  await page.locator('.field:has(label:text-is("Partita IVA")) input').fill('00743110158');
  await page.click('button:has-text("Salva impostazioni")');
  await page.waitForSelector('.toast.err', { timeout: 3000 });
  await page.locator('.field:has(label:text-is("Partita IVA")) input').fill('00743110157');
  await page.click('button:has-text("Salva impostazioni")');
  await page.waitForTimeout(400);
});

await step('creazione fattura da sedute', async () => {
  await page.click('a[data-nav="/fatture"]');
  await page.waitForSelector('button:has-text("Nuova fattura")');
  await page.click('button:has-text("+ Nuova fattura")');
  await page.waitForSelector('.modal select');
  const val = await page.locator('.modal select option').nth(1).getAttribute('value');
  await page.selectOption('.modal select', val);
  await page.click('.modal-foot button:has-text("Continua")');
  await page.waitForSelector('h1:has-text("(bozza)")', { timeout: 5000 });
  await page.click('button:has-text("+ Sedute non fatturate")');
  await page.waitForSelector('.modal');
  await page.click('.modal-foot button:has-text("Aggiungi")');
  await page.waitForTimeout(600);
  const t = await page.textContent('.card:has(h3:text-is("Totali"))');
  if (!/Imponibile/.test(t)) throw new Error('pannello totali non popolato');
});

await step('bollo applicato oltre soglia', async () => {
  const righe = page.locator('.card:has(h3:text-is("Prestazioni")) table.tbl tbody tr');
  await righe.first().locator('input[type=number]').nth(1).fill('100');
  await righe.first().locator('input[type=number]').nth(1).dispatchEvent('input');
  await page.waitForTimeout(300);
  const t = await page.textContent('.card:has(h3:text-is("Totali"))');
  if (!/Bollo addebitato/.test(t)) throw new Error('bollo non applicato sopra soglia: ' + t.replace(/\s+/g,' '));
  if (!/102,00/.test(t)) throw new Error('totale atteso 102,00: ' + t.replace(/\s+/g,' '));
});

await step('emissione con numerazione progressiva', async () => {
  await page.click('button:has-text("Emetti e numera")');
  await page.waitForSelector('.modal');
  await page.click('.modal-foot button:has-text("Emetti")');
  await page.waitForSelector('h1:has-text("1/")', { timeout: 5000 });
  const badge = await page.textContent('.card-head .badge');
  if (!/emessa/.test(badge)) throw new Error('stato non aggiornato: ' + badge);
});

await step('il numero del documento è modificabile', async () => {
  await page.click('button:has-text("✎ numero")');
  await page.waitForSelector('.modal');
  await page.fill('.modal input[type=number]', '7');
  await page.click('.modal-foot button:has-text("Salva numero")');
  await page.waitForSelector('h1:has-text("7/")', { timeout: 5000 });
  const salvato = await page.evaluate(async () => {
    const db = await import('/app/js/db.js');
    return (await db.all('fatture')).find(f => f.numero)?.numero;
  });
  if (salvato !== 7) throw new Error('numero non salvato: ' + salvato);

  // Il numero successivo deve tenere conto della rinumerazione, senza duplicati.
  const prossimo = await page.evaluate(async () => {
    const db = await import('/app/js/db.js');
    return db.anteprimaNumeroFattura(new Date().getFullYear());
  });
  if (prossimo !== 8) throw new Error('il contatore non si è riallineato: ' + prossimo);
});

await step('anteprima di stampa contiene i riferimenti di legge', async () => {
  const t = await page.textContent('.print-preview');
  for (const atteso of ['art. 10, n. 18', 'Bianchi', 'Rossi Mario', '190/2014', 'D.P.R. 642/1972']) {
    if (!t.includes(atteso)) throw new Error('manca in fattura: ' + atteso);
  }
});

await step('registrazione incasso e stato', async () => {
  await page.click('button:has-text("Registra incasso")');
  await page.waitForSelector('.modal');
  await page.click('.modal-foot button:has-text("Registra")');
  await page.waitForTimeout(700);
  const t = await page.textContent('.card:has(h3:text-is("Totali"))');
  if (!/Incassata/.test(t)) throw new Error('stato non passato a incassata: ' + t.replace(/\s+/g,' '));
});

await step('registro incassi aggiornato', async () => {
  await page.click('a[data-nav="/incassi"]');
  await page.waitForSelector('.stat-value');
  const t = await page.textContent('#view');
  if (!/102,00/.test(t)) throw new Error('incasso non presente nel registro');
  if (!/Tutte le fatture emesse risultano incassate/.test(t)) throw new Error('crediti aperti non azzerati');
});

await step('agenda: nuovo appuntamento nella settimana', async () => {
  await page.click('a[data-nav="/agenda"]');
  await page.waitForSelector('.settimana', { timeout: 5000 });
  await page.click('button:has-text("+ Nuovo appuntamento")');
  await page.waitForSelector('.modal');
  const val = await page.locator('.modal .field:has(label:text-is("Paziente *")) option').nth(1).getAttribute('value');
  await page.selectOption('.modal .field:has(label:text-is("Paziente *")) select', val);
  await page.fill('.modal .field:has(label:text-is("Ora")) input', '11:30');
  // L'anteprima deve mostrare che nel calendario esterno finiscono le sole iniziali.
  const anteprima = await page.textContent('.modal .field:has(.hint) .hint').catch(() => '');
  if (anteprima && !/FT — R\.M\.|FT — M\.R\./.test(anteprima)) {
    throw new Error('etichetta calendario non riservata: ' + anteprima);
  }
  await page.click('.modal-foot button:has-text("Salva")');
  await page.waitForTimeout(600);
  const t = await page.textContent('.settimana');
  if (!/11:30/.test(t) || !/Rossi Mario/.test(t)) throw new Error('appuntamento non visibile in agenda: ' + t.replace(/\s+/g, ' ').slice(0, 160));
});

await step('agenda: link a Google Calendar corretto', async () => {
  await page.click('.settimana .appunt');
  await page.waitForSelector('.modal');
  const url = await page.evaluate(async () => {
    const cal = await import('/app/js/calendario.js');
    const db = await import('/app/js/db.js');
    const a = (await db.all('appuntamenti'))[0];
    const p = await db.byId('pazienti', a.pazienteId);
    return cal.linkGoogleCalendar(a, p, await db.getImpostazioni());
  });
  const u = new URL(url);
  if (u.host !== 'calendar.google.com') throw new Error('host errato: ' + u.host);
  if (!/^\d{8}T\d{6}\/\d{8}T\d{6}$/.test(u.searchParams.get('dates') || '')) {
    throw new Error('intervallo malformato: ' + u.searchParams.get('dates'));
  }
  if (/Rossi/.test(u.searchParams.get('text') || '')) throw new Error('il titolo predefinito non deve riportare il cognome');
  await page.click('.modal-head button[aria-label="Chiudi"]');
});

await step('la Home si chiama Home', async () => {
  const voci = await page.locator('#nav a').allTextContents();
  if (!voci.some(v => v.includes('Home'))) throw new Error('voce Home assente: ' + JSON.stringify(voci));
  if (voci.some(v => /Cruscotto/.test(v))) throw new Error('la vecchia voce Cruscotto è ancora presente');
});

await step('backup e ripristino', async () => {
  await page.click('a[data-nav="/impostazioni"]');
  await page.click('.tabs button:has-text("Dati e backup")');
  await page.waitForSelector('h2:has-text("Backup")');
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Scarica backup completo")')
  ]);
  const path = await dl.path();
  const { readFileSync } = await import('node:fs');
  const b = JSON.parse(readFileSync(path, 'utf8'));
  if (b.data.pazienti.length !== 1) throw new Error('backup incompleto: ' + JSON.stringify(Object.keys(b.data)));
  // Il documento è stato rinumerato a 7 nel passaggio precedente: il backup deve rispecchiarlo.
  if (b.data.fatture[0].numero !== 7) throw new Error('numero fattura errato nel backup: ' + b.data.fatture[0].numero);
  if (!b.data.appuntamenti?.length) throw new Error('appuntamenti assenti dal backup');
});

await step('stampa cartella clinica', async () => {
  await page.goto(BASE + '#/pazienti', { waitUntil: 'networkidle' });
  await page.click('table.tbl tbody tr');
  await page.waitForSelector('h1:has-text("Rossi Mario")');
  await page.click('table.tbl tbody tr');
  await page.waitForSelector('.tabs button:has-text("Esame soggettivo")');
  await page.evaluate(() => { window.print = () => { window.__stampato = document.getElementById('printRoot').textContent; }; });
  await page.click('button:has-text("Stampa cartella")');
  await page.waitForTimeout(400);
  const t = await page.evaluate(() => window.__stampato || '');
  for (const atteso of ['Cartella clinica fisioterapica', 'Rossi Mario', 'Storia di neoplasia', 'Oswestry', 'art. 9 Reg. UE 2016/679']) {
    if (!t.includes(atteso)) throw new Error('manca nella stampa: ' + atteso + ' | estratto: ' + t.slice(0, 200));
  }
});

await step('responsive a 400px', async () => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto(BASE + '#/incassi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) throw new Error('scroll orizzontale di ' + overflow + 'px');
});

await browser.close();
console.log('\n' + (errors.length ? errors.length + ' PROBLEMI:\n' + errors.join('\n---\n') : 'Nessun errore di console e tutti i passaggi superati'));
process.exit(errors.length ? 1 : 0);
