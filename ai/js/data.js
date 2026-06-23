/* ============================================================
   data.js
   ============================================================ */
const CELL = 88;
const GAP  = 16;
const ROWS = 2;

const DEFAULT_BG_IMAGE = '1.jpg';

const BG_PRESETS = {
  default: null,
  sunset:  'linear-gradient(135deg,#f093fb 0%,#f5576c 50%,#fda085 100%)',
  forest:  'linear-gradient(135deg,#43e97b 0%,#38f9d7 50%,#4facfe 100%)',
  night:   'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',
  aurora:  'linear-gradient(135deg,#43cea2 0%,#185a9d 100%)',
};

const BG_STYLES = {
  'bg-nav':      'linear-gradient(145deg,#e8714a,#c94d22)',
  'bg-weather':  'linear-gradient(145deg,#64a0dc,#3c78be)',
  'bg-note':     'linear-gradient(145deg,#4cbb7f,#2e8b57)',
  'bg-draw':     'linear-gradient(145deg,#4facfe,#1a7fd4)',
  'bg-ai':       'linear-gradient(145deg,#f07130,#e05518)',
  'bg-settings': 'linear-gradient(145deg,#8e9eab,#616f7a)',
  'bg-music':    'linear-gradient(145deg,#a855f7,#7c3aed)',
  'bg-calc':     'linear-gradient(145deg,#5b86e5,#36d1dc)',
  'bg-hot':      'rgba(255,255,255,0.22)',
};

function getBgStyle(bgClass, customBg) {
  if (customBg) return customBg.startsWith('linear') || customBg.startsWith('radial')
    ? `background-image:${customBg}` : `background:${customBg}`;
  return `background:${BG_STYLES[bgClass] || '#888'}`;
}

/*
  PC端布局（从0起）：
  天气(4,0) | 热点(12,0) | 记事本(6,0) 画板(6,1) | 音乐(11,0) | 网址导航(8,0) AI检索(9,0) | 计算器(11,1) 设置(10,0)

  移动端布局（4列竖屏）：
  第1-2行：天气(0,0) 热点(2,0)  各占2x2
  第3行：  记事本(0,2) 画板(2,2) 各占2x1
  第4行：  网址导航(0,3) AI检索(1,3) 音乐(2,3) 设置(3,3)
  第5行：  计算器(0,4)
*/
const _isMobile = innerWidth <= 768;

const DEFAULT_PAGES = [
  _isMobile ? [
    { id:'weather',   type:'widget', size:'2x2', label:'天气',     bgClass:'bg-weather',  col:0, row:0, action:'weather'                   },
    { id:'hotspot',   type:'widget', size:'2x2', label:'今日热点', bgClass:'bg-hot',      col:2, row:0, action:'hotspot'                   },
    { id:'note',      type:'widget', size:'2x1', label:'记事本',   bgClass:'bg-note',     col:0, row:2, action:'note',     emoji:'📝'      },
    { id:'draw',      type:'widget', size:'2x1', label:'画板',     bgClass:'bg-draw',     col:2, row:2, action:'draw',     emoji:'🎨'      },
    { id:'nav',       type:'icon',   size:'1x1', label:'网址导航', bgClass:'bg-nav',      col:0, row:3, action:'nav',      emoji:'🧭'      },
    { id:'ai-search', type:'icon',   size:'1x1', label:'AI 检索',  bgClass:'bg-ai',       col:1, row:3, action:'ai-search',emoji:'✨'      },
    { id:'music',     type:'icon',   size:'1x1', label:'音乐',     bgClass:'bg-music',    col:2, row:3, action:'music',    emoji:'🎵'      },
    { id:'settings',  type:'icon',   size:'1x1', label:'设置',     bgClass:'bg-settings', col:3, row:3, action:'settings', emoji:'⚙️'     },
    { id:'calc',      type:'icon',   size:'1x1', label:'计算器',   bgClass:'bg-calc',     col:0, row:4, action:'calc',     emoji:'🧮'      },
  ] : [
    { id:'weather',   type:'widget', size:'2x2', label:'天气',     bgClass:'bg-weather',  col:4,  row:0, action:'weather'                   },
    { id:'hotspot',   type:'widget', size:'2x2', label:'今日热点', bgClass:'bg-hot',      col:12, row:0, action:'hotspot'                   },
    { id:'note',      type:'widget', size:'2x1', label:'记事本',   bgClass:'bg-note',     col:6,  row:0, action:'note',     emoji:'📝'      },
    { id:'draw',      type:'widget', size:'2x1', label:'画板',     bgClass:'bg-draw',     col:6,  row:1, action:'draw',     emoji:'🎨'      },
    { id:'music',     type:'icon',   size:'1x1', label:'音乐',     bgClass:'bg-music',    col:11, row:0, action:'music',    emoji:'🎵'      },
    { id:'nav',       type:'icon',   size:'1x1', label:'网址导航', bgClass:'bg-nav',      col:8,  row:0, action:'nav',      emoji:'🧭'      },
    { id:'ai-search', type:'icon',   size:'1x1', label:'AI 检索',  bgClass:'bg-ai',       col:9,  row:0, action:'ai-search',emoji:'✨'      },
    { id:'calc',      type:'icon',   size:'1x1', label:'计算器',   bgClass:'bg-calc',     col:11, row:1, action:'calc',     emoji:'🧮'      },
    { id:'settings',  type:'icon',   size:'1x1', label:'设置',     bgClass:'bg-settings', col:10, row:0, action:'settings', emoji:'⚙️'     },
  ]
];

const NAV_DATA = { cn: {}, global: {} };
