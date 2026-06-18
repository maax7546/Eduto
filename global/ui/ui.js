/**
 * ZENTRALE UI-STEUERUNG
 * Verwaltet Header, Navigation und Vollbild-Kompatibilität.
 * Diese Datei ist die Basis für alle Module.
 */

/*
 * UMAMI-ANALYTICS (zentral)
 * ui.js wird auf JEDER Seite geladen → das Tracking-Script hier genau einmal
 * einhängen, statt es in jede HTML zu kopieren. Guard verhindert Doppel-Laden.
 */
(function injectUmami() {
    var id = '6b227bb6-d63b-4811-943f-39584f6175f9';
    if (document.querySelector('script[data-website-id="' + id + '"]')) return;
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://cloud.umami.is/script.js';
    s.setAttribute('data-website-id', id);
    document.head.appendChild(s);
})();

/*
 * SETTINGSBUILDER-STUB
 * global/ui/ui.js wird synchron vor dem Bundle geladen. Modul-Scripts greifen
 * direkt auf SettingsBuilder.ready(...) zu, daher braucht der Builder einen
 * Stub, der Callbacks sammelt, bis settings-builder.js (aus dem Bundle)
 * sich registriert und die Queue abarbeitet.
 */
window.SettingsBuilder = window.SettingsBuilder || {
    _pendingReady: [],
    ready: function (cb) { this._pendingReady.push(cb); }
};

function injectUI(viewType, options = {}, callbacks = {}) {
    const render = () => {
        const header = document.querySelector('.header');
        if (!header) return;

        // 1. Automatische Pfad-Erkennung für den Exit-Button
        let autoExitUrl = 'index.html';
        if (!options.exitUrl) {
            const scripts = document.getElementsByTagName('script');
            for (let s of scripts) {
                if (s.getAttribute('src') && s.getAttribute('src').includes('global/ui/ui.js')) {
                    const src = s.getAttribute('src'); 
                    const depth = (src.match(/\.\.\//g) || []).length;
                    autoExitUrl = '../'.repeat(depth) + 'index.html';
                    break;
                }
            }
        }

        // 2. Konfiguration zusammenstellen
        const settings = {
            title: options.title || "",
            showBack: !!options.showBack,
            showExit: options.showExit !== false,
            showZoom: !!options.showZoom,
            showSettings: !!options.showSettings,
            showFullscreen: !!options.showFullscreen,
            exitUrl: options.exitUrl || autoExitUrl
        };

        // 3. Header-Struktur aufbauen
        header.innerHTML = '';

        // LINKE GRUPPE
        const leftGroup = document.createElement('div');
        leftGroup.className = 'nav-group';
        if (settings.showBack) {
            leftGroup.innerHTML = `<button id="btnBack" class="nav-control btn-back">⬅</button>`;
        }
        header.appendChild(leftGroup);

        // TITEL (Absolut zentriert via CSS)
        const titleEl = document.createElement('div');
        titleEl.className = 'header-title';
        titleEl.textContent = settings.title;
        header.appendChild(titleEl);

        // RECHTE GRUPPE
        const rightGroup = document.createElement('div');
        rightGroup.className = 'nav-group';
        
        let rightContent = '';
        if (settings.showZoom) {
            rightContent += `
                <button id="zoomOut" class="nav-control btn-zoom">-</button>
                <button id="zoomIn" class="nav-control btn-zoom">+</button>
            `;
        }
        
        if (settings.showSettings) {
            rightContent += `
                <div style="position: relative; display: flex;">
                    <button id="settings-toggle" class="nav-control btn-settings">⚙️</button>
                    <div id="settings-dropdown" class="settings-menu" style="display: none;"></div>
                </div>
            `;
        }
        
        if (settings.showFullscreen) {
            rightContent += `<button id="fs-toggle" class="nav-control btn-fs">⛶</button>`;
        }
        
        if (settings.showExit) {
            rightContent += `<a href="${settings.exitUrl}" class="nav-control btn-exit">✖</a>`;
        }
        
        rightGroup.innerHTML = rightContent;
        header.appendChild(rightGroup);

        // Event-Listener binden
        bindEvents(settings, callbacks);

        // FOUC-Schutz freigeben: Inhalt war via .main-container versteckt (ui.css),
        // wird jetzt — nach Aufbau des Headers und unmittelbar vor dem ersten
        // Paint des Modul-Renderings — sichtbar gemacht.
        document.documentElement.classList.add('ui-ready');
    };

    const bindEvents = (settings, callbacks) => {
        const toggleBtn = document.getElementById('settings-toggle');
        const dropdown = document.getElementById('settings-dropdown');

        // Helper für Click-Events
        const bind = (id, fn) => { 
            const el = document.getElementById(id);
            if(el && typeof fn === 'function') el.onclick = fn; 
        };

        // Back Button
        // In Vollbild ERST sauber aus dem Vollbild gehen und DANACH navigieren.
        // history.back() noch im Vollbild aufzurufen kollidiert mit dem
        // Vollbild-Wechsel des Browsers → es landet eine leere Seite im Fenster.
        bind('btnBack', () => {
            const navigateBack = () => {
                if (typeof callbacks.onBack === 'function') {
                    callbacks.onBack();
                } else if (window.history.length > 1) {
                    window.history.back();
                } else {
                    // Keine History (Seite direkt geöffnet) → Fallback aufs
                    // Exit-Ziel statt einer leeren Seite.
                    window.location.href = settings.exitUrl;
                }
            };

            if (document.fullscreenElement && document.exitFullscreen) {
                Promise.resolve(document.exitFullscreen()).catch(() => {}).finally(navigateBack);
            } else {
                navigateBack();
            }
        });

        // Dropdown Steuerung
        if (toggleBtn && dropdown) {
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
            };
            
            document.addEventListener('click', (e) => {
                if (dropdown && !dropdown.contains(e.target) && e.target !== toggleBtn) {
                    dropdown.style.display = 'none';
                }
            });
        }

        // Zoom-Callbacks
        bind('zoomIn', () => { if(typeof window.changeZoom === 'function') window.changeZoom(0.2); });
        bind('zoomOut', () => { if(typeof window.changeZoom === 'function') window.changeZoom(-0.2); });
        
        // Vollbild-Toggle
        bind('fs-toggle', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn(`Vollbild-Fehler: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    };

    // Initialer Render
    render();
}