'use strict';
/* OS/3 WebWarp — HTML Editor App */
(function () {
  const STORE = 'os3_htmleditor_content';
  let currentFile = null;
  let livePreview = true;
  let previewTimer = null;

  function setTitle(name) {
    currentFile = name || null;
    const el = document.getElementById('htmled-title');
    if (el) el.textContent = 'HTML Editor — ' + (name || 'Untitled.html');
  }

  function getCode() {
    const ta = document.getElementById('htmled-code');
    return ta ? ta.value : '';
  }

  function refreshPreview() {
    const iframe = document.getElementById('htmled-preview');
    if (!iframe || !livePreview) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(getCode());
      doc.close();
    } catch (err) {
      console.warn('HTML Editor preview error:', err);
    }
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 600);
    // Auto-save to localStorage
    const code = getCode();
    localStorage.setItem(STORE, code);
    updateStats();
  }

  function updateStats() {
    const code  = getCode();
    const lines = code.split('\n').length;
    const chars = code.length;
    const el    = document.getElementById('htmled-sb');
    if (el) el.textContent = `${lines.toLocaleString()} lines  |  ${chars.toLocaleString()} chars`;
  }

  function buildWindow() {
    if (document.getElementById('win-htmleditor')) return;

    const w = document.createElement('div');
    w.id = 'win-htmleditor';
    w.className = 'warp-window';
    w.dataset.title = 'HTML Editor';
    w.style.cssText = 'top:80px;left:100px;width:780px;height:500px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-htmleditor')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-htmleditor')">🌐</div>
        <div class="warp-title" id="htmled-title">HTML Editor — Untitled.html</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-htmleditor')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-htmleditor')" title="Maximize">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-htmleditor')" title="Close">&#10005;</button>
        </div>
      </div>
      <div class="warp-menubar">
        <div class="wm-item" onmousedown="htmledMenu('file',event)">File</div>
        <div class="wm-item" onmousedown="htmledMenu('edit',event)">Edit</div>
        <div class="wm-item" onmousedown="htmledMenu('view',event)">View</div>
        <div class="wm-item" onmousedown="htmledMenu('insert',event)">Insert</div>
        <div class="wm-item" onmousedown="htmledMenu('help',event)">Help</div>
      </div>
      <!-- Toolbar -->
      <div style="display:flex;gap:4px;padding:3px 6px;background:#BBBBBB;
                  border-bottom:1px solid #999;flex-shrink:0;flex-wrap:wrap;">
        <button class="tb-btn" onclick="htmledNew()"      title="New document">📄 New</button>
        <button class="tb-btn" onclick="htmledOpen()"     title="Open HTML file">📂 Open</button>
        <button class="tb-btn" onclick="htmledSave()"     title="Save">💾 Save</button>
        <button class="tb-btn" onclick="htmledSaveAs()"   title="Save As…">💾 Save As…</button>
        <div style="width:1px;background:#999;margin:1px 2px;"></div>
        <button class="tb-btn" onclick="htmledRefresh()"  title="Refresh Preview">🔄 Preview</button>
        <button class="tb-btn" id="htmled-live-btn"
                onclick="htmledToggleLive()"              title="Toggle live preview">⚡ Live: ON</button>
        <div style="width:1px;background:#999;margin:1px 2px;"></div>
        <button class="tb-btn" onclick="htmledTemplate('basic')"   title="Insert basic template">📋 Template</button>
        <button class="tb-btn" onclick="htmledCopyAll()"           title="Copy all">📋 Copy</button>
      </div>
      <!-- Split pane: code | preview -->
      <div style="flex:1;display:flex;overflow:hidden;min-height:0;">
        <!-- Code pane -->
        <div style="flex:1;display:flex;flex-direction:column;border-right:2px solid #999;min-width:0;">
          <div style="background:#1e1e2e;color:#cdd6f4;font-size:10px;padding:2px 6px;flex-shrink:0;">
            📝 HTML Source
          </div>
          <textarea id="htmled-code"
            style="flex:1;padding:8px;font-family:'Courier New',monospace;font-size:12px;
                   border:none;resize:none;background:#1e1e2e;color:#cdd6f4;outline:none;
                   tab-size:2;white-space:pre;overflow:auto;line-height:1.5;"
            spellcheck="false" wrap="off"
            placeholder="Type HTML here…"></textarea>
        </div>
        <!-- Preview pane -->
        <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
          <div style="background:#AAAAAA;color:#000;font-size:10px;padding:2px 6px;flex-shrink:0;">
            🌐 Preview
          </div>
          <iframe id="htmled-preview"
            sandbox="allow-scripts allow-same-origin"
            style="flex:1;border:none;background:#fff;"></iframe>
        </div>
      </div>
      <div class="warp-statusbar" id="htmled-sb">1 lines  |  0 chars</div>`;

    document.getElementById('desktop').appendChild(w);

    const code = document.getElementById('htmled-code');
    const saved = localStorage.getItem(STORE);
    if (saved) { code.value = saved; }

    code.addEventListener('input',   schedulePreview);
    code.addEventListener('keydown', htmledKeys);
    updateStats();
    refreshPreview();
  }

  function htmledKeys(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const a = e.target, s = a.selectionStart, en = a.selectionEnd;
      a.value = a.value.substring(0, s) + '  ' + a.value.substring(en);
      a.selectionStart = a.selectionEnd = s + 2;
      schedulePreview();
    }
  }

  /* ── Commands ─────────────────────────────────────────────────────── */
  function htmledNew() {
    if (!confirm('Discard current content and start a new document?')) return;
    const code = document.getElementById('htmled-code');
    if (code) { code.value = ''; }
    localStorage.removeItem(STORE);
    setTitle(null);
    refreshPreview();
    updateStats();
    toast('New HTML document.');
  }

  function htmledOpen() {
    fileDialogOpen('*.html;*.htm', function (name, content) {
      const code = document.getElementById('htmled-code');
      if (code) { code.value = content; }
      setTitle(name);
      updateStats();
      refreshPreview();
      toast('📂 Opened: ' + name);
    });
  }

  function htmledSave() {
    const content = getCode();
    if (currentFile) {
      fileSave(currentFile, content, name => setTitle(name));
    } else {
      htmledSaveAs();
    }
  }

  function htmledSaveAs() {
    const content   = getCode();
    const suggested = currentFile || 'page.html';
    fileDialogSaveAs(suggested, content, function (name) {
      setTitle(name);
    });
  }

  function htmledRefresh() {
    clearTimeout(previewTimer);
    refreshPreview();
    toast('🔄 Preview refreshed.');
  }

  function htmledToggleLive() {
    livePreview = !livePreview;
    const btn = document.getElementById('htmled-live-btn');
    if (btn) btn.textContent = '⚡ Live: ' + (livePreview ? 'ON' : 'OFF');
    if (livePreview) refreshPreview();
    toast('Live preview: ' + (livePreview ? 'ON' : 'OFF'));
  }

  function htmledCopyAll() {
    const code = document.getElementById('htmled-code');
    if (!code || !code.value) { toast('Nothing to copy.'); return; }
    navigator.clipboard.writeText(code.value).then(() => toast('📋 Copied.'));
  }

  function htmledTemplate(type) {
    const code = document.getElementById('htmled-code');
    if (!code) return;
    if (code.value && !confirm('Replace current content with template?')) return;
    const tpl = {
      basic: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      background: #f5f5f5;
      color: #333;
    }
    h1 { color: #000080; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello, World!</h1>
    <p>Start editing this template to build your page.</p>
  </div>
</body>
</html>`
    };
    code.value = tpl[type] || '';
    setTitle(null);
    updateStats();
    refreshPreview();
  }

  /* ── Insert snippets ─────────────────────────────────────────────── */
  function insertSnippet(snippet) {
    const ta = document.getElementById('htmled-code');
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.substring(0, s) + snippet + ta.value.substring(e);
    ta.selectionStart = ta.selectionEnd = s + snippet.length;
    ta.focus();
    schedulePreview();
  }

  /* ── Menus ───────────────────────────────────────────────────────── */
  window.htmledMenu = function (menu, ev) {
    ev && ev.stopPropagation();
    switch (menu) {
      case 'file':
        toast('File: 📄 New  ·  📂 Open  ·  💾 Save  ·  💾 Save As…');
        break;
      case 'edit':
        toast('Edit: Undo (Ctrl+Z)  ·  Cut  ·  Copy  ·  Paste  ·  Select All');
        break;
      case 'view':
        htmledToggleLive();
        break;
      case 'insert':
        const snippets = [
          '<div class=""></div>',
          '<p></p>',
          '<a href="#">Link</a>',
          '<img src="" alt="">',
          '<ul>\n  <li></li>\n</ul>',
          '<table>\n  <tr><td></td></tr>\n</table>',
        ];
        const choice = prompt('Insert snippet (1-6):\n1. <div>\n2. <p>\n3. <a>\n4. <img>\n5. <ul>\n6. <table>');
        const idx = parseInt(choice) - 1;
        if (idx >= 0 && idx < snippets.length) insertSnippet(snippets[idx]);
        break;
      case 'help':
        toast('OS/3 HTML Editor — Live preview · Save As to server · Vivacity Design');
        break;
    }
  };

  /* ── Public exports ──────────────────────────────────────────────── */
  window.htmledNew      = htmledNew;
  window.htmledOpen     = htmledOpen;
  window.htmledSave     = htmledSave;
  window.htmledSaveAs   = htmledSaveAs;
  window.htmledRefresh  = htmledRefresh;
  window.htmledToggleLive = htmledToggleLive;
  window.htmledCopyAll  = htmledCopyAll;
  window.htmledTemplate = htmledTemplate;

  /* Open with pre-loaded content (from File Manager) */
  window.htmledOpenFile = function (name, content) {
    buildWindow();
    openWindow('win-htmleditor');
    const code = document.getElementById('htmled-code');
    if (code) { code.value = content; }
    setTitle(name);
    updateStats();
    refreshPreview();
  };

  window.openHtmlEditor = function () { buildWindow(); openWindow('win-htmleditor'); };
}());
