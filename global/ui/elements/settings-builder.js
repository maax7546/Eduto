/**
 * GLOBALER SETTINGS-BAUKASTEN
 * Zentrale Bausteine für das Settings-Dropdown (#settings-dropdown).
 *
 * Verwendung im Modul:
 *   SettingsBuilder.ready(() => {
 *       SettingsBuilder.addRangePicker();
 *       SettingsBuilder.addSpeedSlider();
 *       SettingsBuilder.addSection('Anzeige', [
 *           SettingsBuilder.toggleGroup('display-mode', [
 *               { id: 'symbols', label: '< = >', active: true,
 *                 onSelect: () => window.useCrocodileMode = false },
 *               { id: 'crocs',   label: '🐊',
 *                 onSelect: () => window.useCrocodileMode = true }
 *           ])
 *       ]);
 *   });
 *
 * Alle Bausteine sind generisch — modulspezifische Sektionen werden
 * vom Modul gebaut (siehe `addSection` mit eigenem HTML/Buttons).
 */
(function () {
    const DEFAULT_RANGES = ['0-10', '0-20', '0-100'];

    const SettingsBuilder = {
        _readyCallbacks: [],
        _initialized: false,

        ready(callback) {
            if (this._initialized) return callback();
            this._readyCallbacks.push(callback);
            this._tryInit();
        },

        _tryInit() {
            const dropdown = document.getElementById('settings-dropdown');
            if (!dropdown) {
                setTimeout(() => this._tryInit(), 100);
                return;
            }
            this._initialized = true;
            this._readyCallbacks.forEach(cb => cb());
            this._readyCallbacks = [];
        },

        getDropdown() {
            return document.getElementById('settings-dropdown');
        },

        /**
         * Fügt eine Sektion ans Dropdown.
         * @param {string} title - Titel der Sektion
         * @param {Array<HTMLElement>} children - Elemente, die rein sollen
         * @param {object} [options] - { prepend: true, id: 'foo' }
         * @returns {HTMLElement|null}
         */
        addSection(title, children, options = {}) {
            const dropdown = this.getDropdown();
            if (!dropdown) return null;
            if (options.id && document.getElementById(options.id)) return null;

            const section = document.createElement('div');
            section.className = 'settings-section';
            if (options.id) section.id = options.id;

            if (title) {
                const t = document.createElement('div');
                t.className = 'settings-section-title';
                t.textContent = title;
                section.appendChild(t);
            }

            (Array.isArray(children) ? children : [children]).forEach(c => {
                if (c) section.appendChild(c);
            });

            if (options.prepend) dropdown.prepend(section);
            else dropdown.appendChild(section);
            return section;
        },

        /**
         * Erstellt eine Reihe mit Toggle-Buttons (gegenseitig exklusiv).
         * @param {string} groupName - identifiziert die Gruppe
         * @param {Array<{id, label, html, active, onSelect}>} buttons
         * @returns {HTMLElement}
         */
        toggleGroup(groupName, buttons) {
            const row = document.createElement('div');
            row.className = 'settings-row';
            row.dataset.group = groupName;

            buttons.forEach(cfg => {
                const btn = document.createElement('button');
                btn.className = 'settings-cycle-btn';
                if (cfg.id) btn.id = cfg.id;
                if (cfg.active) btn.classList.add('active');
                if (cfg.html) btn.innerHTML = cfg.html;
                else btn.textContent = cfg.label;

                btn.onclick = () => {
                    row.querySelectorAll('.settings-cycle-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (typeof cfg.onSelect === 'function') cfg.onSelect(cfg, btn);
                };
                row.appendChild(btn);
            });
            return row;
        },

        /**
         * Einfacher Toggle-Button (an/aus).
         */
        toggleButton(cfg) {
            const btn = document.createElement('button');
            btn.className = 'settings-cycle-btn';
            if (cfg.id) btn.id = cfg.id;
            if (cfg.active) btn.classList.add('active');
            btn.textContent = cfg.label;
            btn.onclick = () => {
                const wasActive = btn.classList.toggle('active');
                if (typeof cfg.onToggle === 'function') cfg.onToggle(wasActive, btn);
            };
            return btn;
        },

        /**
         * Aktions-Button (kein active-Zustand, nur Klick).
         */
        actionButton(cfg) {
            const btn = document.createElement('button');
            btn.className = 'settings-cycle-btn';
            if (cfg.id) btn.id = cfg.id;
            btn.textContent = cfg.label;
            if (cfg.style) btn.setAttribute('style', cfg.style);
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof cfg.onClick === 'function') cfg.onClick(btn);
            };
            return btn;
        },

        /**
         * Zentraler Zahlenraum-Picker mit LocalStorage + rangeChanged-Event.
         * @param {Array<string>} [ranges] - z.B. ['0-10','0-20']
         * @param {object} [options] - { id: 'foo', prepend: true }
         */
        addRangePicker(ranges = DEFAULT_RANGES, options = {}) {
            let saved = localStorage.getItem('selected-range-text') || ranges[0];
            if (!ranges.includes(saved)) saved = ranges[0];

            const buttons = ranges.map(range => ({
                label: range,
                active: range === saved,
                onSelect: () => {
                    localStorage.setItem('selected-range-text', range);
                    document.documentElement.setAttribute('data-range', range);
                    window.dispatchEvent(new CustomEvent('rangeChanged', { detail: range }));
                }
            }));

            document.documentElement.setAttribute('data-range', saved);
            return this.addSection('Zahlenraum',
                [this.toggleGroup('range', buttons)],
                Object.assign({ id: 'sb-range-section' }, options));
        },

        /**
         * Zentraler Geschwindigkeits-Slider mit LocalStorage.
         */
        addSpeedSlider(options = {}) {
            if (document.getElementById('speed-slider')) return null;

            const saved = localStorage.getItem('settings-anim-speed') || '1.6';
            document.documentElement.style.setProperty('--anim-speed', saved + 's');

            const wrapper = document.createElement('div');
            wrapper.className = 'speed-row-layout';
            wrapper.innerHTML = `
                <input type="range" id="speed-slider" min="0.5" max="6.0" step="0.1" value="${saved}">
                <span id="speed-value-display">${saved}s</span>
            `;
            wrapper.querySelector('#speed-slider').oninput = (e) => {
                const val = e.target.value;
                wrapper.querySelector('#speed-value-display').textContent = val + 's';
                document.documentElement.style.setProperty('--anim-speed', val + 's');
                localStorage.setItem('settings-anim-speed', val);
            };

            return this.addSection('Geschwindigkeit', [wrapper],
                Object.assign({ id: 'sb-speed-section' }, options));
        }
    };

    // Stub aus global/ui/ui.js übernehmen (falls vorhanden) und Queue abarbeiten
    const stub = window.SettingsBuilder;
    window.SettingsBuilder = SettingsBuilder;
    if (stub && Array.isArray(stub._pendingReady)) {
        stub._pendingReady.forEach(cb => SettingsBuilder.ready(cb));
    }
})();
