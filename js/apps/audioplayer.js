'use strict';
/* OS/3 WebWarp — Audio Player */
(function () {
  let audio = null, playlist = [], currentTrack = -1, seeking = false;

  function buildWindow() {
    if (document.getElementById('win-audio')) return;
    const w = document.createElement('div');
    w.id = 'win-audio';
    w.className = 'warp-window';
    w.dataset.title = 'Audio Player';
    w.style.cssText = 'top:90px;left:120px;width:340px;height:320px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-audio')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-audio')">🎵</div>
        <div class="warp-title" id="ap-title">Audio Player</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-audio')">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-audio')">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-audio')">&#10005;</button>
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;background:#111827;overflow:hidden;">
        <div style="padding:12px 16px 6px;color:#34d399;font-family:'Courier New',monospace;">
          <div style="font-size:10px;color:#6b7280;margin-bottom:3px;letter-spacing:1px;">NOW PLAYING</div>
          <div id="ap-track" style="font-size:12px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:16px;">No track loaded</div>
          <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:11px;color:#10b981;">
            <span id="ap-time">0:00</span><span id="ap-dur">0:00</span>
          </div>
          <input id="ap-seek" type="range" min="0" max="100" value="0"
            style="width:100%;margin-top:4px;accent-color:#34d399;cursor:pointer;"
            onmousedown="apSeeking=true" onmouseup="apSeekEnd()" oninput="apSeekPreview()">
        </div>
        <div style="display:flex;justify-content:center;align-items:center;gap:6px;padding:8px 16px;">
          <button onclick="apPrev()" style="background:none;border:none;color:#34d399;font-size:20px;cursor:pointer;padding:4px;">⏮</button>
          <button onclick="apStop()" style="background:none;border:none;color:#34d399;font-size:20px;cursor:pointer;padding:4px;">⏹</button>
          <button id="ap-playbtn" onclick="apToggle()"
            style="background:#34d399;border:none;color:#000;font-size:22px;cursor:pointer;
                   width:48px;height:48px;border-radius:50%;">▶</button>
          <button onclick="apNext()" style="background:none;border:none;color:#34d399;font-size:20px;cursor:pointer;padding:4px;">⏭</button>
          <input id="ap-vol" type="range" min="0" max="1" step="0.05" value="0.8"
            style="width:65px;accent-color:#34d399;" oninput="apSetVol()" title="Volume">
        </div>
        <div style="flex:1;overflow-y:auto;border-top:1px solid #1f2937;">
          <div style="display:flex;gap:3px;padding:4px 8px;border-bottom:1px solid #1f2937;">
            <button onclick="apPromptUrl()" style="background:#1f2937;border:1px solid #374151;color:#34d399;font-size:10px;padding:2px 7px;cursor:pointer;">+ URL</button>
            <button onclick="document.getElementById('ap-file-in').click()" style="background:#1f2937;border:1px solid #374151;color:#34d399;font-size:10px;padding:2px 7px;cursor:pointer;">+ File</button>
            <button onclick="apClear()" style="background:#1f2937;border:1px solid #374151;color:#f87171;font-size:10px;padding:2px 7px;cursor:pointer;">Clear</button>
          </div>
          <div id="ap-playlist" style="font-size:11px;font-family:'Courier New',monospace;"></div>
        </div>
      </div>
      <input type="file" id="ap-file-in" accept="audio/*" style="display:none" onchange="apLoadFile(event)">
      <div class="warp-statusbar" id="ap-sb" style="background:#0f172a;color:#10b981;">Ready</div>`;
    document.getElementById('desktop').appendChild(w);

    audio = new Audio();
    audio.volume = 0.8;
    audio.ontimeupdate     = apUpdateTime;
    audio.onended          = apNext;
    audio.onloadedmetadata = () => {
      document.getElementById('ap-dur').textContent = apFmt(audio.duration);
      document.getElementById('ap-sb').textContent  = playlist[currentTrack]?.name || '';
    };
    audio.onerror = () => { document.getElementById('ap-sb').textContent = 'Error loading track'; };
    apRenderPlaylist();
  }

  function apFmt(s) {
    if (!s || isNaN(s)) return '0:00';
    return Math.floor(s/60) + ':' + String(Math.floor(s%60)).padStart(2,'0');
  }

  function apUpdateTime() {
    if (seeking) return;
    document.getElementById('ap-time').textContent = apFmt(audio.currentTime);
    if (audio.duration) document.getElementById('ap-seek').value = audio.currentTime / audio.duration * 100;
  }

  function apRenderPlaylist() {
    const el = document.getElementById('ap-playlist');
    if (!el) return;
    if (!playlist.length) { el.innerHTML = `<div style="padding:10px;color:#4b5563;text-align:center;">Add a URL or file to start.</div>`; return; }
    el.innerHTML = playlist.map((t,i) => `
      <div onclick="apPlayIdx(${i})" style="padding:5px 10px;cursor:pointer;border-bottom:1px solid #1f2937;
        background:${i===currentTrack?'#064e3b':'transparent'};color:${i===currentTrack?'#34d399':'#9ca3af'};">
        ${i===currentTrack?'▶ ':'  '}${t.name}
      </div>`).join('');
  }

  function apPlayIdx(i) {
    if (i < 0 || i >= playlist.length) return;
    currentTrack = i;
    audio.src = playlist[i].url;
    audio.play().catch(() => { document.getElementById('ap-sb').textContent = 'Playback blocked — try a different source'; });
    document.getElementById('ap-title').textContent = 'Audio Player — ' + playlist[i].name;
    document.getElementById('ap-track').textContent = playlist[i].name;
    document.getElementById('ap-playbtn').textContent = '⏸';
    apRenderPlaylist();
  }

  let apSeeking = false;
  window.apSeeking   = false;
  window.apToggle    = () => { if (!audio) return; if (audio.paused) { audio.play(); document.getElementById('ap-playbtn').textContent='⏸'; } else { audio.pause(); document.getElementById('ap-playbtn').textContent='▶'; } };
  window.apStop      = () => { if (!audio) return; audio.pause(); audio.currentTime=0; document.getElementById('ap-playbtn').textContent='▶'; };
  window.apPrev      = () => apPlayIdx(currentTrack > 0 ? currentTrack - 1 : playlist.length - 1);
  window.apNext      = () => apPlayIdx(currentTrack < playlist.length - 1 ? currentTrack + 1 : 0);
  window.apSetVol    = () => { if (audio) audio.volume = parseFloat(document.getElementById('ap-vol').value); };
  window.apSeekPreview = () => {};
  window.apSeekEnd   = () => { seeking = false; if (audio && audio.duration) audio.currentTime = audio.duration * document.getElementById('ap-seek').value / 100; };
  window.apClear     = () => { if (audio) { audio.pause(); audio.src=''; } playlist=[]; currentTrack=-1; document.getElementById('ap-track').textContent='No track loaded'; document.getElementById('ap-title').textContent='Audio Player'; apRenderPlaylist(); };
  window.apPromptUrl = () => { const u = prompt('Audio URL (mp3, ogg, wav, etc):'); if (u && u.trim()) { playlist.push({ url:u.trim(), name: u.trim().split('/').pop() }); if (currentTrack===-1) apPlayIdx(0); else apRenderPlaylist(); } };
  window.apLoadFile  = (e) => { const f=e.target.files[0]; if (!f) return; playlist.push({ url:URL.createObjectURL(f), name:f.name }); if (currentTrack===-1) apPlayIdx(0); else apRenderPlaylist(); e.target.value=''; };
  window.openAudioPlayer = () => { buildWindow(); openWindow('win-audio'); };
}());
