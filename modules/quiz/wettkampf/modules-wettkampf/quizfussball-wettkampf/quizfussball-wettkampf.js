/**
 * QUIZFUSSBALL — Spiel-Logik (Fach: quiz / Gruppe: wettkampf)
 *
 * Reine Modul-Regie: Spielzustand, Feldaufbau (Fußballfeld bzw. Pferderennbahn),
 * Angriffe, Tore/Runden, Undo. Header/Navigation/Vollbild liefert global/ui
 * (injectUI). Die Konfig-Toggles (Modus, Generator, Feldgröße, Reset) liegen im
 * Settings-Dropdown (ui-quizfussball-wettkampf.js via SettingsBuilder) und rufen
 * die hier definierten window-Funktionen setMode/setGenerator/setFieldSize/resetGame.
 * Undo, Angriffe und der Trikot-Generator bleiben als Steuerung auf dem Spielfeld.
 */

// Ball & Feld
let fieldSizes = [5,7,9,11,13];
let currentFieldIndex = 3; // Start bei 9

let gameMode = "football"; // "football" | "horse"

let cells = document.querySelectorAll(".cell");
let ballPosition = 4;
let ballPositionRed = 0;
let ballPositionBlue = 0;
let scoreRed = 0;
let scoreBlue = 0;
// Variablen für letzte Positionen / Scores (Undo)
let lastBallPosition = null;
let lastScoreRed = 0;
let lastScoreBlue = 0;
let lastBallPositionRed = 0;
let lastBallPositionBlue = 0;

// Titel im globalen Header je nach Modus setzen.
// Der Header wird erst durch injectUI() aufgebaut — daher Guard: läuft die
// Init-Phase davor, ist .header-title noch nicht da (injectUI setzt dann den
// Starttitel selbst). Bei jedem Modus-Wechsel ist der Header längst vorhanden.
function updateHeaderTitle() {
    const titleEl = document.querySelector('.header-title');
    if (!titleEl) return;
    titleEl.textContent = gameMode === "football" ? "Quizfussball ⚽" : "Pferderennenquiz 🐎";
}

function buildField(size){
    const field = document.querySelector(".field");
    // Reset field
    field.innerHTML = "";
    // Remove possible .race-track class
    field.classList.remove("race-track");
    field.classList.remove("inactive");
    field.style.position = "";
    field.style.width = "";
    field.style.height = "";
    field.style.gridTemplateColumns = "";
    field.style.gridTemplateRows = "";

    if(gameMode === "horse"){
        // Pferderennen: Ovale Rennbahn
        field.classList.add("race-track");
        field.style.position = "relative";
        // Feldgröße wird über CSS gesteuert, keine feste Breite/Höhe mehr
        field.style.background = "#e0c097"; // dunklere Sandfarbe
        // Oval-Positionen berechnen. Die Zellgröße leiten wir aus der aktuellen
        // Container-Größe ab (responsiv); davon hängen Rand-Abstand (margin) und
        // Zentrier-Offset (halbe Zellgröße) ab — so bleibt das Oval bei jeder
        // Fenstergröße korrekt zentriert.
        const rect = field.getBoundingClientRect();
        const cellSize = Math.max(48, Math.min(90, Math.min(rect.width, rect.height) * 0.14));
        const off = cellSize / 2;        // halbe Zelle → zentriert die Zelle auf der Bahn
        const margin = cellSize * 1.1;   // Abstand zum weißen Rand
        let rx = rect.width / 2 - margin;
        let ry = rect.height / 2 - margin;
        let cx = rect.width / 2;
        let cy = rect.height / 2;
        for(let i=0;i<size;i++){
            const angle = - (2*Math.PI * i) / size - Math.PI/2; // linksherum
            const x = cx + rx * Math.cos(angle) - off;
            const y = cy + ry * Math.sin(angle) - off;
            const cell = document.createElement("div");
            cell.className = "race-cell";
            cell.style.left = x+"px";
            cell.style.top = y+"px";
            cell.style.width = cellSize+"px";
            cell.style.height = cellSize+"px";

            // Start/Ziel markieren
            if(i===0){
                cell.style.fontWeight = "bold";
                cell.innerText = "🏁 START/ZIEL"; // Zielflagge hinzufügen
            }
            field.appendChild(cell);
        }

        // Tribüne in der Mitte des Ovals
        const tribune = document.createElement("div");
        tribune.style.position = "absolute";
        tribune.style.width = "200px";
        tribune.style.height = "80px";
        tribune.style.background = "brown";
        tribune.style.border = "4px solid #444";
        tribune.style.borderRadius = "12px";
        tribune.style.left = (cx - 100) + "px"; // halbierte Breite
        tribune.style.top = (cy - 40) + "px"; // halbierte Höhe
        tribune.style.zIndex = "0";
        tribune.innerText = "Tribüne";
        tribune.style.color = "white";
        tribune.style.display = "flex";
        tribune.style.alignItems = "center";
        tribune.style.justifyContent = "center";
        field.appendChild(tribune);

        // Setze Pferde an Start
        ballPositionRed = 0;
        ballPositionBlue = 0;
        cells = field.querySelectorAll(".race-cell");
        // Sichtbarkeit: nur Race-Track anzeigen
        field.classList.remove("inactive");
    } else {
        // Fußballfeld (linear)
        field.classList.remove("race-track");
        field.style.background = ""; // Reset background
        field.style.width = "";
        field.style.height = "";
        field.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        for(let i=0;i<size;i++){
            const cell = document.createElement("div");
            cell.className = "cell";
            if(i===0){ cell.classList.add("goal-red"); cell.innerText="ROT"; }
            if(i===size-1){ cell.classList.add("goal-blue"); cell.innerText="BLAU"; }
            field.appendChild(cell);
        }
        ballPosition = Math.floor(size/2);
        cells = document.querySelectorAll(".cell");
        // Sichtbarkeit: nur Fußballfeld anzeigen
        field.classList.remove("inactive");
    }
    // Sichtbarkeit der Felder steuern
    updateFieldVisibility();
}

