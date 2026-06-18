/**
 * COMMUTATIVELAW-OPERATORS.JS
 */
const state = { x: 0, y: 0, z: 0, phase: 1, isAnimating: false };

function initTask() {
    const area = document.getElementById('equation-area');
    if (!area) return;

    applySettings();
    state.isAnimating = false;
    state.phase = 1;

    area.classList.add('no-animation');
    area.classList.remove('swapped'); 
    
    // --- ZAHLEN-LOGIK (angepasst an structure-operators.js) ---
    const limits = window.NumberGenerator ? window.NumberGenerator.getLimits() : {max: 10};
    
    // Setzt die Untergrenze: Bei Zahlenraum 100 -> min. 21, bei Zahlenraum 20 -> min. 11
    let smartThreshold = (limits.max === 100) ? 21 : (limits.max === 20 ? 11 : 0);

    // Generiert Z (das Ergebnis) unter Berücksichtigung der Untergrenze
    state.z = window.NumberGenerator ? window.NumberGenerator.getRandomNumber(smartThreshold) : 10;
    
    // Sicherheitshalber: Falls Z 0 ist (im 10er Raum), auf 5 setzen
    if (state.z === 0) state.z = 5; 
    
    state.x = Math.floor(Math.random() * (state.z + 1));
    state.y = state.z - state.x;

    updateUI();
    generateOptions();
    
    if (window.DragDropManager) {
        window.DragDropManager.init((val, sourceElem, zone) => checkResult(parseInt(val), sourceElem, zone));
    }
    
    setTimeout(() => area.classList.remove('no-animation'), 50);
}

function updateUI() {
    document.getElementById('slot-1').textContent = state.x;
    document.getElementById('slot-2').textContent = state.y;
    
    const resultSlot = document.getElementById('slot-3');
    resultSlot.textContent = ""; 
    resultSlot.className = 'nb-box nb-dropzone nb-drop-target';
}

function checkResult(val, sourceBtn, zone) {
    if (state.isAnimating) return;
    
    const resultSlot = zone || document.getElementById('slot-3');
    
    if (val === state.z) {
        state.isAnimating = true;
        resultSlot.textContent = state.z;
        
        resultSlot.classList.remove('wrong');
        resultSlot.classList.add('correct');

        setTimeout(() => {
            if (state.phase === 1) {
                resultSlot.textContent = "";
                resultSlot.className = 'nb-box nb-dropzone nb-drop-target';
                startSwapPhase();
            } else {
                initTask();
            }
        }, 1200); 
    } else {
        resultSlot.classList.remove('correct');
        resultSlot.classList.add('wrong');
        setTimeout(() => resultSlot.classList.remove('wrong'), 800);
        
        if (sourceBtn) {
            sourceBtn.classList.add('wrong');
            setTimeout(() => sourceBtn.classList.remove('wrong'), 500);
        }
    }
}

function generateOptions() {
    const container = document.getElementById('options-container');
    if (!container) return;
    container.innerHTML = '';

    const opts = [state.z];
    while (opts.length < 3) {
        let fake = Math.floor(Math.random() * (state.z + 10));
        if (!opts.includes(fake)) opts.push(fake);
    }
    opts.sort(() => Math.random() - 0.5);

    opts.forEach((val, i) => {
        const opt = document.createElement('div');
        opt.id = `opt-${i}`;
        opt.className = 'nb-box nb-option';
        opt.textContent = val;
        opt.setAttribute('data-value', val);
        opt.draggable = true;
        opt.onclick = () => checkResult(val, opt);
        container.appendChild(opt);
    });
}

function applySettings() {
    const speed = localStorage.getItem('settings-anim-speed') || '1.6';
    document.documentElement.style.setProperty('--anim-speed', speed + 's');
}

// Event-Listener für Initialisierung und Updates
window.addEventListener('load', initTask);
window.addEventListener('rangeChanged', () => { setTimeout(initTask, 0); });
window.addEventListener('settingsChanged', applySettings);