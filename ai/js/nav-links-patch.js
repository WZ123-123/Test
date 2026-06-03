/* ============================================================
   nav-links-patch.js
   覆盖 Nav.render / Nav.renderContent，从 links.json 加载数据
   必须在 nav.js 之后加载
   ============================================================ */

const LINKS_FILE_PATH = '../links.json';
const FAVICON_WORKER  = 'https://ico.xmynscnq.dpdns.org';

/* links.json 缓存 */
Nav._linksData   = null;   // 原始数组 [{section, items, protected?}]
Nav._linksNet    = 'internet'; // 'intranet' | 'internet'，与 LinksNav 共享

/* 获取域名 */
Nav._domain = function(url) {
  try { return new URL(url).hostname; } catch { return null; }
};

/* favicon URL */
Nav._favicon = function(item, url) {
  if (item.icon) return item.icon;
  const d = Nav._domain(url);
  return d ? `${FAVICON_WORKER}/?domain=${d}` : '';
};

/* 加载 links.json（只加载一次，缓存） */
Nav._loadLinks = async function() {
  if (Nav._linksData) return Nav._linksData;
  try {
    const res = await fetch(LINKS_FILE_PATH);
    Nav._linksData = await res.json();
  } catch(e) {
    console.warn('[Nav] links.json 加载失败', e);
    Nav._linksData = [];
  }
  return Nav._linksData;
};

/* 获取当前网络模式下某条目的 URL */
Nav._itemUrl = function(item) {
  const intranet = localStorage.getItem('netMode') === 'intranet';
  return (intranet && item.intranet) ? item.intranet : item.url;
};

/* ── 覆盖 render：异步加载 links.json，渲染侧边栏 ── */
Nav.render = async function() {
  const sidebar = document.getElementById('nav-sidebar');
  const content = document.getElementById('nav-content');
  if (!sidebar || !content) return;

  sidebar.innerHTML = '<div style="padding:12px;color:#aaa;font-size:12px;">加载中...</div>';
  content.innerHTML = '';

  const data = await Nav._loadLinks();
  if (!data.length) {
    sidebar.innerHTML = '<div style="padding:12px;color:#aaa;font-size:12px;">暂无数据</div>';
    return;
  }

  // 侧边栏：分类列表
  if (!Nav.curCat || !data.find(s => s.section === Nav.curCat)) {
    Nav.curCat = data[0].section;
  }

  sidebar.innerHTML = data.map(s => `
    <div class="nav-cat${s.section === Nav.curCat ? ' active' : ''}"
         onclick="Nav.setCatLinks('${s.section.replace(/'/g, "\\'")}')">${s.section}</div>
  `).join('');

  const inp = document.getElementById('nav-search-input');
  if (inp) inp.value = '';

  Nav._renderLinksContent('');
};

/* ── 切换分类 ── */
Nav.setCatLinks = function(section) {
  Nav.curCat = section;
  document.querySelectorAll('.nav-cat').forEach(el =>
    el.classList.toggle('active', el.textContent === section));
  const inp = document.getElementById('nav-search-input');
  if (inp) inp.value = '';
  Nav._renderLinksContent('');
};

/* ── 渲染内容区 ── */
Nav._renderLinksContent = function(filter) {
  const content = document.getElementById('nav-content');
  if (!content || !Nav._linksData) return;

  const kw = filter.trim().toLowerCase();
  let items = [];

  if (kw) {
    // 搜索模式：跨所有分类搜索
    Nav._linksData.forEach(s => {
      (s.items || []).forEach(item => {
        if (item.title && item.title.toLowerCase().includes(kw)) items.push(item);
      });
    });
  } else {
    // 分类模式
    const section = Nav._linksData.find(s => s.section === Nav.curCat);
    items = section ? (section.items || []) : [];
  }

  if (!items.length) {
    content.innerHTML = '<div class="nav-empty">没有找到匹配的网站</div>';
    return;
  }

  content.innerHTML = `<div class="nav-icon-grid">${items.map(item => {
    const url     = Nav._itemUrl(item);
    const favicon = Nav._favicon(item, url);
    const initial = (item.title || '?').charAt(0).toUpperCase();
    const faviconHtml = favicon
      ? `<img src="${favicon}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:8px;"
             onerror="this.style.display='none';this.parentNode.textContent='${initial}'">`
      : initial;
    return `
      <div class="nav-icon" draggable="true"
           data-url="${url}" data-name="${item.title || ''}"
           data-color="rgba(200,210,230,0.3)" data-letter="${initial}">
        <div class="nav-icon-body nav-icon-favicon"
             style="background:rgba(255,255,255,0.85);">${faviconHtml}</div>
        <div class="nav-icon-label">${item.title || ''}</div>
      </div>`;
  }).join('')}</div>`;

  content.querySelectorAll('.nav-icon').forEach(el => {
    typeof add3D === 'function' && add3D(el);
    el.addEventListener('click', () => window.open(el.dataset.url, '_blank'));
    el.addEventListener('dragstart', ev => {
      ev.dataTransfer.effectAllowed = 'copy';
      ev.dataTransfer.setData('navIcon', JSON.stringify({
        label: el.dataset.name, color: el.dataset.color,
        letter: el.dataset.letter, url: el.dataset.url,
      }));
      window._dragSize = '1x1';
    });
    el.addEventListener('dragend', () => { window._dragSize = null; });
    el.addEventListener('contextmenu', ev => {
      ev.preventDefault(); ev.stopPropagation();
      const menu = document.getElementById('ctx-menu');
      menu.innerHTML = '<div class="ctx-item">➕ 添加到桌面</div>';
      menu.querySelector('.ctx-item').onclick = () => {
        Nav.addToDesktop(el.dataset.name, el.dataset.color, el.dataset.letter, el.dataset.url);
        hideCtxMenu && hideCtxMenu();
      };
      menu.style.cssText = `display:block;left:${Math.min(ev.clientX, innerWidth-180)}px;top:${Math.min(ev.clientY, innerHeight-80)}px;`;
    });
  });
};

/* ── 覆盖 onSearch ── */
Nav.onSearch = function(val) { Nav._renderLinksContent(val); };

/* ── 覆盖 setCat（兼容旧调用） ── */
Nav.setCat = function(section) { Nav.setCatLinks(section); };

/* ── 搜索框 favicon 图标样式补丁 ── */
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    .nav-icon-favicon {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: #555;
    }
  `;
  document.head.appendChild(style);
});
