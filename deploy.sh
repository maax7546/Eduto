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

# ----- Git-Sicherheitscheck -----
# Ohne .git oder ohne Remote wuerde 'git push' nur STILL fehlschlagen und der
# Deploy schiene erfolgreich, obwohl nichts hochgeladen wird. Darum hier hart
# abbrechen, BEVOR irgendetwas obfuskiert wird.
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "FEHLER: Kein Git-Repository (.git fehlt)!"
  echo "Es wurde NICHTS hochgeladen und NICHTS veraendert."
  echo "Bitte Git-Verbindung wiederherstellen (git init + remote 'origin')."
  exit 1
fi
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "FEHLER: Kein Remote 'origin' konfiguriert!"
  echo "Es wurde NICHTS hochgeladen und NICHTS veraendert."
  exit 1
fi

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"

echo "==> 1/4  Backup der lesbaren Version wird erstellt..."
mkdir -p "$BACKUP_DIR"
rsync -a --exclude 'node_modules' --exclude '.git' ./ "$BACKUP_DIR/"
echo "         Gesichert in: $BACKUP_DIR"

echo "==> 2/4  JS-Dateien werden obfuskiert..."
find . -name "*.js" -not -path "./node_modules/*" -not -path "./.git/*" -not -name "*.min.js" | while read file; do
  npx javascript-obfuscator "$file" --output "$file"
done

echo "==> 3/4  Obfuskierte Version wird zu GitHub hochgeladen..."
git add .
git commit -m "Deploy $TIMESTAMP" || echo "         (keine Aenderungen zu committen)"
if git push; then
  echo "         Push erfolgreich."
else
  echo "FEHLER: 'git push' fehlgeschlagen - Code ist NICHT online!"
  echo "         Lesbare Version wird trotzdem wiederhergestellt."
  rsync -a --exclude '.git' "$BACKUP_DIR/" ./
  exit 1
fi

echo "==> 4/4  Lesbare Version wird lokal wiederhergestellt..."
# --exclude '.git' schuetzt den Git-Ordner beim Zurueckspielen (defensiv).
rsync -a --exclude '.git' "$BACKUP_DIR/" ./
echo ""
echo "Fertig! Website aktualisiert, lokaler Code wieder lesbar."
echo "Backup liegt in: $BACKUP_DIR"
