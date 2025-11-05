// ==== HUDトグルボタン（自動生成＆イベント） ==========================
function ensureHudToggleButton(){
  if (document.getElementById('hudToggle')) return document.getElementById('hudToggle');
  const styleId = 'hudToggleStyle';
  if (!document.getElementById(styleId)) {
    const st = document.createElement('style'); st.id = styleId;
    st.textContent = `
      .hud-toggle {
        position: fixed; top: 12px; right: 12px; z-index: 9999;
        padding: 6px 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,.25);
        background: rgba(12,16,28,.55); color: #fff; cursor: pointer; backdrop-filter: blur(6px);
        font: 12px/1 system-ui, Segoe UI, Meiryo, Arial;
        user-select: none;
      }
      .hud-toggle.on { box-shadow: 0 0 0 2px rgba(102,170,255,.55) inset; }
    `;
    document.head.appendChild(st);
  }
  const b = document.createElement('button');
  b.id = 'hudToggle';
  b.className = 'hud-toggle';
  b.type = 'button';
  b.textContent = 'LR HUD';
  document.body.appendChild(b);
  return b;
}
const _hudBtn = hudToggleBtn || ensureHudToggleButton();
if (_hudBtn) {
  if (hudOn) _hudBtn.classList.add('on');
  _hudBtn.onclick = async function(){
    hudOn = !hudOn;
    if (viz) viz.setHudLR(hudOn);
    _hudBtn.classList.toggle('on', hudOn);
    await window.omni.set('hud.lr', hudOn);
    showToast(hudOn ? 'LR HUD: ON' : 'LR HUD: OFF');
  };
  _hudBtn.oncontextmenu = async function(e){
    e.preventDefault();
    const order = ['top-right','bottom-right','bottom-left','top-left'];
    const idx = Math.max(0, order.indexOf(hudPos));
    hudPos = order[(idx+1)%order.length];
    if (viz && viz.setHudPos) viz.setHudPos(hudPos);
    await window.omni.set('hud.pos', hudPos);
    showToast('HUD位置: '+hudPos);
  };
}

