'use strict';
/* OS/3 WebWarp — Calculator App */
(function () {
  let calc = { expr: '', display: '0', mem: 0, lastOp: false, error: false };

  const BTN_LAYOUT = [
    ['MC','MR','M+','M–'],
    ['C','±','%','÷'],
    ['7','8','9','×'],
    ['4','5','6','–'],
    ['1','2','3','+'],
    ['0',  '.','⌫','='],
  ];
  const WIDE = { '0': true };

  function buildWindow() {
    if (document.getElementById('win-calc')) return;
    const w = document.createElement('div');
    w.id = 'win-calc';
    w.className = 'warp-window';
    w.dataset.title = 'Calculator';
    w.style.cssText = 'top:100px;left:620px;width:228px;height:auto;resize:none;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-calc')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-calc')">🧮</div>
        <div class="warp-title">Calculator</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-calc')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="hideWindow('win-calc')" title="Close">&#10005;</button>
        </div>
      </div>
      <div style="padding:6px;background:#ccc;">
        <div id="calc-hist" style="height:16px;font-size:10px;color:#555;text-align:right;
             overflow:hidden;padding:0 4px;font-family:'Courier New',monospace;">&nbsp;</div>
        <div id="calc-disp" style="
          background:#000;color:#00FF00;font-family:'Courier New',monospace;
          font-size:22px;text-align:right;padding:4px 8px;letter-spacing:1px;
          border-top:2px solid #404040;border-left:2px solid #404040;
          border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
          min-height:36px;word-break:break-all;">0</div>
        <div id="calc-btns" style="display:grid;gap:3px;margin-top:6px;
             grid-template-columns:repeat(4,1fr);"></div>
      </div>
      <div class="warp-statusbar" id="calc-mem-sb">MEM: 0</div>`;
    document.getElementById('desktop').appendChild(w);
    renderButtons();
    document.addEventListener('keydown', calcKeydown);
  }

  function renderButtons() {
    const grid = document.getElementById('calc-btns');
    grid.innerHTML = '';
    BTN_LAYOUT.forEach(row => {
      row.forEach(lbl => {
        const btn = document.createElement('button');
        btn.textContent = lbl;
        btn.dataset.op = lbl;
        if (WIDE[lbl]) btn.style.gridColumn = 'span 2';
        const isOp  = ['÷','×','–','+','='].includes(lbl);
        const isMem = ['MC','MR','M+','M–'].includes(lbl);
        const isDel = lbl === '⌫';
        btn.style.cssText = `
          height:36px;padding:0;font-size:13px;font-family:inherit;cursor:pointer;
          background:${isOp ? '#000080' : isMem ? '#666' : '#CCCCCC'};
          color:${(isOp||isMem) ? '#fff' : '#000'};
          border-top:2px solid ${(isOp||isMem) ? '#4040CC' : '#DFDFDF'};
          border-left:2px solid ${(isOp||isMem) ? '#4040CC' : '#DFDFDF'};
          border-right:2px solid ${(isOp||isMem) ? '#000040' : '#606060'};
          border-bottom:2px solid ${(isOp||isMem) ? '#000040' : '#606060'};`;
        btn.addEventListener('mousedown', e => { e.stopPropagation(); calcInput(lbl); });
        btn.addEventListener('mousedown', () => {
          btn.style.borderTop    = `2px solid ${(isOp||isMem) ? '#000040' : '#606060'}`;
          btn.style.borderLeft   = `2px solid ${(isOp||isMem) ? '#000040' : '#606060'}`;
          btn.style.borderRight  = `2px solid ${(isOp||isMem) ? '#4040CC' : '#DFDFDF'}`;
          btn.style.borderBottom = `2px solid ${(isOp||isMem) ? '#4040CC' : '#DFDFDF'}`;
        });
        btn.addEventListener('mouseup', () => {
          btn.style.borderTop    = `2px solid ${(isOp||isMem) ? '#4040CC' : '#DFDFDF'}`;
          btn.style.borderLeft   = `2px solid ${(isOp||isMem) ? '#4040CC' : '#DFDFDF'}`;
          btn.style.borderRight  = `2px solid ${(isOp||isMem) ? '#000040' : '#606060'}`;
          btn.style.borderBottom = `2px solid ${(isOp||isMem) ? '#000040' : '#606060'}`;
        });
        grid.appendChild(btn);
      });
    });
  }

  function calcInput(lbl) {
    const c = calc;
    if (c.error && lbl !== 'C') return;

    switch (lbl) {
      case 'C':  c.expr = ''; c.display = '0'; c.lastOp = false; c.error = false; break;
      case '⌫':
        if (!c.lastOp && c.display !== '0') {
          c.display = c.display.length > 1 ? c.display.slice(0,-1) : '0';
        }
        break;
      case '±':
        if (c.display !== '0') c.display = c.display.startsWith('-') ? c.display.slice(1) : '-'+c.display;
        break;
      case '%':
        if (!isNaN(parseFloat(c.display))) c.display = String(parseFloat(c.display) / 100);
        break;
      case 'MC': c.mem = 0; updateMemSb(); break;
      case 'MR': c.display = String(c.mem); c.lastOp = false; break;
      case 'M+': c.mem += parseFloat(c.display) || 0; updateMemSb(); break;
      case 'M–': c.mem -= parseFloat(c.display) || 0; updateMemSb(); break;
      case '.':
        if (c.lastOp) { c.display = '0.'; c.lastOp = false; return updateDisp(); }
        if (!c.display.includes('.')) c.display += '.';
        break;
      case '=':
        try {
          const expr = (c.expr + c.display)
            .replace(/÷/g,'/').replace(/×/g,'*').replace(/–/g,'-');
          document.getElementById('calc-hist').textContent = c.expr + c.display + ' =';
          const result = Function('"use strict"; return (' + expr + ')')();
          if (!isFinite(result)) throw new Error('Division by zero');
          c.display = parseFloat(result.toPrecision(12)).toString();
          c.expr = ''; c.lastOp = true;
        } catch(err) {
          c.display = 'Error'; c.error = true;
        }
        break;
      default:
        if ('÷×–+'.includes(lbl)) {
          if (!c.lastOp) c.expr += c.display;
          c.expr += lbl; c.lastOp = true;
        } else {
          if (c.lastOp || c.display === '0') { c.display = lbl; c.lastOp = false; }
          else c.display += lbl;
        }
    }
    updateDisp();
  }

  function updateDisp() {
    const el = document.getElementById('calc-disp');
    if (el) el.textContent = calc.display;
  }
  function updateMemSb() {
    const el = document.getElementById('calc-mem-sb');
    if (el) el.textContent = 'MEM: ' + calc.mem;
  }

  function calcKeydown(e) {
    const win = document.getElementById('win-calc');
    if (!win || !win.classList.contains('open')) return;
    const map = {
      '0':'0','1':'1','2':'2','3':'3','4':'4',
      '5':'5','6':'6','7':'7','8':'8','9':'9',
      '/':'÷','*':'×','-':'–','+'  :'+','.':'.',
      'Backspace':'⌫','Escape':'C','Enter':'=','='  :'=',
    };
    if (map[e.key]) { e.preventDefault(); calcInput(map[e.key]); }
  }

  window.openCalculator = function () { buildWindow(); openWindow('win-calc'); };
}());
