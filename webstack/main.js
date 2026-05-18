/* ===========================
   王五导航 · WebStack主题 · main.js
   =========================== */

const WORKER_URL = 'https://ico.xmynscnq.dpdns.org';
const LINKS_FILE = '../links.json';

const DEFAULT_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0yIDEyaDIwIj48L3BhdGg+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+';

// ── 模式切换 ────────────────────────────────────────────────
const MODES      = ['normal', 'webstack', 'easy', 'nav'];
const MODE_PATHS = {
  normal:   '../normal/index.html',
  webstack: '../webstack/index.html',
  easy:     '../easy/index.html',
  nav:      '../nav/index.html',
};
function switchMode() {
  const cur  = 'webstack';
  const next = MODES[(MODES.indexOf(cur) + 1) % MODES.length];
  localStorage.setItem('navMode', next);
  window.location.href = MODE_PATHS[next];
}

// ── 内外网切换 ───────────────────────────────────────────────
let isIntranet = localStorage.getItem('netMode') === 'intranet';
let _allData   = null;

function getCardUrl(item) {
  return (isIntranet && item.intranet) ? item.intranet : item.url;
}

function updateNetBtn() {
  const btn = document.getElementById('net-toggle-sidebar');
  if (!btn) return;
  const label = btn.querySelector('.menu-label');
  const emoji = btn.querySelector('.sidebar-emoji');
  if (label) label.textContent = isIntranet ? '内网模式' : '外网模式';
  if (emoji) emoji.textContent = isIntranet ? '🏠' : '🌐';
  btn.classList.toggle('intranet-active', isIntranet);
}

function toggleNetMode() {
  isIntranet = !isIntranet;
  localStorage.setItem('netMode', isIntranet ? 'intranet' : 'internet');
  updateNetBtn();
  // 重新渲染卡片链接
  if (_allData) renderContent(_allData);
}
window.toggleNetMode = toggleNetMode;

// ── 移动端侧边栏 ─────────────────────────────────────────────
const MOBILE_BP = 768;
let isMobileView = window.innerWidth < MOBILE_BP;

function applyMobileState() {
  isMobileView = window.innerWidth < MOBILE_BP;
  const sidebar = document.getElementById('sidebar');
  const wrap    = document.getElementById('content-wrap');
  const topBar  = document.getElementById('top-bar');
  const overlay = document.getElementById('mobile-overlay');
  if (!sidebar) return;

  if (isMobileView) {
    sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('show');
    wrap.style.marginLeft = '0';
    topBar.style.left     = '0';
  } else {
    sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('show');
    const expanded = localStorage.getItem('sidebarExpanded') !== '0';
    sidebar.style.transform = '';
    sidebar.classList.toggle('mini-sidebar', !expanded);
    sidebar.style.width   = expanded ? '180px' : '60px';
    wrap.style.marginLeft = expanded ? '180px' : '60px';
    topBar.style.left     = expanded ? '180px' : '60px';
  }
}

window.addEventListener('resize', applyMobileState);
// ── 覆盖原侧边栏切换逻辑 ────────────────────────────────────
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const wrap     = document.getElementById('content-wrap');
  const topBar   = document.getElementById('top-bar');
  const overlay  = document.getElementById('mobile-overlay');

  if (isMobileView) {
    const isOpen = sidebar.classList.contains('mobile-open');
    sidebar.classList.toggle('mobile-open', !isOpen);
    if (overlay) overlay.classList.toggle('show', !isOpen);
  } else {
    const expanded = localStorage.getItem('sidebarExpanded') !== '0';
    const next     = !expanded;
    localStorage.setItem('sidebarExpanded', next ? '1' : '0');
    sidebar.classList.toggle('mini-sidebar', !next);
    sidebar.style.width   = next ? '180px' : '60px';
    wrap.style.marginLeft = next ? '180px' : '60px';
    topBar.style.left     = next ? '180px' : '60px';
  }
}
window.toggleSidebar = toggleSidebar;

// ── 工具函数 ─────────────────────────────────────────────────
function sectionLabel(section) {
  return section.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+/u, '').trim();
}
function sectionEmoji(section) {
  const m = section.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/u);
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
function engineFavicon(e) { return buildFaviconUrl(e.domain); }
function sectionId(s) {
  return 'sec-' + s.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
}

