let n1, n2, sum, bridge, rest;
let helperActive = false;

window.skipDotframe = false;
window.useSplitMode = false;
window.useMinusMode = false;

window.onload = function() {
    initCrossingTens();
    
    const eyeBtn = document.getElementById('helper-toggle');
    eyeBtn.onclick = () => {
        helperActive = !helperActive;
        eyeBtn.classList.toggle('active', helperActive);
        updateHelperMask();
    };
};

function initCrossingTens() {
    resetUI();

    const stdContainer = document.getElementById('container-standard');
    const splitContainer = document.getElementById('container-split');
    const exerciseArea = document.querySelector('.exercise-area');
    
    if(stdContainer) stdContainer.style.display = window.useSplitMode ? 'none' : 'flex';
    if(splitContainer) splitContainer.style.display = window.useSplitMode ? 'flex' : 'none';

    // Padding automatisch anpassen: 
    // Wenn skipDotframe aktiv ist (Feld AUS), wird das 80px Top-Padding genutzt.
    // Wenn skipDotframe inaktiv ist (Feld AN), wird das normale Padding (30px) genutzt.
    if (window.skipDotframe) {
        exerciseArea.classList.add('exercise-area-expanded');
    } else {
        exerciseArea.classList.remove('exercise-area-expanded');
    }

    updateOperatorSymbols();

    if (window.useMinusMode) {
        // Minus mit Zehnerübergang: n1 (Minuend) 11-18, Ergebnis 1-9
        do {
            n1 = Math.floor(Math.random() * 8) + 11; // 11..18
            n2 = Math.floor(Math.random() * 7) + 3;  // 3..9
            sum = n1 - n2;
        } while (sum < 1 || sum > 9 || (n1 - 10) >= n2);

        bridge = n1 - 10;       // Schritt 1: n1 - bridge = 10
        rest = n2 - bridge;     // Schritt 2: 10 - rest = sum
    } else {
        do {
            n1 = Math.floor(Math.random() * 7) + 3;
            n2 = Math.floor(Math.random() * 7) + 3;
            sum = n1 + n2;
        } while (sum <= 10 || sum >= 19);

        bridge = 10 - n1;
        rest = n2 - bridge;
    }

    document.getElementById('r1-n1').textContent = n1;
    document.getElementById('r1-n2').textContent = n2;
    document.getElementById('target-main').setAttribute('data-correct-val', sum);

    document.getElementById('r2-z1').setAttribute('data-correct-val', n1);
    document.getElementById('r2-z2').setAttribute('data-correct-val', bridge);
    document.getElementById('r3-z2').setAttribute('data-correct-val', rest);
    document.getElementById('r3-z3').setAttribute('data-correct-val', sum);

    document.getElementById('split-n1').textContent = n1;
    document.getElementById('split-bridge').setAttribute('data-correct-val', bridge);
    document.getElementById('split-rest').setAttribute('data-correct-val', rest);
    document.getElementById('split-sum').setAttribute('data-correct-val', sum);

    const mainFrame = document.getElementById('main-dotframe');
    if (mainFrame) mainFrame.classList.toggle('mode-minus', !!window.useMinusMode);

    if (typeof renderDotframes === 'function') renderDotframes();
    
    const dotFrame = document.querySelector('.dot-frame');
    if (dotFrame) {
        dotFrame.removeEventListener('click', checkDots);
        dotFrame.addEventListener('click', checkDots);
    }

    if (window.skipDotframe) {
        applySkipLogicInternal();
    }
}

function updateOperatorSymbols() {
    const op = window.useMinusMode ? '−' : '+';
    document.querySelectorAll('.math-row .nb-symbol').forEach(el => {
        if (el.textContent.trim() !== '=') el.textContent = op;
    });
}

function resetUI() {
    const dropzones = document.querySelectorAll('.nb-dropzone');
    dropzones.forEach(z => {
        z.classList.remove('correct', 'wrong', 'step-hidden', 'nb-box-small', 'nb-box-large');
        z.textContent = '';
        if(z.id === 'target-main') z.classList.add('step-hidden');
    });

    const ghosts = document.querySelectorAll('.nb-ghost');
    ghosts.forEach(g => {
        g.classList.remove('nb-box-small', 'nb-box-large');
    });

    const frame = document.getElementById('main-dotframe');
    if (frame) {
        frame.setAttribute('data-red', '0');
        frame.setAttribute('data-blue', '0');
        frame.innerHTML = ''; 
    }

    document.querySelector('.rechnung2').classList.add('step-hidden-row');
    document.querySelector('.rechnung3').classList.add('step-hidden-row');
    document.querySelector('.rechnung-split').classList.add('step-hidden-row');
    
    const wrapper = document.querySelector('.dotframe-wrapper');
    if (wrapper) wrapper.style.display = 'flex';

    const optContainer = document.getElementById('options-container');
    optContainer.innerHTML = '';
    optContainer.classList.add('step-hidden');
    
    updateHelperMask();
}

