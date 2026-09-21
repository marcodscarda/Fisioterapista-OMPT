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

# ------------------------------------------------------------
#  L'icona sulla Scrivania si propone da qui.
#  Motivo: questo file l'utente l'ha gia' sbloccato per arrivare
#  fin qui, mentre un secondo file scaricato sarebbe bloccato di
#  nuovo da macOS. Chiedendolo da qui l'ostacolo sparisce.
#  Si chiede una volta sola: la risposta resta in ~/.gestionale-ompt.
# ------------------------------------------------------------
if [ "$(uname)" = "Darwin" ] && [ -t 0 ]; then
  SCRIVANIA="$HOME/Desktop"; [ -d "$SCRIVANIA" ] || SCRIVANIA="$HOME/Scrivania"
  MEMORIA="$HOME/.gestionale-ompt"
  if [ ! -e "$SCRIVANIA/Gestionale OMPT.app" ] && [ ! -e "$MEMORIA/icona-chiesta" ]; then
    echo
    echo "  Vuoi l'icona \"Gestionale OMPT\" sulla Scrivania?"
    echo "  Da li' il gestionale si apre con un doppio clic, senza questa finestra."
    echo
    printf "  Premi s per si', qualsiasi altro tasto per no: "
    read -r -n 1 -s RISPOSTA
    echo
    mkdir -p "$MEMORIA" 2>/dev/null && : > "$MEMORIA/icona-chiesta"
    if [ "$RISPOSTA" = "s" ] || [ "$RISPOSTA" = "S" ]; then
      echo
      # shellcheck source=strumenti/crea-icona-mac.sh
      . "$(dirname "$0")/strumenti/crea-icona-mac.sh" 2>/dev/null \
        && crea_icona_mac "$(cd "$(dirname "$0")" && pwd)" \
        && echo "  Fatto: l'icona e' sulla Scrivania." \
        || echo "  Non sono riuscito a creare l'icona; il gestionale parte lo stesso."
    fi
    echo
  fi
fi

node server.js "$@"
