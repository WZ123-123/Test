/* ============================================================
   nav-links-patch.js
   覆盖 Nav.render / Nav.renderContent，从 links.json 加载
   支持密码保护分区、内外网切换、favicon 显示
   ============================================================ */

const LINKS_FILE_PATH = '../links.json';
const FAVICON_WORKER  = 'https://ico.xmynscnq.dpdns.org';
const NAV_PWD_HASH    = 'e5b560baff2258b7f00c54fb2871e3c45a575af15affb7d5b93a9ac3cba1f772';

async function navSha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

Nav._linksData = null;

Nav._domain = url => { try { return new URL(url).hostname; } catch { return null; } };
Nav._favicon = (item, url) => {
  if (item.icon) return item.icon;
  const d = Nav._domain(url);
  return d ? `${FAVICON_WORKER}/?domain=${d}` : '';
};
Nav._itemUrl = item => {
  const intranet = localStorage.getItem('netMode') === 'intranet';
  return (intranet && item.intranet) ? item.intranet : item.url;
};

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

/* ── 渲染侧边栏 ── */
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

  if (!Nav.curCat || !data.find(s => s.section === Nav.curCat))
    Nav.curCat = data[0].section;

  sidebar.innerHTML = data.map(s => `
    <div class="nav-cat${s.section === Nav.curCat ? ' active' : ''}"
         onclick="Nav.setCatLinks('${s.section.replace(/'/g,"\\'")}')">
      ${s.section}
    </div>
  `).join('');

  document.getElementById('nav-search-input')?.value !== undefined &&
    (document.getElementById('nav-search-input').value = '');

  Nav._renderLinksContent('');
};

/* ── 切换分类（含密码验证） ── */
Nav.setCatLinks = function(section) {
  const data = Nav._linksData || [];
  const sec  = data.find(s => s.section === section);

  const _doSwitch = () => {
    Nav.curCat = section;
    document.querySelectorAll('.nav-cat').forEach(el =>
      el.classList.toggle('active', el.textContent.trim() === section));
    const inp = document.getElementById('nav-search-input');
    if (inp) inp.value = '';
    Nav._renderLinksContent('');
  };

  if (sec && sec.protected) {
    const key = 'nav_pwd_' + section;
    if (sessionStorage.getItem(key) === 'ok') { _doSwitch(); return; }
    const pwd = prompt('请输入访问密码');
    if (!pwd) return;
    navSha256(pwd).then(hash => {
      if (hash !== NAV_PWD_HASH) { alert('密码错误'); return; }
      sessionStorage.setItem(key, 'ok');
      _doSwitch();
    });
    return;
  }
  _doSwitch();
};

/* ── 图标数据内存缓存（key → favicon完整值），避免 base64 写入 HTML 属性被截断 ── */
Nav._iconCache = new Map();
let _iconCacheSeq = 0;

