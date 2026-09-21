/* ============================================================
   Backup automatico su disco
   ------------------------------------------------------------
   Il browser, da solo, non puo' scrivere in una cartella senza
   chiedere il permesso ogni volta, e l'unica interfaccia che lo
   permetterebbe non e' disponibile ovunque. Il server locale pero'
   gira sulla stessa macchina: l'applicazione gli manda il backup e
   lui lo salva vicino ai documenti dell'utente.

   Il file non e' cifrato e contiene dati appartenenti a categorie
   particolari: la cartella va trattata come l'archivio cartaceo.
   ============================================================ */
import * as db from './db.js';

const KEY_ULTIMO = 'gestionale-ompt-ultimo-backup-auto';

const leggi = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const scrivi = (k, v) => { try { localStorage.setItem(k, v); } catch { /* non disponibile */ } };

/** Il server locale e' raggiungibile e sa scrivere i backup? */
export async function backupDisponibile() {
  try {
    const risposta = await fetch('api/backup', { signal: AbortSignal.timeout(2500) });
    if (!risposta.ok) return null;
    return await risposta.json();
  } catch {
    // Aperto senza il server (o con un server che non conosce questa rotta).
    return null;
  }
}

/** Salva subito una copia su disco. Restituisce l'esito del server. */
export async function salvaSuDisco() {
  const backup = await db.esportaTutto();
  const risposta = await fetch('api/backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backup)
  });
  const esito = await risposta.json().catch(() => ({}));
  if (!risposta.ok || !esito.ok) throw new Error(esito.errore || 'Salvataggio non riuscito.');
  scrivi(KEY_ULTIMO, String(Date.now()));
  return esito;
}

export const ultimoBackupAutomatico = () => {
  const v = Number(leggi(KEY_ULTIMO));
  return Number.isFinite(v) && v > 0 ? new Date(v) : null;
};

/**
 * Esegue il backup se e' passato abbastanza tempo dall'ultimo.
 * Va chiamato all'avvio: in silenzio, senza disturbare chi sta lavorando.
 * @returns {Promise<object|null>} l'esito, oppure null se non c'era da fare
 */
export async function backupAutomatico(impostazioni) {
  if (impostazioni?.backupAutomatico === false) return null;
  const oreMinime = Number(impostazioni?.backupOgniOre) || 24;
  const ultimo = ultimoBackupAutomatico();
  if (ultimo && (Date.now() - ultimo.getTime()) < oreMinime * 3600000) return null;
  if (!await backupDisponibile()) return null;

  // Un archivio del tutto vuoto non merita un file: si aspetta il primo dato.
  // Basta un record, pero': il primo paziente e' gia' qualcosa da non perdere.
  const conteggi = await db.statistiche();
  const righe = Object.values(conteggi).reduce((s, n) => s + (Number(n) || 0), 0);
  if (righe === 0) return null;

  try { return await salvaSuDisco(); }
  catch { return null; }   // un backup mancato non deve bloccare l'avvio
}
