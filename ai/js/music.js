/* ============================================================
   music.js — 本地音乐播放器
   支持：相对路径预置歌单 / 手动添加文件
   功能：播放/暂停、上下曲、进度拖拽、音量、循环模式、歌词同步、播放列表
   ============================================================ */

const MusicPlayer = {
  audio: null,
  list:  [],          // { title, artist, src, cover, lrcSrc, lrc[] }
  cur:   -1,
  mode:  'list',      // 'list' | 'single' | 'random'
  _lrcTimer: null,

  /* ─── 预置歌单（相对路径，放在 music/ 目录下） ─── */
  PRESET: [
    /* 示例，有文件时取消注释：
    {
      title:  '示例歌曲',
      artist: '未知歌手',
      src:    'music/example.mp3',
      cover:  'music/example.jpg',   // 可选
      lrcSrc: 'music/example.lrc',   // 可选
    },
    */
  ],

  /* ─── 初始化 ─── */
  init() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.volume = 0.8;

    this.audio.addEventListener('timeupdate',  () => this._onTimeUpdate());
    this.audio.addEventListener('ended',       () => this._onEnded());
    this.audio.addEventListener('loadedmetadata', () => this._onMeta());
    this.audio.addEventListener('error',       () => this._onError());

    document.getElementById('music-progress')
      .addEventListener('input', e => {
        if (this.audio.duration) {
          this.audio.currentTime = (e.target.value / 100) * this.audio.duration;
        }
      });

    document.getElementById('music-vol')
      .addEventListener('input', e => { this.audio.volume = +e.target.value; });

    document.getElementById('music-file-input')
      .addEventListener('change', e => this._addFiles(e.target.files));

    // 加载预置
    this.PRESET.forEach(p => this._addTrack(p));
    this._renderList();
  },

  /* ─── 添加本地文件 ─── */
  _addFiles(files) {
    Array.from(files).forEach(file => {
      const src   = URL.createObjectURL(file);
      const name  = file.name.replace(/\.[^.]+$/, '');
      this._addTrack({ title: name, artist: '', src, cover: '', lrcSrc: '' });
    });
    this._renderList();
    if (this.cur < 0 && this.list.length > 0) this.play(0);
  },

  _addTrack(info) {
    this.list.push({
      title:  info.title  || '未知歌曲',
      artist: info.artist || '',
      src:    info.src    || '',
      cover:  info.cover  || '',
      lrcSrc: info.lrcSrc || '',
      lrc:    [],
    });
  },

  /* ─── 控制黑胶旋转 + 唱针动画 ─── */
  _setPlayingState(on) {
    document.getElementById('music-panel')?.classList.toggle('playing', on);
  },

  /* ─── 播放指定曲目 ─── */
  async play(idx) {
    if (idx < 0 || idx >= this.list.length) return;
    this.cur = idx;
    const t = this.list[idx];

    this.audio.src = t.src;
    this.audio.play().catch(() => {});

    // 封面
    const cover     = document.getElementById('music-cover');
    const coverDef  = document.getElementById('music-cover-default');
    if (t.cover) {
      cover.src = t.cover;
      cover.style.display    = '';
      coverDef.style.display = 'none';
    } else {
      cover.src = '';
      cover.style.display    = 'none';
      coverDef.style.display = '';
    }

    document.getElementById('music-title').textContent  = t.title;
    document.getElementById('music-artist').textContent = t.artist || '未知歌手';
    document.getElementById('mc-play').textContent      = '⏸';
    this._setPlayingState(true);

    // 歌词
    t.lrc = [];
    document.getElementById('music-lyrics').textContent = '加载歌词中...';
    if (t.lrcSrc) {
      try {
        const res  = await fetch(t.lrcSrc);
        const text = await res.text();
        t.lrc = this._parseLrc(text);
        if (!t.lrc.length) document.getElementById('music-lyrics').textContent = '暂无歌词';
      } catch { document.getElementById('music-lyrics').textContent = '歌词加载失败'; }
    } else {
      document.getElementById('music-lyrics').textContent = '暂无歌词';
    }

    this._renderList();
  },

  togglePlay() {
    if (!this.audio.src) { if (this.list.length) this.play(0); return; }
    if (this.audio.paused) {
      this.audio.play();
      document.getElementById('mc-play').textContent = '⏸';
      this._setPlayingState(true);
    } else {
      this.audio.pause();
      document.getElementById('mc-play').textContent = '▶️';
      this._setPlayingState(false);
    }
  },

  prev() {
    if (!this.list.length) return;
    const next = this.mode === 'random'
      ? Math.floor(Math.random() * this.list.length)
      : (this.cur - 1 + this.list.length) % this.list.length;
    this.play(next);
  },

  next() {
    if (!this.list.length) return;
    const next = this.mode === 'random'
      ? Math.floor(Math.random() * this.list.length)
      : (this.cur + 1) % this.list.length;
    this.play(next);
  },

  toggleMode() {
    const modes = ['list', 'single', 'random'];
    const icons = { list: '🔁', single: '🔂', random: '🔀' };
    this.mode = modes[(modes.indexOf(this.mode) + 1) % modes.length];
    document.getElementById('mc-mode').textContent = icons[this.mode];
  },

  /* ─── 事件 ─── */
  _onTimeUpdate() {
    const a = this.audio;
    if (!a.duration) return;
    const pct = (a.currentTime / a.duration) * 100;
    document.getElementById('music-progress').value = pct;
    document.getElementById('music-cur').textContent = this._fmt(a.currentTime);
    this._syncLyric(a.currentTime);
  },

  _onMeta() {
    document.getElementById('music-dur').textContent = this._fmt(this.audio.duration);
  },

  _onEnded() {
    if (this.mode === 'single') { this.audio.play(); return; }
    this.next();
  },

  _onError() {
    document.getElementById('music-lyrics').textContent = '文件加载失败';
  },

  /* ─── 歌词 ─── */
  _parseLrc(text) {
    const lines = [];
    const re = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/;
    text.split('\n').forEach(line => {
      const m = line.match(re);
      if (m) lines.push({ t: +m[1] * 60 + +m[2], text: m[3].trim() });
    });
    return lines.sort((a, b) => a.t - b.t);
  },

  _syncLyric(cur) {
    const lrc = this.list[this.cur]?.lrc;
    if (!lrc || !lrc.length) return;
    let idx = 0;
    for (let i = 0; i < lrc.length; i++) {
      if (lrc[i].t <= cur) idx = i;
    }
    const el = document.getElementById('music-lyrics');
    if (el.dataset.idx !== String(idx)) {
      el.dataset.idx = idx;
      el.textContent = lrc[idx]?.text || '';
    }
  },

  /* ─── 播放列表渲染 ─── */
  _renderList() {
    const wrap = document.getElementById('music-list');
    if (!wrap) return;
    if (!this.list.length) {
      wrap.innerHTML = '<div style="padding:20px;text-align:center;color:#bbb;font-size:12px;">暂无歌曲<br>点击「添加」导入本地音乐</div>';
      return;
    }
    wrap.innerHTML = this.list.map((t, i) => `
      <div class="ml-item${i === this.cur ? ' active' : ''}" onclick="MusicPlayer.play(${i})">
        <span class="ml-idx">${i === this.cur ? '♫' : i + 1}</span>
        <span class="ml-info">
          <span class="ml-title">${t.title}</span>
          ${t.artist ? `<span class="ml-artist">${t.artist}</span>` : ''}
        </span>
        <span class="ml-del" onclick="event.stopPropagation();MusicPlayer.remove(${i})">✕</span>
      </div>
    `).join('');
  },

  remove(idx) {
    this.list.splice(idx, 1);
    if (this.cur === idx) {
      this.audio.pause();
      this.cur = -1;
      document.getElementById('music-title').textContent  = '未播放';
      document.getElementById('music-artist').textContent = '--';
      document.getElementById('mc-play').textContent      = '▶️';
      document.getElementById('music-lyrics').textContent = '暂无歌词';
      this._setPlayingState(false);
    } else if (this.cur > idx) {
      this.cur--;
    }
    this._renderList();
  },

  /* ─── 工具 ─── */
  _fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  // 打开音乐弹窗时初始化
  const obs = new MutationObserver(() => {
    const ov = document.getElementById('music-overlay');
    if (ov && ov.classList.contains('open')) MusicPlayer.init();
  });
  const ov = document.getElementById('music-overlay');
  if (ov) obs.observe(ov, { attributes: true, attributeFilter: ['class'] });
});
