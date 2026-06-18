/**
 * PROFIL: MORE-OR-LESS GENERATOR
 */
window.MoreOrLessGenerator = {
    /**
     * Hilfsfunktion: Holt den aktuellen Zahlenraum aus dem System oder der UI
     */
    _getEffectiveRange() {
        if (typeof NumberGenerator !== 'undefined' && NumberGenerator.getLimits) {
            return NumberGenerator.getLimits();
        }
        return { min: 0, max: 10 };
    },

    /**
     * Standard-Generator für den Vergleich zweier Zahlen (Modus: Zahlen vergleichen)
     */
    generatePair(forceEqualityBias = true) {
        if (typeof NumberGenerator === 'undefined') {
            console.error("Zentraler NumberGenerator fehlt!");
            return { left: 5, right: 5, result: '=' };
        }

        const left = NumberGenerator.getRandomNumber();
        let right;

        if (forceEqualityBias && Math.random() < 0.30) {
            right = left;
        } else {
            right = NumberGenerator.getRandomNumber();
        }

        let res = '=';
        if (left < right) res = '<';
        if (left > right) res = '>';

        return { left, right, result: res };
    },

    /**
     * Spezieller Generator für die Zahlenreihe (Zahlen einsetzen)
     * Unterstützt Standard (X < Y < Z), Gleichheit (X = X = X) 
     * und Gemischt (X < Y > Z oder X > Y < Z)
     */
    generateRowTask() {
        const range = this._getEffectiveRange();
        let min = range.min;
        let max = range.max;

        // Min-Range-Sicherung: < / > / Mixed brauchen mindestens 3 Stellen
        if (max - min < 2) {
            console.warn(`MoreOrLessGenerator: Zahlenraum ${min}-${max} zu klein, erweitere auf ${min}-${min + 2}`);
            max = min + 2;
        }

        const randInt = (lo, hi) => {
            if (hi < lo) hi = lo;
            return Math.floor(Math.random() * (hi - lo + 1)) + lo;
        };

        let opLeft, opRight, a, b, correct;

        // Prüfen, ob der "Gemischt"-Modus in der UI aktiviert wurde
        if (window.useMixedOperators) {
            // FALL: Gemischte Operatoren (Spitzen nach oben oder unten)
            const isPeakUp = Math.random() > 0.5; 
            
            if (isPeakUp) {
                opLeft = '<'; opRight = '>';
                correct = randInt(min + 1, max);
                a = randInt(min, correct - 1);
                b = randInt(min, correct - 1);
            } else {
                opLeft = '>'; opRight = '<';
                correct = randInt(min, max - 1);
                a = randInt(correct + 1, max);
                b = randInt(correct + 1, max);
            }
        } else {
            // FALL: Standard-Modus (Gleiche Operatoren)
            const rand = Math.random();
            let op;
            if (rand < 0.4) op = '<';
            else if (rand < 0.8) op = '>';
            else op = '=';

            opLeft = op;
            opRight = op;

            if (op === '=') {
                a = randInt(min, max);
                b = a;
                correct = a;
            } else if (op === '>') {
                // a > correct > b, also a >= min+2, b <= max-2
                a = randInt(min + 2, max);
                b = randInt(min, a - 2);
                correct = randInt(b + 1, a - 1);
            } else {
                // a < correct < b
                a = randInt(min, max - 2);
                b = randInt(a + 2, max);
                correct = randInt(a + 1, b - 1);
            }
        }

        // Falsche Optionen generieren
        const options = [correct];
        let attempts = 0;
        while (options.length < 3 && attempts < 100) {
            attempts++;
            let fake = randInt(min, max);
            
            // Validierung: fake darf nicht die Lösung sein und nicht a oder b
            let isValid = false;
            if (opLeft === '<' && opRight === '<') isValid = (fake > a && fake < b);
            else if (opLeft === '>' && opRight === '>') isValid = (fake < a && fake > b);
            else if (opLeft === '=' && opRight === '=') isValid = (fake === a);
            else if (opLeft === '<' && opRight === '>') isValid = (fake > a && fake > b);
            else if (opLeft === '>' && opRight === '<') isValid = (fake < a && fake < b);

            if (!options.includes(fake) && fake !== a && fake !== b && !isValid) {
                options.push(fake);
            }
        }

        return {
            a: a,
            b: b,
            opLeft: opLeft,
            opRight: opRight,
            answer: correct,
            options: options.sort(() => Math.random() - 0.5)
        };
    }
};