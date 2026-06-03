/* ===========================
   王五导航 · nav/main.js
   =========================== */

const PROTECTED_PASSWORD_HASH =
  'e5b560baff2258b7f00c54fb2871e3c45a575af15affb7d5b93a9ac3cba1f772';

async function sha256(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── 模式配置 ────────────────────────────────────────────────
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
  normal:   { label: 'Normal',   desc: '暗黑风格',  icon: '🌙', color: '#00ff88' },
  webstack: { label: 'WebStack', desc: '侧栏导航',  icon: '📐', color: '#1677ff' },
  easy:     { label: 'Easy',     desc: '极简搜索',  icon: '🔲', color: '#aaaaaa' },
  nav:      { label: 'Nav',      desc: '渐变主题',  icon: '🌊', color: '#a78bfa' },
  '5iux':   { label: '5IUX',    desc: '亮色简洁',  icon: '✨', color: '#667eea' },
  kim:      { label: 'Kim',      desc: '极彩背景',  icon: '🎨', color: '#f472b6' },
  ai:       { label: 'AI',       desc: 'AI 助手',   icon: '🤖', color: '#f59e0b' },
};
const CURRENT_MODE = 'nav';

// ── 模式菜单 ────────────────────────────────────────────────
let _modeMenuOpen = false;
let _modeMenuEl   = null;

function buildModeMenu() {
  if (_modeMenuEl) return _modeMenuEl;

  const style = document.createElement('style');
  style.textContent = `
    #__mode-menu {
      position: fixed;
      z-index: 99999;
      display: none;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 6px;
      padding: 12px;
      border-radius: 18px;
      /* 紫色调毛玻璃，贴合 nav 渐变主题 */
      background: rgba(30, 18, 60, 0.62);
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      border: 1px solid rgba(167, 139, 250, 0.28);
      box-shadow: 0 12px 40px rgba(80, 40, 180, 0.35), 0 2px 8px rgba(0,0,0,0.4);
      max-width: 390px;
    }
    #__mode-menu.open { display: flex; }
    #__mode-menu.layout-below {
      flex-direction: column;
      max-width: 210px;
    }
    /* PC 横排时的小标题 */
    #__mode-menu-title {
      width: 100%;
      padding: 0 3px 7px;
      font-size: 10px; font-weight: 700;
      color: rgba(167,139,250,0.5);
      letter-spacing: 0.14em; text-transform: uppercase;
      border-bottom: 1px solid rgba(167,139,250,0.18);
      margin-bottom: 2px;
    }
    #__mode-menu.layout-below #__mode-menu-title { display: none; }

    .__mc {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border-radius: 11px;
      text-decoration: none;
      border: 1px solid transparent;
      transition: background 0.14s, border-color 0.14s;
      cursor: pointer;
    }
    /* PC 横排：图标在上 */
    #__mode-menu:not(.layout-below) .__mc {
      flex-direction: column; align-items: center;
      gap: 4px; padding: 10px 8px;
      min-width: 64px; max-width: 64px;
    }
    .__mc:hover {
      background: rgba(167,139,250,0.15);
      border-color: rgba(167,139,250,0.3);
    }
    .__mc.cur {
      background: rgba(167,139,250,0.22);
      border-color: rgba(167,139,250,0.5);
    }
    .__mc-icon { font-size: 18px; line-height: 1; }
    .__mc-body { display: flex; flex-direction: column; gap: 2px; }
    #__mode-menu:not(.layout-below) .__mc-body { align-items: center; }
    .__mc-label {
      font-size: 11.5px; font-weight: 700;
      color: rgba(255,255,255,0.88); line-height: 1;
    }
    .__mc.cur .__mc-label { color: #c4b5fd; }
    .__mc-desc { font-size: 10px; color: rgba(255,255,255,0.38); line-height: 1; }
    #__mode-menu.layout-below .__mc-check {
      margin-left: auto; font-size: 11px; color: #a78bfa;
    }
    #__mode-menu:not(.layout-below) .__mc-check { display: none; }
    .__mc-dot {
      width: 5px; height: 5px; border-radius: 50%;
      flex-shrink: 0; margin-top: 1px;
    }
    #__mode-menu:not(.layout-below) .__mc-dot { display: none; }
  `;
  document.head.appendChild(style);

  const menu = document.createElement('div');
  menu.id = '__mode-menu';

  const titleBar = document.createElement('div');
  titleBar.id = '__mode-menu-title';
  titleBar.textContent = '切换模式';
  menu.appendChild(titleBar);

  MODES.forEach(key => {
    const m = MODE_META[key];
    const a = document.createElement('a');
    a.href      = MODE_PATHS[key];
    a.className = '__mc' + (key === CURRENT_MODE ? ' cur' : '');
    a.innerHTML = `
      <div class="__mc-icon">${m.icon}</div>
      <div class="__mc-dot" style="background:${m.color}"></div>
      <div class="__mc-body">
        <div class="__mc-label">${m.label}</div>
        <div class="__mc-desc">${m.desc}</div>
      </div>
      <div class="__mc-check">${key === CURRENT_MODE ? '✓' : ''}</div>
    `;
    menu.appendChild(a);
  });

  document.body.appendChild(menu);
  _modeMenuEl = menu;
  return menu;
}

