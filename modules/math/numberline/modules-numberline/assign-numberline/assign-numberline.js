/**
 * ASSIGN-NUMBERLINE.JS - VOLLSTÄNDIGE LÖSUNG
 * Synchronisiert Button-Klick mit Dropzone-Animationen (Correct/Wrong)
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('numberline');
    const checkBtn = document.getElementById('btnCheck');

    // 1. BEIM ABLEGEN DER KARTE
    const handleDrop = (value, sourceElem, zone) => {
        const slotVal = zone.getAttribute('data-val');
        
        // Initialer Zustand: Weiß/Befüllt, noch kein Feedback
        zone.classList.remove('correct', 'wrong', 'nb-hover'); 
        zone.classList.add('is-filled');
        
        zone.setAttribute('data-current-value', value);
        zone.textContent = value;

        // State im globalen Objekt speichern
        if (!window.NumberlineState.assignedCards) window.NumberlineState.assignedCards = {};
        window.NumberlineState.assignedCards[slotVal] = value;

        // Option in der unteren Leiste ausgrauen
        if (sourceElem) sourceElem.style.opacity = '0.5';
    };

    // 2. PRÜFUNG UND ANIMATIONS-TRIGGER BEIM BUTTON-KLICK
    function checkResults() {
        const zones = document.querySelectorAll('.slot.nb-dropzone');
        let allCorrect = true;
        let anyFilled = false;

        zones.forEach(zone => {
            const expected = zone.getAttribute('data-val');
            const current = zone.getAttribute('data-current-value');

            if (!current) return;
            anyFilled = true;

            // Bestehende Feedback-Klassen entfernen, um Animationen neu zu starten
            zone.classList.remove('correct', 'wrong');
            
            // "Magic" Force-Reflow: Stellt sicher, dass CSS-Animationen (wie shakeZone) neu triggern
            void zone.offsetWidth;

            // Logik-Vergleich
            if (String(current) === String(expected)) {
                // Triggert .correct (Grün) aus dropzone.css
                zone.classList.add('correct');
            } else {
                // Triggert .wrong (Rot + Shake-Animation) aus dropzone.css
                zone.classList.add('wrong');
                allCorrect = false;

                // Bei Fehlern: Nach kurzem Feedback (800ms) die Box leeren
                setTimeout(() => {
                    zone.classList.remove('wrong', 'is-filled');
                    zone.textContent = "";
                    zone.removeAttribute('data-current-value');
                    
                    if (window.NumberlineState.assignedCards) delete window.NumberlineState.assignedCards[expected];
                    
                    // Option unten wieder aktiv setzen
                    const source = document.querySelector(`.nb-option[data-value="${current}"]`);
                    if (source) source.style.opacity = '1';
                    
                    // UI-Update des Zahlenstrahls (falls nötig)
                    if (window.refreshNumberline) window.refreshNumberline();
                }, 800);
            }
        });

        // Visuelles Feedback für den Check-Button selbst
        if (anyFilled) {
            const resultClass = allCorrect ? 'correct' : 'wrong';
            checkBtn.classList.add(resultClass);
            setTimeout(() => checkBtn.classList.remove(resultClass), 800);
        }
    }

    // --- Initialisierung & Observer (unverändert für Stabilität) ---
    function refreshInteractions() {
        const slots = document.querySelectorAll('.slot');
        if (slots.length === 0) return;

        slots.forEach(slot => {
            const val = slot.getAttribute('data-val');
            if (!slot.classList.contains('nb-dropzone')) {
                slot.classList.add('nb-dropzone', 'nb-box-small');
            }
            // Wiederherstellung des Zustands bei Re-Renders
            if (window.NumberlineState.assignedCards && window.NumberlineState.assignedCards[val]) {
                const stored = window.NumberlineState.assignedCards[val];
                slot.textContent = stored;
                slot.setAttribute('data-current-value', stored);
                slot.classList.add('is-filled');
            }
        });

        // DragDropManager mit unserer handleDrop Funktion verknüpfen
        if (window.DragDropManager) {
            window.DragDropManager.init(handleDrop);
        }
    }

    // Erkennt, wenn der Zahlenstrahl neue Slots generiert
    const observer = new MutationObserver((mutations) => {
        if (mutations.some(m => m.addedNodes.length > 0)) refreshInteractions();
    });

    function startNumberline() {
        if (typeof window.initNumberline === 'function') {
            // Initialer State für 1-10
            window.NumberlineState.assignedCards = {};
            window.NumberlineState.slots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            window.NumberlineState.hideLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            
            window.initNumberline();
            
            if (container) observer.observe(container, { childList: true });
            refreshInteractions(); 
            
            // Start-Position des Zahlenstrahls
            if (window.jumpTo) window.jumpTo(5.5);
            
            // Button Event-Listener
            if (checkBtn) checkBtn.onclick = checkResults;
        } else {
            // Warten bis Core-Script geladen ist
            setTimeout(startNumberline, 50);
        }
    }
    
    startNumberline();
});