'use strict';
/* OS/3 WebWarp — Spreadsheet App */
(function () {
  let currentFile = null;
  let rows = 20;
  let cols = 10;
  let data = {}; // stores cell values/formulas

  function setTitle(name) {
    currentFile = name || null;
    const el = document.getElementById('spreadsheet-title');
    if (el) el.textContent = 'Spreadsheet — ' + (name || 'Untitled.csv');
  }

  function buildWindow() {
    if (document.getElementById('win-spreadsheet')) return;
    const w = document.createElement('div');
    w.id = 'win-spreadsheet';
    w.className = 'warp-window';
    w.dataset.title = 'Spreadsheet';
    w.style.cssText = 'top:80px;left:80px;width:640px;height:480px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-spreadsheet')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-spreadsheet')">📊</div>
        <div class="warp-title" id="spreadsheet-title">Spreadsheet — Untitled.csv</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-spreadsheet')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-spreadsheet')" title="Maximize">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-spreadsheet')" title="Close">&#10005;</button>
        </div>
      </div>
      <div class="warp-menubar">
        <div class="wm-item" onmousedown="spreadsheetMenu('file',event)">File</div>
        <div class="wm-item" onmousedown="spreadsheetMenu('edit',event)">Edit</div>
        <div class="wm-item" onmousedown="spreadsheetMenu('help',event)">Help</div>
      </div>
      <div class="spreadsheet-toolbar">
        <button class="tb-btn" onclick="spreadsheetNew()" title="New document">📄 New</button>
        <button class="tb-btn" onclick="spreadsheetOpen()" title="Open from server">📂 Open</button>
        <button class="tb-btn" onclick="spreadsheetSave()" title="Quick-save (overwrite)">💾 Save</button>
        <button class="tb-btn" onclick="spreadsheetSaveAs()" title="Save As…">💾 Save As…</button>
        <div class="tb-divider"></div>
        <button class="tb-btn" onclick="spreadsheetAddRow()" title="Add Row">+ Row</button>
        <button class="tb-btn" onclick="spreadsheetAddCol()" title="Add Column">+ Col</button>
      </div>
      <div class="spreadsheet-formula-bar">
        <div id="spreadsheet-cell-ref">A1</div>
        <input type="text" id="spreadsheet-formula-input" readonly>
      </div>
      <div class="spreadsheet-grid-container" id="spreadsheet-grid-container">
        <!-- Table will be generated here -->
      </div>
      <div class="warp-statusbar" id="spreadsheet-sb">Ready</div>`;

    if (!document.getElementById('ss-styles')) {
      const s = document.createElement('style');
      s.id = 'ss-styles';
      s.textContent = `
        .spreadsheet-toolbar { display:flex; gap:4px; padding:3px 6px; background:#BBBBBB; border-bottom:1px solid #999; flex-shrink:0; flex-wrap:wrap; }
        .spreadsheet-formula-bar { display:flex; gap:2px; padding:2px 4px; background:#EEEEEE; border-bottom:1px solid #999; align-items:center; flex-shrink:0; }
        #spreadsheet-cell-ref { width:45px; text-align:center; font-weight:bold; border-right:1px solid #999; font-size:11px; font-family:sans-serif; }
        #spreadsheet-formula-input { flex:1; border:none; background:transparent; font-family:monospace; font-size:12px; outline:none; padding:0 6px; color:#333; }
        .spreadsheet-grid-container { flex:1; overflow:auto; background:#FFFFFF; position:relative; }
        .ss-table { border-collapse: collapse; table-layout: fixed; }
        .ss-table th { background:#CCCCCC; border:1px solid #999; font-size:11px; font-weight:normal; position:sticky; top:0; z-index:10; height:20px; }
        .ss-table th.ss-row-header { position:sticky; left:0; z-index:11; width:35px; text-align:center; background:#CCCCCC; }
        .ss-table td { border:1px solid #DDDDDD; padding:0; height:22px; width:80px; }
        .ss-cell { width:100%; height:100%; border:none; outline:none; padding:0 4px; font-size:12px; font-family:sans-serif; background:transparent; }
        .ss-cell:focus { background:#E8F0FE; outline:1px solid #4D90FE; z-index:5; position:relative; }
        .tb-divider { width:1px; background:#999; margin:1px 2px; }
        .tb-btn { height:22px; padding:0 7px; font-size:11px; font-family:inherit; cursor:pointer; background:#CCCCCC; white-space:nowrap;
                  border-top:2px solid #DFDFDF; border-left:2px solid #DFDFDF; border-right:2px solid #606060; border-bottom:2px solid #606060; }
        .tb-btn:active { border-top:2px solid #606060; border-left:2px solid #606060; border-right:2px solid #DFDFDF; border-bottom:2px solid #DFDFDF; }
      `;
      document.head.appendChild(s);
    }

    document.getElementById('desktop').appendChild(w);
    initGrid();
  }

  function initGrid() {
    const container = document.getElementById('spreadsheet-grid-container');
    if (!container) return;

    let html = '<table class="ss-table">';
    // Header Row
    html += '<thead><tr><th class="ss-row-header"></th>';
    for (let c = 0; c < cols; c++) {
      html += `<th style="width:80px;">${getColName(c)}</th>`;
    }
    html += '</tr></thead><tbody>';

    // Data Rows
    for (let r = 0; r < rows; r++) {
      html += `<tr><th class="ss-row-header">${r + 1}</th>`;
      for (let c = 0; c < cols; c++) {
        const ref = getColName(c) + (r + 1);
        html += `<td><input type="text" class="ss-cell" id="cell-${ref}" data-ref="${ref}" onfocus="ssFocus(this)" onblur="ssBlur(this)" onkeydown="ssKey(event, this)" spellcheck="false"></td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
    
    updateAllCells();
  }

  function getColName(n) {
    let name = '';
    while (n >= 0) {
      name = String.fromCharCode((n % 26) + 65) + name;
      n = Math.floor(n / 26) - 1;
    }
    return name;
  }
  
  function getColIndex(name) {
    let index = 0;
    for (let i = 0; i < name.length; i++) {
        index = index * 26 + (name.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  function parseRef(ref) {
      const match = ref.match(/^([A-Z]+)([0-9]+)$/i);
      if (!match) return null;
      return {
          col: getColIndex(match[1].toUpperCase()),
          row: parseInt(match[2], 10) - 1
      };
  }

  window.ssFocus = function(el) {
    const ref = el.dataset.ref;
    document.getElementById('spreadsheet-cell-ref').textContent = ref;
    const formulaInput = document.getElementById('spreadsheet-formula-input');
    const val = data[ref] || '';
    formulaInput.value = val;
    el.value = val;
  };

  window.ssBlur = function(el) {
    const ref = el.dataset.ref;
    data[ref] = el.value;
    updateAllCells();
  };
  
  window.ssKey = function(e, el) {
      if (e.key === 'Enter') {
          el.blur();
          const ref = parseRef(el.dataset.ref);
          if (ref && ref.row < rows - 1) {
              const nextRef = getColName(ref.col) + (ref.row + 2);
              const nextEl = document.getElementById('cell-' + nextRef);
              if (nextEl) nextEl.focus();
          }
      }
  };

  function updateAllCells() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ref = getColName(c) + (r + 1);
        const el = document.getElementById('cell-' + ref);
        if (el && document.activeElement !== el) {
            el.value = evaluateCell(ref);
        }
      }
    }
  }

  function evaluateCell(ref) {
    const val = data[ref] || '';
    if (val.startsWith('=')) {
      return evaluateFormula(val);
    }
    return val;
  }

  function evaluateFormula(formula) {
    try {
      const sumMatch = formula.match(/^=SUM\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)$/i);
      if (sumMatch) {
        return calculateRange(sumMatch[1], sumMatch[2], 'SUM');
      }
      const avgMatch = formula.match(/^=AVG\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)$/i);
      if (avgMatch) {
        return calculateRange(avgMatch[1], avgMatch[2], 'AVG');
      }
      return '#ERROR!';
    } catch (e) {
      return '#ERR';
    }
  }

  function calculateRange(startRef, endRef, type) {
    const start = parseRef(startRef);
    const end = parseRef(endRef);
    if (!start || !end) return '#REF!';

    let sum = 0;
    let count = 0;
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const ref = getColName(c) + (r + 1);
        const val = parseFloat(data[ref]);
        if (!isNaN(val)) {
          sum += val;
          count++;
        }
      }
    }

    if (type === 'SUM') return sum;
    if (type === 'AVG') return count > 0 ? (sum / count).toFixed(2).replace(/\.?0+$/, '') : 0;
    return 0;
  }

  window.spreadsheetNew = function() {
    if (!confirm('Clear all data and start a new spreadsheet?')) return;
    data = {};
    rows = 20;
    cols = 10;
    initGrid();
    setTitle(null);
    toast('New spreadsheet created.');
  };

  window.spreadsheetOpen = function() {
    fileDialogOpen('*.csv', function(name, content) {
      deserializeCSV(content);
      setTitle(name);
      initGrid();
      toast('📂 Opened: ' + name);
    });
  };

  window.spreadsheetSave = function() {
    if (currentFile) {
      fileSave(currentFile, serializeCSV(), name => {
          setTitle(name);
          toast('💾 Saved: ' + name);
      });
    } else {
      spreadsheetSaveAs();
    }
  };

  window.spreadsheetSaveAs = function() {
    const suggested = currentFile || 'spreadsheet.csv';
    fileDialogSaveAs(suggested, serializeCSV(), function(name) {
      setTitle(name);
      toast('💾 Saved As: ' + name);
    });
  };

  window.spreadsheetAddRow = function() {
    rows++;
    initGrid();
    toast('Row added.');
  };

  window.spreadsheetAddCol = function() {
    cols++;
    initGrid();
    toast('Column added.');
  };

  function serializeCSV() {
    let csv = '';
    for (let r = 0; r < rows; r++) {
      let rowCells = [];
      for (let c = 0; c < cols; c++) {
        const ref = getColName(c) + (r + 1);
        rowCells.push(data[ref] || '');
      }
      csv += rowCells.join(',') + '\n';
    }
    return csv;
  }

  function deserializeCSV(content) {
    data = {};
    const lines = content.trim().split('\n');
    rows = Math.max(20, lines.length);
    let maxColsFound = 10;
    lines.forEach((line, r) => {
      const cells = line.split(',');
      maxColsFound = Math.max(maxColsFound, cells.length);
      cells.forEach((val, c) => {
        if (val.trim()) {
          const ref = getColName(c) + (r + 1);
          data[ref] = val.trim();
        }
      });
    });
    cols = maxColsFound;
  }

  window.spreadsheetMenu = function (menu, e) {
    e && e.stopPropagation();
    switch (menu) {
      case 'file':
        toast('File: 📄 New  ·  📂 Open  ·  💾 Save  ·  💾 Save As…');
        break;
      case 'edit':
        toast('Edit: +Row  ·  +Col');
        break;
      case 'help':
        toast('OS/3 Spreadsheet — Codename Merlin');
        break;
    }
  };

  /* Open with a pre-loaded file (called from File Manager) */
  window.spreadsheetOpenFile = function (name, content) {
    buildWindow();
    openWindow('win-spreadsheet');
    deserializeCSV(content);
    setTitle(name);
    initGrid();
  };

  window.openSpreadsheet = function () { buildWindow(); openWindow('win-spreadsheet'); };
}());
