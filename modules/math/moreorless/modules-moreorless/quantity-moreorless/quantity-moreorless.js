/**
 * QUANTITY-MORE-OR-LESS STARTER
 * Automatische Korrektur des Zahlenraums auf max. 20 beim Start
 */
window.MoreOrLess = Object.assign({}, window.MoreOrLessBase, {
    useStructure: true,

    /**
     * Wird von MoreOrLessBase.newTask() aufgerufen
     */
    specificUpdateUI() {
        this.renderDots('dotContainerA', this.currentTask.a, 'red');
        this.renderDots('dotContainerB', this.currentTask.b, 'blue');

        // Globaler Zehner-/Zwanzigerfeld-Baustein zeichnen (siehe renderDots);
        // ein Aufruf rendert beide Felder neu.
        if (window.renderDotframes) window.renderDotframes();

        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            // nb-drop-target ist zwingend für draganddrop.js
            // nb-box sorgt für die korrekte Schriftart aus font.css
            dropZone.className = 'drop-zone nb-dropzone nb-box nb-drop-target';
            dropZone.innerHTML = '';
            dropZone.textContent = '';
        }
    },

    /**
     * Konfiguriert den globalen Zehner-/Zwanzigerfeld-Baustein
     * (global/math/elements/dotframe). Das Modul baut hier NICHTS selbst —
     * es setzt nur data-red/data-blue, die Feldgröße (v-10/v-20 je nach
     * Zahlenraum) und 'frozen' (reine Anzeige, keine Eingabe). Gezeichnet
     * wird über das globale window.renderDotframes() in specificUpdateUI().
     */
    renderDots(containerId, count, color) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const sideClass = containerId.includes('A') ? 'dots-left' : 'dots-right';
        container.className = `quantity-display ${sideClass}`;
        container.innerHTML = '';

        // Feldgröße aus dem aktuellen Zahlenraum ableiten: bis 10 → Zehnerfeld
        // (global einreihig 1x10), sonst Zwanzigerfeld. Beide in Standardgröße,
        // damit zwei Felder nebeneinander auf den Bildschirm passen.
        const max = window.NumberGenerator ? window.NumberGenerator.getLimits().max : 20;
        const fieldClass = max <= 10 ? 'v-10' : 'v-20';

        const frame = document.createElement('div');
        frame.className = `dot-frame ${fieldClass} frozen`;
        frame.setAttribute('data-red', color === 'red' ? count : 0);
        frame.setAttribute('data-blue', color === 'blue' ? count : 0);
        container.appendChild(frame);

        // Hilfszahl (erhält Patrick Hand via font.css)
        const helpNumber = document.createElement('div');
        helpNumber.className = 'help-number-label';
        helpNumber.innerText = count;
        container.appendChild(helpNumber);
    }
});

/**
 * Initialisierung beim Laden der Seite
 */
// Startet, sobald die asynchron nachgeladenen Mathe-Bausteine (NumberGenerator)
// und injectUI bereit sind — kein Warten auf window.load/Bilder mehr. Der Inhalt
// bleibt bis injectUI() via FOUC-Schutz (ui.css) verborgen, daher kein Aufblitzen.
(function start() {
    if (typeof injectUI !== 'function' || !window.NumberGenerator) {
        return requestAnimationFrame(start);
    }

    // --- ZAHLENRAUM PRÜFUNG & KORREKTUR ---
    const limits = window.NumberGenerator.getLimits();

    // Wenn der Zahlenraum nicht 10 oder 20 ist (z.B. 100),
    // erzwingen wir den Wechsel auf 20.
    if (limits.max !== 10 && limits.max !== 20) {
        const targetRange = "0-20";

        // Wir informieren das System über die Änderung.
        // Dies aktualisiert NumberGenerator.currentRange, LocalStorage
        // und die Buttons im UI-Header.
        window.dispatchEvent(new CustomEvent('rangeChanged', {
            detail: targetRange
        }));
    }

    // UI Header injizieren
    injectUI('quantity-moreorless', {
        title: 'Mengen vergleichen',
        showBack: true,
        showExit: true,
        showSettings: true,
        showFullscreen: true
    });

    // Spiel-Logik starten
    // Durch den dispatchEvent oben generiert init() sofort
    // eine Aufgabe im korrekten Bereich.
    if (window.MoreOrLess && window.MoreOrLess.init) {
        window.MoreOrLess.init();
    }

    // GLOBALEN DragDropManager binden
    if (window.DragDropManager) {
        window.DragDropManager.init((value, sourceElem, zone) => {
            // Antwort prüfen
            if (window.MoreOrLess && window.MoreOrLess.checkAnswer) {
                window.MoreOrLess.checkAnswer(value);
            }
        });
    }
})();