function positionModeMenu() {
  const titleEl = document.getElementById('site-title');
  const menu    = _modeMenuEl;
  if (!titleEl || !menu) return;

  const rect   = titleEl.getBoundingClientRect();
  const mobile = window.innerWidth < 768;
  const GAP    = 12;

  menu.classList.toggle('layout-below', mobile);

  if (mobile) {
    const menuW = Math.min(210, window.innerWidth - 24);
    let left = rect.left + rect.width / 2 - menuW / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - menuW - 12));
    menu.style.top      = (rect.bottom + GAP + window.scrollY) + 'px';
    menu.style.left     = left + 'px';
    menu.style.right    = 'auto';
    menu.style.maxWidth = menuW + 'px';
  } else {
    menu.style.top      = (rect.top + window.scrollY + rect.height / 2 - 55) + 'px';
    menu.style.left     = (rect.right + GAP) + 'px';
    menu.style.right    = 'auto';
    menu.style.maxWidth = '390px';
    requestAnimationFrame(() => {
      const mw = menu.offsetWidth;
      if (rect.right + GAP + mw > window.innerWidth - 12) {
        menu.style.left = Math.max(12, rect.left - GAP - mw) + 'px';
      }
    });
  }
}

function openModeMenu() {
  buildModeMenu();
  _modeMenuOpen = true;
  positionModeMenu();
  _modeMenuEl.classList.add('open');
}

function closeModeMenu() {
  _modeMenuOpen = false;
  if (_modeMenuEl) _modeMenuEl.classList.remove('open');
}

function toggleModeMenu(e) {
  e.stopPropagation();
  _modeMenuOpen ? closeModeMenu() : openModeMenu();
}

// ── 图标配置 ────────────────────────────────────────────────
const FAVICON_PROVIDER = 'duckduckgo';
const PROXY = '';

