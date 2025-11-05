/* Omni Inspector - クリック不能の根本原因を可視化/特定/無効化
   トグル: 右下「🧪 Inspect」
*/
(function(){
  if (window.__OMNI_INSPECTOR__) return;
  const LOG = (window.LOG || {info(){},warn(){},error(){},debug(){},event(){}});

  const $el=(t,c,p)=>{const n=document.createElement(t); if(c) n.className=c; if(p) p.appendChild(n); return n;};
  const css=(n,k)=>getComputedStyle(n).getPropertyValue(k);
  const desc=(n)=>{ if(!n) return '(null)'; let s=n.tagName.toLowerCase(); if(n.id) s+='#'+n.id;
    if(n.className && typeof n.className==='string') s+='.'+n.className.trim().split(/\s+/).slice(0,3).join('.'); return s; };
  const within=(a,b)=> !!(a && b && (a===b || a.contains(b)));

  const st=$el('style',null,document.head);
  st.textContent = `
  .insp-toggle{position:fixed;right:12px;bottom:60px;z-index:100001;padding:8px 10px;border:1px solid #2b4770;border-radius:10px;background:#16223a;color:#eaf0ff;cursor:pointer;box-shadow:0 8px 18px -12px rgba(0,0,0,.7)}
  .insp-panel{position:fixed;right:12px;bottom:104px;z-index:100001;width:min(780px,94vw);height:min(56vh,560px);display:none;flex-direction:column;background:#0f1830f0;border:1px solid #2b4770;border-radius:12px;backdrop-filter:blur(6px)}
  .insp-panel.show{display:flex}
  .insp-head{display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #1c2b4a;color:#eaf0ff}
  .insp-head .title{font-weight:700;margin-right:auto}
  .insp-head .btn{padding:6px 8px;border:1px solid #2b4770;border-radius:8px;background:#16223a;color:#eaf0ff;cursor:pointer}
  .insp-body{display:grid;grid-template-columns:1.1fr .9fr;gap:10px;padding:8px;height:100%}
  .insp-card{border:1px solid #1c2b4a;border-radius:10px;padding:8px;background:#0b1428;color:#eaf0ff;overflow:auto}
  .insp-list{font:12px/1.4 ui-monospace,Consolas,Menlo,monospace}
  .insp-row{display:grid;grid-template-columns: 1fr auto auto auto auto auto;gap:8px;padding:3px 0;border-bottom:1px dashed #1b2b4a}
  .insp-row:hover{background:#121e35}
  .insp-row .tag{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:50vw}
  .insp-foot{display:flex;gap:8px;align-items:center;padding:8px;border-top:1px solid #1c2b4a;color:#9fb1d8;font-size:12px}
  .insp-badge{display:inline-block;padding:2px 6px;border-radius:6px;border:1px solid #2b4770;font-size:12px;background:#132243}
  .insp-danger{background:#5c1f1f;border-color:#8a3a3a}
  .insp-good{background:#193a2b;border-color:#2d6a4f}
  .insp-warn{background:#664400;border-color:#aa7a00}
  .insp-dim{opacity:.8}
  `;

  const toggle=$el('button','insp-toggle',document.body); toggle.textContent='🧪 Inspect';
  const panel =$el('div','insp-panel',document.body);
  const head  =$el('div','insp-head',panel);
  const title =$el('div','title',head); title.textContent='Inspector';
  const btnLive =$el('button','btn',head); btnLive.textContent='👁 Live';
  const btnScan =$el('button','btn',head); btnScan.textContent='🧭 Scan Controls';
  const btnKill =$el('button','btn',head); btnKill.textContent='🪓 Neutralize';
  const btnUndo =$el('button','btn',head); btnUndo.textContent='↩ Undo';
  const btnDump =$el('button','btn',head); btnDump.textContent='📋 Dump to Logs';

  const body  =$el('div','insp-body',panel);
  const live  =$el('div','insp-card',body);
  const list  =$el('div','insp-card',body);
  const livePre=$el('pre','insp-list',live);
  const listHead=$el('div',null,list);
  const listBox =$el('div','insp-list',list);
  listHead.innerHTML = `<div class="insp-badge">重なり検出リスト（.controls 領域）</div> <span class="insp-dim">※ Neutralize は pointer-events: none を一時付与</span>`;

  const foot=$el('div','insp-foot',panel);
  const stat=$el('div',null,foot); stat.textContent='Ready';

  let showing=false, liveOn=true, lastHover=null;
  const neutralized = new Set();

  function getInfo(n){
    if(!n) return null;
    const cs = getComputedStyle(n);
    const zi = cs.zIndex;
    const pe = cs.pointerEvents;
    const pos= cs.position;
    const op = cs.opacity;
    const vs = cs.visibility;
    const disp= cs.display;
    const inert = n.hasAttribute('inert');
    const rec = n.getBoundingClientRect();
    return { node:n, tag:desc(n), zi, pe, pos, op, vs, disp, inert, w:rec.width|0, h:rec.height|0 };
  }
  function rowEl(info){
    const r=$el('div','insp-row',listBox);
    const tag=$el('div','tag',r); tag.textContent=info.tag;
    const zi =$el('div',null,r); zi.textContent=info.zi||'auto';
    const pe =$el('div',null,r); pe.textContent=info.pe;
    const pos=$el('div',null,r); pos.textContent=info.pos;
    const wh =$el('div',null,r); wh.textContent=info.w+'×'+info.h;
    const act=$el('div',null,r);
    const b1=$el('button','btn',act); b1.textContent = neutralized.has(info.node) ? 'Restore' : 'Neutralize';
    b1.onclick=()=> {
      if (neutralized.has(info.node)) { info.node.style.pointerEvents=''; neutralized.delete(info.node); }
      else { info.node.style.pointerEvents='none'; neutralized.add(info.node); }
      refreshList();
    };
    return r;
  }
  function refreshList(){
    const kids=[...listBox.children]; kids.forEach(k=>k.remove());
    currentList.forEach(info=>rowEl(info));
    stat.textContent = `${currentList.length} blockers listed · neutralized: ${neutralized.size}`;
  }

  function renderLive(ev){
    if(!showing || !liveOn) return;
    const x = ev?.clientX ?? (innerWidth/2);
    const y = ev?.clientY ?? (innerHeight-10);
    const stack = document.elementsFromPoint(x,y).slice(0,14);
    let out = `Point: ${x|0},${y|0}\n\n`;
    stack.forEach((n,i)=>{
      const info = getInfo(n);
      out += `${String(i+1).padStart(2,' ')} ${info.tag}\n     z=${info.zi||'auto'} pe=${info.pe} pos=${info.pos} op=${info.op} vis=${info.vs} disp=${info.disp}${info.inert?' inert':''}  size=${info.w}×${info.h}\n`;
    });
    livePre.textContent = out;
    lastHover = {x,y,stack};
  }
  addEventListener('pointermove', renderLive, {passive:true});

  let currentList = [];
  function scanControls(){
    const controls = document.querySelector('.controls, #controls, .controlbar');
    if (!controls) { listHead.innerHTML = `<div class="insp-badge insp-warn">.controls が見つからない</div>`; currentList=[]; refreshList(); return; }
    const r = controls.getBoundingClientRect();
    const out = new Map();
    for(let yi=0; yi<4; yi++){
      for(let xi=0; xi<10; xi++){
        const px = r.left + ((xi+0.5)/10)*r.width;
        const py = r.top  + ((yi+0.5)/4)*r.height;
        const top = document.elementFromPoint(px, py);
        if (!top) continue;
        if (!within(controls, top)) {
          const info = getInfo(top);
          let rep = top;
          for (let p=top; p && p!==document.body; p=p.parentElement) {
            if (within(controls, p)) break;
            const cs = getInfo(p);
            if (!cs) break;
            const score = (cs.pos==='fixed'||cs.pos==='absolute'?100:0) + (cs.w*cs.h>8000?50:0) + (cs.pe!=='none'?20:0);
            const key = cs.tag + '|' + cs.zi + '|' + cs.pos;
            const old = out.get(key);
            if (!old || score > old.score) out.set(key, {...cs, score});
          }
        }
      }
    }
    currentList = [...out.values()].sort((a,b)=> (parseInt(b.zi||'0')||0) - (parseInt(a.zi||'0')||0));
    listHead.innerHTML = `<div class="insp-badge">重なり検出リスト（.controls 領域）</div> <span class="insp-dim">count: ${currentList.length}</span>`;
    refreshList();
    LOG.info('inspector', 'scan controls', currentList.map(i=>i.tag+' z='+i.zi+' pe='+i.pe+' pos='+i.pos));
  }

  function neutralizeAll(){
    currentList.forEach(i=>{ i.node.style.pointerEvents='none'; neutralized.add(i.node); });
    refreshList();
  }
  function undoAll(){
    neutralized.forEach(n=>{ try{ n.style.pointerEvents=''; }catch{} });
    neutralized.clear();
    refreshList();
  }

  const toggle = document.querySelector('.insp-toggle');
  toggle.onclick = ()=>{ showing = !showing; panel.classList.toggle('show', showing); if(showing){ renderLive(); } };
  const [btnLive, btnScan, btnKill, btnUndo, btnDump] = panel.querySelectorAll('.btn');
  btnLive.onclick = ()=>{ liveOn = !liveOn; btnLive.textContent = liveOn?'👁 Live':'⏸ Live'; };
  btnScan.onclick = scanControls;
  btnKill.onclick = neutralizeAll;
  btnUndo.onclick = undoAll;
  btnDump.onclick = ()=> {
    const lines = currentList.map(i => `${i.tag} z=${i.zi} pe=${i.pe} pos=${i.pos} op=${i.op} vis=${i.vs} inert=${i.inert} size=${i.w}x${i.h}`);
    LOG.info('inspector', 'dump', lines);
  };

  LOG.info('inspector', 'initialized');
  window.__OMNI_INSPECTOR__ = true;
})();
