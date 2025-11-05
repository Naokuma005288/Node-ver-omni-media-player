// 埋め込み字幕：ffprobeで一覧→ffmpegでVTT抽出→<track>に挿す
(function(){
  async function loadFor(filePath, videoEl){
    if (!filePath || /^https?:/i.test(filePath)) return false; // ローカルのみ
    const tracks = await window.omni.listEmbeddedSubs(filePath);
    if (!tracks || !tracks.length) return false;

    // 複数あれば番号選択（Enterで0）
    let pick = 0;
    if (tracks.length > 1) {
      const msg = tracks.map((t,i)=>`${i}: [${t.lang||'und'}] ${t.codec||''} ${t.title||''}`).join('\n');
      const ans = prompt('埋め込み字幕を選択\n' + msg + '\n番号を入力（空で 0）', '0');
      const n = Number(ans);
      if (!Number.isNaN(n) && n>=0 && n<tracks.length) pick = n;
    }

    const vttPath = await window.omni.extractEmbeddedSub(filePath, tracks[pick].index);
    if (!vttPath) return false;

    // 既存（埋め込み扱い）を外す
    [...videoEl.querySelectorAll('track[data-embedded]')].forEach(t=>t.remove());

    const tr = document.createElement('track');
    tr.kind = 'subtitles';
    tr.srclang = tracks[pick].lang || 'und';
    tr.label = tracks[pick].title || tracks[pick].lang || 'sub';
    tr.src = 'file://' + vttPath.replace(/\\/g, '/');
    tr.default = true;
    tr.setAttribute('data-embedded','');
    videoEl.appendChild(tr);

    tr.addEventListener('load', () => {
      const tt = videoEl.textTracks[0];
      if (tt) tt.mode = 'showing';
    });
    return true;
  }
  window.EmbeddedSubs = { loadFor };
})();
