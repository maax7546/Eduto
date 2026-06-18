/**
 * NUMBERS-MORE-OR-LESS STARTER
 */
window.MoreOrLess = Object.assign({}, window.MoreOrLessBase, {
    specificUpdateUI() {
        const elA = document.getElementById('numA'); 
        const elB = document.getElementById('numB');
        const dropZone = document.getElementById('dropZone');
        
        if (elA) {
            elA.textContent = this.currentTask.a;
            elA.className = 'nb-box nb-box-large nb-ghost number-box'; 
        }
        if (elB) {
            elB.textContent = this.currentTask.b;
            elB.className = 'nb-box nb-box-large nb-ghost number-box';
        }

        if (dropZone) {
            // nb-drop-target ist zwingend für draganddrop.js!
            dropZone.className = 'drop-zone nb-dropzone nb-drop-target';
            dropZone.innerHTML = ''; 
            dropZone.textContent = '';
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

    injectUI('numbers-moreorless', {
        title: 'Zahlen vergleichen',
        showBack: true,
        showExit: true,
        showSettings: true,
        showFullscreen: true
    });

    if (window.MoreOrLess && window.MoreOrLess.init) {
        window.MoreOrLess.init();
    }

    // Re-Initialisierung des Managers für dieses Modul
    if (window.DragDropManager) {
        window.DragDropManager.init((value, sourceElem, zone) => {
            // Diese Funktion wird aufgerufen, wenn draganddrop.js einen Drop erkennt
            if (window.MoreOrLess && window.MoreOrLess.checkAnswer) {
                window.MoreOrLess.checkAnswer(value);
            }
        });
    }
})();