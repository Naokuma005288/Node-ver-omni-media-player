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

