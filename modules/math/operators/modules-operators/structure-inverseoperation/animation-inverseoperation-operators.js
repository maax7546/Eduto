/**
 * ANIMATION-INVERSEOPERATION-OPERATORS.JS
 * Beinhaltet die Funktionen zur Steuerung der Klon-Animationen
 */

function startAnimationSequence() {
    const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--anim-speed')) || 1.6;
    const durationMs = duration * 1000;
    const pause = 250; 

    const op = document.getElementById('p-op-symbol');
    const eq = document.getElementById('p-eq-symbol');
    if(op) { op.classList.remove('opacity-0'); op.classList.add('opacity-1'); }
    if(eq) { eq.classList.remove('opacity-0'); eq.classList.add('opacity-1'); }

    setTimeout(() => {
        createCloneAndAnimate('m-slot-3', 'p-slot-1-target', 'fly-p1', duration, true);

        setTimeout(() => {
            createCloneAndAnimate('m-slot-2', 'p-slot-2-target', 'fly-p2', duration, false);

            setTimeout(() => {
                finishSequence();
            }, durationMs + pause);

        }, durationMs + pause);

    }, 400); 
}

function createCloneAndAnimate(sourceId, targetId, animName, duration, isLForm) {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    if(!source || !target) return;

    const clone = source.cloneNode(true);
    const rectS = source.getBoundingClientRect();
    const rectT = target.getBoundingClientRect();
    
    clone.style.position = 'fixed';
    clone.style.top = rectS.top + 'px';
    clone.style.left = rectS.left + 'px';
    clone.style.margin = '0';
    clone.style.zIndex = '1000';
    
    const deltaX = rectT.left - rectS.left;
    const deltaY = rectT.top - rectS.top;
    
    const styleSheet = document.createElement('style');
    let keyframes = isLForm 
        ? `0% { transform: translate(0, 0); } 
           50% { transform: translate(0, ${deltaY}px); } 
           100% { transform: translate(${deltaX}px, ${deltaY}px); }`
        : `0% { transform: translate(0, 0); } 
           100% { transform: translate(${deltaX}px, ${deltaY}px); }`;
    
    styleSheet.innerHTML = `@keyframes ${animName} { ${keyframes} }`;
    document.head.appendChild(styleSheet);
    
    clone.style.animation = `${animName} ${duration}s forwards cubic-bezier(0.42, 0, 0.58, 1)`;
    document.body.appendChild(clone);
}

function finishSequence() {
    const targets = ['p-slot-1-target', 'p-slot-2-target'];
    targets.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.transition = 'none';
            el.classList.add('opacity-1');
            el.classList.remove('opacity-0');
        }
    });

    state.phase = 2;
    state.isAnimating = false;
    updateUI(); 
    generateOptions();
    cleanupClones();
}

function cleanupClones() {
    document.querySelectorAll('[style*="position: fixed"]').forEach(el => el.remove());
}