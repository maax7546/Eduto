/**
 * CALCULATION-OPERATORS.JS
 * Einfache Plus-/Minus-Aufgaben im gewählten Zahlenraum.
 * Wenn das Zehner-/Zwanzigerfeld sichtbar ist, muss es zuerst passend
 * gefüllt werden — die Antwortoptionen erscheinen erst danach.
 */
const state = { n1: 0, n2: 0, result: 0, isAnimating: false, dotsRequired: false, optionsShown: false };

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initCalculation() {
    const area = document.getElementById('equation-area');
    if (!area) return;

    state.isAnimating = false;
    state.optionsShown = false;

    const limits = window.NumberGenerator ? window.NumberGenerator.getLimits() : { min: 0, max: 10 };
    const max = limits.max;
    const isMinus = !!window.useMinusMode;

    // Gleichverteilte Zahlen im Bereich [0, max] — kein smartMin-Bias.
    if (isMinus) {
        state.n1 = randInt(0, max);
        state.n2 = randInt(0, state.n1);
        state.result = state.n1 - state.n2;
    } else {
        state.n1 = randInt(0, max);
        state.n2 = randInt(0, max - state.n1);
        state.result = state.n1 + state.n2;
    }

    const dotsVisible = updateDotframe(max, isMinus);
    state.dotsRequired = dotsVisible;

    updateUI(isMinus);
    clearOptions();

    if (!dotsVisible) {
        showOptions();
    }
}

function updateDotframe(max, isMinus) {
    const wrapper = document.getElementById('dotframe-wrapper');
    const frame = document.getElementById('main-dotframe');
    if (!wrapper || !frame) return false;

    const visible = window.showDotframe !== false && max <= 20;
    wrapper.classList.toggle('hidden', !visible);
    if (!visible) return false;

    frame.classList.remove('v-10', 'v-20', 'frozen');
    frame.classList.add(max <= 10 ? 'v-10' : 'v-20');
    frame.classList.toggle('mode-minus', isMinus);

    // Leer starten – Schüler:in füllt das Feld passend zur Aufgabe.
    frame.setAttribute('data-red', '0');
    frame.setAttribute('data-blue', '0');

    if (typeof window.renderDotframes === 'function') {
        window.renderDotframes();
    }
    return true;
}

function updateUI(isMinus) {
    document.getElementById('slot-1').textContent = state.n1;
    document.getElementById('op-symbol').textContent = isMinus ? '−' : '+';
    document.getElementById('slot-2').textContent = state.n2;

    const resultSlot = document.getElementById('slot-3');
    resultSlot.textContent = '';
    resultSlot.className = 'nb-box nb-dropzone nb-drop-target';
    resultSlot.setAttribute('data-correct-val', String(state.result));
}

function clearOptions() {
    const container = document.getElementById('options-container');
    if (container) container.innerHTML = '';
}

function showOptions() {
    if (state.optionsShown) return;
    state.optionsShown = true;

    const limits = window.NumberGenerator ? window.NumberGenerator.getLimits() : { min: 0, max: 10 };
    const max = limits.max;
    const container = document.getElementById('options-container');
    if (!container) return;

    const opts = new Set([state.result]);
    const range = Math.max(max, 10);
    let safety = 0;
    while (opts.size < 3 && safety++ < 50) {
        const delta = randInt(1, 5) * (Math.random() < 0.5 ? -1 : 1);
        const candidate = state.result + delta;
        if (candidate >= 0 && candidate <= range) opts.add(candidate);
    }
    while (opts.size < 3) {
        opts.add(randInt(0, range));
    }

    const list = Array.from(opts).sort(() => Math.random() - 0.5);
    container.innerHTML = '';
    list.forEach((val, i) => {
        const opt = document.createElement('div');
        opt.id = `opt-${i}`;
        opt.className = 'nb-box nb-option';
        opt.textContent = val;
        opt.setAttribute('data-value', val);
        opt.draggable = true;
        container.appendChild(opt);
    });

    if (window.DragDropManager) {
        window.DragDropManager.init(handleDrop);
    }
}

// Wird automatisch von dotframe.js bei jedem Klick aufgerufen.
window.checkDots = function () {
    if (!state.dotsRequired || state.optionsShown) return;
    const frame = document.getElementById('main-dotframe');
    if (!frame) return;
    const red = parseInt(frame.getAttribute('data-red')) || 0;
    const blue = parseInt(frame.getAttribute('data-blue')) || 0;
    const isMinus = !!window.useMinusMode;

    // Plus: rote = n1, blaue = n2.
    // Minus: rot+blau = n1 (Minuend), blau = n2 (durchgestrichen).
    const ok = isMinus
        ? (red + blue === state.n1 && blue === state.n2)
        : (red === state.n1 && blue === state.n2);

    if (ok) {
        frame.classList.add('frozen');
        showOptions();
    }
};

function handleDrop(value, sourceElem, zone) {
    if (state.isAnimating) return;
    if (value == zone.getAttribute('data-correct-val')) {
        state.isAnimating = true;
        zone.classList.add('correct');
        zone.textContent = value;
        setTimeout(initCalculation, 1500);
    } else {
        zone.classList.add('wrong');
        // DragDropManager räumt 'wrong'-Klasse und Inhalt nach 800ms wieder weg.
    }
}

window.initCalculation = initCalculation;
window.addEventListener('load', initCalculation);
window.addEventListener('rangeChanged', () => setTimeout(initCalculation, 0));
