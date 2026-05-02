'use strict';
/* OS/3 WebWarp — YouTube Player */
(function () {
  const RECENTS_KEY = 'os3_yt_recents';

  function videoIdFromInput(val) {
    val = val.trim();
    // Full URL
    let m = val.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]{11})/);
    if (m) return m[1];
    // Embed URL
    m = val.match(/youtube\.com\/embed\/([\w\-]{11})/);
    if (m) return m[1];
    // Raw 11-char ID
    if (/^[\w\-]{11}$/.test(val)) return val;
    return null;
  }

  function loadRecents() {
    try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); } catch(e) { return []; }
  }
  function saveRecent(id, title) {
    let list = loadRecents().filter(r => r.id !== id);
    list.unshift({ id, title: title || id });
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, 10)));
    renderRecents();
  }

  function renderRecents() {
    const ul = document.getElementById('yt-recents');
    if (!ul) return;
    const list = loadRecents();
    ul.innerHTML = list.length ? '' : '<li style="color:#888;font-size:11px;padding:2px 4px;">No recent videos</li>';
    list.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r.title.substring(0,30);
      li.title = r.id;
      li.style.cssText = 'padding:2px 6px;cursor:pointer;list-style:none;font-size:11px;';
      li.addEventListener('click', () => ytLoad(r.id));
      li.addEventListener('mouseover', () => li.style.background='#D0D0FF');
      li.addEventListener('mouseout',  () => li.style.background='');
      ul.appendChild(li);
    });
  }

  function buildWindow() {
    if (document.getElementById('win-yt')) return;
    const w = document.createElement('div');
    w.id = 'win-yt';
    w.className = 'warp-window';
    w.dataset.title = 'YouTube Player';
    w.style.cssText = 'top:70px;left:80px;width:580px;height:460px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-yt')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-yt')">▶️</div>
        <div class="warp-title">YouTube Player</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-yt')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-yt')" title="Maximize">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-yt')" title="Close">&#10005;</button>
        </div>
      </div>
      <div style="display:flex;gap:4px;padding:6px;background:#CCCCCC;align-items:center;">
        <input id="yt-input" type="text" placeholder="Paste YouTube URL or video ID…"
          style="flex:1;height:22px;font-size:12px;padding:0 4px;font-family:inherit;
                 border-top:2px solid #606060;border-left:2px solid #606060;
                 border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
                 background:#fff;outline:none;"
          onkeydown="if(event.key==='Enter')ytLoadInput()">
        <button onclick="ytLoadInput()" style="
          height:24px;padding:0 10px;font-size:12px;font-family:inherit;cursor:pointer;
          background:#CC0000;color:#fff;
          border-top:2px solid #FF4040;border-left:2px solid #FF4040;
          border-right:2px solid #880000;border-bottom:2px solid #880000;">▶ Play</button>
        <button onclick="ytSearch()" style="
          height:24px;padding:0 8px;font-size:12px;font-family:inherit;cursor:pointer;
          background:#CCCCCC;
          border-top:2px solid #DFDFDF;border-left:2px solid #DFDFDF;
          border-right:2px solid #606060;border-bottom:2px solid #606060;">🔍</button>
      </div>
      <div style="flex:1;display:flex;overflow:hidden;">
        <div style="flex:1;background:#000;display:flex;align-items:center;justify-content:center;">
          <div id="yt-player-area" style="width:100%;height:100%;display:flex;align-items:center;
               justify-content:center;color:#888;font-size:13px;">
            Paste a YouTube URL or video ID above and press Play.
          </div>
        </div>
        <div style="width:160px;background:#DDDDDD;border-left:2px solid #606060;overflow-y:auto;">
          <div style="font-size:11px;font-weight:bold;padding:4px 6px;background:#CCCCCC;
                      border-bottom:1px solid #999;">Recent</div>
          <ul id="yt-recents" style="margin:0;padding:0;"></ul>
        </div>
      </div>
      <div class="warp-statusbar" id="yt-sb">Ready. Paste a URL and press Play.</div>`;
    document.getElementById('desktop').appendChild(w);
    renderRecents();
  }

  window.ytLoadInput = function () {
    const val = document.getElementById('yt-input')?.value || '';
    const id  = videoIdFromInput(val);
    if (!id) { toast('Invalid YouTube URL or video ID.'); return; }
    ytLoad(id);
  };

  window.ytLoad = function (id) {
    const area = document.getElementById('yt-player-area');
    const sb   = document.getElementById('yt-sb');
    if (!area) return;
    area.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0"
      style="width:100%;height:100%;border:none;"
      allow="autoplay;encrypted-media;fullscreen"
      allowfullscreen></iframe>`;
    if (sb) sb.textContent = `Playing: ${id}`;
    const inp = document.getElementById('yt-input');
    if (inp) inp.value = 'https://youtu.be/' + id;
    saveRecent(id, id);
  };

  window.ytSearch = function () {
    const q = document.getElementById('yt-input')?.value?.trim();
    const url = q
      ? 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q)
      : 'https://www.youtube.com';
    window.open(url, '_blank');
  };

  window.openYoutube = function () { buildWindow(); openWindow('win-yt'); };
}());
