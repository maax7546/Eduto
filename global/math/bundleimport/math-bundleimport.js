/**
 * MATH-BUNDLE (JS) — mathe-spezifische Bausteine
 * (Zahlengenerator, Zahlenstrahl + Settings, Zehnerfeld).
 * Self-lokalisiert über den 'bundleimport/'-Marker und lädt relativ zu global/math/.
 * Nur von Mathe-Modulen geladen; ein Nicht-Mathe-Modul lässt dieses Bündel weg.
 */
(function() {
    const scripts = [
        'elements/numbergenerator.js',
        'elements/numberline/numberline.js',
        'elements/numberline/settings-numberline/settings-numberline.js',
        'elements/numberline/settings-numberline/jump-button-numberline.js',
        'elements/numberline/settings-numberline/reset-button-numberline.js',
        'elements/numberline/settings-numberline/zoom-button-numberline.js',
        'elements/numberline/settings-numberline/shownegatives-button-numberline.js',
        'elements/numberline/settings-numberline/interval-button-numberline.js',
        'elements/dotframe/dotframe.js',
    ];

    const currentScript = document.currentScript;
    const scriptSrc = currentScript.src;
    const bundlePath = scriptSrc.substring(0, scriptSrc.lastIndexOf('bundleimport/'));

    scripts.forEach(script => {
        const s = document.createElement('script');
        s.src = bundlePath + script;
        s.async = false;
        document.head.appendChild(s);
    });

    console.log("Math-Bundle: Basis-Pfad erkannt als: " + bundlePath);
})();
