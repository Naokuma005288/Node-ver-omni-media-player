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

