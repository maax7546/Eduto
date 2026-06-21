#!/bin/bash

NAME_FILE=".deploy_expected_name"
CURRENT_PROJECT=$(basename "$PWD")

if [ ! -f "$NAME_FILE" ]; then
  printf '%s' "$CURRENT_PROJECT" > "$NAME_FILE"
  mkdir -p "../${CURRENT_PROJECT}-backups"
  echo "Erststart: Ordnername gespeichert."
fi

EXPECTED_PROJECT=$(cat "$NAME_FILE")
BACKUP_ROOT="../${EXPECTED_PROJECT}-backups"

# ----- Sicherheitschecks (vor jeder Aenderung) -----
if [ "$CURRENT_PROJECT" != "$EXPECTED_PROJECT" ]; then
  echo "FEHLER: Name geaendert! Erwartet: $EXPECTED_PROJECT / Gefunden: $CURRENT_PROJECT"
  echo "Abbruch - es wurde NICHTS veraendert."
  exit 1
fi
if [ ! -d "$BACKUP_ROOT" ]; then
  echo "FEHLER: Backup-Ordner nicht gefunden: $BACKUP_ROOT"
  echo "Abbruch - es wurde NICHTS veraendert."
  exit 1
fi
if [ ! -d ".git" ]; then
  echo "FEHLER: Kein Git-Repository (.git fehlt)!"
  echo "Abbruch - es wurde NICHTS veraendert."
  exit 1
fi

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"

echo "==> 1/3  Backup der lesbaren Version wird erstellt..."
mkdir -p "$BACKUP_DIR"
if ! rsync -a --exclude 'node_modules' --exclude '.git' ./ "$BACKUP_DIR/"; then
  echo "FEHLER: Backup fehlgeschlagen. Abbruch - es wurde NICHTS veraendert."
  exit 1
fi
echo "         Gesichert in: $BACKUP_DIR"

# ----- Ab hier IMMER lesbare Version wiederherstellen, egal was passiert -----
restore_readable() {
  echo ""
  echo "==> Lesbare Version wird wiederhergestellt..."
  rsync -a "$BACKUP_DIR/" ./
  echo "    Dein lokaler Code ist wieder lesbar."
}
trap restore_readable EXIT INT TERM

echo "==> 2/3  JS-Dateien werden obfuskiert..."
find . -name "*.js" -not -path "./node_modules/*" -not -name "*.min.js" | while read file; do
  npx javascript-obfuscator "$file" --output "$file"
done

echo "==> 3/3  Obfuskierte Version wird zu GitHub hochgeladen..."
git add .
if git commit -m "Deploy $TIMESTAMP"; then
  if git push; then
    echo "         Erfolgreich hochgeladen. Webseite wird aktualisiert."
  else
    echo "FEHLER: Hochladen fehlgeschlagen (z.B. Internet weg)."
    echo "        Webseite NICHT aktualisiert - lokaler Code wird gleich wieder lesbar."
  fi
else
  echo "         (keine Aenderungen zum Hochladen)"
fi

echo ""
echo "Fertig!"
