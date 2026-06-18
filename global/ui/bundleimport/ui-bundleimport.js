/**
 * UI-BUNDLE (JS) — generische, fach-unabhängige Bausteine.
 * Self-lokalisiert über den 'bundleimport/'-Marker und lädt die Bausteine
 * relativ zu global/ui/. Wird IMMER geladen (auch von Nicht-Mathe-Modulen).
 */
(function() {
    const scripts = [
        'elements/settings-builder.js',
        'elements/draganddrop.js',
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

    console.log("UI-Bundle: Basis-Pfad erkannt als: " + bundlePath);
})();
