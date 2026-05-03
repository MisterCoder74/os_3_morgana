'use strict';
/* OS/3 WebWarp — Text Editor App */
(function () {
  const STORE = 'os3_editor_content';
  let wordWrap    = false;
  let currentFile = null;   // currently open server filename (null = unsaved)

  function setTitle(name) {
    currentFile = name || null;
    const el = document.getElementById('editor-title');
    if (el) el.textContent = 'Text Editor — ' + (name || 'Untitled.txt');
  }

  function buildWindow() {
    if (document.getElementById('win-editor')) return;
    const w = document.createElement('div');
    w.id = 'win-editor';
    w.className = 'warp-window';
    w.dataset.title = 'Text Editor';
    w.style.cssText = 'top:70px;left:70px;width:560px;height:400px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-editor')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-editor')">📝</div>
        <div class="warp-title" id="editor-title">Text Editor — Untitled.txt</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-editor')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-editor')" title="Maximize">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-editor')" title="Close">&#10005;</button>
        </div>
      </div>
      <div class="warp-menubar">
        <div class="wm-item" onmousedown="editorMenu('file',event)">File</div>
        <div class="wm-item" onmousedown="editorMenu('edit',event)">Edit</div>
        <div class="wm-item" onmousedown="editorMenu('view',event)">View</div>
        <div class="wm-item" onmousedown="editorMenu('help',event)">Help</div>
      </div>
      <div style="display:flex;gap:4px;padding:3px 6px;background:#BBBBBB;
                  border-bottom:1px solid #999;flex-shrink:0;flex-wrap:wrap;">
        <button class="tb-btn" onclick="editorNew()"            title="New document">📄 New</button>
        <button class="tb-btn" onclick="editorOpen()"           title="Open from server">📂 Open</button>
        <button class="tb-btn" onclick="editorSave()"           title="Quick-save (overwrite)">💾 Save</button>
        <button class="tb-btn" onclick="editorSaveAs()"         title="Save As…">💾 Save As…</button>
        <div style="width:1px;background:#999;margin:1px 2px;"></div>
        <button class="tb-btn" onclick="editorToggleWrap()" id="editor-wrap-btn" title="Toggle Word Wrap">↵ Wrap: OFF</button>
        <div style="flex:1;"></div>
        <button class="tb-btn" onclick="editorCopyAll()"        title="Copy all text">📋 Copy All</button>
      </div>
      <div style="flex:1;display:flex;overflow:hidden;">
        <textarea id="editor-area"
          style="flex:1;padding:8px;font-family:'Courier New',monospace;font-size:12px;
                 border:none;resize:none;background:#fff;color:#000;outline:none;
                 tab-size:2;white-space:pre;overflow:auto;"
          spellcheck="false" wrap="off" placeholder="Start typing…"></textarea>
      </div>
      <div class="warp-statusbar" id="editor-sb">Ln 1, Col 1  |  0 chars  |  0 words</div>`;

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

    const area = document.getElementById('editor-area');
    const saved = localStorage.getItem(STORE);
    if (saved) area.value = saved;

    area.addEventListener('input',   editorStat);
    area.addEventListener('keyup',   editorStat);
    area.addEventListener('click',   editorStat);
    area.addEventListener('keydown', editorKeys);
    editorStat();
  }

  function editorStat() {
    const area = document.getElementById('editor-area');
    if (!area) return;
    const txt = area.value;
    const pos = area.selectionStart;
    const pre = txt.substring(0, pos).split('\n');
    const ln  = pre.length;
    const col = pre[pre.length - 1].length + 1;
    const chars = txt.length;
    const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
    document.getElementById('editor-sb').textContent =
      `Ln ${ln}, Col ${col}  |  ${chars.toLocaleString()} chars  |  ${words.toLocaleString()} words`;
    // Auto-save to localStorage
    localStorage.setItem(STORE, txt);
  }

  function editorKeys(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const a = e.target, s = a.selectionStart, en = a.selectionEnd;
      a.value = a.value.substring(0, s) + '  ' + a.value.substring(en);
      a.selectionStart = a.selectionEnd = s + 2;
      editorStat();
    }
  }

  function editorNew() {
    if (!confirm('Discard current content and start a new document?')) return;
    const area = document.getElementById('editor-area');
    if (area) { area.value = ''; editorStat(); }
    localStorage.removeItem(STORE);
    setTitle(null);
    toast('New document.');
  }

  function editorOpen() {
    fileDialogOpen('*.txt;*.md;*.csv;*.json;*.xml', function (name, content) {
      const area = document.getElementById('editor-area');
      if (area) { area.value = content; editorStat(); }
      setTitle(name);
      toast('📂 Opened: ' + name);
    });
  }

  function editorSave() {
    const area = document.getElementById('editor-area');
    const content = area ? area.value : '';
    if (currentFile) {
      // Quick-save: overwrite existing file
      fileSave(currentFile, content, name => setTitle(name));
    } else {
      // No current file → prompt Save As
      editorSaveAs();
    }
  }

  function editorSaveAs() {
    const area = document.getElementById('editor-area');
    const content = area ? area.value : '';
    const suggested = currentFile || 'document.txt';
    fileDialogSaveAs(suggested, content, function (name) {
      setTitle(name);
    });
  }

  function editorToggleWrap() {
    wordWrap = !wordWrap;
    const area = document.getElementById('editor-area');
    if (area) {
      area.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
      area.setAttribute('wrap', wordWrap ? 'soft' : 'off');
    }
    const btn = document.getElementById('editor-wrap-btn');
    if (btn) btn.textContent = '↵ Wrap: ' + (wordWrap ? 'ON' : 'OFF');
    toast('Word Wrap: ' + (wordWrap ? 'ON' : 'OFF'));
  }

  function editorCopyAll() {
    const area = document.getElementById('editor-area');
    if (!area || !area.value) { toast('Nothing to copy.'); return; }
    navigator.clipboard.writeText(area.value).then(() => toast('📋 Copied to clipboard.'));
  }

  /* ── Public functions ─────────────────────────────────────────────── */
  window.editorNew          = editorNew;
  window.editorOpen         = editorOpen;
  window.editorSave         = editorSave;
  window.editorSaveAs       = editorSaveAs;
  window.editorToggleWrap   = editorToggleWrap;

  /* Open editor with a pre-loaded file (called from File Manager) */
  window.editorOpenFile = function (name, content) {
    buildWindow();
    openWindow('win-editor');
    const area = document.getElementById('editor-area');
    if (area) { area.value = content; editorStat(); }
    setTitle(name);
  };

  window.editorMenu = function (menu, e) {
    e && e.stopPropagation();
    switch (menu) {
      case 'file':
        toast('File: 📄 New  ·  📂 Open  ·  💾 Save  ·  💾 Save As…');
        break;
      case 'edit':
        toast('Edit: Undo (Ctrl+Z)  ·  Cut (Ctrl+X)  ·  Copy (Ctrl+C)  ·  Paste (Ctrl+V)  ·  Select All (Ctrl+A)');
        break;
      case 'view':
        editorToggleWrap();
        break;
      case 'help':
        toast('OS/3 Text Editor — Phase 3 · Vivacity Design');
        break;
    }
  };

  window.openEditor = function () { buildWindow(); openWindow('win-editor'); };
}());
