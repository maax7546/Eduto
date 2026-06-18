/**
 * UI-CALCULATION-OPERATORS
 * Modul-spezifische Settings: Zahlenraum, Rechenart (+/−), Feld-Anzeige.
 * Kein Speed-Slider, da das Modul keine Animationen verwendet.
 */
(function () {
    if (typeof window.showDotframe === 'undefined') window.showDotframe = true;
    if (typeof window.useMinusMode === 'undefined') window.useMinusMode = false;

    SettingsBuilder.ready(() => {
        SettingsBuilder.addRangePicker(['0-10', '0-20', '0-100']);

        SettingsBuilder.addSection('Einstellungen', [
            SettingsBuilder.toggleButton({
                id: 'toggle-operator',
                label: window.useMinusMode ? 'Rechenart: −' : 'Rechenart: +',
                active: !!window.useMinusMode,
                onToggle: (active, btn) => {
                    window.useMinusMode = active;
                    btn.textContent = active ? 'Rechenart: −' : 'Rechenart: +';
                    if (typeof window.initCalculation === 'function') window.initCalculation();
                }
            }),
            SettingsBuilder.toggleButton({
                id: 'toggle-dotframe',
                label: window.showDotframe ? 'Feld: AN' : 'Feld: AUS',
                active: !!window.showDotframe,
                onToggle: (active, btn) => {
                    window.showDotframe = active;
                    btn.textContent = active ? 'Feld: AN' : 'Feld: AUS';
                    if (typeof window.initCalculation === 'function') window.initCalculation();
                }
            })
        ], { id: 'calculation-settings-section' });
    });
})();
