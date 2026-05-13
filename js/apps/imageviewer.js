'use strict';
/* OS/3 WebWarp — Image Viewer */
(function () {
  function buildWindow() {
    if (document.getElementById('win-imageviewer')) return;
    const w = document.createElement('div');
    w.id = 'win-imageviewer';
    w.className = 'warp-window';
    w.dataset.title = 'Image Viewer';
    w.style.cssText = 'top:80px;left:120px;width:500px;height:400px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-imageviewer')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-imageviewer')">🖼️</div>
        <div class="warp-title" id="iv-title">Image Viewer</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-imageviewer')">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-imageviewer')">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-imageviewer')">&#10005;</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:3px;padding:3px 6px;background:#BBBBBB;border-bottom:1px solid #999;flex-shrink:0;">
        <button class="tb-btn" onclick="ivOpenUrl()">📂 Open URL</button>
        <button class="tb-btn" onclick="document.getElementById('iv-file-in').click()">📂 Open File</button>
        <div style="flex:1;"></div>
      </div>
      <div style="flex:1;background:#808080;display:flex;align-items:center;justify-content:center;overflow:auto;position:relative;">
        <img id="iv-img" style="max-width:none;display:none;box-shadow:2px 2px 10px rgba(0,0,0,0.5);background:#fff;">
        <div id="iv-placeholder" style="display:flex;flex-direction:column;align-items:center;justify-content:center;color:#444;gap:8px;">
          <div style="font-size:48px">🖼️</div>
          <div style="font-size:12px;">Open an image file or URL</div>
        </div>
      </div>
      <input type="file" id="iv-file-in" accept="image/*" style="display:none" onchange="ivLoadFile(event)">
      <div class="warp-statusbar" id="iv-sb">Ready</div>`;

    if (!document.getElementById('tb-btn-style')) {
      const s = document.createElement('style');
      s.id = 'tb-btn-style';
      s.textContent = `.tb-btn{height:22px;padding:0 7px;font-size:11px;font-family:inherit;
        cursor:pointer;background:#CCCCCC;white-space:nowrap;
        border-top:2px solid #DFDFDF;border-left:2px solid #DFDFDF;
        border-right:2px solid #606060;border-bottom:2px solid #606060;}
        .tb-btn:active{border-top:2px solid #606060;border-left:2px solid #606060;
        border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;}`;
      document.head.appendChild(s);
    }

    document.getElementById('desktop').appendChild(w);
  }

  function ivLoad(url, name) {
    const img = document.getElementById('iv-img');
    const ph = document.getElementById('iv-placeholder');
    if (!img) return;
    
    img.onload = () => {
      img.style.display = 'block';
      ph.style.display = 'none';
      document.getElementById('iv-sb').textContent = `Loaded: ${img.naturalWidth} x ${img.naturalHeight} pixels`;
    };
    img.onerror = () => {
      img.style.display = 'none';
      ph.style.display = 'flex';
      document.getElementById('iv-sb').textContent = 'Error loading image.';
      toast('Failed to load image.');
    };
    
    img.src = url;
    document.getElementById('iv-title').textContent = 'Image Viewer — ' + (name || url.split('/').pop());
    document.getElementById('iv-sb').textContent = 'Loading…';
  }

  window.ivOpenUrl = () => {
    const u = prompt('Image URL:');
    if (u && u.trim()) ivLoad(u.trim(), u.trim().split('/').pop());
  };

  window.ivLoadFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    ivLoad(URL.createObjectURL(f), f.name);
    e.target.value = '';
  };

  window.openImageViewer = () => {
    buildWindow();
    openWindow('win-imageviewer');
  };
}());