function applySkipLogicInternal() {
    const wrapper = document.querySelector('.dotframe-wrapper');
    if (wrapper) wrapper.style.display = 'none';

    if (window.useSplitMode) {
        document.querySelector('.rechnung-split').classList.remove('step-hidden-row');
    } else {
        document.querySelector('.rechnung2').classList.remove('step-hidden-row');
    }
    
    setupOptions();
    updateHelperMask();
}

function updateHelperMask() {
    const frame = document.getElementById('main-dotframe');
    if(!frame) return;
    frame.classList.remove('mask-bottom', 'mask-top');
    if (!helperActive) return;

    const targetVisible = !document.getElementById('target-main').classList.contains('step-hidden');

    // Bei Minus ist die Reihenfolge umgekehrt: erst untere Reihe sichtbar, dann obere.
    const firstMask = window.useMinusMode ? 'mask-top' : 'mask-bottom';
    const secondMask = window.useMinusMode ? 'mask-bottom' : 'mask-top';

    if (window.useSplitMode) {
        const splitVisible = !document.querySelector('.rechnung-split').classList.contains('step-hidden-row');
        if (!targetVisible && splitVisible) frame.classList.add(firstMask);
    } else {
        const r2Visible = !document.querySelector('.rechnung2').classList.contains('step-hidden-row');
        const r3Visible = !document.querySelector('.rechnung3').classList.contains('step-hidden-row');
        if (!targetVisible) {
            if (r3Visible) frame.classList.add(secondMask);
            else if (r2Visible) frame.classList.add(firstMask);
        }
    }
}

function setupOptions() {
    const container = document.getElementById('options-container');
    if (!container) return;
    container.classList.remove('step-hidden');

    let pool = [n1, bridge, rest, sum];
    while(pool.length < 8) {
        let fake = Math.floor(Math.random() * 19) + 1;
        if(!pool.includes(fake) && fake !== 10) pool.push(fake);
    }
    pool.sort(() => Math.random() - 0.5);
    
    container.innerHTML = '';
    pool.forEach((v, i) => {
        const opt = document.createElement('div');
        opt.className = 'nb-box nb-option nb-box-small';
        opt.setAttribute('draggable', 'true');
        opt.id = 'opt-' + i;
        opt.textContent = v;

        // Drag-Bild kommt global aus draganddrop.js (schattenloser Klon) —
        // hier kein eigenes Ghost-Handling mehr nötig.

        container.appendChild(opt);
    });

    if (window.DragDropManager) {
        window.DragDropManager.init(handleDrop);
    }
}

function checkDots() {
    const red = document.querySelectorAll('.dot.red').length;
    const second = window.useMinusMode
        ? document.querySelectorAll('.dot.struck').length
        : document.querySelectorAll('.dot.blue').length;

    if (red === n1 && second === n2) {
        if (window.useSplitMode) {
            document.querySelector('.rechnung-split').classList.remove('step-hidden-row');
        } else {
            document.querySelector('.rechnung2').classList.remove('step-hidden-row');
        }
        setupOptions();
        updateHelperMask();
    }
}

function handleDrop(value, sourceElem, zone) {
    if (value == zone.getAttribute('data-correct-val')) {
        zone.classList.add('correct');
        zone.classList.remove('nb-box-small'); 
        zone.textContent = value; 
        checkStepProgress();
    } else {
        zone.classList.add('wrong');
        setTimeout(() => zone.classList.remove('wrong'), 1000);
    }
}

function checkStepProgress() {
    if (window.useSplitMode) {
        const splitDone = Array.from(document.querySelectorAll('.rechnung-split .nb-dropzone')).every(z => z.classList.contains('correct'));
        if (splitDone) {
            const mainTarget = document.getElementById('target-main');
            mainTarget.textContent = sum;
            mainTarget.classList.remove('step-hidden');
            mainTarget.classList.add('correct');
            finishRound();
        }
    } else {
        const r2Done = Array.from(document.querySelectorAll('.rechnung2 .nb-dropzone')).every(z => z.classList.contains('correct'));
        if (r2Done) {
            document.querySelector('.rechnung3').classList.remove('step-hidden-row');
            updateHelperMask();
        }
        const r3Done = Array.from(document.querySelectorAll('.rechnung3 .nb-dropzone')).every(z => z.classList.contains('correct'));
        if (r3Done) {
            document.getElementById('target-main').classList.remove('step-hidden');
            updateHelperMask();
        }
        if (document.getElementById('target-main').classList.contains('correct')) {
            finishRound();
        }
    }
}

function finishRound() {
    setTimeout(() => {
        initCrossingTens();
    }, 3000);
}