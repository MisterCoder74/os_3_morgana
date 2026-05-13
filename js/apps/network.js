'use strict';
/* OS/3 WebWarp — Network Settings */
(function () {
  function buildWindow() {
    if (document.getElementById('win-network')) return;
    const w = document.createElement('div');
    w.id = 'win-network';
    w.className = 'warp-window';
    w.dataset.title = 'Network';
    w.style.cssText = 'top:180px;left:380px;width:320px;height:auto;';
    w.innerHTML = `
      <div class="warp-titlebar" onmousedown="startDrag(event,'win-network')">
        <div class="warp-sysmenu" onclick="showSysMenu(event,'win-network')">🌐</div>
        <div class="warp-title">Network</div>
        <div class="warp-controls">
          <button class="wbtn" onclick="minimizeWindow('win-network')">&#9660;</button>
          <button class="wbtn" onclick="hideWindow('win-network')">&#10005;</button>
        </div>
      </div>
      <div style="padding:15px;background:#ccc;">
        <div style="background:#fff;border:1px solid #888;padding:10px;font-family:monospace;font-size:12px;margin-bottom:15px;">
            <p>TCP/IP Interface: eth0</p>
            <p>IP Address: 192.168.1.42</p>
            <p>Subnet Mask: 255.255.255.0</p>
            <p>Gateway: 192.168.1.1</p>
            <p>Status: <span style="color:green;font-weight:bold;">CONNECTED</span></p>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button class="os2-btn" id="net-ping-btn">Ping Server</button>
          <button class="os2-btn" onclick="toast('Network configuration saved.')">Save</button>
        </div>
      </div>
      <div class="warp-statusbar">IBM TCP/IP Stack v4.1</div>
    `;
    document.getElementById('desktop').appendChild(w);
    document.getElementById('net-ping-btn').onclick = ping;
  }

  function ping() {
    toast('Pinging server...');
    setTimeout(() => {
        const lat = Math.floor(Math.random() * 50) + 10;
        toast(`Reply from 10.0.2.15: time=${lat}ms TTL=64`);
    }, 1200);
  }

  window.openNetworkSettings = function () { buildWindow(); openWindow('win-network'); };
}());
