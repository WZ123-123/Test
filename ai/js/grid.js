/* ============================================================
   grid.js — _C()/_G() 已在 data.js 声明
   ============================================================ */

/* GRID_TOP 响应式：移动端缩小，桌面端保持原值 */
function getGridTop() {
  return innerWidth <= 768 ? 170 : 310;
}
/* 兼容旧代码引用 GRID_TOP 的地方，保持为常量但通过 getter 覆盖 */
let GRID_TOP = getGridTop();
window.addEventListener('resize', () => { GRID_TOP = getGridTop(); });

const SIZES = { '1x1':{cols:1,rows:1}, '2x1':{cols:2,rows:1}, '2x2':{cols:2,rows:2} };
/* ── 动态尺寸 getter，调图标大小时实时生效 ── */
function _C() { return (typeof IconSettings !== 'undefined' ? IconSettings.get().size : null) || window.CELL || CELL; }
function _G() { return (typeof IconSettings !== 'undefined' ? IconSettings.get().gap  : null) || window.GAP  || GAP;  }
function _R() { return (typeof IconSettings !== 'undefined') ? IconSettings.get().radius : 18; }



function cellPx(n) { return n * _C() + (n - 1) * _G(); }
function itemW(it) { return cellPx(SIZES[it.size].cols); }
function itemH(it) { return cellPx(SIZES[it.size].rows); }

/* 屏幕可容纳的最大列/行数，maxCols 要扣除左侧 offset，避免图标超出屏幕右边缘 */
function maxCols() {
  /* grid area 整体居中，列数按全屏宽度计算 */
  return Math.floor((innerWidth + _G()) / (_C() + _G()));
}
function maxRows(pi) {
  /* 不限制行数，支持滚动；返回足够大的值 */
  return 999;
}

let _curOffset = 0; // 当次 renderAll 使用的 offset，由 renderAll 开头更新

/* 动态居中：用当前屏幕实际能放的列数来计算对称 offset
   这样任何屏幕宽度下左右空白都相等 */
/* 默认布局总宽度（含左侧预留空列）：
   LEFT_PAD_COLS 列空白在左，DEFAULT_LAYOUT_COLS 列内容在右
   两者之和用于居中计算，使左右空白严格对称               */
const DEFAULT_LAYOUT_COLS = 13;
const LEFT_PAD_COLS        = 0;
const TOTAL_COLS           = DEFAULT_LAYOUT_COLS + LEFT_PAD_COLS; // 15

function calcGridOffset() {
  /* LEFT_PAD_COLS=0，图标从 col=0 开始，最右图标 col=9（1x1）右边缘=10格
     令左空白=右空白：2*offset = innerWidth - 10*(C+G) + G
     即 offset = (innerWidth - 10*(C+G) + G) / 2                        */
  return Math.max(0, Math.floor((innerWidth - 10 * (_C() + _G()) + _G()) / 2));
}

/* 首次加载默认布局时把所有图标 col 向右偏移 LEFT_PAD_COLS */
function applyLeftPadToLayout(pages) {
  pages.forEach(page => (page||[]).forEach(it => {
    it.col = (it.col || 0) + LEFT_PAD_COLS;
  }));
}

window.addEventListener('resize', () => {
  if (typeof renderAll === 'function') renderAll();
});

/* 数据坐标：col 从 0 开始，不含视觉偏移 */
function itemX(it)  { return it.col * (_C() + _G()); }
function itemY(it, pi)  {
  /* 第0页保留GRID_TOP给标题搜索框，其他页从顶部留小间距即可 */
  const top = (pi === undefined || pi === 0) ? GRID_TOP : 20;
  return top + it.row * (_C() + _G());
}

/* ================================================================
   渲染
   ================================================================ */
function clampAllPages() {
  /* 把所有页面图标的 col/row 约束在当前屏幕范围内（修改原始数据） */
  const MC = Math.floor((innerWidth - calcGridOffset() + _G()) / (_C() + _G()));
  for (let pi = 0; pi < App.pageCount; pi++) {
    (App.pages[pi] || []).forEach(item => {
      const sz = SIZES[item.size] || SIZES['1x1'];
      if (item.col + sz.cols > MC) item.col = Math.max(0, MC - sz.cols);
    });
  }
}

function renderAll() {
  /* 每次渲染前更新响应式 GRID_TOP 和 offset */
  GRID_TOP = getGridTop();
  _curOffset = calcGridOffset();
  /* 同步 CSS 变量，让 #page-header 高度和 GRID_TOP 一致 */
  document.documentElement.style.setProperty('--grid-top', GRID_TOP + 'px');
  for (let pi = 0; pi < App.pageCount; pi++) {
    ensurePageDOM(pi);
    renderPage(pi);
  }
  renderDots();
  applyPageTransform(App.curPage, false);
}

function ensurePageDOM(pi) {
  if (document.querySelector(`.page[data-page="${pi}"]`)) return;
  const wrap = document.getElementById('pages-wrap');
  const div = document.createElement('div');
  div.className = 'page'; div.dataset.page = pi;
  div.innerHTML = `<div class="grid-area" id="grid-area-${pi}"></div>`;
  wrap.appendChild(div);
}

function getGridArea(pi) {
  return pi===0 ? document.getElementById('grid-area')
                : document.getElementById(`grid-area-${pi}`);
}

