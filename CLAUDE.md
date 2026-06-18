# ZUERST LESEN — Projekt-Leitfaden für Claude

> **Zweck dieser Datei:** Diese Datei wird in **jeder neuen Session automatisch zuerst geladen**.
> Sie ersetzt das Durchlesen aller Code-Dateien. Lies sie, finde anhand der Karten und
> Tabellen unten heraus **welche wenigen Dateien** deine aktuelle Aufgabe betreffen, und
> öffne **nur diese**.
>
> **🔴 Pflicht-Regel — diese Datei aktuell halten:** Sobald du eine **Datei oder einen Ordner
> neu anlegst, umbenennst, verschiebst oder löschst**, musst du im **selben Arbeitsschritt
> CLAUDE.md anpassen** (Datei-Karte §5; bei neuen Bausteinen/APIs auch Routing §3 und API-Tabelle
> §4). Eine Struktur-Änderung gilt erst als **fertig**, wenn CLAUDE.md sie widerspiegelt. Diese
> Datei ist nur nützlich, solange sie **exakt** stimmt.

---

## 1. Was das ist

Eine interaktive Lern-App für Kinder (Deutsch), aktuell mit Mathe-Übungen, einem
Quiz-Spiel (Fach `quiz`) und Lehrer-Werkzeugen (Fach `werkzeuge`). **Reines
HTML/CSS/JavaScript, kein Build-Schritt, kein Framework, keine Abhängigkeiten.** Man startet
sie, indem man `index.html` im Browser öffnet. JS ist klassisches `window.*`-Global-Scripting
(keine Module/Imports), Scripts werden per `<script src>` in fester Reihenfolge geladen.

Die Struktur ist bewusst **fach-erweiterbar**: Der globale Baukasten ist getrennt in einen
**generischen UI-Teil** und **fachspezifische Teile** (heute nur Mathe); die Inhalte liegen
nach **Fach** gruppiert. Später lässt sich z. B. ein Fach `modules/deutsch/` ergänzen, ohne
den Mathe-Code anzufassen.

## 2. Architektur in einem Satz

Drei Ebenen: **(1) Root** = Hauptmenü → **(2) `global/`** = globaler Baukasten (`global/ui/`
generisch + fachspezifisch `global/math/`, `global/werkzeuge/`) → **(3) `modules/<fach>/`** = Inhalte nach Fach,
darin **Themen-Gruppen** (`numberline/`, `moreorless/`, `operators/`, `regrouping/`), die je
ein Untermenü + mehrere Übungs-**Module** enthalten.

```
index.html ─> modules/<fach>/<gruppe>/menu-<gruppe>.html ─> modules/<fach>/<gruppe>/modules-<gruppe>/<modul>-<gruppe>/<modul>-<gruppe>.html
   (Root)                 (Gruppen-Menü)                                          (eine konkrete Übung)
```

Jede dieser HTML-Seiten zieht ihre Bausteine aus `global/`.

### ⭐ Baukasten-Prinzip — die wichtigste Regel

> **Begriffe (nicht verwechseln):** Ein **Baustein/Element** = ein wiederverwendbarer Lego-Stein
> (Zehnerstreifen/Dotframe, Zahlenstrahl, Numberbox, Dropzone, Drag&Drop, Zahlengenerator,
> Settings). Ein **Modul** = eine konkrete Übung (z. B. `calculation-operators`), die solche
> Bausteine zusammensetzt.
>
> Das ganze Projekt ist ein **Baukasten**. Jeder Baustein **und seine komplette Funktionsweise**
> lebt **global in `global/` — und nur dort, genau einmal**. Ein **Modul erfindet keinen Baustein
> neu und kopiert keinen.** Ein Modul ist reine **Regie**: es sagt der Seite, *welche* globalen
> Bausteine erscheinen, *wie sie konfiguriert* sind und *wie sie miteinander interagieren* (die
> Spielregeln genau dieser Übung). Mehr nicht.
>
> **Zwei Baukasten-Ebenen — wohin gehört ein neuer Baustein?**
> - **Generisch / fach-unabhängig** (würde auch eine Nicht-Mathe-Übung wollen: Buttons, Settings,
>   Drag&Drop, Numberbox, Dropzone, Schrift, Skalierung) → **`global/ui/`**.
> - **Mathe-spezifisch** (Zahlenstrahl, Zehnerfeld, Zahlengenerator, Punkte) → **`global/math/`**.
> - **Weder noch** (ein neuer Fach-Baukasten, z. B. Musik/Sprache) → **neuer Ordner `global/<fach>/`**
>   nach demselben Schema (`elements/` + `bundleimport/`).
>
> **Konsequenz — so ist es ausdrücklich gewollt:** Änderst du den Zehnerstreifen in
> `global/math/elements/dotframe/`, ändern sich **alle** Zehnerstreifen im ganzen Projekt.
> Genau dafür ist die Struktur da.
>
> **Daraus folgt beim Programmieren:**
> - Brauchst du für ein Modul ein **neues Element** oder eine **neue Fähigkeit** eines bestehenden
>   Elements → **in `global/` anlegen/erweitern** (generisch, als Opt-in via CSS-Klasse oder Flag),
>   in der passenden Ebene (ui vs. math). **Niemals** einen Baustein lokal im Modul nachbauen.
> - Im **Modul** bleibt **nur Orchestrierung**: Aufrufe der globalen APIs (§4), das Verdrahten der
>   Elemente, die Aufgaben-/Antwortlogik dieser Übung und modulspezifische Konfiguration (z. B. ein
>   Toggle, das ein `window.*`-Flag setzt — über `SettingsBuilder`, nie von Hand gebautes DOM).
> - **Prüffrage vor jeder Code-Zeile:** „Ist das **die Funktionsweise eines Bausteins**? → `global/`
>   (ui oder math). Oder **wie diese eine Übung ihre Bausteine zusammenschaltet**? → Modul."
>   Hilfstest: „Würde ein anderes Modul / anderes Fach das auch wollen?" — wenn ja, ist es ein
>   Baustein und gehört global.

