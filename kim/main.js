/* ===========================
   王五导航 · Kim主题 · main.js
   =========================== */

// ── 常量 ─────────────────────────────────────────────────
const WORKER_URL  = 'https://ico.xmynscnq.dpdns.org';
const LINKS_FILE  = '../links.json';
const DEFAULT_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0yIDEyaDIwIj48L3BhdGg+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+';

// ── 模式切换 ──────────────────────────────────────────────
const MODES = ['normal', 'webstack', 'easy', 'nav', '5iux', 'kim'];
const MODE_PATHS = {
  normal:   '../normal/index.html',
  webstack: '../webstack/index.html',
  easy:     '../easy/index.html',
  nav:      '../nav/index.html',
  '5iux':   '../5IUX/index.html',
  kim:    '../kim/index.html',
};
function switchMode() {
  const cur  = 'kim';
  const next = MODES[(MODES.indexOf(cur) + 1) % MODES.length];
  localStorage.setItem('navMode', next);
  window.location.href = MODE_PATHS[next];
}

// ── 内外网切换 ────────────────────────────────────────────
let isIntranet = localStorage.getItem('netMode') === 'intranet';
let _allData   = null;

function getCardUrl(item) {
  return (isIntranet && item.intranet) ? item.intranet : item.url;
}

function toggleNetMode() {
  isIntranet = !isIntranet;
  localStorage.setItem('netMode', isIntranet ? 'intranet' : 'internet');
  updateNetBtn();
  // 直接更新所有卡片链接，无需重新渲染
  document.querySelectorAll('.z-card[data-url]').forEach(a => {
    const url = isIntranet && a.dataset.intranet ? a.dataset.intranet : a.dataset.url;
    a.href = url;
    const domainEl = a.querySelector('.z-card-domain');
    if (domainEl) domainEl.textContent = getDomain(url) || url;
    const badge = a.querySelector('.z-net-badge');
    if (badge) {
      badge.textContent = isIntranet ? '内' : '外';
      badge.dataset.mode = isIntranet ? 'intranet' : 'internet';
    }
  });
}
window.toggleNetMode = toggleNetMode;

function updateNetBtn() {
  const btn = document.getElementById('z-net-btn');
  if (!btn) return;
  btn.textContent = isIntranet ? '🏠 内网' : '🌐 外网';
  btn.classList.toggle('active', isIntranet);
}

// ── 图标工具 ──────────────────────────────────────────────
function getDomain(url) {
  try { return new URL(url).hostname; } catch { return null; }
}
function buildFaviconUrl(domain) {
  if (!domain) return DEFAULT_ICON;
  return `${WORKER_URL}/?domain=${domain}`;
}
function faviconSrc(url) {
  return buildFaviconUrl(getDomain(url));
}

// ── 分区ID ────────────────────────────────────────────────
function sectionId(s) {
  return 'z-sec-' + s.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
}
function sectionLabel(s) {
  return s.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+/u, '').trim();
}
function sectionEmoji(s) {
  const m = s.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/u);
  return m ? m[1] : '';
}

// ── 搜索 ──────────────────────────────────────────────────
const SEARCH_URL = 'https://www.baidu.com/s?wd=';

function doSearch() {
  const kw = (document.getElementById('z-search-input')?.value || '').trim();
  if (kw) window.open(SEARCH_URL + encodeURIComponent(kw), '_blank');
}
window.doSearch = doSearch;

// ── 站内筛选 ──────────────────────────────────────────────
function filterLinks() {
  const query = (document.getElementById('z-search-input')?.value || '').toLowerCase().trim();
  document.querySelectorAll('.z-group').forEach(group => {
    let vis = false;
    group.querySelectorAll('.z-card').forEach(card => {
      const t = (card.querySelector('.z-card-title')?.textContent || '').toLowerCase();
      const d = (card.dataset.desc || '').toLowerCase();
      const show = !query || t.includes(query) || d.includes(query);
      card.style.display = show ? '' : 'none';
      if (show) vis = true;
    });
    group.style.display = (!query || vis) ? '' : 'none';
  });
}
window.filterLinks = filterLinks;

// ── 左侧分类导航 ──────────────────────────────────────────
function renderNav(sections) {
  const nav = document.getElementById('z-nav');
  if (!nav) return;
  nav.innerHTML = '';
  sections.forEach(({ section }, idx) => {
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href = '#' + sectionId(section);
    a.innerHTML = `<span class="z-nav-emoji">${sectionEmoji(section)}</span><span class="z-nav-label">${sectionLabel(section)}</span>`;
    if (idx === 0) li.classList.add('active');
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(sectionId(section));
      if (target) {
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
      }
      document.querySelectorAll('#z-nav li').forEach(l => l.classList.remove('active'));
      li.classList.add('active');
      // 移动端：点击后关闭侧边栏
      if (window.innerWidth < 768) closeMobileNav();
    });
    li.appendChild(a);
    nav.appendChild(li);
  });
}

