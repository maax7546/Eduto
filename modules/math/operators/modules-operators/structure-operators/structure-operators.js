/**
 * STRUCTURE-OPERATORS.JS
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
    
    const limits = window.NumberGenerator ? window.NumberGenerator.getLimits() : {max: 10};
    let smartThreshold = (limits.max === 100) ? 21 : (limits.max === 20 ? 11 : 0);

    state.z = window.NumberGenerator ? window.NumberGenerator.getRandomNumber(smartThreshold) : 10;
    state.x = Math.floor(Math.random() * (state.z + 1));
    state.y = state.z - state.x;

    updateUI();
    generateOptions();
    
    // Initialisierung des DragDropManagers mit dem korrekten Callback
    if (window.DragDropManager) {
        window.DragDropManager.init((val, sourceElem, zone) => checkResult(parseInt(val), sourceElem, zone));
    }
    
    setTimeout(() => area.classList.remove('no-animation'), 50);
}

function applySettings() {
    const speed = localStorage.getItem('settings-anim-speed') || '1.6';
    document.documentElement.style.setProperty('--anim-speed', speed + 's');
}

function updateUI() {
    document.getElementById('slot-1').textContent = state.x;
    document.getElementById('slot-2').textContent = state.y;
    
    const resultSlot = document.getElementById('slot-3');
    resultSlot.textContent = ""; // Leer lassen für das CSS-Fragezeichen
    // Nutzt nb-dropzone für den einheitlichen Look
    resultSlot.className = 'nb-box nb-dropzone nb-drop-target';
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
        opt.onclick = () => {
            if (!state.isAnimating) {
                const zone = document.getElementById('slot-3');
                checkResult(val, opt, zone);
            }
        };
        container.appendChild(opt);
    });
}

function checkResult(val, sourceBtn, zone) {
    if (state.isAnimating) return;
    const resultSlot = zone || document.getElementById('slot-3');
    
    if (val === state.z) {
        state.isAnimating = true;
        resultSlot.textContent = state.z;
        
        // Feedback-Klassen wie in Vorlage
        resultSlot.classList.remove('wrong');
        resultSlot.classList.add('correct');

        setTimeout(() => {
            if (state.phase === 1) {
                // Zurücksetzen zur Dropzone für Phase 2
                resultSlot.textContent = "";
                resultSlot.className = 'nb-box nb-dropzone nb-drop-target';
                startSwapPhase();
            } else {
                initTask();
            }
        }, 1200); 
    } else {
        // Fehler-Feedback
        if (sourceBtn) {
            sourceBtn.classList.add('nb-wrong');
            setTimeout(() => sourceBtn.classList.remove('nb-wrong'), 500);
        }
        if (resultSlot) {
            resultSlot.classList.add('wrong');
        }
    }
}

window.addEventListener('load', initTask);
window.addEventListener('rangeChanged', () => { setTimeout(initTask, 0); });
window.addEventListener('settingsChanged', applySettings);