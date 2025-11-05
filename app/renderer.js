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

// ==== i18n ===========================================================
const I18N = {
  ja: {
    open: '開く', open_url:'URL', search_ph:'検索...',
    subs:'字幕', subs_toggle:'字幕 視/非', subs_next:'字幕 次', subs_add:'字幕+',
    visualizer:'Visualizer', eq_title:'イコライザー / 音質', marks_loop:'マーカー / ループ',
    smart:'スマート再生', others:'その他',
    start_btn:'開始 / Start',
    toast_saved:'設定を保存しました', toast_loaded:'設定を読み込みました（再起動推奨）',
    gate_msg:'再生・可視化を開始するには下のボタンを押してください。',
    gate_hint:'※Autoplay規制により、ボタン操作後にAudioContextを開始します。',
    confirm_glow:'Glow（発光）は描画負荷が高い場合があります。オンにしますか？'
  },
  en: {
    open:'Open', open_url:'Open URL', search_ph:'Search...',
    subs:'Subtitles', subs_toggle:'CC Show/Hide', subs_next:'CC Next', subs_add:'Add CC',
    visualizer:'Visualizer', eq_title:'Equalizer / Audio', marks_loop:'Markers / Loop',
    smart:'Smart Playback', others:'Others',
    start_btn:'Start',
    toast_saved:'Settings saved', toast_loaded:'Settings loaded (restart recommended)',
    gate_msg:'Press the button below to start playback & visualization.',
    gate_hint:'AudioContext will start after your gesture due to autoplay policy.',
    confirm_glow:'Glow effect may be heavy. Enable it?'
  }
};
let LANG = 'ja';
function t(key){
  if (I18N[LANG] && I18N[LANG][key]) return I18N[LANG][key];
  if (I18N['ja'][key]) return I18N['ja'][key];
  return key;
}
function applyI18n(){
  var i, list1=document.querySelectorAll('[data-i18n]');
  for(i=0;i<list1.length;i++){
    var el=list1[i], k=el.getAttribute('data-i18n'); el.textContent=t(k);
  }
  var list2=document.querySelectorAll('[data-i18n-ph]');
  for(i=0;i<list2.length;i++){
    var el2=list2[i], k2=el2.getAttribute('data-i18n-ph'); el2.setAttribute('placeholder', t(k2));
  }
  var m=document.getElementById('i_gate_msg'); if(m) m.textContent=t('gate_msg');
  var h=document.getElementById('i_gate_hint'); if(h) h.textContent=t('gate_hint');
}
async function setLang(newLang){
  LANG = (newLang==='en') ? 'en' : 'ja';
  await window.omni.set('lang', LANG);
  applyI18n();
}

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

// ==== 設定ロード =====================================================
let playlist = []; let idx = -1;
let A=null, B=null;
let hls; // HLS.js
let themeRGB = [102,170,255], targetRGB=[102,170,255];
let markers = [];
let colorTimer=null;
let loopMode='off';
let shuffle=false;
let bounceAB=false;
let sleepTimer=null;

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

(async function(){
  LANG = await window.omni.get('lang','ja'); applyI18n();

  // 再生速度/音量
  baseSpeed = await window.omni.get('speed', 1);
  if (speedEl) speedEl.value = baseSpeed;
  video.playbackRate = Number(baseSpeed);

  // 可視化
  vizConfig.mode    = await window.omni.get('viz.mode','barsPro');
  vizConfig.alpha   = await window.omni.get('viz.alpha',0.95);
  vizConfig.hPct    = await window.omni.get('viz.hPct',22);
  vizConfig.bars    = await window.omni.get('viz.bars',72);
  vizConfig.caps    = await window.omni.get('viz.caps',true);
  vizConfig.grad    = await window.omni.get('viz.grad','accent');
  vizConfig.quant   = await window.omni.get('viz.quant',2);
  vizConfig.autoColor = await window.omni.get('viz.autoColor',true);
  vizConfig.waterfall = await window.omni.get('viz.waterfall', false);
  vizConfig.hiVis     = await window.omni.get('viz.hiVis', false);
  vizConfig.anchor     = await window.omni.get('viz.anchor','bottom');
  vizConfig.bottomPadPx= await window.omni.get('viz.bottomPadPx',0);
  vizConfig.mirror     = await window.omni.get('viz.mirror',false);
  vizConfig.grid       = await window.omni.get('viz.grid',false);
  vizConfig.labels     = await window.omni.get('viz.labels',false);
  vizConfig.smooth     = await window.omni.get('viz.smooth',0.78);

  // UI反映
  if (vizModeEl)   vizModeEl.value = vizConfig.mode;
  if (vizAlphaEl)  vizAlphaEl.value= vizConfig.alpha;
  if (vizHeightEl) vizHeightEl.value=vizConfig.hPct;
  if (vizBarsEl)   vizBarsEl.value = vizConfig.bars;
  if (vizCapsEl)   vizCapsEl.checked = vizConfig.caps;
  if (vizGradEl)   vizGradEl.value = vizConfig.grad;
  if (vizQuantEl)  vizQuantEl.value= vizConfig.quant;
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
  if (eqEnableEl){ eqEnableEl.checked=await window.omni.get('eq.enabled',true); }
  if (limiterEnableEl){ limiterEnableEl.checked=await window.omni.get('limiter.enabled',true); }
  if (autoGainEnableEl){ autoGainEnableEl.checked=await window.omni.get('autogain.enabled',false); }
  if (preampEl){ preampEl.value=await window.omni.get('eq.preamp',0); }

  // ループ
  if (loopModeEl){ loopMode = await window.omni.get('loop.mode','off'); loopModeEl.value = loopMode; }
  if (shuffleEl){ shuffle = await window.omni.get('loop.shuffle',false); shuffleEl.checked = shuffle; }
  if (bounceABEl){ bounceAB = await window.omni.get('loop.bounceAB', false); bounceABEl.checked = bounceAB; }

  // スマート
  if (smartSkipEl)  smartSkipEl.checked = await window.omni.get('smart.skip',false);
  if (smartSpeedEl) smartSpeedEl.checked= await window.omni.get('smart.speed',false);
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
})();

