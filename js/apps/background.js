'use strict';
/* OS/3 WebWarp — Background Settings */
(function () {
  function buildWindow() {
    if (document.getElementById('win-background')) return;
    const w = document.createElement('div');
    w.id = 'win-background';
    w.className = 'warp-window';
    w.dataset.title = 'Background';
    w.style.cssText = 'top:210px;left:410px;width:340px;height:auto;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-background')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-background')">🎨</div>
        <div class="warp-title">Background Settings</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-background')">&#9660;</button>
          <button class="wbtn" onclick="hideWindow('win-background')">&#10005;</button>
        </div>
      </div>
      <div style="padding:15px;background:#ccc;">
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:11px;margin-bottom:4px;">Desktop Color:</label>
          <div style="display:flex;gap:5px;align-items:center;">
            <input type="color" id="bg-color-picker" value="#008080" style="width:50px;height:24px;padding:0;border:none;background:none;cursor:pointer;">
            <input type="text" id="bg-color-text" value="#008080" style="flex:1;height:24px;padding:0 4px;font-family:monospace;">
          </div>
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:11px;margin-bottom:4px;">Wallpaper URL (optional):</label>
          <input type="text" id="bg-image-url" placeholder="https://..." style="width:100%;height:24px;padding:0 4px;">
        </div>
        <div style="text-align:right;margin-top:20px;display:flex;justify-content:flex-end;gap:8px;">
          <button class="os2-btn" id="bg-apply-btn">Apply</button>
          <button class="os2-btn" id="bg-reset-btn">Reset</button>
        </div>
      </div>
    `;
    document.getElementById('desktop').appendChild(w);

    const cp = document.getElementById('bg-color-picker');
    const ct = document.getElementById('bg-color-text');
    cp.oninput = () => ct.value = cp.value.toUpperCase();
    ct.onchange = () => cp.value = ct.value;
    
    document.getElementById('bg-apply-btn').onclick = apply;
    document.getElementById('bg-reset-btn').onclick = reset;
  }

  function apply() {
    const color = document.getElementById('bg-color-text').value;
    const img = document.getElementById('bg-image-url').value;
    
    document.documentElement.style.setProperty('--c-desktop', color);
    
    if (img) {
        document.body.style.backgroundImage = `url('${img}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    } else {
        document.body.style.backgroundImage = 'none';
    }
    toast('Background updated.');
  }

  function reset() {
    document.getElementById('bg-color-text').value = '#008080';
    document.getElementById('bg-color-picker').value = '#008080';
    document.getElementById('bg-image-url').value = '';
    apply();
  }

  window.openBackgroundSettings = function () { buildWindow(); openWindow('win-background'); };
}());
