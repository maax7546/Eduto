/**
 * TESTUTILITY.JS
 * Generiert das Dashboard automatisch aus einer Snippet-Liste.
 *
 * Neue Test-Snippets hinzufügen:
 *   1. HTML-Datei in parts-testutility/ ablegen (z.B. 9.foo-snippet.html)
 *   2. Hier in SNIPPETS einen Eintrag ergänzen
 * Mehr ist nicht nötig — der Dashboard-Eintrag erscheint automatisch.
 */

const SNIPPETS = [
    { file: '1.typography-snippet.html',     badge: 'Snippet 1', title: 'Typografie' },
    { file: '2.numberbox-snippet.html',      badge: 'Snippet 2', title: 'Numberboxen' },
    { file: '3.dotframe-snippet.html',       badge: 'Snippet 3', title: 'Dotframes' },
    { file: '4.interaction-snippet.html',    badge: 'Snippet 4', title: 'Interaktion' },
    { file: '5.numbergen-test-snippet.html', badge: 'Snippet 5', title: 'Zufalls-Generator' },
    { file: '6.settings-layout-snippet.html',badge: 'Snippet 6', title: 'Settings Layout' },
    { file: '7.menu-buttons-snippet.html',   badge: 'Snippet 7', title: 'Menü Buttons' },
    { file: '8.numberline-test-snippet.html',badge: 'Snippet 8', title: 'Zahlenstrahl' }
];

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('snippet-grid');
    if (!grid) return;

    grid.innerHTML = SNIPPETS.map(s => `
        <a href="parts-testutility/${s.file}" class="menu-card">
            <span class="badge">${s.badge}</span>
            <h3>${s.title}</h3>
        </a>
    `).join('');
});
