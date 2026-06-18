/**
 * ANIMATION-STRUCTURE-OPERATORS.JS
 */

function startSwapPhase() {
    state.phase = 2;
    document.getElementById('equation-area').classList.add('swapped');
    const speed = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--anim-speed')) || 1.6;
    
    setTimeout(() => {
        state.isAnimating = false;
        if (window.DragDropManager) {
            window.DragDropManager.init((val, sourceElem, zone) => checkResult(parseInt(val), sourceElem, zone));
        }
    }, speed * 1000);
}