/**
 * SHOWNEGATIVES-BUTTON-NUMBERLINE.JS
 * Logik für das Umschalten des negativen Zahlenbereichs.
 */

window.NegativeActions = {
    toggleNegative: (refreshCallback) => {
        // Status im globalen State umschalten
        window.NumberlineState.onlyPositive = !window.NumberlineState.onlyPositive;
        
        // Automatischer Fokus-Reset, wenn man von Negativ zurück zu "Nur Positiv" wechselt
        if (window.NumberlineState.onlyPositive && window.NumberlineState.centerX < 0) {
            if (typeof window.jumpTo === 'function') {
                window.jumpTo(0);
            } else {
                window.NumberlineState.centerX = 0;
            }
        }

        // UI-Update (erzeugt das HTML in settings-numberline.js neu)
        if (typeof refreshCallback === 'function') {
            refreshCallback();
        }

        // Den eigentlichen Zahlenstrahl neu zeichnen
        if (typeof window.refreshNumberline === 'function') {
            window.refreshNumberline();
        }
    }
};

window.toggleNegative = window.NegativeActions.toggleNegative;