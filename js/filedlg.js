'use strict';
/* OS/3 WebWarp — Shared File Dialog (Open / Save As) */
(function () {

  /* ── Inject dialog styles once ─────────────────────────────────────── */
  (function injectStyles() {
    if (document.getElementById('filedlg-style')) return;
    const s = document.createElement('style');
    s.id = 'filedlg-style';
    s.textContent = `
      #filedlg-overlay {
        position:fixed;inset:0;background:rgba(0,0,0,.45);
        z-index:9000;display:flex;align-items:center;justify-content:center;
      }
      #filedlg-box {
        background:#BBBBBB;
        border-top:2px solid #DFDFDF;border-left:2px solid #DFDFDF;
        border-right:2px solid #606060;border-bottom:2px solid #606060;
        width:400px;font-family:'IBM Plex Sans','Arial',sans-serif;font-size:12px;
        display:flex;flex-direction:column;
      }
      #filedlg-titlebar {
        background:linear-gradient(to right,#000080,#1084d0);
        color:#fff;padding:3px 6px;font-weight:bold;font-size:12px;
        display:flex;align-items:center;justify-content:space-between;
        user-select:none;
      }
      #filedlg-body { padding:10px;display:flex;flex-direction:column;gap:8px; }
      #filedlg-filename-row { display:flex;align-items:center;gap:6px; }
      #filedlg-filename-row label { white-space:nowrap; }
      #filedlg-name {
        flex:1;height:22px;padding:1px 4px;font-size:12px;
        border-top:2px solid #606060;border-left:2px solid #606060;
        border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
        background:#fff;font-family:inherit;
      }
      #filedlg-list {
        height:160px;overflow-y:auto;
        background:#fff;
        border-top:2px solid #606060;border-left:2px solid #606060;
        border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
      }
      .filedlg-row {
        padding:3px 6px;cursor:default;display:flex;align-items:center;gap:6px;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      }
      .filedlg-row:hover  { background:#000080;color:#fff; }
      .filedlg-row.sel    { background:#000080;color:#fff; }
      .filedlg-row .fmeta { margin-left:auto;font-size:10px;opacity:.7;flex-shrink:0; }
      #filedlg-btns {
        display:flex;justify-content:flex-end;gap:6px;padding:0 0 4px;
      }
      .filedlg-btn {
        min-width:70px;height:24px;font-size:12px;cursor:pointer;
        font-family:inherit;
        background:#CCCCCC;
        border-top:2px solid #DFDFDF;border-left:2px solid #DFDFDF;
        border-right:2px solid #606060;border-bottom:2px solid #606060;
      }
      .filedlg-btn:active {
        border-top:2px solid #606060;border-left:2px solid #606060;
        border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
      }
      #filedlg-filter-row { display:flex;align-items:center;gap:6px; }
      #filedlg-filter {
        height:22px;padding:1px 4px;font-size:12px;flex:1;
        border-top:2px solid #606060;border-left:2px solid #606060;
        border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
        background:#fff;font-family:inherit;
      }
    `;
    document.head.appendChild(s);
  })();

  /* ── Helpers ─────────────────────────────────────────────────────── */
  function fmtSize(bytes) {
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  function fmtDate(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  }
  function fileIcon(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const map = {
      txt:'📄', html:'🌐', htm:'🌐', css:'🎨', js:'⚙️',
      json:'📋', md:'📝', csv:'📊', xml:'📋',
      png:'🖼️', jpg:'🖼️', jpeg:'🖼️', gif:'🖼️', svg:'🖼️', ico:'🖼️',
      mp3:'🎵', wav:'🎵', ogg:'🎵', flac:'🎵',
      mp4:'🎬', webm:'🎬', avi:'🎬', mkv:'🎬',
      pdf:'📕', zip:'📦', gz:'📦', tar:'📦',
    };
    return map[ext] || '📄';
  }

  /* ── Core dialog builder ─────────────────────────────────────────── */
  function buildDialog({ title, mode, suggestedName = '', filterExts = null, onOk, onCancel }) {
    // mode: 'open' | 'saveas'
    const overlay = document.createElement('div');
    overlay.id = 'filedlg-overlay';

    const showName   = (mode === 'saveas');
    const showFilter = (filterExts !== null);

    overlay.innerHTML = `
      <div id="filedlg-box">
        <div id="filedlg-titlebar">
          <span>${title}</span>
        </div>
        <div id="filedlg-body">
          ${showName ? `
          <div id="filedlg-filename-row">
            <label for="filedlg-name">File name:</label>
            <input id="filedlg-name" type="text" value="${suggestedName}" />
          </div>` : ''}
          ${showFilter ? `
          <div id="filedlg-filter-row">
            <label>Filter:</label>
            <input id="filedlg-filter" type="text" placeholder="e.g. *.txt" value="${filterExts}" />
          </div>` : ''}
          <div>
            <div style="margin-bottom:2px;font-weight:bold;">📁 My Files</div>
            <div id="filedlg-list"><div style="padding:20px;text-align:center;color:#888;">Loading…</div></div>
          </div>
          <div id="filedlg-btns">
            <button class="filedlg-btn" id="filedlg-ok">${mode === 'saveas' ? 'Save' : 'Open'}</button>
            <button class="filedlg-btn" id="filedlg-cancel">Cancel</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    let allFiles = [];
    let selected = null;

    const listEl   = overlay.querySelector('#filedlg-list');
    const nameEl   = overlay.querySelector('#filedlg-name');
    const filterEl = overlay.querySelector('#filedlg-filter');

    function renderList(files) {
      if (!files.length) {
        listEl.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No files found.</div>';
        return;
      }
      listEl.innerHTML = '';
      files.forEach(f => {
        const row = document.createElement('div');
        row.className = 'filedlg-row';
        row.innerHTML = `<span>${fileIcon(f.name)}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis">${f.name}</span><span class="fmeta">${fmtSize(f.size)}</span><span class="fmeta">${fmtDate(f.modified)}</span>`;
        row.addEventListener('click', () => {
          listEl.querySelectorAll('.filedlg-row').forEach(r => r.classList.remove('sel'));
          row.classList.add('sel');
          selected = f.name;
          if (nameEl) nameEl.value = f.name;
        });
        row.addEventListener('dblclick', () => {
          if (mode === 'open') doOk();
        });
        listEl.appendChild(row);
      });
    }

    function applyFilter() {
      let pat = filterEl ? filterEl.value.trim() : '';
      if (!pat || pat === '*') { renderList(allFiles); return; }
      pat = pat.replace(/\*/g, '.*').replace(/\?/g, '.');
      try {
        const re = new RegExp(pat, 'i');
        renderList(allFiles.filter(f => re.test(f.name)));
      } catch { renderList(allFiles); }
    }

    // Load file list
    fetch('backend/files.php?action=list')
      .then(r => r.json())
      .then(d => {
        allFiles = d.files || [];
        applyFilter();
      })
      .catch(() => { listEl.innerHTML = '<div style="padding:12px;color:red;">Failed to load files.</div>'; });

    if (filterEl) filterEl.addEventListener('input', applyFilter);

    function close() { overlay.remove(); }

    function doOk() {
      const name = nameEl ? nameEl.value.trim() : selected;
      if (!name) { alert('Please enter a filename.'); return; }
      close();
      onOk(name);
    }

    overlay.querySelector('#filedlg-ok').addEventListener('click', doOk);
    overlay.querySelector('#filedlg-cancel').addEventListener('click', () => { close(); onCancel && onCancel(); });

    // Focus name input
    if (nameEl) setTimeout(() => nameEl.focus(), 50);

    // Enter confirms
    overlay.addEventListener('keydown', e => {
      if (e.key === 'Enter')  doOk();
      if (e.key === 'Escape') { close(); onCancel && onCancel(); }
    });
  }

  /* ── Public API ──────────────────────────────────────────────────── */

  /**
   * Show an Open dialog.
   * callback(name, content) is called with filename + text content on success.
   * filter: optional extension glob string, e.g. "*.txt;*.html"
   */
  window.fileDialogOpen = function (filter, callback) {
    if (typeof filter === 'function') { callback = filter; filter = null; }
    buildDialog({
      title: '📂 Open File',
      mode: 'open',
      filterExts: filter,
      onOk(name) {
        fetch('backend/files.php?action=read&name=' + encodeURIComponent(name))
          .then(r => r.json())
          .then(d => {
            if (d.ok) callback(d.name, d.content);
            else { alert('Cannot open file: ' + (d.error || 'unknown error')); }
          })
          .catch(() => alert('Failed to read file.'));
      }
    });
  };

  /**
   * Show a Save As dialog.
   * callback(name) is called with saved filename on success.
   * content: the string to save.
   */
  window.fileDialogSaveAs = function (suggestedName, content, callback) {
    buildDialog({
      title: '💾 Save As',
      mode: 'saveas',
      suggestedName: suggestedName || 'untitled.txt',
      onOk(name) {
        fetch('backend/files.php?action=save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, content })
        })
          .then(r => r.json())
          .then(d => {
            if (d.ok) { toast('💾 Saved as ' + d.name); callback && callback(d.name); }
            else { alert('Save failed: ' + (d.error || 'unknown error')); }
          })
          .catch(() => alert('Failed to save file.'));
      }
    });
  };

  /**
   * Quick-save: save content to an already-known filename (no dialog).
   * callback(name) on success.
   */
  window.fileSave = function (name, content, callback) {
    fetch('backend/files.php?action=save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content })
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) { toast('💾 Saved: ' + d.name); callback && callback(d.name); }
        else { alert('Save failed: ' + (d.error || 'unknown error')); }
      })
      .catch(() => alert('Save failed.'));
  };

}());
