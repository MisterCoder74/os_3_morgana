'use strict';
/* OS/3 WebWarp — File Manager */
(function () {
  let files = [], selected = null;

  function buildWindow() {
    if (document.getElementById('win-ftp')) return;
    const w = document.createElement('div');
    w.id = 'win-ftp';
    w.className = 'warp-window';
    w.dataset.title = 'File Manager';
    w.style.cssText = 'top:80px;left:110px;width:460px;height:340px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-ftp')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-ftp')">📁</div>
        <div class="warp-title">File Manager</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-ftp')">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-ftp')">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-ftp')">&#10005;</button>
        </div>
      </div>
      <div style="display:flex;gap:4px;padding:3px 6px;background:#BBBBBB;border-bottom:1px solid #999;flex-shrink:0;align-items:center;">
        <button class="tb-btn" onclick="fmUpload()">📤 Upload</button>
        <button class="tb-btn" onclick="fmDownload()">📥 Download</button>
        <button class="tb-btn" onclick="fmDelete()">🗑 Delete</button>
        <div style="flex:1;"></div>
        <button class="tb-btn" onclick="fmRefresh()">↺ Refresh</button>
      </div>
      <div style="flex:1;display:flex;overflow:hidden;">
        <div style="width:120px;background:#CCCCCC;border-right:2px solid #888;padding:6px;font-size:11px;flex-shrink:0;">
          <div style="font-weight:bold;font-size:10px;color:#444;margin-bottom:6px;">LOCATIONS</div>
          <div style="padding:3px 5px;background:#0000A0;color:#fff;border-radius:2px;cursor:pointer;">📂 My Files</div>
        </div>
        <div id="fm-list" style="flex:1;background:#fff;overflow-y:auto;font-size:11px;"></div>
      </div>
      <input type="file" id="fm-upload-in" style="display:none" multiple onchange="fmDoUpload(event)">
      <div class="warp-statusbar" id="fm-sb">Loading…</div>`;
    document.getElementById('desktop').appendChild(w);
    fmRefresh();
  }

  async function fmRefresh() {
    try {
      const r = await fetch('backend/files.php?action=list');
      if (!r.ok) throw new Error('server');
      const d = await r.json();
      files = d.files || [];
    } catch (e) {
      files = [];
      const sb = document.getElementById('fm-sb');
      if (sb) sb.textContent = 'Server unavailable — upload/download works locally';
    }
    selected = null;
    renderList();
  }

  function renderList() {
    const list = document.getElementById('fm-list');
    if (!list) return;
    if (!files.length) {
      list.innerHTML = `<div style="padding:20px;color:#888;text-align:center;">No files. Click Upload to add files.</div>`;
      const sb = document.getElementById('fm-sb');
      if (sb && !sb.textContent.includes('unavailable')) sb.textContent = '0 files';
      return;
    }
    list.innerHTML = files.map((f, i) => `
      <div onclick="fmSelect(${i})" style="
        display:flex;align-items:center;gap:8px;padding:5px 10px;
        border-bottom:1px solid #eee;cursor:pointer;
        background:${i===selected?'#0000A0':'#fff'};
        color:${i===selected?'#fff':'#000'};">
        <span style="font-size:16px;">${fmIcon(f.name)}</span>
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${f.name}</span>
        <span style="font-size:10px;color:${i===selected?'#ccc':'#888'};white-space:nowrap;">${fmSize(f.size)}</span>
      </div>`).join('');
    const sb = document.getElementById('fm-sb');
    if (sb && !sb.textContent.includes('unavailable')) sb.textContent = `${files.length} file${files.length!==1?'s':''}`;
  }

  function fmIcon(name) {
    const ext = name.split('.').pop().toLowerCase();
    const m = { txt:'📄',md:'📄',pdf:'📑',jpg:'🖼',jpeg:'🖼',png:'🖼',gif:'🖼',
                zip:'🗜',tar:'🗜',mp3:'🎵',wav:'🎵',ogg:'🎵',mp4:'🎬',mov:'🎬',
                js:'📜',php:'📜',html:'🌐',css:'🎨',json:'📋',csv:'📊' };
    return m[ext] || '📄';
  }

  function fmSize(b) {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
    return (b/1048576).toFixed(1) + ' MB';
  }

  window.fmSelect   = i  => { selected = i; renderList(); };
  window.fmUpload   = () => document.getElementById('fm-upload-in')?.click();
  window.fmRefresh  = fmRefresh;

  window.fmDoUpload = async function (e) {
    const fileList = [...e.target.files];
    if (!fileList.length) return;
    document.getElementById('fm-sb').textContent = `Uploading ${fileList.length} file${fileList.length>1?'s':''}…`;
    let ok = 0;
    for (const file of fileList) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const r = await fetch('backend/files.php?action=upload', { method: 'POST', body: fd });
        const d = await r.json();
        if (d.ok) ok++;
      } catch (err) {}
    }
    toast(`📤 Uploaded ${ok}/${fileList.length} file${ok!==1?'s':''}.`);
    e.target.value = '';
    fmRefresh();
  };

  window.fmDownload = async function () {
    if (selected === null || !files[selected]) { toast('Select a file first.'); return; }
    const f = files[selected];
    try {
      const r = await fetch(`backend/files.php?action=download&name=${encodeURIComponent(f.name)}`);
      if (!r.ok) throw new Error('Not found');
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = f.name;
      a.click();
    } catch (e) { toast('Download failed.'); }
  };

  window.fmDelete = async function () {
    if (selected === null || !files[selected]) { toast('Select a file first.'); return; }
    const f = files[selected];
    if (!confirm(`Delete "${f.name}"?`)) return;
    try {
      const r = await fetch(`backend/files.php?action=delete&name=${encodeURIComponent(f.name)}`);
      const d = await r.json();
      if (d.ok) { toast('🗑 Deleted: ' + f.name); selected = null; fmRefresh(); }
      else toast('Delete failed.');
    } catch (e) { toast('Delete failed.'); }
  };

  window.openFileManager = function () { buildWindow(); openWindow('win-ftp'); };
}());
