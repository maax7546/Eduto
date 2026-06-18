/**
 * UI-OPERATORS.JS
 * Nutzt den globalen SettingsBuilder für Geschwindigkeit und Zahlenraum.
 */
(function () {
    SettingsBuilder.ready(() => {
        SettingsBuilder.addSpeedSlider();
        SettingsBuilder.addRangePicker(['0-10', '0-20', '0-100']);
    });
})();
