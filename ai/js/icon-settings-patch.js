/* ============================================================
   icon-settings-patch.js — 图标外观设置
   在 app.js 之后、grid.js 之前加载
   ============================================================ */

/* ── 默认值 ── */
const ICON_SETTINGS_DEFAULTS = {
  size:       88,
  radius:     20,
  gap:        16,
  maxCols:    0,       // 0 = 自动
  labelColor: '#ffffff',
  showLabel:  true,
  magic3d:    true,
};

/* ── 全局存取对象 ── */
const IconSettings = {
  _s: null,

  get() {
    if (!this._s) {
      try {
        const raw = localStorage.getItem('aiNav_iconSettings');
        this._s = raw ? { ...ICON_SETTINGS_DEFAULTS, ...JSON.parse(raw) }
                      : { ...ICON_SETTINGS_DEFAULTS };
      } catch(e) {
        this._s = { ...ICON_SETTINGS_DEFAULTS };
      }
    }
    return this._s;
  },

  save() {
    try { localStorage.setItem('aiNav_iconSettings', JSON.stringify(this._s)); } catch(e) {}
  },

  set(key, val) {
    this.get()[key] = val;
    this.save();
    this._applyCSS();
    renderAll();
  },

  /* 把设置同步为 CSS 变量，让 style.css 里的规则可以响应 */
  _applyCSS() {
    const s   = this.get();
    const root = document.documentElement;
    root.style.setProperty('--icon-radius',      s.radius + 'px');
    root.style.setProperty('--icon-label-color', s.labelColor);
    root.style.setProperty('--icon-label-show',  s.showLabel ? 'block' : 'none');
    // CELL / GAP 是 data.js 里的全局变量，覆盖它们
    window.CELL = s.size;
    window.GAP  = s.gap;
  },

  init() {
    this._applyCSS();
    // 渲染设置面板控件初始值
    this._syncUI();
  },

  /* 同步面板UI（面板打开时调用） */
  _syncUI() {
    const s = this.get();
    const safe = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
    safe('is-size',        el => { el.value = s.size;       document.getElementById('is-size-val').textContent = s.size + 'px'; });
    safe('is-radius',      el => { el.value = s.radius;     document.getElementById('is-radius-val').textContent = s.radius + 'px'; });
    safe('is-gap',         el => { el.value = s.gap;        document.getElementById('is-gap-val').textContent = s.gap + 'px'; });
    safe('is-maxcols',     el => { el.value = s.maxCols;    document.getElementById('is-maxcols-val').textContent = s.maxCols === 0 ? '自动' : s.maxCols + '列'; });
    safe('is-labelcolor',  el => { el.value = s.labelColor; });
    safe('is-showlabel',   el => { el.checked = s.showLabel; });
    safe('is-magic3d',     el => { el.checked = s.magic3d; });
  },
};

/* ── 覆盖 data.js 中 maxCols，让 maxCols 设置生效 ── */
/* grid.js 里 maxCols() 函数读取全局 CELL/GAP，我们在 _applyCSS 里覆盖了它们 */
/* 对于 maxCols 强制列数，patch grid.js 的 maxCols 函数 */
const _origMaxCols = window.maxCols;
window.maxCols = function() {
  const s = IconSettings.get();
  if (s.maxCols > 0) return s.maxCols;
  // 用修改后的 CELL/GAP 重新计算
  return Math.floor((innerWidth - (window._curOffset || 0) + window.GAP) / (window.CELL + window.GAP));
};

/* ── 覆盖 add3D，让 magic3d 开关生效 ── */
const _origAdd3D = window.add3D;
window.add3D = function(el) {
  if (!IconSettings.get().magic3d) return;
  if (_origAdd3D) _origAdd3D(el);
};

/* ── DOMContentLoaded：初始化 ── */
document.addEventListener('DOMContentLoaded', () => {
  IconSettings.init();
});

/* 设置面板每次打开时刷新控件状态 */
document.addEventListener('DOMContentLoaded', () => {
  const settingsOverlay = document.getElementById('settings-overlay');
  if (!settingsOverlay) return;
  const observer = new MutationObserver(() => {
    if (settingsOverlay.classList.contains('open')) {
      setTimeout(() => IconSettings._syncUI(), 60);
    }
  });
  observer.observe(settingsOverlay, { attributes: true, attributeFilter: ['class'] });
});
