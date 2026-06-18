/**
 * UI-CROSSINGTENS-NUMBERLINE.JS
 * Header + modulspezifische Settings über den globalen SettingsBuilder.
 * Die Spiel-Logik (window.CTActions) liegt in crossingtens-numberline.js.
 */
(function () {
    if (typeof window.injectUI === 'function') {
        window.injectUI('crossingtens-numberline', {
            title: 'Zehnerübergang',
            showBack: true,
            showSettings: true,
            showZoom: true,
            showFullscreen: true,
            showExit: true,
            exitUrl: '../../../../../index.html'
        });
    }

    // Standard-Rechenart (wird vom Modul gelesen). 'mixed' | 'minus' | 'plus'
    window.CT_OP = window.CT_OP || 'mixed';
    // Punkte-Hilfe standardmäßig an
    if (window.CT_DOTS === undefined) window.CT_DOTS = true;
    // Pfeil-Zahlen-ziehen standardmäßig aus
    if (window.CT_LABELDROP === undefined) window.CT_LABELDROP = false;

    SettingsBuilder.ready(() => {
        if (document.getElementById('ct-settings-group')) return;

        // Zahlenraum: Zehnerübergang braucht mindestens bis 20.
        SettingsBuilder.addRangePicker(['0-20', '0-30', '0-100']);

        // Rechenart
        SettingsBuilder.addSection('Rechenart', [
            SettingsBuilder.toggleGroup('ct-op', [
                {
                    id: 'ct-op-minus', label: '➖ Minus',
                    active: window.CT_OP === 'minus',
                    onSelect: () => { window.CT_OP = 'minus'; window.CTActions?.newTask(); }
                },
                {
                    id: 'ct-op-plus', label: '➕ Plus',
                    active: window.CT_OP === 'plus',
                    onSelect: () => { window.CT_OP = 'plus'; window.CTActions?.newTask(); }
                },
                {
                    id: 'ct-op-mixed', label: '➕➖ Gemischt',
                    active: window.CT_OP === 'mixed',
                    onSelect: () => { window.CT_OP = 'mixed'; window.CTActions?.newTask(); }
                }
            ])
        ], { id: 'ct-settings-group' });

        // Hilfen
        SettingsBuilder.addSection('Hilfen', [
            SettingsBuilder.toggleButton({
                id: 'ct-dots-toggle', label: '🔴 Punkte-Hilfe',
                active: window.CT_DOTS,
                onToggle: (on) => window.CTActions?.setDots(on)
            }),
            SettingsBuilder.toggleButton({
                id: 'ct-labeldrop-toggle', label: '🔢 Pfeil-Zahlen ziehen',
                active: window.CT_LABELDROP,
                onToggle: (on) => window.CTActions?.setLabelDrop(on)
            })
        ]);

        // Aufgabe steuern
        SettingsBuilder.addSection('Aufgabe', [
            SettingsBuilder.actionButton({
                id: 'ct-new', label: '🎲 Neue Aufgabe',
                onClick: () => {
                    window.CTActions?.newTask();
                    const dd = SettingsBuilder.getDropdown();
                    if (dd) dd.style.display = 'none';
                }
            }),
            SettingsBuilder.actionButton({
                id: 'ct-clear', label: '🧽 Pfeile löschen',
                style: 'margin-top:8px;',
                onClick: () => window.CTActions?.clearArrows()
            }),
            SettingsBuilder.actionButton({
                id: 'ct-solve', label: '💡 Lösung zeigen',
                style: 'margin-top:8px;',
                onClick: () => {
                    window.CTActions?.showSolution();
                    const dd = SettingsBuilder.getDropdown();
                    if (dd) dd.style.display = 'none';
                }
            })
        ]);
    });

    // Zahlenraum-Wechsel → neue passende Aufgabe.
    window.addEventListener('rangeChanged', () => window.CTActions?.newTask());
})();
