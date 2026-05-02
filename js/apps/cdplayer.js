'use strict';
/* OS/3 WebWarp — CD Player */
(function () {
  let audio = null, spinning = false, rafId = null, angle = 0;

  function buildWindow() {
    if (document.getElementById('win-cd')) return;
    const w = document.createElement('div');
    w.id = 'win-cd';
    w.className = 'warp-window';
    w.dataset.title = 'CD Player';
    w.style.cssText = 'top:100px;left:140px;width:300px;height:340px;resize:none;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-cd')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-cd')">💿</div>
        <div class="warp-title">CD Player</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-cd')">&#9472;</button>
          <button class="wbtn" onclick="hideWindow('win-cd')">&#10005;</button>
        </div>
      </div>
      <div style="flex:1;background:#2a2a3e;display:flex;flex-direction:column;align-items:center;padding:16px 12px 10px;gap:10px;overflow:hidden;">
        <!-- CD disc -->
        <div style="position:relative;width:130px;height:130px;flex-shrink:0;">
          <canvas id="cd-canvas" width="130" height="130" style="border-radius:50%;display:block;"></canvas>
        </div>
        <!-- Digital display -->
        <div style="background:#0a0a0a;border:2px inset #444;width:100%;padding:8px 12px;font-family:'Courier New',monospace;color:#00ff44;font-size:12px;text-align:center;box-sizing:border-box;">
          <div id="cd-track-name" style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#00cc33;margin-bottom:3px;">-- NO DISC --</div>
          <div style="font-size:20px;letter-spacing:3px;" id="cd-time">0:00</div>
        </div>
        <!-- Transport controls -->
        <div style="display:flex;align-items:center;gap:8px;">
          <button onclick="cdStop()" title="Stop"
            style="background:#333;border:2px outset #555;color:#ccc;font-size:16px;cursor:pointer;width:36px;height:36px;">⏹</button>
          <button id="cd-playbtn" onclick="cdToggle()" title="Play/Pause"
            style="background:#444;border:2px outset #666;color:#00ff44;font-size:22px;cursor:pointer;width:52px;height:52px;border-radius:4px;">▶</button>
          <button onclick="cdEject()" title="Eject / Load"
            style="background:#333;border:2px outset #555;color:#ccc;font-size:14px;cursor:pointer;width:36px;height:36px;">⏏</button>
        </div>
        <!-- Volume -->
        <div style="display:flex;align-items:center;gap:6px;width:100%;">
          <span style="font-size:10px;color:#888;">VOL</span>
          <input id="cd-vol" type="range" min="0" max="1" step="0.05" value="0.8"
            style="flex:1;accent-color:#00ff44;" oninput="cdSetVol()" title="Volume">
        </div>
      </div>
      <input type="file" id="cd-file-in" accept="audio/*" style="display:none" onchange="cdLoadFile(event)">
      <div class="warp-statusbar" id="cd-sb" style="background:#111;color:#00cc33;">No disc — click ⏏ to load</div>`;
    document.getElementById('desktop').appendChild(w);

    audio = new Audio();
    audio.volume = 0.8;
    audio.onended          = cdStop;
    audio.onloadedmetadata = () => { document.getElementById('cd-sb').textContent = 'Ready — ' + cdFmt(audio.duration); };
    audio.onerror          = () => { document.getElementById('cd-sb').textContent = 'Error loading track'; };
    drawDisc(false);
  }

  function cdFmt(s) {
    if (!s || isNaN(s)) return '0:00';
    return Math.floor(s/60) + ':' + String(Math.floor(s%60)).padStart(2,'0');
  }

  function drawDisc(isSpinning) {
    const canvas = document.getElementById('cd-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 65, cy = 65, r = 63;

    ctx.clearRect(0, 0, 130, 130);

    // Disc body — rainbow-ish gradient
    const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, r);
    if (isSpinning) {
      grad.addColorStop(0,   '#e0e0e0');
      grad.addColorStop(0.3, '#c8a0d8');
      grad.addColorStop(0.5, '#88c8f8');
      grad.addColorStop(0.7, '#a8e0a0');
      grad.addColorStop(0.9, '#f8d870');
      grad.addColorStop(1,   '#c0c0c0');
    } else {
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#888');
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Shine highlight
    const shine = ctx.createLinearGradient(cx-r, cy-r, cx+r, cy+r);
    shine.addColorStop(0,   'rgba(255,255,255,0.35)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = shine;
    ctx.fill();

    // Centre hole
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a3e';
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Disc edge
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function spinTick() {
    if (!spinning) return;
    angle = (angle + 2) % 360;
    // Redraw with rotation effect
    const canvas = document.getElementById('cd-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(65, 65);
    ctx.rotate(angle * Math.PI / 180);
    ctx.translate(-65, -65);
    drawDisc(true);
    ctx.restore();
    // Update time display
    if (audio) {
      document.getElementById('cd-time').textContent = cdFmt(audio.currentTime);
    }
    rafId = requestAnimationFrame(spinTick);
  }

  window.cdToggle = function () {
    if (!audio || !audio.src) { cdEject(); return; }
    if (audio.paused) {
      audio.play().catch(() => { document.getElementById('cd-sb').textContent = 'Playback error'; });
      spinning = true;
      document.getElementById('cd-playbtn').textContent = '⏸';
      document.getElementById('cd-sb').textContent = 'Playing…';
      if (!rafId) rafId = requestAnimationFrame(spinTick);
    } else {
      audio.pause();
      spinning = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      document.getElementById('cd-playbtn').textContent = '▶';
      document.getElementById('cd-sb').textContent = 'Paused';
      drawDisc(false);
    }
  };

  window.cdStop = function () {
    if (!audio) return;
    audio.pause(); audio.currentTime = 0;
    spinning = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    document.getElementById('cd-playbtn').textContent = '▶';
    document.getElementById('cd-time').textContent = '0:00';
    document.getElementById('cd-sb').textContent = 'Stopped';
    drawDisc(false);
  };

  window.cdEject = function () {
    cdStop();
    document.getElementById('cd-file-in').click();
  };

  window.cdSetVol = function () {
    if (audio) audio.volume = parseFloat(document.getElementById('cd-vol').value);
  };

  window.cdLoadFile = function (e) {
    const f = e.target.files[0]; if (!f) return;
    if (audio) { audio.pause(); audio.src = URL.createObjectURL(f); }
    document.getElementById('cd-track-name').textContent = f.name;
    document.getElementById('cd-sb').textContent = 'Loaded — ' + f.name;
    e.target.value = '';
    cdToggle();
  };

  window.openCdPlayer = function () { buildWindow(); openWindow('win-cd'); };
}());
