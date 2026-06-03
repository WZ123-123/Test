/* ============================================================
   links-nav.js — favicon / links.json 加载
   移植自 AI 导航模式，作为独立模块
   ============================================================ */

const FAVICON_WORKER_URL = 'https://ico.xmynscnq.dpdns.org';
const LINKS_FILE         = '../links.json';
const PROTECTED_PASSWORD_HASH =
  'e5b560baff2258b7f00c54fb2871e3c45a575af15affb7d5b93a9ac3cba1f772';
const DEFAULT_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0yIDEyaDIwIj48L3BhdGg+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+';

/* ── sha256（密码保护） ── */
async function linksNavSha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── favicon ── */
function getLinksNavDomain(url) { try { return new URL(url).hostname; } catch { return null; } }
function getLinksNavFaviconUrl(url) {
  const d = getLinksNavDomain(url);
  return d ? `${FAVICON_WORKER_URL}/?domain=${d}` : DEFAULT_ICON;
}

/* ── 内外网模式 ── */
const LinksNav = {
  isIntranet: localStorage.getItem('netMode') === 'intranet',
  _data: null,

  getCardUrl(item) {
    return (this.isIntranet && item.intranet) ? item.intranet : item.url;
  },

  toggle() {
    this.isIntranet = !this.isIntranet;
    localStorage.setItem('netMode', this.isIntranet ? 'intranet' : 'internet');
    this._updateBtn();
    if (this._data) this._render(this._data);
  },

  _updateBtn() {
    const btn = document.getElementById('links-net-btn');
    if (!btn) return;
    btn.textContent = this.isIntranet ? '🏠 内网' : '🌐 外网';
    btn.classList.toggle('active', this.isIntranet);
  },

  async load() {
    try {
      const res  = await fetch(LINKS_FILE);
      this._data = await res.json();
      this._render(this._data);
    } catch (e) {
      console.warn('[LinksNav] links.json 加载失败', e);
    }
    this._updateBtn();
  },

  _render(sections) {
    const container = document.getElementById('links-nav-shortcut-grid');
    if (!container) return;
    container.innerHTML = '';

    sections.forEach(({ section, items, protected: isProtected }) => {
      const catEl = document.createElement('div');
      catEl.className = 'lnav-category';

      const titleEl = document.createElement('div');
      titleEl.className = 'lnav-category-title';
      const titleSpan = document.createElement('span');
      titleSpan.textContent = section;
      titleEl.appendChild(titleSpan);
      catEl.appendChild(titleEl);

      const gridEl = document.createElement('div');
      gridEl.className = 'lnav-grid';

      if (isProtected) {
        gridEl.style.display = 'none';
        titleSpan.style.cursor = 'pointer';
        titleSpan.title = '🔒 点击解锁';
        titleSpan.addEventListener('click', async () => {
          if (sessionStorage.getItem('lnav_' + section) === 'ok') {
            gridEl.style.display = gridEl.style.display === 'none' ? '' : 'none';
            return;
          }
          const pwd = prompt('请输入访问密码');
          if (!pwd) return;
          const hash = await linksNavSha256(pwd);
          if (hash === PROTECTED_PASSWORD_HASH) {
            sessionStorage.setItem('lnav_' + section, 'ok');
            gridEl.style.display = '';
          } else {
            alert('密码错误');
          }
        });
      }

      items.forEach(item => {
        const url     = this.getCardUrl(item);
        const initial = (item.title || '?').charAt(0).toUpperCase();

        const a = document.createElement('a');
        a.href      = url;
        a.target    = '_blank';
        a.className = 'lnav-card';
        a.rel       = 'noopener noreferrer';

        const avatar = document.createElement('div');
        avatar.className = 'lnav-avatar';

        const img = document.createElement('img');
        img.src = item.icon ? item.icon : getLinksNavFaviconUrl(url);
        img.onerror = function () { avatar.textContent = initial; this.onerror = null; };
        avatar.appendChild(img);

        const name = document.createElement('span');
        name.className   = 'lnav-name';
        name.textContent = item.title || '';

        a.appendChild(avatar);
        a.appendChild(name);
        gridEl.appendChild(a);
      });

      catEl.appendChild(gridEl);
      container.appendChild(catEl);
    });
  },
};