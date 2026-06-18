/**
 * ZOOM-BUTTON-NUMBERLINE.JS
 */
window.ZoomActions = {
    changeZoom: (delta) => {
        window.currentZoom = Math.max(0.4, Math.min(4, window.currentZoom + delta));

        if (typeof calculateStep === 'function') {
            window.NumberlineState.currentStep = calculateStep(window.NumberlineState.centerX);
        }

        if (window.refreshNumberline) {
            window.refreshNumberline();
        }
    }
};

window.changeZoom = window.ZoomActions.changeZoom;