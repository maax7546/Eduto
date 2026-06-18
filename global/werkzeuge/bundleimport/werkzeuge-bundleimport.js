/**
 * WERKZEUGE-BUNDLE (JS) — werkzeuge-spezifische Bausteine (SeatTable).
 * Self-lokalisiert über den 'bundleimport/'-Marker und lädt relativ zu
 * global/werkzeuge/. Nur von Werkzeug-Modulen geladen, die diese Bausteine
 * brauchen (z. B. der Sitzplan). Kein math-Bündel nötig.
 */
(function () {
    const scripts = [
        'elements/seattable/seattable.js'
    ];

    const scriptSrc = document.currentScript.src;
    const bundlePath = scriptSrc.substring(0, scriptSrc.lastIndexOf('bundleimport/'));

    scripts.forEach(script => {
        const s = document.createElement('script');
        s.src = bundlePath + script;
        s.async = false;
        document.head.appendChild(s);
    });

    console.log('Werkzeuge-Bundle: Basis-Pfad erkannt als: ' + bundlePath);
})();
