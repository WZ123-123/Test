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
      });
      el.addEventListener('dragend',()=>{
        window._dragSize=null;
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

  /* dragover — 无条件 preventDefault，确保任何位置都能触发 drop */
  document.addEventListener('dragover',e=>{
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if(!window._dragSize) return;
    if(!hideGhost||!showGhost) return;

    const sz = window._dragSize || '1x1';
    const _realUnder = document.elementFromPoint(e.clientX, e.clientY);

    const _inFolderGrid = _realUnder?.closest('.folder-grid');
    const _inModalPanel = _realUnder?.closest('.modal-panel');

    _clearNavDragHighlight();
    if(typeof clearShiftPreview==='function') clearShiftPreview();

    if(_inFolderGrid) {
      const gs = ghostSize(sz);
      showGhost(e.clientX - gs.w / 2, e.clientY - gs.h / 2, gs.w, gs.h, gs.r);
      return;
    }

    if(_inModalPanel) {
      hideGhost();
      return;
    }

    hideGhost();
    const deskTarget = _realUnder?.closest('.desk-item');
    if(deskTarget) {
      if(_navDragOver !== deskTarget) {
        _clearNavDragHighlight();
        _navDragOver = deskTarget;
        deskTarget.classList.add('merge-target');
      }
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
    /* folderItem 拖拽已改为 mousedown 自定义实现，HTML5 drop 不再处理 */
    if(!isNavIcon) return;

    /* ---- 落点判断（用坐标）---- */
    const _dropUnder = document.elementFromPoint(e.clientX, e.clientY);
    const targetFolderGrid = _dropUnder?.closest('.folder-grid');
    const targetDeskItem   = !targetFolderGrid && _dropUnder?.closest('.desk-item');
    const inOtherModal     = !targetFolderGrid && !targetDeskItem && _dropUnder?.closest('.modal-panel');

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
    return `<div class="folder-icon-item" data-idx="${idx}">
      <div class="folder-item-body" style="${bg2};display:flex;align-items:center;justify-content:center;overflow:hidden;">
        ${inner}
      </div>
      <div class="folder-item-label">${it.label}</div>
    </div>`;
  }).join('');

  gridEl.querySelectorAll('.folder-icon-item').forEach((el,idx)=>{
    add3D&&add3D(el);

    /* ── 点击打开 ── */
    el.addEventListener('click', ()=>{
      if(el.dataset.wasDragged==='1'){ el.dataset.wasDragged='0'; return; }
      const it=item.items[idx]; if(!it) return;
      if(it.action) handleItemClick(it,pi);
      else if(it.url) window.open(it.url,'_blank');
    });

    /* ── 自定义 mousedown 拖拽（与桌面图标同一套） ── */
    el.addEventListener('mousedown', e=>{
      if(e.button!==0) return;
      e.preventDefault();
      e.stopPropagation(); // 防止触发弹窗拖动

      const folderOverlay = gridEl.closest('.modal-overlay');
      const it = item.items[idx];
      if(!it) return;

      const r = el.getBoundingClientRect();
      // 克隆一个浮动副本跟随鼠标
      const clone = el.cloneNode(true);
      clone.style.cssText=`position:fixed;z-index:9999;pointer-events:none;
        width:${r.width}px;height:${r.height}px;
        left:${r.left}px;top:${r.top}px;
        opacity:0.85;transition:none;`;
      document.body.appendChild(clone);

      // 原图标变暗提示
      el.style.opacity='0.3';

      const ox=e.clientX-r.left, oy=e.clientY-r.top;
      let moved=false, released=false;

      /* 判断是否已离开文件夹弹窗范围 */
      function isOutsideFolder(cx,cy){
        if(!folderOverlay) return true;
        // overlay 是全屏的，要检查实际面板 modal-panel 的边界
        const panel=folderOverlay.querySelector('.modal-panel');
        const fr=(panel||folderOverlay).getBoundingClientRect();
        return cx<fr.left||cx>fr.right||cy<fr.top||cy>fr.bottom;
      }

      /* 获取鼠标下方的目标文件夹 grid（排除源文件夹自身） */
      function getTargetFolderGrid(cx,cy){
        clone.style.pointerEvents='none';
        const under=document.elementFromPoint(cx,cy);
        clone.style.pointerEvents='';
        const tGrid=under?.closest('.folder-grid');
        if(!tGrid) return null;
        const tOverlay=tGrid.closest('.modal-overlay');
        if(!tOverlay||tOverlay===folderOverlay) return null;
        return tGrid;
      }

      let _hoverFolderGrid=null;
      function _clearFolderHover(){
        if(_hoverFolderGrid){
          _hoverFolderGrid.closest('.modal-overlay')?.querySelector('.modal-panel')?.classList.remove('folder-drop-target');
          _hoverFolderGrid=null;
        }
      }

      let _folderDragLastFlip=0;
      function onMove(e2){
        const dx=e2.clientX-e.clientX, dy=e2.clientY-e.clientY;
        if(!moved && dx*dx+dy*dy<16) return;
        moved=true;
        clone.style.left=(e2.clientX-ox)+'px';
        clone.style.top =(e2.clientY-oy)+'px';

        if(isOutsideFolder(e2.clientX,e2.clientY)){
          clone.style.opacity='0.7';

          // 边缘翻页（与桌面拖拽一致，600ms 防抖）
          const now=Date.now();
          if(now-_folderDragLastFlip>600){
            if(e2.clientX<40 && App.curPage>0){
              goPage(App.curPage-1); _folderDragLastFlip=now;
            } else if(e2.clientX>innerWidth-40 && App.curPage<App.pageCount-1){
              goPage(App.curPage+1); _folderDragLastFlip=now;
            }
          }

          // 检查是否悬停在另一个文件夹上
          const tGrid=getTargetFolderGrid(e2.clientX,e2.clientY);
          if(tGrid){
            // 高亮目标文件夹，清除桌面预览
            if(_hoverFolderGrid!==tGrid){
              _clearFolderHover();
              _hoverFolderGrid=tGrid;
              tGrid.closest('.modal-overlay')?.querySelector('.modal-panel')?.classList.add('folder-drop-target');
            }
            if(typeof clearShiftPreview==='function') clearShiftPreview();
            hideGhost&&hideGhost();
          } else {
            // 悬停在桌面上，显示落点预览
            _clearFolderHover();
            const area=getGridArea(App.curPage);
            if(area){
              const ar=area.getBoundingClientRect();
              const pageTop=(App.curPage===0)?GRID_TOP:20;
              const fakeItem={...it, id:'__folder_drag__'};
              const pc=Math.max(0,Math.floor((e2.clientX-ox+r.width/2-ar.left)/(_C()+_G())));
              const pr=Math.max(0,Math.floor((e2.clientY-oy+r.height/2-ar.top-pageTop)/(_C()+_G())));
              if(typeof applyShiftPreview==='function') applyShiftPreview(App.curPage,fakeItem,pc,pr);
              const gs=ghostSize(it.size||'1x1');
              const simResult=simulatePlacement(App.curPage,fakeItem,pc,pr);
              if(simResult){
                showGhost(
                  ar.left+simResult.finalCol*(_C()+_G())+gs.ox,
                  ar.top+pageTop+simResult.finalRow*(_C()+_G())+gs.oy,
                  gs.w,gs.h,gs.r
                );
              }
            }
          }
        } else {
          // 还在源文件夹内：清除所有预览
          _clearFolderHover();
          if(typeof clearShiftPreview==='function') clearShiftPreview();
          hideGhost&&hideGhost();
        }
      }

      function onUp(e2){
        if(released) return;
        released=true;
        document.removeEventListener('mousemove',onMove);
        document.removeEventListener('mouseup',onUp);
        clone.remove();
        el.style.opacity='';
        _clearFolderHover();
        if(typeof clearShiftPreview==='function') clearShiftPreview();
        hideGhost&&hideGhost();

        if(!moved || !isOutsideFolder(e2.clientX,e2.clientY)){
          // 未移动或在文件夹内松手：不做任何事
          return;
        }

        // 已拖出文件夹，执行放置
        el.dataset.wasDragged='1';

        /* ── 落点判断 ── */

        // 1. 落在另一个展开文件夹的 grid 里
        // elementFromPoint 在 clone.remove() 之后调用，clone 不会遮挡
        // 但目标文件夹弹窗的 overlay 背景可能遮住 folder-grid，需穿透查找
        let targetFolderGrid=null;
        {
          const els=document.elementsFromPoint(e2.clientX,e2.clientY);
          for(const el2 of els){
            const fg=el2.closest('.folder-grid');
            if(fg){ targetFolderGrid=fg; break; }
            // 直接命中 folder-grid
            if(el2.classList&&el2.classList.contains('folder-grid')){ targetFolderGrid=el2; break; }
          }
        }
        if(targetFolderGrid){
          const targetOverlay=targetFolderGrid.closest('.modal-overlay');
          if(targetOverlay){
            const destFolderId=targetOverlay.id.replace('folder-inst-','');
            if(destFolderId!==item.id){
              let destFolder=null,destPi=null;
              for(let p=0;p<App.pages.length;p++){
                const f=App.pages[p]?.find(i=>i.id===destFolderId);
                if(f){destFolder=f;destPi=p;break;}
              }
              if(destFolder){
                item.items.splice(idx,1);
                it.id=it.id||('ni'+Date.now());
                if(!destFolder.items.find(i=>i.id===it.id)) destFolder.items.push(it);
                _dissolveFolderIfNeeded(item,pi);
                saveData(); renderAll();
                _refreshFolderOverlay(targetOverlay,destFolder,destPi);
                const srcOverlay=document.getElementById('folder-inst-'+item.id);
                if(srcOverlay&&srcOverlay.classList.contains('open'))
                  _refreshFolderOverlay(srcOverlay,item,pi);
                return;
              }
            }
          }
          return; // 落在同一文件夹，忽略
        }

        // 2. 落在未展开的桌面文件夹/图标上（问题3）：坐标遍历穿透弹窗
        const pageItems=document.querySelectorAll(`.page[data-page="${App.curPage}"] .desk-item`);
        let hitDeskItem=null;
        for(const d of pageItems){
          const dr=d.getBoundingClientRect();
          if(e2.clientX>=dr.left&&e2.clientX<=dr.right&&e2.clientY>=dr.top&&e2.clientY<=dr.bottom){
            hitDeskItem=d; break;
          }
        }
        if(hitDeskItem){
          const tid=hitDeskItem.dataset.id;
          const tpi2=+hitDeskItem.dataset.pi;
          const tItem=App.pages[tpi2]?.find(i=>i.id===tid);
          if(tItem&&tItem.id!==item.id){
            item.items.splice(idx,1);
            it.id=it.id||('ni'+Date.now());
            _dissolveFolderIfNeeded(item,pi);
            doMerge(it,tItem,tpi2);
            const srcOverlay=document.getElementById('folder-inst-'+item.id);
            if(srcOverlay&&srcOverlay.classList.contains('open'))
              _refreshFolderOverlay(srcOverlay,item,pi);
            return;
          }
        }

        // 3. 落在桌面空白处（问题1）
        item.items.splice(idx,1);
        it.id=it.id||('ni'+Date.now());
        const area=getGridArea(App.curPage);
        let pc2=0,pr2=0;
        if(area){
          const ar=area.getBoundingClientRect();
          const pageTop=(App.curPage===0)?GRID_TOP:20;
          pc2=Math.max(0,Math.floor((e2.clientX-ox+r.width/2-ar.left)/(_C()+_G())));
          pr2=Math.max(0,Math.floor((e2.clientY-oy+r.height/2-ar.top-pageTop)/(_C()+_G())));
        }
        const result=placeWithShift(App.curPage,it,pc2,pr2);
        if(!result){alert('本页无空间，请新建分页');item.items.splice(idx,0,it);saveData();renderAll();return;}
        it.col=result.col; it.row=result.row;
        if(!App.pages[App.curPage].find(i=>i.id===it.id))
          App.pages[App.curPage].push(it);
        _dissolveFolderIfNeeded(item,pi);
        saveData(); renderAll();
        const srcOverlay=document.getElementById('folder-inst-'+item.id);
        if(srcOverlay&&srcOverlay.classList.contains('open'))
          _refreshFolderOverlay(srcOverlay,item,pi);
      }

      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    });
  });
}

/* 文件夹解散辅助（纯数据+关闭弹窗，不触发 renderAll） */
function _dissolveFolderIfNeeded(folder,pi){
  if(folder.items.length===1){
    const last=folder.items[0];
    last.col=folder.col; last.row=folder.row;
    App.pages[pi]=App.pages[pi].filter(i=>i.id!==folder.id);
    App.pages[pi].push(last);
    _closeFolderInst('folder-inst-'+folder.id);
  } else if(folder.items.length===0){
    App.pages[pi]=App.pages[pi].filter(i=>i.id!==folder.id);
    _closeFolderInst('folder-inst-'+folder.id);
  }
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
