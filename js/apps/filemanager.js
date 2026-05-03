'use strict';
/* OS/3 WebWarp — File Manager App (Programs folder) */
(function () {
  let allFiles  = [];
  let selFile   = null;
  let curFolder = 'all';

  /* ── Virtual folder definitions ─────────────────────────────────── */
  const FOLDERS = [
    { id: 'all',    icon: '📁', label: 'All Files',       match: () => true },
    { id: 'docs',   icon: '📄', label: 'Text Documents',  match: f => /\.(txt|md|csv|log|ini|cfg|conf)$/i.test(f) },
    { id: 'html',   icon: '🌐', label: 'HTML / Web Files', match: f => /\.(html|htm|css|js|json|xml|svg)$/i.test(f) },
    { id: 'images', icon: '🖼️', label: 'Images',           match: f => /\.(png|jpg|jpeg|gif|bmp|ico|webp)$/i.test(f) },
    { id: 'audio',  icon: '🎵', label: 'Audio',            match: f => /\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(f) },
    { id: 'video',  icon: '🎬', label: 'Video',            match: f => /\.(mp4|webm|avi|mov|mkv|ogv)$/i.test(f) },
    { id: 'other',  icon: '📦', label: 'Other',
      match: f => !/\.(txt|md|csv|log|ini|cfg|conf|html|htm|css|js|json|xml|svg|png|jpg|jpeg|gif|bmp|ico|webp|mp3|wav|ogg|flac|aac|m4a|mp4|webm|avi|mov|mkv|ogv)$/i.test(f) }
  ];

  /* ── Helpers ─────────────────────────────────────────────────────── */
  function fmtSize(bytes) {
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  function fmtDate(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function fileIcon(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const map = {
      txt:'📄', md:'📝', csv:'📊', log:'📋', ini:'⚙️', cfg:'⚙️',
      html:'🌐', htm:'🌐', css:'🎨', js:'⚙️', json:'📋', xml:'📋', svg:'🖼️',
      png:'🖼️', jpg:'🖼️', jpeg:'🖼️', gif:'🖼️', bmp:'🖼️', ico:'🖼️', webp:'🖼️',
      mp3:'🎵', wav:'🎵', ogg:'🎵', flac:'🎵', aac:'🎵', m4a:'🎵',
      mp4:'🎬', webm:'🎬', avi:'🎬', mov:'🎬', mkv:'🎬',
      pdf:'📕', zip:'📦', gz:'📦', tar:'📦',
    };
    return map[ext] || '📄';
  }
  function ext(name) { return (name.split('.').pop() || '').toLowerCase(); }
  function isText(name) { return /^(txt|md|csv|log|ini|cfg|conf|html|htm|css|js|json|xml|svg)$/.test(ext(name)); }
  function isHtml(name) { return /^(html|htm)$/.test(ext(name)); }

  /* ── Load files from server ──────────────────────────────────────── */
  function loadFiles() {
    const list = document.getElementById('fm-file-list');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#888;">Loading…</td></tr>';
    fetch('backend/files.php?action=list')
      .then(r => r.json())
      .then(d => {
        allFiles = d.files || [];
        renderFiles();
        updateStatusBar();
      })
      .catch(() => {
        if (list) list.innerHTML = '<tr><td colspan="4" style="padding:12px;color:red;">Failed to load files.</td></tr>';
      });
  }

  /* ── Render file list ────────────────────────────────────────────── */
  function renderFiles() {
    const list = document.getElementById('fm-file-list');
    if (!list) return;
    const folder = FOLDERS.find(f => f.id === curFolder) || FOLDERS[0];
    const files  = allFiles.filter(f => folder.match(f.name));

    if (!files.length) {
      list.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;color:#888;">No files in this folder.</td></tr>';
      return;
    }

    list.innerHTML = '';
    files.forEach(f => {
      const tr = document.createElement('tr');
      tr.style.cssText = 'cursor:default;';
      tr.innerHTML = `
        <td style="padding:3px 6px;white-space:nowrap;">
          <span style="margin-right:4px;">${fileIcon(f.name)}</span>${f.name}
        </td>
        <td style="padding:3px 6px;text-align:right;white-space:nowrap;">${fmtSize(f.size)}</td>
        <td style="padding:3px 6px;white-space:nowrap;">${fmtDate(f.modified)}</td>
        <td style="padding:3px 6px;white-space:nowrap;">
          <button class="tb-btn" onclick="fmAction('open','${f.name}')"     title="Open">📂</button>
          <button class="tb-btn" onclick="fmAction('download','${f.name}')" title="Download">⬇</button>
          <button class="tb-btn" onclick="fmAction('rename','${f.name}')"   title="Rename">✏️</button>
          <button class="tb-btn" onclick="fmAction('delete','${f.name}')"   title="Delete" style="color:#900;">🗑</button>
        </td>`;

      tr.addEventListener('click', () => {
        list.querySelectorAll('tr').forEach(r => r.style.background = '');
        tr.style.background = '#000080';
        tr.style.color      = '#fff';
        selFile = f.name;
        updateStatusBar();
      });
      tr.addEventListener('dblclick', () => fmAction('open', f.name));
      list.appendChild(tr);
    });
    selFile = null;
    updateStatusBar();
  }

  function updateStatusBar() {
    const sb = document.getElementById('fm-status');
    if (!sb) return;
    const folder = FOLDERS.find(f => f.id === curFolder) || FOLDERS[0];
    const count  = allFiles.filter(f => folder.match(f.name)).length;
    const total  = allFiles.reduce((s, f) => s + f.size, 0);
    sb.textContent = `${count} file${count !== 1 ? 's' : ''}  |  Total: ${fmtSize(total)}` +
                     (selFile ? `  |  Selected: ${selFile}` : '');
  }

  /* ── Actions ─────────────────────────────────────────────────────── */
  window.fmAction = function (action, name) {
    switch (action) {
      case 'open':
        if (isText(name)) {
          fetch('backend/files.php?action=read&name=' + encodeURIComponent(name))
            .then(r => r.json())
            .then(d => {
              if (!d.ok) { toast('Cannot read file.'); return; }
              if (isHtml(name)) {
                htmledOpenFile(name, d.content);
              } else {
                editorOpenFile(name, d.content);
              }
            });
        } else {
          // Non-text: just download
          window.location.href = 'backend/files.php?action=download&name=' + encodeURIComponent(name);
        }
        break;

      case 'download':
        window.location.href = 'backend/files.php?action=download&name=' + encodeURIComponent(name);
        break;

      case 'rename':
        const newName = prompt('Rename "' + name + '" to:', name);
        if (!newName || newName === name) return;
        fetch('backend/files.php?action=rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ old: name, new: newName })
        })
          .then(r => r.json())
          .then(d => {
            if (d.ok) { toast('Renamed to ' + newName); loadFiles(); }
            else       { toast('Rename failed: ' + (d.error || '?')); }
          });
        break;

      case 'delete':
        if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;
        fetch('backend/files.php?action=delete&name=' + encodeURIComponent(name))
          .then(r => r.json())
          .then(d => {
            if (d.ok) { toast('🗑 Deleted: ' + name); loadFiles(); }
            else       { toast('Delete failed: ' + (d.error || '?')); }
          });
        break;
    }
  };

  window.fmUpload = function () {
    const inp = document.createElement('input');
    inp.type  = 'file';
    inp.multiple = true;
    inp.onchange  = () => {
      const files   = Array.from(inp.files);
      let   done    = 0;
      files.forEach(file => {
        const fd = new FormData();
        fd.append('file', file);
        fetch('backend/files.php?action=upload', { method: 'POST', body: fd })
          .then(r => r.json())
          .then(d => {
            done++;
            if (d.ok) toast('⬆ Uploaded: ' + d.name);
            else       toast('Upload failed: ' + (d.error || '?'));
            if (done === files.length) loadFiles();
          });
      });
    };
    inp.click();
  };

  window.fmNewText = function () {
    const name = prompt('New text file name:', 'newfile.txt');
    if (!name) return;
    fetch('backend/files.php?action=save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content: '' })
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          toast('Created: ' + d.name);
          loadFiles();
          editorOpenFile(d.name, '');
        } else { toast('Create failed: ' + (d.error || '?')); }
      });
  };

  window.fmSelectFolder = function (id) {
    curFolder = id;
    // Update sidebar highlight
    document.querySelectorAll('.fm-folder-item').forEach(el => {
      el.style.background = el.dataset.fid === id ? '#000080' : '';
      el.style.color      = el.dataset.fid === id ? '#fff'    : '';
    });
    renderFiles();
  };

  window.fmRefresh = function () { loadFiles(); toast('🔄 Refreshed.'); };

  /* ── Build window ────────────────────────────────────────────────── */
  function buildWindow() {
    if (document.getElementById('win-filemanager')) return;
    const w = document.createElement('div');
    w.id = 'win-filemanager';
    w.className = 'warp-window';
    w.dataset.title = 'File Manager';
    w.style.cssText = 'top:90px;left:120px;width:680px;height:440px;';

    const folderTree = FOLDERS.map(f =>
      `<div class="fm-folder-item tb-btn" data-fid="${f.id}"
            onclick="fmSelectFolder('${f.id}')"
            style="display:flex;align-items:center;gap:6px;width:100%;text-align:left;
                   padding:4px 8px;margin-bottom:2px;${f.id === 'all' ? 'background:#000080;color:#fff;' : ''}">
        <span>${f.icon}</span><span style="font-size:11px;">${f.label}</span>
      </div>`
    ).join('');

    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-filemanager')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-filemanager')">📁</div>
        <div class="warp-title">File Manager — My Files</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-filemanager')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-filemanager')" title="Maximize">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-filemanager')"     title="Close">&#10005;</button>
        </div>
      </div>
      <div class="warp-menubar">
        <div class="wm-item" onmousedown="fmRefresh()">🔄 Refresh</div>
        <div class="wm-item" onmousedown="fmUpload()">⬆ Upload</div>
        <div class="wm-item" onmousedown="fmNewText()">📄 New Text File</div>
      </div>
      <!-- Toolbar -->
      <div style="display:flex;gap:4px;padding:3px 6px;background:#BBBBBB;
                  border-bottom:1px solid #999;flex-shrink:0;">
        <button class="tb-btn" onclick="fmRefresh()"  title="Refresh">🔄 Refresh</button>
        <button class="tb-btn" onclick="fmUpload()"   title="Upload files">⬆ Upload</button>
        <button class="tb-btn" onclick="fmNewText()"  title="New text file">📄 New File</button>
        <div style="flex:1;"></div>
        <span id="fm-selected-label" style="font-size:11px;color:#444;line-height:22px;"></span>
      </div>
      <!-- Two pane: sidebar | file list -->
      <div style="flex:1;display:flex;overflow:hidden;min-height:0;">
        <!-- Sidebar -->
        <div style="width:160px;flex-shrink:0;background:#CCCCCC;overflow-y:auto;
                    border-right:2px solid #999;padding:6px 4px;">
          <div style="font-size:10px;font-weight:bold;margin-bottom:6px;padding-left:4px;color:#333;">FOLDERS</div>
          ${folderTree}
        </div>
        <!-- File list -->
        <div style="flex:1;overflow:auto;background:#fff;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#BBBBBB;position:sticky;top:0;">
                <th style="padding:3px 6px;text-align:left;border-bottom:1px solid #999;font-weight:bold;">Name</th>
                <th style="padding:3px 6px;text-align:right;border-bottom:1px solid #999;font-weight:bold;white-space:nowrap;">Size</th>
                <th style="padding:3px 6px;text-align:left;border-bottom:1px solid #999;font-weight:bold;white-space:nowrap;">Modified</th>
                <th style="padding:3px 6px;text-align:left;border-bottom:1px solid #999;font-weight:bold;">Actions</th>
              </tr>
            </thead>
            <tbody id="fm-file-list">
              <tr><td colspan="4" style="text-align:center;padding:30px;color:#888;">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="warp-statusbar" id="fm-status">Ready</div>`;

    document.getElementById('desktop').appendChild(w);
    loadFiles();
  }

  window.openLocalFileManager = function () { buildWindow(); openWindow('win-filemanager'); };
}());
