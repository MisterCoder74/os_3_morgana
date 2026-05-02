'use strict';
/* OS/3 WebWarp — GitHub Viewer */
(function () {

  function buildWindow() {
    if (document.getElementById('win-github')) return;
    const w = document.createElement('div');
    w.id = 'win-github';
    w.className = 'warp-window';
    w.dataset.title = 'GitHub Viewer';
    w.style.cssText = 'top:80px;left:100px;width:560px;height:430px;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-github')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-github')">🐙</div>
        <div class="warp-title">GitHub Viewer</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-github')" title="Minimize">&#9472;</button>
          <button class="wbtn" onclick="maximizeWindow('win-github')" title="Maximize">&#9633;</button>
          <button class="wbtn" onclick="hideWindow('win-github')" title="Close">&#10005;</button>
        </div>
      </div>
      <div style="display:flex;gap:4px;padding:6px;background:#CCCCCC;align-items:center;">
        <span style="font-size:12px;">Repo:</span>
        <input id="gh-repo-input" type="text" placeholder="owner/repo — e.g. MisterCoder74/os_3_morgana"
          style="flex:1;height:22px;font-size:12px;padding:0 4px;font-family:inherit;
                 border-top:2px solid #606060;border-left:2px solid #606060;
                 border-right:2px solid #DFDFDF;border-bottom:2px solid #DFDFDF;
                 background:#fff;outline:none;"
          value="MisterCoder74/os_3_morgana"
          onkeydown="if(event.key==='Enter')ghFetch()">
        <button onclick="ghFetch()" style="
          height:24px;padding:0 10px;font-size:12px;font-family:inherit;cursor:pointer;
          background:#000080;color:#fff;
          border-top:2px solid #4040CC;border-left:2px solid #4040CC;
          border-right:2px solid #000040;border-bottom:2px solid #000040;">Go</button>
      </div>
      <div style="flex:1;display:flex;gap:0;overflow:hidden;">
        <!-- File tree -->
        <div id="gh-tree" style="
          width:200px;min-width:160px;overflow-y:auto;background:#EEEEEE;padding:4px;
          border-right:2px solid #606060;font-size:11px;"></div>
        <!-- File/README content -->
        <div id="gh-content" style="
          flex:1;overflow:auto;padding:8px;background:#FFFFFF;
          font-family:'Courier New',monospace;font-size:11px;
          white-space:pre-wrap;word-break:break-word;color:#000;"></div>
      </div>
      <div class="warp-statusbar" id="gh-sb">Enter a repo slug and press Go.</div>`;
    document.getElementById('desktop').appendChild(w);
    // Load default repo
    setTimeout(ghFetch, 300);
  }

  window.ghFetch = async function () {
    const slug = (document.getElementById('gh-repo-input')?.value || '').trim();
    if (!slug || !slug.includes('/')) { toast('Format: owner/repo'); return; }
    const sb    = document.getElementById('gh-sb');
    const tree  = document.getElementById('gh-tree');
    const cont  = document.getElementById('gh-content');
    if (sb)    sb.textContent = 'Loading…';
    if (tree)  tree.innerHTML = '<div style="color:#555;padding:4px;">Loading…</div>';
    if (cont)  cont.textContent = '';

    try {
      const [repoRes, contentsRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${slug}`, { headers: { Accept: 'application/vnd.github.v3+json' } }),
        fetch(`https://api.github.com/repos/${slug}/contents`, { headers: { Accept: 'application/vnd.github.v3+json' } }),
      ]);
      const repo     = await repoRes.json();
      const contents = await contentsRes.json();

      if (repo.message) { if(sb) sb.textContent = repo.message; return; }

      // Header info
      if (cont) {
        const lang = repo.language || 'N/A';
        const stars = (repo.stargazers_count||0).toLocaleString();
        const forks = (repo.forks_count||0).toLocaleString();
        cont.textContent =
          `📦 ${repo.full_name}\n` +
          `${repo.description || '(no description)'}\n\n` +
          `⭐ ${stars} stars  🍴 ${forks} forks  🔤 ${lang}\n` +
          `🔗 ${repo.html_url}\n\n` +
          `Select a file on the left to view its content.`;
      }

      // Build tree
      if (tree && Array.isArray(contents)) {
        tree.innerHTML = '';
        // Sort: dirs first, then files
        contents.sort((a,b) => {
          if (a.type===b.type) return a.name.localeCompare(b.name);
          return a.type==='dir' ? -1 : 1;
        }).forEach(item => {
          const el = document.createElement('div');
          const icon = item.type === 'dir' ? '📁' : ghFileIcon(item.name);
          el.innerHTML = `${icon} ${item.name}`;
          el.style.cssText = 'padding:2px 4px;cursor:pointer;border-radius:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          el.title = item.name;
          el.addEventListener('click', () => ghViewFile(slug, item));
          el.addEventListener('mouseover', () => el.style.background = '#D0D0FF');
          el.addEventListener('mouseout',  () => el.style.background = '');
          tree.appendChild(el);
        });
      }
      if (sb) sb.textContent = `${repo.full_name}  ·  ${repo.default_branch}  ·  ${(repo.size||0).toLocaleString()} KB`;

      // Auto-load README
      const readme = Array.isArray(contents) && contents.find(f => /^readme/i.test(f.name));
      if (readme) ghViewFile(slug, readme);

    } catch (err) {
      if (sb) sb.textContent = 'Error: ' + err.message;
    }
  };

  function ghFileIcon(name) {
    const ext = name.split('.').pop().toLowerCase();
    const map = { js:'📜', ts:'📜', py:'🐍', php:'🐘', html:'🌐', css:'🎨',
                  md:'📖', json:'📋', txt:'📄', sh:'⚙️', yml:'⚙️', yaml:'⚙️',
                  png:'🖼', jpg:'🖼', gif:'🖼', svg:'🖼', pdf:'📕' };
    return map[ext] || '📄';
  }

  window.ghViewFile = async function (slug, item) {
    const cont = document.getElementById('gh-content');
    const sb   = document.getElementById('gh-sb');
    if (!cont) return;

    if (item.type === 'dir') {
      if (sb) sb.textContent = `Browsing ${item.path}…`;
      cont.textContent = `📁 Directory: ${item.path}\n\n(Click files in the tree to view.)`;
      return;
    }

    const imgExts = ['png','jpg','jpeg','gif','svg','webp','bmp'];
    const ext = item.name.split('.').pop().toLowerCase();

    if (imgExts.includes(ext)) {
      cont.innerHTML = `<div style="text-align:center;padding:20px;">
        <img src="${item.download_url}" style="max-width:100%;max-height:300px;
        border:2px solid #999;"/><br>
        <span style="font-size:11px;color:#555;">${item.name}</span></div>`;
      return;
    }

    if (item.size > 500000) { cont.textContent = '(File too large to preview — open on GitHub)'; return; }

    if (sb) sb.textContent = `Loading ${item.name}…`;
    try {
      let text;
      if (item.name.toLowerCase().startsWith('readme')) {
        // Render markdown as-is (plain text)
        const res  = await fetch(item.download_url);
        text = await res.text();
      } else {
        const res  = await fetch(item.download_url);
        text = await res.text();
      }
      cont.textContent = text;
      if (sb) sb.textContent = item.path + '  ·  ' + (item.size||0).toLocaleString() + ' bytes';
    } catch(e) {
      cont.textContent = 'Error loading file.';
    }
  };

  window.openGithubViewer = function () { buildWindow(); openWindow('win-github'); };
}());
