/* ============================================================
   weather.js — 真实天气接口
   使用 open-meteo.com（免费、无需 Key）+ ip-api.com（IP定位）
   支持：IP自动定位 / 绑定城市（geocoding）
   ============================================================ */

const Weather = {
  _city:     null,   // 用户绑定的城市名
  _lat:      null,
  _lon:      null,
  _loaded:   false,

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
    const saved = localStorage.getItem('weather_city');
    if (saved) {
      this._city = saved;
      document.getElementById('wd-city-input').value = saved;
    }
    await this._load();
  },

  /* ─── 绑定城市 ─── */
  async bindCity() {
    const val = document.getElementById('wd-city-input').value.trim();
    if (!val) return;
    this._city = val;
    localStorage.setItem('weather_city', val);
    this._showLoading();
    await this._load();
  },

  /* ─── 核心加载 ─── */
  async _load() {
    try {
      if (this._city) {
        await this._geocode(this._city);
      } else {
        await this._ipLocate();
      }
      await this._fetchWeather();
    } catch (e) {
      this._showError(e.message || '天气加载失败，请检查网络');
    }
  },

  /* ─── IP 定位 ─── */
  async _ipLocate() {
    const res  = await fetch('https://ip-api.com/json/?lang=zh-CN&fields=status,city,lat,lon');
    const data = await res.json();
    if (data.status !== 'success') throw new Error('IP 定位失败');
    this._lat  = data.lat;
    this._lon  = data.lon;
    document.getElementById('wd-city-name').textContent = data.city || '当前位置';
  },

  /* ─── 城市名 → 经纬度 ─── */
  async _geocode(city) {
    const url  = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
    const res  = await fetch(url);
    const data = await res.json();
    const r    = data.results?.[0];
    if (!r) throw new Error(`找不到城市：${city}`);
    this._lat  = r.latitude;
    this._lon  = r.longitude;
    document.getElementById('wd-city-name').textContent = r.name || city;
  },

  /* ─── 获取天气 ─── */
  async _fetchWeather() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${this._lat}&longitude=${this._lon}`
      + `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min`
      + `&timezone=auto&forecast_days=5`;
    const res  = await fetch(url);
    const data = await res.json();
    this._render(data);
  },

  /* ─── 渲染 ─── */
  _render(data) {
    const c = data.current;
    const d = data.daily;

    const code = c.weather_code;
    document.getElementById('wd-temp').textContent     = Math.round(c.temperature_2m) + '°C';
    document.getElementById('wd-icon').textContent     = this.ICONS[code] || '🌤';
    document.getElementById('wd-feel').textContent     = `🌡 体感：${Math.round(c.apparent_temperature)}°C`;
    document.getElementById('wd-humidity').textContent = `💧 湿度：${c.relative_humidity_2m}%`;
    document.getElementById('wd-wind').textContent     = `🌬 风速：${c.wind_speed_10m} km/h`;
    document.getElementById('wd-desc').textContent     = `${this.ICONS[code] || ''} ${this.DESCS[code] || ''}`;

    // 未来5天
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

/* 打开天气弹窗时自动加载 */
document.addEventListener('DOMContentLoaded', () => {
  const ov = document.getElementById('weather-overlay');
  if (!ov) return;
  new MutationObserver(() => {
    if (ov.classList.contains('open')) Weather.open();
  }).observe(ov, { attributes: true, attributeFilter: ['class'] });
});