function withProxy(originUrl) {
  if (!PROXY) return originUrl;
  return PROXY + '/' + originUrl.replace(/^https?:\/\//, '');
}

function buildFaviconUrl(domain) {
  if (!domain) return DEFAULT_ICON;
  if (FAVICON_PROVIDER === 'google')
    return withProxy(`https://www.google.com/s2/favicons?sz=64&domain=${domain}`);
  if (FAVICON_PROVIDER === 'duckduckgo')
    return withProxy(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  return DEFAULT_ICON;
}

// ── 内外网切换 ────────────────────────────────────────────────
let isIntranet = localStorage.getItem('netMode') === 'intranet';
let _linksData = null;

function getCardUrl(item) {
  return (isIntranet && item.intranet) ? item.intranet : item.url;
}

function toggleNetMode() {
  isIntranet = !isIntranet;
  localStorage.setItem('netMode', isIntranet ? 'intranet' : 'internet');
  updateNetToggleBtn();
  document.querySelectorAll('.card[data-url][data-intranet]').forEach(a => {
    const url   = isIntranet ? a.dataset.intranet : a.dataset.url;
    a.href      = url;
    const popup = a.querySelector('.info-popup');
    if (popup) popup.textContent = getDomain(url) ?? url;
    const badge = a.querySelector('.net-badge');
    if (badge) badge.textContent = isIntranet ? '内' : '外';
  });
}
window.toggleNetMode = toggleNetMode;

function updateNetToggleBtn() {
  const btn = document.getElementById('netToggleBtn');
  if (!btn) return;
  btn.textContent = isIntranet ? '🏠 内网' : '🌐 外网';
  btn.classList.toggle('intranet-active', isIntranet);
}

function injectNetToggleBtn() {
  if (document.getElementById('netToggleBtn')) return;
  const btn = document.createElement('button');
  btn.id        = 'netToggleBtn';
  btn.className = 'net-toggle-btn';
  btn.addEventListener('click', toggleNetMode);
  document.body.appendChild(btn);
}

// ── 随机背景图 ────────────────────────────────────────────────
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
const BG_API   = isMobile
  ? 'https://imgapi.cn/api.php?zd=mobile&fl=fengjing&gs=images&t='
  : 'https://imgapi.cn/api.php?fl=fengjing&gs=images&t=';

function changeBackground() {
  const url = `${BG_API}${Date.now()}`;
  document.getElementById('bgLayer').style.backgroundImage = `url('${url}')`;
}

// ── 常量 ────────────────────────────────────────────────────
const LINKS_FILE   = '../links.json';
const DEFAULT_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0yIDEyaDIwIj48L3BhdGg+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+';

/* ── 搜索分类数据 ── */
const SEARCH_CATEGORIES = [
  {
    id: 'engine', label: '引擎', icon: '🔍',
    engines: [
      { name: '百度',       url: 'https://www.baidu.com/s?wd=',           domain: 'baidu.com' },
      { name: 'Google',     url: 'https://www.google.com/search?q=',      domain: 'google.com' },
      { name: 'Brave',      url: 'https://search.brave.com/search?q=',    domain: 'search.brave.com' },
      { name: '搜狗',       url: 'https://www.sogou.com/web?query=',       domain: 'sogou.com' },
      { name: 'Bing',       url: 'https://www.bing.com/search?q=',        domain: 'bing.com' },
      { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',            domain: 'duckduckgo.com' },
      { name: '360',        url: 'https://www.so.com/s?q=',               domain: 'so.com' },
      { name: '夸克',       url: 'https://www.quark.cn/s?q=',             domain: 'quark.cn' },
    ]
  },
  {
    id: 'community', label: '社区', icon: '💬',
    engines: [
      { name: 'GitHub', url: 'https://github.com/search?q=',             domain: 'github.com' },
      { name: '微博',   url: 'https://s.weibo.com/weibo?q=',              domain: 'weibo.com' },
      { name: '知乎',   url: 'https://www.zhihu.com/search?q=',           domain: 'zhihu.com' },
      { name: '豆瓣',   url: 'https://www.douban.com/search?q=',          domain: 'douban.com' },
      { name: '贴吧',   url: 'https://tieba.baidu.com/f/search/res?qw=',  domain: 'tieba.baidu.com' },
      { name: 'Reddit', url: 'https://www.reddit.com/search/?q=',         domain: 'reddit.com' },
    ]
  },
  {
    id: 'video', label: '视频', icon: '🎬',
    engines: [
      { name: 'B站',    url: 'https://search.bilibili.com/all?keyword=', domain: 'bilibili.com' },
      { name: '腾讯',   url: 'https://v.qq.com/search.html#stag=0&s=',  domain: 'v.qq.com' },
      { name: '爱奇艺', url: 'https://so.iqiyi.com/so/q_',              domain: 'iqiyi.com' },
      { name: '优酷',   url: 'https://so.youku.com/search_video/q_',    domain: 'youku.com' },
      { name: '芒果',   url: 'https://so.mgtv.com/so/k-',               domain: 'mgtv.com' },
    ]
  },
  {
    id: 'music', label: '音乐', icon: '🎵',
    engines: [
      { name: 'QQ音乐', url: 'https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=song&w=', domain: 'y.qq.com' },
      { name: '网易云', url: 'https://music.163.com/#/search/m/?s=',     domain: 'music.163.com' },
    ]
  },
  {
    id: 'life', label: '生活', icon: '🛒',
    engines: [
      { name: '淘宝',   url: 'https://s.taobao.com/search?q=',                              domain: 'taobao.com' },
      { name: '京东',   url: 'https://search.jd.com/Search?keyword=',                       domain: 'jd.com' },
      { name: '拼多多', url: 'https://mobile.yangkeduo.com/search_result.html?search_key=',  domain: 'pinduoduo.com' },
      { name: '做菜',   url: 'https://www.xiachufang.com/search/?keyword=',                  domain: 'xiachufang.com' },
      { name: '翻译',   url: 'https://fanyi.baidu.com/#zh/en/',                             domain: 'fanyi.baidu.com' },
    ]
  },
  {
    id: 'job', label: '求职', icon: '💼',
    engines: [
      { name: '智联招聘', url: 'https://sou.zhaopin.com/?jl=530&kw=',                        domain: 'zhaopin.com' },
      { name: 'BOSS直聘', url: 'https://www.zhipin.com/web/geek/job?query=',                 domain: 'zhipin.com' },
      { name: '猎聘',     url: 'https://www.liepin.com/zhaopin/?key=',                       domain: 'liepin.com' },
      { name: '前程无忧', url: 'https://search.51job.com/list/000000,000000,0000,00,9,99,',  domain: '51job.com' },
      { name: '拉勾网',   url: 'https://www.lagou.com/wn/jobs?kd=',                          domain: 'lagou.com' },
    ]
  },
];

let currentCategoryId = 'engine';
let currentEngine     = SEARCH_CATEGORIES[0].engines[0];

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return null; }
}
function faviconSrc(url)  { return buildFaviconUrl(getDomain(url)); }
function engineFavicon(e) { return e.icon ? e.icon : buildFaviconUrl(e.domain); }

// ── 分类 Tab ─────────────────────────────────────────────────
function renderSearchTabs() {
  const tabsEl = document.getElementById('searchTabs');
  if (!tabsEl) return;
  tabsEl.innerHTML = '';
  SEARCH_CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'search-tab' + (cat.id === currentCategoryId ? ' active' : '');
    btn.innerHTML = `<span class="tab-icon">${cat.icon}</span><span class="tab-label">${cat.label}</span>`;
    btn.onclick = () => { selectCategory(cat.id); };
    tabsEl.appendChild(btn);
  });
}

