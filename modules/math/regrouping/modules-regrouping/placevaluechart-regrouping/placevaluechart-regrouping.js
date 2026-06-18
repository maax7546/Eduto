/**
 * PLACEVALUECHART-REGROUPING.JS
 */

// KONFIGURATION: "h-10", "v-10", "h-20", "h-5" etc.
const FRAME_TYPE = "h-10"; 

window.selectedDots = [];
let totalAmount = 0;
let isTransitioning = false;

function initTask() {
    isTransitioning = false;
    
    const areaE = document.getElementById('area-e');
    const areaZ = document.getElementById('area-z');
    const checkBtn = document.getElementById('check-btn');

    // Container leeren und dot-frame Klassen setzen
    if (areaE) {
        areaE.innerHTML = '';
        areaE.className = `pvc-area dot-frame ${FRAME_TYPE}`;
    }
    if (areaZ) areaZ.innerHTML = '';
    
    // UI Reset
    if (checkBtn) {
        checkBtn.disabled = false;
        checkBtn.className = "check-circle-btn";
    }

    const elZ = document.getElementById('val-z');
    const elE = document.getElementById('val-e');
    elZ.textContent = "0"; elE.textContent = "0";
    elZ.className = "step-value"; elE.className = "step-value";

    window.selectedDots = [];
    totalAmount = Math.floor(Math.random() * 10) + 11; // 11-20
    
    for (let i = 0; i < totalAmount; i++) {
        createDot(areaE);
    }
}

function createDot(container) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    
    // Klick-Logik
    dot.addEventListener('click', function() {
        if (isTransitioning) return;

        if (this.classList.contains('selected')) {
            this.classList.remove('selected');
            window.selectedDots = window.selectedDots.filter(d => d !== this);
        } else if (window.selectedDots.length < 10) {
            this.classList.add('selected');
            window.selectedDots.push(this);
        }

        if (window.selectedDots.length === 10) {
            processBundling();
        }
    });
    
    container.appendChild(dot);
}

function processBundling() {
    isTransitioning = true;
    
    window.selectedDots.forEach(dot => {
        dot.style.transform = "scale(0)";
        dot.style.transition = "transform 0.4s ease-in";
    });

    setTimeout(() => {
        window.selectedDots.forEach(dot => dot.remove());
        window.selectedDots = [];
        
        const rod = document.createElement('div');
        rod.className = 'rod'; 
        document.getElementById('area-z').appendChild(rod);
        
        isTransitioning = false;
    }, 450);
}

function changeValue(id, delta) {
    if (isTransitioning) return;
    const el = document.getElementById(id);
    let val = Math.max(0, Math.min(9, (parseInt(el.textContent) || 0) + delta));
    el.textContent = val;
    el.classList.remove('correct', 'wrong');
}

function manualCheck() {
    if (isTransitioning) return;

    const elZ = document.getElementById('val-z');
    const elE = document.getElementById('val-e');
    const checkBtn = document.getElementById('check-btn');

    const uZ = parseInt(elZ.textContent);
    const uE = parseInt(elE.textContent);
    const cZ = Math.floor(totalAmount / 10);
    const cE = totalAmount % 10;

    if (uZ === cZ && uE === cE) {
        isTransitioning = true;
        elZ.classList.add('correct');
        elE.classList.add('correct');
        checkBtn.classList.add('correct');
        setTimeout(initTask, 2000);
    } else {
        if (uZ !== cZ) elZ.classList.add('wrong');
        if (uE !== cE) elE.classList.add('wrong');
        checkBtn.classList.add('wrong');
        setTimeout(() => {
            elZ.classList.remove('wrong');
            elE.classList.remove('wrong');
            checkBtn.classList.remove('wrong');
        }, 800);
    }
}

window.onload = initTask;