// ── 搜索分类数据 ─────────────────────────────────────────────
const SEARCH_CATEGORIES = [
  {
    id: 'engine', label: '引擎',
    engines: [
      { name: '百度',       url: 'https://www.baidu.com/s?wd=',           domain: 'baidu.com' },
      { name: 'Google',     url: 'https://www.google.com/search?q=',      domain: 'google.com' },
      { name: 'Brave',      url: 'https://search.brave.com/search?q=',    domain: 'search.brave.com' },
      { name: '搜狗',       url: 'https://www.sogou.com/web?query=',      domain: 'sogou.com' },
      { name: 'Bing',       url: 'https://www.bing.com/search?q=',        domain: 'bing.com' },
      { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',            domain: 'duckduckgo.com' },
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
let currentEngine     = SEARCH_CATEGORIES[0].engines[0];
let enginePanelOpen   = false;

// ── 渲染分类 Tab ─────────────────────────────────────────────
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
      currentEngine     = cat.engines[0];
      renderTabs();
      updateEngineDisplay();
      renderQuickEngines();
      if (enginePanelOpen) renderEngineList();
    };
    el.appendChild(label);
  });
}

function updateEngineDisplay() {}

// ── 快捷引擎 ─────────────────────────────────────────────────
function renderQuickEngines() {
  const wrap = document.getElementById('quick-engines');
  if (!wrap) return;
  wrap.innerHTML = '';
  const cat = SEARCH_CATEGORIES.find(c => c.id === currentCategoryId);
  if (!cat) return;
  cat.engines.forEach(engine => {
    const btn = document.createElement('button');
    btn.type      = 'button';
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

// ── 搜索执行 ─────────────────────────────────────────────────
function doSearch(e) {
  if (e) e.preventDefault();
  const kw = document.getElementById('search-text')?.value.trim();
  if (kw) window.open(currentEngine.url + encodeURIComponent(kw), '_blank');
}
window.doSearch = doSearch;

function onSearchKeydown(e) {
  if (e.key === 'Escape') {
    const input = document.getElementById('search-text');
    if (input) input.value = '';
  }
}
window.onSearchKeydown = onSearchKeydown;

// ── 站内筛选 ─────────────────────────────────────────────────
function filterCards(query) {
  query = (query || '').toLowerCase().trim();
  document.querySelectorAll('.ws-section').forEach(block => {
    let hasVisible = false;
    block.querySelectorAll('.url-card').forEach(card => {
      const title = card.querySelector('strong')?.textContent.toLowerCase() ?? '';
      const desc  = card.querySelector('p')?.textContent.toLowerCase() ?? '';
      const show  = !query || title.includes(query) || desc.includes(query);
      card.style.display = show ? '' : 'none';
      if (show) hasVisible = true;
    });
    block.style.display = (!query || hasVisible) ? '' : 'none';
  });
}
window.filterCards = filterCards;

// ── 渲染侧边栏 ───────────────────────────────────────────────
function renderSidebar(sections) {
  const menu = document.getElementById('main-menu');
  if (!menu) return;
  menu.innerHTML = '';
  sections.forEach(({ section }) => {
    const id    = sectionId(section);
    const emoji = sectionEmoji(section);
    const label = sectionLabel(section);
    const li    = document.createElement('li');
    li.className = 'sidebar-item';
    const a = document.createElement('a');
    a.href      = '#' + id;
    a.className = 'nav-smooth';
    a.innerHTML = `<span class="sidebar-emoji">${emoji}</span><span class="menu-label">${label}</span>`;
    li.appendChild(a);
    menu.appendChild(li);
  });

  document.querySelectorAll('a.nav-smooth').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.getElementById(this.getAttribute('href').substring(1));
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 54 - 8;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      document.querySelectorAll('#main-menu li').forEach(l => l.classList.remove('active'));
      this.parentElement.classList.add('active');
      // 移动端点击后关闭侧边栏
      if (isMobileView) {
        sidebar.classList.remove('mobile-open');
        const overlay = document.getElementById('mobile-overlay');
        if (overlay) overlay.classList.remove('show');
      }
    });
  });
}