/* ── 渲染内容区 ── */
Nav._renderLinksContent = function(filter) {
  const content = document.getElementById('nav-content');
  if (!content || !Nav._linksData) return;

  const kw = filter.trim().toLowerCase();
  let items = [];

  if (kw) {
    Nav._linksData.forEach(s => {
      if (s.protected && sessionStorage.getItem('nav_pwd_' + s.section) !== 'ok') return;
      (s.items || []).forEach(item => {
        if (item.title && item.title.toLowerCase().includes(kw)) items.push(item);
      });
    });
  } else {
    const sec = Nav._linksData.find(s => s.section === Nav.curCat);
    if (sec && sec.protected && sessionStorage.getItem('nav_pwd_' + sec.section) !== 'ok') {
      content.innerHTML = '<div class="nav-empty">🔒 该分类受密码保护，请从左侧点击解锁</div>';
      return;
    }
    items = sec ? (sec.items || []) : [];
  }

  if (!items.length) {
    content.innerHTML = '<div class="nav-empty">没有找到匹配的网站</div>';
    return;
  }

  // 每次渲染前清空旧缓存，防止无限增长
  Nav._iconCache.clear();

  const grid = document.createElement('div');
  grid.className = 'nav-icon-grid';

  items.forEach(item => {
    const url     = Nav._itemUrl(item);
    const favicon = Nav._favicon(item, url);  // 可能是 base64 / http url / ''
    const initial = (item.title || '?').charAt(0).toUpperCase();

    // 把完整 favicon 存进内存 Map，DOM 只记 key
    const cacheKey = 'nic_' + (++_iconCacheSeq);
    Nav._iconCache.set(cacheKey, favicon || '');

    const el = document.createElement('div');
    el.className   = 'nav-icon';
    el.draggable   = true;
    el.dataset.url     = url;
    el.dataset.name    = item.title || '';
    el.dataset.color   = 'rgba(200,210,230,0.3)';
    el.dataset.letter  = initial;
    el.dataset.iconKey = cacheKey;   // ← 只存 key，不存实际 favicon 内容

    // 图标体
    const body = document.createElement('div');
    body.className = 'nav-icon-body nav-icon-favicon';
    body.style.background = 'rgba(255,255,255,0.85)';

    if (favicon) {
      const img = document.createElement('img');
      img.src   = favicon;
      img.alt   = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:8px;';
      img.onerror = function() {
        this.style.display = 'none';
        body.textContent   = initial;
      };
      body.appendChild(img);
    } else {
      body.textContent = initial;
    }

    const label = document.createElement('div');
    label.className   = 'nav-icon-label';
    label.textContent = item.title || '';

    el.appendChild(body);
    el.appendChild(label);

    typeof add3D === 'function' && add3D(el);

    el.addEventListener('click', () => window.open(el.dataset.url, '_blank'));

    el.addEventListener('dragstart', ev => {
      ev.dataTransfer.effectAllowed = 'copy';
      // 从内存 Map 里取完整 favicon
      const fullFavicon = Nav._iconCache.get(el.dataset.iconKey) || '';
      ev.dataTransfer.setData('navIcon', JSON.stringify({
        label:   el.dataset.name,
        color:   el.dataset.color,
        letter:  el.dataset.letter,
        url:     el.dataset.url,
        favicon: fullFavicon,
      }));
      window._dragSize = '1x1';
    });

    el.addEventListener('dragend', () => { window._dragSize = null; });

    el.addEventListener('contextmenu', ev => {
      ev.preventDefault(); ev.stopPropagation();
      const menu = document.getElementById('ctx-menu');
      menu.innerHTML = '<div class="ctx-item">➕ 添加到桌面</div>';
      const fullFavicon = Nav._iconCache.get(el.dataset.iconKey) || '';
      menu.querySelector('.ctx-item').onclick = () => {
        Nav.addToDesktop(el.dataset.name, el.dataset.color, el.dataset.letter, el.dataset.url, '1x1', fullFavicon);
        hideCtxMenu && hideCtxMenu();
      };
      menu.style.cssText = `display:block;left:${Math.min(ev.clientX,innerWidth-180)}px;top:${Math.min(ev.clientY,innerHeight-80)}px;`;
    });

    grid.appendChild(el);
  });

  content.innerHTML = '';
  content.appendChild(grid);
};

/* ── addToDesktop 支持 favicon ── */
Nav.addToDesktop = function(name, color, letter, url, size, favicon) {
  size = size || '1x1';
  const it = {
    id: 'ni' + Date.now(), type: 'icon', size,
    label: name, bgClass: '', _customBg: color,
    emoji: letter.slice(0, 2), url, col: 0, row: 0,
  };
  if (favicon) it._favicon = favicon;
  const result = placeWithShift(App.curPage, it, 0, 0);
  if (!result) { alert('本页无空间，请新建分页'); return; }
  it.col = result.col; it.row = result.row;
  App.pages[App.curPage].push(it);
  saveData(); renderAll();
};

Nav.onSearch  = val     => Nav._renderLinksContent(val);
Nav.setCat    = section => Nav.setCatLinks(section);

/* ── favicon 图标在导航面板内的样式 ── */
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
      border-radius: var(--folder-item-radius, 12px) !important;
    }
  `;
  document.head.appendChild(style);
});
