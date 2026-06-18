/**
 * SEATTABLE — globaler Werkzeuge-Baustein: ein Sitzplan-Tisch.
 *
 * Hier lebt die KOMPLETTE Funktionsweise eines Tisches — genau einmal, global:
 *   - Aussehen/DOM (Rechteck + Stuhl-Kreise mit Namensfeldern)
 *   - Bedienung: Verschieben, Größe ändern (Eck-Griff), Drehen (rastet auf 45°)
 *   - Stühle: je Seite verteilen, hinzufügen (＋), entfernen (×), Namen lesbar
 *     halten (Gegen-Rotation)
 *   - MAGNETISMUS: beim Verschieben rastet der Tisch an benachbarte Tische an
 *     (waagerecht ODER hochkant, auch unterschiedlich große Tische). Die an der
 *     berührten Kante liegenden Stühle wechseln dabei automatisch auf die
 *     gegenüberliegende (freie) Seite.
 *
 * Ein Modul baut diesen Tisch NICHT nach. Es ruft `window.SeatTable.create()`
 * auf und liefert über `opts` nur die Regie (Geschwister-Tische für den Magnet,
 * Speichern, Auswahl, Löschen). Geometrie-Helfer (`cornersPlan`, `chairSeats`)
 * dienen z. B. dem PDF-Export im Modul.
 *
 * Modell eines Tisches:
 *   { id, w, h, rot, cx, cy, chairs: [ { id, side('top'|'bottom'|'left'|'right'), name } ] }
 *   cx/cy = Zentrum (Plan-Pixel relativ zur Fläche), rot = Grad (im Uhrzeigersinn).
 */
