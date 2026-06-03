/* ============================================================
   widgets.js — 天气、AI对话、记事本、画板
   ============================================================ */

const Widgets = {
  /* ---- 记事本 ---- */
  loadNote() {
    const area = document.getElementById('note-area');
    try { area.value = localStorage.getItem('aiNav_note') || ''; } catch (e) {}
    this._updateNoteCount();
    area.oninput = () => this._updateNoteCount();
  },
  _updateNoteCount() {
    const area = document.getElementById('note-area');
    document.getElementById('note-count').textContent = area.value.length + ' 字';
  },
  saveNote() {
    const area = document.getElementById('note-area');
    try { localStorage.setItem('aiNav_note', area.value); } catch (e) {}
    document.getElementById('note-count').textContent = '已保存 ✓';
    setTimeout(() => this._updateNoteCount(), 1500);
  },

  /* ---- 画板 ---- */
  _dc: null, _dctx: null, _drawing: false,
  _tool: 'pen', _color: '#222', _size: 3,
  _savedImg: null,

  initCanvas() {
    const canvas = document.getElementById('draw-canvas');
    const panel  = document.getElementById('draw-panel');
    const tb     = document.getElementById('draw-toolbar');
    const newW   = panel.offsetWidth  || 660;
    const newH   = (panel.offsetHeight || 500) - 42 - (tb?.offsetHeight || 44) - 2;
    // save current drawing if size changed
    let img = null;
    if (this._dctx && (canvas.width !== newW || canvas.height !== newH)) {
      img = this._dctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    canvas.width  = newW;
    canvas.height = Math.max(newH, 100);
    this._dc   = canvas;
    this._dctx = canvas.getContext('2d');
    this._dctx.lineCap = 'round';
    this._dctx.lineJoin = 'round';
    if (img) this._dctx.putImageData(img, 0, 0);
  },

  setTool(t) {
    this._tool = t;
    document.querySelectorAll('.dtool[id^="tool-"]').forEach(b => b.classList.remove('active'));
    document.getElementById('tool-' + t)?.classList.add('active');
  },
  setColor(el) {
    this._color = el.dataset.c;
    document.querySelectorAll('.clr-dot').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    this.setTool('pen');
  },
  clearCanvas() {
    if (this._dctx) this._dctx.clearRect(0, 0, this._dc.width, this._dc.height);
  },
  saveCanvas() {
    const a = document.createElement('a');
    a.download = 'drawing.png';
    a.href = this._dc.toDataURL();
    a.click();
  },

  bindCanvas() {
    const c = document.getElementById('draw-canvas');
    const pos = e => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    c.addEventListener('mousedown', e => {
      this._drawing = true;
      const p = pos(e);
      this._dctx.beginPath();
      this._dctx.moveTo(p.x, p.y);
      this._dctx.strokeStyle = this._tool === 'eraser' ? '#fff' : this._color;
      this._dctx.lineWidth   = this._tool === 'eraser' ? this._size * 4 : this._size;
    });
    c.addEventListener('mousemove', e => {
      if (!this._drawing) return;
      const p = pos(e);
      this._dctx.lineTo(p.x, p.y);
      this._dctx.stroke();
    });
    c.addEventListener('mouseup',    () => this._drawing = false);
    c.addEventListener('mouseleave', () => this._drawing = false);
    document.getElementById('draw-sz')?.addEventListener('input', function () {
      Widgets._size = +this.value;
    });
  },

  /* ---- AI 对话 ---- */
  chatHistory: [],

  appendMsg(role, text, loading = false) {
    const msgs = document.getElementById('chat-msgs');
    const d = document.createElement('div');
    d.className = 'chat-msg ' + role + (loading ? ' loading' : '');
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  },

  async sendChat() {
    const input = document.getElementById('chat-input');
    const text  = input.value.trim();
    if (!text) return;
    input.value = '';
    const sendBtn = document.getElementById('chat-send');
    sendBtn.disabled = true;

    this.appendMsg('user', text);
    this.chatHistory.push({ role: 'user', content: text });

    const ld  = this.appendMsg('ai', '思考中…', true);
    const key = App.apiKey || localStorage.getItem('aiNav_apiKey') || '';

    if (!key) {
      ld.classList.remove('loading');
      ld.textContent = '请先在设置中填写 Anthropic API Key。';
      sendBtn.disabled = false;
      return;
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: '你是一个友好的中文AI助手，回答简洁清晰。',
          messages: this.chatHistory,
        }),
      });
      const data  = await res.json();
      const reply = data.content?.map(i => i.text || '').join('') || '抱歉，无法回答。';
      ld.classList.remove('loading');
      ld.textContent = reply;
      this.chatHistory.push({ role: 'assistant', content: reply });
    } catch (ex) {
      ld.classList.remove('loading');
      ld.textContent = '连接失败，请检查网络或 API Key。';
    }

    sendBtn.disabled = false;
    document.getElementById('chat-msgs').scrollTop = 9999;
  },
};

/* ---- DOMContentLoaded bindings ---- */
document.addEventListener('DOMContentLoaded', () => {
  Widgets.bindCanvas();

  document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); Widgets.sendChat(); }
  });
  document.getElementById('chat-send')?.addEventListener('click', () => Widgets.sendChat());
  document.getElementById('note-area')?.addEventListener('input', () => Widgets._updateNoteCount());
});
