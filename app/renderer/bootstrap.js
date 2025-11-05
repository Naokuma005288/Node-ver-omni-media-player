// ==== 背景（軽量オーロラ） ==========================================
(()=>{
  const c=document.getElementById('bg'); if(!c) return;
  const x=c.getContext('2d'); const fit=()=>{c.width=innerWidth;c.height=innerHeight}; fit(); addEventListener('resize',fit);
  let t=0;(function loop(){t+=.003;const w=c.width,h=c.height,g=x.createLinearGradient(0,0,w,h);
    g.addColorStop(0,`hsl(${(t*120)%360} 80% 55% / .22)`); g.addColorStop(1,`hsl(${(t*120+120)%360} 80% 55% / .22)`);
    x.fillStyle='#0b1020';x.fillRect(0,0,w,h);x.fillStyle=g;x.beginPath();
    x.ellipse(w*.55+Math.sin(t)*120,h*.45+Math.cos(t*.8)*90,w*.6,h*.5,0,0,Math.PI*2);x.fill();requestAnimationFrame(loop);})();
})();

// ==== polyfill for window.omni ======================================
(function ensureOmni(){
  if (!window.omni) {
    window.omni = {
      openFiles: async ()=>[],
      openSub: async ()=>null,
      revealInExplorer: async ()=>{},
      readMeta: async (ps)=> ps.map(p=>({path:p,title:p,artist:'',album:'',duration:0,cover:null})),
      get: async (_k, def)=> def,
      set: async (_k,_v)=> true,
      savePng: async (_base64)=> '',
      onMedia: function(_cb){},
      listEmbeddedSubs: async ()=>[],
      extractEmbeddedSub: async ()=>null
    };
  }
})();

// ==== Autoplay規制：ユーザー操作後にAudioContext開始 =================
let audioUnlocked = false;
async function unlockAudio(){
  try{
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!window.__omni_ac) window.__omni_ac = new AC({latencyHint:'interactive'});
    if (window.__omni_ac.state === 'suspended') await window.__omni_ac.resume();
    audioUnlocked = true;
  }catch(e){ console.warn('Audio unlock failed:', e); }
}

// ==== 要素参照 =======================================================
const video = document.getElementById('player');
const overlaySpec = document.getElementById('videoSpec');
const panelSpec   = document.getElementById('spectrum');
const titleEl     = document.getElementById('title');

const seekWrap = document.getElementById('seekWrap');
const seek     = document.getElementById('seek');
const seekWave = document.getElementById('seekWave');
const curTimeEl= document.getElementById('curTime');
const durTimeEl= document.getElementById('durTime');
const markersEl= document.getElementById('markers');

const openBtn   = document.getElementById('open');
const openUrlBtn= document.getElementById('openUrl');
const playBtn   = document.getElementById('play');
const prevBtn   = document.getElementById('prev');
const nextBtn   = document.getElementById('next');
const pipBtn    = document.getElementById('pip');
const fsBtn     = document.getElementById('fullscreen');
const fadeBtn   = document.getElementById('fade');
const shotBtn   = document.getElementById('shot');
const revealBtn = document.getElementById('reveal');

const volumeEl  = document.getElementById('volume');
const speedEl   = document.getElementById('speed');
const speedPresets = Array.prototype.slice.call(document.querySelectorAll('.speed-presets .btn'));

const ccBtn       = document.getElementById('cc');
const ccToggleBtn = document.getElementById('ccToggle');
const subAddBtn   = document.getElementById('subAdd');
const subFileEl   = document.getElementById('subFile');

const markAddBtn  = document.getElementById('markAdd');
const markImportBtn = document.getElementById('markImport');
const markExportBtn = document.getElementById('markExport');
const markFileEl  = document.getElementById('markFile');

const loopModeEl  = document.getElementById('loopMode');
const shuffleEl   = document.getElementById('shuffle');
const bounceABEl  = document.getElementById('bounceAB');

// Visualizer (基本)
const vizModeEl   = document.getElementById('vizMode');
const vizAlphaEl  = document.getElementById('vizAlpha');
const vizHeightEl = document.getElementById('vizHeight');
const vizBarsEl   = document.getElementById('vizBars');
const vizCapsEl   = document.getElementById('vizCaps');
const vizGradEl   = document.getElementById('vizGrad');
const vizQuantEl  = document.getElementById('vizQuant');
const vizAutoColorEl = document.getElementById('vizAutoColor');
const vizHiVisEl  = document.getElementById('vizHiVis');
const vizWaterfallEl = document.getElementById('vizWaterfall');

// Visualizer（追加項目：アンカー/マージン/ミラー/グリッド/ラベル/PNG）
const vizAnchorEl = document.getElementById('vizAnchor');
const vizBottomEl = document.getElementById('vizBottom');
const vizMirrorEl = document.getElementById('vizMirror');
const vizGridEl   = document.getElementById('vizGrid');
const vizLabelsEl = document.getElementById('vizLabels');
const vizExportBtn= document.getElementById('vizExport');

// EQ
const eqEnableEl      = document.getElementById('eqEnable');
const limiterEnableEl = document.getElementById('limiterEnable');
const autoGainEnableEl= document.getElementById('autoGainEnable');
const eqBandsEl = document.getElementById('eqBands');
const preampEl  = document.getElementById('preamp');

// EQプリセットボタン
const eqFlatBtn   = document.getElementById('eqFlat');
const eqBassBtn   = document.getElementById('eqBass');
const eqVocalBtn  = document.getElementById('eqVocal');
const eqTrebleBtn = document.getElementById('eqTreble');

// A/B ループ UI
const abABtn = document.getElementById('abA');
const abBBtn = document.getElementById('abB');
const abCBtn = document.getElementById('abC');

// スマート再生
const smartSkipEl  = document.getElementById('smartSkip');
const smartSpeedEl = document.getElementById('smartSpeed');
const smartLevelEl = document.getElementById('smartLevel');
const smartHoldEl  = document.getElementById('smartHold');

// その他UI
const sleepBtn = document.getElementById('sleep');
const helpBtn  = document.getElementById('help');
const helpOverlay = document.getElementById('helpOverlay');
const helpClose   = document.getElementById('helpClose');

const exportSettingsBtn = document.getElementById('exportSettings');
const importSettingsBtn = document.getElementById('importSettings');
const importSettingsFileEl = document.getElementById('importSettingsFile');

const spinner = document.getElementById('spinner');
const mpvSlot = document.getElementById('mpv-slot');
const toast   = document.getElementById('toast');

const langBtn = document.getElementById('langBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsClose = document.getElementById('settingsClose');
const settingsSave  = document.getElementById('settingsSave');
const langSelect = document.getElementById('langSelect');
const glowEnable = document.getElementById('glowEnable');
const glowLevel  = document.getElementById('glowLevel');
const hiVis2     = document.getElementById('hiVis2');
const waterfall2 = document.getElementById('waterfall2');

const gate = document.getElementById('gate');
const gateStart = document.getElementById('gateStart');

const thumbBox    = document.getElementById('thumbPreview');
const thumbCanvas = document.getElementById('thumbCanvas');
const thumbTime   = thumbBox ? thumbBox.querySelector('.thumb-time') : null;

// L/R HUD（任意で #hudToggle をHTML側に置いてもOK）
const hudToggleBtn = document.getElementById('hudToggle');

