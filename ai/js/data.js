/* ============================================================
   data.js
   ============================================================ */

const CELL = 88;
const GAP  = 16;
const ROWS = 2;

const DEFAULT_BG_IMAGE = '3.jpg';

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
  布局（col 从0起，applyLeftPadToLayout 首次加载时 +2）：
  天气(0-1) | 热点(2-3) | 记事本/画板(4-5) | AI对话(6-7) | 网址导航(8,0) AI检索(8,1) | 计算器(9,0) 设置(9,1)
*/
const DEFAULT_PAGES = [
  [
    { id:'weather',   type:'widget', size:'2x2', label:'天气',     bgClass:'bg-weather',  col:0, row:0, action:'weather'                   },
    { id:'hotspot',   type:'widget', size:'2x2', label:'今日热点', bgClass:'bg-hot',      col:2, row:0, action:'hotspot'                   },
    { id:'note',      type:'widget', size:'2x1', label:'记事本',   bgClass:'bg-note',     col:4, row:0, action:'note',     emoji:'📝'      },
    { id:'draw',      type:'widget', size:'2x1', label:'画板',     bgClass:'bg-draw',     col:4, row:1, action:'draw',     emoji:'🎨'      },
    { id:'music',     type:'widget', size:'2x2', label:'音乐',     bgClass:'bg-music',    col:6, row:0, action:'music'                     },
    { id:'nav',       type:'icon',   size:'1x1', label:'网址导航', bgClass:'bg-nav',      col:8, row:0, action:'nav',      emoji:'🧭'      },
    { id:'ai-search', type:'icon',   size:'1x1', label:'AI 检索',  bgClass:'bg-ai',       col:8, row:1, action:'ai-search',emoji:'✨'      },
    { id:'calc',      type:'icon',   size:'1x1', label:'计算器',   bgClass:'bg-calc',     col:9, row:0, action:'calc',     emoji:'🧮'      },
    { id:'settings',  type:'icon',   size:'1x1', label:'设置',     bgClass:'bg-settings', col:9, row:1, action:'settings', emoji:'⚙️'     },
  ]
];

const NAV_DATA = { cn: {}, global: {} };