function renderPage(pi) {
  const area = getGridArea(pi); if (!area) return;
  area.innerHTML = '';
  const MC = maxCols(), MR = maxRows(pi);
  /* 小屏时把大尺寸图标缩为1x1，避免放不下 */
  const placed = [];
  (App.pages[pi]||[]).forEach(item => {
    /* 视觉尺寸：屏幕太窄时降级为1x1 */
    const origSize = item.size;
    const sz0 = SIZES[origSize] || SIZES['1x1'];
    /* 尺寸超出屏幕列数时降级为1x1 */
    const dispSize = (sz0.cols > MC) ? '1x1' : origSize;
    const sz = SIZES[dispSize];
    /* 目标位置：clamp 到屏幕范围内 */
    const tc0 = Math.min(Math.max(0, item.col), Math.max(0, MC - sz.cols));
    const tr0 = Math.min(Math.max(0, item.row), Math.max(0, MR - sz.rows));
    let dc = tc0, dr = tr0;
    let found = false;
    outer: for (let tr = tr0; tr <= Math.max(tr0, MR - sz.rows); tr++) {
      for (let tc = (tr === tr0 ? tc0 : 0); tc <= Math.max(0, MC - sz.cols); tc++) {
        const hit = placed.some(p => {
          const ps = SIZES[p.sz]||SIZES['1x1'];
          return !(tc>=p.dc+ps.cols||tc+sz.cols<=p.dc||tr>=p.dr+ps.rows||tr+sz.rows<=p.dr);
        });
        if (!hit) { dc=tc; dr=tr; found=true; break outer; }
      }
    }
    if (!found) {
      outer2: for (let tr = 0; tr < MR; tr++) {
        for (let tc = 0; tc <= Math.max(0, MC - sz.cols); tc++) {
          const hit = placed.some(p => {
            const ps = SIZES[p.sz]||SIZES['1x1'];
            return !(tc>=p.dc+ps.cols||tc+sz.cols<=p.dc||tr>=p.dr+ps.rows||tr+sz.rows<=p.dr);
          });
          if (!hit) { dc=tc; dr=tr; found=true; break outer2; }
        }
      }
    }
    placed.push({dc, dr, sz: dispSize});
    const displayItem = {...item, col: dc, row: dr, size: dispSize};
    const el = createItemEl(item, pi); /* 事件绑定原始item */
    positionEl(el, displayItem, pi);
    /* 小屏降级时更新DOM的size class */
    if (dispSize !== origSize) {
      el.className = el.className.replace(/size-\S+/, `size-${dispSize}`);
    }
    area.appendChild(el);
  });
  area.style.left = _curOffset + 'px';
  /* 根据最大行号设置 grid-area 实际高度，撑开 pages-wrap 滚动区域 */
  const pageTop0 = (pi === 0) ? GRID_TOP : 20;
  let maxRow = 0;
  placed.forEach(p => {
    const ps = SIZES[p.sz]||SIZES['1x1'];
    maxRow = Math.max(maxRow, p.dr + ps.rows);
  });
  const areaH = pageTop0 + maxRow * (_C() + _G()) + 80;
  area.style.height = areaH + 'px';
  /* 移动端：grid-area 是 absolute，需要手动设置 .page min-height 让其可滚动 */
  const pageEl = area.closest('.page');
  if (pageEl) pageEl.style.minHeight = areaH + 'px';
  area.querySelectorAll('.desk-item').forEach(add3D);
}
function positionEl(el, item, pi) {
  el.style.left   = itemX(item) + 'px';
  el.style.top    = itemY(item, pi) + 'px';
  el.style.width  = itemW(item) + 'px';
  el.style.height = itemH(item) + 'px';
}

/* ================================================================
   构建图标 HTML
   ================================================================ */
function createItemEl(item, pi) {
  const el = document.createElement('div');
  el.className = `desk-item size-${item.size}`;
  el.dataset.id = item.id; el.dataset.pi = pi;
  el.innerHTML = buildItemHTML(item);
  el.addEventListener('click', e => {
    if (el.dataset.wasDragged==='1') { el.dataset.wasDragged='0'; return; }
    handleItemClick(item, pi);
  });
  el.addEventListener('contextmenu', e => { e.preventDefault(); showCtxMenu(e,item,pi); });
  setupDrag(el, item, pi);
  return el;
}

function buildItemHTML(item) {
  const bs = getBgStyle(item.bgClass, item._customBg);
  const shine = '<div class="item-shine"></div>';
  if (item.type==='folder') {
    const cells=(item.items||[]).slice(0,4).map(s=>{
      if(s._favicon && s._favicon.startsWith('http')){
        return `<div class="folder-cell" style="background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;overflow:hidden;">
          <img src="${s._favicon}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:4px;"
               onerror="this.parentNode.style.background='${getBgStyle(s.bgClass,s._customBg).replace('background:','').replace('background-image:','')}';this.remove();">
        </div>`;
      }
      const em=s.emoji||'';
      if(em){
        return `<div class="folder-cell" style="${getBgStyle(s.bgClass,s._customBg)};display:flex;align-items:center;justify-content:center;font-size:13px;">${em}</div>`;
      }
      return `<div class="folder-cell" style="${getBgStyle(s.bgClass,s._customBg)}"></div>`;
    }).join('');
    return `<div class="item-body folder-body-wrap">${shine}
              <div class="folder-grid-inner">${cells}</div></div>
            <div class="item-label">${item.label}</div>`;
  }
  if (item.size==='1x1') {
    if (item._favicon && item._favicon.startsWith('http')) {
      const fallbackEmoji = item.emoji || item.label.slice(0,2);
      return `<div class="item-body favicon-body" style="background:rgba(255,255,255,0.88);">${shine}
                <img class="item-favicon-img" src="${item._favicon}" alt=""
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div class="item-emoji" style="display:none;">${fallbackEmoji}</div>
              </div>
              <div class="item-label">${item.label}</div>`;
    }
    return `<div class="item-body" style="${bs}">${shine}
              <div class="item-emoji">${item.emoji||item.label.slice(0,2)}</div></div>
            <div class="item-label">${item.label}</div>`;
  }
  if (item.size==='2x1') {
    return `<div class="item-body row-body" style="${bs}">${shine}
              <div class="item-emoji large">${item.emoji||''}</div>
              <div class="item-label-inline">${item.label}</div></div>
            <div class="item-label">${item.label}</div>`;
  }
  return `<div class="item-body widget-body" style="${bs}">${shine}${buildWidget(item)}</div>
          <div class="item-label">${item.label}</div>`;
}

