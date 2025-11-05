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