---

## 3. Aufgabe → welche Dateien öffnen (Routing-Tabelle)

| Du willst ändern… | Öffne | Hinweis |
|---|---|---|
| Kopfzeile / Navigation / Vollbild / Exit-/Zurück-Button | `global/ui/ui.js`, `global/ui/ui.css` | `injectUI()` baut den Header |
| Settings-Dropdown (Toggles, Zahlenraum, Speed-Slider) | `global/ui/elements/settings-builder.js`, `global/ui/settingsmenu.css` | **Nie** Dropdown-DOM von Hand bauen → `SettingsBuilder` benutzen |
| modulspezifische Einstellungen | das `ui-…`-Script des Moduls/der Gruppe | ruft nur `SettingsBuilder.*` auf |
| Zufallszahlen / Zahlenraum-Logik | `global/math/elements/numbergenerator.js` | `window.NumberGenerator` |
| Drag&Drop / Klick-Antworten | `global/ui/elements/draganddrop.js`, `numberbox.css`, `dropzone.css` | Klassen `nb-box`, `nb-drop-target` |
| Zehner-/Zwanzigerfeld (Punktebild) | `global/math/elements/dotframe/dotframe.js` + `.css` | Modul setzt `data-red`/`data-blue`, ruft `renderDotframes()`, definiert `window.checkDots` |
| Zahlenstrahl | `global/math/elements/numberline/numberline.js` + `settings-numberline/` | `window.NumberlineState`, `window.currentZoom` |
| Schrift / Skalierung global | `global/ui/font.css`, `global/ui/scaling.css` | CSS-Variablen `--ui-font`, `--math-font` |
| Hauptmenü-Kacheln | `index.html`, `index-visuals.css` | |
| Ein Gruppen-Untermenü | `modules/<fach>/<gruppe>/menu-<gruppe>.html`, `menu-visuals-<gruppe>.css` | |
| Eine bestehende Übung | `modules/<fach>/<gruppe>/modules-<gruppe>/<modul>-<gruppe>/` (`.html/.css/.js`) | siehe §6 |
| Sitzplan-Tisch / Möbel-Baustein (Aussehen, Verschieben/Drehen/Größe, Stühle, Magnet) | `global/werkzeuge/elements/seattable/seattable.js` + `.css` | `window.SeatTable`; Modul liefert nur Vorlagen/Regie |
| Sammel-Imports (Bundles) | `global/ui/bundleimport/`, `global/math/bundleimport/`, `global/werkzeuge/bundleimport/` | siehe §5 / §7 |
| **Neue Übung anlegen** | → **§7** | Modul ans nächstgelegene kopieren |
| **Neue Themen-Gruppe / neues Fach** | → **§8** | |
| Einen UI-Baustein isoliert testen | `testutility/` | → **§9** |

---

## 4. Globale APIs (das `window.*`-Vertragswerk)

Diese werden von `global/` bereitgestellt; Module **rufen sie auf**, definieren sie nicht neu.

