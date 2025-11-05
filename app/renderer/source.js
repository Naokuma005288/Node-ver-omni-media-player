// ==== ソースアタッチ ==================================================
function attachSrc(src){
  if(hls){ try{hls.destroy();}catch(e){} hls=null; }
  try{ video.pause(); }catch(e){}
  video.removeAttribute('src'); video.load();

  const url=pathToUrl(src); const isHttp=/^https?:/i.test(url);
  if(isHttp) video.crossOrigin='anonymous'; else video.removeAttribute('crossorigin');

  if(isHls(url) && window.Hls && window.Hls.isSupported() && isHttp){
    hls = new Hls({ enableWorker:true }); hls.loadSource(url); hls.attachMedia(video);
  } else if(isHls(url) && video.canPlayType('application/vnd.apple.mpegURL') && isHttp){
    video.src=url;
  } else {
    video.src=url;
  }
  video.load();
}

