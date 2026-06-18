/**
 * GLOBAL DRAG & DROP MANAGER - KLICK & DRAG
 */
const DragDropManager = {
    init: function(onDropCallback) {
        const draggables = document.querySelectorAll('.nb-box[draggable="true"]');
        const dropZones = document.querySelectorAll('.slot, .cards, .nb-drop-target, .nb-dropzone, .drop-zone');

        const processDrop = (value, sourceElem, zone) => {
            zone.textContent = value;
            zone.classList.remove('nb-hover');

            if (typeof onDropCallback === 'function') {
                onDropCallback(value, sourceElem, zone);
                
                if (zone.classList.contains('wrong')) {
                    setTimeout(() => {
                        zone.classList.remove('wrong');
                        zone.textContent = ""; 
                    }, 800); 
                }
            }
        };

        draggables.forEach(btn => {
            btn.ondragstart = (e) => {
                const val = btn.getAttribute('data-value') || btn.textContent;
                e.dataTransfer.setData("text/plain", val);
                e.dataTransfer.setData("sourceId", btn.id);

                // EIGENES DRAG-BILD (schattenloser Klon):
                // Der Standard-Snapshot des Browsers beschneidet den nach unten
                // gerichteten box-shadow der Box (z. B. .nb-option `0 6px 0`) →
                // der untere Rand wirkt abgeschnitten. Der Schatten gehört nur an
                // die RUHENDE Box. Wir klonen das Element daher schattenlos und
                // nutzen den Klon als Drag-Bild (offscreen, via .nb-drag-ghost).
                const rect = btn.getBoundingClientRect();
                const ghost = btn.cloneNode(true);
                ghost.removeAttribute('id'); // keine doppelte ID im DOM
                ghost.classList.add('nb-drag-ghost');
                ghost.classList.remove('nb-is-dragging');
                ghost.style.width = rect.width + 'px';
                ghost.style.height = rect.height + 'px';
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, rect.width / 2, rect.height / 2);
                setTimeout(() => ghost.remove(), 0); // nach dem Snapshot wieder weg

                setTimeout(() => btn.classList.add('nb-is-dragging'), 0);
            };

            btn.ondragend = () => {
                btn.classList.remove('nb-is-dragging');
                dropZones.forEach(zone => zone.classList.remove('nb-hover'));
            };

            btn.onclick = () => {
                const emptyZone = Array.from(dropZones).find(z => z.textContent.trim() === "" || z.textContent.trim() === "?");
                if (emptyZone) {
                    const val = btn.getAttribute('data-value') || btn.textContent;
                    processDrop(val, btn, emptyZone);
                }
            };
        });

        dropZones.forEach(zone => {
            zone.ondragover = (e) => {
                e.preventDefault();
                zone.classList.add('nb-hover'); // Aktiviert den blauen Hover-Zustand
            };
            zone.ondragleave = () => zone.classList.remove('nb-hover');
            zone.ondrop = (e) => {
                e.preventDefault();
                const droppedValue = e.dataTransfer.getData("text/plain");
                const sourceId = e.dataTransfer.getData("sourceId");
                const sourceElem = document.getElementById(sourceId);
                processDrop(droppedValue, sourceElem, zone);
            };
        });
    }
};

window.DragDropManager = DragDropManager;