function buildWidget(item) {
  if (item.action==='weather') return `
    <div class="w-icon-top">⛅</div><div class="w-temp">23°</div>
    <div class="w-desc">多云</div><div class="w-city">北京 · 今日</div>
    <div class="w-week">
      <div class="w-day">周一<b>22°</b></div>
      <div class="w-day">周二<b>25°</b></div>
      <div class="w-day">周三<b>20°</b></div>
    </div><div class="w-footer-lbl">天气</div>`;
  if (item.action==='hotspot') return `
    <div class="hs-badge">点击查看</div><div class="hs-img">📰</div>
    <div class="hs-title">· AI大模型最新进展<br>· 今日科技热点</div>
    <div class="hs-sub">今日热点</div>`;
  if (item.action==='ai') return `
    <div class="ai-logo-box">🤖</div><div class="ai-label-text">开启对话</div>`;
  return `<div class="item-emoji large">${item.emoji||''}</div>`;
}

/* ================================================================
   点击
   ================================================================ */
function handleItemClick(item, pi) {
  if      (item.action==='nav')      Modal.open('nav-overlay');
  else if (item.action==='note')     Modal.open('note-overlay');
  else if (item.action==='draw')     Modal.open('draw-overlay');
  else if (item.action==='ai')       Modal.open('ai-overlay');
  else if (item.action==='weather')  Modal.open('weather-overlay');
  else if (item.action==='settings') Modal.open('settings-overlay');
  else if (item.action==='calc')     { Modal.open('calc-overlay'); Calc.init(); }
  else if (item.action==='hotspot')  window.open('https://www.baidu.com/s?wd=今日热点','_blank');
  else if (item.type==='folder')     openFolderModal(item, pi);
  else if (item.url)                 window.open(item.url,'_blank');
}

/* ================================================================
   Ghost（放置预览框）
   ================================================================ */
let _ghost = null;
function ensureGhost() {
  if (_ghost) return _ghost;
  _ghost = document.createElement('div');
  _ghost.style.cssText = `position:fixed;pointer-events:none;z-index:8999;
    border:2px dashed rgba(255,255,255,.8);
    background:rgba(255,255,255,.12);
    box-shadow:0 0 0 1px rgba(255,255,255,.3),0 0 16px rgba(255,255,255,.2);
    display:none;transition:none;`;
  document.body.appendChild(_ghost);
  return _ghost;
}
function showGhost(x, y, w, h, radius) {
  const g = ensureGhost();
  g.style.borderRadius = (radius||16) + 'px';
  g.style.left   = x + 'px'; g.style.top    = y + 'px';
  g.style.width  = w + 'px'; g.style.height = h + 'px';
  g.style.display = 'block';
}
function hideGhost() { if (_ghost) _ghost.style.display='none'; }

/* Ghost 尺寸：与 CSS item-body 缩放一致 */
function ghostSize(size) {
  const r = _R();
  if (size==='1x1') return {w:_C()*0.78,  h:_C()*0.78,  ox:_C()*0.11, oy:_C()*0.11, r};
  if (size==='2x1') return {w:itemW({size:'2x1'})*0.96, h:itemH({size:'2x1'})*0.72, ox:itemW({size:'2x1'})*0.02, oy:itemH({size:'2x1'})*0.04, r};
  /* 2x2 */         return {w:itemW({size:'2x2'})*0.96, h:itemH({size:'2x2'})*0.88, ox:itemW({size:'2x2'})*0.02, oy:itemH({size:'2x2'})*0.02, r};
}

/* ================================================================
   拖拽 — 桌面逻辑
   ================================================================ */
let drag = null;

function setupDrag(el, item, pi) {
  el.addEventListener('mousedown', e => {
    if (e.button!==0) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    drag = { item, pi, el,
      ox:e.clientX-r.left, oy:e.clientY-r.top,
      startX:e.clientX, startY:e.clientY,
      moved:false, mergeTimer:null, mergeTargetId:null };
  });
}

