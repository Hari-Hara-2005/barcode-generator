import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';

interface DocumentPropertiesModalProps {
  printerName: string;
  onClose: () => void;
}

export const DocumentPropertiesModal: React.FC<DocumentPropertiesModalProps> = ({
  printerName,
  onClose,
}) => {
  const [copies, setCopies] = useState('1');
  const [paperSource, setPaperSource] = useState('Default Roll Feeder');
  const [colorHandling, setColorHandling] = useState('Monochrome (Black & White)');

  const selectClass =
    'h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition cursor-pointer text-slate-800';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[1200] p-4 animate-in fade-in duration-150 select-none">
      <div className="w-[480px] max-w-[95vw] bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Document Properties
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {printerName}
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
        <div className="p-6 space-y-4 text-sm">
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Stock & Color Output
            </span>

            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-medium text-sm">Default Copies</label>
              <input
                type="number"
                min="1"
                max="9999"
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
                className="w-24 h-9 px-2.5 border border-slate-200 rounded-lg text-sm font-mono text-right outline-none text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-medium text-sm">Paper Feeder</label>
              <select
                className={`${selectClass} w-52`}
                value={paperSource}
                onChange={(e) => setPaperSource(e.target.value)}
              >
                <option value="Default Roll Feeder">Default Roll Feeder</option>
                <option value="Manual Feed">Manual Feed</option>
                <option value="Tractor Feed">Tractor Feed</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-medium text-sm">Dithering Mode</label>
              <select
                className={`${selectClass} w-52`}
                value={colorHandling}
                onChange={(e) => setColorHandling(e.target.value)}
              >
                <option value="Monochrome (Black & White)">Monochrome (Black & White)</option>
                <option value="Grayscale (Dithered)">Grayscale (Dithered)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-500/25 transition cursor-pointer"
            onClick={onClose}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