// ==== テーマ色抽出（動画から） =======================================
const colorCanvas = document.createElement('canvas');
const colorX = colorCanvas.getContext('2d');
function setAccent(rgb){
  const arr = rgb.map(v=>Math.round(v));
  const hex = '#'+arr.map(v=>v.toString(16).padStart(2,'0')).join('');
  themeRGB = arr;
  document.documentElement.style.setProperty('--accent', hex);
  if (viz && viz.setThemeColor) viz.setThemeColor(arr);
}
function sampleColorNow(){
  try{
    if(!video.videoWidth || !video.videoHeight) return;
    const w=64, h=Math.max(36, Math.floor(64*video.videoHeight/video.videoWidth));
    colorCanvas.width=w; colorCanvas.height=h; colorX.drawImage(video,0,0,w,h);
    const d=colorX.getImageData(0,0,w,h).data; let r=0,g=0,b=0,c=0;
    for(let y=Math.floor(h*2/3); y<h; y++){
      for(let x=0; x<w; x++){
        const i=(y*w+x)*4, R=d[i], G=d[i+1], B=d[i+2];
        const L=0.2126*R+0.7152*G+0.0722*B; if(L>18&&L<245){ r+=R; g+=G; b+=B; c++; }
      }
    }
    if(c>0) targetRGB=[r/c,g/c,b/c];
  }catch(e){}
}
function startAutoColor(){ stopAutoColor(); if(!vizAutoColorEl || vizAutoColorEl.checked){ colorTimer=setInterval(sampleColorNow,160);} }
function stopAutoColor(){ if(colorTimer){clearInterval(colorTimer); colorTimer=null;} }
(function lerpLoop(){ const pulse = viz && viz.getPulse ? viz.getPulse():0; const k=0.06 + pulse*0.10;
  themeRGB = themeRGB.map((v,i)=> v + (targetRGB[i]-v)*k ); setAccent(themeRGB);
  requestAnimationFrame(lerpLoop);
})();
(function beatCssLoop(){
  const p = viz && viz.getPulse ? viz.getPulse() : 0;
  document.documentElement.style.setProperty('--beat', (0.25 + p*0.75).toFixed(3));
  requestAnimationFrame(beatCssLoop);
})();

// ==== シーク波形（簡易） =============================================
const waveN = 640; let waveData = new Float32Array(waveN).fill(0);
function drawSeekWave(){
  if(!seekWrap || !seekWave) return;
  const g = seekWave.getContext('2d'); const dpi=devicePixelRatio||1;
  const W = seekWrap.clientWidth*dpi, H = (seekWave.clientHeight?seekWave.clientHeight:60)*dpi;
  seekWave.width=W; seekWave.height=H; g.clearRect(0,0,W,H);
  const grad=g.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'rgba(255,255,255,0.12)'); grad.addColorStop(1,'rgba(255,255,255,0.03)');
  g.fillStyle=grad; g.fillRect(0,0,W,H);
  g.beginPath();
  for(let i=0;i<waveN;i++){ const x=i/(waveN-1)*W; const y=H-(H-4)*Math.min(1,waveData[i]); if(i){g.lineTo(x,y);}else{g.moveTo(x,y);} }
  g.lineWidth = Math.max(1,W/800); g.strokeStyle='rgba(255,255,255,0.55)'; g.shadowColor='rgba(255,255,255,0.35)'; g.shadowBlur=8; g.stroke(); g.shadowBlur=0;
  const posX = (video.currentTime/(video.duration||1))*W; g.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent')||'#66aaff'; g.fillRect(Math.floor(posX)-1,0,2,H);
}

// ==== サムネプレビュー ===============================================
const thumbCache = new Map();
const capCanvas = document.createElement('canvas');
const capX = capCanvas.getContext('2d');
async function captureCurrentFrame(){
  if(!video.videoWidth) return;
  const w=320, h=Math.round(w*video.videoHeight/video.videoWidth);
  capCanvas.width=w; capCanvas.height=h; capX.drawImage(video,0,0,w,h);
  const bmp = await createImageBitmap(capCanvas); const sec=Math.round(video.currentTime);
  thumbCache.set(sec,{w,h,bmp}); if(thumbCache.size>600){ const it=thumbCache.keys(); const k=it.next().value; thumbCache.delete(k); }
}
let capRAF=0; function startCaptureLoop(){ cancelAnimationFrame(capRAF); const step=async()=>{ if(!video.paused && !video.seeking) await captureCurrentFrame(); capRAF=requestAnimationFrame(step); }; capRAF=requestAnimationFrame(step);}
function stopCaptureLoop(){ cancelAnimationFrame(capRAF); }
if(seekWrap && thumbBox){
  seekWrap.addEventListener('mousemove', (e)=>{
    if(!isFinite(video.duration)||video.duration<=0) return;
    const rect=seekWrap.getBoundingClientRect(); const x=e.clientX-rect.left; const t=Math.max(0,Math.min(1,x/rect.width))*(video.duration||0);
    const sec=Math.round(t); const near=thumbCache.get(sec)||thumbCache.get(sec-1)||thumbCache.get(sec+1);
    if(!near){ thumbBox.classList.add('hidden'); return; }
    const stageRect = mpvSlot ? mpvSlot.getBoundingClientRect() : {left:0};
    thumbBox.style.left = (x + rect.left - stageRect.left) + 'px';
    const ctx=thumbCanvas.getContext('2d'); thumbCanvas.width=240; thumbCanvas.height=135;
    const rw=Math.min(near.w,240), rh=Math.round(rw*near.h/near.w); const y=Math.round((135-rh)/2);
    ctx.clearRect(0,0,240,135); ctx.drawImage(near.bmp,0,0,near.w,near.h,0,y,rw,rh);
    if (thumbTime) thumbTime.textContent = fmt(t); thumbBox.classList.remove('hidden');
  });
  seekWrap.addEventListener('mouseleave', ()=>{ thumbBox.classList.add('hidden'); });
}

// ==== ユーティリティ ==================================================
function fmt(s){ s=isFinite(s)?s:0; return String(Math.floor(s/60))+':'+String(Math.floor(s%60)).padStart(2,'0'); }
function showToast(msg){ if(!toast) return; toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>{toast.classList.remove('show');},1600); }

