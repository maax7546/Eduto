/**
 * UI-NUMBERROW-MOREORLESS.JS
 * Nutzt initMoreOrLessUI und ergänzt eine Aufgaben-Typ-Sektion.
 */
(function () {
    window._moreOrLessUIInitialized = true; // unterdrückt Auto-Init von ui-moreorless.js

    function buildModeSection() {
        SettingsBuilder.addSection('Aufgaben-Typ', [
            SettingsBuilder.toggleGroup('numberrow-mode', [
                {
                    id: 'btnModeStandard',
                    label: 'Standard',
                    active: !window.useMixedOperators,
                    onSelect: () => {
                        window.useMixedOperators = false;
                        window.dispatchEvent(new CustomEvent('rangeChanged'));
                    }
                },
                {
                    id: 'btnModeMixed',
                    label: 'Gemischt',
                    active: !!window.useMixedOperators,
                    onSelect: () => {
                        window.useMixedOperators = true;
                        window.dispatchEvent(new CustomEvent('rangeChanged'));
                    }
                }
            ])
        ], { id: 'numberrow-mode-section' });
    }

    function start() {
        if (typeof window.initMoreOrLessUI === 'function') {
            window.initMoreOrLessUI({
                quantityMode: false,
                extraSections: [buildModeSection]
            });
        } else {
            setTimeout(start, 50);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
