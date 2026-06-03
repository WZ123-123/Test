/* ============================================================
   grid-patch.js — 覆盖 handleItemClick，加入新动作
   必须在 grid.js 之后加载
   ============================================================ */

// 覆盖 grid.js 中的 handleItemClick，加入两个新 action：
// 'links-nav'  → 打开 links.json 快捷导航面板
// 'ai-search'  → 打开 AI 智能检索弹窗
// 'ai'         → 占位：目前打开原有 AI 对话弹窗，后续可改为跳转 URL

function handleItemClick(item, pi) {
  if      (item.action === 'nav')        Modal.open('nav-overlay');
  else if (item.action === 'note')       Modal.open('note-overlay');
  else if (item.action === 'draw')       Modal.open('draw-overlay');
  else if (item.action === 'weather')    Modal.open('weather-overlay');
  else if (item.action === 'settings')   Modal.open('settings-overlay');
  else if (item.action === 'calc')       { Modal.open('calc-overlay'); Calc.init(); }
  else if (item.action === 'hotspot')    window.open('https://www.baidu.com/s?wd=今日热点', '_blank');
  else if (item.action === 'links-nav')  Modal.open('links-nav-overlay');
  else if (item.action === 'ai-search')  AISearchModal.open();
  else if (item.action === 'ai') {
    // 后续可改为跳转自定义 URL：window.open('https://your-ai-site.com', '_blank');
    Modal.open('ai-overlay');
  }
  else if (item.type === 'folder')       openFolderModal(item, pi);
  else if (item.url)                     window.open(item.url, '_blank');
}