function pathToUrl(p){
  if (/^https?:/i.test(p) || /^file:\/\//i.test(p)) return p;
  if (/^\\\\/.test(p)){ const n=p.replace(/\\/g,'/'); return 'file:' + n; }
  const n=p.replace(/\\/g,'/'); if (/^[A-Za-z]:\//.test(n)) return 'file:///' + n;
  if (/^\//.test(n)) return 'file://' + n; return 'file://' + n;
}
const isHls=(p)=> /\.m3u8($|\?)/i.test(p);

// ==== ソースアタッチ ==================================================
function attachSrc(src){
  if(hls){ try{hls.destroy();}catch(e){} hls=null; }
  try{ video.pause(); }catch(e){}
  video.removeAttribute('src'); video.load();

  const url=pathToUrl(src); const isHttp=/^https?:/i.test(url);
  if(isHttp) video.crossOrigin='anonymous'; else video.removeAttribute('crossorigin');

  if(isHls(url) && window.Hls && window.Hls.isSupported() && isHttp){
    hls = new Hls({ enableWorker:true }); hls.loadSource(url); hls.attachMedia(video);
  } else if(isHls(url) && video.canPlayType('application/vnd.apple.mpegURL') && isHttp){
    video.src=url;
  } else {
    video.src=url;
  }
  video.load();
}

// ==== プレイリスト表示 ===============================================
const plistEl = document.getElementById('plist');
const searchEl= document.getElementById('search');
function renderPlist(){
  if(!plistEl) return;
  plistEl.innerHTML='';
  playlist.forEach((t,i)=>{
    const li=document.createElement('li');
    li.textContent=t.title||t.path; li.tabIndex=0;
    li.onclick=()=>{ playAt(i); };
    li.onkeydown=(e)=>{ if(e.key==='Enter') playAt(i); };
    plistEl.appendChild(li);
  });
  highlightActive();
}
function highlightActive(){ if(!plistEl) return; Array.prototype.forEach.call(plistEl.children, (li,i)=>{ li.classList.toggle('active', i===idx); }); }
function filterPlist(q){
  if(!plistEl) return;
  const s=q.trim().toLowerCase();
  Array.prototype.forEach.call(plistEl.children, (li,i)=>{
    const t=playlist[i];
    const text=(t.title+' '+(t.artist||'')+' '+(t.album||'')).toLowerCase();
    li.style.display = text.indexOf(s)>=0 ? '' : 'none';
  });
}

// ==== 再生制御 =======================================================
async function playAt(i){
  if(i<0 || i>=playlist.length) return;
  idx=i; A=B=null; const t=playlist[i]; if(titleEl) titleEl.textContent=t.title||t.path;

  markers = await window.omni.get('markers:'+t.path, []);
  const savedWave = await window.omni.get('wave:'+t.path, null);
  waveData = new Float32Array(savedWave && savedWave.length===waveN ? savedWave : new Array(waveN).fill(0));
  renderMarkers(); drawSeekWave();

  if (spinner) spinner.classList.remove('hidden');
  attachSrc(t.path);
  if (window.EmbeddedSubs && window.EmbeddedSubs.loadFor) { await window.EmbeddedSubs.loadFor(t.path, video); }
  try{ await video.play(); }catch(e){}
  highlightActive();
}

video.addEventListener('loadedmetadata', function(){
  if (spinner) spinner.classList.add('hidden');
  // 続きから再生は完全無効
  try { video.currentTime = 0; } catch(e){}
  if(curTimeEl) curTimeEl.textContent=fmt(0);
  if(durTimeEl) durTimeEl.textContent=fmt(video.duration);
  if (vizConfig.autoColor) startAutoColor(); drawSeekWave(); startCaptureLoop();
});
video.addEventListener('waiting', ()=>{ if(spinner) spinner.classList.remove('hidden'); });
video.addEventListener('playing', ()=>{
  if(spinner) spinner.classList.add('hidden');
  if (vizConfig.autoColor) startAutoColor(); startCaptureLoop();
});
video.addEventListener('pause',   ()=>{ stopAutoColor(); stopCaptureLoop(); });
video.addEventListener('ended',   async ()=>{
  stopAutoColor(); stopCaptureLoop();
  const t=playlist[idx]; if(t) await window.omni.set('wave:'+t.path, Array.from(waveData));
  if (loopMode==='one'){ playAt(idx); return; }
  let next = idx + 1; if (shuffle){ next = Math.floor(Math.random()*playlist.length); }
  if (next < playlist.length) playAt(next);
  else if (loopMode==='all')  playAt(0);
});

video.addEventListener('timeupdate', function(){
  // 1) シークUI
  if(seek){ seek.max=video.duration||0; seek.value=video.currentTime||0; }
  if(curTimeEl) curTimeEl.textContent = fmt(video.currentTime);
  if(durTimeEl) durTimeEl.textContent = fmt(video.duration);

  // 2) ABループ
  if (A!=null && B!=null && video.currentTime > B){ video.currentTime = bounceAB ? Math.max(A, B-0.04) : A; }

  // 3) シーク波形の更新
  if (isFinite(video.duration) && video.duration>0){
    const i = Math.max(0, Math.min(waveN-1, Math.floor(video.currentTime/video.duration*(waveN-1))));
    const lvl = viz && viz.getLevel ? viz.getLevel() : 0; waveData[i] = Math.max(waveData[i], lvl*1.25);
    if ((i%3)===0) drawSeekWave();
  }

  // 4) スマート再生（静音）
  const lvlNow = viz && viz.getLevel ? viz.getLevel() : 0;
  const th = smartLevelEl ? Number(smartLevelEl.value) : 0.08;
  const holdMs = smartHoldEl ? Number(smartHoldEl.value) : 900;
  const now = performance.now();

  if (lvlNow < th) {
    if (!smartSilenceSince) smartSilenceSince = now;

    // 静音スキップ
    if (smartSkipEl && smartSkipEl.checked && (now - smartSilenceSince) > holdMs && (now - lastSmartSkipAt) > Math.max(250, holdMs*0.35)) {
      const jump = Math.max(0.25, Math.min(1.0, holdMs/1000));
      video.currentTime = Math.min(video.duration || 1e9, (video.currentTime || 0) + jump);
      lastSmartSkipAt = now;
    }

    // 静音高速
    if (smartSpeedEl && smartSpeedEl.checked && !smartSpeedBoosted) {
      const boosted = Math.min(2.0, baseSpeed * 1.6);
      try { video.playbackRate = boosted; } catch(e){}
      smartSpeedBoosted = true;
    }
  } else {
    smartSilenceSince = 0;
    if (smartSpeedBoosted) {
      try { video.playbackRate = baseSpeed; } catch(e){}
      smartSpeedBoosted = false;
    }
  }

  // 5) イントロ/アウトロ自動スキップ（簡易）
  if (autoIntro && video.currentTime < 6 && lvlNow < Math.max(0.06, th*0.8)) {
    video.currentTime = Math.min(video.duration||1e9, video.currentTime + 0.4);
  }
  if (autoOutro && (video.duration - video.currentTime) < 12 && lvlNow < Math.max(0.06, th*0.8)) {
    video.currentTime = Math.min(video.duration||1e9, video.currentTime + 0.6);
  }
});
video.addEventListener('error', function(){ const err=video.error; showToast('再生エラー ' + (err?('code='+err.code):'')); console.error('MediaError:', err); });

// ==== コントロールイベント ===========================================
openBtn && (openBtn.onclick = async function(){
  const files = await window.omni.openFiles(); if(!files.length) return;
  const metas = await window.omni.readMeta(files); playlist=metas; renderPlist(); playAt(0);
});
openUrlBtn && (openUrlBtn.onclick = async function(){
  const url=prompt(LANG==='en'?'URL (HLS/direct):':'URL（HLS/直リンク）:'); if(!url) return;
  playlist=[{path:url,title:url}]; renderPlist(); playAt(0);
});
playBtn && (playBtn.onclick = function(){ if(video.paused) { video.play(); } else { video.pause(); } });
prevBtn && (prevBtn.onclick = function(){ video.currentTime = Math.max(0, video.currentTime - 5); });
nextBtn && (nextBtn.onclick = function(){ video.currentTime = Math.min(video.duration||1e9, video.currentTime + 5); });

seek && (seek.oninput = function(e){ video.currentTime = Number(e.target.value||0); });
if (seekWrap) {
  seekWrap.addEventListener('click', function(e){
    const rect=seekWrap.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX-rect.left)/rect.width));
    video.currentTime = ratio * (video.duration||0);
  });
}

