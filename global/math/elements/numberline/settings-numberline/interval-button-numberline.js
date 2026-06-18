/**
 * INTERVAL-BUTTON-NUMBERLINE.JS
 */
window.IntervalActions = {
    setInterval: (value) => {
        if (!window.NumberlineState) return;

        // Toggle: Wenn das gleiche Intervall nochmal geklickt wird -> zurück auf Auto
        if (window.NumberlineState.forcedInterval === value) {
            window.NumberlineState.forcedInterval = null;
            console.log("Intervall: Automatisch");
        } else {
            window.NumberlineState.forcedInterval = value;
            console.log("Intervall fixiert auf: " + value);
        }

        // WICHTIG: Die update() Funktion in numberline.js muss global erreichbar sein
        // Falls sie dort lokal ist, hänge sie an window: window.refreshNumberline = update;
        if (typeof window.refreshNumberline === 'function') {
            window.refreshNumberline();
        }
    }
};