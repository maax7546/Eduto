/**
 * MORE-OR-LESS BASE LOGIC
 * Verwaltet den Spielzustand und die Ergebniskontrolle.
 * Diese Version ist vollständig kompatibel mit der draganddrop.js
 */
window.MoreOrLessBase = {
    currentTask: { a: 0, b: 0, result: '' },

    /**
     * Initialisiert das Modul
     */
    init() {
        // Event-Listener für Änderungen am Zahlenraum (Slider)
        window.removeEventListener('rangeChanged', () => this.newTask());
        window.addEventListener('rangeChanged', () => this.newTask());

        // Initialisiert den Renderer (Krokodile/Symbole)
        if (window.MoreOrLessRender && window.MoreOrLessRender.init) {
            window.MoreOrLessRender.init(this);
        }

        /**
         * INTEGRATION DRAG & DROP
         * Der DragDropManager aus draganddrop.js wird hier gebunden.
         * Er übergibt beim Drop: (value, sourceElem, zone)
         */
        if (window.DragDropManager) {
            window.DragDropManager.init((value, sourceElem, zone) => {
                // Wir übergeben den Wert (z.B. '<', '>', '=') an die Prüfung
                this.checkAnswer(value);
            });
        }

        // Erste Aufgabe generieren
        this.newTask();
    },

    /**
     * Erstellt eine neue Aufgabe über den Generator
     */
    newTask() {
        if (window.MoreOrLessGenerator) {
            const task = window.MoreOrLessGenerator.generatePair(true);
            this.currentTask = { a: task.left, b: task.right, result: task.result };
        }
        this.updateUI();
    },

    /**
     * Aktualisiert die Anzeige (Zahlen und Dropzone zurücksetzen)
     */
    updateUI() {
        // Setzt die Dropzone visuell in den Ausgangszustand (Renderer)
        if (window.MoreOrLessRender && window.MoreOrLessRender.resetDropZone) {
            window.MoreOrLessRender.resetDropZone();
        }
        
        // Ruft spezifische UI-Updates der Untermodule auf (z.B. Ziffern oder Mengen)
        if (typeof this.specificUpdateUI === 'function') {
            this.specificUpdateUI();
        }
    },

    /**
     * Prüft, ob das gewählte Symbol korrekt ist
     * @param {string} symbol - Das Symbol, das geprüft werden soll
     */
    checkAnswer(symbol) {
        const isCorrect = (symbol === this.currentTask.result);
        
        // Visuelles Feedback in der Dropzone über den Renderer anzeigen
        // Dieser setzt die CSS-Klassen 'correct' oder 'wrong' auf die Dropzone
        if (window.MoreOrLessRender && window.MoreOrLessRender.updateDropZoneVisual) {
            window.MoreOrLessRender.updateDropZoneVisual(symbol, isCorrect);
        }

        if (isCorrect) {
            // Bei richtiger Antwort: Kurze Pause für die Animation, dann neue Aufgabe
            setTimeout(() => this.newTask(), 1200);
        } else {
            // Bei falscher Antwort: Nach 1 Sekunde zurücksetzen, damit der User es nochmal versuchen kann
            setTimeout(() => {
                if (window.MoreOrLessRender && window.MoreOrLessRender.resetDropZone) {
                    window.MoreOrLessRender.resetDropZone();
                }
            }, 1000);
        }
        
        return isCorrect;
    }
};

/**
 * Globaler Zugriff
 */
window.MoreOrLess = window.MoreOrLessBase;