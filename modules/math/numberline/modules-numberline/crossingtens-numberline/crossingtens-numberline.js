/**
 * CROSSINGTENS-NUMBERLINE.JS
 * Zehnerübergang am Zahlenstrahl mit Rechenpfeilen.
 *
 * Aufgabe (z. B. 13 − 7): es sind DREI Pfeile zu ziehen
 *   A: Startzahl → zur Zehn      (−3)
 *   B: Zehn      → zum Ergebnis  (−4)
 *   C: Startzahl → zum Ergebnis  (−7, großer Bogen)
 * Reihenfolge egal.
 *
 * Bedienung: auf eine Zahl klicken (oder drücken) → ein Pfeil stellt sich
 * gerade nach oben. Dann zu einer Zielzahl ziehen/klicken. Auch falsche
 * Startzahlen sind möglich — passt (Start → Ziel) nicht zu einem offenen Pfeil,
 * wird der Bogen kurz ROT und verschwindet. Passt er, bleibt er GRÜN stehen.
 * Während des Ziehens ist der Pfeil schwarz.
 *
 * Punkte-Hilfe: unter dem zweiten Operanden liegen so viele rote Punkte wie
 * sein Wert, aufgeteilt in (bis zur Zehn) + (Rest). Nach dem Pfeil zur Zehn
 * graut die erste Gruppe aus, nach dem Weiter-Pfeil die zweite — das zeigt,
 * wie die Zahl beim Zehnerübergang geteilt wird. Per Settings ein-/ausblendbar.
 *
 * Dieses Modul ist reine Regie: es nutzt den globalen Zahlenstrahl (Geometrie
 * aus window.NumberlineState) und zeichnet die Pfeile in eine eigene SVG-Ebene.
 */
