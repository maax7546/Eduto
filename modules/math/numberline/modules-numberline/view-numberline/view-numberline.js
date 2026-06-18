document.addEventListener('DOMContentLoaded', () => {
    function startNumberline() {
        if (typeof window.initNumberline === 'function') {
            try {
                window.initNumberline();
                if (typeof window.jumpTo === 'function') {
                    window.jumpTo(0);
                }
                console.log("Zahlenstrahl initialisiert.");
            } catch (e) {
                console.error("Fehler beim Starten:", e);
            }
        } else {
            // Falls das Bundle extrem langsam lädt, versuchen wir es ein einziges Mal kurz darauf
            setTimeout(startNumberline, 50); 
        }
    }

    startNumberline(); 
});