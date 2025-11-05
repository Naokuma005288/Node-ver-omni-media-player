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

