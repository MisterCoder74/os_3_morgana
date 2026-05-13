'use strict';
/* OS/3 WebWarp — Display Settings */
(function () {
  function buildWindow() {
    if (document.getElementById('win-display')) return;
    const w = document.createElement('div');
    w.id = 'win-display';
    w.className = 'warp-window';
    w.dataset.title = 'Display Settings';
    w.style.cssText = 'top:150px;left:350px;width:300px;height:auto;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-display')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-display')">📺</div>
        <div class="warp-title">Display Settings</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-display')">&#9660;</button>
          <button class="wbtn" onclick="hideWindow('win-display')">&#10005;</button>
        </div>
      </div>
      <div style="padding:15px;background:#ccc;">
        <p><strong>Actual Resolution:</strong><br>${window.screen.width} x ${window.screen.height}</p>
        <p style="margin-top:10px;"><strong>Browser Agent:</strong><br><span style="font-size:10px;word-break:break-all;">${navigator.userAgent}</span></p>
        <hr style="margin:10px 0;">
        <div style="margin-bottom:8px;">
          <label style="display:block;font-size:11px;">Simulated Resolution:</label>
          <select id="disp-res" style="width:100%;height:22px;font-size:12px;">
            <option>640 x 480 (VGA)</option>
            <option selected>800 x 600 (SVGA)</option>
            <option>1024 x 768 (XGA)</option>
          </select>
        </div>
        <div style="margin-bottom:8px;">
          <label style="display:block;font-size:11px;">Color Depth:</label>
          <select id="disp-colors" style="width:100%;height:22px;font-size:12px;">
            <option>16 Colors</option>
            <option>256 Colors</option>
            <option selected>65,536 Colors (16-bit)</option>
            <option>16.7 Million Colors (24-bit)</option>
          </select>
        </div>
        <div style="margin-top:15px;text-align:right;">
          <button class="os2-btn" onclick="toast('Display settings applied.')" style="min-width:60px;">Apply</button>
        </div>
      </div>
    `;
    document.getElementById('desktop').appendChild(w);
  }

  window.openDisplaySettings = function () { buildWindow(); openWindow('win-display'); };
}());
