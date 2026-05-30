/* ===========================
   王五导航 · AI检索 · main.js
   =========================== */

const WORKER_URL    = 'https://ico.xmynscnq.dpdns.org';
const AI_WORKER_URL = 'https://www.scnq.us.ci';
const LINKS_FILE    = '../links.json';
const DEFAULT_ICON  = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0yIDEyaDIwIj48L3BhdGg+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+';

// ── 模式配置 ──────────────────────────────────────────────
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
  webstack: { label: 'WebStack', desc: '侧栏导航',  icon: '📐', color: '#1677ff' },
  easy:     { label: 'Easy',     desc: '极简搜索',  icon: '🔲', color: '#aaaaaa' },
  nav:      { label: 'Nav',      desc: '渐变主题',  icon: '🌊', color: '#a78bfa' },
  '5iux':   { label: '5IUX',    desc: '亮色简洁',  icon: '✨', color: '#667eea' },
  kim:      { label: 'Kim',      desc: '极彩背景',  icon: '🎨', color: '#f472b6' },
  ai:       { label: 'AI',       desc: 'AI 助手',   icon: '🤖', color: '#f59e0b' },
};
const CURRENT_MODE = 'ai';

// ── 模式菜单 ──────────────────────────────────────────────
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
      gap: 6px;
      padding: 10px;
      border-radius: 16px;
      background: rgba(15, 15, 30, 0.75);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid rgba(245, 158, 11, 0.25);
      box-shadow: 0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(245,158,11,0.08);
      max-width: 380px;
    }
    #__mode-menu.open { display: flex; }
    #__mode-menu.layout-below {
      flex-direction: column;
      max-width: 210px;
    }
    #__mode-menu-title {
      width: 100%;
      padding: 0 3px 7px;
      font-size: 10px; font-weight: 700;
      color: rgba(245,158,11,0.5);
      letter-spacing: 0.14em; text-transform: uppercase;
      border-bottom: 1px solid rgba(245,158,11,0.15);
      margin-bottom: 2px;
    }
    #__mode-menu.layout-below #__mode-menu-title { display: none; }
    .__mc {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border-radius: 10px;
      text-decoration: none;
      border: 1px solid transparent;
      transition: background 0.14s, border-color 0.14s;
      cursor: pointer;
    }
    #__mode-menu:not(.layout-below) .__mc {
      flex-direction: column; align-items: center;
      gap: 4px; padding: 10px 8px;
      min-width: 62px; max-width: 62px;
    }
    .__mc:hover {
      background: rgba(245,158,11,0.12);
      border-color: rgba(245,158,11,0.25);
    }
    .__mc.cur {
      background: rgba(245,158,11,0.18);
      border-color: rgba(245,158,11,0.45);
    }
    .__mc-icon { font-size: 18px; line-height: 1; }
    .__mc-body { display: flex; flex-direction: column; gap: 2px; }
    #__mode-menu:not(.layout-below) .__mc-body { align-items: center; }
    .__mc-label {
      font-size: 11.5px; font-weight: 700;
      color: rgba(255,255,255,0.88); line-height: 1;
    }
    .__mc.cur .__mc-label { color: #fcd34d; }
    .__mc-desc { font-size: 10px; color: rgba(255,255,255,0.38); line-height: 1; }
    #__mode-menu.layout-below .__mc-check {
      margin-left: auto; font-size: 11px; color: #f59e0b;
    }
    #__mode-menu:not(.layout-below) .__mc-check { display: none; }
    .__mc-dot {
      width: 5px; height: 5px; border-radius: 50%;
      flex-shrink: 0; margin-top: 1px;
    }
    #__mode-menu:not(.layout-below) .__mc-dot { display: none; }
  `;
  document.head.appendChild(style);

  const menu = document.createElement('div');
  menu.id = '__mode-menu';

  const titleBar = document.createElement('div');
  titleBar.id = '__mode-menu-title';
  titleBar.textContent = '切换模式';
  menu.appendChild(titleBar);

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

  const rect = titleEl.getBoundingClientRect();
  const GAP  = 10;

  // h1 撑满容器（width≈页面宽），用文字视觉中心定位，PC/手机都从下方弹出
  menu.classList.add('layout-below');

  const menuW = Math.min(210, window.innerWidth - 24);
  // 取元素水平中点作为菜单中心
  let left = (rect.left + rect.right) / 2 - menuW / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - menuW - 12));
  menu.style.top      = (rect.bottom + GAP + window.scrollY) + 'px';
  menu.style.left     = left + 'px';
  menu.style.right    = 'auto';
  menu.style.maxWidth = menuW + 'px';
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

// ── 图标 ──────────────────────────────────────────────────
function getDomain(url) { try { return new URL(url).hostname; } catch { return null; } }
function buildFaviconUrl(domain) { return domain ? `${WORKER_URL}/?domain=${domain}` : DEFAULT_ICON; }
function faviconSrc(url) { return buildFaviconUrl(getDomain(url)); }

// ── 内外网 ────────────────────────────────────────────────
let isIntranet = localStorage.getItem('netMode') === 'intranet';
function getCardUrl(item) { return (isIntranet && item.intranet) ? item.intranet : item.url; }

function toggleNetMode() {
  isIntranet = !isIntranet;
  localStorage.setItem('netMode', isIntranet ? 'intranet' : 'internet');
  updateNetBtn();
  fetch(LINKS_FILE).then(r => r.json()).then(data => renderShortcuts(data)).catch(() => {});
}
function updateNetBtn() {
  const btn = document.getElementById('netModeBtn');
  if (!btn) return;
  btn.textContent = isIntranet ? '🏠 内网' : '🌐 外网';
  btn.classList.toggle('active', isIntranet);
}
window.toggleNetMode = toggleNetMode;

// ── AI 模型配置 ───────────────────────────────────────────
const ALL_MODELS = [
  { id: 'gemini', name: 'Gemini 2.5 Flash',  checked: true },
  { id: 'scout',  name: 'Llama 4 Scout 17B', checked: true },
  { id: 'qwen',   name: 'Qwen3-32B',         checked: true },
  { id: 'gpt',    name: 'GPT-OSS-120B',      checked: true },
  { id: 'glm',    name: 'GLM-4 Flash',       checked: true },
];
let models = JSON.parse(localStorage.getItem('ai_nav_models_v5')) || ALL_MODELS;
let conversations = {};

function safeParseJSON(text) {
  let s = text.replace(/```json/g,'').replace(/```/g,'').trim();
  const m = s.match(/\{[\s\S]*\}/); if (m) s = m[0];
  try { return JSON.parse(s); } catch {
    s = s.replace(/[\u201c\u201d]/g,'"').replace(/[\u2018\u2019]/g,"'")
         .replace(/,\s*([}\]])/g,'$1')
         .replace(/([{,]\s*)'([^']+)'(\s*:)/g,'$1"$2"$3');
    return JSON.parse(s);
  }
}

function renderModels() {
  const container = document.getElementById('modelContainer');
  if (!container) return;
  container.innerHTML = models.map(m => `
    <label class="model-chip ${m.checked?'on':'off'}">
      <input type="checkbox" ${m.checked?'checked':''} onchange="toggleModel('${m.id}')" style="display:none;">
      ${m.name}
    </label>
  `).join('');
  localStorage.setItem('ai_nav_models_v5', JSON.stringify(models));
}
function toggleModel(id) {
  models = models.map(m => m.id===id ? {...m, checked:!m.checked} : m);
  renderModels();
}
window.toggleModel = toggleModel;

function renderShortcuts(sections) {
  const container = document.getElementById('shortcutGrid');
  if (!container) return;
  container.innerHTML = sections.map(({ section, items }) => {
    const cards = items.map(item => {
      const url  = getCardUrl(item);
      const icon = item.icon
        ? `<img src="${item.icon}" onerror="this.parentElement.textContent='${(item.title||'?').charAt(0).toUpperCase()}';this.onerror=null;">`
        : `<img src="${faviconSrc(url)}" onerror="this.parentElement.textContent='${(item.title||'?').charAt(0).toUpperCase()}';this.onerror=null;">`;
      return `
        <a href="${url}" target="_blank" class="shortcut-card" rel="noopener noreferrer">
          <div class="shortcut-avatar">${icon}</div>
          <span class="shortcut-name">${item.title||''}</span>
        </a>`;
    }).join('');
    return `
      <div class="shortcut-category">
        <div class="shortcut-category-title">${section}</div>
        <div class="shortcut-grid">${cards}</div>
      </div>`;
  }).join('');
}

function handleSearch() {
  const query = document.getElementById('aiSearchInput').value.trim();
  if (!query) return;
  const section = document.getElementById('aiResultsSection');
  section.classList.remove('hidden');
  section.innerHTML = '';
  conversations = {};
  const active = models.filter(m => m.checked);
  if (!active.length) {
    section.innerHTML = '<p style="color:rgba(255,255,255,.4);text-align:center;padding:2rem;">请先勾选上方模型。</p>';
    return;
  }
  active.forEach(model => {
    conversations[model.id] = [{ role:'user', content:query }];
    const el = createModelSection(model, query);
    section.appendChild(el);
    callModel(model, el);
  });
}
window.handleSearch = handleSearch;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('aiSearchInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
  });
});

function createModelSection(model, query) {
  const div = document.createElement('div');
  div.id = `section-${model.id}`;
  div.className = 'ai-model-section';
  div.innerHTML = `
    <div class="ai-model-header">
      <h2>🤖 ${model.name}</h2>
      <span>"${query}"</span>
    </div>
    <div id="cards-${model.id}" class="ai-cards">${buildLoadingCard()}</div>
    <div style="display:flex;align-items:center;gap:.75rem;padding-top:.25rem;">
      <button id="dialog-btn-${model.id}" class="ai-dialog-btn" onclick="toggleDialog('${model.id}')">
        <span id="dialog-btn-text-${model.id}"></span>
      </button>
    </div>
    <div id="dialog-panel-${model.id}" class="ai-dialog-panel">
      <div id="chat-history-${model.id}" class="ai-chat-history"></div>
      <div class="ai-chat-input-row">
        <input type="text" id="chat-input-${model.id}" placeholder="继续筛选，或询问某个网站的详细用法..."
               onkeydown="if(event.key==='Enter') sendChat('${model.id}')">
        <button onclick="sendChat('${model.id}')">发送</button>
      </div>
    </div>
  `;
  return div;
}

function handleModelResponse(data, modelId) {
  const cardsEl = document.getElementById(`cards-${modelId}`);
  const btn     = document.getElementById(`dialog-btn-${modelId}`);
  const btnT    = document.getElementById(`dialog-btn-text-${modelId}`);
  if (data.type === 'answer' && data.answer) {
    conversations[modelId].push({ role:'assistant', content: data.answer });
    appendBubble(modelId, data.answer, 'ai');
    btn.classList.add('show');
    btn.className = 'ai-dialog-btn show explore';
    btnT.textContent = '🔍 继续探索';
    return;
  }
  const siteNames = (data.sites||[]).map(s=>s.siteName).join('、');
  conversations[modelId].push({ role:'assistant', content: data.needsClarification
    ? `我已推荐了以下网站：${siteNames}。但我还需要了解：${data.question}`
    : `我已推荐了以下网站：${siteNames}。` });
  if (cardsEl) cardsEl.innerHTML = (data.sites||[]).map((item, i) => buildResultCard(item, i + 1)).join('');
  btn.classList.add('show');
  if (data.needsClarification) {
    btn.className = 'ai-dialog-btn show clarify';
    btnT.textContent = '💬 深入对话（AI有疑问）';
    appendBubble(modelId, data.question, 'ai');
  } else {
    btn.className = 'ai-dialog-btn show explore';
    btnT.textContent = '🔍 继续探索';
    appendBubble(modelId, '推荐结果已就绪，可继续筛选，或直接问某个网站怎么用。', 'ai');
  }
}

async function callModel(model, sectionEl) {
  const cardsEl = sectionEl?.querySelector(`#cards-${model.id}`) || document.getElementById(`cards-${model.id}`);
  const timer = setTimeout(() => { cardsEl.innerHTML = buildErrorCard('请求超时，请重试','超时'); }, 30000);
  try {
    const res = await fetch(AI_WORKER_URL, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ modelId:model.id, messages:conversations[model.id] })
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(await res.text());
    const data = safeParseJSON(await res.text());
    handleModelResponse(data, model.id);
  } catch(err) {
    clearTimeout(timer);
    cardsEl.innerHTML = buildErrorCard(err.message||'请求失败','获取失败');
  }
}

