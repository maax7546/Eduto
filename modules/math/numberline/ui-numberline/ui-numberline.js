/**
 * UI-NUMBERLINE.JS
 * Header + Settings-Sektionen über den globalen SettingsBuilder.
 */
(function () {
    if (typeof window.injectUI === 'function') {
        window.injectUI('numberline', {
            title: "Zahlenstrahl",
            showBack: true,
            showSettings: true,
            showFullscreen: true,
            showExit: true
        });
    }

    function updateActiveStates() {
        const S = window.NumberlineState || {};
        document.getElementById('nb-step-5')?.classList.toggle('active', S.forcedInterval === 5);
        document.getElementById('nb-step-10')?.classList.toggle('active', S.forcedInterval === 10);
        document.getElementById('nb-neg-toggle')?.classList.toggle('active', !S.onlyPositive);
    }

    SettingsBuilder.ready(() => {
        if (document.getElementById('numberline-settings-group')) {
            updateActiveStates();
            return;
        }

        // Navigation (Zoom + Springen)
        SettingsBuilder.addSection('Navigation', [
            SettingsBuilder.toggleGroup('nb-zoom', [
                { label: '🔍 +', onSelect: () => window.ZoomActions?.changeZoom(0.2) },
                { label: '🔍 -', onSelect: () => window.ZoomActions?.changeZoom(-0.2) }
            ]),
            SettingsBuilder.actionButton({
                label: '🚀 Zu Zahl springen',
                style: 'margin-top:8px;',
                onClick: () => {
                    window.JumpActions?.openModal();
                    const dd = SettingsBuilder.getDropdown();
                    if (dd) dd.style.display = 'none';
                }
            })
        ], { id: 'numberline-settings-group' });

        // Schritte (Intervall)
        SettingsBuilder.addSection('Schritte', [
            SettingsBuilder.toggleGroup('nb-step', [
                {
                    id: 'nb-step-5',
                    label: '5er',
                    onSelect: () => { window.IntervalActions?.setInterval(5); updateActiveStates(); }
                },
                {
                    id: 'nb-step-10',
                    label: '10er',
                    onSelect: () => { window.IntervalActions?.setInterval(10); updateActiveStates(); }
                }
            ])
        ]);

        // Optionen (Negativ + Reset)
        SettingsBuilder.addSection('Optionen', [
            SettingsBuilder.actionButton({
                id: 'nb-neg-toggle',
                label: 'Negativ Bereich',
                onClick: (btn) => {
                    window.NegativeActions?.toggleNegative();
                    updateActiveStates();
                }
            }),
            SettingsBuilder.actionButton({
                id: 'nb-reset',
                label: '⟲ Ansicht Reset',
                style: 'margin-top:8px;',
                onClick: () => {
                    window.ResetActions?.resetView();
                    const dd = SettingsBuilder.getDropdown();
                    if (dd) dd.style.display = 'none';
                    updateActiveStates();
                }
            })
        ]);

        updateActiveStates();
    });

    // Wenn das Header-Zahnrad geklickt wird, Zustände neu rendern
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-settings')) {
            setTimeout(updateActiveStates, 10);
        }
    });
})();
