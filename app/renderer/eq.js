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
