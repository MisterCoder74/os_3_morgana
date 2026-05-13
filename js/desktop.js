/* ============================================================
   OS/3 WebWarp — Morgana — desktop.js
   Workplace Shell (WPS) emulation
   ============================================================ */

'use strict';

// --- State ---
let zCounter    = 100;
let activeDrag  = null;
let dragOffX    = 0, dragOffY = 0;
let sysMenuTarget = null;
const pulseEls  = [];

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  startClock();
  initPulse();
  placeDesktopIcons();

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);
  document.addEventListener('mousedown', onGlobalMouseDown);
});

/* ============================================================
   AUTH & SESSION
   ============================================================ */
async function checkAuth() {
  try {
    const res  = await fetch('backend/me.php', { credentials: 'same-origin' });
    const data = await res.json();
    if (!data.ok) { window.location.href = 'login.php'; return; }
    // Populate WarpCenter with username
    const uEl = document.getElementById('wc-username');
    if (uEl) uEl.textContent = '👤 ' + (data.user?.username || '');
  } catch(e) {
    window.location.href = 'login.php';
  }
}

async function doLogout() {
  try {
    await fetch('backend/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
      credentials: 'same-origin'
    });
  } catch(e) {}
  window.location.href = 'login.php';
}

/* ============================================================
   CLOCK
   ============================================================ */
function startClock() {
  const el = document.getElementById('wc-clock');
  const tick = () => {
    const n  = new Date();
    const hh = String(n.getHours()).padStart(2, '0');
    const mm = String(n.getMinutes()).padStart(2, '0');
    const ss = String(n.getSeconds()).padStart(2, '0');
    el.textContent = `${hh}:${mm}:${ss}`;
  };
  tick();
  setInterval(tick, 1000);
}

/* ============================================================
   CPU PULSE (fake meter)
   ============================================================ */
function initPulse() {
  const container = document.getElementById('wc-pulse');
  if (!container) return;
  for (let i = 0; i < 8; i++) {
    const bar = document.createElement('div');
    bar.className = 'pulse-bar';
    bar.style.height = '2px';
    container.appendChild(bar);
    pulseEls.push(bar);
  }
  setInterval(() => {
    pulseEls.forEach(b => {
      const h = Math.floor(Math.random() * 16) + 2;
      b.style.height = h + 'px';
    });
  }, 180);
}

/* ============================================================
   DESKTOP ICON PLACEMENT
   Right-column layout, top-to-bottom, right-to-left
   ============================================================ */
function placeDesktopIcons() {
  const icons  = document.querySelectorAll('.desktop-icon');
  const icoH   = 82;
  const icoW   = 80;
  const margin = 8;
  const maxRows = Math.floor((window.innerHeight - 40 - margin) / icoH);

  icons.forEach((icon, i) => {
    const row = i % maxRows;
    const col = Math.floor(i / maxRows);
    const x   = window.innerWidth - icoW - margin - col * (icoW + 6);
    const y   = margin + row * icoH;
    icon.style.left = x + 'px';
    icon.style.top  = y + 'px';
  });
}

/* ============================================================
   WINDOW MANAGEMENT
   ============================================================ */
function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add('open');
  win.classList.remove('inactive');
  win.dataset.visited = 'true';
  bringToFront(win);
  updateTaskbar();
  closeSysMenu();
}

function hideWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove('open');
  win.dispatchEvent(new CustomEvent('warp-close'));
  updateTaskbar();
  closeSysMenu();
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove('open');
  delete win.dataset.visited;
  win.dispatchEvent(new CustomEvent('warp-close'));
  updateTaskbar();
  closeSysMenu();
}

function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove('open');
  updateTaskbar();
  closeSysMenu();
}

function maximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  if (win.classList.contains('maximized')) {
    win.classList.remove('maximized');
    if (win.dataset.prevTop) {
      win.style.top    = win.dataset.prevTop;
      win.style.left   = win.dataset.prevLeft;
      win.style.width  = win.dataset.prevWidth;
      win.style.height = win.dataset.prevHeight;
    }
  } else {
    win.dataset.prevTop    = win.style.top;
    win.dataset.prevLeft   = win.style.left;
    win.dataset.prevWidth  = win.style.width;
    win.dataset.prevHeight = win.style.height;
    win.classList.add('maximized');
  }
  bringToFront(win);
  closeSysMenu();
}

function bringToFront(win) {
  document.querySelectorAll('.warp-window.open').forEach(w => {
    if (w !== win) w.classList.add('inactive');
  });
  win.classList.remove('inactive');
  zCounter++;
  win.style.zIndex = zCounter;
  updateTaskbar();
}

