/* ============================================================
   nav.js
   ============================================================ */

const Nav = {
  curCat:null, netMode:'cn',

  render() {
    const data=NAV_DATA[this.netMode], cats=Object.keys(data);
    if(!this.curCat||!data[this.curCat]) this.curCat=cats[0];
    document.getElementById('nav-sidebar').innerHTML=cats.map(c=>`
      <div class="nav-cat${c===this.curCat?' active':''}" onclick="Nav.setCat('${c}')">${c}</div>`).join('');
    const inp=document.getElementById('nav-search-input');
    if(inp) inp.value='';
    this.renderContent();
  },

  setCat(c) {
    this.curCat=c;
    document.querySelectorAll('.nav-cat').forEach(el=>el.classList.toggle('active',el.textContent===c));
    const inp=document.getElementById('nav-search-input'); if(inp) inp.value='';
    this.renderContent();
  },

  renderContent(filter='') {
    const list=NAV_DATA[this.netMode][this.curCat]||[];
    const kw=filter.trim().toLowerCase();
    const items=kw?list.filter(s=>s.name.toLowerCase().includes(kw)||s.letter.toLowerCase().includes(kw)):list;
    const content=document.getElementById('nav-content'); if(!content) return;
    if(!items.length){content.innerHTML='<div class="nav-empty">没有找到匹配的网站</div>';return;}
    content.innerHTML=`<div class="nav-icon-grid">${items.map(s=>`
      <div class="nav-icon" draggable="true"
           data-url="${s.url}" data-name="${s.name}" data-color="${s.color}" data-letter="${s.letter}">
        <div class="nav-icon-body" style="${Nav._bg(s.color)}">${s.letter.slice(0,3)}</div>
        <div class="nav-icon-label">${s.name}</div>
      </div>`).join('')}
    </div>`;
    content.querySelectorAll('.nav-icon').forEach(el=>{
      add3D&&add3D(el);
      el.addEventListener('click',()=>window.open(el.dataset.url,'_blank'));
      el.addEventListener('dragstart',ev=>{
        ev.dataTransfer.effectAllowed='copy';
        ev.dataTransfer.setData('navIcon',JSON.stringify({
          label:el.dataset.name,color:el.dataset.color,
          letter:el.dataset.letter,url:el.dataset.url}));
        window._dragSize='1x1';
        /* nav 面板置为不可穿透，让 elementFromPoint 能找到背后的文件夹 grid */
        const srcOverlay = el.closest('.modal-overlay');
        if(srcOverlay) {
          srcOverlay._prevPE = srcOverlay.style.pointerEvents;
          srcOverlay.style.pointerEvents = 'none';
          window._dragSrcOverlay = srcOverlay;
        }
      });
      el.addEventListener('dragend',()=>{
        window._dragSize=null;
        if(window._dragSrcOverlay) {
          window._dragSrcOverlay.style.pointerEvents = window._dragSrcOverlay._prevPE || '';
          window._dragSrcOverlay = null;
        }
      });
      el.addEventListener('contextmenu',ev=>{
        ev.preventDefault();ev.stopPropagation();
        const menu=document.getElementById('ctx-menu');
        menu.innerHTML='<div class="ctx-item">➕ 添加到桌面</div>';
        menu.querySelector('.ctx-item').onclick=()=>{
          Nav.addToDesktop(el.dataset.name,el.dataset.color,el.dataset.letter,el.dataset.url);
          hideCtxMenu();
        };
        menu.style.cssText=`display:block;left:${Math.min(ev.clientX,innerWidth-180)}px;top:${Math.min(ev.clientY,innerHeight-80)}px;`;
      });
    });
  },

  _bg(c){ return c.startsWith('linear')||c.startsWith('radial')?`background-image:${c}`:`background:${c}`; },
  onSearch(val){ this.renderContent(val); },

  addToDesktop(name,color,letter,url,size){
    size=size||'1x1';
    const it={id:'ni'+Date.now(),type:'icon',size,label:name,bgClass:'',
      _customBg:color,emoji:letter.slice(0,2),url,col:0,row:0};
    const result=placeWithShift(App.curPage,it,0,0);
    if(!result){alert('本页无空间，请新建分页');return;}
    it.col=result.col;it.row=result.row;
    App.pages[App.curPage].push(it);
    saveData();renderAll();
  },

  switchNet(el){
    this.netMode=el.dataset.net;
    document.querySelectorAll('.net-opt[data-net]').forEach(b=>b.classList.toggle('active',b.dataset.net===this.netMode));
    this.curCat=null;this.render();
  },
};

