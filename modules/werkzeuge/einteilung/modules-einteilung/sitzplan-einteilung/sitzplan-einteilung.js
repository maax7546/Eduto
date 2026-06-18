/**
 * SITZPLAN-EINTEILUNG — Modul-Logik (reine Regie).
 *
 * Aufgabe: Klassenraum-Sitzplan bauen. Unten eine Leiste mit Tisch-Vorlagen
 * (Einzel-, Doppel-, Vierergruppentisch); per Ziehen landet ein Tisch auf der
 * großen freien Fläche. Tische rasten magnetisch aneinander (Stühle wechseln
 * dabei die Seite). Mit einem Aufziehen auf leerer Fläche (wie beim Markieren)
 * lassen sich MEHRERE Tische auswählen und gemeinsam verschieben; ausgewählte
 * Tische lassen sich mit der Lösch-/Rücktaste entfernen. Oben ein Rückgängig-/
 * Wiederholen-Knopf.
 *
 * Der Tisch selbst (Aussehen + Bedienung + Magnetismus + Gruppen-Verschieben +
 * Stühle) ist der GLOBALE Baustein `window.SeatTable` aus global/werkzeuge/ —
 * hier NICHT nachgebaut. Dieses Modul ist nur Regie: Vorlagen, Leiste, Mehrfach-
 * Auswahl/Marquee, Tastatur-Löschen, Undo/Redo, Speichern und PDF-Export.
 * Header/Settings kommen aus global/ui.
 */
