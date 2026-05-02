'use strict';
/* OS/3 WebWarp — WebExplorer */
(function () {
  const BOOKMARKS = [
    { label: 'Wikipedia',     url: 'https://en.wikipedia.org' },
    { label: 'Archive.org',   url: 'https://archive.org' },
    { label: 'OpenStreetMap', url: 'https://www.openstreetmap.org' },
    { label: 'DuckDuckGo',    url: 'https://duckduckgo.com' },
  ];
  let navHistory = [], navIdx = -1;

  function buildWindow() {
    if (document.getElementById('win-wb')) return;
    const w = document.createElement('div');
    w.id = 'win-wb';
    w.className = 'warp-window';
    w.dataset.title = 'WebExplorer';
    w.style.cssText = 'top:55px;left:75px;width:660px;height:470px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-wb')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-wb')">🌍</div>
        <div class="warp-title" id="wb-title">WebExplorer</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-wb')">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-wb')">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-wb')">&#10005;</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:3px;padding:3px 5px;background:#BBBBBB;border-bottom:1px solid #888;flex-shrink:0;">
        <button class="tb-btn" id="wb-btn-back" onclick="wbBack()" title="Back">◀</button>
        <button class="tb-btn" id="wb-btn-fwd"  onclick="wbFwd()"  title="Forward">▶</button>
        <button class="tb-btn" onclick="wbRefresh()" title="Refresh">↺</button>
        <button class="tb-btn" onclick="wbHome()" title="Home">🏠</button>
        <input id="wb-addr" type="text" value="https://"
          style="flex:1;height:22px;font-size:11px;padding:0 4px;font-family:inherit;border:2px inset #aaa;"
          onkeydown="if(event.key==='Enter'){event.preventDefault();wbGo();}">
        <button class="tb-btn" onclick="wbGo()" style="padding:0 9px;">Go</button>
        <button class="tb-btn" onclick="wbOpenTab()" title="Open in new tab">↗</button>
      </div>
      <div style="display:flex;gap:2px;padding:2px 5px;background:#CCCCCC;border-bottom:1px solid #999;flex-shrink:0;flex-wrap:wrap;" id="wb-bookmarks"></div>
      <div style="flex:1;position:relative;overflow:hidden;">
        <iframe id="wb-frame" style="width:100%;height:100%;border:none;background:#fff;"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
        <div id="wb-cover" style="position:absolute;inset:0;background:#c0c0c0;
             display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:13px;color:#333;">
          <div style="font-size:40px">🌍</div>
          <div style="font-weight:bold;font-size:14px;">WebExplorer</div>
          <div style="font-size:11px;color:#666;">Enter a URL above and press Go</div>
        </div>
        <div id="wb-blocked" style="display:none;position:absolute;inset:0;background:#c0c0c0;
             flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:12px;color:#333;">
          <div style="font-size:40px">🚫</div>
          <div style="font-weight:bold;">This page cannot be displayed</div>
          <div style="font-size:11px;color:#555;text-align:center;max-width:300px;">
            This site does not allow embedding.<br>You can open it in a new browser tab.
          </div>
          <button class="tb-btn" onclick="wbOpenTab()" style="margin-top:4px;padding:4px 14px;">Open in New Tab</button>
        </div>
      </div>
      <div class="warp-statusbar" id="wb-sb">Ready — Enter a URL and press Go</div>`;
    document.getElementById('desktop').appendChild(w);

    const bbar = document.getElementById('wb-bookmarks');
    BOOKMARKS.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'tb-btn';
      btn.style.cssText = 'font-size:10px;padding:1px 6px;';
      btn.textContent = b.label;
      btn.onclick = () => wbNavigate(b.url);
      bbar.appendChild(btn);
    });

    const frame = document.getElementById('wb-frame');
    frame.addEventListener('load', () => {
      document.getElementById('wb-sb').textContent = 'Done';
      try {
        const loc = frame.contentWindow.location.href;
        if (loc === 'about:blank' && navHistory.length > 0) {
          document.getElementById('wb-blocked').style.display = 'flex';
          frame.style.visibility = 'hidden';
        } else {
          document.getElementById('wb-blocked').style.display = 'none';
          frame.style.visibility = 'visible';
        }
      } catch (e) {
        // Cross-origin — loaded fine
        document.getElementById('wb-blocked').style.display = 'none';
        frame.style.visibility = 'visible';
      }
    });
  }

  function wbNavigate(url) {
    if (!url || url === 'https://') return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    document.getElementById('wb-addr').value = url;
    document.getElementById('wb-sb').textContent = 'Loading…';
    document.getElementById('wb-title').textContent = 'WebExplorer — ' + url;
    document.getElementById('wb-cover').style.display = 'none';
    document.getElementById('wb-blocked').style.display = 'none';
    const frame = document.getElementById('wb-frame');
    frame.style.visibility = 'visible';
    frame.src = url;
    navHistory = navHistory.slice(0, navIdx + 1);
    navHistory.push(url);
    navIdx = navHistory.length - 1;
    document.getElementById('wb-btn-back').disabled = navIdx <= 0;
    document.getElementById('wb-btn-fwd').disabled  = true;
  }

  window.wbGo      = () => wbNavigate(document.getElementById('wb-addr')?.value?.trim());
  window.wbBack    = () => { if (navIdx > 0)                       wbNavigate(navHistory[--navIdx]); };
  window.wbFwd     = () => { if (navIdx < navHistory.length - 1)   wbNavigate(navHistory[++navIdx]); };
  window.wbRefresh = () => { const f = document.getElementById('wb-frame'); if (f.src) { document.getElementById('wb-sb').textContent = 'Refreshing…'; f.src = f.src; } };
  window.wbHome    = () => wbNavigate('https://en.wikipedia.org');
  window.wbOpenTab = () => { const u = document.getElementById('wb-addr')?.value; if (u && u !== 'https://') window.open(u, '_blank'); };
  window.openWebBrowser = () => { buildWindow(); openWindow('win-wb'); };
}());