/* ================================================================
   高亮辅助（dragover 时桌面图标高亮）
   ================================================================ */
let _navDragOver = null;

function _clearNavDragHighlight() {
  if (_navDragOver) {
    _navDragOver.classList.remove('merge-target');
    _navDragOver = null;
  }
}

/* ================================================================
   HTML5 drag 事件
   ================================================================ */
document.addEventListener('DOMContentLoaded',()=>{

  /* dragover */
  document.addEventListener('dragover',e=>{
    e.preventDefault();
    if(!hideGhost||!showGhost) return;

    const sz = window._dragSize || '1x1';

    /* 用坐标判断鼠标实际所在位置（穿透 pointerEvents:none 的源面板） */
    const _srcOverlay = window._dragSrcOverlay;
    /* 临时完全隐藏源面板，让 elementFromPoint 看到背后的元素 */
    if(_srcOverlay) _srcOverlay.style.visibility = 'hidden';
    const _realUnder = document.elementFromPoint(e.clientX, e.clientY);
    if(_srcOverlay) _srcOverlay.style.visibility = '';

    const _inFolderGrid = _realUnder?.closest('.folder-grid');
    const _inModalPanel = _realUnder?.closest('.modal-panel');

    _clearNavDragHighlight();
    if(typeof clearShiftPreview==='function') clearShiftPreview();

    if(_inFolderGrid) {
      /* 鼠标在文件夹 grid 上：Ghost 跟随 */
      e.dataTransfer.dropEffect = 'move';
      const gs = ghostSize(sz);
      showGhost(e.clientX - gs.w / 2, e.clientY - gs.h / 2, gs.w, gs.h, gs.r);
      return;
    }

    if(_inModalPanel) {
      /* 鼠标在其他弹窗内（非文件夹grid）：隐藏Ghost，不做让位 */
      hideGhost();
      return;
    }

    /* 鼠标在桌面区域 */
    hideGhost();
    const under = _realUnder;
    const deskTarget = under?.closest('.desk-item');

    if(deskTarget) {
      if(_navDragOver !== deskTarget) {
        _clearNavDragHighlight();
        _navDragOver = deskTarget;
        deskTarget.classList.add('merge-target');
      }
      hideGhost();
    } else {
      _clearNavDragHighlight();
      const area = getGridArea(App.curPage);
      if(area){
        const ar = area.getBoundingClientRect();
        const pageTop = (App.curPage===0) ? GRID_TOP : 20;
        const fakeItem = {size:sz, id:'__nav_drag__'};
        const pc = Math.max(0, Math.floor((e.clientX-ar.left)/(CELL+GAP)));
        const pr = Math.max(0, Math.floor((e.clientY-ar.top-pageTop)/(CELL+GAP)));
        if(typeof applyShiftPreview==='function') applyShiftPreview(App.curPage, fakeItem, pc, pr);
        const gs = ghostSize(sz);
        showGhost(e.clientX-gs.w/2, e.clientY-gs.h/2, gs.w, gs.h, gs.r);
      } else {
        const gs = ghostSize(sz);
        showGhost(e.clientX-gs.w/2, e.clientY-gs.h/2, gs.w, gs.h, gs.r);
      }
    }
  });

  document.addEventListener('dragleave',e=>{
    if(!e.relatedTarget){ hideGhost&&hideGhost(); _clearNavDragHighlight(); }
  });

  /* ================================================================
     drop 统一处理
     ================================================================ */
  document.addEventListener('drop',e=>{
    hideGhost&&hideGhost();
    _clearNavDragHighlight();
    typeof clearShiftPreview==='function' && clearShiftPreview();

    const isNavIcon   = !!e.dataTransfer.getData('navIcon');
    const isFolderItem= !!e.dataTransfer.getData('folderItem');
    if(!isNavIcon && !isFolderItem) return;

    /* ---- 落点判断：临时隐藏源面板，让 elementFromPoint 穿透到背后的元素 ---- */
    const _srcOv = window._dragSrcOverlay;
    if(_srcOv) _srcOv.style.visibility = 'hidden';
    const _dropUnder = document.elementFromPoint(e.clientX, e.clientY);
    if(_srcOv) _srcOv.style.visibility = '';

    const targetFolderGrid = _dropUnder?.closest('.folder-grid');
    const targetDeskItem   = !targetFolderGrid && _dropUnder?.closest('.desk-item');
    const inOtherModal     = !targetFolderGrid && !targetDeskItem && _dropUnder?.closest('.modal-panel');

    /* 落点确定后再恢复源面板 pointer-events */
    if(window._dragSrcOverlay) {
      window._dragSrcOverlay.style.pointerEvents = window._dragSrcOverlay._prevPE || '';
      window._dragSrcOverlay = null;
    }

    if(inOtherModal) return; // 落在非文件夹弹窗 → 取消

    /* ================================================================
       A. navIcon 拖拽
       ================================================================ */
    if(isNavIcon) {
      e.preventDefault();
      const d=JSON.parse(e.dataTransfer.getData('navIcon'));

      /* A1. 落在展开文件夹的 grid 里 — 问题5/6：用 overlay id 精确定位文件夹 */
      if(targetFolderGrid) {
        const overlayEl = targetFolderGrid.closest('.modal-overlay');
        if(overlayEl) {
          const folderId = overlayEl.id.replace('folder-inst-','');
          let targetFolder=null, targetPi=null;
          for(let pi=0;pi<App.pages.length;pi++){
            const f=App.pages[pi]?.find(i=>i.id===folderId);
            if(f){targetFolder=f;targetPi=pi;break;}
          }
          if(targetFolder) {
            /* 问题5：防止重复添加（用url去重） */
            if(!targetFolder.items.find(i=>i.url===d.url)){
              const _fi1={id:'ni'+Date.now(),type:'icon',size:'1x1',
                label:d.label,bgClass:'',_customBg:d.color,
                emoji:d.letter.slice(0,2),url:d.url,col:0,row:0};
              if(d.favicon) _fi1._favicon=d.favicon;
              targetFolder.items.push(_fi1);
            }
            saveData(); renderAll();
            _refreshFolderOverlay(overlayEl, targetFolder, targetPi);
          }
        }
        return;
      }

      const newIt={id:'ni'+Date.now(),type:'icon',size:'1x1',label:d.label,
        bgClass:'',_customBg:d.color,emoji:d.letter.slice(0,2),url:d.url,col:0,row:0};
      if(d.favicon) newIt._favicon=d.favicon;

      /* A2. 落在桌面图标/文件夹上 → 合并 */
      if(targetDeskItem){
        const tid=targetDeskItem.dataset.id, tpi=+targetDeskItem.dataset.pi;
        const tItem=App.pages[tpi]?.find(i=>i.id===tid);
        if(tItem){ doMerge(newIt,tItem,tpi); return; }
      }

      /* A3. 落在桌面空白处 */
      const area=getGridArea(App.curPage);
      let pc=0,pr=0;
      if(area){
        const ar=area.getBoundingClientRect();
        const gs=ghostSize('1x1');
        pc=Math.max(0,Math.floor((e.clientX-gs.w/2-ar.left)/(CELL+GAP)));
        pr=Math.max(0,Math.floor((e.clientY-gs.h/2-ar.top-GRID_TOP)/(CELL+GAP)));
      }
      const r=placeWithShift(App.curPage,newIt,pc,pr);
      if(!r){alert('本页无空间，请新建分页');return;}
      newIt.col=r.col;newIt.row=r.row;
      App.pages[App.curPage].push(newIt);
      saveData();renderAll();
      return;
    }

    /* ================================================================
       B. folderItem 拖拽（从展开文件夹拖出）
       ================================================================ */
    if(isFolderItem) {
      e.preventDefault();
      const fraw=e.dataTransfer.getData('folderItem');
      const {idx, folderId, pi}=JSON.parse(fraw);
      const srcFolder=App.pages[pi]?.find(i=>i.id===folderId); if(!srcFolder) return;
      const it=srcFolder.items[idx]; if(!it) return;

      /* B1. 落在另一个展开文件夹的 grid 里 — 问题4 */
      if(targetFolderGrid) {
        const overlayEl=targetFolderGrid.closest('.modal-overlay');
        if(overlayEl){
          const destFolderId=overlayEl.id.replace('folder-inst-','');
          if(destFolderId===folderId) return; // 同一文件夹，忽略
          let destFolder=null, destPi=null;
          for(let p2=0;p2<App.pages.length;p2++){
            const f=App.pages[p2]?.find(i=>i.id===destFolderId);
            if(f){destFolder=f;destPi=p2;break;}
          }
          if(destFolder){
            srcFolder.items.splice(idx,1);
            if(!destFolder.items.find(i=>i.id===it.id)) destFolder.items.push(it);
            /* 先刷新/关闭源文件夹 */
            dissolveFolderIfNeeded(srcFolder, pi);
            saveData(); renderAll();
            /* 刷新目标文件夹弹窗 */
            _refreshFolderOverlay(overlayEl, destFolder, destPi);
          }
        }
        return;
      }

      /* B2. 落在桌面图标/文件夹上 → 从源文件夹移除（移动），合并到目标 */
      if(targetDeskItem){
        const tid=targetDeskItem.dataset.id, tpi2=+targetDeskItem.dataset.pi;
        const tItem=App.pages[tpi2]?.find(i=>i.id===tid);
        if(tItem&&tItem.id!==folderId){
          srcFolder.items.splice(idx,1);
          it.id=it.id||('ni'+Date.now());
          dissolveFolderIfNeeded(srcFolder, pi);
          /* 刷新源文件夹弹窗（移除残留） */
          _refreshOpenFolderOverlay(srcFolder, pi);
          doMerge(it, tItem, tpi2);
          return;
        }
      }

      /* B3. 落在桌面空白处 → 从源文件夹移除（真正移动），放到桌面 */
      srcFolder.items.splice(idx,1);
      it.id=it.id||('ni'+Date.now());
      const area2=getGridArea(App.curPage);
      let pc2=0,pr2=0;
      if(area2){
        const ar2=area2.getBoundingClientRect();
        const gs2=ghostSize(it.size||'1x1');
        pc2=Math.max(0,Math.floor((e.clientX-gs2.w/2-ar2.left)/(CELL+GAP)));
        pr2=Math.max(0,Math.floor((e.clientY-gs2.h/2-ar2.top-GRID_TOP)/(CELL+GAP)));
      }
      const result=placeWithShift(App.curPage,it,pc2,pr2);
      if(!result){alert('本页无空间，请新建分页');saveData();renderAll();return;}
      it.col=result.col;it.row=result.row;
      /* 先把 it 加入桌面，再处理源文件夹解散（避免dissolve重复push） */
      if(!App.pages[App.curPage].find(i=>i.id===it.id))
        App.pages[App.curPage].push(it);
      /* 先保存到桌面，再处理源文件夹（避免dissolve重复push） */
      dissolveFolderIfNeeded(srcFolder, pi);
      saveData(); renderAll();
      /* 刷新源文件夹弹窗（如果还开着），移除残留图标 */
      _refreshOpenFolderOverlay(srcFolder, pi);
    }
  });

  /* 导航搜索 */
  document.getElementById('nav-search-input')?.addEventListener('input',function(){Nav.onSearch(this.value);});
  document.getElementById('nav-search-input')?.addEventListener('keydown',e=>{
    if(e.key==='Enter'){const f=document.querySelector('#nav-content .nav-icon');if(f)window.open(f.dataset.url,'_blank');}
  });
  document.getElementById('nav-search-btn')?.addEventListener('click',()=>{
    const f=document.querySelector('#nav-content .nav-icon');if(f)window.open(f.dataset.url,'_blank');
  });
});

