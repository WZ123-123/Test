/* ============================================================
   weather.js — 真实天气接口
   使用 open-meteo.com（免费、无需 Key）+ ipapi.co（IP定位，支持 https）
   支持：IP自动定位（失败时默认北京，可修改）/ 绑定城市（支持同名城市选择）
         / 桌面天气小组件与真实数据同步
   ============================================================ */

const Weather = {
  _loc:        null,   // 当前生效的位置 { name, admin1, country, lat, lon }
  _locFallback: false, // 是否是“定位失败，使用默认北京”的兜底状态
  _candidates:  [],    // 城市搜索的候选结果（同名城市消歧）
  _loaded:      false,

  DEFAULT_LOC: { name: '北京', admin1: '', country: '中国', lat: 39.9042, lon: 116.4074 },

  ICONS: {
    0:'☀️', 1:'🌤', 2:'⛅', 3:'☁️',
    45:'🌫', 48:'🌫',
    51:'🌦', 53:'🌦', 55:'🌧',
    61:'🌧', 63:'🌧', 65:'🌧',
    71:'🌨', 73:'🌨', 75:'❄️',
    80:'🌦', 81:'🌧', 82:'⛈',
    95:'⛈', 96:'⛈', 99:'⛈',
  },
  DESCS: {
    0:'晴',1:'大部晴朗',2:'局部多云',3:'阴天',
    45:'雾',48:'雾凇',
    51:'小毛毛雨',53:'毛毛雨',55:'大毛毛雨',
    61:'小雨',63:'中雨',65:'大雨',
    71:'小雪',73:'中雪',75:'大雪',
    80:'阵雨',81:'中阵雨',82:'大阵雨',
    95:'雷阵雨',96:'雷阵雨夹冰雹',99:'强雷阵雨',
  },

  /* ─── 打开面板时调用 ─── */
  async open() {
    this._showLoading();
    this._loadSavedLoc();
    if (this._loc) document.getElementById('wd-city-input').value = this._loc.name;
    this._hideCandidates();
    await this._load();
  },

  /* ─── 桌面挂件初始化：随页面一起静默加载，不依赖打开面板 ─── */
  async autoLoad() {
    this._loadSavedLoc();
    await this._load(true);
  },

  _loadSavedLoc() {
    try {
      const raw = localStorage.getItem('weather_loc');
      if (raw) this._loc = JSON.parse(raw);
    } catch (e) { this._loc = null; }
  },

  /* ─── 绑定城市（支持同名城市消歧） ─── */
  async bindCity() {
    const val = document.getElementById('wd-city-input').value.trim();
    if (!val) return;
    this._hideCandidates();
    this._showLoading();
    try {
      const results = await this._geocodeSearch(val);
      if (!results.length) { this._showError(`找不到城市：${val}`); return; }
      if (results.length === 1) {
        this._applyLoc(results[0]);
        await this._load();
      } else {
        // 多个同名城市，列出来让用户自己选（带省/州 + 国家区分）
        this._showCandidates(results);
      }
    } catch (e) {
      this._showError('搜索失败，请检查网络');
    }
  },

  async _geocodeSearch(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=8&language=zh&format=json`;
    const res  = await fetch(url);
    const data = await res.json();
    return data.results || [];
  },

  _applyLoc(r) {
    this._loc = {
      name: r.name, admin1: r.admin1 || '', country: r.country || '',
      lat: r.latitude, lon: r.longitude,
    };
    this._locFallback = false;
    localStorage.setItem('weather_loc', JSON.stringify(this._loc));
  },

  _showCandidates(results) {
    const wrap = document.getElementById('wd-city-candidates');
    if (!wrap) return;
    this._candidates = results;
    wrap.innerHTML = results.map((r, i) => {
      const sub = [r.admin1, r.country].filter(Boolean).join('，');
      return `<div class="wd-candidate" data-i="${i}">
        <span class="wd-candidate-name">${r.name}</span>
        ${sub ? `<span class="wd-candidate-sub">${sub}</span>` : ''}
      </div>`;
    }).join('');
    wrap.style.display = '';
    wrap.querySelectorAll('.wd-candidate').forEach(el => {
      el.addEventListener('click', async () => {
        const r = this._candidates[+el.dataset.i];
        this._hideCandidates();
        this._applyLoc(r);
        document.getElementById('wd-city-input').value = r.name;
        this._showLoading();
        await this._load();
      });
    });
    document.getElementById('wd-loading').style.display = 'none';
    document.getElementById('wd-content').style.display = 'none';
    document.getElementById('wd-error').style.display   = 'none';
  },

  _hideCandidates() {
    const wrap = document.getElementById('wd-city-candidates');
    if (wrap) { wrap.style.display = 'none'; wrap.innerHTML = ''; }
  },

  /* ─── 核心加载 ─── */
  async _load(silent = false) {
    try {
      if (!this._loc) await this._ipLocate();
      await this._fetchWeather(silent);
    } catch (e) {
      if (!silent) this._showError(e.message || '天气加载失败，请检查网络');
    }
  },

  /* ─── IP 定位（ipapi.co 支持 https，失败则兜底默认北京，仍可在输入框手动修改） ─── */
  async _ipLocate() {
    try {
      const res  = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && !data.error && data.latitude && data.longitude) {
        this._loc = {
          name: data.city || '当前位置', admin1: data.region || '',
          country: data.country_name || '', lat: data.latitude, lon: data.longitude,
        };
        this._locFallback = false;
        return;
      }
      throw new Error('定位失败');
    } catch (e) {
      this._loc = { ...this.DEFAULT_LOC };
      this._locFallback = true;
    }
  },

  /* ─── 获取天气 ─── */
  async _fetchWeather(silent) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${this._loc.lat}&longitude=${this._loc.lon}`
      + `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min`
      + `&timezone=auto&forecast_days=5`;
    const res  = await fetch(url);
    const data = await res.json();
    this._render(data, silent);
  },

  /* ─── 渲染（面板 + 桌面小组件同步） ─── */
  _render(data, silent) {
    const c = data.current;
    const d = data.daily;
    const code = c.weather_code;
    const cityLabel = this._loc.name + (this._locFallback ? '（自动定位失败，已默认）' : '');

    document.getElementById('wd-city-name').textContent = cityLabel;
    document.getElementById('wd-temp').textContent     = Math.round(c.temperature_2m) + '°C';
    document.getElementById('wd-icon').textContent     = this.ICONS[code] || '🌤';
    document.getElementById('wd-feel').textContent     = `🌡 体感：${Math.round(c.apparent_temperature)}°C`;
    document.getElementById('wd-humidity').textContent = `💧 湿度：${c.relative_humidity_2m}%`;
    document.getElementById('wd-wind').textContent     = `🌬 风速：${c.wind_speed_10m} km/h`;
    document.getElementById('wd-desc').textContent     = `${this.ICONS[code] || ''} ${this.DESCS[code] || ''}`;

    const days = ['今天','明天','后天'];
    const fw = document.getElementById('wd-forecast');
    fw.innerHTML = d.time.slice(0, 5).map((_, i) => {
      const dc = d.weather_code[i];
      return `<div class="wd-day">
        <div class="dn">${days[i] || d.time[i].slice(5)}</div>
        <div class="di">${this.ICONS[dc] || '🌤'}</div>
        <div class="dt">${Math.round(d.temperature_2m_max[i])}/${Math.round(d.temperature_2m_min[i])}°</div>
      </div>`;
    }).join('');

    document.getElementById('wd-loading').style.display = 'none';
    document.getElementById('wd-error').style.display   = 'none';
    document.getElementById('wd-content').style.display = '';
    this._loaded = true;
    this._lastData = data;

    this._syncDesktopWidget(data);
  },

  /* renderAll() 重建 DOM 后会清空小组件为占位符，需要重新塞回真实数据 */
  resyncDesktopWidget() {
    if (this._lastData) this._syncDesktopWidget(this._lastData);
  },

  /* ─── 同步桌面天气小组件（不再是写死的“23°/北京”占位数据） ─── */
  _syncDesktopWidget(data) {
    const tile = document.querySelector('.desk-item[data-id="weather"]');
    if (!tile) return;
    const c = data.current, d = data.daily, code = c.weather_code;

    const icon = tile.querySelector('.w-icon-top'); if (icon) icon.textContent = this.ICONS[code] || '🌤';
    const temp = tile.querySelector('.w-temp');     if (temp) temp.textContent = Math.round(c.temperature_2m) + '°';
    const desc = tile.querySelector('.w-desc');      if (desc) desc.textContent = this.DESCS[code] || '';
    const city = tile.querySelector('.w-city');
    if (city) city.textContent = (this._loc.name || '') + (this._locFallback ? '（默认）' : '') + ' · 今日';
    const footer = tile.querySelector('.w-footer-lbl');
    if (footer) footer.textContent = `体感 ${Math.round(c.apparent_temperature)}°`;

    const weekNames = ['周日','周一','周二','周三','周四','周五','周六'];
    const dayEls = tile.querySelectorAll('.w-day');
    d.time.slice(1, 1 + dayEls.length).forEach((dateStr, i) => {
      const dayEl = dayEls[i];
      if (!dayEl) return;
      const label = dayEl.querySelector('.w-day-label');
      const val   = dayEl.querySelector('b');
      if (label) label.textContent = weekNames[new Date(dateStr).getDay()];
      if (val)   val.textContent   = Math.round(d.temperature_2m_max[i + 1]) + '°';
    });
  },

  _showLoading() {
    document.getElementById('wd-loading').style.display = '';
    document.getElementById('wd-content').style.display = 'none';
    document.getElementById('wd-error').style.display   = 'none';
  },

  _showError(msg) {
    document.getElementById('wd-loading').style.display = 'none';
    document.getElementById('wd-content').style.display = 'none';
    const el = document.getElementById('wd-error');
    el.style.display = '';
    el.textContent   = '⚠️ ' + msg;
  },
};

/* 打开天气弹窗时自动加载 + 页面加载后静默加载并同步桌面小组件 */
document.addEventListener('DOMContentLoaded', () => {
  const ov = document.getElementById('weather-overlay');
  if (ov) {
    new MutationObserver(() => {
      if (ov.classList.contains('open')) Weather.open();
    }).observe(ov, { attributes: true, attributeFilter: ['class'] });
  }
  // 不依赖打开面板，页面一加载就静默获取一次，桌面小组件才能显示真实数据
  Weather.autoLoad();
});