function updateFieldVisibility() {
    // Die .field ist immer das eine Feld, aber sie kann .race-track haben oder nicht.
    const field = document.querySelector('.field');
    const stadium = document.querySelector('.stadium');
    if (gameMode === "football") {
        field.classList.remove('inactive');
        field.classList.remove('race-track');
        field.style.background = ""; // Reset background
        stadium.classList.remove('sand-bg');
        stadium.classList.add('football-bg');
        document.body.style.backgroundColor = "#1b5e20";
        // Zeige Mittel-Linie und Kreis
        stadium.querySelector('.middle-line').style.display = '';
        stadium.querySelector('.center-circle').style.display = '';
    } else if (gameMode === "horse") {
        field.classList.remove('inactive');
        field.classList.add('race-track');
        field.style.background = "#e0c097"; // dunklere Sandfarbe für die Rennbahn
        stadium.classList.remove('football-bg');
        stadium.classList.add('sand-bg');
        document.body.style.backgroundColor = "#f2dab4";
        // Verstecke Mittel-Linie und Kreis
        stadium.querySelector('.middle-line').style.display = 'none';
        stadium.querySelector('.center-circle').style.display = 'none';
    }
    // Titel im globalen Header an den Modus anpassen
    updateHeaderTitle();
}

function drawBall() {
    if(gameMode === "horse"){
        // Pferde auf Kreisbahn
        cells.forEach((cell, idx) => { cell.innerHTML = ""; });
        // Rotes Pferd
        cells[ballPositionRed].innerHTML +=
            "<span class='horse-red' style='position:relative; z-index:4;'>🐎<span style='position:absolute; left:50%; top:50%; transform: translate(-50%, -50%); font-size:28px;'>🔴</span></span>";
        // Blaues Pferd (nicht auf gleichem Feld doppelt zeigen)
        if(ballPositionBlue !== ballPositionRed){
            cells[ballPositionBlue].innerHTML +=
                "<span class='horse-blue' style='position:relative; z-index:3;'>🐎<span style='position:absolute; left:50%; top:50%; transform: translate(-50%, -50%); font-size:28px;'>🔵</span></span>";
        } else {
            // Wenn beide auf gleichem Feld: beide anzeigen
            cells[ballPositionRed].innerHTML +=
                "<span class='horse-blue' style='position:relative; z-index:5; margin-left:-40px;'>🐎<span style='position:absolute; left:50%; top:50%; transform: translate(-50%, -50%); font-size:28px;'>🔵</span></span>";
        }
        // Pferd spiegeln, wenn im unteren Teil der Rennbahn
        cells.forEach((cell, idx) => {
            const horse = cell.querySelector('.horse-red, .horse-blue');
            if(!horse) return;
            // Ermittle Mittelpunkt der Zelle relativ zum Stadion
            const rect = cell.getBoundingClientRect();
            const centerY = rect.top + rect.height/2;
            const stadiumRect = document.querySelector('.stadium').getBoundingClientRect();
            // Spiegeln, wenn unterhalb der Hälfte
            if(centerY > stadiumRect.top + stadiumRect.height/2){
                // Prüfe, ob bereits transform gesetzt ist
                let prev = horse.style.transform || "";
                // Entferne evtl. vorherige scaleX(-1)
                prev = prev.replace(/\s*scaleX\(-1\)/, "");
                horse.style.transform = prev + " scaleX(-1)";
            } else {
                // Entferne evtl. vorherige scaleX(-1)
                let prev = horse.style.transform || "";
                prev = prev.replace(/\s*scaleX\(-1\)/, "");
                horse.style.transform = prev;
            }
        });
    } else {
        cells.forEach(cell => {
            cell.innerHTML = "";
            if(gameMode === "football"){
                if(cell.classList.contains("goal-red")) cell.innerHTML = "ROT";
                if(cell.classList.contains("goal-blue")) cell.innerHTML = "BLAU";
            }
        });
        if(gameMode === "football"){
            cells[ballPosition].innerHTML += "<span class='ball'>⚽</span>";
        }
    }
}