// 音量（ミュート対応）
volumeEl && (volumeEl.oninput = async function(e){
  const v=Number(e.target.value||1);
  if (viz && viz.setOutputGain) viz.setOutputGain(v);
  if (muted && v>0) muted=false;
  await window.omni.set('volume', v);
});

// 速度（基準速度の管理）
function setBaseSpeed(v){
  baseSpeed = Math.max(0.25, Math.min(2.0, v));
  try {
    video.playbackRate = smartSpeedBoosted ? Math.min(2.0, baseSpeed*1.6) : baseSpeed;
  } catch(e){}
}
speedEl && (speedEl.oninput  = async function(e){
  const v=Number(e.target.value||1);
  setBaseSpeed(v);
  await window.omni.set('speed',v);
});
speedPresets.forEach(b=>{
  b.onclick = async function(){
    const v=Number(b.getAttribute('data-v'));
    if(speedEl) speedEl.value=v;
    setBaseSpeed(v);
    await window.omni.set('speed',v);
  };
});

// ファイル操作/その他
revealBtn && (revealBtn.onclick = function(){ const t=playlist[idx]; if(t) window.omni.revealInExplorer(t.path); });
shotBtn && (shotBtn.onclick = async function(){
  if (video.readyState<2) return;
  const c=document.createElement('canvas'); c.width=video.videoWidth; c.height=video.videoHeight;
  c.getContext('2d').drawImage(video,0,0,c.width,c.height);
  const png=c.toDataURL('image/png'); const saved=await window.omni.savePng(png); showToast('保存: '+saved);
});
pipBtn && (pipBtn.onclick = async function(){ try{ if(document.pictureInPictureElement) await document.exitPictureInPicture(); else await video.requestPictureInPicture(); }catch(e){} });
fsBtn && (fsBtn.onclick = function(){ if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); else document.exitFullscreen().catch(()=>{}); });

// フェード
let fading=false;
async function fadeAudio(to, ms){
  if(typeof to!=='number') to=0;
  if(typeof ms!=='number') ms=900;
  if(fading) return; fading=true;
  const get = ()=> Number(volumeEl ? volumeEl.value : 1);
  const set = (v)=>{ if(volumeEl) volumeEl.value = String(v); if(viz && viz.setOutputGain) viz.setOutputGain(v); };
  const from=get(), start=performance.now();
  const step=function(){
    const p=Math.min(1,(performance.now()-start)/ms); const v=from+(to-from)*p; set(v);
    if(p<1) requestAnimationFrame(step); else { fading=false; if(v<=0) muted=true; }
  };
  requestAnimationFrame(step);
}
fadeBtn && (fadeBtn.onclick = async function(){ const v=Number(volumeEl?volumeEl.value:1); if(v>0.05) await fadeAudio(0,800); else await fadeAudio(1,800); });

// A/B ループ
abABtn && (abABtn.onclick = function(){ A = Math.max(0, Math.min(video.currentTime, video.duration||video.currentTime)); showToast('A点: '+fmt(A)); });
abBBtn && (abBBtn.onclick = function(){ B = Math.max(0, Math.min(video.currentTime, video.duration||video.currentTime)); if (A!=null && B!=null && B<A){ const t=A; A=B; B=t; } showToast('B点: '+fmt(B)); });
abCBtn && (abCBtn.onclick = function(){ A=null; B=null; showToast('AB解除'); });

// ループ
loopModeEl && (loopModeEl.onchange = async function(e){ loopMode=e.target.value; await window.omni.set('loop.mode',loopMode); });
shuffleEl  && (shuffleEl.onchange  = async function(e){ shuffle=!!e.target.checked; await window.omni.set('loop.shuffle',shuffle); });
bounceABEl && (bounceABEl.onchange = async function(e){ bounceAB=!!e.target.checked; await window.omni.set('loop.bounceAB',bounceAB); });

// スマート再生
smartSkipEl  && (smartSkipEl.onchange = async (e)=>{ await window.omni.set('smart.skip', !!e.target.checked); });
smartSpeedEl && (smartSpeedEl.onchange= async (e)=>{ await window.omni.set('smart.speed', !!e.target.checked); });
smartLevelEl && (smartLevelEl.oninput = async (e)=>{ await window.omni.set('smart.level', Number(e.target.value)); });
smartHoldEl  && (smartHoldEl.oninput  = async (e)=>{ await window.omni.set('smart.hold',  Number(e.target.value)); });

