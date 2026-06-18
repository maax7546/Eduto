/**
 * GLOBAL NUMBER GENERATOR
 * Mit 50% reduzierter Wahrscheinlichkeit für die Zahl 0
 */
window.NumberGenerator = {
    // Initialisierung aus dem LocalStorage oder Standardwert
    currentRange: localStorage.getItem('selected-range-text') || '0-10',

    getLimits() {
        const parts = this.currentRange.split('-');
        return {
            min: parseInt(parts[0]) || 0,
            max: parseInt(parts[1]) || 10
        };
    },

    /**
     * Generiert eine Zufallszahl unter Berücksichtigung des gewählten Bereichs.
     * @param {number} smartMin - Optional: Mindestwert für die Generierung.
     */
    getRandomNumber(smartMin = 0) {
        const limits = this.getLimits();
        
        let effectiveMin = limits.min;
        // SmartMin Logik: Erhöht die Chance auf größere Zahlen, falls gefordert
        if (smartMin > limits.min && smartMin < limits.max) {
            if (Math.random() > 0.2) {
                effectiveMin = smartMin;
            }
        }

        const range = limits.max - effectiveMin;
        
        // Hilfsfunktion für die reine Zufallszahl
        const generate = () => Math.floor(Math.random() * (range + 1)) + effectiveMin;

        let result = generate();

        // 50% GERINGERE WAHRSCHEINLICHKEIT FÜR DIE NULL
        // Wenn das Ergebnis 0 ist und der Bereich überhaupt die 0 zulässt:
        if (result === 0 && limits.max > 0) {
            // Wir "würfeln" erneut. Wenn die Zufallszahl < 0.5 ist, 
            // erzwingen wir einen Neuversuch, um eine andere Zahl zu finden.
            if (Math.random() < 0.5) {
                result = generate();
            }
        }

        return result;
    },

    getRandomNumbers(count, smartMin = 0) {
        const numbers = [];
        for (let i = 0; i < count; i++) {
            numbers.push(this.getRandomNumber(smartMin));
        }
        return numbers;
    }
};

/**
 * ZENTRALER EVENT-LISTENER
 * Der Generator muss seinen internen Status ZUERST aktualisieren
 */
window.addEventListener('rangeChanged', (event) => {
    if (event.detail) {
        window.NumberGenerator.currentRange = event.detail;
        // Speichern für Konsistenz zwischen den Modulen
        localStorage.setItem('selected-range-text', event.detail);
        document.documentElement.setAttribute('data-range', event.detail);
    }
});

// Initiale Attribut-Setzung beim Laden
document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.setAttribute('data-range', window.NumberGenerator.currentRange);
});