// ── 引擎面板 ─────────────────────────────────────────────────
function renderEnginePanel() {
  const panel = document.getElementById('enginePanel');
  if (!panel) return;
  panel.innerHTML = '';
  panel.style.display = 'flex';
  const cat = SEARCH_CATEGORIES.find(c => c.id === currentCategoryId);
  if (!cat) return;
  cat.engines.forEach(engine => {
    const btn = document.createElement('button');
    btn.className = 'engine-btn' + (engine === currentEngine ? ' active' : '');
    const img = document.createElement('img');
    img.src = engineFavicon(engine);
    img.alt = engine.name;
    img.onerror = function () {
      const d = engine.domain;
      if (d && !this.dataset.fallbackTried) {
        this.dataset.fallbackTried = '1';
        this.src = `https://${d}/favicon.ico`;
      } else { this.src = DEFAULT_ICON; this.onerror = null; }
    };
    const label = document.createElement('span');
    label.textContent = engine.name;
    btn.appendChild(img);
    btn.appendChild(label);
    btn.onclick = () => selectEngine(engine);
    panel.appendChild(btn);
  });
}

function selectCategory(catId) {
  currentCategoryId = catId;
  const cat = SEARCH_CATEGORIES.find(c => c.id === catId);
  currentEngine = cat.engines[0];
  renderSearchTabs();
  renderEnginePanel();
}