// ── 渲染内容 ──────────────────────────────────────────────
function renderContent(sections) {
  const main = document.getElementById('z-main');
  if (!main) return;
  main.innerHTML = '';

  sections.forEach(({ section, items }) => {
    const group = document.createElement('div');
    group.className = 'z-group';
    group.id = sectionId(section);

    const head = document.createElement('div');
    head.className = 'z-group-head';
    head.innerHTML = `<span class="z-group-emoji">${sectionEmoji(section)}</span><span class="z-group-title">${sectionLabel(section)}</span>`;
    group.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'z-grid';

    items.forEach(item => {
      const url     = getCardUrl(item);
      const iconSrc = item.icon || faviconSrc(url);
      const title   = (item.title || '').replace(/</g, '&lt;');
      const desc    = (item.desc  || '').replace(/</g, '&lt;');
      const domain  = getDomain(url) || url;

      const a = document.createElement('a');
      a.className    = 'z-card';
      a.href         = url;
      a.target       = '_blank';
      a.rel          = 'noopener noreferrer';
      a.dataset.url  = item.url;
      a.dataset.desc = item['data-desc'] || item.desc || '';
      if (item.intranet) a.dataset.intranet = item.intranet;

      const netBadge = item.intranet
        ? `<span class="z-net-badge" data-mode="${isIntranet ? 'intranet' : 'internet'}">${isIntranet ? '内' : '外'}</span>`
        : '';

      a.innerHTML = `
        <div class="z-card-icon">
          <img src="${iconSrc}" alt="${title}" loading="lazy" onerror="this.src='${DEFAULT_ICON}';this.onerror=null;">
        </div>
        <div class="z-card-body">
          <div class="z-card-title-row">
            <span class="z-card-title">${title}</span>${netBadge}
          </div>
          <span class="z-card-desc">${desc}</span>
          <span class="z-card-domain">${domain}</span>
        </div>`;

      grid.appendChild(a);
    });

    group.appendChild(grid);
    main.appendChild(group);
  });

  // 滚动高亮导航
  initScrollSpy();
}

// ── ScrollSpy ─────────────────────────────────────────────
function initScrollSpy() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      document.querySelectorAll('#z-nav li').forEach(li => {
        const a = li.querySelector('a');
        li.classList.toggle('active', a?.getAttribute('href') === '#' + id);
      });
    });
  }, { rootMargin: '-20% 0px -60% 0px' });

  document.querySelectorAll('.z-group[id]').forEach(el => observer.observe(el));
}

// ── 移动端侧边栏 ──────────────────────────────────────────
function openMobileNav() {
  document.getElementById('z-sidebar')?.classList.add('open');
  document.getElementById('z-overlay')?.classList.add('show');
}
function closeMobileNav() {
  document.getElementById('z-sidebar')?.classList.remove('open');
  document.getElementById('z-overlay')?.classList.remove('show');
}
window.openMobileNav  = openMobileNav;
window.closeMobileNav = closeMobileNav;

// ── 格言 ──────────────────────────────────────────────────
async function loadQuote() {
  const el = document.getElementById('z-quote');
  if (!el) return;
  try {
    const res  = await fetch('../quotes.json');
    const data = await res.json();
    const q    = data[Math.floor(Math.random() * data.length)];
    el.textContent = q.from ? `${q.text}　——${q.from}` : (q.text || '');
  } catch { el.textContent = ''; }
}

// ── 入口 ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  localStorage.setItem('navMode', 'kim');

  // 标题点击切换模式
  document.getElementById('z-title')?.addEventListener('click', switchMode);

  // 内外网
  document.getElementById('z-net-btn')?.addEventListener('click', toggleNetMode);
  updateNetBtn();

  // 搜索
  document.getElementById('z-search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });

  // 移动端
  document.getElementById('z-menu-btn')?.addEventListener('click', openMobileNav);
  document.getElementById('z-overlay')?.addEventListener('click', closeMobileNav);

  // 格言
  loadQuote();

  // 加载数据
  try {
    const res  = await fetch(LINKS_FILE);
    const data = await res.json();
    _allData = data;
    renderNav(data);
    renderContent(data);
  } catch (err) {
    console.error('加载 links.json 失败：', err);
    const el = document.getElementById('z-main');
    if (el) el.innerHTML = '<p style="color:#999;text-align:center;padding:3rem;">链接数据加载失败</p>';
  }
});
