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