document.addEventListener('mousemove', e => {
  if (!drag) return;
  const dx=e.clientX-drag.startX, dy=e.clientY-drag.startY;
  if (!drag.moved && dx*dx+dy*dy<25) return;

  if (!drag.moved) {
    drag.moved = true;
    drag.el.classList.add('is-dragging');
    drag.el.dataset.wasDragged = '1';
    document.body.appendChild(drag.el);
    drag.el.style.cssText = `position:fixed;margin:0;z-index:9000;
      width:${itemW(drag.item)}px;height:${itemH(drag.item)}px;
      transition:none;pointer-events:none;overflow:visible;`;
  }

  drag.el.style.left = (e.clientX-drag.ox)+'px';
  drag.el.style.top  = (e.clientY-drag.oy)+'px';

  // 翻页边缘（防抖：300ms内不重复翻页）
  const now = Date.now();
  if (!drag._lastFlip) drag._lastFlip = 0;
  if (now - drag._lastFlip > 600) {
    if (e.clientX < 30 && App.curPage > 0) {
      goPage(App.curPage - 1); drag._lastFlip = now;
    } else if (e.clientX > innerWidth - 30 && App.curPage < App.pageCount - 1) {
      goPage(App.curPage + 1); drag._lastFlip = now;
    }
  }

  // 计算落点
  const area = getGridArea(App.curPage);
  if (area) {
    const ar = area.getBoundingClientRect();
    const cx = e.clientX - drag.ox + itemW(drag.item)/2;
    const cy = e.clientY - drag.oy + itemH(drag.item)/2;
    const pageTop = (App.curPage === 0) ? GRID_TOP : 20;
    const pc = Math.max(0, Math.floor((cx-ar.left)/(_C()+_G())));
    const pr = Math.max(0, Math.floor((cy-ar.top-pageTop)/(_C()+_G())));

    // 让位预览
    applyShiftPreview(App.curPage, drag.item, pc, pr);

    // Ghost：用 simulatePlacement 算出实际落点，白框与松手位置完全一致
    const simResult = simulatePlacement(App.curPage, drag.item, pc, pr);
    if (simResult && !drag.mergeTargetId) {
      const gs = ghostSize(drag.item.size);
      const gx = ar.left + simResult.finalCol*(_C()+_G()) + gs.ox;
      const gy = ar.top  + pageTop + simResult.finalRow*(_C()+_G()) + gs.oy;
      showGhost(gx, gy, gs.w, gs.h, gs.r);
    } else {
      hideGhost();
    }
  }

  // 合并检测（悬停1秒）
  drag.el.style.pointerEvents='none';
  const under = document.elementFromPoint(e.clientX, e.clientY);
  drag.el.style.pointerEvents='';
  const targetEl = under ? under.closest('.desk-item') : null;

  // 清除上一个 merge-target 高亮
  if (drag.mergeTargetId) {
    const old = document.querySelector(`.desk-item[data-id="${drag.mergeTargetId}"]`);
    if (old) old.classList.remove('merge-target');
  }

  if (targetEl && targetEl!==drag.el) {
    const tid   = targetEl.dataset.id;
    const tpi   = +targetEl.dataset.pi;
    const tItem = App.pages[tpi]?.find(i=>i.id===tid);
    if (tItem && tid!==drag.item.id) {
      /* 问题3：文件夹拖到文件夹也可以合并，无需过滤 */
      targetEl.classList.add('merge-target');
      hideGhost();
      if (drag.mergeTargetId!==tid) {
        drag.mergeTargetId=tid;
        const snap=tItem, snapPi=tpi;
        clearTimeout(drag.mergeTimer);
        drag.mergeTimer=setTimeout(()=>{
          if(!drag||drag.mergeTargetId!==tid) return;
          const si=drag.item; finalizeDrag();
          doMerge(si, snap, snapPi);
        }, 1000);
      }
    }
  } else {
    clearTimeout(drag.mergeTimer);
    drag.mergeTimer=null; drag.mergeTargetId=null;
  }
});

document.addEventListener('mouseup', e => {
  if (!drag) return;
  clearTimeout(drag.mergeTimer);
  document.querySelectorAll('.merge-target').forEach(el=>el.classList.remove('merge-target'));
  clearShiftPreview();
  hideGhost();
  if (!drag.moved) { drag=null; return; }

  /* 检查是否落在展开文件夹的 grid 上 */
  drag.el.style.pointerEvents = 'none';
  const underEl = document.elementFromPoint(e.clientX, e.clientY);
  drag.el.style.pointerEvents = '';
  const targetFolderGrid = underEl?.closest('.folder-grid');
  if (targetFolderGrid) {
    const overlayEl = targetFolderGrid.closest('.modal-overlay');
    if (overlayEl) {
      const folderId = overlayEl.id.replace('folder-inst-','');
      let targetFolder=null, targetPi=null;
      for (let p=0; p<App.pages.length; p++) {
        const f = App.pages[p]?.find(i=>i.id===folderId);
        if (f) { targetFolder=f; targetPi=p; break; }
      }
      if (targetFolder && drag.item.id !== folderId) {
        /* 从桌面移入文件夹 */
        App.pages[drag.pi] = App.pages[drag.pi].filter(i=>i.id!==drag.item.id);
        if (!targetFolder.items.find(i=>i.id===drag.item.id))
          targetFolder.items.push(drag.item);
        finalizeDrag();
        /* 刷新文件夹弹窗 */
        if (typeof _refreshFolderOverlay === 'function')
          _refreshFolderOverlay(overlayEl, targetFolder, targetPi);
        return;
      }
    }
  }

  const pi   = App.curPage;
  const area = getGridArea(pi);
  const ar   = area?.getBoundingClientRect();

  if (ar) {
    const cx = e.clientX-drag.ox+itemW(drag.item)/2;
    const cy = e.clientY-drag.oy+itemH(drag.item)/2;
    const pageTop2 = (pi === 0) ? GRID_TOP : 20;
    let pc = Math.max(0, Math.floor((cx-ar.left)/(_C()+_G())));
    let pr = Math.max(0, Math.floor((cy-ar.top-pageTop2)/(_C()+_G())));
    if (e.clientY-drag.oy < ar.top+pageTop2) pr=0;

    /* 问题1：确保落点在屏幕范围内 */
    const MC = maxCols(), MR = maxRows(App.curPage);
    const sz = SIZES[drag.item.size];
    pc = Math.min(pc, Math.max(0, MC - sz.cols));
    pr = Math.min(pr, Math.max(0, MR - sz.rows));

    if (pi!==drag.pi) {
      App.pages[drag.pi]=App.pages[drag.pi].filter(i=>i.id!==drag.item.id);
      if (!App.pages[pi]) App.pages[pi]=[];
      App.pages[pi].push(drag.item);
    }
    const result = placeWithShift(pi, drag.item, pc, pr);
    if (result===null) {
      alert('本页无空间，请新建分页');
      drag.item.col=drag.item.col||0; drag.item.row=drag.item.row||0;
    } else {
      drag.item.col=result.col; drag.item.row=result.row;
    }
  }
  finalizeDrag();
});

