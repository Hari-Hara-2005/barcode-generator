import React, { useState } from 'react';
import { BarcodeFormat } from '@/types/barcode-agentwarebot';
import { Layers, X, Sparkles } from 'lucide-react';

interface BatchModalProps {
  onGenerateBatch: (barcodes: { format: BarcodeFormat; value: string }[]) => void;
  onClose: () => void;
}

export const BatchModal: React.FC<BatchModalProps> = ({
  onGenerateBatch,
  onClose,
}) => {
  const [prefix, setPrefix] = useState('SKU-');
  const [startNum, setStartNum] = useState(1001);
  const [count, setCount] = useState(16);
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');

  const handleGenerate = () => {
    const list: { format: BarcodeFormat; value: string }[] = [];
    for (let i = 0; i < count; i++) {
      const num = startNum + i * step;
      list.push({
        format,
        value: `${prefix}${num}`,
      });
    }
    onGenerateBatch(list);
    onClose();
  };

  const inputClass =
    'h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition text-slate-800';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[1200] p-4 animate-in fade-in duration-150 select-none">
      <div className="w-[520px] max-w-[95vw] bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Batch Barcode Sequence
              </h2>
              <p className="text-xs text-slate-500">
                Generate sequential barcodes in bulk for production
              </p>
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer font-bold text-sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sequence Parameters
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-medium text-sm">Barcode Symbology</label>
                <select
                  className={`${inputClass} w-48 cursor-pointer`}
                  value={format}
                  onChange={(e) => setFormat(e.target.value as BarcodeFormat)}
                >
                  <option value="CODE128">Code 128 (Standard)</option>
                  <option value="CODE39">Code 39</option>
                  <option value="EAN13">EAN-13 Retail</option>
                  <option value="QR">2D QR Code</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-medium text-sm">Prefix / Code Text</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className={`${inputClass} w-48 font-mono`}
                  placeholder="e.g. SKU-"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-medium text-sm">Starting Number</label>
                <input
                  type="number"
                  value={startNum}
                  onChange={(e) => setStartNum(parseInt(e.target.value) || 1)}
                  className={`${inputClass} w-32 text-right font-mono font-bold`}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-medium text-sm">Quantity to Generate</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className={`${inputClass} w-32 text-right font-mono font-bold`}
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between text-sm text-purple-900">
            <span className="font-medium">Sample First Item:</span>
            <strong className="font-mono text-base font-bold text-purple-700">{prefix}{startNum}</strong>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-sm shadow-purple-500/25 transition active:scale-95 flex items-center gap-2 cursor-pointer"
            onClick={handleGenerate}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
