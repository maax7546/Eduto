/**
 * MORE-OR-LESS RENDERER
 */
window.MoreOrLessRender = {
    init(logicInstance) {
        window.addEventListener('modeChanged', () => {
            this.createDraggableSymbols(logicInstance);
            this.resetDropZone();
            if (logicInstance.specificUpdateUI) logicInstance.specificUpdateUI();
        });
        this.createDraggableSymbols(logicInstance);
    },

    /**
     * Hilfsfunktion: Gibt entweder Text oder ein Krokodil-Bild zurück
     */
    getSymbolContent(symbol) {
        // Falls das Symbol eine Zahl ist (Zahlenreihen-Modus), immer Text zurückgeben
        if (!isNaN(symbol)) {
            return document.createTextNode(symbol);
        }

        if (window.useCrocodileMode) {
            let imgNum = 1;
            if (symbol === '<') imgNum = 1;
            if (symbol === '=') imgNum = 2;
            if (symbol === '>') imgNum = 3;

            const base = (window.MoreOrLessIcons && window.MoreOrLessIcons.crocBase)
                || '../../visuals-moreorless/';
            const img = document.createElement('img');
            img.src = `${base}Krokodil${imgNum}.png`;
            img.style.height = "90%";
            return img;
        }
        return document.createTextNode(symbol);
    },

    createDraggableSymbols(logicInstance) {
        const container = document.getElementById('symbolContainer');
        if (!container) return;
        container.innerHTML = '';
        
        if (logicInstance.config && logicInstance.config.mode === 'numbers') {
            const taskOptions = logicInstance.currentTask.options || [];
            taskOptions.forEach((val, index) => {
                const el = document.createElement('div');
                el.className = 'nb-box nb-option'; 
                el.draggable = true; 
                el.id = `opt-${index}`;
                el.setAttribute('data-value', val); 
                el.textContent = val;
                el.onclick = () => logicInstance.checkAnswer(val);
                container.appendChild(el);
            });
        } else {
            const symbols = ['<', '=', '>'];
            symbols.forEach((s, index) => {
                const el = document.createElement('div');
                el.className = 'nb-box nb-option'; 
                el.draggable = true; 
                el.id = `symbol-opt-${index}`;
                el.setAttribute('data-value', s); 
                el.appendChild(this.getSymbolContent(s));
                el.onclick = () => logicInstance.checkAnswer(s);
                container.appendChild(el);
            });
        }

        if (window.DragDropManager) {
            window.DragDropManager.init((value) => logicInstance.checkAnswer(value));
        }
    },

    updateDropZoneVisual(value, isCorrect) {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;

        dropZone.className = `drop-zone nb-dropzone nb-box ${isCorrect ? 'correct' : 'wrong'}`;
        dropZone.innerHTML = '';
        
        // WICHTIG: Wenn der Wert eine Zahl ist (isNaN ist false), 
        // zeigen wir immer nur den Text an, kein Krokodil.
        if (!isNaN(value)) {
            dropZone.textContent = value;
        } else {
            dropZone.appendChild(this.getSymbolContent(value));
        }
    },

    resetDropZone() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;
        
        dropZone.className = 'drop-zone nb-dropzone nb-box nb-drop-target';
        dropZone.innerHTML = ''; 
    }
};