(function () {
    'use strict';

    const SVGNS = 'http://www.w3.org/2000/svg';
    const C_BLACK = '#222222';   // Pfeil beim Ziehen
    const C_GREEN = '#16a34a';   // richtig gesetzter Pfeil
    const C_RED = '#dc2626';     // falscher Versuch

    let task = null;             // aktuelle Aufgabe
    let done = {};               // gezogene Pfeile: { A:true, ... }
    let filled = {};             // (Option) eingetragene Pfeil-Zahlen: { A:true, ... }
    let pending = null;          // (Option) aktuell einzutragende Zahl: 'A'|'B'|'C'|'result'|null
    let drag = null;             // aktiver Zieh-Vorgang
    let wrongArc = null;         // kurz angezeigter falscher Bogen
    let solved = false;

    window.CT_DOTS = (window.CT_DOTS !== false);   // Punkte-Hilfe an/aus (Default an)
    // Option: nach jedem Pfeil die Zahl per Drag eintragen (Default aus)
    window.CT_LABELDROP = !!window.CT_LABELDROP;

    /* ---------- Geometrie (spiegelt global/math/.../numberline.js) ---------- */
    function geo() {
        const vp = document.getElementById('viewport');
        const rect = vp.getBoundingClientRect();
        const S = window.NumberlineState;
        const step = S.currentStep * window.currentZoom;
        return { rect, step, width: rect.width, height: rect.height, centerX: S.centerX };
    }
    const numToX = (n, g) => (n - g.centerX) * g.step + g.width / 2;
    const xToNum = (x, g) => (x - g.width / 2) / g.step + g.centerX;
    const baseY = (g) => g.height / 2;

    /* ---------- Bogenhöhen ----------
       Der große Bogen (ganze Strecke) ist der äußerste. Die beiden Teilbögen
       bekommen ihre Höhe PROPORTIONAL zur Höhe des großen Bogens an ihrer
       Scheitelstelle (Faktor 0,55). Dadurch liegen sie GARANTIERT immer unter
       dem großen Bogen — egal wie die Zahl aufgeteilt ist (kein Überlappen). */
    function bigHeight(g) {
        return Math.min(g.height * 0.34, 220, baseY(g) - 24);
    }
    function bigArcHeightAt(numMid, g) {
        if (!task || task.end === task.start) return bigHeight(g);
        let t = (numMid - task.start) / (task.end - task.start);
        t = Math.max(0, Math.min(1, t));
        return 4 * bigHeight(g) * t * (1 - t);
    }
    function partHeight(a, b, g) {
        return Math.max(26, 0.55 * bigArcHeightAt((a + b) / 2, g));
    }
    function heightForArrow(arrow, g) {
        return arrow.id === 'C' ? bigHeight(g) : partHeight(arrow.from, arrow.to, g);
    }

    /* ---------- SVG-Helfer ---------- */
    function el(tag, attrs) {
        const e = document.createElementNS(SVGNS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    }

    function addHead(svg, x, y, dx, dy, color) {
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const px = -uy, py = ux;
        const s = 15, w = 9;
        const bx = x - ux * s, byy = y - uy * s;
        const p = `${x},${y} ${bx + px * w},${byy + py * w} ${bx - px * w},${byy - py * w}`;
        svg.appendChild(el('polygon', { points: p, fill: color }));
    }

    // Bogen-KÖRPER (Linie + Pfeilspitze) von Zahl a nach b, Scheitelhöhe h.
    // Gibt den Ankerpunkt für das Label zurück (Labels werden ZULETZT gezeichnet,
    // damit keine Bogenlinie die Beschriftung (z. B. „−1") überschneidet).
    function drawArcBody(svg, g, a, b, h, color) {
        const by = baseY(g);
        const x1 = numToX(a, g), x2 = numToX(b, g);
        const cx = (x1 + x2) / 2, cy = by - 2 * h;
        svg.appendChild(el('path', {
            d: `M ${x1} ${by} Q ${cx} ${cy} ${x2} ${by}`,
            fill: 'none', stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round'
        }));
        addHead(svg, x2, by, x2 - cx, by - cy, color);
        return { x: (x1 + x2) / 2, y: by - h - 12 };
    }

    // Label mit deckendem weißem Hintergrund OBEN AUF allen Linien.
    function drawLabel(svg, x, y, color, text) {
        const t = el('text', {
            x, y, 'text-anchor': 'middle',
            fill: color, 'font-family': "'Patrick Hand', cursive",
            'font-size': 34, 'font-weight': 700
        });
        t.textContent = text;
        svg.appendChild(t);
        const bb = t.getBBox();
        const pad = 4;
        const rect = el('rect', {
            x: bb.x - pad, y: bb.y - pad,
            width: bb.width + 2 * pad, height: bb.height + 2 * pad,
            rx: 6, fill: '#ffffff'
        });
        svg.insertBefore(rect, t); // Rechteck hinter den Text
    }

    // Gerader Pfeil nach oben (Start-Zustand, bevor ein Ziel gewählt ist).
    function drawUp(svg, g, a, h, color) {
        const by = baseY(g);
        const x = numToX(a, g);
        svg.appendChild(el('line', {
            x1: x, y1: by, x2: x, y2: by - h,
            stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round'
        }));
        addHead(svg, x, by - h, 0, -1, color);
    }

    /* ---------- Pfeil-Logik ---------- */
    // Feste Reihenfolge: erst A (zur Zehn), dann B (Zehn→Ergebnis), dann C (ganz).
    function nextArrow() {
        if (!task) return null;
        return task.arrows.find(ar => !done[ar.id]) || null; // arrows liegen in Reihenfolge A,B,C
    }
    function matchArrow(from, to) {
        const nx = nextArrow();
        return (nx && nx.from === from && nx.to === to) ? nx : null;
    }
    function allArrowsDone() {
        return !!task && task.arrows.every(ar => done[ar.id]);
    }
    // Ergebnis-Phase: alle Pfeile gezogen (und – wenn die Option an ist – auch
    // alle Pfeil-Zahlen eingetragen).
    function resultPhase() {
        if (!allArrowsDone()) return false;
        if (!window.CT_LABELDROP) return true;
        return task.arrows.every(ar => filled[ar.id]);
    }

    /* ---------- Zeichnen ---------- */
    function redraw() {
        const svg = document.getElementById('arrowLayer');
        if (!svg || !task) return;
        const g = geo();
        svg.setAttribute('width', g.width);
        svg.setAttribute('height', g.height);
        svg.innerHTML = '';

        // 1. ALLE Bogen-Körper zeichnen, Labels sammeln (Labels kommen zuletzt).
        const labels = [];
        let dropAnchor = null, dropArrow = null;

        // Erledigte (richtige) Pfeile → grün
        task.arrows.forEach(ar => {
            if (done[ar.id]) {
                const p = drawArcBody(svg, g, ar.from, ar.to, heightForArrow(ar, g), C_GREEN);
                if (window.CT_LABELDROP && !filled[ar.id]) {
                    // Option an, Zahl noch nicht eingetragen → "?"-Box statt Label
                    dropAnchor = p; dropArrow = ar;
                } else {
                    labels.push({ x: p.x, y: p.y, color: C_GREEN, text: ar.label });
                }
            }
        });

        // Kurzer falscher Versuch → rot
        if (wrongArc) {
            const h = Math.min(g.height * 0.2, 130, baseY(g) - 25);
            drawArcBody(svg, g, wrongArc.from, wrongArc.to, h, C_RED);
        }

        // Aktiver Zieh-Pfeil → schwarz
        if (drag) {
            if (drag.to === null || drag.to === drag.from) {
                drawUp(svg, g, drag.from, Math.min(g.height * 0.16, 110, baseY(g) - 25), C_BLACK);
            } else {
                const m = matchArrow(drag.from, drag.to);
                const h = m ? heightForArrow(m, g) : Math.min(g.height * 0.2, 130, baseY(g) - 25);
                const p = drawArcBody(svg, g, drag.from, drag.to, h, C_BLACK);
                if (m && !window.CT_LABELDROP) labels.push({ x: p.x, y: p.y, color: C_BLACK, text: m.label });
            }
        }

        // 2. Labels OBEN AUF allen Linien.
        labels.forEach(l => drawLabel(svg, l.x, l.y, l.color, l.text));

        // 3. (Option) "?"-Box am noch nicht beschrifteten Pfeil positionieren.
        if (dropAnchor && dropArrow) showArrowDrop(dropAnchor, dropArrow.id);
        else hideArrowDrop();
    }

    /* ---------- (Option) Rechenzeichen + "?"-Box an einem Pfeil ---------- */
    function showArrowDrop(anchor, arId) {
        let wrap = document.getElementById('ct-arrow-fill');
        let box;
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'ct-arrow-fill';
            const sign = document.createElement('span');
            sign.className = 'ct-arrow-sign';
            box = document.createElement('div');
            box.id = 'ct-arrow-drop';
            box.className = 'nb-box nb-dropzone nb-drop-target nb-box-small';
            wrap.appendChild(sign);   // Rechenzeichen vor die "?"-Box
            wrap.appendChild(box);
            document.getElementById('viewport').appendChild(wrap);
        } else {
            box = document.getElementById('ct-arrow-drop');
        }
        wrap.querySelector('.ct-arrow-sign').textContent = task.sign; // − oder +
        if (box.dataset.for !== arId) { // neue Pfeil-Box → leeren
            box.dataset.for = arId;
            box.textContent = '';
            box.classList.remove('wrong', 'correct');
        }
        wrap.style.display = 'flex';
        wrap.style.left = anchor.x + 'px';
        // ÜBER dem Bogen platzieren (nicht darauf): Unterkante 12 px über dem Anker.
        const hgt = wrap.offsetHeight || 70;
        let top = anchor.y - 12 - hgt;
        if (top < 4) top = 4;                 // nicht über den oberen Rand hinaus
        wrap.style.top = top + 'px';
    }
    function hideArrowDrop() {
        const w = document.getElementById('ct-arrow-fill');
        if (w) w.style.display = 'none';
        const b = document.getElementById('ct-arrow-drop');
        if (b) b.dataset.for = '';
    }

    /* ---------- Maus-Interaktion (Klick-Start + Ziehen) ---------- */
    function nearestTick(e) {
        const g = geo();
        const x = e.clientX - g.rect.left;
        let n = Math.round(xToNum(x, g));
        if (window.NumberlineState.onlyPositive && n < 0) return null;
        const tol = Math.min(45, g.step * 0.45);
        return Math.abs(x - numToX(n, g)) <= tol ? n : null;
    }

    function finalize(n) {
        const from = drag.from;
        drag = null;
        if (n === from) { redraw(); return; }
        const m = matchArrow(from, n);
        if (m) {
            done[m.id] = true;
            updateHelp();
            if (window.CT_LABELDROP) {
                // Option: erst die Zahl dieses Pfeils eintragen lassen.
                pending = m.id;
                redraw();                       // zeichnet Bogen + setzt "?"-Box
                buildOptions(m.amount, 9);
            } else if (allArrowsDone()) {
                revealAnswer();
                redraw();
            } else {
                redraw();
            }
        } else {
            wrongArc = { from, to: n };
            redraw();
            setTimeout(() => { wrongArc = null; redraw(); }, 750);
        }
    }

    // true = Event übernommen (Pfeil), false = an Schiebe-Logik weitergeben.
    function onMouseDown(e) {
        // Keine neuen Pfeile, solange eine Zahl einzutragen ist oder alle Pfeile
        // schon gezogen sind (Ergebnis-Phase) bzw. die Aufgabe gelöst ist.
        if (solved || pending || allArrowsDone()) return false;
        const n = nearestTick(e);

        if (drag && drag.phase === 'awaitingTarget') {
            const g = geo();
            const cx = e.clientX - g.rect.left;
            const cy = e.clientY - g.rect.top;
            // Angedocktes Ziel (Vorschau); sonst am Klick-Ort andocken.
            let target = (drag.to !== null && drag.to !== drag.from)
                ? drag.to
                : Math.round(xToNum(cx, g));
            if (window.NumberlineState.onlyPositive && target < 0) target = 0;
            // Bestätigen nur, wenn der Klick im Umkreis EINES Zahlstrich-Abstands
            // um das Ziel liegt – sonst "wirklich woanders" → verwerfen.
            const dist = Math.hypot(cx - numToX(target, g), cy - baseY(g));
            if (target !== drag.from && dist <= g.step) {
                finalize(target);
            } else {
                drag = null; redraw();
            }
            return true;
        }
        if (n !== null) {                          // neuen Pfeil beginnen
            drag = { from: n, to: n, phase: 'dragging', sx: e.clientX, sy: e.clientY, moved: false };
            redraw();
            return true;
        }
        return false;
    }

    function onMove(e) {
        if (!drag) return;
        const g = geo();
        const x = e.clientX - g.rect.left;
        if (drag.phase === 'dragging' &&
            (Math.abs(e.clientX - drag.sx) > 6 || Math.abs(e.clientY - drag.sy) > 6)) {
            drag.moved = true;
        }
        let to = Math.round(xToNum(x, g));
        if (window.NumberlineState.onlyPositive && to < 0) to = 0;
        // "gerade nach oben", solange kaum horizontal bewegt wurde
        if (Math.abs(x - numToX(drag.from, g)) < g.step * 0.3) to = drag.from;
        drag.to = to;
        redraw();
    }

    function onUp() {
        if (!drag || drag.phase !== 'dragging') return;
        if (drag.moved && drag.to !== drag.from) {
            finalize(drag.to);                     // Drücken-Ziehen-Loslassen
        } else {
            drag.phase = 'awaitingTarget';         // reiner Klick → auf Ziel-Klick warten
            drag.to = drag.from;
            redraw();
        }
    }

    /* ---------- Punkte-Hilfe: Zehnerfeld unter dem 2. Operanden ---------- */
    // Pfeil nach unten + Zehnerfeld; der zweite Operand b ist als u (rot) +
    // r (blau) eingetragen → zeigt, wie die Zahl beim Zehnerübergang geteilt wird.
    function buildOperand2Html() {
        return `<span class="op2"><span class="eq-num">${task.b}</span>` +
            `<span class="ct-help" id="ctHelp">` +
            `<span class="ct-arrow-down">↓</span>` +
            `<span class="dot-frame v-10 large frozen" id="ctFrame" ` +
            `data-red="${task.b}" data-blue="0"></span>` + // alle Punkte rot
            `</span></span>`;
    }
    function updateHelp() {
        const help = document.getElementById('ctHelp');
        if (!help) return;
        help.style.display = window.CT_DOTS ? '' : 'none';
        const frame = document.getElementById('ctFrame');
        if (!frame) return;
        if (window.renderDotframes) window.renderDotframes(); // zeichnet b rote Punkte
        frame.classList.add('frozen');                        // nicht editierbar

        // Von RECHTS nach LINKS ausgrauen: nach Pfeil zur Zehn u Punkte,
        // nach dem Weiter-Pfeil alle b (zeigt das Aufteilen der Zahl).
        const grayCount = done['B'] ? task.b : (done['A'] ? task.u : 0);
        const reds = frame.querySelectorAll('.dot.red'); // b Stück, links→rechts
        reds.forEach((d, i) => d.classList.toggle('used', i >= task.b - grayCount));
    }

    /* ---------- Aufgaben ---------- */
    function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function makeTask(op, start, end, t, u, r) {
        const sign = op === 'minus' ? '−' : '+';
        return {
            op, start, end, ten: t, u, r, b: u + r, sign,
            arrows: [
                { id: 'A', from: start, to: t, amount: u, label: sign + u },       // zur Zehn
                { id: 'B', from: t, to: end, amount: r, label: sign + r },         // weiter
                { id: 'C', from: start, to: end, amount: u + r, label: sign + (u + r) } // ganz
            ]
        };
    }

    function buildTask() {
        const limits = window.NumberGenerator ? window.NumberGenerator.getLimits() : { min: 0, max: 20 };
        const min = Math.max(0, limits.min);
        let max = Math.max(limits.max, 20); // Zehnerübergang braucht mind. bis 20

        let op = window.CT_OP || 'mixed';
        if (op === 'mixed') op = Math.random() < 0.5 ? 'minus' : 'plus';

        const tens = [];
        for (let t = 10; t < max; t += 10) tens.push(t);
        if (tens.length === 0) tens.push(10);

        // Klassischer Zehnerübergang: zweiter Operand einstellig (3–9), zerlegt
        // in u (bis zur/von der Zehn) + r (Rest) → Spanne klein genug für die Sicht.
        for (let attempt = 0; attempt < 300; attempt++) {
            const t = tens[rnd(0, tens.length - 1)];
            const b = rnd(3, 9);
            const u = rnd(1, b - 1);
            const r = b - u;
            let start, end;
            if (op === 'minus') { start = t + u; end = t - r; }
            else { start = t - u; end = t + r; }
            if (start < min || start > max || end < min || end > max) continue;
            return makeTask(op, start, end, t, u, r);
        }

        return op === 'minus'
            ? makeTask('minus', 13, 6, 10, 3, 4)
            : makeTask('plus', 8, 13, 10, 2, 3);
    }

    function renderEquation() {
        const eq = document.getElementById('taskEquation');
        if (!eq || !task) return;
        eq.classList.toggle('solved', solved);

        // Das Ergebnis-„?"-Feld nutzt das globale Numberbox/Dropzone-Element
        // (Baukasten): leer → zeigt "?" via dropzone.css; gelöst → grüne Zahl.
        // Es ist nur in der ERGEBNIS-PHASE ein echtes Drop-Ziel; vorher ein
        // passiver "?"-Platzhalter (gleiche Optik), damit – wenn die Pfeil-Zahl-
        // Option aktiv ist – immer nur EINE Dropzone gleichzeitig aktiv ist.
        const active = solved || resultPhase();
        const res = active
            ? `<span id="ct-result" class="nb-box nb-dropzone nb-drop-target nb-box-small${solved ? ' correct' : ''}" ` +
              `data-correct-val="${task.end}">${solved ? task.end : ''}</span>`
            : `<span class="nb-box ct-qbox nb-box-small"></span>`;
        eq.innerHTML = `<span class="eq-num">${task.start}</span> ` +
            `<span class="eq-op">${task.sign}</span> ` +
            `${buildOperand2Html()} <span class="eq-op">=</span> ${res}`;
        updateHelp();
    }

    /* ---------- Antwort/Zahl einziehen (Numberboxen, wie im Operatoren-Modul) ---------- */
    function revealAnswer() {
        renderEquation();              // macht die Ergebnis-Dropzone aktiv
        buildOptions(task.end, 20);    // Zahl-Optionen fürs Ergebnis
    }

    // Baut 3 Optionen (richtig + 2 Ablenker) im Bereich [0, maxRange].
    function buildOptions(correctVal, maxRange) {
        const container = document.getElementById('ct-options');
        if (!container) return;
        maxRange = maxRange || 20;

        const opts = new Set([correctVal]);
        let safety = 0;
        while (opts.size < 3 && safety++ < 60) {
            const cand = correctVal + rnd(1, 3) * (Math.random() < 0.5 ? -1 : 1);
            if (cand >= 0 && cand <= maxRange) opts.add(cand);
        }
        while (opts.size < 3) opts.add(rnd(0, maxRange));

        const list = Array.from(opts).sort(() => Math.random() - 0.5);
        container.innerHTML = '';
        list.forEach((val, i) => {
            const o = document.createElement('div');
            o.id = `ct-opt-${i}`;
            o.className = 'nb-box nb-option nb-box-small'; // so groß wie die Drop-Zone
            o.textContent = val;
            o.setAttribute('data-value', val);
            o.draggable = true;
            container.appendChild(o);
        });
        container.classList.add('visible');

        if (window.DragDropManager) window.DragDropManager.init(handleDrop);
    }

    // Ein Drop-Handler für beide Fälle: Pfeil-Zahl (#ct-arrow-drop) und Ergebnis.
    function handleDrop(value, sourceElem, zone) {
        if (solved) return;

        if (zone.id === 'ct-arrow-drop') {                 // (Option) Pfeil-Zahl
            const ar = task.arrows.find(a => a.id === pending);
            if (!ar) return;
            if (String(value) === String(ar.amount)) {
                filled[ar.id] = true;
                pending = null;
                clearOptions();
                hideArrowDrop();
                if (resultPhase()) revealAnswer();         // alle Zahlen da → Ergebnis
                redraw();                                  // jetzt erscheint das Label
            } else {
                zone.classList.add('wrong');               // DDM räumt nach 800 ms auf
            }
            return;
        }

        // Ergebnis
        if (String(value) === String(task.end)) {
            zone.classList.add('correct');
            zone.textContent = value;
            solved = true;
            document.getElementById('taskEquation')?.classList.add('solved');
            setTimeout(() => { if (solved) newTask(); }, 1500);
        } else {
            zone.classList.add('wrong');
        }
    }

    function clearOptions() {
        const c = document.getElementById('ct-options');
        if (c) { c.innerHTML = ''; c.classList.remove('visible'); }
    }

    function centerView() {
        if (window.jumpTo) window.jumpTo((task.start + task.end) / 2);
        else redraw();
    }

    function newTask() {
        task = buildTask();
        done = {};
        filled = {};
        pending = null;
        drag = null;
        wrongArc = null;
        solved = false;
        clearOptions();
        hideArrowDrop();
        renderEquation();
        centerView();   // löst refreshNumberline → redraw aus
        redraw();
    }

    /* ---------- Aktionen für die Settings ---------- */
    window.CTActions = {
        newTask,
        clearArrows() {
            done = {}; filled = {}; pending = null; drag = null; wrongArc = null; solved = false;
            clearOptions(); hideArrowDrop(); renderEquation(); redraw();
        },
        showSolution() {
            if (!task) return;
            task.arrows.forEach(ar => { done[ar.id] = true; filled[ar.id] = true; });
            pending = null;
            solved = true;
            clearOptions();
            hideArrowDrop();
            renderEquation();
            redraw();
        },
        setDots(on) { window.CT_DOTS = !!on; updateHelp(); },
        setLabelDrop(on) { window.CT_LABELDROP = !!on; newTask(); }
    };

    /* ---------- Start ---------- */
    function start() {
        if (typeof window.initNumberline !== 'function') {
            setTimeout(start, 50);
            return;
        }
        const vp = document.getElementById('viewport');

        window.NumberlineState.onlyPositive = true;
        window.NumberlineState.forcedInterval = 1;
        window.NumberlineState.showSubTicks = true;

        window.initNumberline();

        // Pfeile bei jedem Strahl-Render (Pan/Zoom/Resize) nachziehen.
        window.refreshInteractions = redraw;

        // Eigene Maus-Steuerung: Klick auf Zahl = Pfeil, sonst Strahl schieben.
        vp.onmousedown = (e) => {
            if (onMouseDown(e)) { e.preventDefault(); return; }
            if (e.target.closest('.nb-box')) return;
            const S = window.NumberlineState;
            S.isDragging = true;
            S.startX = e.clientX;
            vp.style.cursor = 'grabbing';
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        newTask();
    }

    document.addEventListener('DOMContentLoaded', start);
})();