// Angriff-Funktionen
let lastMove = null; // speichert letzte Aktion: "red" oder "blue"

function shoot(emoji){
    const el = document.createElement("div");
    el.className = "shot";
    el.innerText = emoji;
    el.style.left = (window.innerWidth/2 - 70) + "px";
    el.style.top = (window.innerHeight - 200) + "px";
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),800);
}

function redAttacks() {
    shoot("🔴");
    lastMove = "red";
    if(gameMode === "football"){
        // Speichere letzte Positionen/Scores
        lastBallPosition = ballPosition;
        lastScoreRed = scoreRed;
        lastScoreBlue = scoreBlue;
        if(ballPosition<cells.length-1){ ballPosition++; checkGoal(); drawBall(); }
    } else {
        lastBallPositionRed = ballPositionRed;
        // Pferd einen Schritt gegen den Uhrzeigersinn (linksherum)
        let prevRed = ballPositionRed;
        ballPositionRed = (ballPositionRed-1 + cells.length)%cells.length;
        // Prüfe, ob eine Runde abgeschlossen wurde (bei Rückkehr zum Startfeld, aber nicht beim Startschuss)
        if (prevRed !== 0 && ballPositionRed === 0) {
            scoreRed++;
            document.getElementById("scoreRed").innerText = scoreRed;
        }
        drawBall();
    }
}

function blueAttacks() {
    shoot("🔵");
    lastMove = "blue";
    if(gameMode === "football"){
        // Speichere letzte Positionen/Scores
        lastBallPosition = ballPosition;
        lastScoreRed = scoreRed;
        lastScoreBlue = scoreBlue;
        if(ballPosition>0){ ballPosition--; checkGoal(); drawBall(); }
    } else {
        lastBallPositionBlue = ballPositionBlue;
        // Pferd einen Schritt gegen den Uhrzeigersinn (linksherum)
        let prevBlue = ballPositionBlue;
        ballPositionBlue = (ballPositionBlue-1 + cells.length)%cells.length;
        // Prüfe, ob eine Runde abgeschlossen wurde
        if (prevBlue !== 0 && ballPositionBlue === 0) {
            scoreBlue++;
            document.getElementById("scoreBlue").innerText = scoreBlue;
        }
        drawBall();
    }
}

function undoMove() {
    if(gameMode === "football" && lastBallPosition !== null){
        ballPosition = lastBallPosition;
        scoreRed = lastScoreRed;
        scoreBlue = lastScoreBlue;
        document.getElementById("scoreRed").innerText = scoreRed;
        document.getElementById("scoreBlue").innerText = scoreBlue;
        drawBall();
        lastBallPosition = null;
        lastMove = null;
        return;
    }
    if(gameMode === "horse"){
        if(lastMove === "red"){
            // Prüfe, ob letzter Move eine Runde abgeschlossen hat
            if (lastBallPositionRed !== 0 && ballPositionRed === 0 && scoreRed > 0) {
                scoreRed--;
                document.getElementById("scoreRed").innerText = scoreRed;
            }
            ballPositionRed = lastBallPositionRed;
            drawBall();
            lastMove = null;
        } else if(lastMove === "blue"){
            if (lastBallPositionBlue !== 0 && ballPositionBlue === 0 && scoreBlue > 0) {
                scoreBlue--;
                document.getElementById("scoreBlue").innerText = scoreBlue;
            }
            ballPositionBlue = lastBallPositionBlue;
            drawBall();
            lastMove = null;
        }
    }
}

