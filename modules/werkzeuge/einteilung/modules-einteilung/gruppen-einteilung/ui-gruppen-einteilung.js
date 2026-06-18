/**
 * UI-GRUPPEN-EINTEILUNG — Modul-spezifische Settings über den globalen
 * SettingsBuilder. Baut KEIN Dropdown-DOM von Hand.
 *
 *   - 💾 Als PDF speichern → window.savePdf()   (re-importierbar)
 *   - 📂 PDF laden          → window.loadPdf()   (Gruppen wiederherstellen)
 *   - 🖨️ Drucken            → window.printLineup()
 *   - ↺ Zurücksetzen        → window.resetEinteilung()
 *
 * (Gruppen werden manuell zusammengestellt, daher keine Größen-Einstellung.)
 */
(function () {
    SettingsBuilder.ready(() => {
        const act = (id, label, fn) => SettingsBuilder.actionButton({
            id: id, label: label,
            onClick: () => { if (typeof window[fn] === 'function') window[fn](); }
        });

        SettingsBuilder.addSection('Aktionen', [
            act('einteilung-save', '💾 Als PDF speichern', 'savePdf'),
            act('einteilung-load', '📂 PDF laden', 'loadPdf'),
            act('einteilung-print', '🖨️ Drucken', 'printLineup'),
            act('einteilung-reset', '↺ Zurücksetzen', 'resetEinteilung')
        ], { id: 'einteilung-actions-section' });
    });
})();
