/* ===========================
   王五导航 · WebStack主题 · main.js
   =========================== */

const WORKER_URL = 'https://ico.xmynscnq.dpdns.org';
const LINKS_FILE = '../links.json';
const DEFAULT_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0yIDEyaDIwIj48L3BhdGg+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+';

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

// ── 模式配置 ──────────────────────────────────────────────
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
const CURRENT_MODE = 'webstack';

// ── 模式菜单 ──────────────────────────────────────────────
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
      padding: 10px;
      border-radius: 14px;
      /* 亮色默认，跟随 WebStack 白色风格 */
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border: 1px solid rgba(0,0,0,0.09);
      box-shadow: 0 8px 32px rgba(0,0,0,0.13);
      max-width: 380px;
    }
    body.dark-mode #__mode-menu {
      background: rgba(26,34,48,0.95);
      border-color: rgba(255,255,255,0.1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    #__mode-menu.open { display: flex; }
    #__mode-menu.layout-below {
      flex-direction: column;
      max-width: 210px;
    }
    .__mc {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 8px 11px;
      border-radius: 9px;
      text-decoration: none;
      border: 1px solid transparent;
      transition: background 0.13s, border-color 0.13s;
      cursor: pointer;
      min-width: 88px;
    }
    /* PC横向：图标在上，label在下的卡片式 */
    #__mode-menu:not(.layout-below) .__mc {
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 8px 8px;
      min-width: 68px;
      max-width: 68px;
    }
    .__mc:hover {
      background: rgba(22,119,255,0.07);
      border-color: rgba(22,119,255,0.18);
    }
    body.dark-mode .__mc:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.15);
    }
    .__mc.cur {
      background: rgba(22,119,255,0.1);
      border-color: rgba(22,119,255,0.35);
    }
    body.dark-mode .__mc.cur {
      background: rgba(77,166,255,0.15);
      border-color: rgba(77,166,255,0.4);
    }
    .__mc-icon { font-size: 19px; line-height: 1; }
    .__mc-body { display: flex; flex-direction: column; gap: 1px; }
    #__mode-menu:not(.layout-below) .__mc-body { align-items: center; }
    .__mc-label {
      font-size: 11.5px; font-weight: 700;
      color: #1a1a2e; line-height: 1;
    }
    body.dark-mode .__mc-label { color: #e0e6f0; }
    .__mc.cur .__mc-label { color: #1677ff; }
    body.dark-mode .__mc.cur .__mc-label { color: #4da6ff; }
    .__mc-desc {
      font-size: 10px;
      color: #888; line-height: 1;
    }
    body.dark-mode .__mc-desc { color: #6a7a8a; }
    /* 手机纵向时显示右侧对勾 */
    #__mode-menu.layout-below .__mc-check {
      margin-left: auto; font-size: 11px; color: #1677ff;
    }
    body.dark-mode #__mode-menu.layout-below .__mc-check { color: #4da6ff; }
    #__mode-menu:not(.layout-below) .__mc-check { display: none; }
    .__mc-dot {
      width: 6px; height: 6px; border-radius: 50%;
      flex-shrink: 0; margin-top: 1px;
    }
    #__mode-menu:not(.layout-below) .__mc-dot { display: none; }
    /* 分割线（PC横排时顶部加个小标题） */
    #__mode-menu-title {
      width: 100%; padding: 2px 4px 6px;
      font-size: 10px; font-weight: 700;
      color: #aaa; letter-spacing: 0.08em;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(0,0,0,0.07);
      margin-bottom: 2px;
    }
    body.dark-mode #__mode-menu-title {
      color: #4a5a6a;
      border-color: rgba(255,255,255,0.07);
    }
    #__mode-menu.layout-below #__mode-menu-title { display: none; }
  `;
  document.head.appendChild(style);

  const menu = document.createElement('div');
  menu.id = '__mode-menu';

  // PC横排时显示标题
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

function positionModeMenu(anchorEl) {
  const menu = _modeMenuEl;
  if (!anchorEl || !menu) return;

  const rect   = anchorEl.getBoundingClientRect();
  const mobile = window.innerWidth < 768;
  const GAP    = 10;

  menu.classList.toggle('layout-below', mobile);

  if (mobile) {
    // 手机：标题正下方，水平居中
    const menuW = Math.min(210, window.innerWidth - 24);
    let left = rect.left + rect.width / 2 - menuW / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - menuW - 12));
    menu.style.top      = (rect.bottom + GAP + window.scrollY) + 'px';
    menu.style.left     = left + 'px';
    menu.style.right    = 'auto';
    menu.style.maxWidth = menuW + 'px';
  } else {
    // PC：锚点右侧，垂直居中对齐
    menu.style.top      = (rect.top + window.scrollY + rect.height / 2 - 60) + 'px';
    menu.style.left     = (rect.right + GAP) + 'px';
    menu.style.right    = 'auto';
    menu.style.maxWidth = '380px';

    // 右侧放不下则改到左侧
    requestAnimationFrame(() => {
      const mw = menu.offsetWidth;
      if (rect.right + GAP + mw > window.innerWidth - 12) {
        menu.style.left = Math.max(12, rect.left - GAP - mw) + 'px';
      }
    });
  }
}

let _modeAnchor = null; // 记录是哪个触发元素

function openModeMenu(anchorEl) {
  buildModeMenu();
  _modeAnchor   = anchorEl;
  _modeMenuOpen = true;
  positionModeMenu(anchorEl);
  _modeMenuEl.classList.add('open');
}

function closeModeMenu() {
  _modeMenuOpen = false;
  if (_modeMenuEl) _modeMenuEl.classList.remove('open');
}

function toggleModeMenu(e) {
  e.stopPropagation();
  const anchor = e.currentTarget;
  if (_modeMenuOpen && _modeAnchor === anchor) {
    closeModeMenu();
  } else {
    openModeMenu(anchor);
  }
}

// ── 内外网切换 ────────────────────────────────────────────
let isIntranet = localStorage.getItem('netMode') === 'intranet';
let _allData = null;

function getCardUrl(item) {
  return (isIntranet && item.intranet) ? item.intranet : item.url;
}
function updateNetBtn() {
  const btn = document.getElementById('net-toggle-sidebar');
  if (!btn) return;
  btn.querySelector('.menu-label').textContent = isIntranet ? '内网模式' : '外网模式';
  btn.querySelector('.sidebar-emoji').textContent = isIntranet ? '🏠' : '🌐';
}
function toggleNetMode() {
  isIntranet = !isIntranet;
  localStorage.setItem('netMode', isIntranet ? 'intranet' : 'internet');
  updateNetBtn();
  if (_allData) renderContent(_allData);
}
window.toggleNetMode = toggleNetMode;

// ── 侧边栏全局helper ──────────────────────────────────────
function getSidebar() { return document.getElementById('sidebar'); }
function getOverlay() { return document.getElementById('mobile-overlay'); }
function isMobile()   { return window.innerWidth < 768; }

function openMobileSidebar() {
  const s = getSidebar();
  s.classList.remove('mini-sidebar');
  s.style.removeProperty('transform');
  s.style.removeProperty('width');
  s.style.setProperty('display', 'flex', 'important');
  s.classList.add('mobile-open');
  getOverlay()?.classList.add('show');
  document.getElementById('mobile-top-bar').style.setProperty('display', 'none', 'important');
}

function closeMobileSidebar() {
  const s = getSidebar();
  s.classList.remove('mobile-open');
  s.style.setProperty('display', 'flex', 'important');
  getOverlay()?.classList.remove('show');
  document.getElementById('mobile-top-bar').style.setProperty('display', 'flex', 'important');
}

// ── 侧边栏切换 ────────────────────────────────────────────
function toggleSidebar() {
  if (isMobile()) {
    getSidebar().classList.contains('mobile-open')
      ? closeMobileSidebar()
      : openMobileSidebar();
  } else {
    const sidebar  = getSidebar();
    const wrap     = document.getElementById('content-wrap');
    const topBar   = document.getElementById('top-bar');
    const expanded = localStorage.getItem('sidebarExpanded') !== '0';
    const next = !expanded;
    localStorage.setItem('sidebarExpanded', next ? '1' : '0');
    sidebar.classList.toggle('mini-sidebar', !next);
    sidebar.style.width   = next ? '180px' : '60px';
    wrap.style.marginLeft = next ? '180px' : '60px';
    topBar.style.left     = next ? '180px' : '60px';
  }
}
window.toggleSidebar = toggleSidebar;

window.addEventListener('resize', () => {
  const sidebar  = getSidebar();
  const wrap     = document.getElementById('content-wrap');
  const topBar   = document.getElementById('top-bar');
  if (!isMobile()) {
    const _s = getSidebar();
    _s.style.removeProperty('transform');
    _s.style.removeProperty('left');
    _s.classList.remove('mobile-open');
    getOverlay()?.classList.remove('show');
    const expanded = localStorage.getItem('sidebarExpanded') !== '0';
    sidebar.classList.toggle('mini-sidebar', !expanded);
    sidebar.style.width   = expanded ? '180px' : '60px';
    wrap.style.marginLeft = expanded ? '180px' : '60px';
    topBar.style.left     = expanded ? '180px' : '60px';
  } else {
    wrap.style.marginLeft = '0';
    topBar.style.left     = '0';
  }
  // 菜单打开时跟随重新定位
  if (_modeMenuOpen && _modeAnchor) positionModeMenu(_modeAnchor);
});

// ── 工具函数 ──────────────────────────────────────────────
function sectionLabel(s) {
  return s.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+/u, '').trim();
}
function sectionEmoji(s) {
  const m = s.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/u);
  return m ? m[1] : '';
}
function getDomain(url) {
  try { return new URL(url).hostname; } catch { return null; }
}
function buildFaviconUrl(domain) {
  if (!domain) return DEFAULT_ICON;
  return `${WORKER_URL}/?domain=${domain}`;
}
function faviconSrc(url) { return buildFaviconUrl(getDomain(url)); }
function sectionId(s) {
  return 'sec-' + s.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
}

// ── 搜索分类 ──────────────────────────────────────────────
const SEARCH_CATEGORIES = [
  {
    id: 'engine', label: '引擎',
    engines: [
      { name: '百度',       url: 'https://www.baidu.com/s?wd=',           domain: 'baidu.com' },
      { name: 'Google',     url: 'https://www.google.com/search?q=',      domain: 'google.com' },
      { name: 'Brave',      url: 'https://search.brave.com/search?q=',    domain: 'search.brave.com' },
      { name: '搜狗',       url: 'https://www.sogou.com/web?query=',      domain: 'sogou.com' },
      { name: 'Bing',       url: 'https://www.bing.com/search?q=',        domain: 'bing.com' },
      { name: 'DuckDuck', url: 'https://duckduckgo.com/?q=',            domain: 'duckduckgo.com' },
      { name: '360',        url: 'https://www.so.com/s?q=',               domain: 'so.com' },
      { name: '夸克',       url: 'https://www.quark.cn/s?q=',             domain: 'quark.cn' },
    ]
  },
  {
    id: 'community', label: '社区',
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
    id: 'video', label: '视频',
    engines: [
      { name: 'B站',    url: 'https://search.bilibili.com/all?keyword=', domain: 'bilibili.com' },
      { name: '腾讯',   url: 'https://v.qq.com/search.html#stag=0&s=',  domain: 'v.qq.com' },
      { name: '爱奇艺', url: 'https://so.iqiyi.com/so/q_',              domain: 'iqiyi.com' },
      { name: '优酷',   url: 'https://so.youku.com/search_video/q_',    domain: 'youku.com' },
      { name: '芒果',   url: 'https://so.mgtv.com/so/k-',               domain: 'mgtv.com' },
    ]
  },
  {
    id: 'music', label: '音乐',
    engines: [
      { name: 'QQ音乐', url: 'https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=song&w=', domain: 'y.qq.com' },
      { name: '网易云', url: 'https://music.163.com/#/search/m/?s=', domain: 'music.163.com' },
    ]
  },
  {
    id: 'life', label: '生活',
    engines: [
      { name: '淘宝',   url: 'https://s.taobao.com/search?q=',                             domain: 'taobao.com' },
      { name: '京东',   url: 'https://search.jd.com/Search?keyword=',                      domain: 'jd.com' },
      { name: '拼多多', url: 'https://mobile.yangkeduo.com/search_result.html?search_key=', domain: 'pinduoduo.com' },
      { name: '做菜',   url: 'https://www.xiachufang.com/search/?keyword=',                 domain: 'xiachufang.com' },
      { name: '翻译',   url: 'https://fanyi.baidu.com/#zh/en/',                            domain: 'fanyi.baidu.com' },
    ]
  },
  {
    id: 'job', label: '求职',
    engines: [
      { name: '智联招聘', url: 'https://sou.zhaopin.com/?jl=530&kw=',                       domain: 'zhaopin.com' },
      { name: 'BOSS直聘', url: 'https://www.zhipin.com/web/geek/job?query=',                domain: 'zhipin.com' },
      { name: '猎聘',     url: 'https://www.liepin.com/zhaopin/?key=',                      domain: 'liepin.com' },
      { name: '前程无忧', url: 'https://search.51job.com/list/000000,000000,0000,00,9,99,', domain: '51job.com' },
      { name: '拉勾网',   url: 'https://www.lagou.com/wn/jobs?kd=',                         domain: 'lagou.com' },
    ]
  },
];

let currentCategoryId = 'engine';
let currentEngine = SEARCH_CATEGORIES[0].engines[0];

// ── Tab ───────────────────────────────────────────────────
function renderTabs() {
  const el = document.getElementById('ws-tabs');
  if (!el) return;
  el.innerHTML = '';
  SEARCH_CATEGORIES.forEach(cat => {
    const label = document.createElement('label');
    label.textContent = cat.label;
    if (cat.id === currentCategoryId) label.classList.add('active');
    label.onclick = () => {
      currentCategoryId = cat.id;
      currentEngine = cat.engines[0];
      renderTabs();
      renderQuickEngines();
    };
    el.appendChild(label);
  });
}

// ── 快捷引擎 ─────────────────────────────────────────────
function renderQuickEngines() {
  const wrap = document.getElementById('quick-engines');
  if (!wrap) return;
  wrap.innerHTML = '';
  const cat = SEARCH_CATEGORIES.find(c => c.id === currentCategoryId);
  if (!cat) return;
  cat.engines.forEach(engine => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-engine-btn' + (engine === currentEngine ? ' active' : '');
    btn.textContent = engine.name;
    btn.onclick = () => {
      currentEngine = engine;
      renderQuickEngines();
      document.getElementById('search-text')?.focus();
    };
    wrap.appendChild(btn);
  });
}

// ── 搜索 ─────────────────────────────────────────────────
function doSearch(e) {
  if (e) e.preventDefault();
  const kw = document.getElementById('search-text')?.value.trim();
  if (kw) window.open(currentEngine.url + encodeURIComponent(kw), '_blank');
}
window.doSearch = doSearch;

function onSearchKeydown(e) {
  if (e.key === 'Escape') { const i = document.getElementById('search-text'); if(i) i.value=''; }
}
window.onSearchKeydown = onSearchKeydown;

// ── 站内筛选 ─────────────────────────────────────────────
function filterCards(query) {
  query = (query || '').toLowerCase().trim();
  document.querySelectorAll('.ws-section').forEach(block => {
    let vis = false;
    block.querySelectorAll('.url-card').forEach(card => {
      const t = card.querySelector('strong')?.textContent.toLowerCase() ?? '';
      const d = card.querySelector('p')?.textContent.toLowerCase() ?? '';
      const show = !query || t.includes(query) || d.includes(query);
      card.style.display = show ? '' : 'none';
      if (show) vis = true;
    });
    block.style.display = (!query || vis) ? '' : 'none';
  });
}
window.filterCards = filterCards;

// ── 渲染侧边栏 ───────────────────────────────────────────
function renderSidebar(sections) {
  const menu = document.getElementById('main-menu');
  if (!menu) return;
  menu.innerHTML = '';
  sections.forEach(({ section, protected: isProtected }) => {
    const li = document.createElement('li');
    li.className = 'sidebar-item';
    const a = document.createElement('a');
    a.href = '#' + sectionId(section);
    a.className = 'nav-smooth';
    a.innerHTML = `<span class="sidebar-emoji">${sectionEmoji(section)}</span><span class="menu-label">${sectionLabel(section)}</span>`;
    li.appendChild(a);
    menu.appendChild(li);
  });
  document.querySelectorAll('a.nav-smooth').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.getElementById(this.getAttribute('href').substring(1));
      if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 62, behavior: 'smooth' });
      document.querySelectorAll('#main-menu li').forEach(l => l.classList.remove('active'));
      this.parentElement.classList.add('active');
      if (isMobile()) closeMobileSidebar();
    });
  });
}

// ── 渲染内容 ─────────────────────────────────────────────
function renderContent(sections) {
  const main = document.getElementById('content');
  if (!main) return;
  main.innerHTML = '';
  sections.forEach(({ section, items, protected: isProtected }) => {
    const block = document.createElement('div');
    block.className = 'ws-section';
    block.innerHTML = `<div class="d-flex flex-fill"><h4 class="text-gray text-lg mb-4" id="${sectionId(section)}"><span class="section-emoji mr-1">${sectionEmoji(section)}</span>${sectionLabel(section)}</h4></div>`;
    const row = document.createElement('div');
    row.className = 'row';
    items.forEach(item => {
      const url     = getCardUrl(item);
      const iconSrc = item.icon || faviconSrc(url);
      const title   = (item.title || '').replace(/</g, '&lt;');
      const desc    = (item.desc || item['data-desc'] || '').replace(/</g, '&lt;');
      const domain  = getDomain(url) || url;
      const netBadge = item.intranet
        ? `<span style="font-size:0.6rem;padding:1px 4px;border-radius:4px;background:${isIntranet?'#d46b08':'#1677ff'};color:#fff;margin-left:4px;">${isIntranet?'内':'外'}</span>`
        : '';
      const col = document.createElement('div');
      col.className = 'url-card col-6 col-sm-4 col-md-3 col-xl-2';
      col.innerHTML = `<div class="url-body default"><a href="${url}" target="_blank" data-url="${item.url}" ${item.intranet?`data-intranet="${item.intranet}"`:''}  class="card no-c mb-4" data-toggle="tooltip" data-placement="bottom" data-original-title="${domain}"><div class="card-body"><div class="url-content d-flex align-items-center"><div class="url-img mr-2 d-flex align-items-center justify-content-center"><img src="${iconSrc}" onerror="this.src='${DEFAULT_ICON}';this.onerror=null;" alt="${title}"></div><div class="url-info flex-fill" style="min-width:0;"><div class="text-sm overflowClip_1"><strong>${title}</strong>${netBadge}</div><p class="overflowClip_1 m-0 text-muted text-xs">${desc}</p></div></div></div></a></div>`;
      row.appendChild(col);
    });
    if (isProtected) {
  row.style.display = 'none';

  const h4 = block.querySelector('h4');
  if (h4) {
    h4.style.cursor = 'pointer';
    h4.addEventListener('click', async () => {
      if (sessionStorage.getItem(section) === 'ok') {
        row.style.display = row.style.display === 'none' ? '' : 'none';
        return;
      }
      const pwd = prompt('请输入访问密码');
      if (!pwd) return;
      const hash = await sha256(pwd);
      if (hash === PROTECTED_PASSWORD_HASH) {
        sessionStorage.setItem(section, 'ok');
        row.style.display = '';
      } else {
        alert('密码错误');
      }
    });
  }
}

block.appendChild(row);
    block.appendChild(document.createElement('br'));
    main.appendChild(block);
  });
  if (typeof $ !== 'undefined') $('[data-toggle="tooltip"]').tooltip();
}

// ── 模态框 ───────────────────────────────────────────────
function renderModalCats() {
  const wrap = document.getElementById('search-modal-cats');
  if (!wrap) return;
  wrap.innerHTML = '';
  SEARCH_CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'modal-cat-btn' + (cat.id === currentCategoryId ? ' active' : '');
    btn.textContent = cat.label;
    btn.onclick = () => {
      currentCategoryId = cat.id; currentEngine = cat.engines[0];
      renderQuickEngines(); renderModalCats(); renderModalEngines();
      document.getElementById('search-modal-input')?.focus();
    };
    wrap.appendChild(btn);
  });
}
function renderModalEngines() {
  const wrap = document.getElementById('search-modal-engines');
  if (!wrap) return;
  wrap.innerHTML = '';
  const cat = SEARCH_CATEGORIES.find(c => c.id === currentCategoryId);
  if (!cat) return;
  cat.engines.forEach(engine => {
    const btn = document.createElement('button');
    btn.className = 'modal-engine-btn' + (engine === currentEngine ? ' active' : '');
    btn.textContent = engine.name;
    btn.onclick = () => {
      currentEngine = engine;
      renderQuickEngines(); renderModalEngines();
      document.getElementById('search-modal-input')?.focus();
    };
    wrap.appendChild(btn);
  });
}

// ── 入口 ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  localStorage.setItem('navMode', 'webstack');

  // 桌面端初始化侧边栏
  if (!isMobile()) {
    const sidebar  = getSidebar();
    const wrap     = document.getElementById('content-wrap');
    const topBar   = document.getElementById('top-bar');
    const expanded = localStorage.getItem('sidebarExpanded') !== '0';
    sidebar.classList.toggle('mini-sidebar', !expanded);
    sidebar.style.width   = expanded ? '180px' : '60px';
    wrap.style.marginLeft = expanded ? '180px' : '60px';
    topBar.style.left     = expanded ? '180px' : '60px';
  } else {
    const ms = getSidebar();
    ms.classList.remove('mini-sidebar');
    ms.style.removeProperty('width');
    ms.style.removeProperty('transform');
    ms.style.setProperty('display', 'flex', 'important');
  }

  // 遮罩关闭侧边栏
  getOverlay()?.addEventListener('click', closeMobileSidebar);

  // ── 模式切换：桌面侧边栏标题 + 移动端顶部标题都绑定 ──
  const sidebarTitle = document.getElementById('sidebar-logo-text');
  const mobileTitle  = document.getElementById('mobile-logo-text');
  if (sidebarTitle) sidebarTitle.addEventListener('click', toggleModeMenu);
  if (mobileTitle)  mobileTitle.addEventListener('click',  toggleModeMenu);

  // 点空白关闭菜单
  document.addEventListener('click', (e) => {
    if (_modeMenuEl && !_modeMenuEl.contains(e.target)) closeModeMenu();
  });

  // scroll 时跟随重定位
  window.addEventListener('scroll', () => {
    if (_modeMenuOpen && _modeAnchor) positionModeMenu(_modeAnchor);
  }, { passive: true });

  // 内外网
  document.getElementById('net-toggle-sidebar')?.addEventListener('click', toggleNetMode);
  updateNetBtn();

  renderTabs();
  renderQuickEngines();

  try {
    const res  = await fetch(LINKS_FILE);
    const data = await res.json();
    _allData = data;
    renderSidebar(data);
    renderContent(data);
  } catch (err) {
    console.error('加载 links.json 失败：', err);
    const el = document.getElementById('content');
    if (el) el.innerHTML = '<p style="color:#999;text-align:center;padding:3rem;">链接数据加载失败</p>';
  }
});
