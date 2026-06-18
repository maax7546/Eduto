/**
 * GRUPPEN-EINTEILUNG — Modul-Logik (reine Regie).
 *
 * Aufgabe: Gruppen von Hand zusammenstellen — pro Gruppe ein Namensfeld, mit
 * ＋ kommt ein weiteres Feld daneben; „Neue Gruppe" legt eine weitere Reihe an.
 * Die Gruppen liegen untereinander (gestapelt) und lassen sich am Griff ≡ als
 * GANZE Reihe per Drag&Drop umsortieren — so entsteht z. B. eine Reihenfolge
 * zum gemeinsamen Laufen. Drucken läuft über window.print() + @media print.
 *
 * Kein globaler Baustein wird nachgebaut: Header/Settings kommen aus global/ui
 * (injectUI + SettingsBuilder, siehe ui-gruppen-einteilung.js). Hier lebt nur
 * die Interaktionslogik genau dieser Übung.
 */
(function () {
    'use strict';

    // Modell: Array von Gruppen, jede Gruppe ein Array von Namen.
    let groups = [['']];
    let board, dragged = null;

    document.addEventListener('DOMContentLoaded', () => {
        board = document.getElementById('ge-board');
        document.getElementById('ge-add-group').addEventListener('click', addGroup);
        document.getElementById('ge-file').addEventListener('change', handleFile);
        attachBoardDnD();
        restore();
        render();
    });

    // ---- Modell <-> DOM ------------------------------------------------------
    // Liest den aktuellen (getippten / per Drag umsortierten) Stand aus dem DOM.
    function syncFromDOM() {
        if (!board) return;
        groups = [...board.querySelectorAll('.ge-group')].map(card =>
            [...card.querySelectorAll('.ge-name-input')].map(i => i.value)
        );
    }

    function groupIndex(card) {
        return [...board.querySelectorAll('.ge-group')].indexOf(card);
    }

    // ---- Rendern -------------------------------------------------------------
    function render() {
        board.innerHTML = '';
        groups.forEach((names, gi) => board.appendChild(makeGroup(names, gi)));
    }

    function makeGroup(names, gi) {
        const card = document.createElement('div');
        card.className = 'ge-group';

        // Griff zum Verschieben der ganzen Gruppe
        const grip = document.createElement('span');
        grip.className = 'ge-grip';
        grip.title = 'Gruppe verschieben';
        grip.textContent = '≡';
        enableHandleDrag(grip, card);
        card.appendChild(grip);

        const label = document.createElement('span');
        label.className = 'ge-group-label';
        label.textContent = (gi + 1) + '.';
        card.appendChild(label);

        // Namensfelder + ＋-Button
        const fields = document.createElement('div');
        fields.className = 'ge-group-fields';
        names.forEach(n => fields.appendChild(makeNameField(n)));

        const add = document.createElement('button');
        add.className = 'ge-add-field no-print';
        add.type = 'button';
        add.title = 'Feld hinzufügen';
        add.textContent = '＋';
        add.addEventListener('click', () => addField(card));
        fields.appendChild(add);
        card.appendChild(fields);

        // Ganze Gruppe löschen
        const del = document.createElement('button');
        del.className = 'ge-group-del no-print';
        del.type = 'button';
        del.title = 'Gruppe löschen';
        del.textContent = '🗑';
        del.addEventListener('click', () => deleteGroup(card));
        card.appendChild(del);

        return card;
    }

    function makeNameField(value) {
        const field = document.createElement('span');
        field.className = 'ge-name-field';

        const input = document.createElement('input');
        input.className = 'ge-name-input';
        input.type = 'text';
        input.placeholder = 'Name';
        input.value = value || '';
        input.addEventListener('input', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addField(field.closest('.ge-group'));
            }
        });

        const del = document.createElement('button');
        del.className = 'ge-field-del no-print';
        del.type = 'button';
        del.title = 'Feld entfernen';
        del.textContent = '×';
        del.addEventListener('click', () => deleteField(field));

        field.appendChild(input);
        field.appendChild(del);
        return field;
    }

    // ---- Struktur-Aktionen ---------------------------------------------------
    function addField(card) {
        syncFromDOM();
        const gi = groupIndex(card);
        if (gi < 0) return;
        groups[gi].push('');
        render();
        focusField(gi, groups[gi].length - 1);
        save();
    }

    function deleteField(field) {
        const card = field.closest('.ge-group');
        const gi = groupIndex(card);
        const ni = [...card.querySelectorAll('.ge-name-field')].indexOf(field);
        syncFromDOM();
        if (gi < 0 || ni < 0) return;
        groups[gi].splice(ni, 1);
        if (groups[gi].length === 0) groups[gi].push(''); // mind. ein Feld behalten
        render();
        save();
    }

    function addGroup() {
        syncFromDOM();
        groups.push(['']);
        render();
        focusField(groups.length - 1, 0);
        save();
    }

    function deleteGroup(card) {
        const gi = groupIndex(card);
        syncFromDOM();
        if (gi < 0) return;
        groups.splice(gi, 1);
        if (groups.length === 0) groups.push(['']);
        render();
        save();
    }

    function focusField(gi, ni) {
        const cards = board.querySelectorAll('.ge-group');
        if (!cards[gi]) return;
        const inputs = cards[gi].querySelectorAll('.ge-name-input');
        if (inputs[ni]) inputs[ni].focus();
    }

    // ---- Ganze Gruppen per Drag&Drop umsortieren ----------------------------
    // Eine Karte ist nur draggable, solange am Griff gezogen wird — sonst
    // ließen sich die Eingabefelder nicht mehr normal bedienen.
    function enableHandleDrag(grip, card) {
        grip.addEventListener('mousedown', () => { card.draggable = true; });
        grip.addEventListener('mouseup', () => { card.draggable = false; });
        card.addEventListener('dragstart', (e) => {
            dragged = card;
            card.classList.add('ge-dragging');
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('ge-dragging');
            card.draggable = false;
            dragged = null;
            syncFromDOM(); // neue Reihenfolge übernehmen
            render();      // Nummerierung (1., 2., …) aktualisieren
            save();
        });
    }

    function attachBoardDnD() {
        board.addEventListener('dragover', (e) => {
            if (!dragged) return;
            e.preventDefault();
            const after = getDragAfterElement(e.clientY);
            if (after == null) board.appendChild(dragged);
            else board.insertBefore(dragged, after);
        });
    }

    // Findet die Gruppe, vor der eingefügt werden soll (anhand Maus-Y).
    function getDragAfterElement(y) {
        const cards = [...board.querySelectorAll('.ge-group:not(.ge-dragging)')];
        return cards.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: -Infinity }).element || null;
    }

    // ---- Persistenz ----------------------------------------------------------
    function save() {
        syncFromDOM();
        localStorage.setItem('einteilung-groups', JSON.stringify(groups));
    }

    function restore() {
        try {
            const saved = JSON.parse(localStorage.getItem('einteilung-groups') || 'null');
            if (Array.isArray(saved) && saved.length && saved.every(Array.isArray)) {
                groups = saved.map(g => (g.length ? g : ['']));
            }
        } catch (_) { /* ignorieren */ }
        if (!groups.length) groups = [['']];
    }

    // Liefert die getippten Gruppen ohne Leerfelder/-gruppen.
    function cleanGroups() {
        return groups
            .map(g => g.map(n => n.trim()).filter(Boolean))
            .filter(g => g.length);
    }

    // ---- PDF erzeugen (ohne Bibliothek) -------------------------------------
    // Baut ein minimales, gültiges PDF mit der Aufstellung als Text. Hängt die
    // Gruppen-Daten als base64 hinter %%EOF an — PDF-Reader ignorieren alles
    // nach %%EOF, beim erneuten Hochladen lesen wir genau diese Zeile zurück.
    const MARKER = '%GRUPPENDATA:';

    function buildPdfBytes(data) {
        // PDF-Strings: \ ( ) maskieren; auf Latin-1-Bytes abbilden (WinAnsi).
        const esc = s => String(s).replace(/[\\()]/g, m => '\\' + m);
        const latin1 = s => s.split('').map(ch => ch.charCodeAt(0) <= 255 ? ch : '?').join('');
        const line = s => '(' + latin1(esc(s)) + ') Tj\nT*\n';

        let content = 'BT\n/F1 22 Tf\n60 790 Td\n' + line('Sport-Aufstellung')
                    + '/F1 13 Tf\n0 -16 Td\n22 TL\n';
        data.forEach((g, i) => { content += line((i + 1) + '. ' + g.join(', ')); });
        content += 'ET';

        const obj = [];
        obj[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        obj[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
        obj[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
               + '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>';
        obj[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        obj[5] = '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream';

        let pdf = '%PDF-1.4\n';
        const offsets = [];
        for (let i = 1; i <= 5; i++) {
            offsets[i] = pdf.length;
            pdf += i + ' 0 obj\n' + obj[i] + '\nendobj\n';
        }
        const xref = pdf.length;
        pdf += 'xref\n0 6\n0000000000 65535 f \n';
        for (let i = 1; i <= 5; i++) {
            pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
        }
        pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';

        // Daten zum Wieder-Laden anhängen (von Readern ignoriert).
        pdf += MARKER + btoa(unescape(encodeURIComponent(JSON.stringify(data)))) + '\n';

        const bytes = new Uint8Array(pdf.length);
        for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
        return bytes;
    }

    // ---- PDF wieder einlesen -------------------------------------------------
    function handleFile(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            // Bytes 1:1 als Latin-1 lesen → der ASCII-Marker bleibt unversehrt.
            const buf = new Uint8Array(reader.result);
            let s = '';
            for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);

            const m = s.match(/%GRUPPENDATA:([A-Za-z0-9+/=]+)/);
            if (!m) {
                alert('In dieser PDF wurden keine Gruppen-Daten gefunden.\n\n'
                    + 'Bitte eine Datei wählen, die hier mit „💾 Als PDF speichern" erstellt wurde.');
                return;
            }
            try {
                const data = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
                if (!Array.isArray(data) || !data.length || !data.every(Array.isArray)) {
                    throw new Error('Format');
                }
                groups = data.map(g => (g.length ? g : ['']));
                render();  // DOM zuerst aufbauen …
                save();    // … dann sichern (save() liest den DOM)
            } catch (err) {
                alert('Die Aufstellung konnte aus dieser Datei nicht gelesen werden.');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // ---- Öffentliche API für die Settings (ui-gruppen-einteilung.js) --------
    window.printLineup = function () {
        syncFromDOM();
        if (!cleanGroups().length) { alert('Bitte zuerst Namen eingeben.'); return; }
        window.print();
    };

    window.savePdf = function () {
        syncFromDOM();
        const data = cleanGroups();
        if (!data.length) { alert('Bitte zuerst Namen eingeben.'); return; }
        const blob = new Blob([buildPdfBytes(data)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aufstellung.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    window.loadPdf = function () {
        const input = document.getElementById('ge-file');
        input.value = ''; // gleiche Datei erneut wählbar machen
        input.click();
    };

    window.resetEinteilung = function () {
        groups = [['']];
        localStorage.removeItem('einteilung-groups');
        render();
    };
})();