(function () {
    'use strict';

    // ---- Konstanten ----------------------------------------------------------
    const CHAIR = 38;   // Durchmesser eines Stuhl-Kreises (px)
    const GAP   = 8;    // Abstand Stuhl ↔ Tischkante (px)
    const CTRL  = 24;   // Größe der Bedien-Buttons/Griffe (px)
    const MINW  = 50, MINH = 40;     // kleinste Tischgröße
    const SNAP  = 22;   // Magnet-Fangweite fürs Kanten-Andocken (px)
    const ALIGN = 10;   // Toleranz fürs Ausrichten (Reihen/Spalten) (px)

    // Seiten im Uhrzeigersinn — für Rotations-Mathematik.
    const SIDES = ['top', 'right', 'bottom', 'left'];
    const SIDE_IX = { top: 0, right: 1, bottom: 2, left: 3 };

    let drag = null; // aktive Interaktion: { mode, model, el, opts, offX, offY, ... }

    // =========================================================================
    //  Öffentliche API
    // =========================================================================
    const SeatTable = {
        CHAIR: CHAIR, GAP: GAP, CTRL: CTRL, MINW: MINW, MINH: MINH,

        create: createTable,
        layout: layout,
        position: position,
        rebuildChairs: rebuildChairs,
        cornersPlan: cornersPlan,
        chairSeats: chairSeats,
        startMove: startMove
    };
    window.SeatTable = SeatTable;

    // ---- kleine Helfer -------------------------------------------------------
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const quarters = m => (((Math.round(m.rot / 90) % 4) + 4) % 4); // 0..3 (nur sinnvoll bei rot%90==0)
    const isAxisAligned = m => (((m.rot % 90) + 90) % 90) === 0;

    // Lokale Seite, die nach einer Bildschirm-Kante zeigt (bei rot = n·90°).
    function screenToLocal(rot, screenEdge) {
        const k = (((Math.round(rot / 90) % 4) + 4) % 4);
        return SIDES[((SIDE_IX[screenEdge] - k) % 4 + 4) % 4];
    }
    const opposite = edge => SIDES[(SIDE_IX[edge] + 2) % 4];

    // =========================================================================
    //  DOM eines Tisches bauen
    // =========================================================================
    function createTable(model, opts) {
        const el = document.createElement('div');
        el.className = 'st-table';
        el.dataset.id = model.id;
        el._st = { model: model, opts: opts || {} };

        const body = document.createElement('div');
        body.className = 'st-body';
        el.appendChild(body);

        // Optionale Beschriftung auf der Tischfläche (z. B. „Pult").
        const label = document.createElement('div');
        label.className = 'st-label';
        label.textContent = model.label || '';
        el.appendChild(label);

        // Verschieben: Druck auf den Tisch selbst (nicht Griffe/Stühle/Buttons).
        el.addEventListener('pointerdown', e => {
            if (e.target.closest('.st-handle, .st-chair, .st-add, .st-del')) return;
            e.preventDefault();
            requestSelect(el);
            startMoveFrom(e, el);
        });

        // Griffe: Drehen + Größe ändern
        el.appendChild(makeHandle('rotate', el));
        el.appendChild(makeHandle('resize', el));

        // Ganzen Tisch löschen
        const del = document.createElement('button');
        del.className = 'st-del st-del-table';
        del.type = 'button';
        del.title = 'Tisch löschen';
        del.textContent = '×';
        del.addEventListener('pointerdown', e => e.stopPropagation());
        del.addEventListener('click', e => {
            e.stopPropagation();
            const o = el._st.opts;
            if (o.onDelete) o.onDelete(el._st.model.id);
        });
        el.appendChild(del);

        // Stuhl je Seite hinzufügen (nur bei Auswahl sichtbar via CSS)
        SIDES.forEach(side => {
            const add = document.createElement('button');
            add.className = 'st-add st-add-' + side;
            add.type = 'button';
            add.title = 'Stuhl hinzufügen';
            add.textContent = '＋';
            add.addEventListener('pointerdown', e => e.stopPropagation());
            add.addEventListener('click', e => {
                e.stopPropagation();
                addChair(el, side);
            });
            el.appendChild(add);
        });

        rebuildChairs(el, model);
        position(el, model);
        return el;
    }

    function makeHandle(kind, el) {
        const h = document.createElement('div');
        h.className = 'st-handle st-handle-' + kind;
        h.title = kind === 'rotate' ? 'Drehen' : 'Größe ändern';
        h.textContent = kind === 'rotate' ? '↻' : '⤡';
        h.addEventListener('pointerdown', e => {
            e.preventDefault();
            e.stopPropagation();
            requestSelect(el);
            beginDrag(e, kind, el, 0, 0);
        });
        return h;
    }

    function requestSelect(el) {
        const o = el._st.opts;
        if (o.onSelect) o.onSelect(el._st.model.id);
    }

    // ---- Stühle --------------------------------------------------------------
    function rebuildChairs(el, model) {
        el.querySelectorAll('.st-chair').forEach(c => c.remove());
        const bySide = groupChairs(model);
        SIDES.forEach(side => {
            bySide[side].forEach((chair, i) => {
                const frac = (i + 0.5) / bySide[side].length;
                el.appendChild(makeChair(el, chair, side, frac));
            });
        });
    }

    function groupChairs(model) {
        const bySide = { top: [], bottom: [], left: [], right: [] };
        model.chairs.forEach(c => bySide[c.side].push(c));
        return bySide;
    }

    function makeChair(el, chair, side, frac) {
        const c = document.createElement('div');
        c.className = 'st-chair st-chair-' + side;

        // Klick auf den Stuhl wählt den Tisch aus, startet aber kein Verschieben.
        c.addEventListener('pointerdown', e => { e.stopPropagation(); requestSelect(el); });

        const input = document.createElement('input');
        input.className = 'st-chair-name';
        input.type = 'text';
        input.value = chair.name || '';
        input.addEventListener('pointerdown', e => e.stopPropagation());
        input.addEventListener('focus', () => requestSelect(el));
        input.addEventListener('input', () => {
            chair.name = input.value;
            const o = el._st.opts;
            if (o.onChange) o.onChange(el._st.model, 'name');
        });
        c.appendChild(input);

        const del = document.createElement('button');
        del.className = 'st-del st-del-chair';
        del.type = 'button';
        del.title = 'Stuhl entfernen';
        del.textContent = '×';
        del.addEventListener('pointerdown', e => e.stopPropagation());
        del.addEventListener('click', e => { e.stopPropagation(); removeChair(el, chair.id); });
        c.appendChild(del);

        positionChair(c, el._st.model, side, frac);
        return c;
    }

    function positionChair(c, m, side, frac) {
        let left, top;
        if (side === 'bottom')      { left = frac * m.w - CHAIR / 2; top = m.h + GAP; }
        else if (side === 'top')    { left = frac * m.w - CHAIR / 2; top = -GAP - CHAIR; }
        else if (side === 'left')   { left = -GAP - CHAIR; top = frac * m.h - CHAIR / 2; }
        else /* right */            { left = m.w + GAP;    top = frac * m.h - CHAIR / 2; }
        c.style.left = left + 'px';
        c.style.top  = top + 'px';
    }

    function addChair(el, side) {
        const o = el._st.opts, m = el._st.model;
        const id = o.nextChairId ? o.nextChairId() : (Date.now() + Math.random());
        m.chairs.push({ id: id, side: side, name: '' });
        rebuildChairs(el, m);
        position(el, m);
        if (o.onChange) o.onChange(m, 'chair');
    }

    function removeChair(el, chairId) {
        const o = el._st.opts, m = el._st.model;
        m.chairs = m.chairs.filter(c => c.id !== chairId);
        rebuildChairs(el, m);
        position(el, m);
        if (o.onChange) o.onChange(m, 'chair');
    }

    // ---- Größe/Position/Drehung auf den DOM übertragen ----------------------
    // position(): verschiebt vorhandene Stühle/Griffe; baut NICHT neu auf.
    function position(el, m) {
        el.style.left = (m.cx - m.w / 2) + 'px';
        el.style.top  = (m.cy - m.h / 2) + 'px';
        el.style.width  = m.w + 'px';
        el.style.height = m.h + 'px';
        el.style.transform = 'rotate(' + m.rot + 'deg)';

        // Stühle je Seite gleichmäßig verteilen (w/h können sich geändert haben).
        const bySide = { top: [], bottom: [], left: [], right: [] };
        el.querySelectorAll('.st-chair').forEach(c => {
            const side = c.classList.contains('st-chair-top') ? 'top'
                       : c.classList.contains('st-chair-bottom') ? 'bottom'
                       : c.classList.contains('st-chair-left') ? 'left' : 'right';
            bySide[side].push(c);
        });
        SIDES.forEach(side => {
            bySide[side].forEach((c, i) => positionChair(c, m, side, (i + 0.5) / bySide[side].length));
        });

        // Namen + Beschriftung lesbar halten: Gegen-Rotation (immer waagerecht).
        el.querySelectorAll('.st-chair-name').forEach(inp => {
            inp.style.transform = 'rotate(' + (-m.rot) + 'deg)';
        });
        const lbl = el.querySelector('.st-label');
        if (lbl) lbl.style.transform = 'rotate(' + (-m.rot) + 'deg)';

        positionControls(el, m);
    }

    // layout(): Stühle aus dem Modell neu aufbauen UND positionieren.
    function layout(el, m) {
        rebuildChairs(el, m);
        position(el, m);
    }

    function positionControls(el, m) {
        const OUT = GAP + CHAIR + 6; // ＋-Buttons sitzen jenseits der Stuhlreihe
        const set = (sel, left, top) => {
            const b = el.querySelector(sel);
            if (b) { b.style.left = left + 'px'; b.style.top = top + 'px'; }
        };
        set('.st-add-top',    m.w / 2 - CTRL / 2, -OUT - CTRL);
        set('.st-add-bottom', m.w / 2 - CTRL / 2, m.h + OUT);
        set('.st-add-left',   -OUT - CTRL,        m.h / 2 - CTRL / 2);
        set('.st-add-right',  m.w + OUT,          m.h / 2 - CTRL / 2);
        // Griffe/Löschen an den Ecken (dort sitzen keine mittigen Stühle).
        set('.st-handle-rotate', -CTRL / 2,       -CTRL / 2);        // oben links
        set('.st-del-table',     m.w - CTRL / 2,  -CTRL / 2);        // oben rechts
        set('.st-handle-resize', m.w - CTRL / 2,  m.h - CTRL / 2);   // unten rechts
    }

    // =========================================================================
    //  Interaktion (Verschieben / Größe / Drehen) — Maus & Touch via Pointer
    // =========================================================================
    // Vom Modul aufrufbar, um einen frisch erzeugten Tisch direkt am Cursor zu
    // führen (Ziehen aus der Tisch-Leiste).
    function startMove(el, pointerEvent) {
        startMoveFrom(pointerEvent, el, /*grabAtCenter*/ true);
    }

    function startMoveFrom(e, el, grabAtCenter) {
        const o = el._st.opts, m = el._st.model;
        const r = o.area.getBoundingClientRect();
        const offX = grabAtCenter ? 0 : (e.clientX - r.left) - m.cx;
        const offY = grabAtCenter ? 0 : (e.clientY - r.top) - m.cy;
        beginDrag(e, 'move', el, offX, offY);
    }

    function beginDrag(e, mode, el, offX, offY) {
        const m = el._st.model;
        drag = { mode: mode, el: el, opts: el._st.opts, model: m, offX: offX, offY: offY, group: [] };
        if (mode === 'move' && drag.opts.getMoveGroup) {
            // Mehrfach-Auswahl: die anderen ausgewählten Tische wandern mit.
            drag.group = (drag.opts.getMoveGroup(m.id) || []).filter(g => g && g.model && g.el);
        }
        if (mode === 'rotate') {
            const r = drag.opts.area.getBoundingClientRect();
            drag.startAngle = Math.atan2(e.clientY - r.top - m.cy, e.clientX - r.left - m.cx);
            drag.startRot = m.rot;
        }
        drag.dock = null; // aktueller Andock-Partner (Stuhl-Flip erst beim Loslassen)
        window.addEventListener('pointermove', onDragMove);
        window.addEventListener('pointerup', endDrag, { once: true });
    }

    function onDragMove(e) {
        if (!drag) return;
        const r = drag.opts.area.getBoundingClientRect();
        const m = drag.model;
        const px = e.clientX - r.left;
        const py = e.clientY - r.top;

        if (drag.mode === 'move') {
            const newCx = clamp(px - drag.offX, 0, r.width);
            const newCy = clamp(py - drag.offY, 0, r.height);
            if (drag.group.length) {
                // Ganze Auswahl gemeinsam verschieben (kein Magnet beim Gruppen-Zug).
                const dx = newCx - m.cx, dy = newCy - m.cy;
                m.cx = newCx; m.cy = newCy;
                drag.group.forEach(g => { g.model.cx += dx; g.model.cy += dy; position(g.el, g.model); });
            } else {
                m.cx = newCx; m.cy = newCy;
                // Position rastet live ein; den Andock-Partner nur merken — die
                // Stühle wechseln erst beim Loslassen die Seite (siehe endDrag).
                drag.dock = applyMagnet(drag.el, m, drag.opts);
            }
        } else if (drag.mode === 'resize') {
            const a = -m.rot * Math.PI / 180;
            const dx = px - m.cx, dy = py - m.cy;
            const lx = dx * Math.cos(a) - dy * Math.sin(a);
            const ly = dx * Math.sin(a) + dy * Math.cos(a);
            m.w = Math.max(MINW, Math.abs(lx) * 2); // zentriert skalieren
            m.h = Math.max(MINH, Math.abs(ly) * 2);
        } else if (drag.mode === 'rotate') {
            const ang = Math.atan2(py - m.cy, px - m.cx);
            const deltaDeg = (ang - drag.startAngle) * 180 / Math.PI;
            m.rot = snapAngle(drag.startRot + deltaDeg);
        }
        position(drag.el, m);
    }

    function endDrag() {
        window.removeEventListener('pointermove', onDragMove);
        if (drag) {
            drag.el.classList.remove('st-snapped');
            // Stühle ERST JETZT (beim Loslassen) die Seite wechseln — nicht schon
            // während des Ziehens. Sonst blieben sie gedreht, wenn man einen Tisch
            // nur kurz dagegenzieht und dann wieder wegzieht.
            if (drag.mode === 'move' && drag.dock) flipChairsAtDock(drag.el, drag.model, drag.dock);
            if (drag.opts.onChange) drag.opts.onChange(drag.model, 'drag');
        }
        drag = null;
    }

    // Stühle des gezogenen Tisches an der berührten Kante nach außen, beim
    // Partner an seiner zugewandten Kante ebenso.
    function flipChairsAtDock(el, m, dock) {
        if (vacateEdge(m, dock.edge)) layout(el, m);
        const p = dock.partner;
        if (p && p.model && p.el && vacateEdge(p.model, opposite(dock.edge))) layout(p.el, p.model);
    }

    // Sanftes Einrasten auf Vielfache von 45° (innerhalb von 6°).
    function snapAngle(a) {
        a = ((a % 360) + 360) % 360;
        for (let m = 0; m <= 360; m += 45) {
            if (Math.abs(a - m) < 6) return m % 360;
        }
        return Math.round(a);
    }

    // =========================================================================
    //  MAGNETISMUS — beim Verschieben an Nachbar-Tische andocken
    // =========================================================================
    // Achsen-ausgerichtete Bounding-Box (gilt bei rot = n·90°; w/h ggf. getauscht).
    function aabb(m) {
        const vert = quarters(m) % 2 !== 0; // 90° oder 270° → hochkant
        const hw = (vert ? m.h : m.w) / 2;
        const hh = (vert ? m.w : m.h) / 2;
        return { l: m.cx - hw, r: m.cx + hw, t: m.cy - hh, b: m.cy + hh, hw: hw, hh: hh };
    }

    // Rastet die POSITION live ein (Ausrichten + Andocken) und liefert den
    // Andock-Partner zurück (oder null). Stühle werden hier NICHT umgesetzt —
    // das passiert erst beim Loslassen (endDrag).
    function applyMagnet(el, m, opts) {
        el.classList.remove('st-snapped');
        if (opts.magnet === false || !opts.getSiblings || !isAxisAligned(m)) return null;
        const sibs = opts.getSiblings().filter(s => s.model && isAxisAligned(s.model));
        if (!sibs.length) return null;

        // 1) ANDOCKEN hat VORRANG: berühren rastet zuerst ein. Sonst könnte das
        //    Ausrichten beim tiefen Überlappen die Position „wegziehen" und der
        //    Tisch löste sich wieder vom Nachbarn.
        const best = edgeDock(m, sibs);
        if (best) {
            if (best.axis === 'x') m.cx = best.value; else m.cy = best.value;
            el.classList.add('st-snapped');
        }

        // 2) AUSRICHTEN: Reihen/Spalten bündig ziehen (Mitten bzw. gleichnamige
        //    Kanten), UNABHÄNGIG vom Abstand. Eine bereits angedockte Achse wird
        //    NICHT mehr verschoben — nur die jeweils freie Achse richtet sich aus.
        if (!best || best.axis !== 'x') { const dx = alignAxis(m, sibs, 'x'); if (dx !== null) m.cx += dx; }
        if (!best || best.axis !== 'y') { const dy = alignAxis(m, sibs, 'y'); if (dy !== null) m.cy += dy; }

        return best;
    }

    // Bestes Ausrichtungs-Delta einer Achse (oder null): zieht eine Linie des
    // Tisches (Mitte oder gleichnamige Kante) auf die nächstgelegene Linie eines
    // Nachbarn — egal wie weit die Tische quer dazu auseinanderstehen. So rasten
    // benachbarte Tische zu sauberen Reihen/Spalten ein, auch mit Abstand.
    function alignAxis(m, sibs, axis) {
        const box = aabb(m);
        const mLines = axis === 'x' ? [m.cx, box.l, box.r] : [m.cy, box.t, box.b];
        let bestDelta = null, bestDist = ALIGN + 0.0001;
        sibs.forEach(s => {
            const sb = aabb(s.model);
            const sLines = axis === 'x' ? [s.model.cx, sb.l, sb.r] : [s.model.cy, sb.t, sb.b];
            mLines.forEach(ml => sLines.forEach(sl => {
                const d = sl - ml;
                if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); bestDelta = d; }
            }));
        });
        return bestDelta;
    }

    // Bestes Kanten-Andocken (Berühren) innerhalb von SNAP, mit Überlappung quer.
    // Liefert { axis, value, edge, partner } oder null.
    function edgeDock(m, sibs) {
        const box = aabb(m);
        let best = null;
        const tryDock = (axis, value, gap, edge, partner) => {
            if (Math.abs(gap) > SNAP) return;
            const cost = Math.abs(gap);
            if (!best || cost < best.cost) best = { axis: axis, value: value, cost: cost, edge: edge, partner: partner };
        };
        sibs.forEach(s => {
            const sb = aabb(s.model);
            const yOverlap = box.t < sb.b - 2 && box.b > sb.t + 2;
            const xOverlap = box.l < sb.r - 2 && box.r > sb.l + 2;
            if (yOverlap) { // waagerechte Nachbarn → links/rechts andocken
                tryDock('x', sb.l - box.hw, box.r - sb.l, 'right', s);
                tryDock('x', sb.r + box.hw, box.l - sb.r, 'left', s);
            }
            if (xOverlap) { // übereinander → oben/unten andocken
                tryDock('y', sb.t - box.hh, box.b - sb.t, 'bottom', s);
                tryDock('y', sb.b + box.hh, box.t - sb.b, 'top', s);
            }
        });
        return best;
    }

    // Verschiebt Stühle von der Bildschirm-Kante `screenEdge` auf die freie
    // Gegenseite (in LOKALEN Seiten, abhängig von der Drehung). Gibt true zurück,
    // wenn sich etwas geändert hat.
    function vacateEdge(m, screenEdge) {
        if (!isAxisAligned(m)) return false;
        const fromLocal = screenToLocal(m.rot, screenEdge);
        const toLocal = opposite(fromLocal);
        let changed = false;
        m.chairs.forEach(c => {
            if (c.side === fromLocal) { c.side = toLocal; changed = true; }
        });
        return changed;
    }

    // =========================================================================
    //  Geometrie (für PDF-Export & Magnet) — in Plan-Koordinaten
    // =========================================================================
    function cornersPlan(m) {
        const rad = m.rot * Math.PI / 180, w = m.w, h = m.h;
        return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(p => {
            const lx = p[0], ly = p[1];
            return [m.cx + lx * Math.cos(rad) - ly * Math.sin(rad),
                    m.cy + lx * Math.sin(rad) + ly * Math.cos(rad)];
        });
    }

    function chairSeats(m) {
        const rad = m.rot * Math.PI / 180, w = m.w, h = m.h;
        const bySide = groupChairs(m);
        const out = [];
        SIDES.forEach(side => {
            const list = bySide[side];
            list.forEach((c, i) => {
                const frac = (i + 0.5) / list.length;
                let lx, ly;
                if (side === 'bottom')    { lx = (frac - 0.5) * w; ly = h / 2 + GAP + CHAIR / 2; }
                else if (side === 'top')  { lx = (frac - 0.5) * w; ly = -(h / 2 + GAP + CHAIR / 2); }
                else if (side === 'left') { lx = -(w / 2 + GAP + CHAIR / 2); ly = (frac - 0.5) * h; }
                else                      { lx = (w / 2 + GAP + CHAIR / 2);  ly = (frac - 0.5) * h; }
                out.push({
                    x: m.cx + lx * Math.cos(rad) - ly * Math.sin(rad),
                    y: m.cy + lx * Math.sin(rad) + ly * Math.cos(rad),
                    name: c.name || ''
                });
            });
        });
        return out;
    }
})();
