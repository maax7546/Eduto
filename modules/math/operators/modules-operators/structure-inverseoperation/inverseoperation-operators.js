/**
 * INVERSEOPERATION-OPERATORS.JS
 * - Setzt das Rechenzeichen (+/-) korrekt basierend auf dem Modus
 * - Beinhaltet Aufgaben-Logik und UI-Updates
 */
const state = { x: 0, y: 0, z: 0, phase: 1, isAnimating: false, startMode: 'plus-first' };

function initTask() {
    applySettings();
    cleanupClones();
    state.isAnimating = false;
    state.phase = 1;
    
    // Modus aus dem Speicher laden (korrigiert auf den Key aus ui-inverseoperation-operators.js)
    state.startMode = localStorage.getItem('inverse-order') || 'plus-first';
    
    // UI zurücksetzen: Alle Boxen und Symbole verstecken
    document.querySelectorAll('.nb-box, .nb-symbol').forEach(el => {
        el.style.transition = 'none';
        el.classList.add('opacity-0');
        el.classList.remove('opacity-1', 'nb-highlight', 'nb-slot-question', 'correct', 'nb-dropzone', 'nb-drop-target', 'wrong');
    });
    
    // --- ZEICHEN-LOGIK ---
    const topOp = document.getElementById('m-op-symbol');
    const botOp = document.getElementById('p-op-symbol');
    
    // Abfrage angepasst an den Wert 'plus-first'
    if (state.startMode === 'plus-first') {
        if (topOp) topOp.textContent = '+';
        if (botOp) botOp.textContent = '−';
    } else {
        if (topOp) topOp.textContent = '−';
        if (botOp) botOp.textContent = '+';
    }

    // Erste Gleichungs-Reihe (oben) komplett sichtbar machen
    const topArea = document.getElementById('minus-area');
    if (topArea) {
        topArea.querySelectorAll('.nb-box, .nb-symbol').forEach(el => {
            el.classList.remove('opacity-0');
            el.classList.add('opacity-1');
        });
    }

    // Zweite Gleichungs-Reihe (unten) initial verstecken
    const pOp = document.getElementById('p-op-symbol');
    const pEq = document.getElementById('p-eq-symbol');
    if(pOp) { pOp.classList.add('opacity-0'); pOp.classList.remove('opacity-1'); }
    if(pEq) { pEq.classList.add('opacity-0'); pEq.classList.remove('opacity-1'); }

    // Zahlen generieren (Z = Summe/Minuend, X & Y = Summanden/Subtrahend)
    const limits = window.NumberGenerator ? window.NumberGenerator.getLimits() : {max: 10};
    state.z = window.NumberGenerator ? window.NumberGenerator.getRandomNumber(Math.floor(limits.max * 0.4)) : 10;
    if (state.z < 2) state.z = 5;
    
    state.y = Math.floor(Math.random() * (state.z + 1));
    state.x = state.z - state.y;
    
    updateUI();
    generateOptions();
}

function applySettings() {
    const speed = localStorage.getItem('settings-anim-speed') || '1.6';
    document.documentElement.style.setProperty('--anim-speed', speed + 's');
}

