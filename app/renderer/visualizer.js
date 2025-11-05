// ==== Visualizer attach（ユーザー操作後） ============================
let viz = null;
const vizConfig = {
  mode:'barsPro', alpha:0.95, hPct:22, bars:72, caps:true, grad:'accent', quant:2,
  autoColor:true, waterfall:false, hiVis:false,
  anchor:'bottom', bottomPadPx:0, mirror:false, grid:false, labels:false,
  smooth:0.78 // NEW: アナライザのスムージング
};

function applyVizConfig(){
  if(!viz) return;
  viz.setMode(vizConfig.mode);
  viz.setOpacity(vizConfig.alpha);
  viz.setHeightPct(vizConfig.hPct);
  viz.setBars(vizConfig.bars);
  viz.setCaps(vizConfig.caps);
  viz.setGradient(vizConfig.grad);
  viz.setQuantize(vizConfig.quant);
  viz.setWaterfall(vizConfig.waterfall);
  viz.setHiVis(vizConfig.hiVis);
  viz.setAnchor(vizConfig.anchor);
  viz.setBottomPad(vizConfig.bottomPadPx);
  viz.setMirror(vizConfig.mirror);
  viz.setGrid(vizConfig.grid);
  viz.setLabels(vizConfig.labels);
  viz.setSmoothing(vizConfig.smooth);
}

function attachVisualizersAfterUnlock(){
  if (viz) return;
  if (!window.__omni_ac) return;
  viz = Spectrum.attach(video, overlaySpec, panelSpec, {
    mode:vizConfig.mode, alpha:vizConfig.alpha, heightPct: vizConfig.hPct, bars:vizConfig.bars,
    caps:vizConfig.caps, grad:vizConfig.grad, quant:vizConfig.quant, autoColor:vizConfig.autoColor,
    waterfall:vizConfig.waterfall, hiVis:vizConfig.hiVis, anchor:vizConfig.anchor, bottomPadPx:vizConfig.bottomPadPx,
    mirror:vizConfig.mirror, grid:vizConfig.grid, labels:vizConfig.labels, smooth:vizConfig.smooth,
    // HUD 初期状態を渡す
    hudLR: hudOn, hudPos: hudPos
  });
  if (overlaySpec) overlaySpec.style.opacity = String(vizConfig.alpha);
  applyVizConfig();
  (async function(){
    const vol = await window.omni.get('volume', 1);
    if (viz && viz.setOutputGain) viz.setOutputGain(vol);
    if (autoGainEnableEl && viz && viz.setAutoGain) viz.setAutoGain(!!autoGainEnableEl.checked);
    // ステレオ幅/モノ 初期反映
    const w = await window.omni.get('audio.width', 1.0);
    const m = await window.omni.get('audio.mono', false);
    viz.setStereoWidth(w); if (m) viz.setMono(true);

    // HUD 反映（保険）
    viz.setHudLR(hudOn);
    viz.setHudPos(hudPos);
  })();
}
