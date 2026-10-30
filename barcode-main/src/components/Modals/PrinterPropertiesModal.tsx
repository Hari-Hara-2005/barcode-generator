import React, { useState } from 'react';
import { SystemPrinterInfo } from '@/types/barcode-agentwarebot';
import { Printer, X, Check, Sliders } from 'lucide-react';

interface PrinterPropertiesModalProps {
  printerName: string;
  printerInfo?: SystemPrinterInfo;
  onClose: () => void;
}

export const PrinterPropertiesModal: React.FC<PrinterPropertiesModalProps> = ({
  printerName,
  printerInfo,
  onClose,
}) => {
  const [resolution, setResolution] = useState('203 dpi');
  const [printMethod, setPrintMethod] = useState('Thermal Transfer (Ribbon)');
  const [printSpeed, setPrintSpeed] = useState('4.0 ips');
  const [mediaType, setMediaType] = useState('Labels with Gaps');

  const selectClass =
    'h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition cursor-pointer text-slate-800';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[1200] p-4 animate-in fade-in duration-150 select-none">
      <div className="w-[520px] max-w-[95vw] bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Printer Configuration
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
          {/* Connection Status Card */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Device Status
            </span>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Port / Connection</span>
                <span className="font-mono text-slate-800 font-medium">
                  {printerInfo?.port || 'USB / Local Spooler'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Hardware State</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {printerInfo?.status || 'Online / Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Print Settings Card */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Printhead & Media
            </span>

            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-medium text-sm">Head Resolution</label>
              <select
                className={`${selectClass} w-52`}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              >
                <option value="203 dpi">203 dpi (8 dots/mm)</option>
                <option value="300 dpi">300 dpi (12 dots/mm)</option>
                <option value="600 dpi">600 dpi (24 dots/mm)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-medium text-sm">Print Method</label>
              <select
                className={`${selectClass} w-52`}
                value={printMethod}
                onChange={(e) => setPrintMethod(e.target.value)}
              >
                <option value="Thermal Transfer (Ribbon)">Thermal Transfer (Ribbon)</option>
                <option value="Direct Thermal (No Ribbon)">Direct Thermal (No Ribbon)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-medium text-sm">Media Sensor Type</label>
              <select
                className={`${selectClass} w-52`}
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
              >
                <option value="Labels with Gaps">Labels with Gaps (Web Sensing)</option>
                <option value="Continuous Media">Continuous Media</option>
                <option value="Labels with Black Mark">Labels with Black Mark</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-medium text-sm">Print Speed</label>
              <select
                className={`${selectClass} w-52`}
                value={printSpeed}
                onChange={(e) => setPrintSpeed(e.target.value)}
              >
                <option value="2.0 ips">2.0 in/sec (50 mm/sec)</option>
                <option value="4.0 ips">4.0 in/sec (102 mm/sec)</option>
                <option value="6.0 ips">6.0 in/sec (152 mm/sec)</option>
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
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