function updateUI() {
    const m1 = document.getElementById('m-slot-1');
    const m2 = document.getElementById('m-slot-2');
    const m3 = document.getElementById('m-slot-3');
    
    // Werte für die obere Reihe setzen (Abfrage angepasst)
    if (state.startMode === 'minus-first') {
        if(m1) m1.textContent = state.z; // Z - Y = X
        if(m2) m2.textContent = state.y;
    } else {
        if(m1) m1.textContent = state.x; // X + Y = Z
        if(m2) m2.textContent = state.y;
    }
    
    if (state.phase === 1) {
        if(m3) {
            m3.textContent = ""; 
            m3.className = 'nb-box nb-dropzone nb-drop-target opacity-1';
        }
    } else {
        if(m3) {
            m3.textContent = (state.startMode === 'minus-first') ? state.x : state.z;
            m3.className = 'nb-box nb-card nb-highlight opacity-1';
        }
    }
    
    // Werte für die untere Reihe vorbereiten (Ziele für Animation)
    const p1t = document.getElementById('p-slot-1-target');
    const p2t = document.getElementById('p-slot-2-target');
    const p3 = document.getElementById('p-slot-3');

    if (state.startMode === 'minus-first') {
        if(p1t) p1t.textContent = state.x; // Umkehrung: X + Y = Z
        if(p2t) p2t.textContent = state.y;
    } else {
        if(p1t) p1t.textContent = state.z; // Umkehrung: Z - Y = X
        if(p2t) p2t.textContent = state.y;
    }
    
    if (state.phase === 2) {
        if(p3) {
            p3.textContent = "";
            p3.className = 'nb-box nb-dropzone nb-drop-target opacity-1';
        }
    } else {
        if(p3) {
            p3.textContent = "?";
            p3.className = 'nb-box nb-card nb-slot-question opacity-0'; 
        }
    }

    if (window.DragDropManager) {
        window.DragDropManager.init((val, sourceElem, zone) => checkResult(parseInt(val), sourceElem, zone));
    }
}

function generateOptions() {
    const container = document.getElementById('options-container');
    if (!container) return;
    container.innerHTML = '';
    
    let correctVal;
    if (state.phase === 1) {
        correctVal = (state.startMode === 'minus-first') ? state.x : state.z;
    } else {
        correctVal = (state.startMode === 'minus-first') ? state.z : state.x;
    }

    let choices = [correctVal];
    while(choices.length < 3) {
        let rand = Math.max(0, correctVal + (Math.floor(Math.random() * 7) - 3));
        if (!choices.includes(rand)) choices.push(rand);
    }
    choices.sort((a,b) => a-b);
    
    choices.forEach((val, index) => {
        const btn = document.createElement('div');
        btn.id = `opt-io-${index}-${Math.random().toString(36).substr(2, 4)}`;
        btn.className = 'nb-box nb-option';
        btn.textContent = val;
        btn.setAttribute('data-value', val);
        btn.draggable = true; 
        btn.onclick = () => { if(!state.isAnimating) checkResult(val, btn, getCurrentZone()); };
        container.appendChild(btn);
    });

    if (window.DragDropManager) {
        window.DragDropManager.init((val, sourceElem, zone) => checkResult(parseInt(val), sourceElem, zone));
    }
}

function getCurrentZone() {
    return (state.phase === 1) ? document.getElementById('m-slot-3') : document.getElementById('p-slot-3');
}

function checkResult(val, sourceBtn, zone) {
    let correctVal;
    if (state.phase === 1) {
        correctVal = (state.startMode === 'minus-first') ? state.x : state.z;
    } else {
        correctVal = (state.startMode === 'minus-first') ? state.z : state.x;
    }

    if (val === correctVal) {
        if (state.phase === 1) {
            state.isAnimating = true;
            if (zone) {
                zone.textContent = correctVal;
                zone.classList.add('correct');
            }

            setTimeout(() => {
                const m3 = document.getElementById('m-slot-3');
                if(m3) m3.className = 'nb-box nb-card nb-highlight opacity-1';
                setTimeout(startAnimationSequence, 400); 
            }, 1500); 

        } else {
            if (zone) {
                zone.textContent = correctVal;
                zone.classList.add('correct');
            }
            setTimeout(initTask, 2000);
        }
    } else {
        if (sourceBtn) {
            sourceBtn.classList.add('nb-wrong');
            setTimeout(() => sourceBtn.classList.remove('nb-wrong'), 500);
        }
        if (zone) {
            zone.classList.add('wrong');
        }
    }
}

window.addEventListener('load', initTask);
window.addEventListener('rangeChanged', () => { setTimeout(initTask, 0); });
window.addEventListener('settingsChanged', applySettings);
// Neu: Listener für den Button-Klick aus dem UI-Script
window.addEventListener('orderChanged', initTask);