import React, { useState } from 'react';
import { ArrowRight, Copy, Check, RefreshCw } from 'lucide-react';
import { convertWH6ToiFinD } from './utils/convert';

export default function App() {
  const [wh6Code, setWh6Code] = useState('');
  const [ifindCode, setIfindCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    const result = convertWH6ToiFinD(wh6Code);
    setIfindCode(result);
  };

  const handleCopy = () => {
    if (!ifindCode) return;
    navigator.clipboard.writeText(ifindCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setWh6Code('');
    setIfindCode('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-indigo-600" />
            WH6 到 iFinD 指标转换器
          </h1>
          <p className="text-sm text-slate-500">文华财经 WH6 -&gt; 同花顺 iFinD</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
          
          {/* Left Panel: WH6 Input */}
          <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700">文华财经 WH6 源码</h2>
              <button 
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                清空
              </button>
            </div>
            <textarea
              value={wh6Code}
              onChange={(e) => setWh6Code(e.target.value)}
              placeholder="在此粘贴文华财经 WH6 指标源码..."
              className="flex-1 w-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm min-h-[500px]"
              spellCheck="false"
            />
          </div>

          {/* Middle: Actions */}
          <div className="flex lg:flex-col items-center justify-center gap-4 py-4 lg:py-0">
            <button
              onClick={handleConvert}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center group"
              title="转换"
            >
              <ArrowRight className="w-6 h-6 lg:rotate-0 rotate-90 group-hover:translate-x-1 lg:group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right Panel: iFinD Output */}
          <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700">同花顺 iFinD 源码</h2>
              <button
                onClick={handleCopy}
                disabled={!ifindCode}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                  ifindCode 
                    ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm' 
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <textarea
              value={ifindCode}
              readOnly
              placeholder="转换后的同花顺 iFinD 指标源码将显示在这里..."
              className="flex-1 w-full p-4 resize-none bg-slate-50 focus:outline-none font-mono text-sm min-h-[500px] text-slate-800"
              spellCheck="false"
            />
          </div>

        </div>

        <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <h3 className="font-semibold text-slate-800 text-lg">转换说明与微调指南</h3>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category 1 */}
            <div>
              <h4 className="font-medium text-indigo-600 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                核心语法与函数
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">HV/LV</code> 自动转为 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">HHV/LLV</code>，<code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">IFELSE/IFF</code> 转为 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">IF</code>。</li>
                <li><code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">VALUEWHEN(条件, 数据)</code> 智能转为 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">REF(数据, BARSLAST(条件))</code>。</li>
                <li><code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">CROSSUP/CROSSDOWN</code> 自动修正参数顺序。</li>
                <li><code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">GETPRICE</code> 系列盘口函数转为同花顺 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">DYNAINFO</code>。</li>
                <li>自动转换逻辑符：<code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">&amp;&amp;</code> ➔ <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">AND</code>，<code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">||</code> ➔ <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">OR</code>。</li>
                <li>自动将 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">{`{ 注释 }`}</code> 转换为标准 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">{`// 注释`}</code>。</li>
              </ul>
            </div>

            {/* Category 2 */}
            <div>
              <h4 className="font-medium text-emerald-600 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                绘图与显示智能处理
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><strong>图标映射：</strong> 自动将文华的图标编号映射为同花顺编号（如 1号笑脸 ➔ 7号笑脸）。</li>
                <li><strong>柱体加粗：</strong> 自动放大 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">STICKLINE</code> 宽度，解决同花顺柱子过细问题。</li>
                <li><strong>分段画线：</strong> <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">DRAWCOLORLINE</code> 智能拆分为同花顺支持的 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">IF(..., DRAWNULL)</code> 语法。</li>
                <li>自动去除 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">DRAWNUMBER</code> 多余精度参数，去除不支持的修饰符。</li>
                <li>自动注释掉不支持的声音函数 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">SOUND</code> 和斜线函数 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">DRAWSL</code>。</li>
              </ul>
            </div>

            {/* Category 3 */}
            <div>
              <h4 className="font-medium text-amber-600 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                变量与常量适配
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>自动修复带有 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">%</code> 的非法变量名（如 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">占比%</code> ➔ <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">占比率</code>）。</li>
                <li><code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">OPI</code> 转为 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">OPENVOL</code>，<code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">AVPRICE</code> 转为 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">SETTLE</code>。</li>
                <li><code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">NULL</code> 常量转为 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">DRAWNULL</code>。</li>
                <li>自动转换颜色常量，如 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">COLORRED</code> 转为 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">colorred</code>。</li>
                <li>智能识别 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">RGB()</code>，若作为线条颜色修饰符，自动转为同花顺支持的十六进制颜色（如 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">COLOR3D3D3D</code>），防止图形被压缩成直线。</li>
                <li><code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">UNIT</code> 乘数统一替换为 <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">1</code> 以保持趋势形态。</li>
              </ul>
            </div>

            {/* Category 4 */}
            <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-100">
              <h4 className="font-medium text-rose-600 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                常见手动微调指南
              </h4>
              <ul className="space-y-4 text-sm text-slate-700">
                <li>
                  <strong className="text-rose-700">文字重叠问题（最常见）：</strong>
                  <p className="mt-1.5 text-slate-600 text-xs leading-relaxed">
                    文华使用 <code className="bg-white border border-rose-100 text-rose-600 px-1 rounded">VALIGN0/1/2</code> 来让同一位置的文字上下错开。同花顺不支持该属性，转换器会将其删除并在代码末尾加上 <code className="bg-white border border-rose-100 text-rose-600 px-1 rounded">/* [对齐失效] */</code> 注释。
                    <br/><span className="font-medium text-rose-600 mt-1 inline-block">👉 解决方法：</span>在同花顺源码中搜索该注释，手动将重叠文字的“价格坐标”加减一个数值（如 <code className="bg-white border border-rose-100 text-rose-600 px-1 rounded">价格 + 10</code> 或 <code className="bg-white border border-rose-100 text-rose-600 px-1 rounded">价格 * 1.01</code>）即可错开。
                  </p>
                </li>
                <li>
                  <strong className="text-rose-700">缺失分号报错：</strong>
                  <p className="mt-1.5 text-slate-600 text-xs leading-relaxed">
                    同花顺要求每句代码必须以分号结尾。转换器已尽力自动补全，若仍有报错，请检查报错行末尾是否漏了 <code className="bg-white border border-rose-100 text-rose-600 px-1 rounded">;</code>。
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
