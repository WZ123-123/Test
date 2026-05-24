/* ===========================
   王五导航 · normal/main.js
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
  const cur  = 'normal';
  const next = MODES[(MODES.indexOf(cur) + 1) % MODES.length];
  localStorage.setItem('navMode', next);
  window.location.href = MODE_PATHS[next];
}

document.addEventListener('DOMContentLoaded', () => {
  const title = document.getElementById('site-title');
  if (title) title.addEventListener('click', switchMode);
});

// ── 图标 & 背景 配置 ────────────────────────────────────────
const WORKER_URL    = 'https://ico.xmynscnq.dpdns.org';
const BG_WORKER_URL = 'https://xin88.xmynscnq.dpdns.org';

function buildFaviconUrl(domain) {
  if (!domain) return DEFAULT_ICON;
  return `${WORKER_URL}/?domain=${domain}`;
}

// ── 内外网切换 ────────────────────────────────────────────────
let isIntranet = localStorage.getItem('netMode') === 'intranet';
let _linksData = null;

function getCardUrl(item) {
  return (isIntranet && item.intranet) ? item.intranet : item.url;
}

// ── Open-Meteo 天气 ────────────────────────────────────────
function getWeatherIcon(code) {
  if (code === 0)  return '☀️';
  if (code <= 2)   return '🌤';
  if (code === 3)  return '☁️';
  if (code <= 49)  return '🌫';
  if (code <= 59)  return '🌦';
  if (code <= 69)  return '🌧';
  if (code <= 79)  return '❄️';
  if (code <= 84)  return '🌧';
  if (code <= 99)  return '⛈';
  return '🌈';
}

function getWeatherText(code) {
  if (code === 0)  return '晴';
  if (code <= 2)   return '少云';
  if (code === 3)  return '阴';
  if (code <= 49)  return '雾';
  if (code <= 59)  return '毛毛雨';
  if (code <= 69)  return '雨';
  if (code <= 79)  return '雪';
  if (code <= 84)  return '阵雨';
  if (code <= 99)  return '雷雨';
  return '未知';
}

function getWindDirection(deg) {
  const dirs = ['北','东北','东','东南','南','西南','西','西北'];
  return dirs[Math.round(deg / 45) % 8];
}

function makeWeatherLink(text) {
  const a = document.createElement('a');
  a.textContent = text;
  a.href   = 'https://www.weather.com.cn/weather1d/101060101.shtml';
  a.target = '_blank';
  a.rel    = 'noopener noreferrer';
  a.style.cssText = `
    color:inherit;text-decoration:none;cursor:pointer;
    border-bottom:1px dashed rgba(255,255,255,0.45);
    transition:color .2s,border-color .2s;
  `;
  a.addEventListener('mouseover', () => {
    a.style.color            = '#a8f5ab';
    a.style.borderBottomColor = '#a8f5ab';
  });
  a.addEventListener('mouseout', () => {
    a.style.color            = '';
    a.style.borderBottomColor = 'rgba(255,255,255,0.45)';
  });
  return a;
}

async function loadWeather(el) {
  el.textContent  = '📍 长春';
  el.style.opacity = '1';

  const cached = sessionStorage.getItem('weather_cache');
  if (cached) {
    try {
      const { text, ts } = JSON.parse(cached);
      if (Date.now() - ts < 5 * 60 * 1000) {
        el.innerHTML = '';
        el.appendChild(makeWeatherLink(text));
        return;
      }
    } catch {}
  }

  const lon = 125.3245, lat = 43.8868;
  try {
    const res  = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weathercode,relative_humidity_2m,winddirection_10m` +
      `&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=1`
    );
    const data = await res.json();
    const temp    = Math.round(data.current.temperature_2m);
    const code    = data.current.weathercode;
    const humid   = data.current.relative_humidity_2m;
    const tmax    = Math.round(data.daily.temperature_2m_max[0]);
    const tmin    = Math.round(data.daily.temperature_2m_min[0]);
    const winddir = getWindDirection(data.current.winddirection_10m);
    const icon    = getWeatherIcon(code);
    const wtxt    = getWeatherText(code);
    const text    = `📍 长春  ${icon} ${wtxt}  ${temp}°C（今日 ${tmin}~${tmax}°C）  💧${humid}%  💨 ${winddir}风`;
    sessionStorage.setItem('weather_cache', JSON.stringify({ text, ts: Date.now() }));
    el.innerHTML = '';
    el.appendChild(makeWeatherLink(text));
  } catch (e) {
    console.error('天气错误:', e);
    el.textContent = '⚠️ 天气获取失败，请稍后刷新';
  }
}

async function loadHeaderSubtitle() {
  const el = document.getElementById('daily-quote');
  if (!el) return;
  let count = parseInt(sessionStorage.getItem('pageView') || '0') + 1;
  sessionStorage.setItem('pageView', String(count));
  if (count % 2 === 1) {
    await loadWeather(el);
  } else {
    try {
      const res  = await fetch('../quotes.json');
      const data = await res.json();
      const q    = data[Math.floor(Math.random() * data.length)];
      const text = q.text ?? '';
      const from = q.from  ?? '';
      el.textContent = from ? `${text}　——${from}` : text;
    } catch {
    } finally {
      el.style.opacity = '1';
    }
  }
}

function toggleNetMode() {
  isIntranet = !isIntranet;
  localStorage.setItem('netMode', isIntranet ? 'intranet' : 'internet');
  updateNetToggleBtn();
  document.querySelectorAll('.card[data-url][data-intranet]').forEach(a => {
    const url  = isIntranet ? a.dataset.intranet : a.dataset.url;
    a.href     = url;
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

// ── 背景视频 ────────────────────────────────────────────────
const PC_JSON  = '../wallpapers/pc.js';
const PH_JSON  = '../wallpapers/ph.js';
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

async function changeBackground() {
  const video   = document.getElementById('bgLayer');
  const jsonUrl = isMobile ? PH_JSON : PC_JSON;
  const list    = await fetch(jsonUrl).then(r => r.json()).catch(() => null);
  if (!list || list.length === 0) return;
  const file = list[Math.floor(Math.random() * list.length)];
  const src  = `${BG_WORKER_URL}/video/${file.trim()}`;
  video.dataset.currentSrc = src;
  video.src = src;
  video.load();
  video.play().catch(() => {});
}

function reloadBackground() {
  const video = document.getElementById('bgLayer');
  const src   = video.dataset.currentSrc;
  if (!src) { changeBackground(); return; }
  video.src = src;
  video.load();
  video.play().catch(() => {});
}

// ── 常量 ────────────────────────────────────────────────────
const LINKS_FILE  = '../links.json';
const DEFAULT_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0yIDEyaDIwIj48L3BhdGg+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+';

/* ── 搜索分类数据 ── */
const SEARCH_CATEGORIES = [
  {
    id: 'engine', label: '引擎', icon: '🔍',
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
      { name: '网易云', url: 'https://music.163.com/#/search/m/?s=',                                                    domain: 'music.163.com' },
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
      { name: '智联招聘', url: 'https://sou.zhaopin.com/?jl=530&kw=',                         domain: 'zhaopin.com' },
      { name: 'BOSS直聘', url: 'https://www.zhipin.com/web/geek/job?query=',                  domain: 'zhipin.com' },
      { name: '猎聘',     url: 'https://www.liepin.com/zhaopin/?key=',                        domain: 'liepin.com' },
      { name: '前程无忧', url: 'https://search.51job.com/list/000000,000000,0000,00,9,99,',   domain: '51job.com' },
      { name: '拉勾网',   url: 'https://www.lagou.com/wn/jobs?kd=',                           domain: 'lagou.com' },
    ]
  },
];

