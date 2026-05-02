'use strict';
/* OS/3 WebWarp — Text Editor App */
(function () {
  const STORE = 'os3_editor_content';
  const STORE_NAME = 'os3_editor_filename';
  let wordWrap = false;

  function buildWindow() {
    if (document.getElementById('win-editor')) return;
    const w = document.createElement('div');
    w.id = 'win-editor';
    w.className = 'warp-window';
    w.dataset.title = 'Text Editor';
    w.style.cssText = 'top:70px;left:70px;width:520px;height:360px;';
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
      <div style="flex:1;display:flex;overflow:hidden;">
        <textarea id="editor-area"
          style="flex:1;padding:8px;font-family:'Courier New',monospace;font-size:12px;
                 border:none;resize:none;background:#fff;color:#000;outline:none;
                 tab-size:2;white-space:pre;overflow:auto;"
          spellcheck="false" wrap="off" placeholder="Start typing…"></textarea>
      </div>
      <div class="warp-statusbar" id="editor-sb">Ln 1, Col 1  |  0 chars  |  0 words</div>`;
    document.getElementById('desktop').appendChild(w);

    const area = document.getElementById('editor-area');
    const saved = localStorage.getItem(STORE);
    if (saved) area.value = saved;

    area.addEventListener('input',  editorStat);
    area.addEventListener('keyup',  editorStat);
    area.addEventListener('click',  editorStat);
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
  }

  function editorKeys(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const a = e.target, s = a.selectionStart, en = a.selectionEnd;
      a.value = a.value.substring(0, s) + '  ' + a.value.substring(en);
      a.selectionStart = a.selectionEnd = s + 2;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); editorSave(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); editorNew(); }
    editorStat();
  }

  function editorSave() {
    const txt = document.getElementById('editor-area')?.value || '';
    localStorage.setItem(STORE, txt);
    toast('💾 Saved.');
  }

  function editorNew() {
    if (!confirm('Discard current content and start a new document?')) return;
    const area = document.getElementById('editor-area');
    if (area) { area.value = ''; editorStat(); }
    localStorage.removeItem(STORE);
    document.getElementById('editor-title').textContent = 'Text Editor — Untitled.txt';
    toast('New document.');
  }

  window.editorMenu = function (menu, e) {
    e && e.stopPropagation();
    switch (menu) {
      case 'file': toast('File  ·  New (Ctrl+N)  ·  Save (Ctrl+S)  [localStorage]'); break;
      case 'edit': toast('Edit  ·  Undo (Ctrl+Z)  ·  Cut  ·  Copy  ·  Paste  ·  Select All (Ctrl+A)'); break;
      case 'view':
        wordWrap = !wordWrap;
        const area = document.getElementById('editor-area');
        if (area) {
          area.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
          area.setAttribute('wrap', wordWrap ? 'soft' : 'off');
        }
        toast('Word Wrap: ' + (wordWrap ? 'ON' : 'OFF'));
        break;
      case 'help': toast('OS/3 Text Editor  ·  Phase 3  ·  Vivacity Design'); break;
    }
  };

  window.openEditor = function () { buildWindow(); openWindow('win-editor'); };
}());