/* ================================================================
   文件夹解散辅助
   ================================================================ */
function dissolveFolderIfNeeded(folder,pi){
  if(folder.items.length===1){
    const last=folder.items[0];
    last.col=folder.col; last.row=folder.row;
    App.pages[pi]=App.pages[pi].filter(i=>i.id!==folder.id);
    App.pages[pi].push(last);
    _closeFolderInst('folder-inst-'+folder.id);
  } else if(folder.items.length===0){
    App.pages[pi]=App.pages[pi].filter(i=>i.id!==folder.id);
    _closeFolderInst('folder-inst-'+folder.id);
  } else {
    /* 还有多个图标：只刷新弹窗显示，不关闭 */
    _refreshOpenFolderOverlay(folder, pi);
  }
}

/* 刷新所有打开的文件夹弹窗（DOM和数据同步） */
function _refreshOpenFolderOverlay(folder, pi) {
  const overlay = document.getElementById('folder-inst-' + folder.id);
  if (overlay && overlay.classList.contains('open')) {
    _refreshFolderOverlay(overlay, folder, pi);
  }
}

/* ================================================================
   文件夹弹窗 — 每个文件夹独立实例，支持同时打开多个
   ================================================================ */
let _curFolder=null, _curFolderPi=null;

function openFolderModal(item, pi) {
  _curFolder=item; _curFolderPi=pi;
  const existId='folder-inst-'+item.id;
  let overlay=document.getElementById(existId);

  if(overlay){
    _refreshFolderOverlay(overlay, item, pi);
    Modal.open(existId);
    return;
  }

  /* 克隆模板 */
  const tpl=document.getElementById('folder-overlay');
  overlay=tpl.cloneNode(true);
  overlay.id=existId;
  overlay.querySelector('.tl-y').setAttribute('onclick',`Modal.minimize('${existId}')`);
  overlay.querySelector('.tl-g').setAttribute('onclick',`Modal.maximize('${existId}')`);
  overlay.querySelector('.tl-r').setAttribute('onclick',`_closeFolderInst('${existId}')`);
  overlay.querySelector('.st-btn').setAttribute('onclick',`_saveFolderName('${existId}')`);
  /* 去掉模板 id，避免 id 冲突 */
  overlay.querySelector('[id="folder-name-inp"]')?.removeAttribute('id');
  overlay.querySelector('[id="folder-title"]')?.removeAttribute('id');
  overlay.querySelector('[id="folder-grid"]')?.removeAttribute('id');
  document.body.appendChild(overlay);

  _refreshFolderOverlay(overlay, item, pi);

  /* 接受拖拽：整个overlay都preventDefault，让浏览器允许drop */
  overlay.addEventListener('dragover',e=>{
    e.preventDefault();
    /* 不 stopPropagation，让全局 dragover 统一处理 Ghost 和 dropEffect */
    e.dataTransfer.dropEffect = e.target.closest('.folder-grid') ? 'move' : 'none';
  });

  Modal.open(existId);
}