function finalizeDrag() {
  if (!drag) return;
  if (drag.el.parentNode===document.body) drag.el.remove();
  drag.el.classList.remove('is-dragging');
  drag.el.style.cssText='';
  drag=null;
  clearShiftPreview(); hideGhost();
  clampAllPages();   /* 保存前清理超界数据 */
  saveData(); renderAll();
}

/* ================================================================
   让位预览（视觉）
   ================================================================ */
let _sp=[];
function applyShiftPreview(pi, dragItem, pc, pr) {
  clearShiftPreview();
  const area=getGridArea(pi); if(!area) return;
  const sim = simulatePlacement(pi, dragItem, pc, pr);
  if (!sim) return;
  sim.shifts.forEach(({id,col,row})=>{
    const el=area.querySelector(`.desk-item[data-id="${id}"]`); if(!el) return;
    _sp.push({el,l:el.style.left,t:el.style.top});
    el.style.transition='left .18s,top .18s';
    el.style.left=(col*(_C()+_G()))+'px';
    const shiftPageTop = (pi === 0) ? GRID_TOP : 20;
    el.style.top=(shiftPageTop+row*(_C()+_G()))+'px';
  });
}
function clearShiftPreview() {
  _sp.forEach(({el,l,t})=>{el.style.transition='left .18s,top .18s';el.style.left=l;el.style.top=t;});
  _sp=[];
}

/* ================================================================
   核心放置算法
   ================================================================ */

/* 检查单个位置是否与其他图标冲突 */
function hasConflict(items, di, col, row) {
  const sz=SIZES[di.size];
  return items.some(o=>{
    const os=SIZES[o.size];
    return !(col>=o.col+os.cols||col+sz.cols<=o.col||row>=o.row+os.rows||row+sz.rows<=o.row);
  });
}

/* 找到距目标位置最近的空格（BFS，严格在屏幕范围内） */
function findFreeCell(others, dragItem, prefCol, prefRow, pi) {
  const MC=maxCols(), MR=maxRows(pi!==undefined?pi:App.curPage);
  const sz=SIZES[dragItem.size];
  const visited=new Set();
  const startC=Math.min(Math.max(0,prefCol), MC-sz.cols);
  const startR=Math.min(Math.max(0,prefRow), MR-sz.rows);
  const q=[[startC,startR]];
  while(q.length) {
    const [c,r]=q.shift();
    const k=`${c},${r}`;
    if(visited.has(k)) continue; visited.add(k);
    if(c<0||r<0||c+sz.cols>MC||r+sz.rows>MR) continue;
    if(!hasConflict(others,dragItem,c,r)) return {col:c,row:r};
    /* 邻居顺序：左、下、右、上，优先左移避免图标堆右 */
    [[c-1,r],[c,r+1],[c+1,r],[c,r-1],[c-1,r+1],[c+1,r+1]]
      .forEach(([nc,nr])=>{
        if(nc>=0&&nr>=0&&nc+sz.cols<=MC&&nr+sz.rows<=MR&&!visited.has(`${nc},${nr}`))
          q.push([nc,nr]);
      });
  }
  for(let r=0;r<MR;r++) for(let c=0;c<MC;c++) {
    if(c+sz.cols<=MC&&r+sz.rows<=MR&&!hasConflict(others,dragItem,c,r))
      return {col:c,row:r};
  }
  return null;
}

/* 模拟放置：返回{finalCol,finalRow,shifts[]}，无空间返回null */
function simulatePlacement(pi, dragItem, pc, pr) {
  const MC=maxCols(), MR=maxRows(pi);
  const sz=SIZES[dragItem.size];
  /* 问题1：目标列/行不超出屏幕 */
  pc=Math.min(Math.max(0,pc), MC-sz.cols);
  pr=Math.min(Math.max(0,pr), MR-sz.rows);
  const others=JSON.parse(JSON.stringify((App.pages[pi]||[]).filter(i=>i.id!==dragItem.id)));

  if (!hasConflict(others,dragItem,pc,pr) && pc+sz.cols<=MC && pr+sz.rows<=MR) {
    return {finalCol:pc,finalRow:pr,shifts:[]};
  }

  const moved=[];
  for(let iter=0;iter<50;iter++) {
    const conflicts=others.filter(o=>{
      const os=SIZES[o.size];
      return !(pc>=o.col+os.cols||pc+sz.cols<=o.col||pr>=o.row+os.rows||pr+sz.rows<=o.row);
    });
    if(conflicts.length===0) break;
    let anyMoved=false;
    for(const o of conflicts) {
      const blockers=[...others.filter(x=>x.id!==o.id), {id:'__drag__',size:dragItem.size,col:pc,row:pr}];
      const freePos=findFreeCell(blockers,o,o.col,o.row,pi);
      if(!freePos) continue;
      o.col=freePos.col; o.row=freePos.row;
      moved.push({id:o.id,col:o.col,row:o.row});
      anyMoved=true;
    }
    if(!anyMoved) break;
  }

  if(hasConflict(others,dragItem,pc,pr)) {
    let hasAnyFree=false;
    outer: for(let r=0;r<MR;r++) for(let c=0;c<MC;c++) {
      if(!hasConflict(others,dragItem,c,r)&&c+sz.cols<=MC&&r+sz.rows<=MR){hasAnyFree=true;break outer;}
    }
    if(!hasAnyFree) return null;
    const free=findFreeCell(others,dragItem,pc,pr,pi);
    if(!free) return null;
    return {finalCol:free.col,finalRow:free.row,shifts:dedup(moved)};
  }

  return {finalCol:pc,finalRow:pr,shifts:dedup(moved)};
}