(function () {
    'use strict';

    // Tisch-Vorlagen: Maße + Standard-Bestuhlung (Seite je Stuhl).
    const TEMPLATES = {
        einzel: { w: 90,  h: 64,  chairs: ['bottom'] },
        doppel: { w: 150, h: 64,  chairs: ['bottom', 'bottom'] },
        vierer: { w: 150, h: 110, chairs: ['top', 'top', 'bottom', 'bottom'] }
    };

    // ---- Zustand -------------------------------------------------------------
    let tables = [];                 // Modell: Array von Tisch-Modellen
    let selectedIds = new Set();     // ausgewählte Tische (Mehrfach möglich)
    let nextId = 1;                  // fortlaufende ID für Tische UND Stühle
    let area, fileInput, undoBtn, redoBtn;
    let marquee = null;              // aktives Aufzieh-Rechteck

    // Undo/Redo: Schnappschüsse (JSON) des Tisch-Modells.
    let undoStack = [], redoStack = [], lastState = '[]', nameTimer = null;
    const HIST_MAX = 60;

    // SeatTable kommt aus dem async geladenen werkzeuge-Bündel.
    document.addEventListener('DOMContentLoaded', () => {
        if (window.SeatTable) init();
        else window.addEventListener('load', init, { once: true });
    });

    function init() {
        area = document.getElementById('sp-area');
        fileInput = document.getElementById('sp-file');
        undoBtn = document.getElementById('sp-undo');
        redoBtn = document.getElementById('sp-redo');

        fileInput.addEventListener('change', handleFile);
        undoBtn.addEventListener('click', undo);
        redoBtn.addEventListener('click', redo);

        document.querySelectorAll('.sp-tool').forEach(tool => {
            tool.addEventListener('pointerdown', e => startCreate(e, tool.dataset.type));
        });

        // Aufziehen auf leerer Fläche → Mehrfach-Auswahl (Marquee).
        area.addEventListener('pointerdown', e => { if (e.target === area) startMarquee(e); });

        // Ausgewählte Tische mit Lösch-/Rücktaste entfernen.
        document.addEventListener('keydown', onKeyDown);

        restore();
        migratePultChair();   // alten Pult-Stuhl einmalig auf die richtige Seite
        ensurePult();   // Lehrer-Pult automatisch bereitstellen (außer entfernt)
        render();
        save();
        lastState = snapshot();
        updateHistButtons();
    }

    // ---- Lehrer-Pult ---------------------------------------------------------
    // Ein Doppeltisch mit der Beschriftung „Pult" und nur einem Stuhl, links vor
    // der Tafel. Standardmäßig vorhanden; entfernt der Nutzer ihn, bleibt er weg.
    const PULT_GONE = 'sitzplan-pult-removed';

    function ensurePult() {
        if (localStorage.getItem(PULT_GONE) === '1') return;
        if (tables.some(t => t.type === 'pult')) return;
        tables.push({
            id: nextId++, type: 'pult', label: 'Pult',
            w: 150, h: 64, rot: 0, cx: 140, cy: 150,   // links, etwas vorgezogen
            chairs: [{ id: nextId++, side: 'top', name: '' }] // ein Stuhl, zur Tafel
        });
    }

    // Einmalige Korrektur: ein bereits gespeichertes Pult mit dem alten
    // Standard-Stuhl (unten) auf die richtige Seite (oben, zur Tafel) drehen.
    function migratePultChair() {
        if (localStorage.getItem('sitzplan-pult-side-fixed') === '1') return;
        localStorage.setItem('sitzplan-pult-side-fixed', '1');
        const p = tables.find(t => t.type === 'pult');
        if (p && p.chairs.length === 1 && p.chairs[0].side === 'bottom') p.chairs[0].side = 'top';
    }

    // ---- kleine Helfer -------------------------------------------------------
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const byId = id => tables.find(t => t.id === id);
    const elOf = id => area.querySelector('.st-table[data-id="' + id + '"]');

    // ---- Auswahl -------------------------------------------------------------
    function applySelection() {
        const solo = selectedIds.size === 1;
        area.querySelectorAll('.st-table').forEach(el => {
            const sel = selectedIds.has(+el.dataset.id);
            el.classList.toggle('st-selected', sel);
            el.classList.toggle('st-solo', sel && solo);
        });
    }
    function setSelection(ids) { selectedIds = new Set(ids); applySelection(); }

    // ---- Tisch ans DOM (über den globalen Baustein) -------------------------
    function siblingsFor(model) {
        return tables
            .filter(t => t.id !== model.id)
            .map(t => ({ model: t, el: elOf(t.id) }));
    }

    function makeTableElement(model) {
        const el = SeatTable.create(model, {
            area: area,
            magnet: true,
            getSiblings: () => siblingsFor(model),
            // Bei Mehrfach-Auswahl wandern die anderen ausgewählten Tische mit.
            getMoveGroup: id => {
                if (selectedIds.size <= 1 || !selectedIds.has(id)) return [];
                return [...selectedIds].filter(x => x !== id)
                    .map(x => ({ model: byId(x), el: elOf(x) }));
            },
            nextChairId: () => nextId++,
            onChange: (m, reason) => { save(); if (reason === 'name') commitDebounced(); else commit(); },
            // Druck auf einen Tisch: nur neu auswählen, wenn er noch nicht in der
            // Auswahl ist (so bleibt eine Mehrfach-Auswahl zum Gruppen-Zug erhalten).
            onSelect: id => { if (!selectedIds.has(id)) setSelection([id]); },
            onDelete: id => deleteTables([id])
        });
        const sel = selectedIds.has(model.id);
        el.classList.toggle('st-selected', sel);
        el.classList.toggle('st-solo', sel && selectedIds.size === 1);
        return el;
    }

    // =========================================================================
    //  Tisch erzeugen (aus der Leiste ziehen)
    // =========================================================================
    function startCreate(e, type) {
        e.preventDefault();
        const tpl = TEMPLATES[type];
        const r = area.getBoundingClientRect();
        const model = {
            id: nextId++, type: type,
            w: tpl.w, h: tpl.h, rot: 0,
            cx: clamp(e.clientX - r.left, 0, r.width),
            cy: clamp(e.clientY - r.top, 0, r.height),
            chairs: tpl.chairs.map(side => ({ id: nextId++, side: side, name: '' }))
        };
        tables.push(model);
        const el = makeTableElement(model);
        area.appendChild(el);
        setSelection([model.id]);
        SeatTable.startMove(el, e); // sofort am Cursor/Finger führen (commit am Drag-Ende)
    }

    function deleteTables(ids) {
        if (!ids.length) return;
        const set = new Set(ids);
        // Wird das Pult gelöscht, merken — dann kommt es nicht automatisch zurück.
        if (tables.some(t => set.has(t.id) && t.type === 'pult')) {
            localStorage.setItem(PULT_GONE, '1');
        }
        tables = tables.filter(t => !set.has(t.id));
        ids.forEach(id => { const el = elOf(id); if (el) el.remove(); selectedIds.delete(id); });
        applySelection();
        save();
        commit();
    }

    function render() {
        area.querySelectorAll('.st-table').forEach(e => e.remove());
        tables.forEach(t => area.appendChild(makeTableElement(t)));
    }

    // =========================================================================
    //  Marquee — mehrere Tische durch Aufziehen auswählen
    // =========================================================================
    function startMarquee(e) {
        e.preventDefault();
        const r = area.getBoundingClientRect();
        const x0 = e.clientX - r.left, y0 = e.clientY - r.top;
        const box = document.createElement('div');
        box.className = 'sp-marquee';
        area.appendChild(box);
        marquee = { box: box, moved: false, rect: null };

        const move = ev => {
            const x = clamp(ev.clientX - r.left, 0, r.width);
            const y = clamp(ev.clientY - r.top, 0, r.height);
            const l = Math.min(x0, x), t = Math.min(y0, y), w = Math.abs(x - x0), h = Math.abs(y - y0);
            box.style.left = l + 'px'; box.style.top = t + 'px';
            box.style.width = w + 'px'; box.style.height = h + 'px';
            if (w > 3 || h > 3) marquee.moved = true;
            marquee.rect = { l: l, t: t, r: l + w, b: t + h };
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            box.remove();
            if (marquee.moved && marquee.rect) {
                const hit = tables
                    .filter(tb => rectsIntersect(marquee.rect, tableAABB(tb)))
                    .map(tb => tb.id);
                setSelection(hit);
            } else {
                setSelection([]); // bloßer Klick auf leere Fläche → Auswahl aufheben
            }
            marquee = null;
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up, { once: true });
    }

    // Achsen-ausgerichtete Hülle eines Tisches (inkl. Drehung) in Flächen-Pixeln.
    function tableAABB(m) {
        const cs = SeatTable.cornersPlan(m);
        let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
        cs.forEach(p => { l = Math.min(l, p[0]); r = Math.max(r, p[0]); t = Math.min(t, p[1]); b = Math.max(b, p[1]); });
        return { l: l, t: t, r: r, b: b };
    }
    function rectsIntersect(a, b) { return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t; }

    // =========================================================================
    //  Tastatur — ausgewählte Tische löschen
    // =========================================================================
    function onKeyDown(e) {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        const ae = document.activeElement;
        if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return; // Namen tippen
        if (!selectedIds.size) return;
        e.preventDefault();
        deleteTables([...selectedIds]);
    }

    // =========================================================================
    //  Persistenz (localStorage)
    // =========================================================================
    // Saubere Kopie: nur die echten Modell-Felder (keine internen Lauf-Felder).
    function cleanTables() {
        return tables.map(t => ({
            id: t.id, type: t.type, label: t.label, w: t.w, h: t.h, rot: t.rot, cx: t.cx, cy: t.cy,
            chairs: t.chairs.map(c => ({ id: c.id, side: c.side, name: c.name }))
        }));
    }

    function save() { localStorage.setItem('sitzplan-tables', JSON.stringify(cleanTables())); }

    function restore() {
        try {
            const saved = JSON.parse(localStorage.getItem('sitzplan-tables') || 'null');
            if (Array.isArray(saved)) tables = saved;
        } catch (_) { /* ignorieren */ }
        refreshNextId();
    }

    function refreshNextId() {
        let max = 0;
        tables.forEach(t => {
            max = Math.max(max, t.id || 0);
            (t.chairs || []).forEach(c => { max = Math.max(max, c.id || 0); });
        });
        nextId = max + 1;
    }

    // =========================================================================
    //  Undo / Redo (Schnappschuss-basiert)
    // =========================================================================
    function snapshot() { return JSON.stringify(cleanTables()); }

    function commit() {
        clearTimeout(nameTimer); nameTimer = null;
        const s = snapshot();
        if (s === lastState) return;
        undoStack.push(lastState);
        if (undoStack.length > HIST_MAX) undoStack.shift();
        lastState = s;
        redoStack = [];
        updateHistButtons();
    }

    // Tipp-Eingaben in Namensfeldern sammeln (nicht je Tastendruck ein Schritt).
    function commitDebounced() { clearTimeout(nameTimer); nameTimer = setTimeout(commit, 500); }

    function applyState(s) {
        tables = JSON.parse(s);
        refreshNextId();
        selectedIds = new Set();
        render();
        save();
    }

    function undo() {
        clearTimeout(nameTimer); nameTimer = null;
        // Noch nicht festgehaltene Tipp-Änderung zuerst als eigenen Schritt sichern.
        const cur = snapshot();
        if (cur !== lastState) { undoStack.push(lastState); lastState = cur; redoStack = []; }
        if (!undoStack.length) { updateHistButtons(); return; }
        redoStack.push(lastState);
        lastState = undoStack.pop();
        applyState(lastState);
        updateHistButtons();
    }

    function redo() {
        if (!redoStack.length) return;
        undoStack.push(lastState);
        lastState = redoStack.pop();
        applyState(lastState);
        updateHistButtons();
    }

    function updateHistButtons() {
        if (undoBtn) undoBtn.disabled = undoStack.length === 0;
        if (redoBtn) redoBtn.disabled = redoStack.length === 0;
    }

    // =========================================================================
    //  PDF erzeugen (ohne Bibliothek) — Plan grafisch zeichnen + Daten hinter
    //  %%EOF anhängen (re-importierbar). Geometrie kommt aus SeatTable.
    // =========================================================================
    const MARKER = '%SITZPLANDATA:';

    function buildPdfBytes(data) {
        const CHAIR = SeatTable.CHAIR; // erst hier referenzieren (Bündel ist dann geladen)
        const esc = s => String(s).replace(/[\\()]/g, m => '\\' + m);
        const latin1 = s => s.split('').map(ch => ch.charCodeAt(0) <= 255 ? ch : '?').join('');
        const enc = s => latin1(esc(s));
        const fmt = n => '' + (Math.round(n * 100) / 100);

        // --- Plan-Bounds über alle Tische + Stühle ---
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        data.forEach(t => {
            SeatTable.cornersPlan(t).forEach(p => {
                minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
                minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
            });
            SeatTable.chairSeats(t).forEach(s => {
                minX = Math.min(minX, s.x - CHAIR / 2); maxX = Math.max(maxX, s.x + CHAIR / 2);
                minY = Math.min(minY, s.y - CHAIR / 2); maxY = Math.max(maxY, s.y + CHAIR / 2);
            });
        });
        minX -= 20; minY -= 20; maxX += 20; maxY += 20;

        // --- Abbildung Plan → A4 quer (842×595 pt) ---
        const PW = 842, PH = 595, M = 28, TOP = 40; // TOP: Platz für Titel
        const availW = PW - 2 * M, availH = PH - M - TOP;
        const contentW = Math.max(1, maxX - minX), contentH = Math.max(1, maxY - minY);
        const scale = Math.min(availW / contentW, availH / contentH, 2);
        const drawnW = contentW * scale, drawnH = contentH * scale;
        const originX = M + (availW - drawnW) / 2;
        const topY = PH - TOP - (availH - drawnH) / 2; // PDF-Y der Plan-Oberkante
        const mapX = X => originX + (X - minX) * scale;
        const mapY = Y => topY - (Y - minY) * scale;   // Plan-Y zeigt nach unten

        // --- Inhalt zeichnen ---
        let c = 'BT /F1 18 Tf 0.17 0.24 0.31 rg ' + fmt(M) + ' ' + fmt(PH - 26)
              + ' Td (' + enc('Sitzplan') + ') Tj ET\n';

        data.forEach(t => {
            // Tischfläche (helles Rechteck, ggf. gedreht)
            const cor = SeatTable.cornersPlan(t).map(p => [mapX(p[0]), mapY(p[1])]);
            c += '0.90 0.94 0.95 rg 0.30 0.35 0.40 RG 1.2 w\n';
            c += fmt(cor[0][0]) + ' ' + fmt(cor[0][1]) + ' m\n';
            for (let i = 1; i < 4; i++) c += fmt(cor[i][0]) + ' ' + fmt(cor[i][1]) + ' l\n';
            c += 'h B\n';

            // Beschriftung (z. B. „Pult") mittig auf den Tisch
            if (t.label) {
                const LX = mapX(t.cx), LY = mapY(t.cy);
                const ls = Math.max(7, Math.min(13, t.h * scale * 0.22));
                const lw = t.label.length * ls * 0.5;
                c += 'BT /F1 ' + fmt(ls) + ' Tf 0.42 0.34 0.22 rg ' + fmt(LX - lw / 2) + ' '
                   + fmt(LY - ls * 0.33) + ' Td (' + enc(t.label) + ') Tj ET\n';
            }

            // Stühle (weiße Kreise) + Namen
            SeatTable.chairSeats(t).forEach(s => {
                const X = mapX(s.x), Y = mapY(s.y), r = (CHAIR / 2) * scale, k = 0.5523 * r;
                c += '1 1 1 rg 0.45 0.50 0.55 RG 1 w\n';
                c += fmt(X + r) + ' ' + fmt(Y) + ' m\n';
                c += fmt(X + r) + ' ' + fmt(Y + k) + ' ' + fmt(X + k) + ' ' + fmt(Y + r) + ' ' + fmt(X) + ' ' + fmt(Y + r) + ' c\n';
                c += fmt(X - k) + ' ' + fmt(Y + r) + ' ' + fmt(X - r) + ' ' + fmt(Y + k) + ' ' + fmt(X - r) + ' ' + fmt(Y) + ' c\n';
                c += fmt(X - r) + ' ' + fmt(Y - k) + ' ' + fmt(X - k) + ' ' + fmt(Y - r) + ' ' + fmt(X) + ' ' + fmt(Y - r) + ' c\n';
                c += fmt(X + k) + ' ' + fmt(Y - r) + ' ' + fmt(X + r) + ' ' + fmt(Y - k) + ' ' + fmt(X + r) + ' ' + fmt(Y) + ' c\n';
                c += 'B\n';

                if (s.name) {
                    const size = Math.max(5, Math.min(11, CHAIR * scale * 0.30));
                    const approxW = s.name.length * size * 0.5;
                    const tx = X - approxW / 2, ty = Y - size * 0.33;
                    c += 'BT /F1 ' + fmt(size) + ' Tf 0 0 0 rg ' + fmt(tx) + ' ' + fmt(ty)
                       + ' Td (' + enc(s.name) + ') Tj ET\n';
                }
            });
        });

        // --- PDF-Objekte zusammensetzen ---
        const obj = [];
        obj[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        obj[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
        obj[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] '
               + '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>';
        obj[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        obj[5] = '<< /Length ' + c.length + ' >>\nstream\n' + c + '\nendstream';

        let pdf = '%PDF-1.4\n';
        const offsets = [];
        for (let i = 1; i <= 5; i++) {
            offsets[i] = pdf.length;
            pdf += i + ' 0 obj\n' + obj[i] + '\nendobj\n';
        }
        const xref = pdf.length;
        pdf += 'xref\n0 6\n0000000000 65535 f \n';
        for (let i = 1; i <= 5; i++) pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
        pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';

        // Daten zum Wieder-Laden anhängen.
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
            const buf = new Uint8Array(reader.result);
            let s = '';
            for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);

            const m = s.match(/%SITZPLANDATA:([A-Za-z0-9+/=]+)/);
            if (!m) {
                alert('In dieser PDF wurde kein Sitzplan gefunden.\n\n'
                    + 'Bitte eine Datei wählen, die hier mit „💾 Als PDF speichern" erstellt wurde.');
                return;
            }
            try {
                const data = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
                if (!Array.isArray(data)) throw new Error('Format');
                tables = data;
                selectedIds = new Set();
                refreshNextId();
                render();
                save();
                commit();
            } catch (err) {
                alert('Der Sitzplan konnte aus dieser Datei nicht gelesen werden.');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // =========================================================================
    //  Öffentliche API für die Settings (ui-sitzplan-einteilung.js)
    // =========================================================================
    window.savePlanPdf = function () {
        if (!tables.length) { alert('Bitte zuerst Tische in den Raum ziehen.'); return; }
        const blob = new Blob([buildPdfBytes(cleanTables())], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitzplan.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    window.loadPlanPdf = function () {
        fileInput.value = ''; // gleiche Datei erneut wählbar machen
        fileInput.click();
    };

    window.printPlan = function () {
        if (!tables.length) { alert('Bitte zuerst Tische in den Raum ziehen.'); return; }
        setSelection([]);
        window.print();
    };

    window.resetSitzplan = function () {
        tables = [];
        selectedIds = new Set();
        localStorage.removeItem('sitzplan-tables');
        localStorage.removeItem(PULT_GONE); // Pult kommt beim Zurücksetzen zurück
        ensurePult();
        render();
        save();
        commit();
    };
})();