/* 刷新弹窗内容（标题+grid） */
function _refreshFolderOverlay(overlay, item, pi){
  const titleEl=overlay.querySelector('.modal-title');
  const nameInp=overlay.querySelector('.folder-name-bar input');
  const gridEl =overlay.querySelector('.folder-grid');
  if(titleEl) titleEl.textContent=item.label;
  if(nameInp) nameInp.value=item.label;
  if(gridEl)  _renderFolderGridEl(gridEl, item, pi);
}

/* 渲染文件夹内图标列表 */
function _renderFolderGridEl(gridEl, item, pi){
  gridEl.innerHTML=(item.items||[]).map((it,idx)=>{
    const bs2=getBgStyle(it.bgClass,it._customBg);
    const inner=it._favicon
      ? `<img src="${it._favicon}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:10px;"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:18px;">${it.emoji||it.label.slice(0,2)}</span>`
      : `<span style="font-size:18px;">${it.emoji||it.label.slice(0,2)}</span>`;
    const bg2=it._favicon?'background:rgba(255,255,255,0.88);':bs2;
    return `<div class="folder-icon-item" data-idx="${idx}" draggable="true">
      <div class="folder-item-body" style="${bg2};display:flex;align-items:center;justify-content:center;overflow:hidden;">
        ${inner}
      </div>
      <div class="folder-item-label">${it.label}</div>
    </div>`;
  }).join('');
  gridEl.querySelectorAll('.folder-icon-item').forEach((el,idx)=>{
    add3D&&add3D(el);
    el.addEventListener('click',()=>{
      const it=item.items[idx];if(!it)return;
      if(it.action) handleItemClick(it,pi);
      else if(it.url) window.open(it.url,'_blank');
    });
    el.addEventListener('dragstart',ev=>{
      ev.dataTransfer.effectAllowed='move';
      const it2=item.items[idx];
      ev.dataTransfer.setData('folderItem',JSON.stringify({idx,folderId:item.id,pi}));
      window._dragSize=(it2&&it2.size)||'1x1';
      /* 拖动时源文件夹 overlay 不拦截鼠标，让目标文件夹能收到 dragover */
      const srcOverlay = el.closest('.modal-overlay');
      if(srcOverlay) {
        srcOverlay._prevPE = srcOverlay.style.pointerEvents;
        srcOverlay.style.pointerEvents = 'none';
        window._dragSrcOverlay = srcOverlay;
      }
    });
    el.addEventListener('dragend',()=>{
      window._dragSize=null;
      hideGhost&&hideGhost();
      _clearNavDragHighlight&&_clearNavDragHighlight();
      /* 恢复源文件夹 pointer-events */
      if(window._dragSrcOverlay) {
        window._dragSrcOverlay.style.pointerEvents = window._dragSrcOverlay._prevPE || '';
        window._dragSrcOverlay = null;
      }
    });
  });
}

