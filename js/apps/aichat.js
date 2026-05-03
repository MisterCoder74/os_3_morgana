'use strict';
/* OS/3 WebWarp — BotType AI Chat (OpenAI) */
(function () {
  const MODELS  = ['gpt-4o-mini','gpt-4o','gpt-3.5-turbo'];
  const STORE   = 'os3_ai_history';
  const SYSTEM  = 'You are a helpful assistant running inside OS/3 WebWarp, a retro OS/2-themed web desktop. Be concise and helpful.';

  let history   = [];
  let streaming = false;
  let selModel  = 'gpt-4o-mini';

  function loadHistory() {
    try { history = JSON.parse(localStorage.getItem(STORE) || '[]'); } catch(e) { history = []; }
  }
  function saveHistory() {
    localStorage.setItem(STORE, JSON.stringify(history.slice(-60)));
  }

  function buildWindow() {
    if (document.getElementById('win-aichat')) return;
    loadHistory();
    const w = document.createElement('div');
    w.id = 'win-aichat';
    w.className = 'warp-window';
    w.dataset.title = 'AI Chat';
    w.style.cssText = 'top:70px;left:80px;width:480px;height:420px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-aichat')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-aichat')">🤖</div>
        <div class="warp-title">BotType AI Chat</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-aichat')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-aichat')" title="Maximize">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-aichat')" title="Close">&#10005;</button>
        </div>
      </div>
      <div class="warp-menubar">
        <div class="wm-item" onclick="aiChatClear()">New Chat</div>
        <select id="ai-model-sel" onchange="selModel=this.value" style="
          font-size:11px;font-family:inherit;background:#CCCCCC;border:none;
          border-top:2px solid #606060;border-left:2px solid #606060;
          border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
          padding:0 4px;height:20px;cursor:pointer;margin:2px;">
          ${MODELS.map(m=>`<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
      <div id="ai-messages" style="
        flex:1;overflow-y:auto;padding:8px;background:#FAFAFA;
        border-top:2px solid #606060;border-left:2px solid #606060;
        border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
        display:flex;flex-direction:column;gap:6px;
        font-size:12px;line-height:1.5;"></div>
      <div style="display:flex;gap:4px;padding:6px;background:#CCCCCC;">
        <textarea id="ai-input" rows="2" style="
          flex:1;font-size:12px;font-family:inherit;padding:4px;resize:none;
          border-top:2px solid #606060;border-left:2px solid #606060;
          border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
          background:#fff;outline:none;" placeholder="Type a message… (Enter to send, Shift+Enter for newline)"></textarea>
        <button id="ai-send-btn" onclick="aiChatSend()" style="
          width:60px;font-size:12px;font-family:inherit;cursor:pointer;
          background:#000080;color:#fff;
          border-top:2px solid #4040CC;border-left:2px solid #4040CC;
          border-right:2px solid #000040;border-bottom:2px solid #000040;">Send</button>
      </div>
      <div class="warp-statusbar" id="ai-sb">Ready. Model: gpt-4o-mini</div>`;
    document.getElementById('desktop').appendChild(w);

    const inp = document.getElementById('ai-input');
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); aiChatSend(); }
    });

    // Render existing history
    history.filter(m=>m.role!=='system').forEach(m => appendMessage(m.role, m.content));
    scrollMessages();
  }

  function appendMessage(role, text) {
    const box = document.getElementById('ai-messages');
    if (!box) return;
    const el = document.createElement('div');
    const isUser = role === 'user';
    el.style.cssText = `
      padding:6px 10px;max-width:85%;word-break:break-word;white-space:pre-wrap;
      align-self:${isUser ? 'flex-end' : 'flex-start'};
      background:${isUser ? '#000080' : '#FFFFFF'};
      color:${isUser ? '#FFFFFF' : '#000000'};
      border-top:2px solid ${isUser ? '#4040CC' : '#DFDFDF'};
      border-left:2px solid ${isUser ? '#4040CC' : '#DFDFDF'};
      border-right:2px solid ${isUser ? '#000040' : '#606060'};
      border-bottom:2px solid ${isUser ? '#000040' : '#606060'};
      font-size:12px;`;
    el.textContent = text;
    box.appendChild(el);
    return el;
  }

  function scrollMessages() {
    const box = document.getElementById('ai-messages');
    if (box) box.scrollTop = box.scrollHeight;
  }

  window.aiChatSend = async function () {
    if (streaming) return;
    const inp = document.getElementById('ai-input');
    const txt = inp.value.trim();
    if (!txt) return;

    inp.value = '';
    appendMessage('user', txt);
    scrollMessages();

    history.push({ role: 'user', content: txt });

    const model = document.getElementById('ai-model-sel')?.value || selModel;
    const btn   = document.getElementById('ai-send-btn');
    const sb    = document.getElementById('ai-sb');

    streaming = true;
    if (btn) btn.disabled = true;
    if (sb)  sb.textContent = 'Waiting for response…';

    // Placeholder assistant bubble (will fill in)
    const box   = document.getElementById('ai-messages');
    const aEl   = appendMessage('assistant', '…');
    scrollMessages();

    try {
      const res = await fetch('backend/ai/chat.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          model,
          messages: [{ role:'system', content: SYSTEM }, ...history.slice(-20)],
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        aEl.textContent = '⚠️ ' + (data.error || 'Error.');
        aEl.style.background = '#FFCCCC';
      } else {
        aEl.textContent = data.text;
        history.push({ role: 'assistant', content: data.text });
        saveHistory();
        const usage = data.usage;
        if (sb && usage) sb.textContent = `Model: ${model}  ·  Tokens: ${usage.total_tokens}`;
        else if (sb)     sb.textContent = `Model: ${model}`;
      }
    } catch (err) {
      aEl.textContent = '⚠️ Network error: ' + err.message;
      aEl.style.background = '#FFCCCC';
    } finally {
      streaming = false;
      if (btn) btn.disabled = false;
      scrollMessages();
    }
  };

  window.aiChatClear = function () {
    history = [];
    saveHistory();
    const box = document.getElementById('ai-messages');
    if (box) box.innerHTML = '';
    toast('🤖 New chat started.');
  };

  window.openAiChat = function () { buildWindow(); openWindow('win-aichat'); };
}());
