import React, { useState, useEffect } from 'react';
import { WizardSettings, ItemShape, PageOrientation } from '@/types/barcode-agentwarebot';
import { LivePreview } from '@/components/Wizard/LivePreview';
import { Sliders, X, Check, ArrowRightLeft, Square, Circle } from 'lucide-react';

interface PageSetupModalProps {
  settings: WizardSettings;
  onUpdateSettings?: (newSettings: Partial<WizardSettings>) => void;
  onSave?: (newSettings: Partial<WizardSettings>) => void;
  onClose: () => void;
}

export const PageSetupModal: React.FC<PageSetupModalProps> = ({
  settings,
  onUpdateSettings,
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'template' | 'shape' | 'page'>('template');

  // Form states copied from active document settings
  const [templateWidthMm, setTemplateWidthMm] = useState<number>(settings.templateWidthMm || 100);
  const [templateHeightMm, setTemplateHeightMm] = useState<number>(settings.templateHeightMm || 50);
  const [manualTemplateSize, setManualTemplateSize] = useState<boolean>(
    settings.manualTemplateSize ?? false
  );

  const [shape, setShape] = useState<ItemShape>(settings.shape || 'roundedRectangle');
  const [cornerRadiusMm, setCornerRadiusMm] = useState<number>(settings.cornerRadiusMm || 3);

  const [horizGapMm, setHorizGapMm] = useState<number>(settings.horizGapMm ?? 0);
  const [vertGapMm, setVertGapMm] = useState<number>(settings.vertGapMm ?? 0);
  const [manualGap, setManualGap] = useState<boolean>(settings.manualGap ?? true);

  const [rows, setRows] = useState<number>(settings.rows || 1);
  const [cols, setCols] = useState<number>(settings.cols || 1);
  const [pageWidthMm, setPageWidthMm] = useState<number>(settings.pageWidthMm || 100);
  const [pageHeightMm, setPageHeightMm] = useState<number>(settings.pageHeightMm || 50);

  // Unused edge material / Margins (Left, Right, Top, Bottom)
  const [hasUnusedMaterial, setHasUnusedMaterial] = useState<boolean>(
    settings.hasUnusedMaterial ?? false
  );
  const [unusedLeftMm, setUnusedLeftMm] = useState<number>(settings.unusedLeftMm ?? 0);
  const [unusedRightMm, setUnusedRightMm] = useState<number>(settings.unusedRightMm ?? 0);
  const [unusedTopMm, setUnusedTopMm] = useState<number>(settings.unusedTopMm ?? 0);
  const [unusedBottomMm, setUnusedBottomMm] = useState<number>(settings.unusedBottomMm ?? 0);

  // Auto-fit page to label dimensions state
  const [autoFitPageToLabels, setAutoFitPageToLabels] = useState<boolean>(
    settings.autoFitPageToLabels ?? (settings.pageSizePreset === 'User Defined Size' ? true : false)
  );

  // Sync state if settings prop changes externally
  useEffect(() => {
    setTemplateWidthMm(settings.templateWidthMm);
    setTemplateHeightMm(settings.templateHeightMm);
    setManualTemplateSize(settings.manualTemplateSize ?? false);
    setShape(settings.shape || 'roundedRectangle');
    setCornerRadiusMm(settings.cornerRadiusMm || 3);
    setHorizGapMm(settings.horizGapMm ?? 0);
    setVertGapMm(settings.vertGapMm ?? 0);
    setManualGap(settings.manualGap ?? true);
    setRows(settings.rows || 1);
    setCols(settings.cols || 1);
    setPageWidthMm(settings.pageWidthMm || 100);
    setPageHeightMm(settings.pageHeightMm || 50);
    setHasUnusedMaterial(settings.hasUnusedMaterial ?? false);
    setUnusedLeftMm(settings.unusedLeftMm ?? 0);
    setUnusedRightMm(settings.unusedRightMm ?? 0);
    setUnusedTopMm(settings.unusedTopMm ?? 0);
    setUnusedBottomMm(settings.unusedBottomMm ?? 0);
    setAutoFitPageToLabels(settings.autoFitPageToLabels ?? (settings.pageSizePreset === 'User Defined Size' ? true : false));
  }, [settings]);

  const isHorizontal = templateWidthMm >= templateHeightMm;

  const handleSelectHorizontal = () => {
    if (templateWidthMm < templateHeightMm) {
      const w = templateHeightMm;
      const h = templateWidthMm;
      setTemplateWidthMm(w);
      setTemplateHeightMm(h);
      setManualTemplateSize(true);
    }
  };

  const handleSelectVertical = () => {
    if (templateWidthMm >= templateHeightMm) {
      const w = templateHeightMm;
      const h = templateWidthMm;
      setTemplateWidthMm(w);
      setTemplateHeightMm(h);
      setManualTemplateSize(true);
    }
  };

  const handleSwapDimensions = () => {
    const w = templateHeightMm;
    const h = templateWidthMm;
    setTemplateWidthMm(w);
    setTemplateHeightMm(h);
    setManualTemplateSize(true);
  };

  const calcOccupiedDimensions = (
    c = cols,
    r = rows,
    w = templateWidthMm,
    h = templateHeightMm,
    hGap = horizGapMm,
    vGap = vertGapMm,
    leftM = unusedLeftMm,
    rightM = unusedRightMm,
    topM = unusedTopMm,
    bottomM = unusedBottomMm
  ) => {
    const totalHGap = Math.max(0, (c - 1) * hGap);
    const totalVGap = Math.max(0, (r - 1) * vGap);
    const unusedH = leftM + rightM;
    const unusedV = topM + bottomM;

    const neededW = Number((unusedH + (c * w) + totalHGap).toFixed(1));
    const neededH = Number((unusedV + (r * h) + totalVGap).toFixed(1));
    return { neededW, neededH };
  };

  const recalculateAutoTemplateSize = (
    c: number,
    r: number,
    hGap: number,
    vGap: number,
    leftM = unusedLeftMm,
    rightM = unusedRightMm,
    topM = unusedTopMm,
    bottomM = unusedBottomMm,
    pW = pageWidthMm,
    pH = pageHeightMm
  ) => {
    const totalHGap = Math.max(0, (c - 1) * hGap);
    const totalVGap = Math.max(0, (r - 1) * vGap);
    const unusedH = leftM + rightM;
    const unusedV = topM + bottomM;

    const availW = Math.max(5, pW - unusedH - totalHGap);
    const availH = Math.max(5, pH - unusedV - totalVGap);

    const calcW = Number((availW / c).toFixed(1));
    const calcH = Number((availH / r).toFixed(1));

    setTemplateWidthMm(calcW);
    setTemplateHeightMm(calcH);
  };

  const handleFitPageToLabels = (
    c = cols,
    r = rows,
    w = templateWidthMm,
    h = templateHeightMm,
    hGap = horizGapMm,
    vGap = vertGapMm,
    leftM = unusedLeftMm,
    rightM = unusedRightMm,
    topM = unusedTopMm,
    bottomM = unusedBottomMm
  ) => {
    const { neededW, neededH } = calcOccupiedDimensions(c, r, w, h, hGap, vGap, leftM, rightM, topM, bottomM);
    setPageWidthMm(neededW);
    setPageHeightMm(neededH);
    setAutoFitPageToLabels(true);
  };

  const currentPreviewSettings: WizardSettings = {
    ...settings,
    templateWidthMm,
    templateHeightMm,
    manualTemplateSize,
    shape,
    cornerRadiusMm,
    horizGapMm,
    vertGapMm,
    manualGap,
    rows,
    cols,
    pageWidthMm,
    pageHeightMm,
    hasUnusedMaterial: unusedLeftMm > 0 || unusedRightMm > 0 || unusedTopMm > 0 || unusedBottomMm > 0,
    unusedLeftMm,
    unusedRightMm,
    unusedTopMm,
    unusedBottomMm,
    autoFitPageToLabels,
    orientation: isHorizontal ? 'landscape' : 'portrait',
  };

  const handleApply = () => {
    const updates = {
      templateWidthMm,
      templateHeightMm,
      manualTemplateSize,
      shape,
      cornerRadiusMm,
      horizGapMm,
      vertGapMm,
      manualGap,
      rows,
      cols,
      pageWidthMm,
      pageHeightMm,
      hasUnusedMaterial: unusedLeftMm > 0 || unusedRightMm > 0 || unusedTopMm > 0 || unusedBottomMm > 0,
      unusedLeftMm,
      unusedRightMm,
      unusedTopMm,
      unusedBottomMm,
      autoFitPageToLabels,
      orientation: (isHorizontal ? 'landscape' : 'portrait') as PageOrientation,
    };
    onUpdateSettings?.(updates);
    onSave?.(updates);
  };

  const handleOk = () => {
    handleApply();
    onClose();
  };

  const numberInputClass =
    'w-24 h-9 px-2.5 border border-slate-200 bg-slate-50/70 text-sm font-mono font-medium text-right outline-none rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:opacity-40 text-slate-800';

  const { neededW, neededH } = calcOccupiedDimensions();
  const wastedH = Math.max(0, Number((pageHeightMm - neededH).toFixed(1)));
  const wastedW = Math.max(0, Number((pageWidthMm - neededW).toFixed(1)));
  const hasWastedSpace = wastedH > 1 || wastedW > 1;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[1200] p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-[760px] max-w-[95vw] max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Page Setup & Layout</h2>
              <p className="text-xs text-slate-500">
                Adjust label dimensions, sheet rows/cols, margins, and stock shape
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

        {/* Tab Strip */}
        <div className="flex border-b border-slate-200 px-6 pt-2 gap-2 bg-slate-50/40">
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'template'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('template')}
          >
            Template Dimensions & Gap
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'shape'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('shape')}
          >
            Shape & Orientation
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'page'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('page')}
          >
            Page & Sheet Layout
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 flex gap-6 overflow-y-auto max-h-[calc(90vh-160px)] text-sm">
          {/* Left Column: Form Controls */}
          <div className="flex-[1.25] space-y-4">
            {activeTab === 'template' && (
              <>
                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Template Dimensions</span>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                        checked={manualTemplateSize}
                        onChange={(e) => {
                          const isManual = e.target.checked;
                          setManualTemplateSize(isManual);
                          if (!isManual) recalculateAutoTemplateSize(cols, rows, horizGapMm, vertGapMm);
                        }}
                      />
                      <span>Set Manually</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Width (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="5"
                        max="1000"
                        value={templateWidthMm}
                        disabled={!manualTemplateSize}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 5;
                          setTemplateWidthMm(val);
                          if (autoFitPageToLabels) {
                            handleFitPageToLabels(cols, rows, val, templateHeightMm);
                          }
                        }}
                        className={numberInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Height (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="5"
                        max="1000"
                        value={templateHeightMm}
                        disabled={!manualTemplateSize}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 5;
                          setTemplateHeightMm(val);
                          if (autoFitPageToLabels) {
                            handleFitPageToLabels(cols, rows, templateWidthMm, val);
                          }
                        }}
                        className={numberInputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Spacing & Gaps</span>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                        checked={manualGap}
                        onChange={(e) => {
                          const isManual = e.target.checked;
                          setManualGap(isManual);
                          if (!isManual) {
                            setHorizGapMm(0);
                            setVertGapMm(0);
                            if (autoFitPageToLabels) handleFitPageToLabels(cols, rows, templateWidthMm, templateHeightMm, 0, 0);
                          }
                        }}
                      />
                      <span>Manual Gap</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Horizontal Gap</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={horizGapMm}
                        disabled={!manualGap}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setHorizGapMm(val);
                          if (autoFitPageToLabels) handleFitPageToLabels(cols, rows, templateWidthMm, templateHeightMm, val, vertGapMm);
                        }}
                        className={numberInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Vertical Gap</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={vertGapMm}
                        disabled={!manualGap}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setVertGapMm(val);
                          if (autoFitPageToLabels) handleFitPageToLabels(cols, rows, templateWidthMm, templateHeightMm, horizGapMm, val);
                        }}
                        className={numberInputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Space Optimization / Auto-fit Sheet to Labels */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Sheet Space Optimization</span>
                      <span className="text-xs text-slate-500">
                        {hasWastedSpace ? (
                          <span className="text-amber-700 font-medium">
                            ⚠️ Wasted space: {wastedH > 1 ? `${wastedH} mm height` : ''}{wastedH > 1 && wastedW > 1 ? ', ' : ''}{wastedW > 1 ? `${wastedW} mm width` : ''} unused
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">
                            ✓ Sheet matches label grid ({neededW} × {neededH} mm)
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFitPageToLabels()}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap ml-3"
                    >
                      Fit Sheet to Labels ({neededW} × {neededH} mm)
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-2 border-t border-slate-200/60 select-none">
                    <input
                      type="checkbox"
                      checked={autoFitPageToLabels}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAutoFitPageToLabels(checked);
                        if (checked) handleFitPageToLabels();
                      }}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Automatically shrink sheet size to fit labels (zero wasted space)</span>
                  </label>
                </div>

                {/* Quick Swap */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-medium text-slate-700">Current: <strong className="text-slate-900">{isHorizontal ? 'Landscape' : 'Portrait'}</strong></span>
                  <button
                    type="button"
                    onClick={handleSwapDimensions}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    <span>Swap Width & Height</span>
                  </button>
                </div>
              </>
            )}

            {activeTab === 'shape' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3.5">
                  <span className="font-bold text-sm text-slate-800 block">Item Shape</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'roundedRectangle', label: 'Rounded Rectangle', icon: Square },
                      { id: 'rectangle', label: 'Standard Rectangle', icon: Square },
                      { id: 'ellipse', label: 'Ellipse / Oval', icon: Circle },
                      { id: 'circle', label: 'Circle', icon: Circle },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                          shape === s.id
                            ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          setShape(s.id as ItemShape);
                          if (s.id === 'circle') {
                            const side = Math.min(templateWidthMm, templateHeightMm);
                            setTemplateWidthMm(side);
                            setTemplateHeightMm(side);
                          }
                        }}
                      >
                        <s.icon className="w-4.5 h-4.5 text-blue-600" />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>

                  {shape === 'roundedRectangle' && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Corner Radius (mm)</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="25"
                        value={cornerRadiusMm}
                        onChange={(e) => setCornerRadiusMm(parseFloat(e.target.value) || 2)}
                        className={numberInputClass}
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3.5">
                  <span className="font-bold text-sm text-slate-800 block">Orientation</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      className={`p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                        isHorizontal
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={handleSelectHorizontal}
                    >
                      Landscape (Horizontal)
                    </button>
                    <button
                      type="button"
                      className={`p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                        !isHorizontal
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={handleSelectVertical}
                    >
                      Portrait (Vertical)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'page' && (
              <div className="space-y-4">
                {/* Page & Grid Layout */}
                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 block">Page & Grid Layout</span>
                    <button
                      type="button"
                      onClick={() => handleFitPageToLabels()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      ⚡ Fit Sheet to Labels ({neededW} × {neededH} mm)
                    </button>
                  </div>

                  {/* Space Optimization Banner */}
                  {hasWastedSpace ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-900 block">
                          ⚠️ Unused Space: {wastedH > 0.5 ? `${wastedH} mm height` : ''}{wastedH > 0.5 && wastedW > 0.5 ? ', ' : ''}{wastedW > 0.5 ? `${wastedW} mm width` : ''} wasted on sheet
                        </span>
                        <span className="text-xs text-amber-700">
                          Your {rows}×{cols} labels only occupy {neededW} × {neededH} mm.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFitPageToLabels()}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap ml-3"
                      >
                        Trim Sheet Space Now
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-800">
                        ✓ Sheet size perfectly matches label grid ({neededW} × {neededH} mm - Zero wasted space)
                      </span>
                    </div>
                  )}

                  {/* Auto-Fit Toggle */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoFitPageToLabels}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAutoFitPageToLabels(checked);
                        if (checked) {
                          handleFitPageToLabels();
                        }
                      }}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Automatically shrink sheet to fit labels (only take space occupied by labels)</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Rows per Page</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={rows}
                        onChange={(e) => {
                          const newRows = Math.max(1, parseInt(e.target.value) || 1);
                          setRows(newRows);
                          if (!manualTemplateSize) recalculateAutoTemplateSize(cols, newRows, horizGapMm, vertGapMm);
                          if (autoFitPageToLabels) handleFitPageToLabels(cols, newRows);
                        }}
                        className={numberInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Columns per Page</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={cols}
                        onChange={(e) => {
                          const newCols = Math.max(1, parseInt(e.target.value) || 1);
                          setCols(newCols);
                          if (!manualTemplateSize) recalculateAutoTemplateSize(newCols, rows, horizGapMm, vertGapMm);
                          if (autoFitPageToLabels) handleFitPageToLabels(newCols, rows);
                        }}
                        className={numberInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Sheet Width (mm) <span className="text-slate-400 font-normal">({neededW} mm used)</span>
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={pageWidthMm}
                        onChange={(e) => {
                          const newW = parseFloat(e.target.value) || 10;
                          setPageWidthMm(newW);
                          setAutoFitPageToLabels(false);
                          if (!manualTemplateSize) recalculateAutoTemplateSize(cols, rows, horizGapMm, vertGapMm, unusedLeftMm, unusedRightMm, unusedTopMm, unusedBottomMm, newW, pageHeightMm);
                        }}
                        className={numberInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Sheet Height (mm) <span className="text-slate-400 font-normal">({neededH} mm used)</span>
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={pageHeightMm}
                        onChange={(e) => {
                          const newH = parseFloat(e.target.value) || 10;
                          setPageHeightMm(newH);
                          setAutoFitPageToLabels(false);
                          if (!manualTemplateSize) recalculateAutoTemplateSize(cols, rows, horizGapMm, vertGapMm, unusedLeftMm, unusedRightMm, unusedTopMm, unusedBottomMm, pageWidthMm, newH);
                        }}
                        className={numberInputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Sheet Margins & Edges: Left, Right, Top, Bottom */}
                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3.5">
                  <div>
                    <span className="font-bold text-sm text-slate-800 block">Sheet Margins & Edges (mm)</span>
                    <span className="text-xs text-slate-500">Unused border material around the printed sheet</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Left Margin (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={unusedLeftMm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setUnusedLeftMm(val);
                          setHasUnusedMaterial(true);
                          if (!manualTemplateSize) recalculateAutoTemplateSize(cols, rows, horizGapMm, vertGapMm, val, unusedRightMm, unusedTopMm, unusedBottomMm);
                          if (autoFitPageToLabels) handleFitPageToLabels(cols, rows, templateWidthMm, templateHeightMm, horizGapMm, vertGapMm, val);
                        }}
                        className={numberInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Right Margin (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={unusedRightMm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setUnusedRightMm(val);
                          setHasUnusedMaterial(true);
                          if (!manualTemplateSize) recalculateAutoTemplateSize(cols, rows, horizGapMm, vertGapMm, unusedLeftMm, val, unusedTopMm, unusedBottomMm);
                          if (autoFitPageToLabels) handleFitPageToLabels(cols, rows, templateWidthMm, templateHeightMm, horizGapMm, vertGapMm, unusedLeftMm, val);
                        }}
                        className={numberInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Top Margin (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={unusedTopMm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setUnusedTopMm(val);
                          setHasUnusedMaterial(true);
                          if (!manualTemplateSize) recalculateAutoTemplateSize(cols, rows, horizGapMm, vertGapMm, unusedLeftMm, unusedRightMm, val, unusedBottomMm);
                          if (autoFitPageToLabels) handleFitPageToLabels(cols, rows, templateWidthMm, templateHeightMm, horizGapMm, vertGapMm, unusedLeftMm, unusedRightMm, val);
                        }}
                        className={numberInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Bottom Margin (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={unusedBottomMm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setUnusedBottomMm(val);
                          setHasUnusedMaterial(true);
                          if (!manualTemplateSize) recalculateAutoTemplateSize(cols, rows, horizGapMm, vertGapMm, unusedLeftMm, unusedRightMm, unusedTopMm, val);
                          if (autoFitPageToLabels) handleFitPageToLabels(cols, rows, templateWidthMm, templateHeightMm, horizGapMm, vertGapMm, unusedLeftMm, unusedRightMm, unusedTopMm, val);
                        }}
                        className={numberInputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: LivePreview */}
          <div className="flex-[0.95] flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <LivePreview settings={currentPreviewSettings} />
            <div className="mt-3 text-center text-xs font-bold text-slate-700">
              {templateWidthMm} × {templateHeightMm} mm
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Sheet Size: <strong className="text-slate-800">{pageWidthMm.toFixed(1)} × {pageHeightMm.toFixed(1)} mm</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-xs transition cursor-pointer"
              onClick={handleApply}
            >
              Apply
            </button>
            <button
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-sm shadow-blue-500/25 transition active:scale-95 cursor-pointer"
              onClick={handleOk}
            >
              Finish Setup
            </button>
            <button
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-xs transition cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
