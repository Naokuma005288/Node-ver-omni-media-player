// ==== プレイリスト表示 ===============================================
const plistEl = document.getElementById('plist');
const searchEl= document.getElementById('search');
function renderPlist(){
  if(!plistEl) return;
  plistEl.innerHTML='';
  playlist.forEach((t,i)=>{
    const li=document.createElement('li');
    li.textContent=t.title||t.path; li.tabIndex=0;
    li.onclick=()=>{ playAt(i); };
    li.onkeydown=(e)=>{ if(e.key==='Enter') playAt(i); };
    plistEl.appendChild(li);
  });
  highlightActive();
}
function highlightActive(){ if(!plistEl) return; Array.prototype.forEach.call(plistEl.children, (li,i)=>{ li.classList.toggle('active', i===idx); }); }
function filterPlist(q){
  if(!plistEl) return;
  const s=q.trim().toLowerCase();
  Array.prototype.forEach.call(plistEl.children, (li,i)=>{
    const t=playlist[i];
    const text=(t.title+' '+(t.artist||'')+' '+(t.album||'')).toLowerCase();
    li.style.display = text.indexOf(s)>=0 ? '' : 'none';
  });
}
