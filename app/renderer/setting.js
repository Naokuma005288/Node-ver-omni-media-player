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
