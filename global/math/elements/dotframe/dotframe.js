/**
 * DOTFRAME.JS - Dynamische Sperre & Farblogik, Tippen + Wischen
 * REGEL:
 * 1. Sperre aktiv, wenn Rot UND Blau vorhanden sind.
 * 2. Wenn gesperrt: Neues Feld muss Farbe des Vorgängers haben.
 * 3. Wenn entsperrt: Neues Feld wird standardmäßig Rot (kann durch Klick zu Blau werden).
 * 4. Verhindert rbr / brb durch gezieltes Löschen oder Umfärben ganzer Blöcke.
 * 5. Wischen über mehrere Zellen wendet die Klick-Logik nacheinander auf jede
 *    neu betretene Zelle an (Vorwärts wie Rückwärts).
 */
window.renderDotframes = function() {
    const frames = document.querySelectorAll('.dot-frame');

    frames.forEach(frame => {
        frame.innerHTML = '';
        const isV20 = frame.classList.contains('v-20');
        const isMinus = frame.classList.contains('mode-minus');
        const totalDots = isV20 ? 20 : 10;

        let redCount = parseInt(frame.getAttribute('data-red')) || 0;
        let blueCount = parseInt(frame.getAttribute('data-blue')) || 0;

        const cells = [];

        for (let i = 0; i < totalDots; i++) {
            const cell = document.createElement('div');
            cell.classList.add('dot-cell');
            const dot = document.createElement('div');
            dot.classList.add('dot');

            if (isMinus) {
                if (i < redCount) {
                    dot.classList.add('red');
                } else if (i < (redCount + blueCount)) {
                    dot.classList.add('red', 'struck');
                } else {
                    dot.classList.add('empty');
                }
            } else if (i < redCount) {
                dot.classList.add('red');
            } else if (i < (redCount + blueCount)) {
                dot.classList.add('blue');
            } else {
                dot.classList.add('empty');
            }

            cell.appendChild(dot);
            frame.appendChild(cell);
            cells.push(cell);
        }

        function performAction(i) {
            if (frame.classList.contains('frozen')) return;
            // MINUS-MODUS: Reihenfolge ist immer "rote Punkte | durchgestrichene | leer".
            if (isMinus) {
                const allDotsM = Array.from(frame.querySelectorAll('.dot'));
                let redN = allDotsM.filter(d => d.classList.contains('red') && !d.classList.contains('struck')).length;
                let struckN = allDotsM.filter(d => d.classList.contains('struck')).length;
                const total = redN + struckN;
                const cur = allDotsM[i];

                if (cur.classList.contains('struck')) {
                    struckN = i - redN;
                } else if (cur.classList.contains('red')) {
                    struckN = struckN + (redN - i);
                    redN = i;
                } else if (cur.classList.contains('empty')) {
                    if (i === total) {
                        redN++;
                    }
                }

                for (let j = 0; j < totalDots; j++) {
                    if (j < redN) allDotsM[j].className = 'dot red';
                    else if (j < redN + struckN) allDotsM[j].className = 'dot red struck';
                    else allDotsM[j].className = 'dot empty';
                }

                frame.setAttribute('data-red', redN);
                frame.setAttribute('data-blue', struckN);

                if (typeof checkDots === 'function') checkDots();
                return;
            }

            // PLUS-MODUS
            let allDots = Array.from(frame.querySelectorAll('.dot'));
            let hasRed = allDots.some(d => d.classList.contains('red'));
            let hasBlue = allDots.some(d => d.classList.contains('blue'));
            let isLocked = hasRed && hasBlue;
            let lastIdx = allDots.findLastIndex(d => !d.classList.contains('empty'));
            const currentDot = allDots[i];

            if (currentDot.classList.contains('empty')) {
                if (i === lastIdx + 1 || (lastIdx === -1 && i === 0)) {
                    if (isLocked) {
                        const prevColor = allDots[lastIdx].classList.contains('red') ? 'red' : 'blue';
                        currentDot.className = `dot ${prevColor}`;
                    } else {
                        currentDot.className = 'dot red';
                    }
                }
            } else if (currentDot.classList.contains('red')) {
                const blueBefore = allDots.slice(0, i).some(d => d.classList.contains('blue'));
                const redBefore = allDots.slice(0, i).some(d => d.classList.contains('red'));

                if (blueBefore && redBefore) {
                    for (let j = i; j < totalDots; j++) {
                        allDots[j].className = 'dot empty';
                    }
                } else {
                    for (let j = i; j < totalDots; j++) {
                        if (allDots[j].classList.contains('red')) {
                            allDots[j].className = 'dot blue';
                        }
                    }
                }
            } else if (currentDot.classList.contains('blue')) {
                for (let j = i; j < totalDots; j++) {
                    allDots[j].className = 'dot empty';
                }
            }

            const finalDots = Array.from(frame.querySelectorAll('.dot'));
            const finalRed = finalDots.filter(d => d.classList.contains('red')).length;
            const finalBlue = finalDots.filter(d => d.classList.contains('blue')).length;

            frame.setAttribute('data-red', finalRed);
            frame.setAttribute('data-blue', finalBlue);

            if (typeof checkDots === 'function') checkDots();
        }

        // ============================================================
        // POINTER-EINGABE: Tippen + Wischen über mehrere Zellen
        //
        // Plus-Modus:
        //   - Vorwärts wendet die Klick-Logik pro neu betretene Zelle an.
        //   - Rückwärts löscht Zellen, sperrt aber auf die erste angetroffene
        //     Farbe — sobald die Geste an die Grenze einer anderen Farbe
        //     stößt, bleibt der Rest des Strokes wirkungslos.
        //
        // Minus-Modus:
        //   - Rückwärts (links): rote Punkte werden durchgestrichen.
        //   - Vorwärts (rechts): durchgestrichene werden wieder normale rote
        //     Punkte (un-strike), am rechten Rand kommen neue Rote dazu.
        //
        // Wisch-Strokes sind auf die Reihe der Startzelle beschränkt — wer
        // im oberen Zehnerfeld startet, kann nur dort wischen. Für das
        // ganze Zwanzigerfeld muss man zweimal wischen.
        // ============================================================
        const colTemplate = getComputedStyle(frame).gridTemplateColumns;
        const numCols = colTemplate.split(/\s+/).filter(s => s.length).length || (isV20 ? 10 : 5);
        function rowOf(i) { return Math.floor(i / numCols); }

        let isPressed = false;
        let lastCellIdx = -1;
        let strokeLocked = false;
        let strokeEraseColor = null;
        let strokeRow = -1;

        function eraseRangePlus(fromIdx, toIdx) {
            const allDots = Array.from(frame.querySelectorAll('.dot'));
            for (let j = toIdx; j >= fromIdx; j--) {
                if (strokeLocked) break;
                const dot = allDots[j];
                if (dot.classList.contains('empty')) continue;
                const c = dot.classList.contains('red') ? 'red' : 'blue';
                if (strokeEraseColor === null) {
                    strokeEraseColor = c;
                } else if (c !== strokeEraseColor) {
                    strokeLocked = true;
                    break;
                }
                dot.className = 'dot empty';
            }
            const finalRed = allDots.filter(d => d.classList.contains('red')).length;
            const finalBlue = allDots.filter(d => d.classList.contains('blue')).length;
            frame.setAttribute('data-red', finalRed);
            frame.setAttribute('data-blue', finalBlue);
            if (typeof checkDots === 'function') checkDots();
        }

        function strikeMinusCell(i, direction) {
            if (frame.classList.contains('frozen')) return;
            const allDots = Array.from(frame.querySelectorAll('.dot'));
            const dot = allDots[i];
            if (!dot) return;
            let redN = allDots.filter(d => d.classList.contains('red') && !d.classList.contains('struck')).length;
            let struckN = allDots.filter(d => d.classList.contains('struck')).length;

            if (dot.classList.contains('struck')) {
                if (direction === 'forward') {
                    // Un-strike: durchgestrichene Zellen von redN bis i werden wieder rot.
                    const additionalRed = (i + 1) - redN;
                    if (additionalRed <= 0) return;
                    redN += additionalRed;
                    struckN -= additionalRed;
                } else {
                    return;
                }
            } else if (dot.classList.contains('red')) {
                if (direction === 'backward') {
                    struckN += (redN - i);
                    redN = i;
                } else {
                    return;
                }
            } else if (dot.classList.contains('empty')) {
                if (i === redN + struckN) {
                    redN++;
                } else {
                    return;
                }
            }

            for (let j = 0; j < totalDots; j++) {
                if (j < redN) allDots[j].className = 'dot red';
                else if (j < redN + struckN) allDots[j].className = 'dot red struck';
                else allDots[j].className = 'dot empty';
            }
            frame.setAttribute('data-red', redN);
            frame.setAttribute('data-blue', struckN);
            if (typeof checkDots === 'function') checkDots();
        }

        function handleMove(e) {
            if (!isPressed || strokeLocked) return;
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const cellEl = el ? el.closest('.dot-cell') : null;
            if (!cellEl || !frame.contains(cellEl)) return;
            const idx = cells.indexOf(cellEl);
            if (idx === -1 || idx === lastCellIdx) return;
            if (rowOf(idx) !== strokeRow) return;

            if (idx > lastCellIdx) {
                for (let k = lastCellIdx + 1; k <= idx; k++) {
                    if (strokeLocked) break;
                    if (isMinus) strikeMinusCell(k, 'forward');
                    else performAction(k);
                }
            } else {
                if (isMinus) {
                    for (let k = lastCellIdx; k >= idx + 1; k--) {
                        if (strokeLocked) break;
                        strikeMinusCell(k, 'backward');
                    }
                } else {
                    eraseRangePlus(idx + 1, lastCellIdx);
                }
            }
            lastCellIdx = idx;
        }

        function endStroke() {
            isPressed = false;
            lastCellIdx = -1;
            strokeLocked = false;
            strokeEraseColor = null;
            strokeRow = -1;
            document.removeEventListener('pointermove', handleMove);
            document.removeEventListener('pointerup', endStroke);
            document.removeEventListener('pointercancel', endStroke);
        }

        cells.forEach((cell, idx) => {
            cell.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                isPressed = true;
                lastCellIdx = idx;
                strokeLocked = false;
                strokeEraseColor = null;
                strokeRow = rowOf(idx);
                performAction(idx);

                document.addEventListener('pointermove', handleMove);
                document.addEventListener('pointerup', endStroke);
                document.addEventListener('pointercancel', endStroke);
            });
        });
    });
};
