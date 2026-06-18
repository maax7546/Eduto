/**
 * UI-CROSSING-TENS
 * Modul-spezifische Settings: Feld-Modus, Schritte/Split, +/−.
 * Ergänzt die generischen Sektionen aus ui-operators.js (Speed + Zahlenraum).
 */
(function () {
    SettingsBuilder.ready(() => {
        SettingsBuilder.addSection('Einstellungen', [
            SettingsBuilder.toggleButton({
                id: 'toggle-dotframe',
                label: window.skipDotframe ? 'Feld: AUS' : 'Feld: AN',
                active: !!window.skipDotframe,
                onToggle: (active, btn) => {
                    window.skipDotframe = active;
                    btn.textContent = active ? 'Feld: AUS' : 'Feld: AN';
                    if (typeof window.initCrossingTens === 'function') window.initCrossingTens();
                }
            }),
            SettingsBuilder.toggleButton({
                id: 'toggle-mode',
                label: window.useSplitMode ? 'Modus: Split' : 'Modus: Schritte',
                active: !!window.useSplitMode,
                onToggle: (active, btn) => {
                    window.useSplitMode = active;
                    btn.textContent = active ? 'Modus: Split' : 'Modus: Schritte';
                    if (typeof window.initCrossingTens === 'function') window.initCrossingTens();
                }
            }),
            SettingsBuilder.toggleButton({
                id: 'toggle-operator',
                label: window.useMinusMode ? 'Rechenart: −' : 'Rechenart: +',
                active: !!window.useMinusMode,
                onToggle: (active, btn) => {
                    window.useMinusMode = active;
                    btn.textContent = active ? 'Rechenart: −' : 'Rechenart: +';
                    if (typeof window.initCrossingTens === 'function') window.initCrossingTens();
                }
            })
        ], { id: 'crossingtens-settings-section' });
    });
})();
