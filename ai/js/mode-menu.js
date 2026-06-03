/* ============================================================
   mode-menu.js — 模式切换菜单
   点击 #site-title 呼出，风格与桌面主题（毛玻璃亮色）一致
   ============================================================ */

const MODES = ['normal', 'webstack', 'easy', 'nav', '5iux', 'kim', 'ai'];

const MODE_PATHS = {
  normal:   '../normal/index.html',
  webstack: '../webstack/index.html',
  easy:     '../easy/index.html',
  nav:      '../nav/index.html',
  '5iux':   '../5IUX/index.html',
  kim:      '../kim/index.html',
  ai:       '../ai/index.html',
};

const MODE_META = {
  normal:   { label: 'Normal',   desc: '暗黑风格',  icon: '🌙', color: '#6366f1' },
  webstack: { label: 'WebStack', desc: '侧栏导航',  icon: '📐', color: '#3b82f6' },
  easy:     { label: 'Easy',     desc: '极简搜索',  icon: '🔲', color: '#94a3b8' },
  nav:      { label: 'Nav',      desc: '渐变主题',  icon: '🌊', color: '#8b5cf6' },
  '5iux':   { label: '5IUX',    desc: '亮色简洁',  icon: '✨', color: '#e8714a' },
  kim:      { label: 'Kim',      desc: '极彩背景',  icon: '🎨', color: '#ec4899' },
  ai:       { label: 'AI',       desc: 'AI 助手',   icon: '🤖', color: '#f59e0b' },
};

// 当前模式：根据所在页面目录自动识别
// 如果是本桌面导航（新UI），没有对应模式，标记为 null
const CURRENT_MODE = (function () {
  const path = location.pathname;
  for (const [key, p] of Object.entries(MODE_PATHS)) {
    if (path.includes('/' + key + '/') || path.includes('/' + key.toLowerCase() + '/')) return key;
  }
  return null;
})();