function selectEngine(engine) {
  currentEngine = engine;
  renderEnginePanel();
  document.getElementById('searchInput')?.focus();
}

// ── 搜索 ─────────────────────────────────────────────────────
function clearSearch() {
  const input    = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');
  if (input)    input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  input?.focus();
  filterLinks();
}
window.clearSearch = clearSearch;

function syncClearBtn() {
  const input    = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) clearBtn.style.display = input?.value.length > 0 ? 'flex' : 'none';
}

function doSearch() {
  const kw = document.getElementById('searchInput')?.value.trim();
  if (kw) window.open(currentEngine.url + encodeURIComponent(kw), '_blank');
}
window.doSearch = doSearch;

function filterLinks() {
  syncClearBtn();
  const query = document.getElementById('searchInput')?.value.toLowerCase().trim() ?? '';
  document.querySelectorAll('.card').forEach(card => {
    if (!query) { card.classList.remove('hidden'); return; }
    const title    = card.querySelector('.title')?.innerText.toLowerCase() ?? '';
    const datadesc = (card.dataset.desc ?? '').toLowerCase();
    card.classList.toggle('hidden', !title.includes(query) && !datadesc.includes(query));
  });
  document.querySelectorAll('.section').forEach(section => {
    if (!query) { section.classList.remove('section-hidden'); return; }
    const visible = section.querySelectorAll('.card:not(.hidden)');
    section.classList.toggle('section-hidden', visible.length === 0);
  });
}
window.filterLinks = filterLinks;

function sectionLabel(s) {
  return s.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{20E3}\uFE0F\u{1F1E0}-\u{1F1FF}]+/gu, '').trim();
}

// ── 渲染卡片 ─────────────────────────────────────────────────
function renderCards(sections) {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = '';
  sections.forEach(({ section, items, protected: isProtected }) => {
    const sec = document.createElement('div');
    sec.className = 'section';
    const h2 = document.createElement('h2');
    h2.className   = 'section-title';
    h2.textContent = sectionLabel(section);
    sec.appendChild(h2);
    const grid = document.createElement('div');
    grid.className = 'link-container';
    items.forEach(item => {
      const a = document.createElement('a');
      a.href         = getCardUrl(item);
      a.target       = '_blank';
      a.className    = 'card';
      a.dataset.desc = item['data-desc'] ?? item.desc ?? '';
      a.rel          = 'noopener noreferrer';
      if (item.intranet) { a.dataset.url = item.url; a.dataset.intranet = item.intranet; }
      const img = document.createElement('img');
      img.className = 'favicon';
      img.loading   = 'lazy';
      img.src = item.icon ? item.icon : faviconSrc(item.url);
      img.onerror = function () {
        const domain = getDomain(item.url);
        if (domain && !this.dataset.fallbackTried) {
          this.dataset.fallbackTried = '1';
          this.src = `https://${domain}/favicon.ico`;
        } else { this.src = DEFAULT_ICON; this.onerror = null; }
      };
      const info = document.createElement('div');
      info.className = 'card-info';
      const titleEl = document.createElement('span');
      titleEl.className   = 'title';
      titleEl.textContent = item.title;
      const descEl = document.createElement('div');
      descEl.className   = 'desc';
      descEl.textContent = item.desc ?? '';
      info.appendChild(titleEl);
      info.appendChild(descEl);
      const popup = document.createElement('div');
      popup.className   = 'info-popup';
      popup.textContent = getDomain(getCardUrl(item)) ?? getCardUrl(item);
      a.appendChild(img);
      a.appendChild(info);
      a.appendChild(popup);
      grid.appendChild(a);
    });
    if (isProtected) {
      grid.style.display = 'none';
      h2.style.cursor = 'pointer';
      h2.addEventListener('click', async () => {
        if (sessionStorage.getItem(section) === 'ok') {
          grid.style.display = grid.style.display === 'none' ? 'grid' : 'none';
          return;
        }
        const pwd = prompt('请输入访问密码');
        if (!pwd) return;
        const hash = await sha256(pwd);
        if (hash === PROTECTED_PASSWORD_HASH) {
          sessionStorage.setItem(section, 'ok');
          grid.style.display = 'grid';
        } else {
          alert('密码错误');
        }
      });
    }

    sec.appendChild(grid);
    main.appendChild(sec);
  });
  bindTouchTooltip();
}

