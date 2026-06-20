/* ============================================================
   ai-engine.js — 多模型并行 AI 检索引擎
   从 AI 导航模式移植，作为独立模块供主导航调用
   ============================================================ */

const AI_ENGINE = {
  AI_WORKER_URL: 'https://www.scnq.us.ci',

  ALL_MODELS: [
    { id: 'gemini', name: 'Gemini 2.5 Flash',  checked: false },
    { id: 'scout',  name: 'Llama 4 Scout 17B', checked: false },
    { id: 'qwen',   name: 'Qwen3-32B',         checked: false },
    { id: 'gpt',    name: 'GPT-OSS-120B',      checked: false },
    { id: 'glm',    name: 'GLM-4 Flash',       checked: false },
  ],

  models: null,
  conversations: {},

  init() {
    // v6：默认全部未选中，清除旧版全选缓存
    const raw = localStorage.getItem('ai_nav_models_v6');
    this.models = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(this.ALL_MODELS));
  },

  saveModels() {
    localStorage.setItem('ai_nav_models_v6', JSON.stringify(this.models));
  },

  toggleModel(id) {
    this.models = this.models.map(m => m.id === id ? { ...m, checked: !m.checked } : m);
    this.saveModels();
  },

  getActive() {
    return this.models.filter(m => m.checked);
  },

  safeParseJSON(text) {
    let s = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const m = s.match(/\{[\s\S]*\}/);
    if (m) s = m[0];
    try { return JSON.parse(s); } catch {
      s = s.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'")
           .replace(/,\s*([}\]])/g, '$1')
           .replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3');
      return JSON.parse(s);
    }
  },

  async callModel(modelId, messages) {
    const res = await fetch(this.AI_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId, messages }),
    });
    if (!res.ok) throw new Error(await res.text());
    return this.safeParseJSON(await res.text());
  },
};

/* ============================================================
   AI 检索弹窗
   ============================================================ */
