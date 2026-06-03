/* ============================================================
   data.js — 常量、图标数据、导航网站数据
   ============================================================ */

/* --- 网格常量 --- */
const CELL = 88;   // 单格px
const GAP  = 16;   // 间距px
const ROWS = 2;    // 固定行数

/* --- 默认壁纸（放在 images/ 下，留空则用CSS渐变） --- */
const DEFAULT_BG_IMAGE = '1.jpg'; // 默认使用 1.jpg

/* --- 预设渐变壁纸 --- */
const BG_PRESETS = {
  default: null,
  sunset:  'linear-gradient(135deg,#f093fb 0%,#f5576c 50%,#fda085 100%)',
  forest:  'linear-gradient(135deg,#43e97b 0%,#38f9d7 50%,#4facfe 100%)',
  night:   'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',
  aurora:  'linear-gradient(135deg,#43cea2 0%,#185a9d 100%)',
};

/* --- 图标背景色表 --- */
const BG_STYLES = {
  'bg-nav':      'linear-gradient(145deg,#e8714a,#c94d22)',
  'bg-bili':     'linear-gradient(145deg,#fb7299,#cc4470)',
  'bg-tiktok':   '#111',
  'bg-xhs':      'linear-gradient(145deg,#ff2442,#c8001e)',
  'bg-x':        '#111',
  'bg-feishu':   'linear-gradient(145deg,#4facfe,#006fd6)',
  'bg-chatgpt':  'linear-gradient(145deg,#74aa9c,#1f7060)',
  'bg-yt':       'linear-gradient(145deg,#f00,#b50000)',
  'bg-douban':   'linear-gradient(145deg,#007722,#004a14)',
  'bg-weather':  'linear-gradient(145deg,#64a0dc,#3c78be)',
  'bg-note':     'linear-gradient(145deg,#4cbb7f,#2e8b57)',
  'bg-draw':     'linear-gradient(145deg,#4facfe,#1a7fd4)',
  'bg-ai':       'linear-gradient(145deg,#f07130,#e05518)',
  'bg-settings': 'linear-gradient(145deg,#8e9eab,#616f7a)',
  'bg-calc':     'linear-gradient(145deg,#5b86e5,#36d1dc)',
  'bg-hot':      'rgba(255,255,255,0.22)',
};

function getBgStyle(bgClass, customBg) {
  if (customBg) return customBg.startsWith('linear') || customBg.startsWith('radial')
    ? `background-image:${customBg}` : `background:${customBg}`;
  return `background:${BG_STYLES[bgClass] || '#888'}`;
}