function dedup(arr) {
  const m=new Map();
  arr.forEach(x=>m.set(x.id,x));
  return [...m.values()];
}

/* 实际放置（修改数据） */
function placeWithShift(pi, dragItem, pc, pr) {
  const result=simulatePlacement(pi, dragItem, pc, pr);
  if(!result) return null;
  result.shifts.forEach(({id,col,row})=>{
    const it=App.pages[pi].find(i=>i.id===id); if(it){it.col=col;it.row=row;}
  });
  return {col:result.finalCol,row:result.finalRow};
}

/* ================================================================
   文件夹合并 — 问题3：支持三种情况
   a→folder: 放入文件夹
   folder→icon: 图标放入已有文件夹，或两文件夹合并
   icon→icon: 新建文件夹
   ================================================================ */
function doMerge(a, b, pi) {
  if (b.type==='folder') {
    /* 拖入已有文件夹 */
    if (a.type==='folder') {
      /* 问题3：文件夹拖到文件夹 → 内容合并 */
      (a.items||[]).forEach(it => {
        if (!b.items.find(i=>i.id===it.id)) b.items.push(it);
      });
      App.pages[pi] = App.pages[pi].filter(i=>i.id!==a.id);
    } else {
      if (!b.items.find(i=>i.id===a.id)) b.items.push(a);
      App.pages[pi] = App.pages[pi].filter(i=>i.id!==a.id);
    }
  } else if (a.type==='folder') {
    /* 拖拽的是文件夹 → 把 b 放入文件夹 a */
    if (!a.items.find(i=>i.id===b.id)) a.items.push(b);
    a.col=b.col; a.row=b.row;
    App.pages[pi] = App.pages[pi].filter(i=>i.id!==b.id);
  } else {
    /* 两个普通图标合并成文件夹 */
    const folder={id:'f'+Date.now(),type:'folder',size:'1x1',
      label:'文件夹',bgClass:'',col:b.col,row:b.row,items:[a,b]};
    App.pages[pi]=App.pages[pi].filter(i=>i.id!==a.id&&i.id!==b.id);
    App.pages[pi].push(folder);
  }
  saveData(); renderAll();
}

/* ================================================================
   3D hover
   ================================================================ */
function add3D(el) {
  el.addEventListener('mousemove',e=>{
    if(drag) return;
    const r=el.getBoundingClientRect();
    const dx=(e.clientX-r.left-r.width/2)/(r.width/2);
    const dy=(e.clientY-r.top-r.height/2)/(r.height/2);
    el.style.transform=`perspective(400px) rotateX(${-dy*9}deg) rotateY(${dx*9}deg) translateZ(5px)`;
    el.style.transition='transform 0.08s';
  });
  el.addEventListener('mouseleave',()=>{
    if(drag) return;
    el.style.transition='transform 0.4s cubic-bezier(.34,1.4,.64,1)';
    el.style.transform='';
  });
}

/* ================================================================
   分页
   ================================================================ */
function applyPageTransform(idx,animate){
  document.querySelectorAll('.page').forEach((p,i)=>{
    p.style.transition=animate?'transform .4s cubic-bezier(.4,0,.2,1),opacity .4s':'none';
    if(i<idx){p.style.transform='translateX(-100%)';p.style.opacity='0';p.style.pointerEvents='none';}
    else if(i>idx){p.style.transform='translateX(100%)';p.style.opacity='0';p.style.pointerEvents='none';}
    else{p.style.transform='translateX(0)';p.style.opacity='1';p.style.pointerEvents='';}
  });
}
function renderDots(){
  const bar=document.getElementById('page-dots');
  const add=document.getElementById('add-page-btn');
  bar.querySelectorAll('.page-dot,.page-del').forEach(el=>el.remove());
  for(let i=0;i<App.pageCount;i++){
    const dot=document.createElement('div');
    dot.className='page-dot'+(i===App.curPage?' active':'');
    dot.title=`第${i+1}页`; dot.onclick=()=>goPage(i);
    bar.insertBefore(dot,add);
    if(i>0){
      const del=document.createElement('span');
      del.className='page-del';del.textContent='×';
      del.onclick=ev=>{ev.stopPropagation();deletePage(i);};
      bar.insertBefore(del,add);
    }
  }
}
function goPage(idx){
  /* 问题4修复：切换分页前关闭所有打开的弹窗（文件夹、设置、导航等） */
  document.querySelectorAll('.modal-overlay.open').forEach(ov => {
    Modal.close(ov.id);
  });
  App.curPage=idx;applyPageTransform(idx,true);renderDots();
}
function deletePage(pi){
  if(App.pageCount<=1){alert('至少保留一页！');return;}
  const pageItems = (App.pages[pi]||[]);
  if(pageItems.length>0){
    alert(`第${pi+1}页还有 ${pageItems.length} 个图标，请先将图标移到其他页再删除。`);
    return;
  }
  if(!confirm(`删除第${pi+1}页？`))return;
  App.pages.splice(pi,1);App.pageCount--;
  document.querySelector(`.page[data-page="${pi}"]`)?.remove();
  document.querySelectorAll('.page').forEach((p,i)=>p.dataset.page=i);
  if(App.curPage>=App.pageCount)App.curPage=App.pageCount-1;
  saveData();renderAll();goPage(App.curPage);
}