// 可視化UI（基本）
vizModeEl   && (vizModeEl.onchange   = async (e)=>{ vizConfig.mode=e.target.value; if(viz) viz.setMode(vizConfig.mode); await window.omni.set('viz.mode',vizConfig.mode); });
vizAlphaEl  && (vizAlphaEl.oninput   = async (e)=>{ vizConfig.alpha=Number(e.target.value); if(viz) viz.setOpacity(vizConfig.alpha); await window.omni.set('viz.alpha',vizConfig.alpha); });
vizHeightEl && (vizHeightEl.oninput  = async (e)=>{ vizConfig.hPct=Number(e.target.value); if(viz) viz.setHeightPct(vizConfig.hPct); await window.omni.set('viz.hPct',vizConfig.hPct); });
vizBarsEl   && (vizBarsEl.oninput    = async (e)=>{ vizConfig.bars=Number(e.target.value); if(viz) viz.setBars(vizConfig.bars); await window.omni.set('viz.bars',vizConfig.bars); });
vizCapsEl   && (vizCapsEl.onchange   = async (e)=>{ vizConfig.caps=!!e.target.checked; if(viz) viz.setCaps(vizConfig.caps); await window.omni.set('viz.caps',vizConfig.caps); });
vizGradEl   && (vizGradEl.onchange   = async (e)=>{ vizConfig.grad=e.target.value; if(viz) viz.setGradient(vizConfig.grad); await window.omni.set('viz.grad',vizConfig.grad); });
vizQuantEl  && (vizQuantEl.oninput   = async (e)=>{ vizConfig.quant=Number(e.target.value); if(viz) viz.setQuantize(vizConfig.quant); await window.omni.set('viz.quant',vizConfig.quant); });
vizAutoColorEl && (vizAutoColorEl.onchange = async (e)=>{ vizConfig.autoColor=!!e.target.checked; if(vizConfig.autoColor) startAutoColor(); else stopAutoColor(); await window.omni.set('viz.autoColor',vizConfig.autoColor); });
vizWaterfallEl && (vizWaterfallEl.onchange = async (e)=>{ vizConfig.waterfall=!!e.target.checked; if(viz) viz.setWaterfall(vizConfig.waterfall); await window.omni.set('viz.waterfall',vizConfig.waterfall); });
vizHiVisEl && (vizHiVisEl.onchange = async (e)=>{ vizConfig.hiVis=!!e.target.checked; if(viz) viz.setHiVis(vizConfig.hiVis); await window.omni.set('viz.hiVis',vizConfig.hiVis); });

// 可視化UI（追加）
vizAnchorEl && (vizAnchorEl.onchange = async (e)=>{ vizConfig.anchor=e.target.value; if(viz) viz.setAnchor(vizConfig.anchor); await window.omni.set('viz.anchor',vizConfig.anchor); });
vizBottomEl && (vizBottomEl.oninput  = async (e)=>{ vizConfig.bottomPadPx=Number(e.target.value); if(viz) viz.setBottomPad(vizConfig.bottomPadPx); await window.omni.set('viz.bottomPadPx',vizConfig.bottomPadPx); });
vizMirrorEl && (vizMirrorEl.onchange = async (e)=>{ vizConfig.mirror=!!e.target.checked; if(viz) viz.setMirror(vizConfig.mirror); await window.omni.set('viz.mirror',vizConfig.mirror); });
vizGridEl   && (vizGridEl.onchange   = async (e)=>{ vizConfig.grid=!!e.target.checked; if(viz) viz.setGrid(vizConfig.grid); await window.omni.set('viz.grid',vizConfig.grid); });
vizLabelsEl && (vizLabelsEl.onchange = async (e)=>{ vizConfig.labels=!!e.target.checked; if(viz) viz.setLabels(vizConfig.labels); await window.omni.set('viz.labels',vizConfig.labels); });
vizExportBtn && (vizExportBtn.onclick = async ()=>{
  try{
    if (!panelSpec) return;
    const data = panelSpec.toDataURL('image/png');
    const saved = await window.omni.savePng(data);
    showToast('スペクトラムPNG 保存: '+saved);
  }catch(e){ console.error(e); showToast('保存に失敗'); }
});

// ====== EQ：バンドUI生成＆保存/復元 & プリセット ======
function buildEqSliders(){
  if(!eqBandsEl) return;
  Array.prototype.forEach.call(eqBandsEl.querySelectorAll('.eqcol'), (col,i)=>{
    Array.prototype.forEach.call(col.querySelectorAll('input[type="range"]'), n=> n.remove());
    const slider=document.createElement('input');
    slider.type='range'; slider.min=-12; slider.max=12; slider.step=0.5; slider.value=0; slider.className='eq-slider';
    slider.addEventListener('input', async ()=>{
      if(viz) viz.setBandGain(i, Number(slider.value));
      await saveEqBandsFromUI();
    });
    col.appendChild(slider);
  });
}
function getEqSliderValues(){
  const vals=[]; if(!eqBandsEl) return vals;
  const sliders = eqBandsEl.querySelectorAll('.eq-slider');
  for (var i=0;i<sliders.length;i++){ vals.push(Number(sliders[i].value)); }
  return vals;
}
async function saveEqBandsFromUI(){
  const arr = getEqSliderValues();
  if (arr && arr.length) await window.omni.set('eq.bands', arr);
}
async function loadEqBandsToUI(){
  if(!eqBandsEl) return;
  const def = [0,0,0,0,0,0,0,0,0,0];
  const arr = await window.omni.get('eq.bands', def);
  const sliders = eqBandsEl.querySelectorAll('.eq-slider');
  for (var i=0;i<sliders.length;i++){
    const v = (arr[i]!=null)? arr[i] : 0;
    sliders[i].value = String(v);
    if (viz) viz.setBandGain(i, Number(v));
  }
}

