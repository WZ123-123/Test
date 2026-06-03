/* ============================================================
   calculator.js — 全功能计算器
   ============================================================ */

const Calc = {
  expr: '',      // 当前表达式字符串
  result: '',    // 上次结果
  justCalc: false,

  init() {
    this.expr = '';
    this.result = '';
    this.justCalc = false;
    this.updateDisplay('0', '');
  },

  updateDisplay(main, sub) {
    const m = document.getElementById('calc-main');
    const s = document.getElementById('calc-sub');
    if (m) m.textContent = main || '0';
    if (s) s.textContent = sub  || '';
  },

  press(val) {
    const digits   = '0123456789.';
    const ops      = '+-×÷%';

    // 数字/小数点
    if (digits.includes(val)) {
      if (this.justCalc) { this.expr = ''; this.justCalc = false; }
      // 防止一段里多个小数点
      const parts = this.expr.split(/[+\-×÷]/);
      const last  = parts[parts.length-1];
      if (val==='.' && last.includes('.')) return;
      this.expr += val;
      this.updateDisplay(this.expr, '');
      return;
    }

    // 运算符
    if (ops.includes(val)) {
      this.justCalc = false;
      if (this.expr==='' && val!=='-') return;
      // 替换末尾运算符
      if (this.expr && ops.includes(this.expr.slice(-1))) {
        this.expr = this.expr.slice(0,-1);
      }
      this.expr += val;
      this.updateDisplay(this.expr, '');
      return;
    }

    // 特殊
    switch(val) {
      case 'AC':
        this.expr=''; this.result=''; this.justCalc=false;
        this.updateDisplay('0',''); break;

      case '⌫':
        if (this.justCalc) { this.expr=''; this.justCalc=false; }
        this.expr = this.expr.slice(0,-1);
        this.updateDisplay(this.expr||'0',''); break;

      case '=':
        if (!this.expr) return;
        try {
          const raw = this.expr.replace(/×/g,'*').replace(/÷/g,'/');
          // eslint-disable-next-line no-new-func
          let res = Function('"use strict";return ('+raw+')')();
          if (!isFinite(res)) { this.updateDisplay('错误', this.expr); this.expr=''; return; }
          // 保留最多10位有效数字
          res = parseFloat(res.toPrecision(12));
          this.updateDisplay(String(res), this.expr+'=');
          this.result = String(res);
          this.expr   = String(res);
          this.justCalc = true;
        } catch(e) {
          this.updateDisplay('错误', this.expr); this.expr='';
        }
        break;

      case '±':
        if (!this.expr) return;
        if (this.expr.startsWith('-')) this.expr=this.expr.slice(1);
        else this.expr='-'+this.expr;
        this.updateDisplay(this.expr,''); break;

      case '√':
        try {
          const n=parseFloat(Function('"use strict";return ('+this.expr.replace(/×/g,'*').replace(/÷/g,'/')+')')());
          const r=Math.sqrt(n);
          this.updateDisplay(String(parseFloat(r.toPrecision(12))), '√('+this.expr+')');
          this.expr=String(parseFloat(r.toPrecision(12)));
          this.justCalc=true;
        } catch(e){ this.updateDisplay('错误',''); }
        break;

      case 'x²':
        try {
          const n=parseFloat(Function('"use strict";return ('+this.expr.replace(/×/g,'*').replace(/÷/g,'/')+')')());
          const r=n*n;
          this.updateDisplay(String(parseFloat(r.toPrecision(12))), '('+this.expr+')²');
          this.expr=String(parseFloat(r.toPrecision(12)));
          this.justCalc=true;
        } catch(e){ this.updateDisplay('错误',''); }
        break;

      case '1/x':
        try {
          const n=parseFloat(Function('"use strict";return ('+this.expr.replace(/×/g,'*').replace(/÷/g,'/')+')')());
          if (n===0){ this.updateDisplay('错误','除数不能为0'); return; }
          const r=1/n;
          this.updateDisplay(String(parseFloat(r.toPrecision(12))), '1/('+this.expr+')');
          this.expr=String(parseFloat(r.toPrecision(12)));
          this.justCalc=true;
        } catch(e){ this.updateDisplay('错误',''); }
        break;

      case 'sin': case 'cos': case 'tan': case 'log': case 'ln':
        try {
          const n=parseFloat(Function('"use strict";return ('+this.expr.replace(/×/g,'*').replace(/÷/g,'/')+')')());
          let r;
          if (val==='sin') r=Math.sin(n*Math.PI/180);
          else if (val==='cos') r=Math.cos(n*Math.PI/180);
          else if (val==='tan') r=Math.tan(n*Math.PI/180);
          else if (val==='log') r=Math.log10(n);
          else r=Math.log(n);
          this.updateDisplay(String(parseFloat(r.toPrecision(12))), val+'('+this.expr+')');
          this.expr=String(parseFloat(r.toPrecision(12)));
          this.justCalc=true;
        } catch(e){ this.updateDisplay('错误',''); }
        break;

      case 'π':
        if (this.justCalc) this.expr='';
        this.expr += String(Math.PI);
        this.justCalc=false;
        this.updateDisplay(this.expr,''); break;
    }
  },
};

/* 键盘支持 */
document.addEventListener('keydown', e => {
  if (!document.getElementById('calc-overlay')?.classList.contains('open')) return;
  const map = {
    '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
    '.':'.', '+':'+', '-':'-', '*':'×', '/':'÷', '%':'%',
    'Enter':'=', '=':'=', 'Backspace':'⌫', 'Escape':'AC',
  };
  if (map[e.key]) { e.preventDefault(); Calc.press(map[e.key]); }
});