let currentCategoryId = 'engine';
let currentEngine     = SEARCH_CATEGORIES[0].engines[0];
let enginePanelOpen   = false;

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return null; }
}
function faviconSrc(url)    { return buildFaviconUrl(getDomain(url)); }
function engineFavicon(e) {
  return e.icon ? e.icon : buildFaviconUrl(e.domain);
}

function renderSearchTabs() {
  const tabsEl = document.getElementById('searchTabs');
  tabsEl.innerHTML = '';
  SEARCH_CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'search-tab' + (cat.id === currentCategoryId ? ' active' : '');
    btn.innerHTML = `<span class="tab-icon">${cat.icon}</span><span class="tab-label">${cat.label}</span>`;
    btn.onclick = () => { selectCategory(cat.id); if (enginePanelOpen) renderEnginePanel(); };
    tabsEl.appendChild(btn);
  });
}

function updateSearchBoxEngine() {
  const icon   = document.getElementById('search-engine-icon');
  const nameEl = document.getElementById('engineName');
  icon.src = engineFavicon(currentEngine);
  icon.onerror = () => { icon.src = DEFAULT_ICON; icon.onerror = null; };
  nameEl.textContent = currentEngine.name;
}

function selectCategory(catId) {
  currentCategoryId = catId;
  const cat = SEARCH_CATEGORIES.find(c => c.id === catId);
  currentEngine = cat.engines[0];
  renderSearchTabs();
  updateSearchBoxEngine();
}

function selectEngine(engine) {
  currentEngine = engine;
  updateSearchBoxEngine();
  renderEnginePanel();
  document.getElementById('searchInput').focus();
}

function renderEnginePanel() {
  const panel = document.getElementById('enginePanel');
  panel.innerHTML = '';
  const cat = SEARCH_CATEGORIES.find(c => c.id === currentCategoryId);
  if (!cat) return;
  cat.engines.forEach(engine => {
    const btn = document.createElement('button');
    btn.className = 'engine-btn' + (engine === currentEngine ? ' active' : '');
    const img = document.createElement('img');
    img.src = engineFavicon(engine);
    img.alt = engine.name;
    img.onerror = function () { this.src = DEFAULT_ICON; this.onerror = null; };
    const label = document.createElement('span');
    label.textContent = engine.name;
    btn.appendChild(img); btn.appendChild(label);
    btn.onclick = () => selectEngine(engine);
    panel.appendChild(btn);
  });
}