const AISearchModal = {
  _built: false,

  open() {
    if (!this._built) this._build();
    Modal.open('ai-search-overlay');
    // 每次打开都清空上次结果
    document.getElementById('ai-sr-results').innerHTML = '';
    document.getElementById('ai-sr-results').classList.add('hidden');
    document.getElementById('ai-sr-input').value = '';
    setTimeout(() => document.getElementById('ai-sr-input')?.focus(), 300);
    this._renderModelBar();
  },

  _build() {
    this._built = true;
    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
      #ai-search-panel { width: 860px; height: 620px; }
      .ai-sr-header { padding: 14px 18px; background: rgba(246,246,246,.9); border-bottom: .5px solid rgba(0,0,0,.07); flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; }
      .ai-sr-input-row { display: flex; gap: 8px; align-items: center; }
      #ai-sr-input { flex: 1; border: .5px solid rgba(0,0,0,.15); border-radius: 20px; padding: 9px 18px; font-size: 14px; outline: none; font-family: inherit; background: rgba(255,255,255,.9); }
      #ai-sr-input:focus { border-color: rgba(232,113,74,.5); }
      #ai-sr-go { padding: 9px 22px; border-radius: 20px; border: none; background: linear-gradient(135deg,#e8714a,#d05528); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; }
      #ai-sr-go:hover { opacity: .88; }
      .ai-sr-model-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .ai-sr-model-label { font-size: 11px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
      #ai-sr-model-container { display: flex; flex-wrap: wrap; gap: 6px; }
      .ai-sr-chip { padding: 3px 10px; border-radius: 8px; border: 1px solid; font-size: 12px; font-weight: 500; cursor: pointer; user-select: none; transition: all .15s; }
      .ai-sr-chip.on  { background: rgba(232,113,74,.12); border-color: #e8714a; color: #d05528; }
      .ai-sr-chip.off { background: rgba(200,200,200,.15); border-color: #ddd; color: #aaa; }
      #ai-sr-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 20px; }
      #ai-sr-body::-webkit-scrollbar { width: 5px; }
      #ai-sr-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,.1); border-radius: 4px; }
      #ai-sr-results.hidden { display: none; }
      .ai-sr-section { display: flex; flex-direction: column; gap: 10px; }
      .ai-sr-section-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; border-bottom: .5px solid rgba(0,0,0,.07); }
      .ai-sr-section-header h3 { font-size: 13px; font-weight: 600; color: #555; }
      .ai-sr-section-header span { font-size: 11px; background: rgba(232,113,74,.08); padding: 2px 10px; border-radius: 9999px; color: #aaa; }
      .ai-sr-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 8px; }
      .ai-sr-card { background: rgba(255,255,255,.7); border: .5px solid rgba(0,0,0,.09); border-left: 3px solid #e8714a; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; transition: box-shadow .15s; }
      .ai-sr-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,.1); }
      .ai-sr-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .ai-sr-card-name { font-size: 13px; font-weight: 700; color: #2a4a7a; text-decoration: none; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ai-sr-card-name:hover { color: #e8714a; }
      .ai-sr-card-name.no-link { color: #333; cursor: default; }
      .ai-sr-card-fee { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; background: rgba(16,185,129,.1); color: #059669; }
      .ai-sr-card-fee.paid { background: rgba(124,58,237,.1); color: #7c3aed; }
      .ai-sr-card-desc { font-size: 12px; color: #666; line-height: 1.55; }
      .ai-sr-card-url a, .ai-sr-card-url span { font-size: 11px; color: #bbb; text-decoration: none; word-break: break-all; }
      .ai-sr-card-url a:hover { color: #e8714a; }
      .ai-sr-card-loading { border-left-color: #ddd; }
      .ai-sr-pulse { height: 8px; background: rgba(0,0,0,.07); border-radius: 4px; margin-bottom: 6px; animation: srPulse 1.4s ease infinite; }
      .ai-sr-pulse.w3 { width: 75%; }
      .ai-sr-pulse.w2 { width: 50%; }
      @keyframes srPulse { 0%,100%{opacity:.3} 50%{opacity:.8} }
      .ai-sr-card-error { border-left-color: #fca5a5; }
      .ai-sr-error-tag { font-size: 11px; color: #ef4444; background: rgba(239,68,68,.1); border: .5px solid rgba(239,68,68,.2); padding: 2px 8px; border-radius: 4px; }
      .ai-sr-dialog-btn { display: none; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid; background: none; transition: all .15s; font-family: inherit; }
      .ai-sr-dialog-btn.show { display: inline-flex; }
      .ai-sr-dialog-btn.explore { border-color: #10b981; color: #059669; }
      .ai-sr-dialog-btn.explore:hover { background: rgba(16,185,129,.08); }
      .ai-sr-dialog-btn.clarify { border-color: #f43f5e; color: #e11d48; }
      .ai-sr-dialog-btn.clarify:hover { background: rgba(244,63,94,.08); }
      .ai-sr-dialog-panel { max-height: 0; overflow: hidden; transition: max-height .35s ease; background: rgba(246,246,246,.6); border: .5px solid rgba(0,0,0,.07); border-radius: 10px; }
      .ai-sr-dialog-panel.open { max-height: 420px; }
      .ai-sr-chat-history { padding: 12px; max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
      .ai-sr-chat-input-row { padding: 8px 12px; border-top: .5px solid rgba(0,0,0,.07); display: flex; gap: 8px; }
      .ai-sr-chat-input-row input { flex: 1; border: .5px solid rgba(0,0,0,.15); border-radius: 16px; padding: 6px 14px; font-size: 13px; font-family: inherit; outline: none; background: rgba(255,255,255,.9); }
      .ai-sr-chat-input-row input:focus { border-color: rgba(232,113,74,.5); }
      .ai-sr-chat-input-row button { padding: 6px 16px; border-radius: 16px; border: none; background: linear-gradient(135deg,#e8714a,#d05528); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
      .ai-sr-bubble { display: flex; }
      .ai-sr-bubble.user { justify-content: flex-end; }
      .ai-sr-bubble.ai   { justify-content: flex-start; }
      .ai-sr-bubble-inner { padding: 6px 10px; font-size: 12px; max-width: 78%; line-height: 1.5; border-radius: 10px; }
      .ai-sr-bubble-inner.ai-style { background: rgba(232,113,74,.08); border: .5px solid rgba(232,113,74,.2); border-radius: 2px 10px 10px 10px; }
      .ai-sr-bubble-inner.user-style { background: rgba(240,240,240,.8); border: .5px solid rgba(0,0,0,.07); border-radius: 10px 2px 10px 10px; }
      .ai-sr-bubble-tag { font-size: 10px; font-weight: 700; color: #e8714a; display: block; margin-bottom: 2px; }
      @media (max-width: 768px) {
        #ai-search-panel { width: 100vw !important; height: 100vh !important; }
        .ai-sr-cards { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);

    // 构建 overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'ai-search-overlay';
    overlay.innerHTML = `
      <div class="modal-panel" id="ai-search-panel">
        <div class="modal-titlebar">
          <span class="modal-title">✨ AI 智能检索</span>
          <div class="traffic-lights">
            <div class="tl tl-y" onclick="Modal.minimize('ai-search-overlay')" title="最小化"></div>
            <div class="tl tl-g" onclick="Modal.maximize('ai-search-overlay')" title="最大化"></div>
            <div class="tl tl-r" onclick="Modal.close('ai-search-overlay')" title="关闭"></div>
          </div>
        </div>
        <div class="ai-sr-header">
          <div class="ai-sr-input-row">
            <input id="ai-sr-input" type="text" autocomplete="off"
                   placeholder="例如：想要一个免费的、能一键生成3D动漫头像的网站...">
            <button id="ai-sr-go" onclick="AISearchModal.search()">AI 检索</button>
          </div>
          <div class="ai-sr-model-bar">
            <span class="ai-sr-model-label">模型</span>
            <div id="ai-sr-model-container"></div>
          </div>
        </div>
        <div id="ai-sr-body">
          <div id="ai-sr-results" class="hidden"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 键盘
    overlay.querySelector('#ai-sr-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') AISearchModal.search();
    });
  },

  _renderModelBar() {
    const c = document.getElementById('ai-sr-model-container');
    if (!c) return;
    c.innerHTML = AI_ENGINE.models.map(m => `
      <label class="ai-sr-chip ${m.checked ? 'on' : 'off'}" onclick="AI_ENGINE.toggleModel('${m.id}'); AISearchModal._renderModelBar()">
        <input type="checkbox" style="display:none"> ${m.name}
      </label>
    `).join('');
  },

  search() {
    const query = document.getElementById('ai-sr-input')?.value.trim();
    if (!query) return;
    const results = document.getElementById('ai-sr-results');
    results.classList.remove('hidden');
    results.innerHTML = '';
    AI_ENGINE.conversations = {};
    const active = AI_ENGINE.getActive();
    if (!active.length) {
      results.innerHTML = '<p style="color:#aaa;text-align:center;padding:2rem;font-size:13px;">请先勾选上方至少一个模型。</p>';
      return;
    }
    active.forEach(model => {
      AI_ENGINE.conversations[model.id] = [{ role: 'user', content: query }];
      const el = this._createSection(model, query);
      results.appendChild(el);
      this._fetchModel(model, query);
    });
  },

  _createSection(model, query) {
    const div = document.createElement('div');
    div.id = `ai-sr-sec-${model.id}`;
    div.className = 'ai-sr-section';
    div.innerHTML = `
      <div class="ai-sr-section-header">
        <h3>🤖 ${model.name}</h3>
        <span>"${query}"</span>
      </div>
      <div id="ai-sr-cards-${model.id}" class="ai-sr-cards">${this._loadingCard()}</div>
      <div style="display:flex;align-items:center;gap:.5rem;">
        <button id="ai-sr-dbtn-${model.id}" class="ai-sr-dialog-btn"></button>
      </div>
      <div id="ai-sr-dpanel-${model.id}" class="ai-sr-dialog-panel">
        <div id="ai-sr-hist-${model.id}" class="ai-sr-chat-history"></div>
        <div class="ai-sr-chat-input-row">
          <input type="text" id="ai-sr-cinput-${model.id}" placeholder="继续筛选，或询问某个网站的详细用法..."
                 onkeydown="if(event.key==='Enter') AISearchModal.sendChat('${model.id}')">
          <button onclick="AISearchModal.sendChat('${model.id}')">发送</button>
        </div>
      </div>
    `;
    return div;
  },

  async _fetchModel(model, query) {
    const cardsEl = document.getElementById(`ai-sr-cards-${model.id}`);
    const timer = setTimeout(() => {
      if (cardsEl) cardsEl.innerHTML = this._errorCard('请求超时，请重试', '超时');
    }, 30000);
    try {
      const data = await AI_ENGINE.callModel(model.id, AI_ENGINE.conversations[model.id]);
      clearTimeout(timer);
      this._handleResponse(data, model.id);
    } catch (err) {
      clearTimeout(timer);
      if (cardsEl) cardsEl.innerHTML = this._errorCard(err.message || '请求失败', '失败');
    }
  },

  _handleResponse(data, modelId) {
    const cardsEl = document.getElementById(`ai-sr-cards-${modelId}`);
    const btn     = document.getElementById(`ai-sr-dbtn-${modelId}`);
    if (!cardsEl || !btn) return;

    if (data.type === 'answer' && data.answer) {
      AI_ENGINE.conversations[modelId].push({ role: 'assistant', content: data.answer });
      this._appendBubble(modelId, data.answer, 'ai');
      btn.className = 'ai-sr-dialog-btn show explore';
      btn.textContent = '🔍 继续探索';
      btn.onclick = () => this._toggleDialog(modelId);
      return;
    }

    const siteNames = (data.sites || []).map(s => s.siteName).join('、');
    AI_ENGINE.conversations[modelId].push({
      role: 'assistant',
      content: data.needsClarification
        ? `已推荐：${siteNames}。需了解：${data.question}`
        : `已推荐：${siteNames}。`,
    });

    cardsEl.innerHTML = (data.sites || []).map((item, i) => this._resultCard(item, i + 1)).join('');

    if (data.needsClarification) {
      btn.className = 'ai-sr-dialog-btn show clarify';
      btn.textContent = '💬 AI有疑问';
      btn.onclick = () => this._toggleDialog(modelId);
      this._appendBubble(modelId, data.question, 'ai');
    } else {
      btn.className = 'ai-sr-dialog-btn show explore';
      btn.textContent = '🔍 继续探索';
      btn.onclick = () => this._toggleDialog(modelId);
      this._appendBubble(modelId, '推荐结果已就绪，可继续筛选，或直接问某个网站怎么用。', 'ai');
    }
  },

  _toggleDialog(modelId) {
    const panel = document.getElementById(`ai-sr-dpanel-${modelId}`);
    if (!panel) return;
    panel.classList.toggle('open');
    if (panel.classList.contains('open'))
      setTimeout(() => document.getElementById(`ai-sr-cinput-${modelId}`)?.focus(), 350);
  },

  async sendChat(modelId) {
    const input = document.getElementById(`ai-sr-cinput-${modelId}`);
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    this._appendBubble(modelId, text, 'user');
    AI_ENGINE.conversations[modelId].push({ role: 'user', content: text });
    const loadId = 'sr-ld-' + Date.now();
    this._appendBubble(modelId, '⏳ 分析中...', 'ai', loadId);
    const cardsEl = document.getElementById(`ai-sr-cards-${modelId}`);
    const timer = setTimeout(() => {
      document.getElementById(loadId)?.remove();
      this._appendBubble(modelId, '响应超时，请重试', 'ai');
    }, 30000);
    try {
      const data = await AI_ENGINE.callModel(modelId, AI_ENGINE.conversations[modelId]);
      clearTimeout(timer);
      document.getElementById(loadId)?.remove();
      if (data.type !== 'answer') {
        if (cardsEl) cardsEl.innerHTML = this._loadingCard();
        setTimeout(() => this._handleResponse(data, modelId), 0);
      } else {
        this._handleResponse(data, modelId);
      }
    } catch (err) {
      clearTimeout(timer);
      document.getElementById(loadId)?.remove();
      this._appendBubble(modelId, `错误：${err.message}`, 'ai');
    }
  },

  _appendBubble(modelId, text, role, id) {
    const hist = document.getElementById(`ai-sr-hist-${modelId}`);
    if (!hist) return;
    const div = document.createElement('div');
    if (id) div.id = id;
    div.className = `ai-sr-bubble ${role}`;
    div.innerHTML = `<div class="ai-sr-bubble-inner ${role}-style">
      ${role === 'ai' ? '<span class="ai-sr-bubble-tag">AI</span>' : ''}${text.replace(/\n/g, '<br>')}
    </div>`;
    hist.appendChild(div);
    hist.scrollTop = hist.scrollHeight;
    const panel = document.getElementById(`ai-sr-dpanel-${modelId}`);
    if (panel && !panel.classList.contains('open')) panel.classList.add('open');
  },

  _loadingCard() {
    return `<div class="ai-sr-card ai-sr-card-loading">
      <div style="color:#ccc;font-size:11px;">⏳ 正在检索分析...</div>
      <div class="ai-sr-pulse w3"></div><div class="ai-sr-pulse w2"></div>
    </div>`;
  },

  _resultCard(data, index) {
    const hasLink = data.link && data.link !== '#';
    return `<div class="ai-sr-card">
      <div class="ai-sr-card-top">
        ${hasLink
          ? `<a href="${data.link}" target="_blank" rel="noopener noreferrer" class="ai-sr-card-name">${data.siteName}</a>`
          : `<span class="ai-sr-card-name no-link">${data.siteName}</span>`}
        <span class="ai-sr-card-fee">${data.fee}</span>
      </div>
      <p class="ai-sr-card-desc">${data.function}</p>
      <div class="ai-sr-card-url">
        ${hasLink
          ? `<a href="${data.link}" target="_blank" rel="noopener noreferrer">${data.link}</a>`
          : `<span>暂无链接</span>`}
      </div>
    </div>`;
  },

  _errorCard(msg, tag) {
    return `<div class="ai-sr-card ai-sr-card-error">
      <div><span class="ai-sr-error-tag">${tag}</span></div>
      <p style="font-size:12px;color:#999;margin:.4rem 0 0;">${msg}</p>
    </div>`;
  },
};
