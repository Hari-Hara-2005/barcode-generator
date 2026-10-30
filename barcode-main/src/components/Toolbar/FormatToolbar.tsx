import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';

interface FormatToolbarProps {
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  bold: boolean;
  setBold: (b: boolean) => void;
  italic: boolean;
  setItalic: (i: boolean) => void;
  underline: boolean;
  setUnderline: (u: boolean) => void;
  strike: boolean;
  setStrike: (s: boolean) => void;
  color: string;
  setColor: (c: string) => void;
  bgColor: string;
  setBgColor: (c: string) => void;
  align: 'left' | 'center' | 'right' | 'justify';
  setAlign: (a: 'left' | 'center' | 'right' | 'justify') => void;
  lineWidth: number;
  setLineWidth: (w: number) => void;
}

export const FormatToolbar: React.FC<FormatToolbarProps> = ({
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  bold,
  setBold,
  italic,
  setItalic,
  underline,
  setUnderline,
  strike,
  setStrike,
  color,
  setColor,
  align,
  setAlign,
  lineWidth,
  setLineWidth,
}) => {
  const btnBase =
    'h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95';
  const btnActive = 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/25 shadow-xs font-semibold';
  const divider = 'w-px h-5 bg-slate-200 mx-1 shrink-0';

  return (
    <div className="h-11 px-4 flex items-center gap-2 shrink-0 select-none bg-slate-50/70 border-b border-slate-200/80 text-sm">
      {/* Font Family selector */}
      <select
        className="h-8 w-44 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm font-medium px-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs cursor-pointer"
        value={fontFamily}
        onChange={(e) => setFontFamily(e.target.value)}
      >
        <option value="Inter">Inter (Sans Serif)</option>
        <option value="Printer Sans Serif">Printer Sans Serif</option>
        <option value="Arial">Arial</option>
        <option value="Segoe UI">Segoe UI</option>
        <option value="JetBrains Mono">JetBrains Mono</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Consolas">Consolas</option>
      </select>

      {/* Font Size selector */}
      <select
        className="h-8 w-20 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm font-medium px-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs font-mono cursor-pointer"
        value={fontSize}
        onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
      >
        {[6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((s) => (
          <option key={s} value={s}>
            {s} pt
          </option>
        ))}
      </select>

      <div className={divider} />

      {/* Text Style Group */}
      <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
        <button
          className={`${btnBase} ${bold ? btnActive : ''}`}
          onClick={() => setBold(!bold)}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          className={`${btnBase} ${italic ? btnActive : ''}`}
          onClick={() => setItalic(!italic)}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          className={`${btnBase} ${underline ? btnActive : ''}`}
          onClick={() => setUnderline(!underline)}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <button
          className={`${btnBase} ${strike ? btnActive : ''}`}
          onClick={() => setStrike(!strike)}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      <div className={divider} />

      {/* Alignment Group */}
      <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
        <button
          className={`${btnBase} ${align === 'left' ? btnActive : ''}`}
          onClick={() => setAlign('left')}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          className={`${btnBase} ${align === 'center' ? btnActive : ''}`}
          onClick={() => setAlign('center')}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          className={`${btnBase} ${align === 'right' ? btnActive : ''}`}
          onClick={() => setAlign('right')}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          className={`${btnBase} ${align === 'justify' ? btnActive : ''}`}
          onClick={() => setAlign('justify')}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      <div className={divider} />

      {/* Color Picker Swatch */}
      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Color</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <span
            className="w-5 h-5 rounded-full border border-slate-300 shadow-xs inline-block"
            style={{ backgroundColor: color }}
          />
          <input
            type="color"
            className="sr-only"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <span className="font-mono text-xs font-semibold text-slate-800 uppercase">{color}</span>
        </label>
      </div>

      {/* Line Width */}
      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs ml-auto">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stroke</span>
        <select
          className="bg-transparent text-slate-800 text-sm font-semibold font-mono outline-none cursor-pointer"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseFloat(e.target.value) || 1.0)}
        >
          <option value="0.25">0.25 pt (Hairline)</option>
          <option value="0.5">0.5 pt (Thin)</option>
          <option value="0.75">0.75 pt</option>
          <option value="1.0">1.0 pt (Standard)</option>
          <option value="1.5">1.5 pt</option>
          <option value="2.0">2.0 pt (Medium)</option>
          <option value="3.0">3.0 pt (Thick)</option>
          <option value="4.0">4.0 pt</option>
          <option value="5.0">5.0 pt</option>
        </select>
      </div>
    </div>
  );
};
