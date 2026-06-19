/* ============================================================
   icon-settings-patch.js — 图标外观设置
   ============================================================ */

const ICON_SETTINGS_DEFAULTS = {
  size:       88,
  radius:     20,
  gap:        16,
  labelColor: '#ffffff',
  showLabel:  true,
  magic3d:    true,
};

const IconSettings = {
  _s: null,

  get() {
    if (!this._s) {
      try {
        const raw = localStorage.getItem('aiNav_iconSettings');
        this._s = raw ? { ...ICON_SETTINGS_DEFAULTS, ...JSON.parse(raw) }
                      : { ...ICON_SETTINGS_DEFAULTS };
         this._s.size = Math.min(this._s.size, 100);
      } catch(e) {
        this._s = { ...ICON_SETTINGS_DEFAULTS };
      }
    }
    return this._s;
  },

  save() {
    try { localStorage.setItem('aiNav_iconSettings', JSON.stringify(this._s)); } catch(e) {}
  },

  /* 批量更新多个值，只触发一次 renderAll */
  setMany(pairs) {
    const s = this.get();
    for (const [k, v] of Object.entries(pairs)) s[k] = v;
    this.save();
    this._applyCSS();
    renderAll();
  },

  set(key, val) {
    this.get()[key] = val;
    this.save();
    this._applyCSS();
    renderAll();
  },

  _applyCSS() {
    const s = this.get();
    /* 先写 window.CELL / window.GAP，grid.js 里的函数会读这两个 */
    window.CELL = s.size;
    window.GAP  = s.gap;
    const root = document.documentElement;
    root.style.setProperty('--icon-radius',      s.radius + 'px');
    root.style.setProperty('--icon-label-color', s.labelColor);
    root.style.setProperty('--icon-label-show',  s.showLabel ? 'block' : 'none');
  },

  init() {
    this._applyCSS();
    this._syncUI();
  },

  _syncUI() {
    const s = this.get();
    const safe = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
    safe('is-size',       el => { el.value = s.size;       document.getElementById('is-size-val').textContent = s.size + 'px'; });
    safe('is-radius',     el => { el.value = s.radius;     document.getElementById('is-radius-val').textContent = s.radius + 'px'; });
    safe('is-gap',        el => { el.value = s.gap;        document.getElementById('is-gap-val').textContent = s.gap + 'px'; });
    safe('is-labelcolor', el => { el.value = s.labelColor; });
    safe('is-showlabel',  el => { el.checked = s.showLabel; });
    safe('is-magic3d',    el => { el.checked = s.magic3d; });
  },
};

/* ── add3D 开关 ── */
const _origAdd3D = window.add3D;
window.add3D = function(el) {
  if (!IconSettings.get().magic3d) return;
  if (_origAdd3D) _origAdd3D(el);
};

/* ── 初始化 & 设置面板打开时同步 ── */
document.addEventListener('DOMContentLoaded', () => {
  IconSettings.init();

  const overlay = document.getElementById('settings-overlay');
  if (!overlay) return;
  new MutationObserver(() => {
    if (overlay.classList.contains('open'))
      setTimeout(() => IconSettings._syncUI(), 60);
  }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
});