function toggleDialog(modelId) {
  const panel = document.getElementById(`dialog-panel-${modelId}`);
  panel.classList.toggle('open');
  if (panel.classList.contains('open'))
    setTimeout(() => document.getElementById(`chat-input-${modelId}`)?.focus(), 400);
}
window.toggleDialog = toggleDialog;

async function sendChat(modelId) {
  const input = document.getElementById(`chat-input-${modelId}`);
  const text  = input.value.trim(); if (!text) return;
  input.value = '';
  appendBubble(modelId, text, 'user');
  conversations[modelId].push({ role:'user', content:text });
  const loadingId = 'loading-'+Date.now();
  appendBubble(modelId, '⏳ 分析中...', 'ai', loadingId);
  const cardsEl = document.getElementById(`cards-${modelId}`);
  const timer = setTimeout(() => {
    document.getElementById(loadingId)?.remove();
    appendBubble(modelId,'响应超时，请重试','ai');
  }, 30000);
  try {
    const res = await fetch(AI_WORKER_URL, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ modelId, messages:conversations[modelId] })
    });
    clearTimeout(timer);
    document.getElementById(loadingId)?.remove();
    if (!res.ok) throw new Error(await res.text());
    const data = safeParseJSON(await res.text());
    if (data.type !== 'answer') {
      cardsEl.innerHTML = buildLoadingCard();
      setTimeout(() => handleModelResponse(data, modelId), 0);
    } else {
      handleModelResponse(data, modelId);
    }
  } catch(err) {
    clearTimeout(timer);
    document.getElementById(loadingId)?.remove();
    appendBubble(modelId,`错误：${err.message}`,'ai');
  }
}
window.sendChat = sendChat;