function toggleEnginePanel() { enginePanelOpen ? closeEnginePanel() : openEnginePanel(); }

function openEnginePanel() {
  enginePanelOpen = true;
  renderEnginePanel();
  document.getElementById('enginePanel').style.display = 'flex';
  document.getElementById('engineArrow').style.transform = 'rotate(180deg)';
}

function closeEnginePanel() {
  enginePanelOpen = false;
  document.getElementById('enginePanel').style.display = 'none';
  document.getElementById('engineArrow').style.transform = '';
}

function clearSearch() {
  const input    = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');
  input.value    = '';
  clearBtn.style.display = 'none';
  input.focus();
  filterLinks();
}
window.clearSearch = clearSearch;

function syncClearBtn() {
  const input    = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');
  clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
}

function doSearch() {
  const kw = document.getElementById('searchInput').value.trim();
  if (kw) window.open(currentEngine.url + encodeURIComponent(kw), '_blank');
}
window.doSearch = doSearch;

function filterLinks() {
  syncClearBtn();
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
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

function renderCards(sections) {
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  sections.forEach(({ section, items }) => {
    const sec  = document.createElement('div');
    sec.className = 'section';
    const h2   = document.createElement('h2');
    h2.className = 'section-title';
    h2.textContent = section;
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
      img.className = 'favicon'; img.loading = 'lazy';
      img.src = item.icon ? item.icon : faviconSrc(item.url);
      img.onerror = function () { this.src = DEFAULT_ICON; this.onerror = null; };
      const top = document.createElement('div');
      top.className = 'card-top';
      const titleEl = document.createElement('span');
      titleEl.className   = 'title';
      titleEl.textContent = item.title;
      top.appendChild(img); top.appendChild(titleEl);
      const desc = document.createElement('div');
      desc.className   = 'desc';
      desc.textContent = item.desc ?? '';
      const popup = document.createElement('div');
      popup.className   = 'info-popup';
      popup.textContent = getDomain(getCardUrl(item)) ?? getCardUrl(item);
      a.appendChild(top); a.appendChild(desc); a.appendChild(popup);
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
  localStorage.setItem('navMode', 'normal');

  changeBackground();
  loadHeaderSubtitle();

  const video = document.getElementById('bgLayer');
  let _bgErrorCount = 0, _bgPlayedOnce = false;

  if (video) {
    video.addEventListener('timeupdate', () => {
      if (video.duration && video.currentTime >= video.duration - 0.2) {
        video.currentTime = 0; video.play().catch(() => {});
      }
    });
    video.addEventListener('ended', () => { video.currentTime = 0; video.play().catch(() => {}); });
    video.addEventListener('error', () => {
      _bgErrorCount++;
      if (_bgErrorCount <= 2) setTimeout(reloadBackground, 1000 * _bgErrorCount);
      else console.warn(`[BG] 连续失败 ${_bgErrorCount} 次，已放弃加载背景视频`);
    });
    video.addEventListener('playing', () => { _bgErrorCount = 0; _bgPlayedOnce = true; clearTimeout(stallTimer); });
    let stallTimer = null;
    video.addEventListener('waiting', () => {
      stallTimer = setTimeout(() => { if (video.readyState < 2 && _bgErrorCount <= 2) reloadBackground(); }, 5000);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { video.pause(); return; }
      setTimeout(() => {
        if (_bgPlayedOnce) {
          if (video.ended || video.error || video.readyState < 3) reloadBackground();
          else video.play().catch(() => reloadBackground());
        } else {
          if (_bgErrorCount <= 2) {
            if (video.ended || video.error || video.readyState < 3) reloadBackground();
            else video.play().catch(() => {});
          }
        }
      }, 800);
    });
    let watchdogTimer = null;
    function startWatchdog() {
      clearInterval(watchdogTimer);
      watchdogTimer = setInterval(() => {
        if (document.visibilityState === 'hidden') return;
        if (video.paused && !video.ended) return;
        if (video.readyState < 2) reloadBackground();
      }, 5000);
    }
    video.addEventListener('playing', startWatchdog);
    video.addEventListener('pause',   () => clearInterval(watchdogTimer));
    startWatchdog();
  }

  renderSearchTabs();
  updateSearchBoxEngine();
  injectNetToggleBtn();
  updateNetToggleBtn();

  document.getElementById('engineTrigger').addEventListener('click', toggleEnginePanel);
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter')  doSearch();
    if (e.key === 'Escape') closeEnginePanel();
  });

  try {
    const res  = await fetch(LINKS_FILE);
    const data = await res.json();
    _linksData = data;
    renderCards(data);
  } catch (err) {
    console.error('加载 links.json 失败：', err);
    document.getElementById('main-content').innerHTML =
      '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:2rem;">链接数据加载失败，请检查 links.json 文件。</p>';
  }
});
