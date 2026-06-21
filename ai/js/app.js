/* ============================================================
   app.js — 初始化、设置、时钟、搜索框、分页、localStorage
   ============================================================ */

const App = {
  pages:     [],
  curPage:   0,
  pageCount: 1,
  apiKey:    '',

  /* ── 搜索引擎配置 ──
     mode: 'normal' | 'ai'
     normalEngine: 'bing' | 'baidu' | 'google'
     aiModels: string[]  (与 AI_ENGINE.models 同步)
  */
  searchMode:   'normal',
  normalEngine: 'https://www.bing.com/search?q=',
  normalEngineKey: 'bing',

  init() {
    this.loadData();
    this.bindSearch();
    AI_ENGINE.init();        // 必须在 bindSettings 前，_buildSESection 需要 models
    this.bindSettings();
    this.tick();
    setInterval(() => this.tick(), 10000);

    // 多重兜底渲染，确保 GitHub Pages 字体/图片加载后尺寸稳定
    const _doRender = () => { GRID_TOP = getGridTop(); renderAll(); };
    // 立即渲染一次
    requestAnimationFrame(() => { _doRender(); });
    // load 后再渲染一次（字体加载完）
    window.addEventListener('load', () => { _doRender(); }, { once: true });
    // 500ms 后最终兜底，确保任何情况下都能显示
    setTimeout(_doRender, 500);
  },

  /* ---- localStorage ---- */
  loadData() {
    const LAYOUT_VER = '14';
    try {
      const ver = localStorage.getItem('aiNav_layoutVer');
      const d   = localStorage.getItem('aiNav_pages');
      if (d && ver === LAYOUT_VER) {
        const parsed   = JSON.parse(d);
        this.pages     = parsed.pages     || JSON.parse(JSON.stringify(DEFAULT_PAGES));
        this.pageCount = parsed.pageCount || this.pages.length || 1;
        this.curPage   = 0;
      } else {
        this.pages     = JSON.parse(JSON.stringify(DEFAULT_PAGES));
        this.pageCount = 1;
        localStorage.setItem('aiNav_layoutVer', LAYOUT_VER);
        localStorage.removeItem('aiNav_pages');
      }
    } catch (e) {
      this.pages     = JSON.parse(JSON.stringify(DEFAULT_PAGES));
      this.pageCount = 1;
    }

    try {
      this.apiKey = localStorage.getItem('aiNav_apiKey') || '';

      const title = localStorage.getItem('aiNav_title');
      if (title) {
        document.getElementById('site-title').textContent = title;
      }

      const bg = localStorage.getItem('aiNav_bg');
      if (bg && bg.startsWith('preset:')) {
        this.applyBgImage(bg.slice(7), false);
        const imgUrl = bg.slice(7);
        document.querySelectorAll('.bg-img-opt').forEach(o => {
          o.classList.toggle('active', o.getAttribute('onclick')?.includes(imgUrl));
        });
      } else if (DEFAULT_BG_IMAGE) {
        this.applyBgImage('images/' + DEFAULT_BG_IMAGE, false);
      }

      // 加载搜索引擎偏好
      const seMode = localStorage.getItem('aiNav_seMode');
      if (seMode) this.searchMode = seMode;
      const seKey = localStorage.getItem('aiNav_seKey');
      if (seKey) this._setNormalEngineByKey(seKey, false);

    } catch (e) {}
  },

  saveData() {
    try {
      localStorage.setItem('aiNav_pages', JSON.stringify({
        pages:     this.pages,
        pageCount: this.pageCount,
      }));
      localStorage.setItem('aiNav_layoutVer', '14');
    } catch (e) {}
  },

  /* ── 搜索框 ── */
  bindSearch() {
    const input = document.getElementById('search-input');
    const clear = document.getElementById('search-clear');
    input.addEventListener('input', () =>
      clear.classList.toggle('show', input.value.length > 0));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value.trim()) this._doSearch(input.value.trim());
    });
    clear.addEventListener('click', () => {
      input.value = ''; clear.classList.remove('show'); input.focus();
    });
    document.getElementById('search-btn')?.addEventListener('click', () => {
      const v = input.value.trim(); if (v) this._doSearch(v);
    });
  },

  _doSearch(query) {
    if (this.searchMode === 'ai') {
      // AI 检索：打开弹窗并预填查询词
      AISearchModal.open();
      setTimeout(() => {
        const inp = document.getElementById('ai-sr-input');
        if (inp) { inp.value = query; AISearchModal.search(); }
      }, 350);
    } else {
      window.open(this.normalEngine + encodeURIComponent(query), '_blank');
    }
  },

  /* ── 搜索引擎设置 ── */
  _normalEngines: {
    bing:   { label: 'Bing',    url: 'https://www.bing.com/search?q='    },
    baidu:  { label: '百度',    url: 'https://www.baidu.com/s?wd='       },
    google: { label: 'Google',  url: 'https://www.google.com/search?q='  },
  },

  _setNormalEngineByKey(key, save = true) {
    const e = this._normalEngines[key];
    if (!e) return;
    this.normalEngine    = e.url;
    this.normalEngineKey = key;
    if (save) localStorage.setItem('aiNav_seKey', key);
    // 同步设置面板 UI
    document.querySelectorAll('.se-opt[data-se-key]').forEach(b =>
      b.classList.toggle('active', b.dataset.seKey === key));
  },

  // 普通引擎选择（二选一）
  selectNormalEngine(el) {
    this.searchMode = 'normal';
    localStorage.setItem('aiNav_seMode', 'normal');
    this._setNormalEngineByKey(el.dataset.seKey);
    this._syncSEUI();
  },

  // AI 模型勾选
  toggleAIModel(id) {
    AI_ENGINE.toggleModel(id);
    this._syncSEUI();
  },

  // 切换到 AI 模式（勾选任意 AI 模型时触发）
  _activateAIMode() {
    this.searchMode = 'ai';
    localStorage.setItem('aiNav_seMode', 'ai');
    this._syncSEUI();
  },

  // 同步整个搜索引擎区域 UI
  _syncSEUI() {
    const isAI = this.searchMode === 'ai';
    // 普通引擎按钮：AI 模式下 deactivate
    document.querySelectorAll('.se-opt[data-se-key]').forEach(b => {
      b.classList.toggle('active', !isAI && b.dataset.seKey === this.normalEngineKey);
    });
    // AI 模型 chip：按 data-model-id 精确匹配，避免顺序错位
    document.querySelectorAll('.ai-model-chip[data-model-id]').forEach(chip => {
      const id = chip.dataset.modelId;
      const m  = AI_ENGINE.models.find(x => x.id === id);
      chip.classList.toggle('on',      !!(m && m.checked && isAI));
      chip.classList.toggle('ai-mode', isAI);
    });
    // 搜索按钮文字
    const btn = document.getElementById('search-btn');
    if (btn) btn.textContent = isAI ? 'AI 搜' : '搜索';
    // 搜索框 placeholder
    const inp = document.getElementById('search-input');
    if (inp) inp.placeholder = isAI
      ? '描述你想找的工具或网站，AI 帮你找...'
      : '搜索网页，Enter 跳转...';
    // hint 文字
    const hint = document.getElementById('se-hint');
    if (hint) hint.textContent = isAI ? '当前：AI 检索模式' : '当前：普通搜索模式';
  },

  /* ── 设置面板初始化 ── */
  bindSettings() {
    this._buildSESection();
  },

  _buildSESection() {
    const container = document.getElementById('se-section-container');
    if (!container) return;

    const engines = this._normalEngines;
    container.innerHTML = `
      <div class="st-section">
        <h3>搜索引擎</h3>
        <div class="se-row">
          <div class="se-group-label">普通引擎（二选一）</div>
          <div class="se-opts" id="se-normal-opts">
            ${Object.entries(engines).map(([key, e]) => `
              <div class="se-opt net-opt${key === this.normalEngineKey && this.searchMode === 'normal' ? ' active' : ''}"
                   data-se-key="${key}"
                   onclick="App.selectNormalEngine(this)">${e.label}</div>
            `).join('')}
          </div>
        </div>
        <div class="se-divider">或</div>
        <div class="se-row">
          <div class="se-group-label">AI 引擎（可多选）</div>
          <div class="se-ai-chips" id="se-ai-chips">
            ${AI_ENGINE.models.map(m => {
              const isOn = m.checked && this.searchMode === 'ai';
              return `<div class="ai-model-chip se-opt${isOn ? ' on ai-mode' : ''}"
                   data-model-id="${m.id}"
                   onclick="App._onAIChipClick(this, '${m.id}')">${m.name}</div>`;
            }).join('')}
          </div>
        </div>
        <p class="se-hint" id="se-hint">${this.searchMode === 'ai' ? '当前：AI 检索模式' : '当前：普通搜索模式'}</p>
      </div>
    `;
  },

  _onAIChipClick(el, id) {
    AI_ENGINE.toggleModel(id);
    // 至少有一个 AI 模型勾选 → AI 模式；全部取消 → 普通模式
    const anyOn = AI_ENGINE.getActive().length > 0;
    this.searchMode = anyOn ? 'ai' : 'normal';
    localStorage.setItem('aiNav_seMode', this.searchMode);
    this._syncSEUI();
  },

  _updateSEHint() {
    const hint = document.getElementById('se-hint');
    if (hint) hint.textContent = this.searchMode === 'ai' ? '当前：AI 检索模式' : '当前：普通搜索模式';
  },

  /* ── 时钟 ── */
  tick() {
    const now = new Date();
    const p = v => String(v).padStart(2, '0');
    const t = document.getElementById('tb-time');
    const d = document.getElementById('tb-date');
    if (t) t.textContent = p(now.getHours()) + ':' + p(now.getMinutes());
    if (d) d.textContent = now.getFullYear() + '/' + p(now.getMonth() + 1) + '/' + p(now.getDate());
  },

  /* ── 分页 ── */
  addPage() {
    if (!this.pages[this.pageCount]) this.pages[this.pageCount] = [];
    this.pageCount++;
    renderAll();
    goPage(this.pageCount - 1);
  },

  /* ── 背景 ── */
  applyPresetImg(el, url, save = true) {
    const wall = document.getElementById('wallpaper');
    wall.classList.remove('default-bg');
    wall.style.backgroundImage = `url(${url})`;
    document.querySelectorAll('.bg-img-opt').forEach(o =>
      o.classList.toggle('active', o === el));
    if (save) localStorage.setItem('aiNav_bg', 'preset:' + url);
  },

  applyBgImage(url, save = true) {
    const wall = document.getElementById('wallpaper');
    wall.classList.remove('default-bg');
    wall.style.backgroundImage = `url(${url})`;
    if (save) localStorage.setItem('aiNav_bg', 'preset:' + url);
  },

  /* ── 标题 ── */
  applyTitle() {
    const v = document.getElementById('title-input').value.trim() || '我的导航';
    document.getElementById('site-title').textContent = v;
    localStorage.setItem('aiNav_title', v);
  },

  /* ── API Key ── */
  saveApiKey() {
    this.apiKey = document.getElementById('api-key-input').value.trim();
    localStorage.setItem('aiNav_apiKey', this.apiKey);
    alert('API Key 已保存！');
  },

  /* ── 内外网切换 ── */
  setNetMode(mode, el) {
    LinksNav.isIntranet = (mode === 'intranet');
    localStorage.setItem('netMode', mode);
    this._syncNetUI();
    // 重新渲染导航内容（URL可能变化）
    if (Nav._linksData) Nav._renderLinksContent('');
    LinksNav._render && LinksNav._render(LinksNav._data || []);
  },

  _syncNetUI() {
    const isIntranet = LinksNav.isIntranet;
    document.getElementById('net-opt-internet')?.classList.toggle('active', !isIntranet);
    document.getElementById('net-opt-intranet')?.classList.toggle('active', isIntranet);
  },

  /* ── setSE（兼容旧 HTML onclick 调用） ── */
  setSE(el, url) {
    // 通过旧 onclick 调用的兼容入口，直接走 selectNormalEngine
    const key = el.dataset.se || el.dataset.seKey;
    if (key) this._setNormalEngineByKey(key);
    else { this.normalEngine = url; }
    this.searchMode = 'normal';
    localStorage.setItem('aiNav_seMode', 'normal');
    this._syncSEUI();
  },
};

/* ── global helpers ── */
function saveData() { App.saveData(); }

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  document.getElementById('add-page-btn')?.addEventListener('click', () => App.addPage());
  // links.json 加载
  LinksNav.load();
  // 内外网按钮（快捷导航面板里的，如果有）
  document.getElementById('links-net-btn')?.addEventListener('click', () => LinksNav.toggle());
  // 同步设置面板内外网按钮初始状态
  App._syncNetUI();
  // 设置面板打开时重建 SE 区域（保持和 App.searchMode 同步）
  document.querySelector('.tl-r[onclick*="settings"]')
    ?.closest('.modal-titlebar')
    ?.addEventListener('mousedown', () => setTimeout(() => App._buildSESection(), 50));
});