/* ================================================================
   右键菜单
   ================================================================ */
function showCtxMenu(e,item,pi){
  const menu=document.getElementById('ctx-menu'),its=[];
  if(item.url) its.push({t:'🔗 打开链接',fn:()=>window.open(item.url,'_blank')});
  if(item.type==='folder') its.push({t:'📂 打开文件夹',fn:()=>openFolderModal(item,pi)});
  its.push({t:'✏️ 重命名',fn:()=>{const n=prompt('新名称：',item.label);if(n){item.label=n;saveData();renderAll();}}});
  its.push('sep');
  its.push({t:'🗑 删除',fn:()=>{if(confirm(`删除「${item.label}」？`)){App.pages[pi]=App.pages[pi].filter(i=>i.id!==item.id);saveData();renderAll();}}});
  menu.innerHTML=its.map(it=>it==='sep'?'<div class="ctx-sep"></div>':`<div class="ctx-item">${it.t}</div>`).join('');
  its.filter(i=>i!=='sep').forEach((it,i)=>menu.querySelectorAll('.ctx-item')[i].addEventListener('click',()=>{it.fn();hideCtxMenu();}));
  menu.style.cssText=`display:block;left:${Math.min(e.clientX,innerWidth-180)}px;top:${Math.min(e.clientY,innerHeight-220)}px;`;
}
function hideCtxMenu(){document.getElementById('ctx-menu').style.display='none';}
document.addEventListener('click',hideCtxMenu);


/* ================================================================
   触摸交互（移动端全功能）
   - 短按/单击：打开链接/功能
   - 双击：弹出右键菜单（重命名/删除）
   - 长按 500ms：进入拖拽模式（同桌面：避让+ghost+合并文件夹）
   - 拖拽到其他图标上方停留 800ms：合并为文件夹
   ================================================================ */