function bindTouchTooltip() {
  if (!window.matchMedia('(hover: none)').matches) return;
  let timer = null, activeCard = null;
  function clearActive() {
    if (activeCard) { activeCard.classList.remove('touch-active'); activeCard = null; }
    clearTimeout(timer); timer = null;
  }
  document.querySelectorAll('.card').forEach(card => {
    const popup = card.querySelector('.info-popup');
    const domainText = popup ? popup.textContent.trim() : '';
    if (popup) card.dataset._domain = domainText;
    card.addEventListener('touchstart', () => {
      clearActive();
      timer = setTimeout(() => {
        const popup = card.querySelector('.info-popup');
        if (popup) {
          const desc   = (card.dataset.desc  || '').trim();
          const title  = (card.querySelector('.title')?.textContent || '').trim();
          const domain = (card.dataset._domain || '').trim();
          popup.textContent = desc || title || domain || '无描述';
          popup.style.display = 'none';
          void popup.offsetHeight;
          popup.style.display = '';
        }
        card.classList.add('touch-active');
        activeCard = card;
        setTimeout(clearActive, 2500);
      }, 500);
    }, { passive: true });
    card.addEventListener('touchend',  () => { if (timer) { clearTimeout(timer); timer = null; } });
    card.addEventListener('touchmove', () => { clearTimeout(timer); timer = null; }, { passive: true });
  });
  document.addEventListener('touchstart', e => {
    if (activeCard && !activeCard.contains(e.target)) clearActive();
  }, { passive: true });
}

/* ── 入口 ── */
document.addEventListener('DOMContentLoaded', async () => {
  localStorage.setItem('navMode', 'nav');

  // 绑定标题点击 → 模式菜单
  const title = document.getElementById('site-title');
  if (title) title.addEventListener('click', toggleModeMenu);

  // 点空白关闭
  document.addEventListener('click', (e) => {
    if (_modeMenuEl && !_modeMenuEl.contains(e.target)) closeModeMenu();
  });
  window.addEventListener('resize', () => { if (_modeMenuOpen) positionModeMenu(); });
  window.addEventListener('scroll', () => { if (_modeMenuOpen) positionModeMenu(); }, { passive: true });

  changeBackground();
  renderSearchTabs();
  renderEnginePanel();
  injectNetToggleBtn();
  updateNetToggleBtn();

  const input = document.getElementById('searchInput');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') doSearch();
    });
  }

  try {
    const res  = await fetch(LINKS_FILE);
    const data = await res.json();
    _linksData = data;
    renderCards(data);
  } catch (err) {
    console.error('加载 links.json 失败：', err);
    const el = document.getElementById('main-content');
    if (el) el.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:2rem;">链接数据加载失败，请检查 links.json 文件。</p>';
  }
});