function onGlobalMouseDown(e) {
  const win = e.target.closest('.warp-window');
  if (win && win.classList.contains('open')) {
    bringToFront(win);
  }
  if (!e.target.closest('#sys-menu') && !e.target.classList.contains('warp-sysmenu') && !e.target.closest('#wc-sys-menu') && !e.target.classList.contains('wc-system-btn')) {
    closeSysMenu();
  }
}

/* ============================================================
   TASKBAR (WarpCenter window list)
   ============================================================ */
function updateTaskbar() {
  const container = document.getElementById('wc-windows');
  if (!container) return;
  container.innerHTML = '';

  document.querySelectorAll('.warp-window').forEach(win => {
    if (win.dataset.visited !== 'true') return;
    const isOpen   = win.classList.contains('open');
    const isActive = isOpen && !win.classList.contains('inactive');
    const title    = win.dataset.title || win.id;

    const btn = document.createElement('button');
    btn.className = 'wc-win-btn' + (isActive ? ' active-win' : '');
    btn.textContent = title;
    btn.title = title;

    btn.addEventListener('click', () => {
      if (!isOpen) {
        openWindow(win.id);
      } else if (isActive) {
        minimizeWindow(win.id);
      } else {
        bringToFront(win);
        win.classList.add('open');
        updateTaskbar();
      }
    });

    container.appendChild(btn);
  });
}

/* ============================================================
   DRAG
   ============================================================ */
function startDrag(e, id) {
  if (e.target.closest('.warp-controls') || e.target.classList.contains('warp-sysmenu')) return;
  const win = document.getElementById(id);
  if (win.classList.contains('maximized')) return;
  bringToFront(win);
  activeDrag = win;
  const rect = win.getBoundingClientRect();
  dragOffX = e.clientX - rect.left;
  dragOffY = e.clientY - rect.top;
  e.preventDefault();
}

function onMouseMove(e) {
  if (!activeDrag) return;
  let x = e.clientX - dragOffX;
  let y = e.clientY - dragOffY;
  x = Math.max(0, Math.min(window.innerWidth  - 60, x));
  y = Math.max(40, Math.min(window.innerHeight - 22, y));
  activeDrag.style.left = x + 'px';
  activeDrag.style.top  = y + 'px';
}

function onMouseUp() { activeDrag = null; }

/* ============================================================
   SYSTEM CONTEXT MENU
   ============================================================ */
function showSysMenu(e, id) {
  e.stopPropagation();
  sysMenuTarget = id;
  const menu = document.getElementById('sys-menu');
  menu.classList.add('open');
  const rect = e.target.getBoundingClientRect();
  let x = rect.left;
  let y = rect.bottom + 2;
  if (x + 150 > window.innerWidth)  x = window.innerWidth - 155;
  if (y + 160 > window.innerHeight) y = rect.top - 162;
  menu.style.left   = x + 'px';
  menu.style.top    = y + 'px';
  menu.style.zIndex = zCounter + 1;
}

function closeSysMenu() {
  const m1 = document.getElementById('sys-menu');
  if (m1) m1.classList.remove('open');
  const m2 = document.getElementById('wc-sys-menu');
  if (m2) m2.classList.remove('open');
  sysMenuTarget = null;
}

function restoreWin()  {
  if (!sysMenuTarget) return;
  const win = document.getElementById(sysMenuTarget);
  win.classList.remove('maximized');
  openWindow(sysMenuTarget);
  closeSysMenu();
}
function moveWin()     { closeSysMenu(); toast('Drag the title bar to move the window.'); }
function sizeWin()     { closeSysMenu(); toast('Drag the window edge to resize.'); }
function minimizeSys() { if (sysMenuTarget) minimizeWindow(sysMenuTarget); closeSysMenu(); }
function maximizeSys() { if (sysMenuTarget) maximizeWindow(sysMenuTarget); closeSysMenu(); }
function hideSys()     { if (sysMenuTarget) hideWindow(sysMenuTarget);     closeSysMenu(); }
function closeSys()    { if (sysMenuTarget) closeWindow(sysMenuTarget);    closeSysMenu(); }

/* ============================================================
   WARPCENTER SYSTEM BUTTON
   ============================================================ */
function toggleSystemMenu(btn) {
  const menu = document.getElementById('wc-sys-menu');
  if (menu.classList.contains('open')) {
    menu.classList.remove('open');
  } else {
    menu.classList.add('open');
    const rect = btn.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top  = rect.bottom + 'px';
    menu.style.zIndex = 10000;
  }
}

/* ============================================================
   SHREDDER
   ============================================================ */
function shred() {
  toast('\u26A0\uFE0F Shredder permanently destroys objects. Drop files here to delete.');
}

/* ============================================================
   APP NOT READY PLACEHOLDER
   ============================================================ */
function appNotReady(name) {
  toast(`\u23F3 ${name} \u2014 Not yet installed. Coming in a future phase.`);
}

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */
let toastTimer = null;
function toast(msg, ms = 3500) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