// プリセット定義
const PRESETS = {
  flat:   [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  bass:   [ 6,  5,  4,  2,  0, -1, -2, -3, -4, -5],
  vocal:  [-2, -1,  0,  2,  3,  3,  2,  0, -1, -2],
  treble: [-4, -3, -2, -1,  0,  1,  2,  4,  5,  6]
};
function applyEqPreset(name){
  const arr = PRESETS[name] || PRESETS.flat;
  if(!eqBandsEl) return;
  const sliders = eqBandsEl.querySelectorAll('.eq-slider');
  for (var i=0;i<sliders.length;i++){
    const v = arr[i] || 0;
    sliders[i].value = String(v);
    if (viz) viz.setBandGain(i, v);
  }
  if (preampEl){
    const pre = (name==='bass'||name==='treble') ? -2 : 0;
    preampEl.value = String(pre);
    if (viz) viz.setPreamp(pre);
    window.omni.set('eq.preamp', pre);
  }
  saveEqBandsFromUI();
}
eqFlatBtn   && (eqFlatBtn.onclick   = ()=>{ applyEqPreset('flat');   });
eqBassBtn   && (eqBassBtn.onclick   = ()=>{ applyEqPreset('bass');   });
eqVocalBtn  && (eqVocalBtn.onclick  = ()=>{ applyEqPreset('vocal');  });
eqTrebleBtn && (eqTrebleBtn.onclick = ()=>{ applyEqPreset('treble'); });

// スイッチ群
eqEnableEl && (eqEnableEl.onchange = async (e)=>{ if(viz) viz.setEQEnabled(!!e.target.checked); await window.omni.set('eq.enabled',!!e.target.checked); });
limiterEnableEl && (limiterEnableEl.onchange = async (e)=>{ if(viz) viz.setLimiter(!!e.target.checked); await window.omni.set('limiter.enabled',!!e.target.checked); });
autoGainEnableEl && (autoGainEnableEl.onchange = async (e)=>{ if(viz) viz.setAutoGain(!!e.target.checked); await window.omni.set('autogain.enabled',!!e.target.checked); });
preampEl && (preampEl.oninput = async (e)=>{ if(viz) viz.setPreamp(Number(e.target.value)); await window.omni.set('eq.preamp',Number(e.target.value)); });

// マーカー
function renderMarkers(){
  if(!markersEl || !video.duration) return; markersEl.innerHTML='';
  markers.forEach(function(m,i){
    const div=document.createElement('div'); div.className='m'; div.style.left=(m.t/video.duration*100)+'%'; div.title='🔖 '+fmt(m.t);
    div.style.cursor='pointer'; div.onclick=function(e){ e.stopPropagation(); video.currentTime=m.t; };
    div.oncontextmenu=async function(e){ e.preventDefault(); markers.splice(i,1); renderMarkers(); await saveMarkers(); };
    markersEl.appendChild(div);
  });
}
async function saveMarkers(){ const t=playlist[idx]; if(t) await window.omni.set('markers:'+t.path, markers); }
markAddBtn && (markAddBtn.onclick = async function(){ if(!isFinite(video.currentTime)) return; markers.push({t:Math.max(0,Math.min(video.currentTime,video.duration||video.currentTime))}); renderMarkers(); await saveMarkers(); });
markExportBtn && (markExportBtn.onclick = function(){
  const lines=['WEBVTT','','NOTE Exported by Omni Player Pro'];
  markers.sort((a,b)=>a.t-b.t).forEach((m,i)=>{ const s=m.t;
    const hh=String(Math.floor(s/3600)).padStart(2,'0'), mm=String(Math.floor((s%3600)/60)).padStart(2,'0'), ss=String(Math.floor(s%60)).padStart(2,'0'), ms=String(Math.floor((s*1000)%1000)).padStart(3,'0');
    lines.push(String(i+1),`${hh}:${mm}:${ss}.${ms} --> ${hh}:${mm}:${ss}.${ms}`,'Mark '+String(i+1),'');
  });
  const blob=new Blob([lines.join('\n')],{type:'text/vtt'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='markers.vtt'; a.click();
});
markImportBtn && (markImportBtn.onclick = function(){ if(markFileEl) markFileEl.click(); });
markFileEl && (markFileEl.onchange = async function(){
  const f=markFileEl.files && markFileEl.files[0]; if(!f) return; const txt=await f.text(); const arr=[];
  const re=/(\d\d):(\d\d):(\d\d)[\.,](\d{1,3})/g; let m; while((m=re.exec(txt))){ const t=(+m[1])*3600+(+m[2])*60+(+m[3])+(+m[4])/1000; arr.push({t:t}); }
  if(!arr.length){ txt.split(/\r?\n/).forEach(function(line){ const v=parseFloat(line.trim()); if(!isNaN(v)) arr.push({t:Math.max(0,v)}); }); }
  if(arr.length){ markers=arr; renderMarkers(); await saveMarkers(); showToast(LANG==='en'?'Markers imported':'マーカー読み込み'); }
});

// D&D / 検索 / ショートカット
searchEl && (searchEl.oninput = (e)=>{ filterPlist(e.target.value); });
document.addEventListener('dragover', (e)=>{ e.preventDefault(); });
document.addEventListener('drop', async (e)=>{
  e.preventDefault(); const filesList=e.dataTransfer.files||[]; const files=[]; for(var i=0;i<filesList.length;i++){ files.push(filesList[i].path||filesList[i].name); }
  if(!files.length) return;
  const metas=await window.omni.readMeta(files); playlist=metas; renderPlist(); playAt(0);
});

function jumpMarker(next=true){
  if(!markers.length || !isFinite(video.currentTime)) return;
  const tNow = video.currentTime;
  const list = markers.map(m=>m.t).sort((a,b)=>a-b);
  if(next){
    const to = list.find(t=>t > tNow + 0.25);
    if (to!=null) video.currentTime = to;
  } else {
    let prev = null;
    for(let i=0;i<list.length;i++){ if(list[i] < tNow - 0.25) prev=list[i]; else break; }
    if (prev!=null) video.currentTime = prev;
  }
}

async function startBurst(seconds=5, count=10){
  if (burstTimer) { clearInterval(burstTimer); burstTimer=null; }
  const dt = Math.max(1, Math.floor((seconds*1000)/count));
  let done = 0;
  burstTimer = setInterval(async ()=>{
    if (video.readyState<2){ if (++done>=count){ clearInterval(burstTimer); burstTimer=null; } return; }
    const c=document.createElement('canvas'); c.width=video.videoWidth; c.height=video.videoHeight;
    c.getContext('2d').drawImage(video,0,0,c.width,c.height);
    const png=c.toDataURL('image/png'); await window.omni.savePng(png);
    if (++done>=count){ clearInterval(burstTimer); burstTimer=null; showToast('連写完了'); }
  }, dt);
  showToast('連写開始');
}

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

// ==== グローバル・ショートカット =====================================
addEventListener('keydown', async function(e){
  const tag=(e.target||{}).tagName; if(tag==='INPUT'||tag==='TEXTAREA') return;

  // 既存
  if(e.code==='Space'){ e.preventDefault(); if(playBtn) playBtn.onclick(); }
  if(e.key==='f'||e.key==='F'){ if(fsBtn) fsBtn.onclick(); }
  if(e.key==='p'||e.key==='P'){ if(pipBtn) pipBtn.onclick(); }
  if(e.key==='ArrowRight'){ if(nextBtn) nextBtn.onclick(); }
  if(e.key==='ArrowLeft'){ if(prevBtn) prevBtn.onclick(); }
  if(e.key===',' ){ video.currentTime=Math.max(0,video.currentTime-1/30); }
  if(e.key==='.' ){ video.currentTime=Math.min(video.duration||1e9,video.currentTime+1/30); }
  if(e.shiftKey && e.code==='Space'){ e.preventDefault(); if(fadeBtn) fadeBtn.onclick(); }
  // M：ミュート
  if(e.key==='m' || e.key==='M'){
    if (!muted){
      savedUserGainForMute = Number(volumeEl ? volumeEl.value : 1);
      if (viz && viz.setOutputGain) viz.setOutputGain(0);
      if (volumeEl) volumeEl.value = '0';
      muted = true;
    }else{
      if (viz && viz.setOutputGain) viz.setOutputGain(savedUserGainForMute);
      if (volumeEl) volumeEl.value = String(savedUserGainForMute);
      muted = false;
    }
  }

  // === 新ショートカット ===
  // J-K-L
  if(e.key==='j' || e.key==='J'){ setBaseSpeed(baseSpeed - 0.1); if(speedEl) speedEl.value=String(baseSpeed); await window.omni.set('speed', baseSpeed); }
  if(e.key==='l' || e.key==='L'){ setBaseSpeed(baseSpeed + 0.1); if(speedEl) speedEl.value=String(baseSpeed); await window.omni.set('speed', baseSpeed); }
  if(e.key==='k' || e.key==='K'){ if(video.paused) video.play(); else video.pause(); }

  // インスタントリプレイ
  if(e.key==='r' || e.key==='R'){ video.currentTime = Math.max(0, (video.currentTime||0) - 3); }

  // EQプリセット
  if(e.key==='1'){ applyEqPreset('flat'); }
  if(e.key==='2'){ applyEqPreset('bass'); }
  if(e.key==='3'){ applyEqPreset('vocal'); }
  if(e.key==='4'){ applyEqPreset('treble'); }

  // ステレオ幅 / モノ
  if(e.key===']'){ stereoWidth = Math.min(2.0, stereoWidth + 0.1); viz && viz.setStereoWidth(stereoWidth); await window.omni.set('audio.width', stereoWidth); showToast('Width: '+stereoWidth.toFixed(2)); }
  if(e.key==='['){ stereoWidth = Math.max(0.0, stereoWidth - 0.1); viz && viz.setStereoWidth(stereoWidth); await window.omni.set('audio.width', stereoWidth); showToast('Width: '+stereoWidth.toFixed(2)); }
  if(e.key==='\\'){ stereoWidth = 1.0; viz && viz.setStereoWidth(stereoWidth); await window.omni.set('audio.width', stereoWidth); showToast('Width: 1.00'); }
  if(e.key==='n' || e.key==='N'){ mono = !mono; viz && viz.setMono(mono); await window.omni.set('audio.mono', mono); showToast(mono?'Mono: ON':'Mono: OFF'); }

  // カラー
  if(e.key==='c' || e.key==='C'){
    if(e.shiftKey){
      // 色ロック（今の色を保持＆AutoColor OFF）
      stopAutoColor(); if (vizAutoColorEl){ vizAutoColorEl.checked=false; }
      await window.omni.set('viz.autoColor', false);
      sampleColorNow(); setAccent(themeRGB); showToast('Color Locked');
    }else{
      const v = !(vizAutoColorEl && vizAutoColorEl.checked===true);
      if (vizAutoColorEl){ vizAutoColorEl.checked = v; }
      if (v) startAutoColor(); else stopAutoColor();
      await window.omni.set('viz.autoColor', v);
      showToast(v?'Auto Color: ON':'Auto Color: OFF');
    }
  }

  // グリッド/ラベル
  if(e.key==='g' || e.key==='G'){ vizConfig.grid = !vizConfig.grid; viz && viz.setGrid(vizConfig.grid); await window.omni.set('viz.grid', vizConfig.grid); showToast(vizConfig.grid?'Grid: ON':'Grid: OFF'); }
  if(e.key==='h' || e.key==='H'){ vizConfig.labels = !vizConfig.labels; viz && viz.setLabels(vizConfig.labels); await window.omni.set('viz.labels', vizConfig.labels); showToast(vizConfig.labels?'Labels: ON':'Labels: OFF'); }

  // ビジュアライザ凍結
  if(e.key==='F8'){ viz && viz.setFreeze && viz.setFreeze(!(viz.__frozen||false)); viz.__frozen = !(viz.__frozen||false); showToast(viz.__frozen?'Freeze: ON':'Freeze: OFF'); }

  // HUDトグル/位置
  if(e.key==='F9'){
    hudOn = !hudOn;
    if (viz) viz.setHudLR(hudOn);
    const btn = document.getElementById('hudToggle');
    if (btn) btn.classList.toggle('on', hudOn);
    await window.omni.set('hud.lr', hudOn);
    showToast(hudOn ? 'LR HUD: ON' : 'LR HUD: OFF');
  }
  if(e.shiftKey && e.key==='F9'){
    const order = ['top-right','bottom-right','bottom-left','top-left'];
    const i = Math.max(0, order.indexOf(hudPos));
    hudPos = order[(i+1)%order.length];
    if (viz && viz.setHudPos) viz.setHudPos(hudPos);
    await window.omni.set('hud.pos', hudPos);
    showToast('HUD位置: '+hudPos);
  }

  // マーカー移動
  if(e.altKey && e.key==='ArrowRight'){ e.preventDefault(); jumpMarker(true); }
  if(e.altKey && e.key==='ArrowLeft'){ e.preventDefault(); jumpMarker(false); }

  // 自動イントロ/アウトロ
  if(e.shiftKey && (e.key==='i' || e.key==='I')){ autoIntro = !autoIntro; await window.omni.set('smart.autoIntro', autoIntro); showToast(autoIntro?'Auto Intro Skip: ON':'Auto Intro Skip: OFF'); }
  if(e.shiftKey && (e.key==='o' || e.key==='O')){ autoOutro = !autoOutro; await window.omni.set('smart.autoOutro', autoOutro); showToast(autoOutro?'Auto Outro Skip: ON':'Auto Outro Skip: OFF'); }

  // 連写スクショ
  if(e.shiftKey && (e.key==='b' || e.key==='B')){ startBurst(5, 10); }
});
if (mpvSlot) mpvSlot.ondblclick = function(){ if(fsBtn) fsBtn.onclick(); };

// ==== 字幕（外部） ===================================================
function srtToVtt(srt){ return 'WEBVTT\n\n'+srt.replace(/\r+/g,'').replace(/^\d+\s*$/gm,'').replace(/(\d+):(\d+):(\d+),(\d+)/g,'$1:$2:$3.$4'); }
async function addSubtitleFromFile(file){
  const ext=(file.name||'').split('.').pop().toLowerCase(); let text=await file.text(); if(ext==='srt') text=srtToVtt(text);
  const blob=new Blob([text],{type:'text/vtt'}); const url=URL.createObjectURL(blob);
  Array.prototype.forEach.call(video.querySelectorAll('track:not([data-embedded])'), t=> t.remove());
  const tr=document.createElement('track'); tr.kind='subtitles'; tr.label=file.name; tr.srclang=LANG; tr.src=url; tr.default=true;
  video.appendChild(tr); tr.addEventListener('load',()=>{ const tt=video.textTracks[0]; if(tt) tt.mode='showing'; });
}
subAddBtn && (subAddBtn.onclick = function(){ if(subFileEl) subFileEl.click(); });
subFileEl && (subFileEl.onchange = async function(){ const f=subFileEl.files && subFileEl.files[0]; if(!f) return; await addSubtitleFromFile(f); });
ccToggleBtn && (ccToggleBtn.onclick = function(){ const t=video.textTracks[0]; if(!t) return; t.mode=(t.mode==='showing')?'hidden':'showing'; });
ccBtn && (ccBtn.onclick = function(){ const ts=video.textTracks; if(!ts.length) return; var i=-1; for(var k=0;k<ts.length;k++){ if(ts[k].mode==='showing'){ i=k; break; } } for(var j=0;j<ts.length;j++){ ts[j].mode='hidden'; } ts[((i+1)%ts.length)].mode='showing'; });

// ==== 設定 Export/Import =============================================
exportSettingsBtn && (exportSettingsBtn.onclick = async function(){
  const keys=['lang','speed','volume','viz.mode','viz.alpha','viz.hPct','viz.bars','viz.caps','viz.grad','viz.quant','viz.autoColor','viz.waterfall','viz.hiVis',
    'viz.anchor','viz.bottomPadPx','viz.mirror','viz.grid','viz.labels','viz.smooth',
    'ui.glow.on','ui.glow.lv','eq.enabled','limiter.enabled','autogain.enabled','eq.preamp','loop.mode','loop.shuffle','loop.bounceAB',
    'smart.skip','smart.speed','smart.level','smart.hold','eq.bands','audio.width','audio.mono','smart.autoIntro','smart.autoOutro',
    'hud.lr','hud.pos'];
  const data={}; for(var i=0;i<keys.length;i++){ const k=keys[i]; data[k]=await window.omni.get(k,null); }
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='omni-player-settings.json'; a.click(); showToast(t('toast_saved'));
});
importSettingsBtn && (importSettingsBtn.onclick = function(){ if(importSettingsFileEl) importSettingsFileEl.click(); });
importSettingsFileEl && (importSettingsFileEl.onchange = async function(){
  const f=importSettingsFileEl.files && importSettingsFileEl.files[0]; if(!f) return;
  try{
    const obj = JSON.parse(await f.text());
    const klist = Object.keys(obj);
    for (var i=0;i<klist.length;i++){
      var key = klist[i];
      await window.omni.set(key, obj[key]);
    }
    showToast(t('toast_loaded'));
  }catch(e){
    showToast('読み込みに失敗 / Failed to load');
  }
});

// ==== Settings / Help / Sleep =======================================
function openSettings(){ if(settingsModal) settingsModal.classList.remove('hidden'); }
function closeSettings(){ if(settingsModal) settingsModal.classList.add('hidden'); }
settingsBtn && (settingsBtn.onclick = openSettings);
settingsClose && (settingsClose.onclick = closeSettings);
settingsModal && settingsModal.addEventListener('click', (e)=>{ if(e.target===settingsModal) closeSettings(); });

helpBtn && (helpBtn.onclick = function(){ if(helpOverlay) helpOverlay.classList.remove('hidden'); });
helpClose && (helpClose.onclick = function(){ if(helpOverlay) helpOverlay.classList.add('hidden'); });
helpOverlay && helpOverlay.addEventListener('click', (e)=>{ if(e.target===helpOverlay) helpOverlay.classList.add('hidden'); });

langBtn && (langBtn.onclick = async function(){
  const next = LANG==='ja' ? 'en' : 'ja';
  await setLang(next);
  if (langSelect) langSelect.value = next;
});
langSelect && (langSelect.onchange = async (e)=>{ await setLang(e.target.value); });

glowEnable && (glowEnable.onchange = async function(e){
  if (e.target.checked) {
    const ok = confirm(t('confirm_glow'));
    if (!ok) { e.target.checked = false; return; }
  }
});
settingsSave && (settingsSave.onclick = async function(){
  const glowOn = !!(glowEnable && glowEnable.checked);
  const glowLv = Number((glowLevel && glowLevel.value) ? glowLevel.value : 0.7);
  document.documentElement.style.setProperty('--glowAlpha', glowOn ? String(glowLv) : '0');
  await window.omni.set('ui.glow.on', glowOn);
  await window.omni.set('ui.glow.lv', glowLv);

  const hv = !!(hiVis2 && hiVis2.checked); const wf = !!(waterfall2 && waterfall2.checked);
  vizConfig.hiVis = hv; vizConfig.waterfall = wf;
  if (viz) { viz.setHiVis(hv); viz.setWaterfall(wf); }
  await window.omni.set('viz.hiVis', hv);
  await window.omni.set('viz.waterfall', wf);

  showToast(t('toast_saved'));
  closeSettings();
});

// 可視化スムージングの保存（UIは無いが外部から設定可能にしておく）
document.addEventListener('omni:setVizSmooth', async (ev)=>{
  const v = Number(ev.detail||0.78);
  vizConfig.smooth = Math.max(0, Math.min(0.95, v));
  if (viz) viz.setSmoothing(vizConfig.smooth);
  await window.omni.set('viz.smooth', vizConfig.smooth);
});

// HUD位置の外部設定（任意）
document.addEventListener('omni:setHudPos', async (ev)=>{
  const pos = String(ev.detail||'top-right');
  hudPos = pos;
  if (viz && viz.setHudPos) viz.setHudPos(hudPos);
  await window.omni.set('hud.pos', hudPos);
});

// ==== 起動ゲート：ユーザー操作でAudioContextを解禁 ===================
async function startApp(){
  try{
    await unlockAudio();
    attachVisualizersAfterUnlock();
  } finally {
    if (gate){ gate.classList.add('hidden'); setTimeout(function(){ if(gate && gate.parentNode){ gate.parentNode.removeChild(gate); } }, 300); }
  }
}
if (gateStart){
  ['click','pointerdown','keydown','touchstart'].forEach(function(ev){
    gateStart.addEventListener(ev, startApp, { once:true, passive:true });
  });
} else {
  const kick = async function(){
    if (!audioUnlocked) { await unlockAudio(); attachVisualizersAfterUnlock(); }
    window.removeEventListener('click', kick, true);
  };
  window.addEventListener('click', kick, true);
}