// ── 渲染内容区 ───────────────────────────────────────────────
function renderContent(sections) {
  const main = document.getElementById('content');
  if (!main) return;
  main.innerHTML = '';

  sections.forEach(({ section, items }) => {
    const id    = sectionId(section);
    const emoji = sectionEmoji(section);
    const label = sectionLabel(section);

    const block = document.createElement('div');
    block.className = 'ws-section';

    const heading = document.createElement('div');
    heading.className = 'd-flex flex-fill';
    heading.innerHTML = `
      <h4 class="text-gray text-lg mb-4" id="${id}">
        <span class="section-emoji mr-1">${emoji}</span>${label}
      </h4>`;
    block.appendChild(heading);

    const row = document.createElement('div');
    row.className = 'row';

    items.forEach(item => {
      const url      = getCardUrl(item);
      const iconSrc  = item.icon || faviconSrc(url);
      const title    = (item.title || '').replace(/</g, '&lt;');
      const desc     = (item.desc || item['data-desc'] || '').replace(/</g, '&lt;');
      const domain   = getDomain(url) || url;
      const hasNet   = !!item.intranet;
      const netBadge = hasNet
        ? `<span class="net-badge" style="font-size:0.6rem;padding:1px 4px;border-radius:4px;background:${isIntranet ? '#d46b08' : '#1677ff'};color:#fff;margin-left:4px;">${isIntranet ? '内' : '外'}</span>`
        : '';

      const col = document.createElement('div');
      // 移动端2列，小屏3列，中屏4列，大屏6列
      col.className = 'url-card col-6 col-sm-4 col-md-3 col-xl-2';
      col.innerHTML = `
        <div class="url-body default">
          <a href="${url}" target="_blank"
             data-url="${item.url}"
             ${item.intranet ? `data-intranet="${item.intranet}"` : ''}
             class="card no-c mb-4 ${hasNet ? 'has-net' : ''}"
             data-toggle="tooltip" data-placement="bottom"
             data-original-title="${domain}">
            <div class="card-body">
              <div class="url-content d-flex align-items-center">
                <div class="url-img mr-2 d-flex align-items-center justify-content-center">
                  <img src="${iconSrc}" onerror="this.src='${DEFAULT_ICON}';this.onerror=null;" alt="${title}">
                </div>
                <div class="url-info flex-fill" style="min-width:0;">
                  <div class="text-sm overflowClip_1">
                    <strong>${title}</strong>${netBadge}
                  </div>
                  <p class="overflowClip_1 m-0 text-muted text-xs">${desc}</p>
                </div>
              </div>
            </div>
          </a>
        </div>`;
      row.appendChild(col);
    });

    block.appendChild(row);
    block.appendChild(document.createElement('br'));
    main.appendChild(block);
  });

  if (typeof $ !== 'undefined') {
    $('[data-toggle="tooltip"]').tooltip();
  }
}

// ── 搜索模态框（引擎列表） ───────────────────────────────────
function renderEngineList() {
  const panel = document.getElementById('search-list');
  if (!panel) return;
  panel.innerHTML = '';
  const cat = SEARCH_CATEGORIES.find(c => c.id === currentCategoryId);
  if (!cat) return;
  const ul = document.createElement('ul');
  ul.className = 'search-type';
  cat.engines.forEach((engine, idx) => {
    const li    = document.createElement('li');
    const id    = `ws-engine-${idx}`;
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'ws-type'; input.id = id; input.hidden = true;
    if (engine === currentEngine) input.checked = true;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.innerHTML = `<span>${engine.name}</span>`;
    label.onclick = () => {
      currentEngine = engine;
      updateEngineDisplay(); renderEngineList(); renderQuickEngines();
      document.getElementById('search-text')?.focus();
    };
    li.appendChild(input); li.appendChild(label); ul.appendChild(li);
  });
  panel.appendChild(ul);
}

function renderModalCats() {
  const wrap = document.getElementById('search-modal-cats');
  if (!wrap) return;
  wrap.innerHTML = '';
  SEARCH_CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className   = 'modal-cat-btn' + (cat.id === currentCategoryId ? ' active' : '');
    btn.textContent = cat.label;
    btn.onclick = () => {
      currentCategoryId = cat.id; currentEngine = cat.engines[0];
      updateEngineDisplay(); renderQuickEngines();
      renderModalCats(); renderModalEngines();
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
    btn.className   = 'modal-engine-btn' + (engine === currentEngine ? ' active' : '');
    btn.textContent = engine.name;
    btn.onclick = () => {
      currentEngine = engine;
      updateEngineDisplay(); renderQuickEngines(); renderModalEngines();
      document.getElementById('search-modal-input')?.focus();
    };
    wrap.appendChild(btn);
  });
}

// ── 入口 ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 记录当前模式
  localStorage.setItem('navMode', 'webstack');

  // 初始化移动端状态
  applyMobileState();

  // 移动端遮罩点击关闭侧边栏（已在index.html绑定，这里不重复）

  // 绑定标题切换模式
  const logoText = document.getElementById('sidebar-logo-text');
  if (logoText) {
    logoText.style.cursor = 'pointer';
    logoText.title = '点击切换模式';
    logoText.addEventListener('click', switchMode);
  }

  // 绑定内外网切换按钮
  const netBtn = document.getElementById('net-toggle-sidebar');
  if (netBtn) netBtn.addEventListener('click', toggleNetMode);
  updateNetBtn();

  renderTabs();
  updateEngineDisplay();
  renderQuickEngines();

  try {
    const res  = await fetch(LINKS_FILE);
    const data = await res.json();
    _allData   = data;
    renderSidebar(data);
    renderContent(data);
  } catch (err) {
    console.error('加载 links.json 失败：', err);
    const el = document.getElementById('content');
    if (el) el.innerHTML = '<p style="color:#999;text-align:center;padding:3rem;">链接数据加载失败</p>';
  }
});
