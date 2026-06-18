#!/bin/bash

NAME_FILE=".deploy_expected_name"
CURRENT_PROJECT=$(basename "$PWD")

# ----- Erststart: Namen merken -----
if [ ! -f "$NAME_FILE" ]; then
  printf '%s' "$CURRENT_PROJECT" > "$NAME_FILE"
  mkdir -p "../${CURRENT_PROJECT}-backups"
  echo "Erststart: Ordnername gespeichert."
fi

EXPECTED_PROJECT=$(cat "$NAME_FILE")
BACKUP_ROOT="../${EXPECTED_PROJECT}-backups"

# ----- Sicherheitscheck -----
if [ "$CURRENT_PROJECT" != "$EXPECTED_PROJECT" ]; then
  echo "FEHLER: Name geändert!"
  echo "Erwarteter Projektordner: $EXPECTED_PROJECT"
  echo "Gefundener Ordner:        $CURRENT_PROJECT"
  echo "Abbruch - es wurde nichts veraendert."
  exit 1
fi

if [ ! -d "$BACKUP_ROOT" ]; then
  echo "FEHLER: Name geändert!"
  echo "Backup-Ordner nicht gefunden: $BACKUP_ROOT"
  echo "Abbruch - es wurde nichts veraendert."
  exit 1
fi

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"

echo "==> 1/4  Backup der lesbaren Version wird erstellt..."
mkdir -p "$BACKUP_DIR"
rsync -a --exclude 'node_modules' --exclude '.git' ./ "$BACKUP_DIR/"
echo "         Gesichert in: $BACKUP_DIR"

echo "==> 2/4  JS-Dateien werden obfuskiert..."
find . -name "*.js" -not -path "./node_modules/*" -not -name "*.min.js" | while read file; do
  npx javascript-obfuscator "$file" --output "$file"
done

echo "==> 3/4  Obfuskierte Version wird zu GitHub hochgeladen..."
git add .
git commit -m "Deploy $TIMESTAMP" || echo "         (keine Aenderungen zu committen)"
git push

echo "==> 4/4  Lesbare Version wird lokal wiederhergestellt..."
rsync -a "$BACKUP_DIR/" ./
echo ""
echo "Fertig! Website aktualisiert, lokaler Code wieder lesbar."
echo "Backup liegt in: $BACKUP_DIR"
