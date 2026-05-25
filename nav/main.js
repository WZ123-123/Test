/* ===========================
   王五导航 · nav/main.js
   =========================== */

// ── 模式切换 ────────────────────────────────────────────────
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
function switchMode() {
  const cur  = 'nav';
  const next = MODES[(MODES.indexOf(cur) + 1) % MODES.length];
  localStorage.setItem('navMode', next);
  window.location.href = MODE_PATHS[next];
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

// ── 引擎面板（始终显示在搜索框下方）────────────────────────
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

// ── 分区标题去 emoji ─────────────────────────────────────────
function sectionLabel(s) {
  return s.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{20E3}\uFE0F\u{1F1E0}-\u{1F1FF}]+/gu, '').trim();
}

// ── 渲染卡片 ─────────────────────────────────────────────────
function renderCards(sections) {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = '';
  sections.forEach(({ section, items }) => {
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
    card.addEventListener('touchstart', () => {
      clearActive();
      timer = setTimeout(() => {
        // 长按时把 info-popup 内容改为 desc 描述
        const popup = card.querySelector('.info-popup');
        if (popup) {
          const desc = card.dataset.desc || '';
          popup.textContent = desc || card.querySelector('.title')?.textContent || '';
        }
        card.classList.add('touch-active'); activeCard = card;
        setTimeout(clearActive, 2000);
      }, 500);
    }, { passive: true });
    card.addEventListener('touchend',  () => { if (timer) clearTimeout(timer); });
    card.addEventListener('touchmove', () => { clearTimeout(timer); timer = null; }, { passive: true });
  });
  document.addEventListener('touchstart', e => {
    if (activeCard && !activeCard.contains(e.target)) clearActive();
  }, { passive: true });
}

/* ── 入口 ── */
document.addEventListener('DOMContentLoaded', async () => {
  localStorage.setItem('navMode', 'nav');

  const title = document.getElementById('site-title');
  if (title) title.addEventListener('click', switchMode);

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
