/**
 * UI-INVERSEOPERATION
 * Modul-spezifische Settings: Reihenfolge Plus/Minus.
 * Ergänzt die generischen Sektionen aus ui-operators.js.
 */
(function () {
    let order = localStorage.getItem('inverse-order') || 'plus-first';
    document.documentElement.setAttribute('data-order', order);

    function labelFor(o) {
        return o === 'plus-first' ? '➕ Plus zuerst' : '➖ Minus zuerst';
    }

    SettingsBuilder.ready(() => {
        SettingsBuilder.addSection('Start mit Aufgabe', [
            SettingsBuilder.toggleButton({
                id: 'toggle-order',
                label: labelFor(order),
                active: false,
                onToggle: (_active, btn) => {
                    order = (order === 'plus-first') ? 'minus-first' : 'plus-first';
                    btn.textContent = labelFor(order);
                    btn.classList.remove('active'); // dieser Button toggelt Reihenfolge, nicht Zustand
                    localStorage.setItem('inverse-order', order);
                    document.documentElement.setAttribute('data-order', order);
                    window.dispatchEvent(new CustomEvent('orderChanged', { detail: order }));
                }
            })
        ], { id: 'inverse-order-section' });
    });
})();