function checkGoal() {
    if(gameMode === "horse") return;
    if(ballPosition===0){
        scoreBlue++;
        document.getElementById("scoreBlue").innerText = scoreBlue;
        showGoal("🔵 TOR!");
    }
    if(ballPosition===cells.length-1){
        scoreRed++;
        document.getElementById("scoreRed").innerText = scoreRed;
        showGoal("🔴 TOR!");
    }
    if(ballPosition===0 || ballPosition===cells.length-1) ballPosition=Math.floor(cells.length/2);
}

// Zufallstrikot
let currentGenerator = 'number';
const jersey = document.getElementById('middleJersey');
const numbers = [1,2,3,4,5,6,7,8];
const letters = ["A","B","C","D","E"];

// Vom Settings-Dropdown aufgerufen (Generator-Toggle).
function setGenerator(gen) {
    currentGenerator = gen; // 'number' | 'letter'
    jersey.querySelector('span').innerText = currentGenerator==='number' ? '7' : 'A';
}

function triggerRandom() {
    let values = currentGenerator==='number' ? numbers : letters;
    let i=0;
    const interval = setInterval(()=>{
        jersey.querySelector('span').innerText = values[Math.floor(Math.random()*values.length)];
        i++;
        if(i>10) clearInterval(interval);
    },50);
}

// Vom Settings-Dropdown aufgerufen (Feldgröße-Toggle).
function setFieldSize(size){
    const idx = fieldSizes.indexOf(size);
    if (idx !== -1) currentFieldIndex = idx;
    buildField(fieldSizes[currentFieldIndex]);
    drawBall();
}

// Vom Settings-Dropdown aufgerufen (Modus-Toggle: Fußball / Pferderennen).
function setMode(mode){
    gameMode = mode; // "football" | "horse"

    scoreRed = 0;
    scoreBlue = 0;
    document.getElementById("scoreRed").innerText = 0;
    document.getElementById("scoreBlue").innerText = 0;

    if(gameMode === "horse"){
        ballPositionRed = 0;
        ballPositionBlue = 0;
    }

    buildField(fieldSizes[currentFieldIndex]);
    updateFieldVisibility();
    drawBall();
}

// Vom Settings-Dropdown aufgerufen (Reset-Aktion).
function resetGame() {
    if(gameMode === "horse"){
        ballPositionRed = 0;
        ballPositionBlue = 0;
    } else {
        ballPosition = Math.floor(cells.length/2);
    }
    scoreRed = 0;
    scoreBlue = 0;
    document.getElementById("scoreRed").innerText = 0;
    document.getElementById("scoreBlue").innerText = 0;
    drawBall();
}

function showGoal(text){
    if(gameMode === "horse") return;
    // Sound ist optional: goal.mp3 muss neben dieser Datei liegen, sonst bleibt es
    // einfach stumm (kein Fehler). Lazy-Abfrage, da das <audio>-Element nach dem
    // Script im DOM steht.
    const goalSound = document.getElementById("goalSound");
    if (goalSound) {
        try {
            goalSound.currentTime = 0;
            const p = goalSound.play();
            if (p && typeof p.catch === 'function') p.catch(()=>{});
        } catch (e) { /* Sound nicht verfügbar — ignorieren */ }
    }
    const el = document.createElement("div");
    el.className = "goal-animation";
    el.innerText = text;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),1800);
}

// Initialisierung (Start im Fußballmodus, Feldgröße 9)
jersey.querySelector('span').innerText='7';
ballPositionRed = 0;
ballPositionBlue = 0;
// Setze Stadion-Hintergrund für Fußball
document.querySelector('.stadium').classList.add('football-bg');
document.body.style.backgroundColor = "#1b5e20";
// Header-Titel (falls Header schon da; sonst setzt injectUI den Starttitel)
updateHeaderTitle();
buildField(9);
drawBall();

// Das Fußballfeld skaliert rein über CSS (vh/vw) live mit — da ist nichts zu tun.
// Die ovale Pferderennbahn ist dagegen in JS aus der Container-Größe positioniert
// und muss bei Fenster-/Vollbild-Änderung neu berechnet werden. Debounced, und die
// Pferdepositionen werden über den Neuaufbau hinweg erhalten.
let resizeTimer = null;
window.addEventListener('resize', () => {
    if (gameMode !== 'horse') return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const r = ballPositionRed, b = ballPositionBlue;
        buildField(fieldSizes[currentFieldIndex]);
        ballPositionRed = r;
        ballPositionBlue = b;
        drawBall();
    }, 150);
});
