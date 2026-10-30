import React, { useState } from 'react';
import { WizardSettings, CanvasObject } from '@/types/barcode-agentwarebot';
import { Printer, ArrowLeft, FormInput, Barcode, Type, Copy } from 'lucide-react';

interface Form1ViewProps {
  settings: WizardSettings;
  objects: CanvasObject[];
  onUpdateFieldValue: (objectId: string, newValue: string) => void;
  onPrint: () => void;
  onReturnToTemplate: () => void;
}

export const Form1View: React.FC<Form1ViewProps> = ({
  settings,
  objects,
  onUpdateFieldValue,
  onPrint,
  onReturnToTemplate,
}) => {
  const [copies, setCopies] = useState(1);

  // Find barcode and text objects
  const barcodeObjs = objects.filter((o) => o.type === 'barcode');
  const textObjs = objects.filter((o) => o.type === 'text');

  return (
    <div className="flex-1 canvas-dot-grid flex items-center justify-center p-8 select-none">
      <div className="w-[600px] bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <FormInput className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Data Entry Form (Form 1)
              </h2>
              <p className="text-xs text-slate-500">
                Live field input for active template ({settings.templateWidthMm} × {settings.templateHeightMm} mm)
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Ready to Print
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            {barcodeObjs.map((b: any, idx) => (
              <div key={b.id} className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Barcode className="w-4.5 h-4.5 text-blue-600" />
                  <span>
                    Barcode #{idx + 1} ({b.format})
                  </span>
                </label>
                <input
                  type="text"
                  value={b.value}
                  onChange={(e) => onUpdateFieldValue(b.id, e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  placeholder="Enter barcode string..."
                />
              </div>
            ))}

            {textObjs.map((t: any, idx) => (
              <div key={t.id} className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Type className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Text Field #{idx + 1}</span>
                </label>
                <input
                  type="text"
                  value={t.text}
                  onChange={(e) => onUpdateFieldValue(t.id, e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  placeholder="Enter label text..."
                />
              </div>
            ))}

            {/* Copies */}
            <div className="pt-3.5 border-t border-slate-200 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Copy className="w-4.5 h-4.5 text-slate-500" />
                <span>Quantity of Copies to Print</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 h-9 px-3 rounded-lg border border-slate-200 text-sm text-right font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
                <span className="text-xs text-slate-500 font-medium">copies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onReturnToTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Visual Designer</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-sm shadow-blue-500/25 transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Form Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