function _closeFolderInst(id){
  Modal.close(id);
  setTimeout(()=>{ document.getElementById(id)?.remove(); },300);
}

function _saveFolderName(overlayId){
  const overlay=document.getElementById(overlayId); if(!overlay) return;
  const nameInp=overlay.querySelector('.folder-name-bar input');
  const titleEl=overlay.querySelector('.modal-title');
  const folderId=overlayId.replace('folder-inst-','');
  let targetItem=null;
  for(const page of App.pages){
    targetItem=(page||[]).find(i=>i.id===folderId);
    if(targetItem) break;
  }
  if(!targetItem) return;
  targetItem.label=nameInp.value.trim()||'文件夹';
  if(titleEl) titleEl.textContent=targetItem.label;
  saveData(); renderAll();
}

/* 兼容旧调用 */
function renderFolderGrid(){
  if(!_curFolder) return;
  const overlay=document.getElementById('folder-inst-'+_curFolder.id);
  if(overlay) _refreshFolderOverlay(overlay,_curFolder,_curFolderPi);
}

function _closeFolder(item){
  _closeFolderInst('folder-inst-'+(item&&item.id||''));
}

function saveFolderName(){
  if(!_curFolder) return;
  _curFolder.label=document.querySelector('#folder-overlay .folder-name-bar input')?.value.trim()||'文件夹';
  saveData(); renderAll();
}
