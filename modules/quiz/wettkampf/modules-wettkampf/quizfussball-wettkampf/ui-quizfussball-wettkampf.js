/**
 * UI-QUIZFUSSBALL — Modul-spezifische Settings über den globalen SettingsBuilder.
 *
 * Verlagert die früheren Topbar-Toggles ins ⚙️-Settings-Dropdown:
 *   - Modus (Fußball / Pferderennen)
 *   - Generator (Zahl / Buchstabe)
 *   - Feldgröße (5 / 7 / 9 / 11 / 13)
 *   - Reset (Neues Spiel)
 * Die aktiven Vorauswahlen spiegeln die Start-Defaults der Spiel-Logik
 * (quizfussball-wettkampf.js: Fußball, Zahl, Feld 9). Die onSelect-/onClick-
 * Callbacks rufen nur die dort definierten window-Funktionen auf.
 */
(function () {
    SettingsBuilder.ready(() => {

        // --- MODUS: Fußball / Pferderennen ---
        SettingsBuilder.addSection('Modus', [
            SettingsBuilder.toggleGroup('quiz-mode', [
                { id: 'mode-football', label: '⚽ Fußball', active: true,
                  onSelect: () => { if (typeof window.setMode === 'function') window.setMode('football'); } },
                { id: 'mode-horse', label: '🐎 Pferde',
                  onSelect: () => { if (typeof window.setMode === 'function') window.setMode('horse'); } }
            ])
        ], { id: 'quiz-mode-section' });

        // --- GENERATOR: Zahl / Buchstabe (Trikot-Generator) ---
        SettingsBuilder.addSection('Generator', [
            SettingsBuilder.toggleGroup('quiz-generator', [
                { id: 'gen-number', label: 'Zahl', active: true,
                  onSelect: () => { if (typeof window.setGenerator === 'function') window.setGenerator('number'); } },
                { id: 'gen-letter', label: 'Buchstabe',
                  onSelect: () => { if (typeof window.setGenerator === 'function') window.setGenerator('letter'); } }
            ])
        ], { id: 'quiz-generator-section' });

        // --- FELDGRÖSSE: 5 / 7 / 9 / 11 / 13 ---
        SettingsBuilder.addSection('Feldgröße', [
            SettingsBuilder.toggleGroup('quiz-fieldsize',
                [5, 7, 9, 11, 13].map(size => ({
                    id: 'field-' + size,
                    label: String(size),
                    active: size === 9,
                    onSelect: () => { if (typeof window.setFieldSize === 'function') window.setFieldSize(size); }
                }))
            )
        ], { id: 'quiz-fieldsize-section' });

        // --- SPIEL: Reset + Trikots drucken ---
        SettingsBuilder.addSection('Spiel', [
            SettingsBuilder.actionButton({
                id: 'quiz-reset',
                label: '↺ Neues Spiel',
                onClick: () => { if (typeof window.resetGame === 'function') window.resetGame(); }
            }),
            // Öffnet die mitgelieferte Trikot-Vorlage im neuen Tab (Browser-PDF-Viewer
            // → drucken). Pfad ist relativ zur Modul-HTML, die im selben Ordner liegt.
            SettingsBuilder.actionButton({
                id: 'quiz-print-jerseys',
                label: '🖨️ Trikots drucken',
                onClick: () => { window.open('tafelfussball-trikots.pdf', '_blank'); }
            })
        ], { id: 'quiz-reset-section' });
    });
})();
