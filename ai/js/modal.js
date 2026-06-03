/* ============================================================
   modal.js
   ============================================================ */

let _zBase = 300;

const Modal = {
  open(id) {
    const ov    = document.getElementById(id); if (!ov) return;
    const panel = ov.querySelector('.modal-panel');

    // 每次打开都重置最大化状态
    if (panel.dataset.maxed === '1') {
      panel.style.cssText = '';
      panel.dataset.maxed = '';
      panel.dataset.placed = '';
    }

    ov.classList.add('open');
    panel.classList.remove('is-min');

    // 居中定位（未放置过，或刚重置）
    if (!panel.dataset.placed) {
      // 移动端：直接全屏，无需计算居中位置
      if (innerWidth <= 768) {
        panel.style.visibility = '';
        panel.dataset.placed  = '1';
        this._front(panel, ov);
        requestAnimationFrame(() => panel.classList.add('visible'));
        return;
      }
      // 让浏览器先渲染出尺寸
      panel.style.visibility = 'hidden';
      panel.style.display = 'flex';
      requestAnimationFrame(() => {
        const pw = panel.offsetWidth  || 580;
        const ph = panel.offsetHeight || 500;
        panel.style.position  = 'fixed';
        panel.style.left      = Math.max(20, (innerWidth  - pw) / 2) + 'px';
        panel.style.top       = Math.max(20, (innerHeight - ph) / 2) + 'px';
        panel.style.transform = 'none';
        panel.style.margin    = '0';
        panel.style.visibility = '';
        panel.dataset.placed  = '1';
        this._front(panel, ov);
        requestAnimationFrame(() => panel.classList.add('visible'));
      });
    } else {
      this._front(panel, ov);
      requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('visible')));
    }

    if (id === 'draw-overlay')  setTimeout(() => Widgets.initCanvas(), 80);
    if (id === 'note-overlay')  Widgets.loadNote();
    if (id === 'nav-overlay')   Nav.render();
  },

  close(id) {
    const ov    = document.getElementById(id); if (!ov) return;
    const panel = ov.querySelector('.modal-panel');
    panel.classList.remove('visible');
    setTimeout(() => {
      ov.classList.remove('open');
      // 完全重置，下次打开从干净状态开始
      panel.style.cssText      = '';
      panel.dataset.placed     = '';
      panel.dataset.maxed      = '';
      panel.dataset.savedStyle = '';
      ov.style.zIndex          = '';
    }, 220);
    this._removeChip(id);
  },

  minimize(id) {
    const ov    = document.getElementById(id); if (!ov) return;
    const panel = ov.querySelector('.modal-panel');
    panel.classList.remove('visible');
    setTimeout(() => panel.classList.add('is-min'), 210);
    const title = panel.querySelector('.modal-title')?.textContent || '';
    const emoji = [...title][0] || '📌';
    this._addChip(id, emoji, title);
  },

  maximize(id) {
    const panel = document.querySelector(`#${id} .modal-panel`); if (!panel) return;
    if (panel.dataset.maxed === '1') {
      // 还原到保存的位置/尺寸
      const saved = panel.dataset.savedStyle;
      panel.style.cssText  = saved || '';
      panel.dataset.maxed  = '';
      if (id === 'draw-overlay') setTimeout(() => Widgets.initCanvas(), 60);
    } else {
      // 保存当前样式
      panel.dataset.savedStyle = panel.style.cssText;
      panel.style.position     = 'fixed';
      panel.style.left         = '0';
      panel.style.top          = '0';
      panel.style.width        = '100vw';
      panel.style.height       = '100vh';
      panel.style.borderRadius = '0';
      panel.style.transform    = 'none';
      panel.style.margin       = '0';
      panel.dataset.maxed      = '1';
      if (id === 'draw-overlay') setTimeout(() => Widgets.initCanvas(), 60);
    }
    const ov = document.getElementById(id);
    this._front(panel, ov);
  },

  restore(id) {
    const ov    = document.getElementById(id); if (!ov) return;
    const panel = ov.querySelector('.modal-panel');
    ov.classList.add('open');
    panel.classList.remove('is-min');
    this._front(panel, ov);
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('visible')));
    this._removeChip(id);
  },

  // 置顶：panel z-index 和 overlay z-index 一起提升
  _front(panel, ov) {
    _zBase++;
    panel.style.zIndex = _zBase;
    // overlay z-index 比 panel 低1，确保 overlay 不拦截其他更高层面板的点击
    if (ov) ov.style.zIndex = _zBase - 1;
  },

  _addChip(id, emoji, title) {
    this._removeChip(id);
    const bar  = document.getElementById('minimized-bar');
    const chip = document.createElement('div');
    chip.className   = 'min-chip';
    chip.dataset.mid = id;
    chip.title       = title.trim();
    chip.innerHTML   = `<span class="min-chip-emoji">${emoji}</span>`;
    chip.onclick     = () => this.restore(id);
    bar.appendChild(chip);
  },

  _removeChip(id) {
    document.querySelector(`.min-chip[data-mid="${id}"]`)?.remove();
  },
};

