#!/bin/bash
# ============================================================
#  Avvio del Gestionale OMPT su macOS e Linux.
#  Doppio clic su questo file. Si apre una finestra del
#  Terminale e il gestionale si apre da solo nel browser.
#  Lascia la finestra aperta mentre lo usi.
# ============================================================

cd "$(dirname "$0")" || exit 1
clear

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Per usare il gestionale serve Node.js, che non risulta installato."
  echo
  echo "  Sto aprendo la pagina da cui scaricarlo: installa la versione LTS,"
  echo "  poi torna qui e fai di nuovo doppio clic su questo file."
  echo
  command -v open >/dev/null 2>&1 && open "https://nodejs.org/it/download" 2>/dev/null
  command -v xdg-open >/dev/null 2>&1 && xdg-open "https://nodejs.org/it/download" 2>/dev/null
  echo "  Premi un tasto per chiudere."
  read -r -n 1 -s
  exit 1
fi

node server.js "$@"
