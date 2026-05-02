'use strict';
/* OS/3 WebWarp — Sticky Notes */
(function () {
  const STORE  = 'os3_stickynotes';
  const COLORS = ['#FFFF99','#99CCFF','#99FF99','#FFB3BA','#FFFFFF'];
  const CLABEL = ['Yellow','Blue','Green','Pink','White'];
  let   notes  = [];
  let   nextId = 1;

  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) { const d = JSON.parse(raw); notes = d.notes || []; nextId = d.nextId || 1; }
    } catch(e) {}
  }
  function save() {
    localStorage.setItem(STORE, JSON.stringify({ notes, nextId }));
  }

  function buildManagerWindow() {
    if (document.getElementById('win-notes')) return;
    const w = document.createElement('div');
    w.id = 'win-notes';
    w.className = 'warp-window';
    w.dataset.title = 'Sticky Notes';
    w.style.cssText = 'top:90px;left:130px;width:220px;height:auto;resize:none;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-notes')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-notes')">📌</div>
        <div class="warp-title">Sticky Notes</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-notes')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="hideWindow('win-notes')" title="Close">&#10005;</button>
        </div>
      </div>
      <div style="padding:10px;">
        <div style="font-size:12px;margin-bottom:8px;">Create a new note:</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;" id="color-picker"></div>
        <button onclick="stickyNew()" style="
          width:100%;height:26px;font-size:12px;font-family:inherit;cursor:pointer;
          background:#CCCCCC;border-top:2px solid #DFDFDF;border-left:2px solid #DFDFDF;
          border-right:2px solid #606060;border-bottom:2px solid #606060;">
          + New Note
        </button>
        <hr style="border:none;border-top:1px solid #999;margin:10px 0;">
        <div style="font-size:11px;color:#555;" id="notes-count">0 notes</div>
      </div>
      <div class="warp-statusbar">Click a colour then "New Note"</div>`;
    document.getElementById('desktop').appendChild(w);
    buildColorPicker();
    restoreNotes();
    updateCount();
  }

  let selectedColor = 0;
  function buildColorPicker() {
    const cp = document.getElementById('color-picker');
    if (!cp) return;
    COLORS.forEach((c, i) => {
      const swatch = document.createElement('div');
      swatch.style.cssText = `width:28px;height:22px;background:${c};cursor:pointer;
        border:2px solid ${i===selectedColor ? '#000080' : '#888'};`;
      swatch.title = CLABEL[i];
      swatch.dataset.idx = i;
      swatch.addEventListener('click', () => {
        selectedColor = i;
        document.querySelectorAll('#color-picker div').forEach((s,j) => {
          s.style.borderColor = j===i ? '#000080' : '#888';
        });
      });
      cp.appendChild(swatch);
    });
  }

  function updateCount() {
    const el = document.getElementById('notes-count');
    if (el) el.textContent = notes.length + ' note' + (notes.length !== 1 ? 's' : '');
  }

  function restoreNotes() {
    notes.forEach(n => renderNote(n));
  }

  function renderNote(n) {
    if (document.getElementById('note-' + n.id)) return;
    const el = document.createElement('div');
    el.id = 'note-' + n.id;
    el.style.cssText = `
      position:absolute;top:${n.top}px;left:${n.left}px;
      width:${n.width || 180}px;min-height:100px;
      background:${n.color};z-index:200;
      border-top:2px solid rgba(255,255,255,0.8);
      border-left:2px solid rgba(255,255,255,0.8);
      border-right:2px solid rgba(0,0,0,0.3);
      border-bottom:2px solid rgba(0,0,0,0.3);
      display:flex;flex-direction:column;resize:both;overflow:hidden;`;
    el.innerHTML = `
      <div style="height:20px;background:rgba(0,0,0,0.12);display:flex;align-items:center;
                  padding:0 4px;cursor:move;font-size:11px;font-weight:bold;justify-content:space-between;"
           data-note-id="${n.id}" class="note-header">
        <span>📌 Note #${n.id}</span>
        <span onclick="stickyDelete(${n.id})" style="cursor:pointer;font-size:13px;" title="Delete">✕</span>
      </div>
      <textarea data-note-id="${n.id}" class="note-area" style="
        flex:1;background:transparent;border:none;resize:none;
        padding:6px;font-family:inherit;font-size:12px;outline:none;
        min-height:80px;">${n.text || ''}</textarea>`;
    const header = el.querySelector('.note-header');
    header.addEventListener('mousedown', e => noteDrag(e, n.id));
    const area = el.querySelector('.note-area');
    area.addEventListener('input', () => {
      const found = notes.find(x => x.id === n.id);
      if (found) { found.text = area.value; save(); }
    });
    document.getElementById('desktop').appendChild(el);
  }

  function noteDrag(e, id) {
    e.preventDefault();
    const el  = document.getElementById('note-' + id);
    const rect = el.getBoundingClientRect();
    const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
    function mv(ev) {
      let x = ev.clientX - ox, y = ev.clientY - oy;
      x = Math.max(0, Math.min(window.innerWidth-80,  x));
      y = Math.max(40, Math.min(window.innerHeight-40, y));
      el.style.left = x + 'px'; el.style.top = y + 'px';
      const n = notes.find(n => n.id === id);
      if (n) { n.left = x; n.top = y; }
    }
    function up() {
      save();
      document.removeEventListener('mousemove', mv);
      document.removeEventListener('mouseup', up);
    }
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', up);
  }

  window.stickyNew = function (colorIdx) {
    const ci = colorIdx !== undefined ? colorIdx : selectedColor;
    const n = {
      id:    nextId++,
      color: COLORS[ci],
      text:  '',
      top:   120 + Math.random() * 100,
      left:  200 + Math.random() * 200,
      width: 180,
    };
    notes.push(n);
    save();
    renderNote(n);
    updateCount();
    toast('📌 New note created.');
  };

  window.stickyDelete = function (id) {
    notes = notes.filter(n => n.id !== id);
    save();
    const el = document.getElementById('note-' + id);
    if (el) el.remove();
    updateCount();
    toast('Note deleted.');
  };

  window.openStickyNotes = function () { load(); buildManagerWindow(); openWindow('win-notes'); };
}());
