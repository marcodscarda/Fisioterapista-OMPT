#!/bin/bash
# ============================================================
#  Mette l'icona del Gestionale OMPT sulla Scrivania (macOS).
#
#  NON SERVE se hai gia' risposto "s" alla domanda che compare
#  al primo avvio del gestionale: l'icona e' gia' sulla Scrivania.
#  Questo file serve per rifarla, per esempio dopo aver spostato
#  la cartella.
#
#  Se macOS dice che il file "non puo' essere aperto" e propone il
#  Cestino: clicca ANNULLA, non spostare niente. E' il blocco che
#  macOS mette su tutti i file scaricati da internet. La strada piu'
#  semplice e' non usare questo file: avvia il gestionale con
#  "Avvia gestionale.command" e rispondi "s" alla domanda.
# ============================================================

set -u
CARTELLA="$(cd "$(dirname "$0")" && pwd)"

clear
echo
echo "  Creo l'icona del Gestionale OMPT sulla Scrivania."
echo

# shellcheck source=strumenti/crea-icona-mac.sh
. "$CARTELLA/strumenti/crea-icona-mac.sh"

if crea_icona_mac "$CARTELLA"; then
  echo "  Fatto."
  echo
  echo "  Sulla Scrivania ora trovi l'icona \"Gestionale OMPT\"."
  echo "  Un doppio clic la apre: il gestionale si presenta da solo nel browser."
  echo "  Per chiuderlo: seleziona l'applicazione e premi Cmd+Q."
  echo
  echo "  Se sposti questa cartella, esegui di nuovo questo file."
else
  echo
  echo "  Non sono riuscito a creare l'icona."
  echo "  Puoi comunque avviare il gestionale con \"Avvia gestionale.command\"."
fi

echo
echo "  Premi un tasto per chiudere."
read -r -n 1 -s
