import React, { useState, useEffect } from 'react';
import { WizardSettings, SystemPrinterInfo } from '@/types/barcode-agentwarebot';
import { PRINTER_LIST, PREDEFINED_CATEGORIES, PREDEFINED_STOCKS, DEFAULT_WIZARD_SETTINGS } from '@/data/defaults';
import { LivePreview } from './LivePreview';
import { PrinterPropertiesModal } from '../Modals/PrinterPropertiesModal';
import { DocumentPropertiesModal } from '../Modals/DocumentPropertiesModal';
import { Printer, RefreshCw, Sliders, CheckCircle2 } from 'lucide-react';

interface NewDocumentWizardProps {
  onFinish: (settings: WizardSettings) => void;
  onCancel: () => void;
}

export const NewDocumentWizard: React.FC<NewDocumentWizardProps> = ({
  onFinish,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [settings, setSettings] = useState<WizardSettings>({ ...DEFAULT_WIZARD_SETTINGS });

  // Connected PC Printers State
  const [systemPrinters, setSystemPrinters] = useState<SystemPrinterInfo[]>([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState<boolean>(false);

  useEffect(() => {
    fetchPCPrinters();
  }, []);

  const fetchPCPrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      const res = await fetch('/api/printers');
      const data = await res.json();
      if (data.success && Array.isArray(data.systemPrinters)) {
        setSystemPrinters(data.systemPrinters);
        // Automatically select the default PC printer if not set or on default
        if (data.defaultPrinter && (settings.printer === 'Bar Code Printer TT065-50' || !settings.printer)) {
          updateSettings({ printer: data.defaultPrinter });
        }
      }
    } catch (err) {
      console.warn('Could not detect PC printers:', err);
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  // Dialog popups
  const [showPrinterProps, setShowPrinterProps] = useState(false);
  const [showDocProps, setShowDocProps] = useState(false);

  // Active connected PC printer if matching
  const selectedPrinterInfo = systemPrinters.find(
    (p) => p.name.toLowerCase() === settings.printer.toLowerCase()
  );

  // Calculate exact occupied dimensions of the labels on the sheet
  const calcOccupiedDimensions = (s: WizardSettings) => {
    const r = s.itemsPerPageType === 'single' ? 1 : Math.max(1, s.rows);
    const c = s.itemsPerPageType === 'single' ? 1 : Math.max(1, s.cols);
    const left = s.hasUnusedMaterial ? (s.unusedLeftMm || 0) : 0;
    const right = s.hasUnusedMaterial ? (s.unusedRightMm || 0) : 0;
    const top = s.hasUnusedMaterial ? (s.unusedTopMm || 0) : 0;
    const bottom = s.hasUnusedMaterial ? (s.unusedBottomMm || 0) : 0;
    const totalHGap = (c - 1) * (s.horizGapMm || 0);
    const totalVGap = (r - 1) * (s.vertGapMm || 0);

    const neededW = Number((left + (c * (s.templateWidthMm || 10)) + totalHGap + right).toFixed(1));
    const neededH = Number((top + (r * (s.templateHeightMm || 10)) + totalVGap + bottom).toFixed(1));
    return { neededW, neededH, r, c, left, right, top, bottom, totalHGap, totalVGap };
  };

  // Helper to update settings
  const updateSettings = (updates: Partial<WizardSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };

      // Automatic recalculation of template size if manual is off
      if (!next.manualTemplateSize) {
        const rows = next.itemsPerPageType === 'single' ? 1 : Math.max(1, next.rows);
        const cols = next.itemsPerPageType === 'single' ? 1 : Math.max(1, next.cols);

        const left = next.hasUnusedMaterial ? next.unusedLeftMm : 0;
        const right = next.hasUnusedMaterial ? next.unusedRightMm : 0;
        const top = next.hasUnusedMaterial ? next.unusedTopMm : 0;
        const bottom = next.hasUnusedMaterial ? next.unusedBottomMm : 0;

        const totalHorizGap = (cols - 1) * (next.horizGapMm || 0);
        const totalVertGap = (rows - 1) * (next.vertGapMm || 0);

        const availW = Math.max(1, next.pageWidthMm - left - right - totalHorizGap);
        const availH = Math.max(1, next.pageHeightMm - top - bottom - totalVertGap);

        next.templateWidthMm = Number((availW / cols).toFixed(1));
        next.templateHeightMm = Number((availH / rows).toFixed(1));
      } else {
        // If template size is manual, check if we should fit page to labels!
        const isUserDefined = next.pageSizePreset === 'User Defined Size';
        const shouldFit = next.autoFitPageToLabels || (isUserDefined && next.autoFitPageToLabels !== false);
        if (shouldFit) {
          const { neededW, neededH } = calcOccupiedDimensions(next);
          next.pageWidthMm = neededW;
          next.pageHeightMm = neededH;
          next.autoFitPageToLabels = true;
          next.pageSizePreset = 'User Defined Size';
        }
      }

      return next;
    });
  };

  const handleStockSelect = (stockId: string) => {
    const found = PREDEFINED_STOCKS.find((s) => s.id === stockId);
    if (found) {
      updateSettings({
        predefinedStockId: found.id,
        pageWidthMm: found.pageWidth,
        pageHeightMm: found.pageHeight,
        itemsPerPageType: found.rows === 1 && found.cols === 1 ? 'single' : 'multiple',
        rows: found.rows,
        cols: found.cols,
        templateWidthMm: found.itemWidth,
        templateHeightMm: found.itemHeight,
        shape: found.shape,
        hasUnusedMaterial: found.leftMargin > 0 || found.rightMargin > 0,
        unusedLeftMm: found.leftMargin,
        unusedRightMm: found.rightMargin,
        unusedTopMm: found.topMargin,
        unusedBottomMm: found.bottomMargin,
        horizGapMm: found.horizGap,
        vertGapMm: found.vertGap,
      });
    }
  };

  const canGoBack = step > 1;
  const canGoNext = step < 10;

  const handleNext = () => {
    if (step < 10) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = () => {
    onFinish(settings);
  };

  // Header Title & Subtitle based on current step
  const getStepHeader = () => {
    switch (step) {
      case 1:
        return {
          title: 'Printer Selection',
          subtitle: 'Specify the printer to use with this document.',
        };
      case 2:
        return {
          title: 'Stock Selection',
          subtitle:
            'A Stock specifies the size of the page and the size, number, and position of the items on the page. You may select a predefined Stock or specify your own custom settings.',
        };
      case 3:
        return {
          title: 'Items Per Page',
          subtitle: 'Specify the characteristics of your media.',
        };
      case 4:
        return {
          title: 'Side Edges',
          subtitle: 'Specify the characteristics of the side edges of your media.',
        };
      case 5:
        return {
          title: 'Page Size',
          subtitle: 'Specify the dimensions and orientation of the page.',
        };
      case 6:
        return {
          title: 'Printed Item Shape',
          subtitle: 'Specify the shape of the printed items on the page.',
        };
      case 7:
        return {
          title: 'Template Size',
          subtitle: 'Specify the dimensions of the printed items and any gaps between them.',
        };
      case 8:
        return {
          title: 'Printing Order',
          subtitle: 'Specify the order in which items will be printed on the page.',
        };
      case 9:
        return {
          title: 'Template Background',
          subtitle: 'Specify any background color or image to use behind your design.',
        };
      case 10:
        return {
          title: 'Summary',
          subtitle: 'Review your label settings before creating the document.',
        };
      default:
        return { title: 'New Document Wizard', subtitle: '' };
    }
  };

  const header = getStepHeader();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-[800px] max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Wizard Header */}
        <div className="h-16 px-6 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600 font-bold">
              {step}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">{header.title}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                  Step {step} of 10
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-tight mt-0.5">{header.subtitle}</p>
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer text-sm font-bold"
            onClick={onCancel}
            title="Cancel Wizard"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-100 shrink-0">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
            style={{ width: `${(step / 10) * 100}%` }}
          />
        </div>

        {/* Wizard Main Content Area */}
        <div className="flex-1 flex px-6 py-5 overflow-y-auto gap-6 bg-white text-sm">
          {/* ────────────────── Step 1: Printer Selection ────────────────── */}
          {step === 1 && (
            <div className="flex gap-4 flex-1">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Select Output Printer:</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg text-blue-700 font-semibold transition cursor-pointer"
                    onClick={fetchPCPrinters}
                    disabled={isLoadingPrinters}
                    title="Scan PC for installed and connected printers"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrinters ? 'animate-spin' : ''}`} />
                    <span>{isLoadingPrinters ? 'Detecting...' : 'Detect PC Printers'}</span>
                  </button>
                </div>

                <div className="flex-1 border border-slate-200 rounded-xl bg-white overflow-y-auto min-h-[220px] shadow-xs">
                  {/* Group 1: Actual PC Printers Detected from Windows */}
                  <div className="bg-slate-100/70 text-slate-700 text-xs font-bold px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
                    <span>🟢 CONNECTED PC PRINTERS ({systemPrinters.length} DETECTED)</span>
                  </div>
                  {systemPrinters.map((sp) => {
                    const isSelected = settings.printer === sp.name;
                    return (
                      <div
                        key={sp.name}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer border-b border-slate-100 transition ${
                          isSelected ? 'bg-blue-50 text-blue-800 font-semibold border-l-4 border-l-blue-600' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        onClick={() => updateSettings({ printer: sp.name })}
                      >
                        <Printer className="w-4 h-4 shrink-0 text-slate-500" />
                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="truncate">{sp.name}</span>
                            {sp.isDefault && (
                              <span className="bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold px-1.5 py-0.5">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-400 ml-2">
                            {sp.port}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Group 2: Barcode Agentwarebot Thermal & Barcode Label Printer Presets */}
                  <div className="bg-slate-100/70 text-slate-700 text-xs font-bold px-3 py-1.5 border-b border-slate-200 flex items-center justify-between mt-1">
                    <span>🏷️ THERMAL & BARCODE PRINTER PRESETS</span>
                  </div>
                  {PRINTER_LIST.filter((p) => !systemPrinters.some((sp) => sp.name.toLowerCase() === p.toLowerCase())).map((p) => {
                    const isSelected = settings.printer === p;
                    return (
                      <div
                        key={p}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer border-b border-slate-100 transition ${
                          isSelected ? 'bg-blue-50 text-blue-800 font-semibold border-l-4 border-l-blue-600' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        onClick={() => updateSettings({ printer: p })}
                      >
                        <Printer className="w-4 h-4 shrink-0 text-slate-400" />
                        <div className="flex-1 flex items-center justify-between">
                          <span>{p}</span>
                          <span className="text-xs text-slate-400">Thermal Preset</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Printer Connection Status Card */}
                {selectedPrinterInfo && (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 mt-3 text-xs shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Ready: {selectedPrinterInfo.name}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-600 mt-1">
                      <span>Port: <strong>{selectedPrinterInfo.port}</strong></span>
                      <span>Driver: <strong>{selectedPrinterInfo.driver}</strong></span>
                      <span>Status: <strong className="text-emerald-700">{selectedPrinterInfo.status}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-44 flex flex-col gap-2.5 pt-7 shrink-0">
                <button
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-xs transition cursor-pointer text-left flex items-center gap-2"
                  onClick={() => setShowDocProps(true)}
                >
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <span>Document Setup...</span>
                </button>
                <button
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-xs transition cursor-pointer text-left flex items-center gap-2"
                  onClick={() => setShowPrinterProps(true)}
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Printer Setup...</span>
                </button>
              </div>
            </div>
          )}

          {/* ────────────────── Step 2: Stock Selection ────────────────── */}
          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                A Stock specifies the size of the page and the size, number, and position of the items on the page. You may select a predefined Stock or specify your own custom settings.
              </p>

              <div className="flex flex-col gap-3 mb-4">
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="stockType"
                    checked={settings.stockType === 'custom'}
                    onChange={() => updateSettings({ stockType: 'custom' })}
                    className="accent-blue-600 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span>Specify Custom Settings (Recommended)</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="stockType"
                    checked={settings.stockType === 'predefined'}
                    onChange={() => updateSettings({ stockType: 'predefined' })}
                    className="accent-blue-600 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span>Use a Predefined Stock Category</span>
                </label>
              </div>

              {settings.stockType === 'predefined' && (
                <div className="ml-7 mt-1 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-slate-600">Category:</span>
                    <select
                      className="h-9 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none min-w-[180px]"
                      value={settings.predefinedCategory}
                      onChange={(e) => updateSettings({ predefinedCategory: e.target.value })}
                    >
                      {PREDEFINED_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-24 text-sm font-medium text-slate-600 pt-1.5">Stock Name:</span>
                    <div className="flex-1 border border-slate-200 rounded-xl bg-white overflow-y-auto max-h-[160px] shadow-xs">
                      {PREDEFINED_STOCKS.filter(
                        (s) => settings.predefinedCategory === 'Custom' || s.category === settings.predefinedCategory
                      ).map((s) => (
                        <div
                          key={s.id}
                          className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-b border-slate-100 transition ${
                            settings.predefinedStockId === s.id ? 'bg-blue-50 text-blue-800 font-bold border-l-4 border-l-blue-600' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                          onClick={() => handleStockSelect(s.id)}
                        >
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────────────── Step 3: Items Per Page ────────────────── */}
          {step === 3 && (
            <div className="flex-1 flex flex-col">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Most media has only a single item (label, card, tag, etc.) per page of stock. Some media, however, are more complex and have multiple items on a page.
              </p>

              <div className="flex flex-col gap-3 mb-4">
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="itemsPerPageType"
                    checked={settings.itemsPerPageType === 'single'}
                    onChange={() => updateSettings({ itemsPerPageType: 'single', rows: 1, cols: 1 })}
                    className="accent-blue-600 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span>Single item per page</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="itemsPerPageType"
                    checked={settings.itemsPerPageType === 'multiple'}
                    onChange={() => updateSettings({ itemsPerPageType: 'multiple', rows: 4, cols: 4 })}
                    className="accent-blue-600 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span>Multiple columns and/or rows of items per page</span>
                </label>
              </div>

              {settings.itemsPerPageType === 'multiple' && (
                <div className="ml-7 mt-1 flex flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-slate-600">Rows:</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={settings.rows}
                      onChange={(e) => updateSettings({ rows: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-24 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-slate-600">Columns:</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={settings.cols}
                      onChange={(e) => updateSettings({ cols: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-24 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────────────── Step 4: Side Edges ────────────────── */}
          {step === 4 && (
            <>
              <div className="flex-1 flex flex-col min-w-0">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Does your stock have a small amount of unused material between the edge of the item and the edge of the page?
                </p>

                <div className="flex flex-col gap-3 mb-4">
                  <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="hasUnusedMaterial"
                      checked={settings.hasUnusedMaterial}
                      onChange={() => updateSettings({ hasUnusedMaterial: true, unusedLeftMm: 1.3, unusedRightMm: 1.3, unusedTopMm: 0, unusedBottomMm: 0 })}
                      className="accent-blue-600 w-4.5 h-4.5 cursor-pointer"
                    />
                    <span>Yes, it has unused material on the edges (margins)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="hasUnusedMaterial"
                      checked={!settings.hasUnusedMaterial}
                      onChange={() => updateSettings({ hasUnusedMaterial: false, unusedLeftMm: 0, unusedRightMm: 0, unusedTopMm: 0, unusedBottomMm: 0 })}
                      className="accent-blue-600 w-4.5 h-4.5 cursor-pointer"
                    />
                    <span>No, it does not</span>
                  </label>
                </div>

                {settings.hasUnusedMaterial && (
                  <div className="ml-7 mt-1 flex flex-col gap-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Width of Unused Area / Margins (mm)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-sm font-medium text-slate-600">Left:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={settings.unusedLeftMm}
                          onChange={(e) => updateSettings({ unusedLeftMm: parseFloat(e.target.value) || 0 })}
                          className="w-20 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none"
                        />
                        <span className="text-xs text-slate-400">mm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-sm font-medium text-slate-600">Right:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={settings.unusedRightMm}
                          onChange={(e) => updateSettings({ unusedRightMm: parseFloat(e.target.value) || 0 })}
                          className="w-20 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none"
                        />
                        <span className="text-xs text-slate-400">mm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-sm font-medium text-slate-600">Top:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={settings.unusedTopMm}
                          onChange={(e) => updateSettings({ unusedTopMm: parseFloat(e.target.value) || 0 })}
                          className="w-20 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none"
                        />
                        <span className="text-xs text-slate-400">mm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-sm font-medium text-slate-600">Bottom:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={settings.unusedBottomMm}
                          onChange={(e) => updateSettings({ unusedBottomMm: parseFloat(e.target.value) || 0 })}
                          className="w-20 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none"
                        />
                        <span className="text-xs text-slate-400">mm</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <LivePreview settings={settings} />
            </>
          )}

          {/* ────────────────── Step 5: Page Size ────────────────── */}
          {step === 5 && (
            <>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-3 mb-3.5">
                  <span className="w-24 text-sm font-medium text-slate-600">Page Size:</span>
                  <select
                    className="h-9 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none min-w-[180px]"
                    value={settings.pageSizePreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'A4') updateSettings({ pageSizePreset: val, pageWidthMm: 210, pageHeightMm: 297, autoFitPageToLabels: false });
                      else if (val === 'Letter') updateSettings({ pageSizePreset: val, pageWidthMm: 215.9, pageHeightMm: 279.4, autoFitPageToLabels: false });
                      else if (val === '4x6 in') updateSettings({ pageSizePreset: val, pageWidthMm: 101.6, pageHeightMm: 152.4, autoFitPageToLabels: false });
                      else if (val === 'User Defined Size') {
                        const { neededW, neededH } = calcOccupiedDimensions(settings);
                        updateSettings({
                          pageSizePreset: val,
                          pageWidthMm: neededW,
                          pageHeightMm: neededH,
                          autoFitPageToLabels: true,
                        });
                      } else {
                        updateSettings({ pageSizePreset: val });
                      }
                    }}
                  >
                    <option value="User Defined Size">User Defined Size</option>
                    <option value="A4">A4 (210 x 297 mm)</option>
                    <option value="Letter">Letter (8.5 x 11 in)</option>
                    <option value="4x6 in">4 x 6 in (101.6 x 152.4 mm)</option>
                  </select>
                </div>

                {settings.pageSizePreset === 'User Defined Size' && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-blue-700 cursor-pointer mb-3 select-none">
                    <input
                      type="checkbox"
                      checked={settings.autoFitPageToLabels ?? true}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          const { neededW, neededH } = calcOccupiedDimensions(settings);
                          updateSettings({
                            autoFitPageToLabels: true,
                            pageWidthMm: neededW,
                            pageHeightMm: neededH,
                          });
                        } else {
                          updateSettings({ autoFitPageToLabels: false });
                        }
                      }}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Auto-fit page to label dimensions (occupy label area only, zero wasted space)</span>
                  </label>
                )}

                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-slate-600">Width:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    value={settings.pageWidthMm}
                    onChange={(e) => updateSettings({ pageWidthMm: parseFloat(e.target.value) || 10, autoFitPageToLabels: false })}
                    className="w-24 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none"
                  />
                  <span className="text-xs text-slate-400">mm</span>

                  <span className="w-16 text-sm font-medium text-slate-600 ml-4">Height:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    value={settings.pageHeightMm}
                    onChange={(e) => updateSettings({ pageHeightMm: parseFloat(e.target.value) || 10, autoFitPageToLabels: false })}
                    className="w-24 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none"
                  />
                  <span className="text-xs text-slate-400">mm</span>
                </div>

                {/* Auto-Fit Page Size Button in Step 5 */}
                {(() => {
                  const { neededW, neededH } = calcOccupiedDimensions(settings);
                  const isAlreadyFitted = Math.abs(settings.pageWidthMm - neededW) < 0.5 && Math.abs(settings.pageHeightMm - neededH) < 0.5;
                  return (
                    <div className="mt-3.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-blue-900 block">Fit Page to Label Grid:</span>
                        <span className="text-xs text-blue-700">
                          {isAlreadyFitted
                            ? `Page is perfectly fitted to the ${settings.rows}×${settings.cols} labels (${neededW} × ${neededH} mm).`
                            : `Labels occupy ${neededW} × ${neededH} mm. Click to eliminate wasted page space.`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateSettings({
                          pageWidthMm: neededW,
                          pageHeightMm: neededH,
                          pageSizePreset: 'User Defined Size',
                          autoFitPageToLabels: true,
                        })}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap ml-3"
                      >
                        Fit to Labels ({neededW} × {neededH} mm)
                      </button>
                    </div>
                  );
                })()}

                <div className="mt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Orientation</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['portrait', 'landscape', 'portrait180', 'landscape180'] as const).map((orient) => (
                      <label
                        key={orient}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                          settings.orientation === orient
                            ? 'bg-blue-50 border-blue-300 font-semibold text-blue-900 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="orientation"
                          checked={settings.orientation === orient}
                          onChange={() => updateSettings({ orientation: orient })}
                          className="accent-blue-600 w-4 h-4 cursor-pointer"
                        />
                        <span className="capitalize text-sm">
                          {orient === 'portrait180' ? 'Portrait 180°' : orient === 'landscape180' ? 'Landscape 180°' : orient}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <LivePreview settings={settings} />
            </>
          )}

          {/* ────────────────── Step 6: Printed Item Shape ────────────────── */}
          {step === 6 && (
            <>
              <div className="flex-1 flex flex-col min-w-0">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Specify the shape of your items.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  {[
                    { id: 'rectangle', title: 'Rectangle' },
                    { id: 'roundedRectangle', title: 'Rounded Rectangle' },
                    { id: 'ellipse', title: 'Ellipse' },
                    { id: 'circle', title: 'Circle' },
                  ].map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                        settings.shape === s.id
                          ? 'bg-blue-50/70 border-blue-500 text-blue-900 font-semibold ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                      onClick={() => updateSettings({ shape: s.id as any })}
                    >
                      <input
                        type="radio"
                        name="itemShape"
                        checked={settings.shape === s.id}
                        onChange={() => updateSettings({ shape: s.id as any })}
                        className="accent-blue-600 w-4.5 h-4.5 cursor-pointer"
                      />
                      <span className="text-sm font-semibold">{s.title}</span>
                    </div>
                  ))}
                </div>

                {settings.shape === 'roundedRectangle' && (
                  <div className="flex items-center gap-3 mt-4">
                    <span className="w-28 text-sm font-medium text-slate-600">Corner Radius:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="20"
                      value={settings.cornerRadiusMm}
                      onChange={(e) => updateSettings({ cornerRadiusMm: parseFloat(e.target.value) || 2 })}
                      className="w-24 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none"
                    />
                    <span className="text-xs text-slate-400">mm</span>
                  </div>
                )}
              </div>
              <LivePreview settings={settings} />
            </>
          )}

          {/* ────────────────── Step 7: Template Size ────────────────── */}
          {step === 7 && (
            <>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Template Size</div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-24 text-sm font-medium text-slate-600">Width:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={settings.templateWidthMm || ''}
                    disabled={!settings.manualTemplateSize}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateSettings({ templateWidthMm: v === '' ? 0 : parseFloat(v) });
                    }}
                    className="w-24 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none disabled:bg-slate-100"
                  />
                  <span className="text-xs text-slate-400">mm</span>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer ml-3">
                    <input
                      type="checkbox"
                      checked={settings.manualTemplateSize}
                      onChange={(e) => updateSettings({ manualTemplateSize: e.target.checked })}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Set Manually</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="w-24 text-sm font-medium text-slate-600">Height:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={settings.templateHeightMm || ''}
                    disabled={!settings.manualTemplateSize}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateSettings({ templateHeightMm: v === '' ? 0 : parseFloat(v) });
                    }}
                    className="w-24 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none disabled:bg-slate-100"
                  />
                  <span className="text-xs text-slate-400">mm</span>
                </div>

                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 mt-2">Gap / Pitch</div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-24 text-sm font-medium text-slate-600">Horizontal:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={settings.horizGapMm ?? ''}
                    disabled={!settings.manualGap}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateSettings({ horizGapMm: v === '' ? 0 : parseFloat(v) });
                    }}
                    className="w-24 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none disabled:bg-slate-100"
                  />
                  <span className="text-xs text-slate-400">mm</span>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer ml-3">
                    <input
                      type="checkbox"
                      checked={settings.manualGap}
                      onChange={(e) => updateSettings({ manualGap: e.target.checked })}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Set Manually</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-slate-600">Vertical:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={settings.vertGapMm ?? ''}
                    disabled={!settings.manualGap}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateSettings({ vertGapMm: v === '' ? 0 : parseFloat(v) });
                    }}
                    className="w-24 h-9 px-2.5 border border-slate-200 rounded-lg bg-white text-sm text-right font-mono outline-none disabled:bg-slate-100"
                  />
                  <span className="text-xs text-slate-400">mm</span>
                </div>

                {/* Auto-Fit Page Size / Space Optimization in Step 7 */}
                {(() => {
                  const { neededW, neededH } = calcOccupiedDimensions(settings);
                  const wastedH = Math.max(0, Number((settings.pageHeightMm - neededH).toFixed(1)));
                  const wastedW = Math.max(0, Number((settings.pageWidthMm - neededW).toFixed(1)));
                  const hasWastedSpace = wastedH > 1 || wastedW > 1;

                  return (
                    <div className="mt-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-slate-800 block">Page Space Optimization</span>
                          <span className="text-xs text-slate-500">
                            {hasWastedSpace ? (
                              <span className="text-amber-700 font-medium">
                                ⚠️ Wasted space: {wastedH > 1 ? `${wastedH} mm height` : ''}{wastedH > 1 && wastedW > 1 ? ', ' : ''}{wastedW > 1 ? `${wastedW} mm width` : ''} unused on page
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">
                                ✓ Page size matches label grid ({neededW} × {neededH} mm)
                              </span>
                            )}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateSettings({
                            pageWidthMm: neededW,
                            pageHeightMm: neededH,
                            pageSizePreset: 'User Defined Size',
                            autoFitPageToLabels: true,
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap ml-3"
                        >
                          Fit Page to Labels ({neededW} × {neededH} mm)
                        </button>
                      </div>

                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-2 border-t border-slate-200/60 select-none">
                        <input
                          type="checkbox"
                          checked={settings.autoFitPageToLabels ?? (settings.pageSizePreset === 'User Defined Size')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked) {
                              updateSettings({
                                autoFitPageToLabels: true,
                                pageWidthMm: neededW,
                                pageHeightMm: neededH,
                                pageSizePreset: 'User Defined Size',
                              });
                            } else {
                              updateSettings({ autoFitPageToLabels: false });
                            }
                          }}
                          className="accent-blue-600 w-4 h-4 cursor-pointer"
                        />
                        <span>Automatically shrink page to fit label area (only take space occupied by labels)</span>
                      </label>
                    </div>
                  );
                })()}
              </div>
              <LivePreview settings={settings} />
            </>
          )}

          {/* ────────────────── Step 8: Printing Order ────────────────── */}
          {step === 8 && (
            <>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Printing Order</div>

                <div className="flex items-center gap-3 mb-3">
                  <span className="w-36 text-sm font-medium text-slate-600">Starting Corner:</span>
                  <select
                    className="h-9 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none min-w-[160px]"
                    value={settings.startingCorner}
                    onChange={(e) => updateSettings({ startingCorner: e.target.value as any })}
                  >
                    <option value="top-left">Top-Left</option>
                    <option value="top-right">Top-Right</option>
                    <option value="bottom-left">Bottom-Left</option>
                    <option value="bottom-right">Bottom-Right</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="w-36 text-sm font-medium text-slate-600">Primary Direction:</span>
                  <select
                    className="h-9 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none min-w-[160px]"
                    value={settings.primaryDirection}
                    onChange={(e) => updateSettings({ primaryDirection: e.target.value as any })}
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.selectStartingPositionAtPrint}
                      onChange={(e) => updateSettings({ selectStartingPositionAtPrint: e.target.checked })}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Select starting position at print time</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.continueFromLastPosition}
                      onChange={(e) => updateSettings({ continueFromLastPosition: e.target.checked })}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Continue from last position of previous job</span>
                  </label>
                </div>
              </div>
              <LivePreview settings={settings} showNumbers={true} />
            </>
          )}

          {/* ────────────────── Step 9: Template Background ────────────────── */}
          {step === 9 && (
            <>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Background Features</div>

                <div className="flex flex-col gap-4">
                  {/* Color option */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.useBackgroundColor}
                        onChange={(e) => updateSettings({ useBackgroundColor: e.target.checked })}
                        className="accent-blue-600 w-4.5 h-4.5 cursor-pointer"
                      />
                      <span>Background Fill Color</span>
                    </label>
                    <p className="text-xs text-slate-500 ml-7 mt-0.5">
                      Specifies an artboard canvas fill color to use for the background.
                    </p>
                    {settings.useBackgroundColor && (
                      <div className="ml-7 mt-2.5 flex items-center gap-2.5">
                        <input
                          type="color"
                          value={settings.backgroundColor}
                          onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                          className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700">{settings.backgroundColor.toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  {/* Picture option */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.useBackgroundPicture}
                        onChange={(e) => updateSettings({ useBackgroundPicture: e.target.checked })}
                        className="accent-blue-600 w-4.5 h-4.5 cursor-pointer"
                      />
                      <span>Background Image Picture</span>
                    </label>
                    <p className="text-xs text-slate-500 ml-7 mt-0.5">
                      Allows you to render a raster watermark or texture for the label background.
                    </p>
                  </div>
                </div>
              </div>
              <LivePreview settings={settings} highlightSingleItem={true} />
            </>
          )}

          {/* ────────────────── Step 10: Finished! ────────────────── */}
          {step === 10 && (
            <>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Review Document Specifications:</div>
                <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50/50 p-4 text-sm space-y-2.5 overflow-y-auto">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-600">Starting Document:</span>
                    <span className="font-medium text-slate-800">Blank Canvas</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-600">Selected Printer:</span>
                    <span className="font-medium text-slate-800">{settings.printer}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-600">Page Dimensions:</span>
                    <span className="font-mono font-medium text-slate-800">{settings.pageWidthMm.toFixed(1)} × {settings.pageHeightMm.toFixed(1)} mm</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-600">Template Dimensions:</span>
                    <span className="font-mono font-bold text-blue-700">{settings.templateWidthMm.toFixed(1)} × {settings.templateHeightMm.toFixed(1)} mm</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-600">Label Shape:</span>
                    <span className="font-medium text-slate-800 capitalize">
                      {settings.shape === 'roundedRectangle' ? 'Rounded Rectangle' : settings.shape}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-600">Items Per Page:</span>
                    <span className="font-medium text-slate-800">
                      {settings.itemsPerPageType === 'single'
                        ? 'Single Item'
                        : `${settings.rows} rows × ${settings.cols} cols (${settings.rows * settings.cols} items)`}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-600">Sheet Margins:</span>
                    <span className="font-medium text-slate-800">
                      {settings.hasUnusedMaterial
                        ? `L: ${settings.unusedLeftMm}mm, R: ${settings.unusedRightMm}mm, T: ${settings.unusedTopMm}mm, B: ${settings.unusedBottomMm}mm`
                        : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-slate-600">Printing Direction:</span>
                    <span className="font-medium text-slate-800 capitalize">
                      {settings.startingCorner}, {settings.primaryDirection}
                    </span>
                  </div>
                </div>
              </div>
              <LivePreview settings={settings} />
            </>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Step {step} of 10: <strong className="text-slate-800">{header.title}</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              disabled={!canGoBack}
              onClick={handleBack}
            >
              ← Back
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-500/25 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              disabled={!canGoNext}
              onClick={handleNext}
            >
              Next →
            </button>
            <button
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-sm shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
              onClick={handleFinish}
            >
              Finish Wizard
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Popups from Step 1 */}
      {showPrinterProps && (
        <PrinterPropertiesModal
          printerName={settings.printer}
          printerInfo={selectedPrinterInfo}
          onClose={() => setShowPrinterProps(false)}
        />
      )}
      {showDocProps && (
        <DocumentPropertiesModal
          printerName={settings.printer}
          onClose={() => setShowDocProps(false)}
        />
      )}
    </div>
  );
};