function appendBubble(modelId, text, role, id) {
  const history = document.getElementById(`chat-history-${modelId}`);
  if (!history) return;
  const div = document.createElement('div');
  if (id) div.id = id;
  div.className = `chat-bubble ${role}`;
  const formatted = text.replace(/\n/g, '<br>');
  div.innerHTML = `<div class="bubble-inner ${role==='ai'?'ai-style':'user-style'}">
    ${role==='ai'?'<span class="bubble-tag">AI</span>':''}${formatted}
  </div>`;
  history.appendChild(div);
  history.scrollTop = history.scrollHeight;
  const panel = document.getElementById(`dialog-panel-${modelId}`);
  if (panel && !panel.classList.contains('open')) panel.classList.add('open');
}

function buildLoadingCard() {
  return `<div class="ai-card ai-card-loading">
    <div class="ai-card-meta"><span style="color:#334155;font-size:.7rem;">⏳ 正在检索分析...</span></div>
    <div class="pulse w3"></div><div class="pulse w2"></div>
  </div>`;
}
function buildResultCard(data, index) {
  const hasLink = data.link && data.link !== '#';
  return `<div class="ai-card">
    <div class="ai-card-top">
      ${hasLink
        ? `<a href="${data.link}" target="_blank" rel="noopener noreferrer" class="ai-card-name">${data.siteName}</a>`
        : `<span class="ai-card-name no-link">${data.siteName}</span>`}
      <span class="ai-card-fee">${data.fee}</span>
    </div>
    <p class="ai-card-desc">${data.function}</p>
    <div class="ai-card-url">
      ${hasLink
        ? `<a href="${data.link}" target="_blank" rel="noopener noreferrer">${data.link}</a>`
        : `<span>暂无链接</span>`}
    </div>
  </div>`;
}
function buildErrorCard(msg, tag) {
  return `<div class="ai-card ai-card-error">
    <div><span class="ai-card-error-tag">${tag}</span></div>
    <p style="font-size:.82rem;color:#64748b;margin:.5rem 0 0;">${msg}</p>
  </div>`;
}

// ── 入口 ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  localStorage.setItem('navMode', 'ai');

  // 绑定标题点击 → 模式菜单
  const titleEl = document.getElementById('site-title');
  if (titleEl) titleEl.addEventListener('click', toggleModeMenu);

  // 点空白关闭
  document.addEventListener('click', (e) => {
    if (_modeMenuEl && !_modeMenuEl.contains(e.target)) closeModeMenu();
  });
  window.addEventListener('resize', () => { if (_modeMenuOpen) positionModeMenu(); });
  window.addEventListener('scroll', () => { if (_modeMenuOpen) positionModeMenu(); }, { passive: true });

  updateNetBtn();
  renderModels();
  try {
    const res  = await fetch(LINKS_FILE);
    const data = await res.json();
    renderShortcuts(data);
  } catch(e) {
    console.warn('links.json 加载失败', e);
  }
});