| API | Datei | Bedeutung |
|---|---|---|
| `injectUI(viewType, options, callbacks)` | `global/ui/ui.js` | Baut Header/Nav. `options`: `title`, `showBack`, `showExit` (default **an**), `showZoom`, `showSettings`, `showFullscreen`, `exitUrl` (wird sonst aus der `../`-Tiefe des Script-Tags geraten, das `global/ui/ui.js` lädt). `callbacks.onBack` optional. **FOUC-Schutz:** `ui.css` versteckt `.main-container`, bis `injectUI()` am Ende `<html>.ui-ready` setzt — jede Seite mit `.main-container` **muss** `injectUI()` aufrufen, sonst bleibt der Inhalt unsichtbar. |
| `window.SettingsBuilder` | `global/ui/elements/settings-builder.js` | `.ready(cb)` wartet auf `#settings-dropdown`; `.addRangePicker([ranges])`, `.addSpeedSlider()`, `.addSection(title, [kinder], {id,prepend})`, `.toggleGroup(name, [cfg])` (exklusiv), `.toggleButton({id,label,active,onToggle})`, `.actionButton({id,label,onClick})`. |
| `window.NumberGenerator` | `global/math/elements/numbergenerator.js` | `.getLimits() → {min,max}`, `.getRandomNumber(smartMin)`, `.getRandomNumbers(count, smartMin)`, `.currentRange`. (0 kommt 50 % seltener.) |
| `window.DragDropManager.init(onDrop)` | `global/ui/elements/draganddrop.js` | Aktiviert Drag **und** Klick auf `.nb-box[draggable]` → Dropzones. `onDrop(value, sourceEl, zone)`; setzt `zone` `wrong` → wird nach 800 ms zurückgesetzt. |
| `window.renderDotframes()` / `window.checkDots()` | `global/math/elements/dotframe/dotframe.js` | `renderDotframes()` zeichnet alle `.dot-frame` neu (aus `data-red`/`data-blue`). `checkDots` definiert **das Modul** — wird bei jedem Punkt-Klick aufgerufen. |
| `window.NumberlineState`, `window.currentZoom`, `window.changeZoom(delta)` | `global/math/elements/numberline/numberline.js` | Zustand des Zahlenstrahls; `changeZoom` wird von den Zoom-Buttons aus `injectUI({showZoom})` aufgerufen. |
| Event `rangeChanged` | dispatcht von `addRangePicker` | Module hören darauf und rendern neu (`window.addEventListener('rangeChanged', …)`). |
| CSS-Var `--anim-speed` | gesetzt von `addSpeedSlider` | Animationsdauer; in `<html>` gesetzt. |
| `window.SeatTable` | `global/werkzeuge/elements/seattable/seattable.js` | Ein Sitzplan-/Möbel-Tisch als kompletter Baustein. `.create(model, opts)` → DOM (Rechteck + Stuhl-Kreise mit Namensfeldern) inkl. **Bedienung** (Verschieben/Drehen/Größe), **Stühle** (＋/× je Seite), **Magnetismus** (Reihenfolge in `applyMagnet`: erst **Andocken**, dann **Ausrichten** — Andocken hat Vorrang, sonst zieht das Ausrichten einen tief überlappenden Tisch wieder vom Nachbarn weg): (a) **Andocken** (`edgeDock`): berührt Nachbar-Tische (waagerecht/hochkant/verschieden groß); (b) **Ausrichten** (`alignAxis`): zieht Reihen/Spalten bündig — Mitten bzw. gleichnamige Kanten rasten ein, UNABHÄNGIG vom Abstand quer dazu (eine bereits angedockte Achse wird nicht mehr verschoben). Die Position rastet live ein; die berührten Stühle wechseln aber **erst beim Loslassen** (`endDrag` → `flipChairsAtDock`, `vacateEdge`) auto. auf die freie Seite — nicht schon während des Ziehens (sonst blieben sie gedreht, wenn man nur kurz dagegenzieht). `model`: `{id,w,h,rot,cx,cy,label?,chairs:[{id,side,name}]}` (`label` = optionale Beschriftung auf der Fläche, z. B. „Pult", `.st-label`, gegen-rotiert lesbar). `opts`: `area`, `magnet`, `getSiblings()`→`[{model,el}]` (ohne sich selbst, für den Magnet!), `getMoveGroup(id)`→`[{model,el}]` (andere ausgewählte Tische, die beim Verschieben **mitwandern**; leer = Einzel-Zug; bei Gruppen-Zug ist der Magnet aus), `nextChairId()`, `onChange(model, reason)` (`reason`: `'drag'`/`'resize'`/`'rotate'` zusammengefasst als `'drag'`, `'chair'`, `'name'` — fürs gezielte Undo-Sammeln), `onSelect(id)`, `onDelete(id)`. Weiter: `.startMove(el, e)` (frisch erzeugten Tisch am Cursor führen), `.layout/.position/.rebuildChairs(el, model)`, Geometrie `.cornersPlan(model)`/`.chairSeats(model)` (für PDF & Auswahl-Hülle), Konstanten `.CHAIR/.GAP/.CTRL`. **Auswahl-Klassen setzt das Modul:** `st-selected` (in der Auswahl → Umrandung), zusätzlich `st-solo` nur bei GENAU EINEM ausgewählten Tisch (zeigt erst dann Griffe/＋/×). **Nicht** auf Modul-Eval-Ebene referenzieren (Bündel lädt async) → Modul wartet via `window.SeatTable ? init() : load`-Guard. |
| localStorage | — | `selected-range-text` (Zahlenraum), `settings-anim-speed`. Attribut `<html data-range>` spiegelt den Zahlenraum. |

---

## 5. Datei-Karte

### Root
- `index.html` — Hauptmenü (4 Kacheln → Gruppen-Menüs). Lädt nur `global/ui/ui.js` + `injectUI('index', {showExit:false})`.
- `index-visuals.css` — Visuals nur fürs Hauptmenü.
- `CLAUDE.md` — **diese Datei.**

### `global/ui/` — generischer, fach-unabhängiger Baukasten
**Steuerung & Styles**
- `ui.js` — `injectUI()` + `SettingsBuilder`-Stub (sammelt `ready`-Callbacks bis das echte Builder-Script lädt). Auto-Exit erkennt das Script-Tag über den Marker `global/ui/ui.js`.
- `ui.css` — Header-/Nav-Styles · `font.css` — Schrift-Variablen · `scaling.css` — Skalierung · `settingsmenu.css` — Dropdown-Styles · `menu-buttons.css` — `.big-menu-btn`.

**`global/ui/elements/` — generische Bausteine**
- `settings-builder.js` — `SettingsBuilder` (siehe §4).
- `draganddrop.js` — `DragDropManager`.
- `numberbox.css` (`nb-*`), `dropzone.css`, `check-button.css` — Baustein-Styles.

**`global/ui/bundleimport/` — Sammel-Imports (in HTML einbinden statt Einzeldateien)**
- `global-bundleimport.css` — font + ui + settingsmenu + scaling. **Immer zuerst.**
- `menu-bundleimport.css` — menu-buttons (für Menü-Seiten).
- `ui-bundleimport.css` — check-button + numberbox + dropzone (generische Übungs-Bausteine).
- `ui-bundleimport.js` — lädt die generischen elements-JS (settings-builder, draganddrop) relativ zu `global/ui/`. **Immer** auf Übungs-Seiten.

### `global/math/` — mathe-spezifischer Baukasten
**`global/math/elements/`**
- `numbergenerator.js` — `NumberGenerator`.
- `dots.css` — Punkt-Styles.
- `dotframe/dotframe.js` + `dotframe.css` — Zehner-/Zwanzigerfeld.
- `numberline/numberline.js` + `numberline.css` — Zahlenstrahl.
- `numberline/settings-numberline/` — Zahlenstrahl-spezifische Setting-Buttons: `settings-numberline.js` (Sammler) + `jump-`, `reset-`, `zoom-`, `shownegatives-`, `interval-button-numberline.js`.

**`global/math/bundleimport/`**
- `math-bundleimport.css` — numberline.css + dotframe.css + dots.css.
- `math-bundleimport.js` — lädt numbergenerator + numberline (+ settings-numberline) + dotframe relativ zu `global/math/`. **Nur auf Mathe-Übungs-Seiten.**

### `global/werkzeuge/` — werkzeuge-spezifischer Baukasten
Erster Fach-eigener Baukasten nach dem `global/<fach>/`-Schema (für Bausteine, die weder
generisches UI noch Mathe sind).
**`global/werkzeuge/elements/`**
- `seattable/seattable.js` + `seattable.css` — **`SeatTable`** (siehe §4): ein Sitzplan-/Möbel-Tisch als kompletter Baustein — Aussehen, Bedienung (Verschieben/Drehen/Größe), Stühle (Kreise + Namensfelder, ＋/× je Seite) und **Magnetismus** (Andocken an Nachbar-Tische, Stühle wechseln die Seite). Klassen-Präfix `st-`.

**`global/werkzeuge/bundleimport/`**
- `werkzeuge-bundleimport.css` — seattable.css.
- `werkzeuge-bundleimport.js` — lädt seattable.js relativ zu `global/werkzeuge/`. **Nur** auf Werkzeug-Seiten, die SeatTable brauchen (z. B. Sitzplan).

### `global/<fach>/` *(Schema für weitere Fächer)*
Für künftige Bausteine, die weder generisches UI noch Mathe sind. Gleiches Schema wie
`global/werkzeuge/`: `global/<fach>/elements/` + `global/<fach>/bundleimport/`. Nur anlegen,
wenn es echte Bausteine gibt (keine leeren Ordner). Beispiel: Das Fach `quiz` braucht **keine**
eigenen Bausteine — es nutzt nur `global/ui/`.

### `modules/<fach>/` — Inhalte, nach Fach gruppiert
Aktuell **`modules/math/`** (Mathe), **`modules/quiz/`** (Quiz-Spiel) und **`modules/werkzeuge/`** (Lehrer-Werkzeuge). Jede Themen-Gruppe folgt **demselben Schema** (nicht jede hat jeden Optional-Teil):

```
modules/<fach>/<gruppe>/
  menu-<gruppe>.html            Untermenü (Kacheln → Module)
  menu-visuals-<gruppe>.css     Visuals des Untermenüs
  ui-<gruppe>/ui-<gruppe>.js     (optional) Settings, die ALLE Module der Gruppe teilen
  modules-<gruppe>/
    <modul>-<gruppe>/           ein Übungs-Modul: .html + .css + .js
      ui-<modul>-<gruppe>.js     (optional) Settings nur für DIESES Modul
      animation-…                (optional) Animationslogik/-styles
  visuals-<gruppe>/              (optional) geteilte Grafiken/Animationen der Gruppe
  functions-<gruppe>/            (optional) geteilte Logik der Gruppe
```

Konkret vorhanden in `modules/math/`:
- **`numberline/`** — Module: `view-numberline`, `assign-numberline`, `crossingtens-numberline`. Gruppen-UI: `ui-numberline`. (`crossingtens-numberline` = Zehnerübergang mit Rechenpfeilen: drei Bögen in **fester Reihenfolge** — 1. Start→Zehn, 2. Zehn→Ergebnis, 3. Start→Ergebnis (ganz) — werden gesetzt; auf eine **beliebige** Zahl klicken/drücken → Pfeil stellt sich gerade nach oben → zur Zielzahl klicken oder ziehen (beide Bedien-Modi). Pfeil-Farben: **schwarz** beim Ziehen, **grün** wenn richtig gesetzt, kurz **rot** bei falschem oder nicht-an-der-Reihe-Pfeil (auch falsche Startzahlen erlaubt). Die Teilbögen bekommen ihre Höhe **proportional zur Höhe des großen Bogens an ihrer Scheitelstelle** (Faktor 0,55) → liegen garantiert unter dem großen Bogen; **Bogen-Labels** (−1 …) werden in `redraw()` ZULETZT mit deckendem weißem Hintergrund-Rechteck gezeichnet, damit keine Bogenlinie sie überschneidet. **Punkte-Hilfe** = Pfeil ↓ unter dem zweiten Operanden + großes **Zehnerfeld** (globales `dot-frame v-10 large`, `frozen`/nicht editierbar) darunter: b ist als `data-red`=b (alle Punkte **rot**), `data-blue`=0 eingetragen (`renderDotframes()`); die Punkte werden **von rechts nach links** ausgegraut (Klasse `used`): nach Pfeil zur Zehn die rechten u, nach Weiter-Pfeil alle b — zeigt das Aufteilen der Zahl. Per Settings ein-/ausblendbar. **Nach den drei Pfeilen** erscheinen unten 3 `nb-option.nb-box-small`-Boxen (so groß wie das Drop-Feld); das Kind zieht das Ergebnis in eine Inline-`nb-dropzone.nb-box-small` in der Gleichung (Muster wie `calculation-operators`, via globalem `DragDropManager`; richtig → grün + nächste Aufgabe, falsch → rot). **Option „Pfeil-Zahlen ziehen"** (`window.CT_LABELDROP`, Default aus): dann erscheint nach JEDEM korrekt gezogenen Pfeil statt des Labels eine `#ct-arrow-drop`-„?"-Box am Bogen, in die die richtige Sprungzahl gezogen werden muss, bevor der nächste Pfeil geht; danach das Ergebnis wie gehabt. Damit immer nur EINE Dropzone aktiv ist, ist das Ergebnisfeld in dieser Phase ein passiver `.ct-qbox`-Platzhalter (gleiche Optik) und wird erst in der Ergebnis-Phase zur echten Dropzone. Zustände: `done`/`filled`/`pending`; ein gemeinsamer `handleDrop` für Pfeil-Zahl (`zone.id==='ct-arrow-drop'`) und Ergebnis. Lädt **nicht** `ui-numberline`, sondern hat eigene `ui-crossingtens-numberline.js` (injectUI + Settings: Zahlenraum 20/30/100, Rechenart Minus/Plus/Gemischt, Punkte-Hilfe-Toggle, Neue Aufgabe/Pfeile löschen/Lösung zeigen). Spiel-Logik in `crossingtens-numberline.js`: nutzt die globale Zahlenstrahl-Geometrie (`window.NumberlineState`, `currentStep`, `currentZoom`), zeichnet die Pfeile in eine eigene **SVG-Ebene** `#arrowLayer` und hängt sich an `window.refreshInteractions`, damit die Bögen bei Pan/Zoom/Resize mitlaufen; eigene Maus-Steuerung über `viewport.onmousedown` (Klick auf Zahl = Pfeil, sonst Strahl schieben). Aufgaben: zweiter Operand einstellig (3–9), zerlegt in u+r; CSS senkt modul-lokal `--nb-box-size-small`, damit Start und Ziel gemeinsam sichtbar bleiben.)
- **`moreorless/`** — Module: `numbers-`, `numberrow-`, `quantity-moreorless`. Gruppen-UI: `ui-moreorless`. Geteilte Logik: `functions-moreorless/` (`moreorless.js`, `numbergenerator-moreorless.js`, `render-moreorless.js`). Grafiken: `visuals-moreorless/` (Krokodile; intern gruppen-relativ verlinkt, `ui-moreorless.js` self-lokalisiert über Marker `/ui-moreorless/`).
- **`operators/`** — Modul-Ordner: `structure-operators`, `structure-commutativelaw`, `structure-inverseoperation`, `calculation-operators`, `crossingtens-operators`. (Ausnahme vom Schema: bei `structure-commutativelaw`/`-inverseoperation` fehlt das `-operators` am **Ordnernamen**, die Dateien darin tragen es trotzdem.) Gruppen-UI: `ui-operators`. `structure*` nutzen die Gruppen-UI; `calculation`/`crossingtens`/`inverseoperation` haben zusätzlich eigene `ui-…`-Scripts.
- **`regrouping/`** (BETA) — Modul: `placevaluechart-regrouping`. Gruppen-UI: `ui-regrouping`. Styles: `visuals-regrouping/`.

Konkret vorhanden in `modules/quiz/` (**Nicht-Mathe-Fach** — lädt nur `global/ui/`, **kein** Math-Bundle):
- **`wettkampf/`** — Modul: `quizfussball-wettkampf` (Klassen-Quizspiel: zwei Teams treten an, zwei Modi — Fußballfeld ⚽ / Pferderennbahn 🐎). Eigene Settings: `ui-quizfussball-wettkampf.js` (Modus/Generator/Feldgröße/Reset **+ „🖨️ Trikots drucken"** öffnet `tafelfussball-trikots.pdf` im neuen Tab — alles über `SettingsBuilder`; keine Gruppen-UI). Spiel-Logik & On-Field-Steuerung (Angriffe, Trikot-Generator, Undo) in `quizfussball-wettkampf.js`. Layout ist **vollständig responsiv** (vh/vw/clamp + Flex-Spalte über die Viewport-Höhe, kein Scrollen); die ovale Pferderennbahn wird in JS aus der Container-Größe berechnet (inkl. Resize-Handler). Assets im Modulordner: `trikot.png` (Generator-Grafik), `tafelfussball-trikots.pdf` (Druckvorlage Trikots); optionaler Tor-Sound `goal.mp3` (nicht enthalten → bleibt stumm). Der Header-Titel wechselt je Modus (`Quizfussball` ⚽ / `Pferderennenquiz` 🐎).

Konkret vorhanden in `modules/werkzeuge/` (**Nicht-Mathe-Fach** — lädt nur `global/ui/`, **kein** Math-Bundle):
- **`einteilung/`** — Module: `gruppen-einteilung`, `sitzplan-einteilung`. (Die Gruppe `einteilung` doppelt als „Werkzeuge"-Menü — Root-Kachel zeigt direkt auf `menu-einteilung.html`; „Einteilung" steht hier breit für *Anordnung*: Kinder gruppieren **und** Sitzplätze anordnen.)
  - **`gruppen-einteilung`** (Lehrer-Werkzeug: Gruppen **von Hand** zusammenstellen). Pro Gruppe ein Namensfeld, mit **＋** kommt ein weiteres Feld daneben, **×** entfernt ein Feld; **„＋ Neue Gruppe"** legt eine weitere Reihe an, **🗑** löscht eine Gruppe. Die Gruppen liegen **untereinander gestapelt** (`.ge-board` = Flex-Spalte) und sind am Griff **≡ als GANZE Reihe** per Drag&Drop umsortierbar (z. B. Reihenfolge zum gemeinsamen Laufen) — Sortier-Logik ist **modul-lokal** (Interaktionslogik genau dieser Übung, nicht der antwort-prüfende `DragDropManager`). Drag-Trick: Karte ist nur `draggable`, solange am Griff gezogen wird, damit die Eingabefelder bedienbar bleiben; nach `dragend` wird neu nummeriert. Eigene Settings: `ui-gruppen-einteilung.js` (**💾 Als PDF speichern** / **📂 PDF laden** / 🖨️ Drucken / ↺ Zurücksetzen — über `SettingsBuilder`; keine Gruppen-UI, keine Größen-Einstellung). **Speichern/Laden ohne Bibliothek:** `buildPdfBytes()` baut von Hand ein gültiges minimales PDF (Catalog→Pages→Page→Font Helvetica/WinAnsi→Contents, xref-Offsets byte-genau, alle Zeichen als Latin-1-Bytes) und hängt die Gruppen als `%GRUPPENDATA:<base64-JSON>` **hinter `%%EOF`** an (PDF-Reader ignorieren das). `handleFile()` liest eine hochgeladene PDF byte-genau (Latin-1), zieht den Marker per Regex heraus, decodiert und stellt die Gruppen wieder her → so ist **dieselbe gespeicherte PDF re-importierbar**. (Eine fremde, mit „Drucken" erzeugte PDF hat keinen Marker → freundlicher Hinweis. **Wichtig:** beim Laden erst `render()`, dann `save()`, weil `save()` via `syncFromDOM()` aus dem DOM liest.) **🖨️ Drucken** nutzt zusätzlich `window.print()` + `@media print`-Layout (Utility-Klassen `no-print` / `print-only`). Verstecktes `<input type=file id="ge-file">` löst den Upload aus. Zustand in `localStorage` (`einteilung-groups`, JSON Array-von-Arrays).
  - **`sitzplan-einteilung`** (Lehrer-Werkzeug: Klassenraum-**Sitzplan** bauen). **Reine Regie** — der Tisch selbst (Aussehen + Bedienung + Stühle + Magnetismus) ist der **globale Baustein `window.SeatTable`** aus `global/werkzeuge/` (§4), hier NICHT nachgebaut. Das Modul lädt zusätzlich das `werkzeuge`-Bündel und ist sonst nur Drumherum: Unten eine **Tisch-Leiste** (`.sp-tray`) mit drei Vorlagen (`data-type` `einzel`/`doppel`/`vierer`); per **Ziehen** (pointerdown auf `.sp-tool` → `startCreate()` baut ein Tisch-Modell → `SeatTable.create()` → `SeatTable.startMove()` führt ihn am Cursor) landet ein Tisch auf der großen freien Fläche `#sp-area`. SeatTable liefert: Verschieben/Drehen (rastet 45°)/Größe, **eckige** Tische, Stuhl-Kreise mit Namensfeldern (lesbar gegen-rotiert), je Seite ＋/× im Einzel-Bearbeiten-Modus (`.st-solo`), und **Magnetismus** — beim Verschieben dockt der Tisch an Nachbarn an (waagerecht/hochkant/verschieden große Tische, z. B. Vierer an Doppel); die an der berührten Kante liegenden Stühle wechseln automatisch auf die freie Seite. Das Modul gibt SeatTable über `opts.getSiblings()` die Magnet-Partner, `opts.getMoveGroup()` die mit-zu-verschiebenden ausgewählten Tische und `onChange/onSelect/onDelete/nextChairId`. Oben quer eine breite **Tafel** (`.sp-front`, `width: min(58%,680px)`). **Lehrer-Pult** (`ensurePult()`): ein Doppeltisch mit `label:'Pult'` und nur EINEM Stuhl (Seite `top`, zur Tafel), links vor der Tafel — automatisch vorhanden (`migratePultChair()` dreht einen alten Pult-Stuhl einmalig von `bottom` auf `top`); löscht man ihn, merkt das Modul `localStorage['sitzplan-pult-removed']` und er kommt nicht zurück (außer ↺ Zurücksetzen löscht das Flag). **Mehrfach-Auswahl (modul-lokal):** Aufziehen auf leerer Fläche zeichnet ein `.sp-marquee`-Rechteck und wählt alle getroffenen Tische (Hülle aus `SeatTable.cornersPlan`); eine so gewählte Gruppe verschiebt man gemeinsam (Druck auf einen Tisch der Gruppe). **Lösch-/Rücktaste** entfernt die ausgewählten Tische (außer der Fokus liegt in einem Namensfeld). **Rückgängig/Wiederholen** (`#sp-undo`/`#sp-redo` in `.sp-toolbar` oben links) über schnappschuss-basierte Undo/Redo-Stacks: `commit()` nach jeder Aktion (Tipp-Eingaben gesammelt via `commitDebounced`), `applyState()` stellt einen JSON-Schnappschuss wieder her. Auswahl/Verlauf/Speichern hält das Modul. **Wichtig:** SeatTable kommt aus einem async nachgeladenen Bündel → `init` läuft erst, wenn `window.SeatTable` da ist (Guard: sofort oder bei `window 'load'`); SeatTable **nicht** auf Modul-Eval-Ebene referenzieren. Eigene Settings: `ui-sitzplan-einteilung.js` (**💾 Als PDF speichern** / **📂 PDF laden** / 🖨️ Drucken / ↺ Zurücksetzen — über `SettingsBuilder`; keine Gruppen-UI). **PDF (ohne Bibliothek, Muster wie `gruppen-einteilung`):** `buildPdfBytes()` zeichnet den Plan **grafisch** auf A4 quer — Tische als rotierte Rechteck-Polygone, Stühle als Bézier-Kreise, Namen als Text; Geometrie aus `SeatTable.cornersPlan()/.chairSeats()`; skaliert/zentriert über die Bounding-Box. Daten hängen als `%SITZPLANDATA:<base64-JSON>` **hinter `%%EOF`**; `handleFile()` liest sie byte-genau (Latin-1) zurück → **re-importierbar**. Verstecktes `<input type=file id="sp-file">`. Zustand in `localStorage` (`sitzplan-tables`, JSON Array von `{id,type,label?,cx,cy,w,h,rot,chairs:[{id,side,name}]}` + `sitzplan-pult-removed`; `cleanTables()` speichert nur die echten Modell-Felder). CSS des Moduls: nur Seite/Fläche/Tafel/Leiste (`sp-`); die Tisch-Optik (`st-`) liegt global. Layout: Flex-Spalte über volle Viewport-Höhe, kein Scrollen.

### `testutility/` — Test-Labor für UI-Bausteine
- `testutility.html` (Dashboard) · `testutility.js` (Liste `SNIPPETS` pflegen) · `testutility.css` · `parts-testutility/1…8.*-snippet.html`.

### `Code-Structure/`
- `project-structure.html` — visueller Baum (Browser). Inhaltlich = diese Datei in hübsch.

---

## 6. Anatomie eines Moduls (Beispiel `calculation-operators`)

Ein Modul = ein Ordner mit gleichnamigen `.html` / `.css` / `.js` (+ optional `ui-…`, `animation-…`):

- **`<modul>-<gruppe>.html`** — Markup + lädt Bausteine (siehe Lade-Vertrag §7) + ruft `injectUI('game', {…})`.
- **`<modul>-<gruppe>.js`** — die Spiel-Logik. Typisches Muster: `init…()` erzeugt eine Aufgabe via `NumberGenerator`, rendert ins DOM, hängt `DragDropManager.init(onDrop)` an; lauscht auf `rangeChanged`; bei richtiger Antwort `setTimeout(init…, …)`.
- **`<modul>-<gruppe>.css`** — nur das Layout dieses Moduls.
- **`ui-<modul>-<gruppe>.js`** *(optional)* — modulspezifische Settings über `SettingsBuilder.ready(...)`.

---

## 7. Neues Modul hinzufügen (Rezept)

**Vorgehen: das vorhandene Modul kopieren, das deinem Ziel am nächsten ist** (z. B.
`calculation-operators` für Aufgaben mit Antwort-Optionen), dann anpassen.

1. Ordner `modules/<fach>/<gruppe>/modules-<gruppe>/<neu>-<gruppe>/` anlegen.
2. `<neu>-<gruppe>.html` / `.css` / `.js` erstellen (Namen = Ordnername).
3. In der **HTML** den Lade-Vertrag einhalten — Reihenfolge zählt. Ein Modul (5 Ebenen tief)
   lädt **immer** das UI-Bündel; **Mathe**-Module zusätzlich das Math-Bündel (ein Nicht-Mathe-
   Modul lässt die zwei `math`-Zeilen weg):

   ```html
   <!-- im <head>: -->
   <link rel="stylesheet" href="../../../../../global/ui/bundleimport/global-bundleimport.css">
   <link rel="stylesheet" href="../../../../../global/ui/bundleimport/ui-bundleimport.css">
   <link rel="stylesheet" href="../../../../../global/math/bundleimport/math-bundleimport.css"> <!-- nur Mathe -->
   <link rel="stylesheet" href="<neu>-<gruppe>.css">

   <!-- am Ende des <body>, in dieser Reihenfolge: -->
   <script src="../../../../../global/ui/ui.js"></script>                            <!-- 1. injectUI + SettingsBuilder-Stub -->
   <script src="../../../../../global/ui/bundleimport/ui-bundleimport.js"></script>  <!-- 2. generische Bausteine -->
   <script src="../../../../../global/math/bundleimport/math-bundleimport.js"></script> <!-- 3. nur Mathe -->
   <script src="../../ui-<gruppe>/ui-<gruppe>.js"></script>   <!-- 4. (optional) geteilte Gruppen-Settings -->
   <script src="ui-<neu>-<gruppe>.js"></script>               <!-- 5. (optional) eigene Settings -->
   <script src="<neu>-<gruppe>.js"></script>                  <!-- 6. Spiel-Logik -->
   <script>
     if (typeof injectUI === 'function') {
       injectUI('game', { title:'…', showBack:true, showSettings:true,
                          showExit:true, showFullscreen:true,
                          exitUrl:'../../../../../index.html' });
     }
   </script>
   ```
   *(`../../../../../` = fünf Ebenen hoch bis zum Root: `<modul>/ → modules-<gruppe>/ → <gruppe>/ → <fach>/ → modules/ → Root`. `exitUrl` darf auch entfallen — dann errät `ui.js` ihn aus der `../`-Tiefe.)*
4. **Baukasten-Prinzip (§2) einhalten:** keinen Baustein im Modul nachbauen — neue Elemente/Fähigkeiten kommen nach `global/` (ui vs. math). Settings **immer** über `SettingsBuilder`.
5. Im **Gruppen-Menü** (`menu-<gruppe>.html`) eine `<a class="big-menu-btn …">`-Kachel ergänzen, die auf die neue HTML zeigt (`modules-<gruppe>/<neu>-<gruppe>/<neu>-<gruppe>.html`).
6. **Diese Datei (§5) um das neue Modul ergänzen.**

## 8. Neue Themen-Gruppe oder neues Fach hinzufügen

**Neue Mathe-Gruppe:** eine bestehende Gruppe (z. B. `operators/`) als Schablone nach
`modules/math/<neu>/` kopieren, `menu-<neu>.html` (lädt `global/ui/bundleimport/global-` +
`menu-bundleimport.css`, `injectUI('menu-<neu>', {showBack:true, exitUrl:'../../../index.html'})`)
+ `menu-visuals-<neu>.css`, `modules-<neu>/` mit mind. einem Modul (§7), optional
`ui-<neu>/ui-<neu>.js`. Dann im Root-`index.html` eine Kachel auf `modules/math/<neu>/menu-<neu>.html`.

**Neues Fach (nicht Mathe):** Ordner `modules/<fach>/` anlegen (gleiches Schema). Braucht das
Fach eigene Bausteine, die nicht generisch sind → `global/<fach>/` (`elements/` + `bundleimport/`)
anlegen; die Module laden dann `global/ui/`-Bündel **plus** `global/<fach>/`-Bündel (kein
`global/math/`). **Diese Datei (§5) ergänzen.**

## 9. UI-Baustein isoliert testen

`testutility/` rendert Test-Snippets automatisch. Neues Snippet: HTML in
`parts-testutility/N.<name>-snippet.html` ablegen **und** einen Eintrag in der `SNIPPETS`-Liste
in `testutility/testutility.js` ergänzen — mehr nicht. (Snippets liegen 2 Ebenen tief und laden
die Bündel über `../../global/…`.)

---

## 10. Konventionen-Spickzettel

- **Namen:** alles kebab-case mit Gruppen-Suffix: `<modul>-<gruppe>` (Ordner = Dateinamen). UI-Scripts: `ui-<gruppe>.js` (geteilt) bzw. `ui-<modul>-<gruppe>.js` (eigen).
- **CSS-Klassen (global):** `nb-box`, `nb-card`, `nb-ghost`, `nb-symbol`, `nb-dropzone`/`nb-drop-target`, `nb-option`; `dot-frame` (+ `v-10` (1×10) / `v-20` (2×10), `large`, `mode-minus`, `frozen`); `settings-section`, `settings-cycle-btn`, `settings-row`; `big-menu-btn` (+ Farbe `blue/green/orange/purple/red/teal`), `btn-title`; **SeatTable (`st-`):** `st-table` (+ `st-selected` = in Auswahl, `st-solo` = einzige Auswahl → Griffe, `st-snapped`), `st-body`, `st-label` (Tisch-Beschriftung, z. B. „Pult"), `st-chair` (+ `st-chair-<side>`), `st-chair-name`, `st-handle` (+ `st-handle-rotate`/`st-handle-resize`), `st-add-<side>`, `st-del-table`/`st-del-chair`.
- **Pfad-Tiefen (relativ zum Root):** Modul-Seite = 5 (`../../../../../`), Gruppen-Menü = 3 (`../../../`), testutility-Snippet = 2 (`../../`), testutility-Dashboard = 1 (`../`), Root = 0.
- **Self-lokalisierende Loader:** `ui-/math-/werkzeuge-bundleimport.js` finden ihren Basis-Pfad über den Marker `bundleimport/`; `ui.js`-Auto-Exit über den Marker `global/ui/ui.js`; `ui-moreorless.js` über `/ui-moreorless/`. Diese Marker beim Verschieben beachten.
- **Header-Reset:** `body`/`html`-`margin`/`padding` sind **global 0** (`global/ui/ui.css`). Module setzen body-`margin`/`padding` **nicht** selbst — sonst sitzt die global gebaute Kopfzeile (Zurück-/Exit-Button) je nach Seite versetzt und „springt" beim Navigieren.
- **Sprache:** UI-Texte & Kommentare auf Deutsch.
- **Kein** Build/Test-Runner/Package-Manager. Verifizieren = HTML im Browser öffnen.
- **Stil:** Vanilla JS, `window.*`-Globals, kein `import`/`export`. Neuer Code soll wie der Nachbarcode lesen (Kommentardichte, Benennung, Idiome übernehmen).
