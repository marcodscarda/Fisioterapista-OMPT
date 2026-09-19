#!/bin/bash
# ============================================================
#  Mette l'icona del Gestionale OMPT sulla Scrivania (macOS).
#
#  Doppio clic su questo file: crea sulla Scrivania l'icona
#  "Gestionale OMPT", con cui aprire il gestionale in un colpo
#  solo, senza finestra del Terminale.
#
#  Va eseguito una sola volta, e di nuovo solo se sposti questa
#  cartella. L'icona punta sempre a questa cartella, quindi usa
#  sempre la versione aggiornata del gestionale.
# ============================================================

set -u
CARTELLA="$(cd "$(dirname "$0")" && pwd)"
SCRIVANIA="$HOME/Desktop"
[ -d "$SCRIVANIA" ] || SCRIVANIA="$HOME/Scrivania"
APP="$SCRIVANIA/Gestionale OMPT.app"

VERSIONE="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$CARTELLA/package.json" | head -1)"
[ -n "$VERSIONE" ] || VERSIONE="1.0.0"

clear
echo
echo "  Creo l'icona del Gestionale OMPT (versione $VERSIONE) sulla Scrivania."
echo

if [ ! -d "$SCRIVANIA" ]; then
  echo "  Non trovo la cartella Scrivania. Interrompo."
  echo "  Premi un tasto per chiudere."; read -r -n 1 -s; exit 1
fi

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources" || {
  echo "  Non riesco a scrivere sulla Scrivania. Interrompo."
  echo "  Premi un tasto per chiudere."; read -r -n 1 -s; exit 1
}

# ---- Descrizione del pacchetto -----------------------------------------
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Gestionale OMPT</string>
  <key>CFBundleDisplayName</key><string>Gestionale OMPT</string>
  <key>CFBundleIdentifier</key><string>it.ompt.gestionale</string>
  <key>CFBundleExecutable</key><string>gestionale</string>
  <key>CFBundleIconFile</key><string>gestionale</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSIONE</string>
  <key>CFBundleVersion</key><string>$VERSIONE</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

# ---- Avviatore ---------------------------------------------------------
# Un'applicazione lanciata dal Finder eredita un PATH ridotto, in cui node
# di solito non c'e': va cercato nelle posizioni in cui viene installato.
cat > "$APP/Contents/MacOS/gestionale" <<AVVIO
#!/bin/bash
CARTELLA="$CARTELLA"
cd "\$CARTELLA" || exit 1

trova_node() {
  command -v node 2>/dev/null && return 0
  for p in /usr/local/bin/node /opt/homebrew/bin/node /opt/local/bin/node \\
           "\$HOME/.volta/bin/node" "\$HOME/.nvm/versions/node"/*/bin/node \\
           "\$HOME/.asdf/shims/node" /usr/bin/node; do
    [ -x "\$p" ] && { echo "\$p"; return 0; }
  done
  return 1
}

NODE="\$(trova_node | head -1)"
if [ -z "\$NODE" ]; then
  osascript -e 'display dialog "Per usare il gestionale serve Node.js, che non risulta installato.\\n\\nScarica la versione LTS da nodejs.org, installala e riprova." buttons {"Apri nodejs.org","Chiudi"} default button 1 with title "Gestionale OMPT" with icon caution' \\
    -e 'if button returned of result is "Apri nodejs.org" then open location "https://nodejs.org/it/download"' >/dev/null 2>&1
  exit 1
fi

exec "\$NODE" server.js
AVVIO
chmod +x "$APP/Contents/MacOS/gestionale"

# ---- Icona -------------------------------------------------------------
SORGENTE="$CARTELLA/app/icone/icona-512.png"
if [ -f "$SORGENTE" ] && command -v sips >/dev/null 2>&1 && command -v iconutil >/dev/null 2>&1; then
  SET="$(mktemp -d)/gestionale.iconset"
  mkdir -p "$SET"
  for d in 16 32 64 128 256 512; do
    sips -z $d $d "$SORGENTE" --out "$SET/icon_${d}x${d}.png" >/dev/null 2>&1
  done
  cp "$SET/icon_32x32.png"   "$SET/icon_16x16@2x.png"  2>/dev/null
  cp "$SET/icon_64x64.png"   "$SET/icon_32x32@2x.png"  2>/dev/null
  cp "$SET/icon_256x256.png" "$SET/icon_128x128@2x.png" 2>/dev/null
  cp "$SET/icon_512x512.png" "$SET/icon_256x256@2x.png" 2>/dev/null
  rm -f "$SET/icon_64x64.png"
  iconutil -c icns "$SET" -o "$APP/Contents/Resources/gestionale.icns" >/dev/null 2>&1
  rm -rf "$(dirname "$SET")"
fi

touch "$APP"
echo "  Fatto."
echo
echo "  Sulla Scrivania ora trovi l'icona \"Gestionale OMPT\"."
echo "  Un doppio clic la apre: il gestionale si presenta da solo nel browser."
echo "  Per chiuderlo: seleziona l'applicazione e premi Cmd+Q."
echo
echo "  Se sposti questa cartella, esegui di nuovo questo file."
echo
echo "  Premi un tasto per chiudere."
read -r -n 1 -s
