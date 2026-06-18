/**
 * NUMBERLINE.JS - OPTIMIERT
 */

const CONFIG = {
    growthFactor: 22,
    buffer: 20
};

window.NumberlineState = {
    type: 'ansicht',
    slots: [],
    hideLabels: [],
    help: true,
    onlyPositive: true,
    currentStep: 85,
    centerX: 0,
    isDragging: false,
    startX: 0,
    forcedInterval: 1,
    showSubTicks: true,
    assignedCards: {}
};

window.currentZoom = 1;
const formatSeven = (el, n) => el.textContent = n;

function getResolvedBoxSize() {
    const dummy = document.createElement('div');
    dummy.style.width = 'var(--nb-box-size-small, 100px)';
    dummy.style.position = 'absolute';
    dummy.style.visibility = 'hidden';
    document.body.appendChild(dummy);
    const size = parseFloat(getComputedStyle(dummy).width);
    document.body.removeChild(dummy);
    return size || 100;
}

function calculateStep(n) {
    const baseBoxSize = getResolvedBoxSize();
    const minRequiredVisualWidth = baseBoxSize * 1.15;
    let absN = Math.abs(n);
    let logVal = absN > 0 ? Math.log10(absN) : 0;
    let minusBonus = (n < 0) ? 0.3 : 0;
    let zoomKorrektur = window.currentZoom < 1 ? (Math.pow(1 / window.currentZoom, 2)) * 12 : 0;
    let growth = Math.max(0, (logVal + minusBonus) - 0.95);
    let calculated = (baseBoxSize * 0.85) + (growth * CONFIG.growthFactor) + zoomKorrektur;
    let minStep = minRequiredVisualWidth / window.currentZoom;
    return Math.max(calculated, minStep);
}

function jumpTo(n) {
    const viewport = document.getElementById('viewport');
    if (!viewport || viewport.offsetWidth === 0) {
        requestAnimationFrame(() => jumpTo(n));
        return;
    }
    const S = window.NumberlineState;
    let target = (S.onlyPositive && n < 0) ? 0 : n;
    S.centerX = parseFloat(target);
    S.currentStep = calculateStep(S.centerX);
    if (window.refreshNumberline) window.refreshNumberline();
}

function initNumberline() {
    const nl = document.getElementById('numberline');
    const viewport = document.getElementById('viewport');
    if (!nl || !viewport) return;

    nl.style.position = "absolute";
    nl.style.width = "100%";
    nl.style.height = "100%";
    nl.style.overflow = "hidden";
    nl.style.pointerEvents = "none";

    const render = () => {
        const S = window.NumberlineState;
        if (S.onlyPositive && S.centerX < 0) S.centerX = 0;

        const width = viewport.offsetWidth;
        const halfWidth = width / 2;

        S.currentStep = calculateStep(S.centerX);

        nl.innerHTML = '';

        const effectiveStep = S.currentStep * window.currentZoom;
        const labelInterval = S.forcedInterval || 1;

        const line = document.createElement('div');
        line.className = 'main-line';
        const xZero = (0 - S.centerX) * effectiveStep + halfWidth;
        let lineStart = S.onlyPositive ? Math.max(0, xZero) : 0;
        line.style.left = lineStart + "px";
        line.style.width = (width - lineStart) + "px";
        nl.appendChild(line);

        let startI = Math.floor(S.centerX - (halfWidth / effectiveStep)) - 1;
        let endI = Math.ceil(S.centerX + (halfWidth / effectiveStep)) + 1;

        for (let i = startI; i <= endI; i++) {
            if (S.onlyPositive && i < 0) continue;
            const x = (i - S.centerX) * effectiveStep + halfWidth;
            if (x < -50 || x > width + 50) continue;

            const isMainTick = (i % labelInterval === 0);
            const isMediumTick = (labelInterval === 10 && i % 5 === 0 && !isMainTick);
            const isSlot = S.slots.includes(i);

            if (isMainTick || S.showSubTicks) {
                const tick = document.createElement('div');
                tick.className = 'tick';
                tick.style.left = x + "px";
                if (isMainTick) {
                    tick.style.height = "46px"; tick.style.width = "6px"; tick.style.marginLeft = "-3px";
                } else {
                    tick.style.height = isMediumTick ? "32px" : "20px"; tick.style.width = "4px"; tick.style.marginLeft = "-2px"; tick.style.opacity = isMediumTick ? "0.7" : "0.4";
                }
                nl.appendChild(tick);
            }

            if (isSlot) {
                const slot = document.createElement('div');
                slot.className = `slot drop-zone ${S.help ? 'show-border' : ''}`;
                slot.style.left = x + "px";
                slot.dataset.val = i;
                slot.style.pointerEvents = "auto";
                nl.appendChild(slot);
            }

            if (isMainTick && !isSlot && !S.hideLabels.includes(i)) {
                const l = document.createElement('div');
                l.className = 'tick-label';
                l.style.left = x + "px";
                l.style.transform = `translateX(-50%) scale(${Math.max(0.5, window.currentZoom * 0.9)})`;
                formatSeven(l, i);
                nl.appendChild(l);
            }
        }

        if (window.refreshInteractions) window.refreshInteractions();
    };

    viewport.onmousedown = (e) => {
        if (e.target.closest('.nb-box')) return;
        const S = window.NumberlineState;
        S.isDragging = true;
        S.startX = e.clientX;
        viewport.style.cursor = "grabbing";
    };

    window.addEventListener('mousemove', (e) => {
        const S = window.NumberlineState;
        if (!S.isDragging) return;
        const dx = e.clientX - S.startX;
        S.startX = e.clientX;
        S.centerX -= dx / (S.currentStep * window.currentZoom);
        render();
    });

    window.addEventListener('mouseup', () => {
        window.NumberlineState.isDragging = false;
        viewport.style.cursor = "grab";
    });

    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const S = window.NumberlineState;
        S.centerX += e.deltaY / (S.currentStep * window.currentZoom * 1.5);
        render();
    }, { passive: false });

    window.refreshNumberline = render;

    const resizeObserver = new ResizeObserver(() => {
        if (viewport.offsetWidth > 0) {
            render();
        }
    });

    resizeObserver.observe(viewport);
    render();
}

window.initNumberline = initNumberline;
window.jumpTo = jumpTo;
