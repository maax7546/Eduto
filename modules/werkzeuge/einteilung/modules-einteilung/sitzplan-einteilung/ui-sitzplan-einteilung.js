/**
 * UI-SITZPLAN-EINTEILUNG — Modul-spezifische Settings über den globalen
 * SettingsBuilder. Baut KEIN Dropdown-DOM von Hand.
 *
 *   - 💾 Als PDF speichern → window.savePlanPdf()   (re-importierbar)
 *   - 📂 PDF laden          → window.loadPlanPdf()   (Plan wiederherstellen)
 *   - 🖨️ Drucken            → window.printPlan()
 *   - ↺ Zurücksetzen        → window.resetSitzplan()
 *
 * (Tische werden frei platziert, daher keine Größen-Einstellung.)
 */
(function () {
    SettingsBuilder.ready(() => {
        const act = (id, label, fn) => SettingsBuilder.actionButton({
            id: id, label: label,
            onClick: () => { if (typeof window[fn] === 'function') window[fn](); }
        });

        SettingsBuilder.addSection('Aktionen', [
            act('sitzplan-save', '💾 Als PDF speichern', 'savePlanPdf'),
            act('sitzplan-load', '📂 PDF laden', 'loadPlanPdf'),
            act('sitzplan-print', '🖨️ Drucken', 'printPlan'),
            act('sitzplan-reset', '↺ Zurücksetzen', 'resetSitzplan')
        ], { id: 'sitzplan-actions-section' });
    });
})();