/* --- 默认桌面布局（参照原版） ---
   size: '1x1'|'2x1'|'2x2'
   col/row: 0-based grid position
*/
const DEFAULT_PAGES = [
  [
    { id:'weather',  type:'widget', size:'2x2', label:'天气',    bgClass:'bg-weather', col:0,  row:0, action:'weather'  },
    { id:'hotspot',  type:'widget', size:'2x2', label:'热点',    bgClass:'bg-hot',     col:2,  row:0, action:'hotspot'  },
    { id:'note',     type:'widget', size:'2x1', label:'记事本',  bgClass:'bg-note',    col:4,  row:0, action:'note',    emoji:'📝' },
    { id:'draw',     type:'widget', size:'2x1', label:'画板',    bgClass:'bg-draw',    col:4,  row:1, action:'draw',    emoji:'🎨' },
    { id:'nav',      type:'icon',   size:'1x1', label:'网址导航',bgClass:'bg-nav',     col:6,  row:0, action:'nav',     emoji:'🧭' },
    { id:'tiktok',   type:'icon',   size:'1x1', label:'抖音',    bgClass:'bg-tiktok',  col:7,  row:0, url:'https://douyin.com',        emoji:'🎵' },
    { id:'bili',     type:'icon',   size:'1x1', label:'哔哩哔哩',bgClass:'bg-bili',    col:6,  row:1, url:'https://bilibili.com',      emoji:'📺' },
    { id:'xhs',      type:'icon',   size:'1x1', label:'小红书',  bgClass:'bg-xhs',     col:7,  row:1, url:'https://xiaohongshu.com',   emoji:'📕' },
    { id:'x',        type:'icon',   size:'1x1', label:'X',       bgClass:'bg-x',       col:8,  row:0, url:'https://x.com',             emoji:'𝕏'  },
    { id:'feishu',   type:'icon',   size:'1x1', label:'飞书',    bgClass:'bg-feishu',  col:9,  row:0, url:'https://feishu.cn',         emoji:'🪶' },
    { id:'douban',   type:'icon',   size:'1x1', label:'豆瓣',    bgClass:'bg-douban',  col:8,  row:1, url:'https://douban.com',        emoji:'🎬' },
    { id:'chatgpt',  type:'icon',   size:'1x1', label:'ChatGPT', bgClass:'bg-chatgpt', col:9,  row:1, url:'https://chatgpt.com',       emoji:'✦'  },
    { id:'ai',       type:'widget', size:'2x2', label:'开启对话',bgClass:'bg-ai',      col:10, row:0, action:'ai'       },
    { id:'settings', type:'icon',   size:'1x1', label:'设置',    bgClass:'bg-settings',col:12, row:0, action:'settings',emoji:'⚙️'  },
    { id:'calc',     type:'icon',   size:'1x1', label:'计算器',  bgClass:'bg-calc',    col:12, row:1, action:'calc',    emoji:'🧮'  },
    { id:'links-nav', type:'icon', size:'1x1', label:'快捷导航', bgClass:'bg-nav',      col:13, row:0, action:'links-nav', emoji:'🔗' },
    { id:'ai-search', type:'icon', size:'1x1', label:'AI检索',   bgClass:'bg-ai',       col:13, row:1, action:'ai-search', emoji:'✨' },
  ]
];

