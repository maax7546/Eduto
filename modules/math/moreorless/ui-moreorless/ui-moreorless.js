/**
 * UI-MOREORLESS.JS
 * Generische more-or-less Settings (Anzeige, Zahlenraum).
 * Module können `extraSections` übergeben, um eigene Sektionen anzuhängen.
 */
(function () {
    // Pfad zu den Krokodil-Icons relativ zur SCRIPT-Quelle auflösen, nicht zur HTML.
    // So funktionieren die Icons aus jedem Modul-Ordner (und auch aus testutility).
    const scriptSrc = document.currentScript ? document.currentScript.src : '';
    const CROC_BASE = scriptSrc
        ? scriptSrc.substring(0, scriptSrc.lastIndexOf('/ui-moreorless/')) + '/visuals-moreorless/'
        : '../../visuals-moreorless/';
    window.MoreOrLessIcons = { crocBase: CROC_BASE };

    function buildDisplaySection() {
        // Krokodil-Buttons: 3 Mini-Bilder
        const symbolsBtn = {
            id: 'btnSelectSymbols',
            label: ' < = > ',
            active: !window.useCrocodileMode,
            onSelect: () => {
                window.useCrocodileMode = false;
                window.dispatchEvent(new CustomEvent('modeChanged'));
            }
        };
        const crocsBtn = {
            id: 'btnSelectCrocodiles',
            html: `<div style="display:flex; gap:4px; align-items:center; justify-content:center;">
                       <img src="${CROC_BASE}Krokodil1.png" style="height:18px; width:auto;">
                       <img src="${CROC_BASE}Krokodil2.png" style="height:18px; width:auto;">
                       <img src="${CROC_BASE}Krokodil3.png" style="height:18px; width:auto;">
                   </div>`,
            active: !!window.useCrocodileMode,
            onSelect: () => {
                window.useCrocodileMode = true;
                window.dispatchEvent(new CustomEvent('modeChanged'));
            }
        };
        return SettingsBuilder.toggleGroup('moreorless-display', [symbolsBtn, crocsBtn]);
    }

    /**
     * Öffentliche Init-Funktion. Module dürfen Optionen mitgeben:
     *   window.initMoreOrLessUI({
     *       quantityMode: true,           // versteckt 0-100
     *       extraSections: [() => {...}]  // jeweils Callback, der DIE eigene Sektion baut
     *   });
     */
    window.initMoreOrLessUI = function (opts = {}) {
        SettingsBuilder.ready(() => {
            SettingsBuilder.addSection('Anzeige', [buildDisplaySection()],
                { id: 'moreorless-display-section', prepend: true });

            const ranges = opts.quantityMode ? ['0-10', '0-20'] : ['0-10', '0-20', '0-100'];
            // Falls vorher 0-100 gespeichert war und quantityMode an ist, korrigieren
            if (opts.quantityMode && localStorage.getItem('selected-range-text') === '0-100') {
                localStorage.setItem('selected-range-text', '0-20');
            }
            SettingsBuilder.addRangePicker(ranges);

            (opts.extraSections || []).forEach(fn => fn());
        });
    };

    // Auto-Init falls keine Spezialopts gebraucht werden (kompatibel zu numbers/quantity)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window._moreOrLessUIInitialized) {
                window.initMoreOrLessUI({
                    quantityMode: document.getElementById('dotContainerA') !== null
                });
                window._moreOrLessUIInitialized = true;
            }
        });
    } else if (!window._moreOrLessUIInitialized) {
        window.initMoreOrLessUI({
            quantityMode: document.getElementById('dotContainerA') !== null
        });
        window._moreOrLessUIInitialized = true;
    }
})();
