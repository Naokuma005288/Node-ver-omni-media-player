// ==== ユーティリティ ==================================================
function fmt(s){ s=isFinite(s)?s:0; return String(Math.floor(s/60))+':'+String(Math.floor(s%60)).padStart(2,'0'); }
function showToast(msg){ if(!toast) return; toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>{toast.classList.remove('show');},1600); }

function pathToUrl(p){
  if (/^https?:/i.test(p) || /^file:\/\//i.test(p)) return p;
  if (/^\\\\/.test(p)){ const n=p.replace(/\\/g,'/'); return 'file:' + n; }
  const n=p.replace(/\\/g,'/'); if (/^[A-Za-z]:\//.test(n)) return 'file:///' + n;
  if (/^\//.test(n)) return 'file://' + n; return 'file://' + n;
}
const isHls=(p)=> /\.m3u8($|\?)/i.test(p);

