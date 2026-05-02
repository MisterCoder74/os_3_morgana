'use strict';
/* OS/3 WebWarp — Image Generator (DALL-E) */
(function () {

  function buildWindow() {
    if (document.getElementById('win-imggen')) return;
    const w = document.createElement('div');
    w.id = 'win-imggen';
    w.className = 'warp-window';
    w.dataset.title = 'Image Generator';
    w.style.cssText = 'top:80px;left:100px;width:480px;height:440px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-imggen')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-imggen')">✨</div>
        <div class="warp-title">Image Generator (DALL-E)</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-imggen')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-imggen')" title="Maximize">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-imggen')" title="Close">&#10005;</button>
        </div>
      </div>
      <div style="padding:8px;background:#CCCCCC;display:flex;flex-direction:column;gap:6px;">
        <textarea id="img-prompt" rows="3" style="
          font-size:12px;font-family:inherit;padding:6px;resize:none;
          border-top:2px solid #606060;border-left:2px solid #606060;
          border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
          background:#fff;outline:none;" placeholder="Describe the image you want to generate…"></textarea>
        <div style="display:flex;gap:8px;align-items:center;">
          <label style="font-size:12px;">Model:</label>
          <select id="img-model" style="height:22px;font-size:11px;font-family:inherit;
            border-top:2px solid #606060;border-left:2px solid #606060;
            border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;background:#CCCCCC;">
            <option value="dall-e-3">DALL-E 3</option>
            <option value="dall-e-2">DALL-E 2</option>
          </select>
          <label style="font-size:12px;">Size:</label>
          <select id="img-size" style="height:22px;font-size:11px;font-family:inherit;
            border-top:2px solid #606060;border-left:2px solid #606060;
            border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;background:#CCCCCC;">
            <option value="1024x1024">1024×1024</option>
            <option value="512x512">512×512</option>
            <option value="1792x1024">1792×1024 (wide)</option>
            <option value="1024x1792">1024×1792 (tall)</option>
          </select>
          <button id="img-gen-btn" onclick="imgGenerate()" style="
            height:26px;padding:0 16px;font-size:12px;font-family:inherit;cursor:pointer;
            background:#000080;color:#fff;margin-left:auto;
            border-top:2px solid #4040CC;border-left:2px solid #4040CC;
            border-right:2px solid #000040;border-bottom:2px solid #000040;">Generate ✨</button>
        </div>
      </div>
      <div id="img-result" style="
        flex:1;background:#111;display:flex;align-items:center;justify-content:center;
        overflow:auto;color:#888;font-size:12px;text-align:center;padding:8px;">
        Generated image will appear here.
      </div>
      <div class="warp-statusbar" id="img-sb">Ready. Configure API key in System Setup → API Keys.</div>`;
    document.getElementById('desktop').appendChild(w);
  }

  window.imgGenerate = async function () {
    const prompt = document.getElementById('img-prompt')?.value?.trim();
    const model  = document.getElementById('img-model')?.value  || 'dall-e-3';
    const size   = document.getElementById('img-size')?.value   || '1024x1024';
    const btn    = document.getElementById('img-gen-btn');
    const result = document.getElementById('img-result');
    const sb     = document.getElementById('img-sb');

    if (!prompt) { toast('Please enter a prompt.'); return; }
    if (btn)     btn.disabled = true;
    if (result)  result.innerHTML = '<div style="color:#888;animation:pulse 1s infinite;">🎨 Generating…<br><small>This can take 10–20 seconds</small></div>';
    if (sb)      sb.textContent = 'Generating image…';

    try {
      const res  = await fetch('backend/ai/image.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ prompt, model, size }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (result) result.innerHTML = `<div style="color:#FF6666;padding:12px;">⚠️ ${escHtml(data.error || 'Error')}</div>`;
        if (sb)     sb.textContent = 'Error: ' + (data.error || 'Unknown error');
      } else {
        if (result) result.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px;">
            <img src="${data.url}" style="max-width:100%;max-height:280px;
              border:2px solid #444;cursor:pointer;" title="Click to open full size"
              onclick="window.open('${data.url}','_blank')">
            <div style="font-size:10px;color:#AAA;max-width:90%;word-break:break-word;">
              ${escHtml(data.revised_prompt || prompt)}
            </div>
            <a href="${data.url}" download="image.png" target="_blank"
               style="color:#88BBFF;font-size:11px;">⬇ Download</a>
          </div>`;
        if (sb) sb.textContent = `Generated with ${model} (${size})`;
      }
    } catch (err) {
      if (result) result.innerHTML = `<div style="color:#FF6666;">⚠️ Network error: ${err.message}</div>`;
      if (sb)     sb.textContent = 'Error: ' + err.message;
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  function escHtml(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  window.openImageGen = function () { buildWindow(); openWindow('win-imggen'); };
}());
