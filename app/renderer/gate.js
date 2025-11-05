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
