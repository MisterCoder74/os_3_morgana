'use strict';
/* OS/3 WebWarp — Kanban Board */
(function () {
  const STORE = 'os3_kanban';
  const COLS  = [
    { id: 'todo',  label: '📋 To Do',      color: '#CCDDFF' },
    { id: 'doing', label: '⚙️ In Progress', color: '#FFEEBB' },
    { id: 'done',  label: '✅ Done',        color: '#CCFFCC' },
  ];
  let board  = { todo: [], doing: [], done: [] };
  let nextId = 1;
  let dragged = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) { const d = JSON.parse(raw); board = d.board || board; nextId = d.nextId || 1; }
    } catch(e) {}
  }
  function save() {
    localStorage.setItem(STORE, JSON.stringify({ board, nextId }));
  }

  function buildWindow() {
    if (document.getElementById('win-kanban')) return;
    const w = document.createElement('div');
    w.id = 'win-kanban';
    w.className = 'warp-window';
    w.dataset.title = 'Kanban Board';
    w.style.cssText = 'top:60px;left:80px;width:660px;height:420px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-kanban')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-kanban')">📊</div>
        <div class="warp-title">Kanban Board</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-kanban')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-kanban')" title="Maximize">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-kanban')" title="Close">&#10005;</button>
        </div>
      </div>
      <div class="warp-menubar">
        <div class="wm-item" onclick="kanbanClearDone()">Clear Done</div>
        <div class="wm-item" onclick="kanbanExport()">Export</div>
      </div>
      <div style="flex:1;display:flex;gap:6px;padding:8px;overflow:auto;background:#BBBBBB;">
        ${COLS.map(c => `
          <div class="kb-col" id="kb-col-${c.id}" data-col="${c.id}"
               style="flex:1;min-width:170px;display:flex;flex-direction:column;gap:4px;
                      background:${c.color};padding:6px;
                      border-top:2px solid rgba(255,255,255,0.8);
                      border-left:2px solid rgba(255,255,255,0.8);
                      border-right:2px solid rgba(0,0,0,0.25);
                      border-bottom:2px solid rgba(0,0,0,0.25);"
               ondragover="kanbanDragOver(event)" ondrop="kanbanDrop(event,'${c.id}')">
            <div style="font-size:12px;font-weight:bold;margin-bottom:4px;
                        border-bottom:1px solid rgba(0,0,0,0.2);padding-bottom:3px;">
              ${c.label}
              <span id="kb-count-${c.id}" style="font-weight:normal;font-size:10px;float:right;"></span>
            </div>
            <div id="kb-cards-${c.id}" style="flex:1;display:flex;flex-direction:column;gap:3px;
                 min-height:20px;"></div>
            <button onclick="kanbanAddCard('${c.id}')" style="
              margin-top:6px;height:22px;font-size:11px;font-family:inherit;cursor:pointer;
              background:rgba(255,255,255,0.6);
              border-top:2px solid rgba(255,255,255,0.9);border-left:2px solid rgba(255,255,255,0.9);
              border-right:2px solid rgba(0,0,0,0.2);border-bottom:2px solid rgba(0,0,0,0.2);">
              + Add card
            </button>
          </div>`).join('')}
      </div>
      <div class="warp-statusbar" id="kb-sb">0 cards total</div>`;
    document.getElementById('desktop').appendChild(w);
    renderAll();
  }

  function renderAll() {
    COLS.forEach(c => {
      const container = document.getElementById('kb-cards-' + c.id);
      if (!container) return;
      container.innerHTML = '';
      (board[c.id] || []).forEach(card => container.appendChild(makeCard(card, c.id)));
      const cnt = document.getElementById('kb-count-' + c.id);
      if (cnt) cnt.textContent = `(${(board[c.id]||[]).length})`;
    });
    updateSb();
  }

  function makeCard(card, colId) {
    const el = document.createElement('div');
    el.dataset.id  = card.id;
    el.dataset.col = colId;
    el.draggable   = true;
    el.style.cssText = `
      background:#fff;padding:6px 8px;font-size:11px;cursor:grab;
      border-top:2px solid #DFDFDF;border-left:2px solid #DFDFDF;
      border-right:2px solid #606060;border-bottom:2px solid #606060;
      position:relative;word-break:break-word;`;
    el.innerHTML = `
      <div contenteditable="true" class="kb-card-text"
           style="outline:none;min-height:14px;line-height:1.4;">${escHtml(card.text)}</div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;">
        <span style="font-size:10px;color:#888;">#${card.id}</span>
        <span onclick="kanbanDeleteCard(${card.id},'${colId}')" title="Delete"
              style="cursor:pointer;font-size:11px;color:#888;">✕</span>
      </div>`;
    const textEl = el.querySelector('.kb-card-text');
    textEl.addEventListener('blur', () => {
      const found = (board[colId]||[]).find(c => c.id === card.id);
      if (found) { found.text = textEl.textContent.trim(); save(); }
    });
    el.addEventListener('dragstart', e => {
      dragged = { id: card.id, col: colId };
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => el.style.opacity = '0.4', 0);
    });
    el.addEventListener('dragend', () => { el.style.opacity = '1'; dragged = null; });
    return el;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function updateSb() {
    const total = COLS.reduce((s,c) => s + (board[c.id]||[]).length, 0);
    const el = document.getElementById('kb-sb');
    if (el) el.textContent = `${total} card${total!==1?'s':''} total  ·  ` +
      COLS.map(c => `${c.label.split(' ').pop()}: ${(board[c.id]||[]).length}`).join('  ');
  }

  window.kanbanDragOver = function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  window.kanbanDrop = function (e, targetCol) {
    e.preventDefault();
    if (!dragged || dragged.col === targetCol) return;
    const srcCards = board[dragged.col] || [];
    const idx = srcCards.findIndex(c => c.id === dragged.id);
    if (idx === -1) return;
    const [card] = srcCards.splice(idx, 1);
    (board[targetCol] || []).push(card);
    save();
    renderAll();
  };

  window.kanbanAddCard = function (colId) {
    const text = prompt('Card text:');
    if (!text || !text.trim()) return;
    (board[colId] = board[colId] || []).push({ id: nextId++, text: text.trim() });
    save();
    renderAll();
  };

  window.kanbanDeleteCard = function (id, colId) {
    board[colId] = (board[colId] || []).filter(c => c.id !== id);
    save();
    renderAll();
  };

  window.kanbanClearDone = function () {
    if (!board.done?.length) { toast('No done cards to clear.'); return; }
    if (!confirm('Delete all ' + board.done.length + ' Done card(s)?')) return;
    board.done = [];
    save();
    renderAll();
    toast('Done column cleared.');
  };

  window.kanbanExport = function () {
    const lines = COLS.map(c => {
      const cards = (board[c.id]||[]).map(card => `  - ${card.text}`).join('\n') || '  (empty)';
      return c.label + '\n' + cards;
    });
    const text = '# Kanban Export\n' + new Date().toLocaleString() + '\n\n' + lines.join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kanban-export.txt';
    a.click();
    toast('📤 Kanban exported as .txt');
  };

  window.openKanban = function () { load(); buildWindow(); openWindow('win-kanban'); };
}());