(function () {

  let td = null;          // 拖拽状态
  let _lastTap = { id: null, t: 0 }; // 双击检测

  /* ---------- 开始触摸 ---------- */
  document.addEventListener('touchstart', e => {
    /* 弹窗内部不拦截 */
    if (e.target.closest('.modal-panel')) return;

    const el = e.target.closest('.desk-item');
    if (!el) return;

    const touch = e.touches[0];
    const pi    = +el.dataset.pi;
    const id    = el.dataset.id;
    const itemData = (App.pages[pi]||[]).find(i => i.id === id);
    if (!itemData) return;

    /* 双击检测（400ms内再次触发同一图标） */
    const now = Date.now();
    if (_lastTap.id === id && now - _lastTap.t < 400) {
      _lastTap = { id: null, t: 0 };
      clearTimeout(td && td.longTimer);
      td = null;
      /* 弹出操作菜单 */
      showCtxMenu({ clientX: touch.clientX, clientY: touch.clientY }, itemData, pi);
      e.preventDefault();
      return;
    }
    _lastTap = { id, t: now };

    const r = el.getBoundingClientRect();
    td = {
      el, item: itemData, pi,
      ox: touch.clientX - r.left,
      oy: touch.clientY - r.top,
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
      inDrag: false,           // 长按后才进入真正拖拽
      mergeTimer: null,
      mergeTargetId: null,
      longTimer: null,
      _lastFlip: 0,
    };

    /* 长按 500ms → 进入拖拽 */
    td.longTimer = setTimeout(() => {
      if (!td || td.moved) return; // 已滑动取消
      td.inDrag = true;
      td.el.classList.add('is-dragging');
      td.el.dataset.wasDragged = '1';
      document.body.appendChild(td.el);
      td.el.style.cssText = `position:fixed;margin:0;z-index:9000;
        width:${itemW(td.item)}px;height:${itemH(td.item)}px;
        transition:none;pointer-events:none;overflow:visible;`;
      td.el.style.left = (touch.clientX - td.ox) + 'px';
      td.el.style.top  = (touch.clientY - td.oy) + 'px';
      /* 震动反馈 */
      if (navigator.vibrate) navigator.vibrate(40);
    }, 500);

  }, { passive: true });

  /* ---------- 移动 ---------- */
  document.addEventListener('touchmove', e => {
    if (!td) return;

    const touch = e.touches[0];
    const dx = touch.clientX - td.startX;
    const dy = touch.clientY - td.startY;

    /* 未进入拖拽模式：移动超出阈值则取消长按计时 */
    if (!td.inDrag) {
      if (dx * dx + dy * dy > 64) {
        clearTimeout(td.longTimer);
        td.moved = true; // 标记已移动，阻止后续进入拖拽
      }
      return; // 不 preventDefault，允许页面滚动
    }

    /* 已进入拖拽模式 */
    e.preventDefault();

    td.el.style.left = (touch.clientX - td.ox) + 'px';
    td.el.style.top  = (touch.clientY - td.oy) + 'px';

    /* 边缘翻页 */
    const now = Date.now();
    if (now - td._lastFlip > 700) {
      if (touch.clientX < 40 && App.curPage > 0) {
        goPage(App.curPage - 1); td._lastFlip = now;
      } else if (touch.clientX > innerWidth - 40 && App.curPage < App.pageCount - 1) {
        goPage(App.curPage + 1); td._lastFlip = now;
      }
    }

    /* 计算落点 & 让位预览 & Ghost */
    const area = getGridArea(App.curPage);
    if (area) {
      const ar      = area.getBoundingClientRect();
      const pageTop = (App.curPage === 0) ? GRID_TOP : 20;
      const cx      = touch.clientX - td.ox + itemW(td.item) / 2;
      const cy      = touch.clientY - td.oy + itemH(td.item) / 2;
      const pc      = Math.max(0, Math.floor((cx - ar.left) / (_C() + _G())));
      const pr      = Math.max(0, Math.floor((cy - ar.top - pageTop) / (_C() + _G())));

      applyShiftPreview(App.curPage, td.item, pc, pr);

      const simResult = simulatePlacement(App.curPage, td.item, pc, pr);
      if (simResult && !td.mergeTargetId) {
        const gs = ghostSize(td.item.size);
        showGhost(
          ar.left + simResult.finalCol * (_C() + _G()) + gs.ox,
          ar.top  + pageTop + simResult.finalRow * (_C() + _G()) + gs.oy,
          gs.w, gs.h, gs.r
        );
      } else {
        hideGhost();
      }
    }

    /* 合并检测：拖拽到其他图标上方 800ms → 合并 */
    td.el.style.pointerEvents = 'none';
    const under    = document.elementFromPoint(touch.clientX, touch.clientY);
    td.el.style.pointerEvents = '';
    const targetEl = under ? under.closest('.desk-item') : null;

    if (td.mergeTargetId) {
      const oldEl = document.querySelector(`.desk-item[data-id="${td.mergeTargetId}"]`);
      if (oldEl) oldEl.classList.remove('merge-target');
    }

    if (targetEl && targetEl !== td.el) {
      const tid2  = targetEl.dataset.id;
      const tpi   = +targetEl.dataset.pi;
      const tItem = App.pages[tpi]?.find(i => i.id === tid2);
      if (tItem && tid2 !== td.item.id) {
        targetEl.classList.add('merge-target');
        hideGhost();
        if (td.mergeTargetId !== tid2) {
          td.mergeTargetId = tid2;
          const snapItem = tItem, snapPi = tpi;
          clearTimeout(td.mergeTimer);
          td.mergeTimer = setTimeout(() => {
            if (!td || td.mergeTargetId !== tid2) return;
            if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
            const srcItem = td.item;
            _finalizeTouchDrag(false); // 不保存，doMerge 里会保存
            doMerge(srcItem, snapItem, snapPi);
          }, 800);
        }
      }
    } else {
      clearTimeout(td.mergeTimer);
      td.mergeTimer = null;
      td.mergeTargetId = null;
    }

  }, { passive: false });

  /* ---------- 结束触摸 ---------- */
  document.addEventListener('touchend', e => {
    if (!td) return;
    clearTimeout(td.longTimer);
    clearTimeout(td.mergeTimer);
    document.querySelectorAll('.merge-target').forEach(el => el.classList.remove('merge-target'));

    if (!td.inDrag) {
      /* 未进入拖拽 → 短按单击（由原来的 click 处理，这里不需要重复触发） */
      td = null;
      return;
    }

    /* 拖拽结束，落位 */
    const touch  = e.changedTouches[0];
    const pi     = App.curPage;
    const area   = getGridArea(pi);
    const ar     = area?.getBoundingClientRect();

    if (ar) {
      const pageTop = (pi === 0) ? GRID_TOP : 20;
      const cx  = touch.clientX - td.ox + itemW(td.item) / 2;
      const cy  = touch.clientY - td.oy + itemH(td.item) / 2;
      const MC  = maxCols();
      const sz  = SIZES[td.item.size];
      let pc = Math.max(0, Math.min(Math.floor((cx - ar.left) / (_C() + _G())), MC - sz.cols));
      let pr = Math.max(0, Math.floor((cy - ar.top - pageTop) / (_C() + _G())));

      if (pi !== td.pi) {
        App.pages[td.pi] = App.pages[td.pi].filter(i => i.id !== td.item.id);
        if (!App.pages[pi]) App.pages[pi] = [];
        App.pages[pi].push(td.item);
      }
      const result = placeWithShift(pi, td.item, pc, pr);
      if (result) { td.item.col = result.col; td.item.row = result.row; }
    }

    _finalizeTouchDrag(true);
  });

  document.addEventListener('touchcancel', () => {
    if (!td) return;
    clearTimeout(td.longTimer);
    clearTimeout(td.mergeTimer);
    _finalizeTouchDrag(true);
  });

  function _finalizeTouchDrag(doSave) {
    if (!td) return;
    clearShiftPreview();
    hideGhost();
    if (td.el.parentNode === document.body) td.el.remove();
    td.el.classList.remove('is-dragging');
    td.el.style.cssText = '';
    td = null;
    if (doSave) { clampAllPages(); saveData(); renderAll(); }
  }

})();

/* ================================================================
   触摸翻页（非图标区域左右滑动）
   ================================================================ */
(function () {
  let ts = null;
  document.addEventListener('touchstart', e => {
    if (e.target.closest('.modal-panel, .desk-item, #page-bottom, #search-wrap, #site-title')) return;
    const t = e.touches[0];
    ts = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!ts) return;
    const t  = e.changedTouches[0];
    const dx = t.clientX - ts.x;
    const dy = t.clientY - ts.y;
    ts = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
    if (dx < 0 && App.curPage < App.pageCount - 1) goPage(App.curPage + 1);
    else if (dx > 0 && App.curPage > 0)            goPage(App.curPage - 1);
  }, { passive: true });
})();
