/* ============================================================
   Caricamento e ridimensionamento delle immagini (logo)
   ------------------------------------------------------------
   Le immagini finiscono in IndexedDB insieme alle impostazioni:
   vanno ridotte prima di salvarle, altrimenti un logo da fotocamera
   gonfierebbe l'archivio e ogni backup.
   ============================================================ */

/** Larghezza massima del logo memorizzato: sufficiente per la stampa a 300 dpi su ~5 cm. */
const LARGHEZZA_MAX = 600;
const ALTEZZA_MAX = 400;
const PESO_MAX_KB = 300;

/**
 * Legge un file immagine e restituisce un data URL ridimensionato.
 * @returns {Promise<{dataUrl:string, larghezza:number, altezza:number, kb:number}>}
 */
export function caricaImmagine(file) {
  return new Promise((risolvi, rifiuta) => {
    if (!file) { rifiuta(new Error('Nessun file selezionato.')); return; }
    if (!/^image\//.test(file.type)) {
      rifiuta(new Error('Il file non è un’immagine. Usa PNG o JPG.'));
      return;
    }
    const lettore = new FileReader();
    lettore.onerror = () => rifiuta(new Error('Impossibile leggere il file.'));
    lettore.onload = () => {
      const img = new Image();
      img.onerror = () => rifiuta(new Error('Immagine non valida o danneggiata.'));
      img.onload = () => {
        try {
          const scala = Math.min(1, LARGHEZZA_MAX / img.width, ALTEZZA_MAX / img.height);
          const larghezza = Math.max(1, Math.round(img.width * scala));
          const altezza = Math.max(1, Math.round(img.height * scala));
          const tela = document.createElement('canvas');
          tela.width = larghezza;
          tela.height = altezza;
          const ctx = tela.getContext('2d');
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, larghezza, altezza);

          // PNG conserva la trasparenza, utile per un logo su carta bianca;
          // se pesa troppo si ripiega su JPEG con fondo bianco.
          let dataUrl = tela.toDataURL('image/png');
          if (pesoKb(dataUrl) > PESO_MAX_KB) {
            const conFondo = document.createElement('canvas');
            conFondo.width = larghezza;
            conFondo.height = altezza;
            const c2 = conFondo.getContext('2d');
            c2.fillStyle = '#ffffff';
            c2.fillRect(0, 0, larghezza, altezza);
            c2.drawImage(tela, 0, 0);
            for (const q of [0.9, 0.8, 0.7, 0.6]) {
              dataUrl = conFondo.toDataURL('image/jpeg', q);
              if (pesoKb(dataUrl) <= PESO_MAX_KB) break;
            }
          }
          risolvi({ dataUrl, larghezza, altezza, kb: Math.round(pesoKb(dataUrl)) });
        } catch (e) {
          rifiuta(new Error('Elaborazione dell’immagine non riuscita: ' + e.message));
        }
      };
      img.src = String(lettore.result);
    };
    lettore.readAsDataURL(file);
  });
}

const pesoKb = (dataUrl) => (dataUrl.length * 3 / 4) / 1024;
