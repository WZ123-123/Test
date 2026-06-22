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

};

/* ---- 今日热点（桌面小组件实时同步） ---- */
const Hotspot = {
  _data: [],

  // 接口列表：依次重试，第一个成功就停止。
  // 用知乎热榜做主接口（vvhan 该接口结构固定，跨域无问题）；微博热搜做备用。
  // baiduRD 接口返回百度原始嵌套格式，需要额外处理，暂不作为主接口。
  API_URLS: [
    'https://api.vvhan.com/api/hotlist?type=zhihuHot',
    'https://api.vvhan.com/api/hotlist?type=wbhot',
  ],

  // 从任意嵌套结构里找到第一个非空数组（深度优先）
  _findArray(obj, depth) {
    if (depth === undefined) depth = 0;
    if (depth > 4) return null;
    if (Array.isArray(obj) && obj.length) return obj;
    if (obj && typeof obj === 'object') {
      for (const v of Object.values(obj)) {
        const found = this._findArray(v, depth + 1);
        if (found) return found;
      }
    }
    return null;
  },

  async load() {
    for (const url of this.API_URLS) {
      try {
        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), 6000);
        const res  = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        const json = await res.json();
        // 先找已知字段，找不到再深度搜索
        const raw = json.data || json.result || json.list || this._findArray(json) || [];
        const list = raw.slice(0, 4).map(it => ({
          title: it.title || it.name || it.word || it.desc || '',
          url:   it.url || it.link || it.mobilUrl || it.mobileUrl || '',
        }))
        .filter(it => it.title)
        .map(it => ({
          title: it.title,
          url:   it.url || ('https://www.baidu.com/s?wd=' + encodeURIComponent(it.title)),
        }));

        if (list.length) {
          this._data = list;
          this._sync();
          return;
        }
        console.warn('[Hotspot] 接口返回为空，尝试下一个：', url, json);
      } catch (e) {
        console.warn('[Hotspot] 接口请求失败：', url, e.message || e);
      }
    }
    // 全部失败：把卡片从"加载中"改成提示，点击可跳转
    const list = document.querySelector('.desk-item[data-id="hotspot"] .hs-list');
    if (list) {
      list.innerHTML = '<div class="hs-row" data-url="https://top.baidu.com/board?tab=realtime" style="color:rgba(26,58,92,.5)">暂无数据，点击查看百度热搜</div>';
    }
  },

  _sync() {
    const list = document.querySelector('.desk-item[data-id="hotspot"] .hs-list');
    if (!list || !this._data.length) return;
    list.innerHTML = this._data.map((it, i) =>
      '<div class="hs-row" data-url="' + it.url + '" title="' + it.title + '"><b>' + (i+1) + '</b>' + it.title + '</div>'
    ).join('');
  },

  /* renderAll() 重建 DOM 后需要把已经拉到的数据重新塞回去 */
  resync() { if (this._data.length) this._sync(); },
};

document.addEventListener('DOMContentLoaded', () => Hotspot.load());


document.addEventListener('DOMContentLoaded', () => {
  Widgets.bindCanvas();

  document.getElementById('note-area')?.addEventListener('input', () => Widgets._updateNoteCount());
});
