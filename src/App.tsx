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

        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          <h3 className="font-semibold mb-2">转换说明：</h3>
          <ul className="list-disc list-inside space-y-1 opacity-90">
            <li>自动将 <code className="bg-blue-100 px-1 rounded">{`{ 注释 }`}</code> 转换为 <code className="bg-blue-100 px-1 rounded">{`// 注释`}</code>。</li>
            <li>自动将 <code className="bg-blue-100 px-1 rounded">HV()</code> 转换为 <code className="bg-blue-100 px-1 rounded">HHV()</code>，<code className="bg-blue-100 px-1 rounded">LV()</code> 转换为 <code className="bg-blue-100 px-1 rounded">LLV()</code>。</li>
            <li>自动将 <code className="bg-blue-100 px-1 rounded">IFELSE()</code> 转换为 <code className="bg-blue-100 px-1 rounded">IF()</code>。</li>
            <li>自动将 <code className="bg-blue-100 px-1 rounded">VALUEWHEN(条件, 数据)</code> 转换为同花顺支持的 <code className="bg-blue-100 px-1 rounded">REF(数据, BARSLAST(条件))</code> 语法。</li>
            <li>自动将 <code className="bg-blue-100 px-1 rounded">CROSSUP()</code> 转换为 <code className="bg-blue-100 px-1 rounded">CROSS()</code>，<code className="bg-blue-100 px-1 rounded">CROSSDOWN(A,B)</code> 转换为 <code className="bg-blue-100 px-1 rounded">CROSS(B,A)</code>。</li>
            <li>自动将 <code className="bg-blue-100 px-1 rounded">GETPRICE('YCLOSE')</code> 等获取盘口数据的函数转换为同花顺的 <code className="bg-blue-100 px-1 rounded">DYNAINFO()</code> 函数（如 <code className="bg-blue-100 px-1 rounded">DYNAINFO(3)</code> 代表昨收）。</li>
            <li>自动将 <code className="bg-blue-100 px-1 rounded">DRAWCOLORLINE</code> 转换为同花顺支持的 <code className="bg-blue-100 px-1 rounded">IF(..., DRAWNULL)</code> 分段画线语法。</li>
            <li>自动将 <code className="bg-blue-100 px-1 rounded">DRAWCOLORKLINE</code> 转换为同花顺支持的 <code className="bg-blue-100 px-1 rounded">STICKLINE</code> 语法。</li>
            <li>自动将 <code className="bg-blue-100 px-1 rounded">KTEXT</code> 转换为同花顺的 <code className="bg-blue-100 px-1 rounded">DRAWTEXT</code> 语法。</li>
            <li><strong>智能转换（DRAWICON）：</strong> 自动将文华的图标编号映射为同花顺编号（如文华 1号笑脸 自动转为同花顺 7号笑脸），并在代码后添加注释提示。</li>
            <li><strong>智能转换（STICKLINE）：</strong> 自动放大 <code className="bg-blue-100 px-1 rounded">STICKLINE</code> 的宽度参数（如 3 放大为 6，5 放大为 8），以解决同花顺中柱子过细的问题。</li>
            <li><strong>智能转换（DRAWTEXT）：</strong> 自动去除多余的偏移量参数，并在代码后添加注释，提示如何微调重叠文字的位置。</li>
            <li>自动去除 <code className="bg-blue-100 px-1 rounded">DRAWNUMBER</code> 中多余的精度参数，并去除 <code className="bg-blue-100 px-1 rounded">FONTSIZE</code>, <code className="bg-blue-100 px-1 rounded">ALIGN</code> 等同花顺不支持的后缀修饰符。</li>
            <li>自动将 <code className="bg-blue-100 px-1 rounded">NULL</code> 常量转换为 <code className="bg-blue-100 px-1 rounded">DRAWNULL</code>。</li>
            <li>自动注释掉同花顺不支持的声音函数 <code className="bg-blue-100 px-1 rounded">COND, SOUND('A');</code> 和画斜线函数 <code className="bg-blue-100 px-1 rounded">DRAWSL</code> 以防止编译报错。</li>
            <li>自动注释掉同花顺不支持的 <code className="bg-blue-100 px-1 rounded">AUTOFILTER;</code> 指令。</li>
            <li>自动转换逻辑运算符：<code className="bg-blue-100 px-1 rounded">&amp;&amp;</code> 转换为 <code className="bg-blue-100 px-1 rounded">AND</code>，<code className="bg-blue-100 px-1 rounded">||</code> 转换为 <code className="bg-blue-100 px-1 rounded">OR</code>，<code className="bg-blue-100 px-1 rounded">!=</code> 转换为 <code className="bg-blue-100 px-1 rounded">&lt;&gt;</code>。</li>
            <li>自动转换颜色常量，如 <code className="bg-blue-100 px-1 rounded">COLORRED</code> 转换为 <code className="bg-blue-100 px-1 rounded">colorred</code>。</li>
            <li><strong>注意：</strong> 转换工具可以处理大部分常见语法差异，但某些复杂的自定义函数或特定画线函数可能需要手动微调。请在同花顺中测试编译结果。</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
