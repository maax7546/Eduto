/**
 * JUMP-BUTTON-NUMBERLINE.JS
 * Logik für das Modal und die Sprung-Funktion.
 */

window.JumpActions = {
    /**
     * Öffnet das Eingabe-Modal für den Sprung zu einer Zahl.
     */
    openModal: () => {
        const overlay = document.createElement('div');
        overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:20000; display:flex; align-items:center; justify-content:center; font-family:Arial, sans-serif;";
        
        const dialog = document.createElement('div');
        dialog.style = "background:white; padding:25px; border-radius:15px; box-shadow:0 10px 25px rgba(0,0,0,0.2); text-align:center; min-width:320px; max-width: 90%;";
        
        dialog.innerHTML = `
            <h3 style="margin-top:0; color:#333;">Zu welcher Zahl springen?</h3>
            <input type="text" id="jumpInput" placeholder="Zahl..." style="width:80%; padding:12px; font-size:24px; text-align:center; border:2px solid #3498db; border-radius:8px; margin-bottom:20px; outline:none;">
            <div style="display:flex; gap:10px; justify-content:center; flex-wrap: wrap;">
                <button id="cancelJump" class="nav-control red" style="min-width:120px; height:auto; padding: 10px 15px;">Abbrechen</button>
                <button id="confirmJump" class="nav-control blue" style="min-width:120px; height:auto; padding: 10px 15px;">Springen</button>
            </div>`;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        const input = dialog.querySelector('#jumpInput');
        input.focus();
        
        const closeModal = () => {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        };

        const performJump = () => {
            const val = parseInt(input.value, 10);
            if (!isNaN(val)) { 
                if (typeof window.jumpTo === 'function') window.jumpTo(val); 
                closeModal();
            }
        };

        // Eingabe-Validierung
        input.addEventListener('input', () => {
            let val = input.value.replace(/[^-0-9]/g, '');
            if (val.lastIndexOf('-') > 0) val = val.charAt(0) + val.substring(1).replace(/-/g, '');
            if (val.length > 12) val = val.substring(0, 12);
            input.value = val;
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); performJump(); }
            else if (e.key === 'Escape') closeModal();
        });

        dialog.querySelector('#confirmJump').onclick = performJump;
        dialog.querySelector('#cancelJump').onclick = closeModal;
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
        dialog.onclick = (e) => e.stopPropagation();
    }
};

// Globaler Alias für die UI
window.openJumpModal = window.JumpActions.openModal;