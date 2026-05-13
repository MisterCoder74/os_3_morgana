'use strict';
/* OS/3 WebWarp — Video Player */
(function () {
  function buildWindow() {
    if (document.getElementById('win-video')) return;
    const w = document.createElement('div');
    w.id = 'win-video';
    w.className = 'warp-window';
    w.dataset.title = 'Video Player';
    w.style.cssText = 'top:70px;left:100px;width:560px;height:400px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-video')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-video')">🎬</div>
        <div class="warp-title" id="vp-title">Video Player</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-video')">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-video')">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-video')">&#10005;</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:3px;padding:3px 6px;background:#BBBBBB;border-bottom:1px solid #999;flex-shrink:0;">
        <button class="tb-btn" onclick="vpOpenUrl()">📂 Open URL</button>
        <button class="tb-btn" onclick="document.getElementById('vp-file-in').click()">📂 Open File</button>
        <div style="flex:1;"></div>
        <button class="tb-btn" onclick="vpFullscreen()" title="Fullscreen">⛶</button>
      </div>
      <div style="flex:1;background:#000;display:flex;flex-direction:column;overflow:hidden;">
        <div style="flex:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
          <video id="vp-video" style="max-width:100%;max-height:100%;display:block;"
            onloadedmetadata="vpOnLoaded()" ontimeupdate="vpUpdateTime()" onended="vpOnEnded()"
            onerror="vpOnError()"></video>
          <div id="vp-placeholder" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#555;gap:8px;">
            <div style="font-size:48px">🎬</div>
            <div style="font-size:12px;">Open a video file or URL to begin</div>
          </div>
        </div>
        <!-- Controls strip -->
        <div style="background:#1a1a1a;padding:6px 10px;flex-shrink:0;">
          <input id="vp-seek" type="range" min="0" max="100" value="0"
            style="width:100%;accent-color:#3b82f6;cursor:pointer;margin-bottom:5px;"
            onmousedown="vpSeekStart()" onmouseup="vpSeekEnd()" oninput="vpSeekPreview()">
          <div style="display:flex;align-items:center;gap:6px;">
            <button onclick="vpStop()" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;">⏹</button>
            <button id="vp-playbtn" onclick="vpToggle()"
              style="background:#3b82f6;border:none;color:#fff;font-size:20px;cursor:pointer;
                     width:40px;height:40px;border-radius:50%;">▶</button>
            <span id="vp-time" style="font-family:'Courier New',monospace;font-size:11px;color:#94a3b8;min-width:90px;">0:00 / 0:00</span>
            <div style="flex:1;"></div>
            <span style="font-size:11px;color:#94a3b8;">🔊</span>
            <input id="vp-vol" type="range" min="0" max="1" step="0.05" value="0.8"
              style="width:70px;accent-color:#3b82f6;" oninput="vpSetVol()" title="Volume">
          </div>
        </div>
      </div>
      <input type="file" id="vp-file-in" accept="video/*,audio/*" style="display:none" onchange="vpLoadFile(event)">
      <div class="warp-statusbar" id="vp-sb">Ready — Open a video to begin</div>`;
    document.getElementById('desktop').appendChild(w);

    w.addEventListener('warp-close', () => {
      if (window.vpStop) window.vpStop();
    });
  }

  let vpSeeking = false;

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    return Math.floor(s/60) + ':' + String(Math.floor(s%60)).padStart(2,'0');
  }

  function video()  { return document.getElementById('vp-video'); }
  function hidePH() { const p = document.getElementById('vp-placeholder'); if (p) p.style.display='none'; }

  function vpLoad(url, name) {
    const v = video(); if (!v) return;
    v.src = url;
    v.load();
    hidePH();
    document.getElementById('vp-title').textContent = 'Video Player — ' + (name || url.split('/').pop());
    document.getElementById('vp-sb').textContent = 'Loading…';
  }

  window.vpOnLoaded   = () => { const v=video(); document.getElementById('vp-sb').textContent='Ready — ' + fmt(v.duration); document.getElementById('vp-time').textContent = '0:00 / ' + fmt(v.duration); };
  window.vpOnEnded    = () => { document.getElementById('vp-playbtn').textContent='▶'; document.getElementById('vp-sb').textContent='Finished'; };
  window.vpOnError    = () => { document.getElementById('vp-sb').textContent='Error — unsupported format or source blocked'; };
  window.vpUpdateTime = () => { if (vpSeeking) return; const v=video(); if (!v||!v.duration) return; document.getElementById('vp-seek').value=v.currentTime/v.duration*100; document.getElementById('vp-time').textContent=fmt(v.currentTime)+' / '+fmt(v.duration); };
  window.vpToggle     = () => { const v=video(); if (!v||!v.src) return; if (v.paused){v.play();document.getElementById('vp-playbtn').textContent='⏸';}else{v.pause();document.getElementById('vp-playbtn').textContent='▶';} };
  window.vpStop       = () => { const v=video(); if(!v) return; v.pause(); v.currentTime=0; document.getElementById('vp-playbtn').textContent='▶'; };
  window.vpSetVol     = () => { const v=video(); if(v) v.volume=parseFloat(document.getElementById('vp-vol').value); };
  window.vpSeekStart  = () => { vpSeeking=true; };
  window.vpSeekEnd    = () => { vpSeeking=false; const v=video(); if(v&&v.duration) v.currentTime=v.duration*document.getElementById('vp-seek').value/100; };
  window.vpSeekPreview= () => {};
  window.vpFullscreen = () => { const v=video(); if(v&&v.requestFullscreen) v.requestFullscreen(); };
  window.vpOpenUrl    = () => { const u=prompt('Video/audio URL:'); if(u&&u.trim()) vpLoad(u.trim(), u.trim().split('/').pop()); };
  window.vpLoadFile   = (e) => { const f=e.target.files[0]; if(!f) return; vpLoad(URL.createObjectURL(f),f.name); e.target.value=''; };
  window.openVideoPlayer = () => { buildWindow(); openWindow('win-video'); };
}());