/* ================================================================
   点击面板置顶（capture 阶段，早于任何其他处理）
   ================================================================ */
document.addEventListener('mousedown', e => {
  const panel = e.target.closest('.modal-panel');
  if (!panel) return;
  const ov = panel.closest('.modal-overlay');
  Modal._front(panel, ov);
}, true);

/* ================================================================
   标题栏拖动
   ================================================================ */
(function () {
  let md = null;

  document.addEventListener('mousedown', e => {
    const tb = e.target.closest('.modal-titlebar');
    if (!tb || e.target.closest('.traffic-lights')) return;
    const panel = tb.closest('.modal-panel');
    if (!panel || panel.dataset.maxed === '1') return;
    e.preventDefault();
    const r = panel.getBoundingClientRect();
    panel.style.position  = 'fixed';
    panel.style.left      = r.left + 'px';
    panel.style.top       = r.top  + 'px';
    panel.style.transform = 'none';
    panel.style.margin    = '0';
    panel.dataset.placed  = '1';
    md = { panel, ox: e.clientX - r.left, oy: e.clientY - r.top };
  });

  document.addEventListener('mousemove', e => {
    if (!md) return;
    let nx = Math.max(0, Math.min(innerWidth  - md.panel.offsetWidth,  e.clientX - md.ox));
    let ny = Math.max(0, Math.min(innerHeight - md.panel.offsetHeight, e.clientY - md.oy));
    md.panel.style.left = nx + 'px';
    md.panel.style.top  = ny + 'px';
  });

  document.addEventListener('mouseup', () => { md = null; });
})();

/* ================================================================
   最大化后拖动标题栏 → 自动还原为小窗口
   ================================================================ */
(function () {
  let mdMax = null; // {panel, startX, startY, ox, oy, dragging}

  document.addEventListener('mousedown', e => {
    const tb = e.target.closest('.modal-titlebar');
    if (!tb || e.target.closest('.traffic-lights')) return;
    const panel = tb.closest('.modal-panel');
    if (!panel || panel.dataset.maxed !== '1') return;
    mdMax = { panel, startX: e.clientX, startY: e.clientY, dragging: false };
  });

  document.addEventListener('mousemove', e => {
    if (!mdMax) return;
    const panel = mdMax.panel;

    if (!mdMax.dragging) {
      const dx = e.clientX - mdMax.startX, dy = e.clientY - mdMax.startY;
      if (Math.sqrt(dx*dx + dy*dy) < 8) return;
      // 还原小窗口
      panel.style.cssText   = panel.dataset.savedStyle || '';
      panel.dataset.maxed   = '';
      panel.style.position  = 'fixed';
      panel.style.transform = 'none';
      panel.style.margin    = '0';
      panel.dataset.placed  = '1';
      const pw = panel.offsetWidth || 580;
      mdMax.ox = pw / 2;  // 鼠标在标题栏水平居中
      mdMax.oy = 20;      // 鼠标在标题栏顶部往下20px
      mdMax.dragging = true;
      const id = panel.closest('.modal-overlay')?.id;
      if (id === 'draw-overlay') setTimeout(() => Widgets.initCanvas(), 60);
    }

    // 持续跟随（不中断）
    let nx = Math.max(0, Math.min(innerWidth  - panel.offsetWidth,  e.clientX - mdMax.ox));
    let ny = Math.max(0, Math.min(innerHeight - panel.offsetHeight, e.clientY - mdMax.oy));
    panel.style.left = nx + 'px';
    panel.style.top  = ny + 'px';
  });

  document.addEventListener('mouseup', () => { mdMax = null; });
})();

/* ================================================================
   边缘 Resize（8方向）
   ================================================================ */
