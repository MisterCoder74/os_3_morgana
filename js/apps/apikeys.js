'use strict';
/* OS/3 WebWarp — API Keys settings panel */
(function () {

  function buildWindow() {
    if (document.getElementById('win-apikeys')) return;
    const w = document.createElement('div');
    w.id = 'win-apikeys';
    w.className = 'warp-window';
    w.dataset.title = 'API Keys';
    w.style.cssText = 'top:120px;left:180px;width:380px;height:auto;resize:none;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-apikeys')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-apikeys')">🔑</div>
        <div class="warp-title">System Setup — API Keys</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="hideWindow('win-apikeys')" title="Close">&#10005;</button>
        </div>
      </div>
      <div style="padding:14px 18px 8px;">
        <div style="font-size:12px;margin-bottom:12px;color:#333;">
          API keys are stored securely in your user profile on the server.
        </div>

        <!-- OpenAI -->
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;display:block;margin-bottom:4px;font-weight:bold;">
            🤖 OpenAI API Key (GPT + DALL-E)
          </label>
          <div style="display:flex;gap:4px;">
            <input id="ak-openai" type="password" maxlength="200"
              placeholder="sk-…"
              style="flex:1;height:22px;font-size:12px;padding:0 4px;font-family:inherit;
                     border-top:2px solid #606060;border-left:2px solid #606060;
                     border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
                     background:#fff;outline:none;">
            <button onclick="akToggleVis('ak-openai',this)" style="
              height:22px;padding:0 6px;font-size:11px;font-family:inherit;cursor:pointer;
              background:#CCCCCC;
              border-top:2px solid #DFDFDF;border-left:2px solid #DFDFDF;
              border-right:2px solid #606060;border-bottom:2px solid #606060;">👁</button>
          </div>
          <div id="ak-openai-preview" style="font-size:10px;color:#666;margin-top:2px;"></div>
        </div>

        <div id="ak-error" style="color:#CC0000;font-size:11px;min-height:14px;margin-bottom:4px;"></div>

        <div style="display:flex;gap:8px;justify-content:flex-end;padding-bottom:14px;">
          <button onclick="akSave()" style="
            height:26px;min-width:80px;font-size:12px;font-family:inherit;cursor:pointer;
            background:#000080;color:#fff;
            border-top:2px solid #4040CC;border-left:2px solid #4040CC;
            border-right:2px solid #000040;border-bottom:2px solid #000040;">Save</button>
          <button onclick="akClear()" style="
            height:26px;min-width:80px;font-size:12px;font-family:inherit;cursor:pointer;
            background:#CCCCCC;
            border-top:2px solid #DFDFDF;border-left:2px solid #DFDFDF;
            border-right:2px solid #606060;border-bottom:2px solid #606060;">Clear Keys</button>
        </div>
      </div>
      <div class="warp-statusbar" id="ak-sb">Loading current key status…</div>`;
    document.getElementById('desktop').appendChild(w);
    akLoad();
  }

  async function akLoad() {
    try {
      const res  = await fetch('backend/ai/apikey.php', { credentials: 'same-origin' });
      const data = await res.json();
      const prev = document.getElementById('ak-openai-preview');
      const sb   = document.getElementById('ak-sb');
      if (data.has_key) {
        if (prev) prev.textContent = 'Current: ' + data.key_preview;
        if (sb)   sb.textContent = 'OpenAI key is configured.';
      } else {
        if (prev) prev.textContent = 'Not configured.';
        if (sb)   sb.textContent = 'No API key saved yet.';
      }
    } catch(e) { /* not logged in or server error */ }
  }

  window.akToggleVis = function (id, btn) {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁' : '🙈';
  };

  window.akSave = async function () {
    const key  = document.getElementById('ak-openai')?.value?.trim() || '';
    const errEl = document.getElementById('ak-error');
    const sb    = document.getElementById('ak-sb');
    if (key && !key.startsWith('sk-')) {
      if (errEl) errEl.textContent = 'OpenAI key should start with "sk-"'; return;
    }
    if (errEl) errEl.textContent = '';
    try {
      const res  = await fetch('backend/ai/apikey.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.ok) {
        if (sb) sb.textContent = 'Key saved successfully.';
        toast('🔑 API key saved.');
        akLoad();
      } else {
        if (errEl) errEl.textContent = data.error || 'Save failed.';
      }
    } catch(e) {
      if (errEl) errEl.textContent = 'Network error.';
    }
  };

  window.akClear = async function () {
    if (!confirm('Clear all stored API keys?')) return;
    await fetch('backend/ai/apikey.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ key: '' }),
    });
    document.getElementById('ak-openai').value = '';
    toast('🔑 Keys cleared.');
    akLoad();
  };

  window.openApiKeys = function () { buildWindow(); openWindow('win-apikeys'); };
}());
