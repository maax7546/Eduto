/**
 * NUMBERROW-MORE-OR-LESS
 */
window.MoreOrLess = Object.assign({}, window.MoreOrLessBase, {
    config: { mode: 'numbers' },

    init() {
        // Event-Listener: Wenn der Zahlenraum oder Modus im UI geändert wird
        const handleRangeChange = () => {
            console.log("Modul: Einstellungen geändert, neue Aufgabe...");
            this.newTask();
        };

        window.removeEventListener('rangeChanged', handleRangeChange);
        window.addEventListener('rangeChanged', handleRangeChange);

        if (window.MoreOrLessRender && window.MoreOrLessRender.init) {
            window.MoreOrLessRender.init(this);
        }

        this.newTask();
    },

    newTask() {
        if (window.MoreOrLessGenerator && window.MoreOrLessGenerator.generateRowTask) {
            this.currentTask = window.MoreOrLessGenerator.generateRowTask();
        }
        
        this.updateUI();

        // Antwort-Optionen im Container neu rendern (Standardgröße)
        if (window.MoreOrLessRender && window.MoreOrLessRender.createDraggableSymbols) {
            window.MoreOrLessRender.createDraggableSymbols(this);
        }
    },

    checkAnswer(droppedValue) {
        const val = parseInt(droppedValue);
        const a = parseInt(this.currentTask.a);
        const b = parseInt(this.currentTask.b);
        const opL = this.currentTask.opLeft;
        const opR = this.currentTask.opRight;

        let leftOk = false;
        let rightOk = false;

        // Prüfung linker Teil (a [op] val)
        if (opL === '<') leftOk = (a < val);
        else if (opL === '>') leftOk = (a > val);
        else if (opL === '=') leftOk = (a === val);

        // Prüfung rechter Teil (val [op] b)
        if (opR === '<') rightOk = (val < b);
        else if (opR === '>') rightOk = (val > b);
        else if (opR === '=') rightOk = (val === b);

        const isCorrect = (leftOk && rightOk);

        // Feedback in der Dropzone (Renderer zeigt hier Text/Zahl an)
        if (window.MoreOrLessRender && window.MoreOrLessRender.updateDropZoneVisual) {
            window.MoreOrLessRender.updateDropZoneVisual(val, isCorrect);
        }

        if (isCorrect) {
            setTimeout(() => this.newTask(), 1200);
        } else {
            setTimeout(() => {
                if (window.MoreOrLessRender && window.MoreOrLessRender.resetDropZone) {
                    window.MoreOrLessRender.resetDropZone();
                }
            }, 1000);
        }
    },

    specificUpdateUI() {
        const elA = document.getElementById('numA'); 
        const elB = document.getElementById('numB');
        const sLeft = document.getElementById('symbolLeft');
        const sRight = document.getElementById('symbolRight');
        const dropZone = document.getElementById('dropZone');
        
        if (elA) elA.textContent = this.currentTask.a;
        if (elB) elB.textContent = this.currentTask.b;

        const opL = this.currentTask.opLeft || '>';
        const opR = this.currentTask.opRight || '>';
        
        // Symbole über den Renderer setzen (Text oder Krokodil)
        if (sLeft && window.MoreOrLessRender) {
            sLeft.innerHTML = '';
            sLeft.appendChild(window.MoreOrLessRender.getSymbolContent(opL));
        }
        if (sRight && window.MoreOrLessRender) {
            sRight.innerHTML = '';
            sRight.appendChild(window.MoreOrLessRender.getSymbolContent(opR));
        }

        if (dropZone && window.MoreOrLessRender) {
            window.MoreOrLessRender.resetDropZone();
        }
    }
});

// Startet, sobald die asynchron nachgeladenen Mathe-Bausteine (NumberGenerator)
// und injectUI bereit sind — kein Warten auf window.load/Bilder mehr. Der Inhalt
// bleibt bis injectUI() via FOUC-Schutz (ui.css) verborgen, daher kein Aufblitzen.
(function start() {
    if (typeof injectUI !== 'function' || !window.NumberGenerator) {
        return requestAnimationFrame(start);
    }

    injectUI('numberrow-moreorless', {
        title: 'Zahlen einsetzen',
        showBack: true,
        showExit: true,
        showSettings: true,
        showFullscreen: true
    });
    window.MoreOrLess.init();
})();