// ==== 設定ロード（状態定義） ==========================================
let playlist = []; let idx = -1;
let A = null, B = null;
let hls; // HLS.js
let themeRGB = [102,170,255], targetRGB = [102,170,255];
let markers = [];
let colorTimer = null;
let loopMode = 'off';
let shuffle = false;
let bounceAB = false;
let sleepTimer = null;

// スマート再生用
let baseSpeed = 1.0;
let smartSilenceSince = 0;
let lastSmartSkipAt = 0;
let smartSpeedBoosted = false;

// オーディオ拡張
let stereoWidth = 1.0;
let mono = false;

// 自動イントロ/アウトロ
let autoIntro = false;
let autoOutro = false;

// ミュート
let muted = false;
let savedUserGainForMute = 1;

// 連写スクショ
let burstTimer = null;

// HUD
let hudOn = false;
let hudPos = 'top-right';

async function loadInitialSettings(){
  LANG = await window.omni.get('lang','ja'); applyI18n();

  // 再生速度/音量
  baseSpeed = await window.omni.get('speed', 1);
  if (speedEl) speedEl.value = baseSpeed;
  video.playbackRate = Number(baseSpeed);

  // 可視化
  vizConfig.mode       = await window.omni.get('viz.mode','barsPro');
  vizConfig.alpha      = await window.omni.get('viz.alpha',0.95);
  vizConfig.hPct       = await window.omni.get('viz.hPct',22);
  vizConfig.bars       = await window.omni.get('viz.bars',72);
  vizConfig.caps       = await window.omni.get('viz.caps',true);
  vizConfig.grad       = await window.omni.get('viz.grad','accent');
  vizConfig.quant      = await window.omni.get('viz.quant',2);
  vizConfig.autoColor  = await window.omni.get('viz.autoColor',true);
  vizConfig.waterfall  = await window.omni.get('viz.waterfall', false);
  vizConfig.hiVis      = await window.omni.get('viz.hiVis', false);
  vizConfig.anchor     = await window.omni.get('viz.anchor','bottom');
  vizConfig.bottomPadPx= await window.omni.get('viz.bottomPadPx',0);
  vizConfig.mirror     = await window.omni.get('viz.mirror',false);
  vizConfig.grid       = await window.omni.get('viz.grid',false);
  vizConfig.labels     = await window.omni.get('viz.labels',false);
  vizConfig.smooth     = await window.omni.get('viz.smooth',0.78);

  // UI反映
  if (vizModeEl)   vizModeEl.value = vizConfig.mode;
  if (vizAlphaEl)  vizAlphaEl.value = vizConfig.alpha;
  if (vizHeightEl) vizHeightEl.value = vizConfig.hPct;
  if (vizBarsEl)   vizBarsEl.value = vizConfig.bars;
  if (vizCapsEl)   vizCapsEl.checked = vizConfig.caps;
  if (vizGradEl)   vizGradEl.value = vizConfig.grad;
  if (vizQuantEl)  vizQuantEl.value = vizConfig.quant;
  if (vizAutoColorEl) vizAutoColorEl.checked = vizConfig.autoColor;
  if (vizWaterfallEl) vizWaterfallEl.checked = vizConfig.waterfall;
  if (vizHiVisEl) vizHiVisEl.checked = vizConfig.hiVis;
  if (vizAnchorEl) vizAnchorEl.value = vizConfig.anchor;
  if (vizBottomEl) vizBottomEl.value = vizConfig.bottomPadPx;
  if (vizMirrorEl) vizMirrorEl.checked = vizConfig.mirror;
  if (vizGridEl)   vizGridEl.checked = vizConfig.grid;
  if (vizLabelsEl) vizLabelsEl.checked = vizConfig.labels;

  // Glow
  const glowOn = await window.omni.get('ui.glow.on', true);
  const glowLv = await window.omni.get('ui.glow.lv', 0.7);
  document.documentElement.style.setProperty('--glowAlpha', glowOn ? String(glowLv) : '0');
  if (glowEnable) glowEnable.checked = glowOn;
  if (glowLevel)  glowLevel.value    = glowLv;

  // 音質/EQ
  if (eqEnableEl){ eqEnableEl.checked = await window.omni.get('eq.enabled',true); }
  if (limiterEnableEl){ limiterEnableEl.checked = await window.omni.get('limiter.enabled',true); }
  if (autoGainEnableEl){ autoGainEnableEl.checked = await window.omni.get('autogain.enabled',false); }
  if (preampEl){ preampEl.value = await window.omni.get('eq.preamp',0); }

  // ループ
  if (loopModeEl){ loopMode = await window.omni.get('loop.mode','off'); loopModeEl.value = loopMode; }
  if (shuffleEl){ shuffle = await window.omni.get('loop.shuffle',false); shuffleEl.checked = shuffle; }
  if (bounceABEl){ bounceAB = await window.omni.get('loop.bounceAB', false); bounceABEl.checked = bounceAB; }

  // スマート
  if (smartSkipEl)  smartSkipEl.checked = await window.omni.get('smart.skip',false);
  if (smartSpeedEl) smartSpeedEl.checked = await window.omni.get('smart.speed',false);
  if (smartLevelEl) smartLevelEl.value  = await window.omni.get('smart.level',0.08);
  if (smartHoldEl)  smartHoldEl.value   = await window.omni.get('smart.hold',900);

  autoIntro = await window.omni.get('smart.autoIntro', false);
  autoOutro = await window.omni.get('smart.autoOutro', false);

  // ステレオ幅/モノ
  stereoWidth = await window.omni.get('audio.width', 1.0);
  mono        = await window.omni.get('audio.mono', false);

  // HUD設定
  hudOn  = await window.omni.get('hud.lr', false);
  hudPos = await window.omni.get('hud.pos', 'top-right');

  buildEqSliders();
  await loadEqBandsToUI();
}