(function () {
  const EDGE = 6;
  let rs = null;
  const CM = {
    nw:'nw-resize', ne:'ne-resize', sw:'sw-resize', se:'se-resize',
    n:'n-resize', s:'s-resize', w:'w-resize', e:'e-resize'
  };

  function getDir(e, panel) {
    const r = panel.getBoundingClientRect();
    const l = e.clientX - r.left   < EDGE;
    const r_= r.right   - e.clientX < EDGE;
    const t = e.clientY - r.top    < EDGE;
    const b = r.bottom  - e.clientY < EDGE;
    if (l&&t) return 'nw'; if (r_&&t) return 'ne';
    if (l&&b) return 'sw'; if (r_&&b) return 'se';
    if (l) return 'w'; if (r_) return 'e';
    if (t) return 'n'; if (b)  return 's';
    return null;
  }

  document.addEventListener('mousemove', e => {
    if (rs) {
      const dx=e.clientX-rs.sx, dy=e.clientY-rs.sy, MIN=200;
      let w=rs.w, h=rs.h, l=rs.l, t=rs.t;
      if (rs.d.includes('e')) w = Math.max(MIN, rs.w+dx);
      if (rs.d.includes('s')) h = Math.max(MIN, rs.h+dy);
      if (rs.d.includes('w')) { w=Math.max(MIN,rs.w-dx); l=rs.l+rs.w-w; }
      if (rs.d.includes('n')) { h=Math.max(MIN,rs.h-dy); t=rs.t+rs.h-h; }
      rs.panel.style.width  = w+'px'; rs.panel.style.height = h+'px';
      rs.panel.style.left   = l+'px'; rs.panel.style.top    = t+'px';
      if (rs.panel.closest('#draw-overlay')) {
        clearTimeout(rs._ct);
        rs._ct = setTimeout(() => Widgets.initCanvas(), 120);
      }
      return;
    }
    // cursor hint
    const panel = e.target.closest('.modal-panel');
    if (!panel || panel.dataset.maxed === '1') return;
    if (e.target.closest('.modal-titlebar')) { panel.style.cursor=''; return; }
    const dir = getDir(e, panel);
    panel.style.cursor = dir ? CM[dir] : '';
  });

  document.addEventListener('mousedown', e => {
    const panel = e.target.closest('.modal-panel');
    if (!panel || panel.dataset.maxed === '1') return;
    if (e.target.closest('.modal-titlebar')) return;
    const dir = getDir(e, panel);
    if (!dir) return;
    e.preventDefault();
    e.stopPropagation();
    const r = panel.getBoundingClientRect();
    panel.style.position  = 'fixed';
    panel.style.transform = 'none';
    panel.style.margin    = '0';
    panel.dataset.placed  = '1';
    rs = { panel, d:dir, sx:e.clientX, sy:e.clientY,
           w:r.width, h:r.height, l:r.left, t:r.top };
  });

  document.addEventListener('mouseup', () => { rs = null; });
})();

/* ================================================================
   左右滑动翻页（桌面空白区域）
   ================================================================ */
(function () {
  let ts = null;
  document.addEventListener('mousedown', e => {
    if (e.target.closest('.modal-panel,.desk-item,#page-bottom,#search-wrap,#site-title')) return;
    ts = { x: e.clientX, y: e.clientY };
  });
  document.addEventListener('mouseup', e => {
    if (!ts) return;
    const dx = e.clientX - ts.x, dy = e.clientY - ts.y;
    ts = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    if (dx < 0 && App.curPage < App.pageCount-1) goPage(App.curPage+1);
    else if (dx > 0 && App.curPage > 0)          goPage(App.curPage-1);
  });
})();

/* ================================================================
   移动端：弹窗标题栏下滑关闭（下拉距离>60px 关闭）
   ================================================================ */
(function () {
  if (!('ontouchstart' in window)) return;
  let swipeClose = null;
  document.addEventListener('touchstart', e => {
    if (innerWidth > 768) return;
    const tb = e.target.closest('.modal-titlebar');
    if (!tb) return;
    const panel = tb.closest('.modal-panel');
    if (!panel) return;
    const t = e.touches[0];
    swipeClose = { panel, startY: t.clientY };
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!swipeClose || innerWidth > 768) return;
    const t  = e.touches[0];
    const dy = t.clientY - swipeClose.startY;
    if (dy > 0) {
      swipeClose.panel.style.transform = `translateY(${Math.min(dy * 0.4, 60)}px)`;
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!swipeClose || innerWidth > 768) return;
    const t  = e.changedTouches[0];
    const dy = t.clientY - swipeClose.startY;
    const panel = swipeClose.panel;
    swipeClose = null;
    panel.style.transform = '';
    if (dy > 80) {
      const ov = panel.closest('.modal-overlay');
      if (ov) Modal.close(ov.id);
    }
  }, { passive: true });
})();

/* ================================================================
   ESC 关闭最上层
   ================================================================ */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  let top = null, maxZ = 0;
  document.querySelectorAll('.modal-overlay.open .modal-panel.visible').forEach(p => {
    const z = +p.style.zIndex || 0;
    if (z > maxZ) { maxZ = z; top = p; }
  });
  if (top) Modal.close(top.closest('.modal-overlay').id);
});
