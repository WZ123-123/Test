/* ===========================
   王五导航 · AI检索 · main.js
   =========================== */

const WORKER_URL    = 'https://ico.xmynscnq.dpdns.org';
const AI_WORKER_URL = 'https://www.scnq.us.ci';
const LINKS_FILE    = '../links.json';
const DEFAULT_ICON  = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0yIDEyaDIwIj48L3BhdGg+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+';

// ── 模式切换 ──────────────────────────────────────────────
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
  const next = MODES[(MODES.indexOf('ai') + 1) % MODES.length];
  localStorage.setItem('navMode', next);
  window.location.href = MODE_PATHS[next];
}

// ── 图标 ──────────────────────────────────────────────────
function getDomain(url) { try { return new URL(url).hostname; } catch { return null; } }
function buildFaviconUrl(domain) { return domain ? `${WORKER_URL}/?domain=${domain}` : DEFAULT_ICON; }
function faviconSrc(url) { return buildFaviconUrl(getDomain(url)); }

// ── 内外网 ────────────────────────────────────────────────
let isIntranet = localStorage.getItem('netMode') === 'intranet';
function getCardUrl(item) { return (isIntranet && item.intranet) ? item.intranet : item.url; }

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

// ── 渲染模型选择 ──────────────────────────────────────────
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

// ── 导航（按分类显示全部）────────────────────────────────
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

// ── AI 检索主逻辑 ─────────────────────────────────────────
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
        <input type="text" id="chat-input-${model.id}" placeholder="继续补充描述或回答问题..."
               onkeydown="if(event.key==='Enter') sendChat('${model.id}')">
        <button onclick="sendChat('${model.id}')">发送</button>
      </div>
    </div>
  `;
  return div;
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
    const siteNames = (data.sites||[]).map(s=>s.siteName).join('、');
    conversations[model.id].push({ role:'assistant', content: data.needsClarification
      ? `我已推荐了以下网站：${siteNames}。但我还需要了解：${data.question}`
      : `我已推荐了以下网站：${siteNames}。` });
    cardsEl.innerHTML = (data.sites||[]).map((item,i)=>buildResultCard(item,i+1)).join('');
    const btn  = document.getElementById(`dialog-btn-${model.id}`);
    const text = document.getElementById(`dialog-btn-text-${model.id}`);
    btn.classList.add('show');
    if (data.needsClarification) {
      btn.className = 'ai-dialog-btn show clarify';
      text.textContent = '💬 深入对话（AI有疑问）';
      appendBubble(model.id, data.question, 'ai');
    } else {
      btn.className = 'ai-dialog-btn show explore';
      text.textContent = '🔍 继续探索';
      appendBubble(model.id, '推荐结果已就绪，你可以继续提问来优化结果。', 'ai');
    }
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
  cardsEl.innerHTML = buildLoadingCard();
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
    const siteNames = (data.sites||[]).map(s=>s.siteName).join('、');
    conversations[modelId].push({ role:'assistant', content: data.needsClarification
      ? `我已推荐了以下网站：${siteNames}。但我还需要了解：${data.question}`
      : `我已推荐了以下网站：${siteNames}。` });
    cardsEl.innerHTML = (data.sites||[]).map((item,i)=>buildResultCard(item,i+1)).join('');
    const btn  = document.getElementById(`dialog-btn-${modelId}`);
    const btnT = document.getElementById(`dialog-btn-text-${modelId}`);
    if (data.needsClarification) {
      btn.className='ai-dialog-btn show clarify'; btnT.textContent='💬 深入对话（AI有疑问）';
      appendBubble(modelId, data.question, 'ai');
    } else {
      btn.className='ai-dialog-btn show explore'; btnT.textContent='🔍 继续探索';
      appendBubble(modelId,'结果已更新，可继续提问。','ai');
    }
  } catch(err) {
    clearTimeout(timer);
    document.getElementById(loadingId)?.remove();
    appendBubble(modelId,`错误：${err.message}`,'ai');
    cardsEl.innerHTML = buildErrorCard(err.message,'获取失败');
  }
}
window.sendChat = sendChat;

function appendBubble(modelId, text, role, id) {
  const history = document.getElementById(`chat-history-${modelId}`);
  if (!history) return;
  const div = document.createElement('div');
  if (id) div.id = id;
  div.className = `chat-bubble ${role}`;
  div.innerHTML = `<div class="bubble-inner ${role==='ai'?'ai-style':'user-style'}">
    ${role==='ai'?'<span class="bubble-tag">AI</span>':''}${text}
  </div>`;
  history.appendChild(div);
  history.scrollTop = history.scrollHeight;
}

function buildLoadingCard() {
  return `<div class="ai-card ai-card-loading">
    <div class="ai-card-meta"><span style="color:#334155;font-size:.7rem;">⏳ 正在检索分析...</span></div>
    <div class="pulse w3"></div><div class="pulse w2"></div>
  </div>`;
}

function buildResultCard(data, index) {
  return `<div class="ai-card">
    <div>
      <div class="ai-card-meta"><span>#${index}</span><span class="ai-card-live">实时分析</span></div>
      <div style="margin:.5rem 0 .25rem"><span class="ai-card-label">① 网站名称</span><span class="ai-card-name">${data.siteName}</span></div>
      <div style="margin:.5rem 0 .25rem"><span class="ai-card-label">② 推荐理由 & 提示</span><p class="ai-card-desc">${data.function}</p></div>
      <div><span class="ai-card-label">③ 收费情况</span><span class="ai-card-fee">${data.fee}</span></div>
    </div>
    <div class="ai-card-footer">
      <span>④ 直达通道</span>
      ${data.link && data.link!=='#'
        ? `<a href="${data.link}" target="_blank" rel="noopener noreferrer">访问网站 ↗</a>`
        : `<span style="color:#1e293b;font-size:.72rem;">无法访问</span>`}
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
  document.getElementById('site-title')?.addEventListener('click', switchMode);
  renderModels();
  try {
    const res  = await fetch(LINKS_FILE);
    const data = await res.json();
    renderShortcuts(data);
  } catch(e) {
    console.warn('links.json 加载失败', e);
  }
});