const ModeMenu = {
  _open: false,
  _el:   null,

  _build() {
    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
      #mode-menu {
        position: fixed;
        z-index: 99999;
        display: none;
        flex-direction: column;
        gap: 3px;
        padding: 10px 8px;
        border-radius: 18px;
        background: rgba(255,255,255,.72);
        backdrop-filter: blur(28px) saturate(160%);
        -webkit-backdrop-filter: blur(28px) saturate(160%);
        border: 1px solid rgba(255,255,255,.85);
        box-shadow: 0 16px 48px rgba(80,120,180,.18), 0 2px 12px rgba(0,0,0,.08);
        min-width: 192px;
        pointer-events: auto;
      }
      #mode-menu.open { display: flex; }

      #mode-menu-title {
        font-size: 10px;
        font-weight: 700;
        color: rgba(80,100,140,.45);
        letter-spacing: .12em;
        text-transform: uppercase;
        padding: 2px 8px 6px;
        border-bottom: .5px solid rgba(0,0,0,.07);
        margin-bottom: 2px;
      }

      .mm-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 11px;
        text-decoration: none;
        border: 1px solid transparent;
        transition: background .14s, border-color .14s;
        cursor: pointer;
      }
      .mm-item:hover {
        background: rgba(232,113,74,.08);
        border-color: rgba(232,113,74,.18);
      }
      .mm-item.cur {
        background: rgba(232,113,74,.12);
        border-color: rgba(232,113,74,.32);
      }

      .mm-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .mm-icon { font-size: 17px; line-height: 1; }
      .mm-body { display: flex; flex-direction: column; gap: 1px; flex: 1; }
      .mm-label {
        font-size: 13px;
        font-weight: 600;
        color: #2c3e5a;
        line-height: 1;
      }
      .mm-item.cur .mm-label { color: #d05528; }
      .mm-desc  { font-size: 10px; color: rgba(80,100,140,.55); line-height: 1; }
      .mm-check { font-size: 12px; color: #e8714a; margin-left: auto; flex-shrink: 0; }

      /* 标题可点击提示 */
      #site-title.mode-clickable {
        cursor: pointer !important;
        pointer-events: auto !important;
        transition: opacity .15s;
      }
      #site-title.mode-clickable:hover { opacity: .75; }

      /* 移动端：菜单横向排列，铺满屏幕宽度 */
      @media (max-width: 600px) {
        #mode-menu {
          flex-direction: row;
          flex-wrap: wrap;
          min-width: unset;
          width: calc(100vw - 32px);
          gap: 4px;
          padding: 10px;
          border-radius: 16px;
        }
        #mode-menu-title { width: 100%; padding-bottom: 6px; }
        .mm-item {
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 8px 6px;
          min-width: 56px;
          flex: 1;
          text-align: center;
        }
        .mm-body { align-items: center; }
        .mm-desc  { display: none; }
        .mm-check { display: none; }
        .mm-dot   { display: none; }
      }
    `;
    document.head.appendChild(style);

    // 构建菜单 DOM
    const menu = document.createElement('div');
    menu.id = 'mode-menu';

    const title = document.createElement('div');
    title.id = 'mode-menu-title';
    title.textContent = '切换模式';
    menu.appendChild(title);

    MODES.forEach(key => {
      const m = MODE_META[key];
      const isCur = key === CURRENT_MODE;
      const a = document.createElement('a');
      a.href      = MODE_PATHS[key];
      a.className = 'mm-item' + (isCur ? ' cur' : '');
      a.innerHTML = `
        <span class="mm-icon">${m.icon}</span>
        <span class="mm-dot" style="background:${m.color}"></span>
        <span class="mm-body">
          <span class="mm-label">${m.label}</span>
          <span class="mm-desc">${m.desc}</span>
        </span>
        ${isCur ? '<span class="mm-check">✓</span>' : ''}
      `;
      // 当前页不跳转，只关闭菜单
      if (isCur) a.addEventListener('click', e => { e.preventDefault(); ModeMenu.close(); });
      menu.appendChild(a);
    });

    document.body.appendChild(menu);
    this._el = menu;
  },

  _position() {
    const titleEl = document.getElementById('site-title');
    const menu    = this._el;
    if (!titleEl || !menu) return;

    const rect    = titleEl.getBoundingClientRect();
    const GAP     = 10;
    const menuW   = Math.min(200, window.innerWidth - 32);
    const isMobile = window.innerWidth <= 600;

    if (isMobile) {
      // 移动端：水平居中，标题下方
      menu.style.width  = (window.innerWidth - 32) + 'px';
      menu.style.left   = '16px';
      menu.style.right  = 'auto';
      menu.style.top    = (rect.bottom + GAP + window.scrollY) + 'px';
    } else {
      // 桌面：跟随标题水平中心
      let left = (rect.left + rect.right) / 2 - menuW / 2;
      left = Math.max(16, Math.min(left, window.innerWidth - menuW - 16));
      menu.style.width  = menuW + 'px';
      menu.style.left   = left + 'px';
      menu.style.right  = 'auto';
      menu.style.top    = (rect.bottom + GAP + window.scrollY) + 'px';
    }
  },

  open() {
    if (!this._el) this._build();
    this._position();
    this._el.classList.add('open');
    this._open = true;
  },

  close() {
    if (this._el) this._el.classList.remove('open');
    this._open = false;
  },

  toggle(e) {
    e.stopPropagation();
    this._open ? this.close() : this.open();
  },

  init() {
    const titleEl = document.getElementById('site-title');
    if (!titleEl) return;

    titleEl.classList.add('mode-clickable');
    titleEl.addEventListener('click', e => ModeMenu.toggle(e));

    // 点击空白关闭
    document.addEventListener('click', e => {
      if (this._el && !this._el.contains(e.target)) this.close();
    });

    // resize 时重新定位
    window.addEventListener('resize', () => {
      if (this._open) this._position();
    });
    window.addEventListener('scroll', () => {
      if (this._open) this._position();
    }, { passive: true });
  },
};

document.addEventListener('DOMContentLoaded', () => ModeMenu.init());
