'use strict';
/* OS/3 WebWarp — Reversi Game */
(function () {
  let board = [];
  let currentPlayer = 1; // 1 = Black, 2 = White
  const EMPTY = 0, BLACK = 1, WHITE = 2;

  function buildWindow() {
    if (document.getElementById('win-reversi')) return;
    const w = document.createElement('div');
    w.id = 'win-reversi';
    w.className = 'warp-window';
    w.dataset.title = 'Reversi';
    w.style.cssText = 'top:120px;left:300px;width:340px;height:auto;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-reversi')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-reversi')">⚽</div>
        <div class="warp-title">Reversi</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-reversi')">&#9660;</button>
          <button class="wbtn" onclick="hideWindow('win-reversi')">&#10005;</button>
        </div>
      </div>
      <div class="warp-menubar">
        <span class="wm-item" id="reversi-new-game">New Game</span>
      </div>
      <div style="padding:10px;background:#006600;display:flex;justify-content:center;">
        <div id="reversi-board" style="display:grid;grid-template-columns:repeat(8, 36px);grid-template-rows:repeat(8, 36px);gap:1px;background:#000;border:1px solid #000;"></div>
      </div>
      <div class="warp-statusbar" id="reversi-status">Black's turn</div>
    `;
    document.getElementById('desktop').appendChild(w);
    document.getElementById('reversi-new-game').onclick = initGame;
    initGame();
  }

  function initGame() {
    board = Array(8).fill(0).map(() => Array(8).fill(EMPTY));
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
    currentPlayer = BLACK;
    renderBoard();
    updateStatus();
  }

  function renderBoard() {
    const grid = document.getElementById('reversi-board');
    if (!grid) return;
    grid.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.style.cssText = 'width:36px;height:36px;background:#008800;display:flex;align-items:center;justify-content:center;cursor:pointer;';
        cell.onclick = () => handleMove(r, c);
        
        if (board[r][c] !== EMPTY) {
          const piece = document.createElement('div');
          piece.style.cssText = `width:28px;height:28px;border-radius:50%;background:${board[r][c] === BLACK ? '#000' : '#fff'};box-shadow: 1px 1px 2px rgba(0,0,0,0.5);`;
          cell.appendChild(piece);
        } else if (isValidMove(r, c, currentPlayer)) {
            cell.style.background = '#009900';
        }
        
        grid.appendChild(cell);
      }
    }
  }

  function isValidMove(r, c, player) {
    if (board[r][c] !== EMPTY) return false;
    const opponent = player === BLACK ? WHITE : BLACK;
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (let [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === opponent) {
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          nr += dr; nc += dc;
          if (!(nr >= 0 && nr < 8 && nc >= 0 && nc < 8)) break;
          if (board[nr][nc] === EMPTY) break;
          if (board[nr][nc] === player) return true;
        }
      }
    }
    return false;
  }

  function handleMove(r, c) {
    if (currentPlayer !== BLACK) return;
    if (!isValidMove(r, c, BLACK)) return;
    makeMove(r, c, BLACK);
    currentPlayer = WHITE;
    renderBoard();
    updateStatus();
    if (hasAnyValidMove(WHITE)) {
        setTimeout(computerMove, 600);
    } else {
        currentPlayer = BLACK;
        if (!hasAnyValidMove(BLACK)) {
            updateStatus(true);
        } else {
            toast("White has no moves, your turn again");
            renderBoard();
            updateStatus();
        }
    }
  }

  function makeMove(r, c, player) {
    board[r][c] = player;
    const opponent = player === BLACK ? WHITE : BLACK;
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (let [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      let cellsToFlip = [];
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === opponent) {
        cellsToFlip.push([nr, nc]);
        nr += dr; nc += dc;
      }
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === player) {
        for (let [fr, fc] of cellsToFlip) board[fr][fc] = player;
      }
    }
  }

  function computerMove() {
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isValidMove(r, c, WHITE)) moves.push({r, c});
      }
    }
    if (moves.length > 0) {
      const move = moves[Math.floor(Math.random() * moves.length)];
      makeMove(move.r, move.c, WHITE);
    }
    
    currentPlayer = BLACK;
    if (!hasAnyValidMove(BLACK)) {
        currentPlayer = WHITE;
        if (hasAnyValidMove(WHITE)) {
            toast("Black has no moves, White moves again");
            setTimeout(computerMove, 600);
        } else {
            updateStatus(true);
            return;
        }
    }

    renderBoard();
    updateStatus();
  }

  function hasAnyValidMove(player) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isValidMove(r, c, player)) return true;
      }
    }
    return false;
  }

  function updateStatus(isEnd = false) {
    const bCount = board.flat().filter(x => x === BLACK).length;
    const wCount = board.flat().filter(x => x === WHITE).length;
    const statusEl = document.getElementById('reversi-status');
    if (!statusEl) return;
    if (isEnd || (!hasAnyValidMove(BLACK) && !hasAnyValidMove(WHITE))) {
        let winner = bCount > wCount ? "Black Wins!" : wCount > bCount ? "White Wins!" : "Draw!";
        statusEl.textContent = `Game Over. ${winner} (${bCount}-${wCount})`;
        return;
    }
    statusEl.textContent = `${currentPlayer === BLACK ? "Black's" : "White's"} turn. Score: B:${bCount} W:${wCount}`;
  }

  window.openReversi = function () { buildWindow(); openWindow('win-reversi'); };
}());
