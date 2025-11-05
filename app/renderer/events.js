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
