/**
 * MODUL-UI REGROUPING (BÜNDELN)
 * Header über injectUI; Settings-Sektion über den globalen SettingsBuilder.
 */
(function () {
    if (window.showCounterHelp === undefined) window.showCounterHelp = false;

    function initRegroupingUI() {
        if (typeof injectUI === 'function') {
            injectUI('game', {
                showBack: true, showSettings: true, showExit: true, showFullscreen: true,
                exitUrl: '../../../index.html'
            });
        }

        setupGlobalCheckButton();

        SettingsBuilder.ready(() => {
            SettingsBuilder.addSection('Hilfen', [
                SettingsBuilder.toggleButton({
                    id: 'btnToggleCounter',
                    label: getCounterLabel(),
                    active: window.showCounterHelp,
                    onToggle: (active, btn) => {
                        window.showCounterHelp = active;
                        btn.textContent = getCounterLabel();
                        updateCounterDisplay();
                    }
                })
            ], { id: 'regrouping-help-section' });

            updateCounterDisplay();
        });
    }

    function getCounterLabel() {
        return `Zählhilfe: ${window.showCounterHelp ? 'AN' : 'AUS'}`;
    }

    function setupGlobalCheckButton() {
        const interactionRow = document.querySelector('.interaction-row');
        if (!interactionRow) return;

        const oldContainer = document.querySelector('.button-container');
        if (oldContainer) oldContainer.style.display = 'none';

        let btnCheck = document.getElementById('btnCheck');
        if (!btnCheck) {
            btnCheck = document.createElement('button');
            btnCheck.id = 'btnCheck';
            btnCheck.innerHTML = '✔';
            btnCheck.onclick = () => {
                if (typeof manualCheck === 'function') manualCheck();
            };
            interactionRow.appendChild(btnCheck);
        }
    }

    function updateCounterDisplay() {
        const areas = [
            { key: 'z', parentId: 'area-z', counterId: 'selection-counter-z' },
            { key: 'e', parentId: 'area-e', counterId: 'selection-counter-e' }
        ];

        areas.forEach(cfg => {
            let el = document.getElementById(cfg.counterId);
            if (!window.showCounterHelp) {
                if (el) el.remove();
                return;
            }
            if (!el) {
                el = document.createElement('div');
                el.id = cfg.counterId;
                el.className = 'count-helper';
                const col = document.getElementById(cfg.parentId)?.parentElement;
                if (col) col.appendChild(el);
            }
            if (cfg.key === 'e') {
                el.textContent = window.selectedDots ? window.selectedDots.length : 0;
            } else {
                const rodCount = document.getElementById('area-z')?.querySelectorAll('.rod').length || 0;
                el.textContent = rodCount;
            }
        });
    }

    window.addEventListener('DOMContentLoaded', initRegroupingUI);
})();
