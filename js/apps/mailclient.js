'use strict';
/* OS/3 WebWarp — Mail Client */
(function () {
  const STORE = 'os3_mail';
  const SELF  = 'me@os3.local';
  let store = { inbox: [], sent: [], drafts: [], trash: [], nextId: 1 };
  let currentFolder = 'inbox';
  let currentMsg    = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) store = JSON.parse(raw);
      else seedInbox();
    } catch (e) { seedInbox(); }
  }

  function seedInbox() {
    store.inbox.push({
      id: store.nextId++, from: 'System <system@os3.local>', to: SELF,
      subject: 'Welcome to OS/3 Mail!',
      date: new Date().toLocaleString(),
      body: 'Welcome to OS/3 WebWarp Mail.\n\nThis is a local mail client — messages are stored in your browser.\nYou can compose, reply, and organise messages. Everything stays on this device.\n\nEnjoy OS/3!',
      read: false,
    });
    save();
  }

  function save() { localStorage.setItem(STORE, JSON.stringify(store)); }

  function buildWindow() {
    if (document.getElementById('win-mail')) return;
    const w = document.createElement('div');
    w.id = 'win-mail';
    w.className = 'warp-window';
    w.dataset.title = 'Mail Client';
    w.style.cssText = 'top:65px;left:90px;width:660px;height:440px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-mail')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-mail')">📧</div>
        <div class="warp-title">Mail Client</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-mail')">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-mail')">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-mail')">&#10005;</button>
        </div>
      </div>
      <div class="warp-menubar">
        <span class="wm-item" onclick="mailCompose()">✉ Compose</span>
        <span class="wm-item" onclick="mailFolder(currentMailFolder())">↺ Refresh</span>
        <span class="wm-item">Help</span>
      </div>
      <div style="flex:1;display:flex;overflow:hidden;">
        <div style="width:115px;background:#BBBBBB;border-right:2px solid #888;padding:5px;font-size:11px;flex-shrink:0;">
          <div style="font-weight:bold;font-size:10px;color:#444;margin-bottom:6px;">MAILBOXES</div>
          ${[['inbox','📥','Inbox'],['sent','📤','Sent'],['drafts','📝','Drafts'],['trash','🗑','Trash']].map(([id,ic,lb]) =>
            `<div id="mf-${id}" onclick="mailFolder('${id}')"
              style="padding:3px 5px;cursor:pointer;border-radius:2px;margin-bottom:2px;">
              ${ic} ${lb}
            </div>`).join('')}
        </div>
        <div id="mail-list" style="width:200px;background:#DDDDDD;border-right:2px solid #888;overflow-y:auto;flex-shrink:0;"></div>
        <div id="mail-view" style="flex:1;display:flex;flex-direction:column;background:#fff;overflow:hidden;">
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#999;font-size:12px;gap:8px;">
            <div style="font-size:32px">📧</div><div>Select a message</div>
          </div>
        </div>
      </div>
      <div class="warp-statusbar" id="mail-sb">Ready</div>`;
    document.getElementById('desktop').appendChild(w);
    mailFolder('inbox');
  }

  window.currentMailFolder = () => currentFolder;

  window.mailFolder = function (name) {
    currentFolder = name;
    currentMsg = null;
    ['inbox','sent','drafts','trash'].forEach(f => {
      const el = document.getElementById('mf-' + f);
      if (!el) return;
      el.style.background = f === name ? '#0000A0' : '';
      el.style.color       = f === name ? '#fff'   : '';
    });
    renderList();
    renderPlaceholder();
    const msgs   = store[name] || [];
    const unread = name === 'inbox' ? msgs.filter(m => !m.read).length : 0;
    document.getElementById('mail-sb').textContent =
      `${name[0].toUpperCase()+name.slice(1)} — ${msgs.length} message${msgs.length!==1?'s':''}` +
      (unread ? `  (${unread} unread)` : '');
  };

  function renderList() {
    const list = document.getElementById('mail-list');
    if (!list) return;
    const msgs = (store[currentFolder] || []).slice().reverse();
    if (!msgs.length) { list.innerHTML = `<div style="padding:10px;font-size:11px;color:#888;">Empty</div>`; return; }
    list.innerHTML = msgs.map(m => `
      <div onclick="mailOpen(${m.id})" style="padding:5px 6px;cursor:pointer;border-bottom:1px solid #ccc;font-size:11px;
        background:${m.id===currentMsg?.id?'#0000A0':m.read?'#fff':'#E8F0FF'};
        color:${m.id===currentMsg?.id?'#fff':'#000'};">
        <div style="font-weight:${m.read?'normal':'bold'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${currentFolder==='sent' ? m.to : m.from.replace(/<[^>]+>/,'').trim()}
        </div>
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.subject}</div>
        <div style="font-size:10px;color:${m.id===currentMsg?.id?'#ccc':'#888'}">${m.date}</div>
      </div>`).join('');
  }

  function renderPlaceholder() {
    const view = document.getElementById('mail-view');
    if (view) view.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#999;font-size:12px;gap:8px;"><div style="font-size:32px">📧</div><div>Select a message</div></div>`;
  }

  window.mailOpen = function (id) {
    const msg = (store[currentFolder]||[]).find(m => m.id === id);
    if (!msg) return;
    msg.read = true;
    currentMsg = msg;
    save();
    renderList();
    const view = document.getElementById('mail-view');
    view.innerHTML = `
      <div style="padding:8px;border-bottom:1px solid #ccc;font-size:11px;background:#EFEFEF;flex-shrink:0;">
        <div><strong>From:</strong> ${msg.from}</div>
        <div><strong>To:</strong> ${msg.to}</div>
        <div><strong>Subject:</strong> ${msg.subject}</div>
        <div><strong>Date:</strong> ${msg.date}</div>
      </div>
      <div style="display:flex;gap:4px;padding:4px 6px;background:#BBBBBB;border-bottom:1px solid #888;flex-shrink:0;">
        <button class="tb-btn" onclick="mailReply()">↩ Reply</button>
        <button class="tb-btn" onclick="mailDeleteMsg()">🗑 Delete</button>
      </div>
      <div style="flex:1;padding:10px;font-family:'Courier New',monospace;font-size:12px;white-space:pre-wrap;overflow-y:auto;">${msg.body}</div>`;
    document.getElementById('mail-sb').textContent = msg.subject;
  };

  window.mailReply = function () {
    if (!currentMsg) return;
    const q = currentMsg.body.split('\n').map(l => '> ' + l).join('\n');
    showCompose({
      to:      currentMsg.from,
      subject: currentMsg.subject.startsWith('Re:') ? currentMsg.subject : 'Re: ' + currentMsg.subject,
      body:    '\n\n' + q,
    });
  };

  window.mailDeleteMsg = function () {
    if (!currentMsg) return;
    store[currentFolder] = (store[currentFolder]||[]).filter(m => m.id !== currentMsg.id);
    if (currentFolder !== 'trash') store.trash.push({ ...currentMsg, read: true });
    currentMsg = null;
    save();
    renderPlaceholder();
    mailFolder(currentFolder);
  };

  window.mailCompose = function () { showCompose({}); };

  function showCompose({ to='', subject='', body='' } = {}) {
    currentMsg = null;
    document.getElementById('mail-view').innerHTML = `
      <div style="padding:6px 8px;border-bottom:1px solid #ccc;background:#EFEFEF;font-size:11px;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
          <label style="width:52px;text-align:right;">To:</label>
          <input id="cmp-to" value="${to}" style="flex:1;height:20px;font-size:11px;padding:0 3px;font-family:inherit;border:2px inset #aaa;">
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <label style="width:52px;text-align:right;">Subject:</label>
          <input id="cmp-subj" value="${subject}" style="flex:1;height:20px;font-size:11px;padding:0 3px;font-family:inherit;border:2px inset #aaa;">
        </div>
      </div>
      <div style="display:flex;gap:4px;padding:4px 6px;background:#BBBBBB;border-bottom:1px solid #888;flex-shrink:0;">
        <button class="tb-btn" onclick="mailSend()">📤 Send</button>
        <button class="tb-btn" onclick="mailSaveDraft()">💾 Draft</button>
        <button class="tb-btn" onclick="mailFolder('${currentFolder}')">✕ Cancel</button>
      </div>
      <textarea id="cmp-body" style="flex:1;padding:8px;font-family:'Courier New',monospace;font-size:12px;border:none;resize:none;outline:none;">${body}</textarea>`;
    document.getElementById('cmp-to').focus();
  }

  window.mailSend = function () {
    const to   = document.getElementById('cmp-to')?.value.trim();
    const subj = document.getElementById('cmp-subj')?.value.trim() || '(no subject)';
    const body = document.getElementById('cmp-body')?.value || '';
    if (!to) { toast('Enter a recipient.'); return; }
    store.sent.push({ id: store.nextId++, from: SELF, to, subject: subj, date: new Date().toLocaleString(), body, read: true });
    save();
    mailFolder('sent');
    toast('📤 Message sent.');
  };

  window.mailSaveDraft = function () {
    const to   = document.getElementById('cmp-to')?.value.trim() || '';
    const subj = document.getElementById('cmp-subj')?.value.trim() || '(no subject)';
    const body = document.getElementById('cmp-body')?.value || '';
    store.drafts.push({ id: store.nextId++, from: SELF, to, subject: subj, date: new Date().toLocaleString(), body, read: true });
    save();
    mailFolder('drafts');
    toast('💾 Draft saved.');
  };

  window.openMailClient = function () { load(); buildWindow(); openWindow('win-mail'); };
}());