/* --- 导航网站数据 --- */
const NAV_DATA = {
  cn: {
    '日常': [
      { name:'哔哩哔哩', color:'linear-gradient(145deg,#fb7299,#cc4470)', letter:'B',   url:'https://bilibili.com'           },
      { name:'知乎',     color:'linear-gradient(145deg,#0066cc,#004499)', letter:'知',  url:'https://zhihu.com'              },
      { name:'微博',     color:'linear-gradient(145deg,#e6162d,#b8001e)', letter:'微',  url:'https://weibo.com'              },
      { name:'36氪',    color:'linear-gradient(145deg,#e8714a,#c94d22)', letter:'36K', url:'https://36kr.com'               },
      { name:'豆瓣',     color:'linear-gradient(145deg,#007722,#004a14)', letter:'豆',  url:'https://douban.com'             },
      { name:'虎嗅',     color:'linear-gradient(145deg,#ff6600,#cc4400)', letter:'虎',  url:'https://huxiu.com'              },
      { name:'澎湃',     color:'linear-gradient(145deg,#b22222,#8b0000)', letter:'澎',  url:'https://thepaper.cn'            },
      { name:'少数派',   color:'linear-gradient(145deg,#d63031,#a00)',    letter:'派',  url:'https://sspai.com'              },
    ],
    '人工智能': [
      { name:'DeepSeek', color:'linear-gradient(145deg,#4285f4,#1a5cbf)', letter:'DS',  url:'https://deepseek.com'           },
      { name:'文心一言', color:'linear-gradient(145deg,#2468f2,#1040c0)', letter:'文心',url:'https://yiyan.baidu.com'        },
      { name:'通义千问', color:'linear-gradient(145deg,#6c5ce7,#4a3ccc)', letter:'通义',url:'https://qianwen.aliyun.com'     },
      { name:'Kimi',     color:'#111',                                    letter:'Ki',  url:'https://kimi.moonshot.cn'       },
      { name:'智谱AI',   color:'linear-gradient(145deg,#1890ff,#0060cc)', letter:'智谱',url:'https://chatglm.cn'             },
    ],
    '在线工具': [
      { name:'蓝湖',     color:'linear-gradient(145deg,#1677ff,#0050cc)', letter:'蓝',  url:'https://lanhuapp.com'           },
      { name:'即时设计', color:'linear-gradient(145deg,#ff7262,#cc4433)', letter:'即',  url:'https://js.design'              },
      { name:'TinyPNG',  color:'linear-gradient(145deg,#81c14b,#5a9030)', letter:'Ti',  url:'https://tinypng.com'            },
      { name:'石墨文档', color:'linear-gradient(145deg,#ff6b35,#cc4411)', letter:'石',  url:'https://shimo.im'               },
      { name:'语雀',     color:'linear-gradient(145deg,#00b96b,#008844)', letter:'语',  url:'https://yuque.com'              },
    ],
    '资源素材': [
      { name:'花瓣网',   color:'linear-gradient(145deg,#e2405f,#b01030)', letter:'花',  url:'https://huaban.com'             },
      { name:'Iconfont', color:'linear-gradient(145deg,#e95d22,#c03800)', letter:'IC',  url:'https://iconfont.cn'            },
      { name:'摄图网',   color:'linear-gradient(145deg,#2b8cff,#0055cc)', letter:'摄',  url:'https://699pic.com'             },
    ],
    '创作发布': [
      { name:'公众号',   color:'linear-gradient(145deg,#07c160,#059944)', letter:'公众',url:'https://mp.weixin.qq.com'       },
      { name:'小红书',   color:'linear-gradient(145deg,#ff2442,#c8001e)', letter:'红',  url:'https://creator.xiaohongshu.com'},
      { name:'抖音创作', color:'#111',                                    letter:'抖',  url:'https://creator.douyin.com'     },
      { name:'B站创作',  color:'linear-gradient(145deg,#fb7299,#cc4470)', letter:'B创', url:'https://member.bilibili.com'    },
    ],
  },
  global: {
    '日常': [
      { name:'YouTube',  color:'linear-gradient(145deg,#f00,#b50000)',    letter:'YT',  url:'https://youtube.com'            },
      { name:'X',        color:'#111',                                    letter:'𝕏',   url:'https://x.com'                  },
      { name:'Reddit',   color:'linear-gradient(145deg,#ff4500,#cc2200)', letter:'Re',  url:'https://reddit.com'             },
      { name:'GitHub',   color:'#1a1a1a',                                 letter:'GH',  url:'https://github.com'             },
    ],
    '人工智能': [
      { name:'ChatGPT',  color:'linear-gradient(145deg,#74aa9c,#1f7060)', letter:'GPT', url:'https://chatgpt.com'            },
      { name:'Claude',   color:'linear-gradient(145deg,#c96442,#a03820)', letter:'Cl',  url:'https://claude.ai'              },
      { name:'Gemini',   color:'linear-gradient(145deg,#4285f4,#1a5cbf)', letter:'Ge',  url:'https://gemini.google.com'      },
      { name:'Perplexity',color:'linear-gradient(145deg,#20b2aa,#107a72)',letter:'Px',  url:'https://perplexity.ai'          },
    ],
    '在线工具': [
      { name:'Figma',    color:'linear-gradient(145deg,#f24e1e,#c02800)', letter:'Fi',  url:'https://figma.com'              },
      { name:'Excalidraw',color:'linear-gradient(145deg,#6965db,#4440b0)',letter:'Ex',  url:'https://excalidraw.com'         },
    ],
    '资源素材': [
      { name:'Unsplash', color:'#111',                                    letter:'Un',  url:'https://unsplash.com'           },
      { name:'Dribbble', color:'linear-gradient(145deg,#ea4c89,#c02060)', letter:'Dr',  url:'https://dribbble.com'           },
    ],
    '创作发布': [
      { name:'Medium',   color:'#111',                                    letter:'Me',  url:'https://medium.com'             },
      { name:'Substack', color:'linear-gradient(145deg,#ff6719,#cc3300)', letter:'Su',  url:'https://substack.com'           },
    ],
  }
};