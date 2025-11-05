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

