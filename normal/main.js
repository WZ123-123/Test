/* ===========================
   王五导航 · normal/main.js
   =========================== */

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
  webstack: { label: 'WebStack', desc: '侧栏导航',  icon: '📐', color: '#60a5fa' },
  easy:     { label: 'Easy',     desc: '极简搜索',  icon: '🔲', color: '#aaaaaa' },
  nav:      { label: 'Nav',      desc: '渐变主题',  icon: '🌊', color: '#a78bfa' },
  '5iux':   { label: '5IUX',    desc: '亮色简洁',  icon: '✨', color: '#667eea' },
  kim:      { label: 'Kim',      desc: '极彩背景',  icon: '🎨', color: '#f472b6' },
  ai:       { label: 'AI',       desc: 'AI 助手',   icon: '🤖', color: '#f59e0b' },
};
const CURRENT_MODE = 'normal';

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
      gap: 8px;
      padding: 10px;
      border-radius: 16px;
      background: rgba(10, 10, 20, 0.82);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid rgba(255,255,255,0.15);
      max-width: 360px;
    }
    #__mode-menu.open { display: flex; }
    #__mode-menu.layout-below {
      flex-direction: column;
      max-width: 220px;
    }
    .__mc {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 11px;
      text-decoration: none;
      border: 1px solid transparent;
      transition: background 0.15s;
      cursor: pointer;
      min-width: 90px;
    }
    #__mode-menu:not(.layout-below) .__mc {
      flex-direction: column;
      align-items: center;
      gap: 5px;
      padding: 11px 10px;
      min-width: 72px;
      max-width: 72px;
    }
    .__mc:hover { background: rgba(255,255,255,0.12); }
    .__mc.cur   { background: rgba(255,255,255,0.16); border-color: rgba(255,255,255,0.28); }
    .__mc-icon  { font-size: 20px; line-height: 1; }
    .__mc-body  { display: flex; flex-direction: column; gap: 2px; }
    #__mode-menu:not(.layout-below) .__mc-body { align-items: center; }
    .__mc-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.92); line-height: 1; }
    .__mc-desc  { font-size: 10px; color: rgba(255,255,255,0.48); line-height: 1; }
    #__mode-menu.layout-below .__mc-check { margin-left: auto; font-size: 11px; color: rgba(255,255,255,0.45); }
    #__mode-menu:not(.layout-below) .__mc-check { display: none; }
    .__mc-dot {
      width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
    }
    #__mode-menu:not(.layout-below) .__mc-dot { display: none; }
  `;
  document.head.appendChild(style);

  const menu = document.createElement('div');
  menu.id = '__mode-menu';

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
    const menuW = Math.min(220, window.innerWidth - 24);
    let left = rect.left + rect.width / 2 - menuW / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - menuW - 12));
    menu.style.top     = (rect.bottom + GAP + window.scrollY) + 'px';
    menu.style.left    = left + 'px';
    menu.style.right   = 'auto';
    menu.style.maxWidth = menuW + 'px';
  } else {
    menu.style.top    = (rect.top + window.scrollY + rect.height / 2 - 50) + 'px';
    menu.style.left   = (rect.right + GAP) + 'px';
    menu.style.right  = 'auto';
    menu.style.maxWidth = '360px';

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

function makeWeatherLink(text, cityName) {
  const a = document.createElement('a');
  a.textContent = text;
  a.href   = '#';
  a.target = '_blank';
  a.rel    = 'noopener noreferrer';
  a.style.cssText = `
    color:inherit;text-decoration:none;cursor:pointer;
    border-bottom:1px dashed rgba(255,255,255,0.45);
    transition:color .2s,border-color .2s;
  `;
  a.addEventListener('mouseover', () => {
    a.style.color             = '#a8f5ab';
    a.style.borderBottomColor = '#a8f5ab';
  });
  a.addEventListener('mouseout', () => {
    a.style.color             = '';
    a.style.borderBottomColor = 'rgba(255,255,255,0.45)';
  });
  a.addEventListener('click', e => {
    e.preventDefault();
    showCityEditor();
  });
  return a;
}

async function loadWeather(el) {
  const saved = JSON.parse(localStorage.getItem('weather_city') || 'null');
  let cityName, lat, lon;
  if (saved) {
    cityName = saved.name; lat = saved.lat; lon = saved.lon;
  } else {
    try {
      const ipRes  = await fetch('https://ipapi.co/json/');
      const ipData = await ipRes.json();
      cityName = ipData.city || '长春';
      lat      = ipData.latitude  || 43.8868;
      lon      = ipData.longitude || 125.3245;
    } catch {
      cityName = '长春'; lat = 43.8868; lon = 125.3245;
    }
  }

  el.textContent   = `📍 ${cityName}`;
  el.style.opacity = '1';

  const cacheKey = `weather_cache_${lat}_${lon}`;
  const cached   = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { text, ts } = JSON.parse(cached);
      if (Date.now() - ts < 5 * 60 * 1000) {
        el.innerHTML = '';
        el.appendChild(makeWeatherLink(text, cityName));
        return;
      }
    } catch {}
  }

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
    const text    = `📍 ${cityName}  ${icon} ${wtxt}  ${temp}°C（今日 ${tmin}~${tmax}°C）  💧${humid}%  💨 ${winddir}风`;
    sessionStorage.setItem(cacheKey, JSON.stringify({ text, ts: Date.now() }));
    el.innerHTML = '';
    el.appendChild(makeWeatherLink(text, cityName));
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
    { name: '百度',       url: 'https://www.baidu.com/s?wd=',                                              domain: 'baidu.com',             icon: '../icons/engines/baidu.svg' },
    { name: 'Google',     url: 'https://www.google.com/search?q=',                                         domain: 'google.com',            icon: '../icons/engines/google.svg' },
    { name: 'Brave',      url: 'https://search.brave.com/search?q=',                                       domain: 'search.brave.com',      icon: '../icons/engines/brave.svg' },
    { name: '搜狗',       url: 'https://www.sogou.com/web?query=',                                         domain: 'sogou.com',             icon: '../icons/engines/sougou.svg' },
    { name: 'Bing',       url: 'https://www.bing.com/search?q=',                                           domain: 'bing.com',              icon: '../icons/engines/bing.svg' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',                                               domain: 'duckduckgo.com',        icon: '../icons/engines/duckduckgo.svg' },
    { name: '360',        url: 'https://www.so.com/s?q=',                                                  domain: 'so.com',                icon: '../icons/engines/360.svg' },
    { name: '夸克',       url: 'https://www.quark.cn/s?q=',                                                domain: 'quark.cn',              icon: '../icons/engines/kuake.svg' },
  ]
},
{
  id: 'community', label: '社区', icon: '💬',
  engines: [
    { name: 'GitHub', url: 'https://github.com/search?q=',                                                domain: 'github.com',            icon: '../icons/engines/github.svg' },
    { name: '微博',   url: 'https://s.weibo.com/weibo?q=',                                                 domain: 'weibo.com',             icon: '../icons/engines/weibo.svg' },
    { name: '知乎',   url: 'https://www.zhihu.com/search?q=',                                              domain: 'zhihu.com',             icon: '../icons/engines/zhihu.svg' },
    { name: '豆瓣',   url: 'https://www.douban.com/search?q=',                                             domain: 'douban.com',            icon: '../icons/engines/douban.svg' },
    { name: '贴吧',   url: 'https://tieba.baidu.com/f/search/res?qw=',                                     domain: 'tieba.baidu.com',       icon: '../icons/engines/tieba.svg' },
    { name: 'Reddit', url: 'https://www.reddit.com/search/?q=',                                            domain: 'reddit.com',            icon: '../icons/engines/reddit.svg' },
  ]
},
{
  id: 'video', label: '视频', icon: '🎬',
  engines: [
    { name: 'B站',    url: 'https://search.bilibili.com/all?keyword=',                                    domain: 'bilibili.com',          icon: '../icons/engines/bilibili.svg' },
    { name: '抖音',    url: 'https://www.douyin.com/search/',                                              domain: 'douyin.com',          icon: '../icons/engines/douyin.svg' },
    { name: '腾讯',   url: 'https://v.qq.com/search.html#stag=0&s=',                                       domain: 'v.qq.com',              icon: '../icons/engines/tengxun.svg' },
    { name: '爱奇艺', url: 'https://so.iqiyi.com/so/q_',                                                   domain: 'iqiyi.com',             icon: '../icons/engines/iqiyi.svg' },
    { name: '优酷',   url: 'https://so.youku.com/search_video/q_',                                         domain: 'youku.com',             icon: '../icons/engines/youku.svg' },
    { name: '芒果',   url: 'https://so.mgtv.com/so/k-',                                                    domain: 'mgtv.com',              icon: '../icons/engines/mgtv.svg' },
  ]
},
{
  id: 'music', label: '音乐', icon: '🎵',
  engines: [
    { name: 'QQ音乐', url: 'https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=song&w=', domain: 'y.qq.com',         icon: '../icons/engines/qqmusic.svg' },
    { name: '网易云', url: 'https://music.163.com/#/search/m/?s=',                                                          domain: 'music.163.com',   icon: '../icons/engines/wangyiyun.svg' },
  ]
},
{
  id: 'life', label: '生活', icon: '🛒',
  engines: [
    { name: '淘宝',   url: 'https://s.taobao.com/search?q=',                                             domain: 'taobao.com',            icon: '../icons/engines/taobao.svg' },
    { name: '京东',   url: 'https://search.jd.com/Search?keyword=',                                      domain: 'jd.com',                icon: '../icons/engines/jingdong.svg' },
    { name: '拼多多', url: 'https://mobile.yangkeduo.com/search_result.html?search_key=',                 domain: 'pinduoduo.com',         icon: '../icons/engines/pinduoduo.svg' },
    { name: '做菜',   url: 'https://www.xiachufang.com/search/?keyword=',                                 domain: 'xiachufang.com',        icon: '../icons/engines/xiachufang.svg' },
    { name: '翻译',   url: 'https://fanyi.baidu.com/#zh/en/',                                            domain: 'fanyi.baidu.com',       icon: '../icons/engines/baidufanyi.svg' },
  ]
},
{
  id: 'job', label: '求职', icon: '💼',
  engines: [
    { name: '智联招聘', url: 'https://sou.zhaopin.com/?jl=530&kw=',                                      domain: 'zhaopin.com',           icon: '../icons/engines/zhilianzhaopin.svg' },
    { name: 'BOSS直聘', url: 'https://www.zhipin.com/web/geek/job?query=',                               domain: 'zhipin.com',            icon: '../icons/engines/boss.svg' },
    { name: '猎聘',     url: 'https://www.liepin.com/zhaopin/?key=',                                     domain: 'liepin.com',            icon: '../icons/engines/liepin.ico' },
    { name: '前程无忧', url: 'https://search.51job.com/list/000000,000000,0000,00,9,99,',                domain: '51job.com',             icon: '../icons/engines/qianchengwuyou.svg' },
    { name: '拉勾网',   url: 'https://www.lagou.com/wn/jobs?kd=',                                        domain: 'lagou.com',             icon: '../icons/engines/lagou.svg' },
  ]
}
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

  // ── 模式切换：绑定主标题点击 ──
  const titleEl = document.getElementById('site-title');
  if (titleEl) {
    titleEl.addEventListener('click', toggleModeMenu);
  }

  // 点空白关闭菜单
  document.addEventListener('click', (e) => {
    if (_modeMenuEl && !_modeMenuEl.contains(e.target)) closeModeMenu();
  });

  // 窗口变化时重新定位
  window.addEventListener('resize', () => { if (_modeMenuOpen) positionModeMenu(); });
  window.addEventListener('scroll', () => { if (_modeMenuOpen) positionModeMenu(); }, { passive: true });

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

function showCityEditor() {
  const saved = JSON.parse(localStorage.getItem('weather_city') || 'null');
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;
  `;
  overlay.innerHTML = `
    <div style="background:rgba(20,20,20,0.95);border:1px solid rgba(255,255,255,0.15);
      border-radius:14px;padding:1.5rem 2rem;min-width:320px;max-width:400px;width:90%;color:#fff;font-family:inherit;">
      <p style="margin:0 0 1rem;font-size:1rem;font-weight:600;">📍 修改天气城市</p>
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <input id="citySearchInput" placeholder="输入城市名搜索…" value="${saved?.name||''}"
          style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);
          background:rgba(255,255,255,0.08);color:#fff;font-size:0.9rem;box-sizing:border-box;">
        <button id="citySearchBtn" style="padding:8px 14px;border-radius:8px;border:none;
          background:#4CAF50;color:#fff;cursor:pointer;font-family:inherit;font-weight:600;white-space:nowrap;">搜索</button>
      </div>
      <div id="cityResults" style="margin-bottom:1rem;max-height:200px;overflow-y:auto;"></div>
      <div id="citySelected" style="font-size:0.8rem;color:rgba(255,255,255,0.45);margin-bottom:1rem;min-height:1.2em;"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button id="cityCancelBtn" style="padding:6px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);
          background:transparent;color:#fff;cursor:pointer;font-family:inherit;">取消</button>
        <button id="citySaveBtn" style="padding:6px 16px;border-radius:8px;border:none;
          background:#4CAF50;color:#fff;cursor:pointer;font-family:inherit;font-weight:600;opacity:0.4;" disabled>保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  let selectedCity = null;

  const searchInput = overlay.querySelector('#citySearchInput');
  const searchBtn   = overlay.querySelector('#citySearchBtn');
  const resultsEl   = overlay.querySelector('#cityResults');
  const selectedEl  = overlay.querySelector('#citySelected');
  const saveBtn     = overlay.querySelector('#citySaveBtn');

  async function doSearch() {
    const q = searchInput.value.trim();
    if (!q) return;
    resultsEl.innerHTML = '<p style="font-size:0.85rem;color:rgba(255,255,255,0.45);margin:0;">搜索中…</p>';
    try {
      const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=zh&format=json`);
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        resultsEl.innerHTML = '<p style="font-size:0.85rem;color:rgba(255,255,255,0.45);margin:0;">未找到相关城市，请换个关键词</p>';
        return;
      }
      resultsEl.innerHTML = '';
      data.results.forEach(city => {
        const label = [city.name, city.admin1, city.country].filter(Boolean).join('，');
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
          display:block;width:100%;text-align:left;padding:8px 10px;margin-bottom:4px;
          border-radius:8px;border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;
          font-family:inherit;font-size:0.85rem;transition:background 0.15s;
        `;
        btn.addEventListener('click', () => {
          selectedCity = { name: city.name, lat: city.latitude, lon: city.longitude };
          selectedEl.textContent = `已选：${label}（${city.latitude.toFixed(4)}, ${city.longitude.toFixed(4)}）`;
          saveBtn.disabled = false;
          saveBtn.style.opacity = '1';
          resultsEl.querySelectorAll('button').forEach(b => {
            b.style.background = 'rgba(255,255,255,0.05)';
            b.style.border = '1px solid rgba(255,255,255,0.1)';
          });
          btn.style.background = 'rgba(76,175,80,0.25)';
          btn.style.border = '1px solid rgba(76,175,80,0.6)';
        });
        resultsEl.appendChild(btn);
      });
    } catch {
      resultsEl.innerHTML = '<p style="font-size:0.85rem;color:rgba(255,255,255,0.45);margin:0;">搜索失败，请检查网络</p>';
    }
  }

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  overlay.querySelector('#cityCancelBtn').onclick = () => overlay.remove();
  saveBtn.onclick = () => {
    if (!selectedCity) return;
    localStorage.setItem('weather_city', JSON.stringify(selectedCity));
    sessionStorage.clear();
    overlay.remove();
    const el = document.getElementById('daily-quote');
    if (el) loadWeather(el);
  };
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
