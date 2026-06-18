/**
 * RESET-BUTTON-NUMBERLINE.JS
 * Logik für das Zurücksetzen der Übung und der Ansicht.
 */

window.ResetActions = {
    /**
     * Spielneustart: Schiebt alle Karten aus den Slots zurück in die untere Leiste
     * und löscht alle Korrektur-Markierungen.
     */
    clearAssignedCards: () => {
        const container = document.getElementById('cardsContainer');
        const slots = document.querySelectorAll('.slot');
        
        if (!container) return;
        
        // 1. Alle Slots durchlaufen und Karten einsammeln
        slots.forEach(slot => {
            const card = slot.querySelector('.number-card');
            if (card) {
                container.appendChild(card); // Karte zurück in die untere Leiste
            }
            // Feedback-Klassen vom Slot entfernen
            slot.classList.remove('correct', 'wrong');
        });
        
        // 2. Internen Status leeren
        window.NumberlineState.assignedCards = {}; 
        
        // 3. Zahlenstrahl aktualisieren (entfernt die Visualisierung der Karten im Strahl)
        if (typeof window.refreshNumberline === 'function') {
            window.refreshNumberline();
        }
    },

    /**
     * Setzt die Kamera/Ansicht zurück auf den Startpunkt.
     */
    resetView: () => {
        if (typeof window.jumpTo === 'function') {
            // Springt zum Standardwert (z.B. 0 oder 15, je nach Modus)
            const target = window.currentMode === "standard" ? 15 : 5;
            window.jumpTo(target);
        }
    }
};

// Globaler Shortcut für den Aufruf aus der UI
window.clearAssignedCards = window.ResetActions.clearAssignedCards;