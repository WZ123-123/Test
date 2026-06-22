/* ============================================================
   music.js — 音乐播放器（网易云风格）
   播放列表来自下面的 PRESET 数组（按需手动添加歌曲信息即可）
   功能：播放/暂停、上下曲、进度拖拽、音量、循环模式、
         整屏滚动歌词同步、播放列表（侧边抽屉开关）
   ============================================================ */

const MusicPlayer = {
  audio: null,
  list:  [],          // { title, artist, src, cover, lrcSrc, lrc[] }
  cur:   -1,
  mode:  'list',      // 'list' | 'single' | 'random'

  /* ─── 预置歌单（相对路径，放在 music/ 目录下，手动维护） ─── */
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

    // 加载预置歌单
    this.PRESET.forEach(p => this._addTrack(p));
    this._renderList();
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

  /* ─── 播放列表抽屉开关 ─── */
  toggleList() {
    document.getElementById('music-list-wrap')?.classList.toggle('open');
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
    this._renderLyricsList(null, '加载歌词中...');
    if (t.lrcSrc) {
      try {
        const res  = await fetch(t.lrcSrc);
        const text = await res.text();
        t.lrc = this._parseLrc(text);
        this._renderLyricsList(t.lrc, '暂无歌词');
      } catch { this._renderLyricsList(null, '歌词加载失败'); }
    } else {
      this._renderLyricsList(null, '暂无歌词');
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
    this._renderLyricsList(null, '文件加载失败');
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

  /* 整屏滚动歌词：把所有行渲染出来，当前行高亮，其余行淡灰 */
  _renderLyricsList(lrc, emptyText) {
    const wrap = document.getElementById('music-lyrics');
    if (!wrap) return;
    wrap.dataset.idx = '';
    if (!lrc || !lrc.length) {
      wrap.innerHTML = `<div class="lrc-empty">${emptyText || '暂无歌词'}</div>`;
      return;
    }
    wrap.innerHTML = lrc.map((l, i) =>
      `<div class="lrc-line" data-i="${i}">${l.text || '·'}</div>`
    ).join('');
  },

  _syncLyric(cur) {
    const lrc = this.list[this.cur]?.lrc;
    if (!lrc || !lrc.length) return;
    let idx = 0;
    for (let i = 0; i < lrc.length; i++) {
      if (lrc[i].t <= cur) idx = i;
    }
    const wrap = document.getElementById('music-lyrics');
    if (!wrap || wrap.dataset.idx === String(idx)) return;
    wrap.dataset.idx = idx;
    wrap.querySelectorAll('.lrc-line.active').forEach(el => el.classList.remove('active'));
    const activeEl = wrap.querySelector(`.lrc-line[data-i="${idx}"]`);
    if (activeEl) {
      activeEl.classList.add('active');
      activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  },

  /* ─── 播放列表渲染 ─── */
  _renderList() {
    const wrap = document.getElementById('music-list');
    if (!wrap) return;
    if (!this.list.length) {
      wrap.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,.4);font-size:12px;">暂无歌曲</div>';
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
      this._renderLyricsList(null, '暂无歌词');
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
