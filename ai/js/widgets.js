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

  // 静态兜底数据：无论接口是否可用，8 秒内没拿到数据就显示这些，
  // 点击每条会跳转到对应的百度搜索，始终可用，不会卡在"加载中"。
  FALLBACK: [
    { title: '今日百度热搜', url: 'https://top.baidu.com/board?tab=realtime' },
    { title: '微博实时热榜', url: 'https://s.weibo.com/top/summary' },
    { title: '知乎每日热榜', url: 'https://www.zhihu.com/hot' },
    { title: '今日科技要闻', url: 'https://www.baidu.com/s?wd=今日科技新闻' },
  ],

  // 接口列表：先请求文本再判断是否是 JSON，防止拦截页被当成数据解析
  API_URLS: [
    'https://api.vvhan.com/api/hotlist?type=zhihuHot',
    'https://api.vvhan.com/api/hotlist?type=wbhot',
  ],

  async load() {
    // 8 秒总超时：超时就降级到静态兜底数据
    const fallbackTimer = setTimeout(() => {
      if (!this._data.length) {
        console.warn('[Hotspot] 8 秒内未获取到数据，降级为静态兜底');
        this._data = this.FALLBACK;
        this._sync();
      }
    }, 8000);

    for (const url of this.API_URLS) {
      try {
        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), 5000);
        const res  = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);

        // 先以文本形式获取，确认是 JSON 再解析（避免拦截页被解析报错）
        const text = await res.text();
        if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
          console.warn('[Hotspot] 接口返回非 JSON（可能被拦截）：', url, text.slice(0, 80));
          continue;
        }
        const json = JSON.parse(text);
        const raw  = json.data || json.result || json.list || [];
        const list = raw.slice(0, 4)
          .map(it => ({
            title: (it.title || it.name || it.word || '').trim(),
            url:   it.url || it.link || it.mobilUrl || it.mobileUrl || '',
          }))
          .filter(it => it.title)
          .map(it => ({
            title: it.title,
            url:   it.url || ('https://www.baidu.com/s?wd=' + encodeURIComponent(it.title)),
          }));

        if (list.length) {
          clearTimeout(fallbackTimer);
          this._data = list;
          this._sync();
          return;
        }
        console.warn('[Hotspot] 接口返回数组为空：', url, json);
      } catch (e) {
        console.warn('[Hotspot] 接口请求失败：', url, e.message || String(e));
      }
    }
    // 所有接口都走完了还没数据，等 fallbackTimer 触发即可（已设置）
  },

  _sync() {
    // 找到桌面上的热点组件，填充数据
    const wrap = document.querySelector('.desk-item[data-id="hotspot"] .hs-list');
    if (!wrap) {
      // DOM 还没渲染好（极少数情况），100ms 后重试一次
      setTimeout(() => this._sync(), 100);
      return;
    }
    if (!this._data.length) return;
    wrap.innerHTML = this._data.map((it, i) =>
      '<div class="hs-row" data-url="' + it.url + '" title="' + it.title + '"><b>' + (i + 1) + '</b>' + it.title + '</div>'
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
