import React from 'react';
import {
  WizardSettings,
  CanvasObject,
  BarcodeObject,
  TextObject,
  ShapeObject,
  LineObject,
  BarcodeFormat,
  ItemShape,
} from '@/types/barcode-agentwarebot';
import { LivePreview } from '@/components/Wizard/LivePreview';
import {
  Sliders,
  Settings2,
  Printer,
  Layers,
  Image as ImageIcon,
  Code2,
  RotateCw,
  Maximize2,
  Type,
  Barcode,
  Square,
  Sparkles,
} from 'lucide-react';

interface RightPropertiesPanelProps {
  settings: WizardSettings;
  selectedObject: CanvasObject | null;
  onUpdateObject: (updated: CanvasObject) => void;
  onOpenBatchModal: () => void;
  onPrint: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onOpenPageSetup?: () => void;
  onUpdateSettings?: (newSettings: Partial<WizardSettings>) => void;
}

const BARCODE_FORMAT_OPTIONS: { value: BarcodeFormat; label: string }[] = [
  { value: 'CODE128', label: 'Code 128 (Standard)' },
  { value: 'CODE39', label: 'Code 39' },
  { value: 'EAN13', label: 'EAN-13 (Retail)' },
  { value: 'EAN8', label: 'EAN-8' },
  { value: 'UPC', label: 'UPC-A (North America)' },
  { value: 'ITF14', label: 'ITF-14 (Cartons)' },
  { value: 'QR', label: '2D QR Code' },
];

export const RightPropertiesPanel: React.FC<RightPropertiesPanelProps> = ({
  settings,
  selectedObject,
  onUpdateObject,
  onOpenBatchModal,
  onPrint,
  onExportPng,
  onExportSvg,
  onOpenPageSetup,
  onUpdateSettings,
}) => {
  const inputClass =
    'h-9 w-full text-sm border border-slate-200 rounded-lg bg-slate-50/70 px-3 text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition';
  const selectClass =
    'h-9 w-full text-sm border border-slate-200 rounded-lg bg-slate-50/70 px-3 text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer';

  // Calculate occupied label area vs page size
  const rCount = settings.itemsPerPageType === 'single' ? 1 : Math.max(1, settings.rows);
  const cCount = settings.itemsPerPageType === 'single' ? 1 : Math.max(1, settings.cols);
  const leftM = settings.hasUnusedMaterial ? (settings.unusedLeftMm || 0) : 0;
  const rightM = settings.hasUnusedMaterial ? (settings.unusedRightMm || 0) : 0;
  const topM = settings.hasUnusedMaterial ? (settings.unusedTopMm || 0) : 0;
  const bottomM = settings.hasUnusedMaterial ? (settings.unusedBottomMm || 0) : 0;
  const totalHGap = (cCount - 1) * (settings.horizGapMm || 0);
  const totalVGap = (rCount - 1) * (settings.vertGapMm || 0);

  const neededSheetW = Number((leftM + (cCount * (settings.templateWidthMm || 10)) + totalHGap + rightM).toFixed(1));
  const neededSheetH = Number((topM + (rCount * (settings.templateHeightMm || 10)) + totalVGap + bottomM).toFixed(1));
  const hasWastedSheetSpace = (settings.pageHeightMm - neededSheetH > 1) || (settings.pageWidthMm - neededSheetW > 1);

  return (
    <div className="w-80 bg-white border-l border-slate-200/80 flex flex-col overflow-y-auto shrink-0 select-none text-sm">
      {/* Inspector Header */}
      <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2">
          {selectedObject ? (
            <>
              {selectedObject.type === 'barcode' && <Barcode className="w-4.5 h-4.5 text-blue-600" />}
              {selectedObject.type === 'text' && <Type className="w-4.5 h-4.5 text-emerald-600" />}
              {selectedObject.type === 'shape' && <Square className="w-4.5 h-4.5 text-amber-600" />}
              {selectedObject.type === 'line' && <Sliders className="w-4.5 h-4.5 text-purple-600" />}
              {selectedObject.type === 'image' && <ImageIcon className="w-4.5 h-4.5 text-rose-600" />}
              <span className="font-bold text-slate-800 capitalize text-sm">
                {selectedObject.type} Properties
              </span>
            </>
          ) : (
            <>
              <Settings2 className="w-4.5 h-4.5 text-slate-500" />
              <span className="font-bold text-slate-800 text-sm">Document Settings</span>
            </>
          )}
        </div>
        {selectedObject && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            Selected
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Selected Object Geometry (Position & Dimensions) */}
        {selectedObject && (
          <div className="space-y-2.5 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Transform & Size
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                <span className="text-xs font-bold text-slate-500 w-4">X</span>
                <input
                  type="number"
                  step="0.5"
                  className="w-full bg-transparent text-sm text-right font-mono font-medium text-slate-800 outline-none"
                  value={selectedObject.x}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      x: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <span className="text-xs text-slate-400 ml-1.5 font-sans">mm</span>
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                <span className="text-xs font-bold text-slate-500 w-4">Y</span>
                <input
                  type="number"
                  step="0.5"
                  className="w-full bg-transparent text-sm text-right font-mono font-medium text-slate-800 outline-none"
                  value={selectedObject.y}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      y: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <span className="text-xs text-slate-400 ml-1.5 font-sans">mm</span>
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                <span className="text-xs font-bold text-slate-500 w-4">W</span>
                <input
                  type="number"
                  step="0.5"
                  className="w-full bg-transparent text-sm text-right font-mono font-medium text-slate-800 outline-none"
                  value={selectedObject.width}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      width: parseFloat(e.target.value) || 1,
                    })
                  }
                />
                <span className="text-xs text-slate-400 ml-1.5 font-sans">mm</span>
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                <span className="text-xs font-bold text-slate-500 w-4">H</span>
                <input
                  type="number"
                  step="0.5"
                  className="w-full bg-transparent text-sm text-right font-mono font-medium text-slate-800 outline-none"
                  value={selectedObject.height}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      height: parseFloat(e.target.value) || 1,
                    })
                  }
                />
                <span className="text-xs text-slate-400 ml-1.5 font-sans">mm</span>
              </div>
            </div>

            {/* Rotation Controls */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-700 text-xs font-medium">Rotation Angle</span>
                <span className="font-mono text-xs font-bold text-blue-600">
                  {selectedObject.rotation || 0}°
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      (selectedObject.rotation || 0) === deg
                        ? 'bg-blue-50 text-blue-600 border-blue-300 font-bold shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    onClick={() => onUpdateObject({ ...selectedObject, rotation: deg })}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Barcode Specific Controls */}
        {selectedObject && selectedObject.type === 'barcode' && (
          <div className="space-y-3.5 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Symbology & Value
            </span>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Barcode Format
              </label>
              <select
                className={selectClass}
                value={(selectedObject as BarcodeObject).format}
                onChange={(e) =>
                  onUpdateObject({
                    ...selectedObject,
                    format: e.target.value as BarcodeFormat,
                  })
                }
              >
                {BARCODE_FORMAT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Encoded Value
              </label>
              <input
                type="text"
                className={inputClass}
                value={(selectedObject as BarcodeObject).value}
                onChange={(e) =>
                  onUpdateObject({
                    ...selectedObject,
                    value: e.target.value,
                  })
                }
                placeholder="Enter barcode string..."
              />
            </div>

            {(selectedObject as BarcodeObject).format !== 'QR' && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Bar Width Ratio</label>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {(selectedObject as BarcodeObject).barWidth} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.2"
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    value={(selectedObject as BarcodeObject).barWidth}
                    onChange={(e) =>
                      onUpdateObject({
                        ...selectedObject,
                        barWidth: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 select-none">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 cursor-pointer"
                    checked={(selectedObject as BarcodeObject).displayValue}
                    onChange={(e) =>
                      onUpdateObject({
                        ...selectedObject,
                        displayValue: e.target.checked,
                      })
                    }
                  />
                  <span className="text-xs font-medium text-slate-800">Display Human-Readable Text</span>
                </label>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Barcode Color</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                  value={(selectedObject as BarcodeObject).fgColor || '#000000'}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      fgColor: e.target.value,
                    })
                  }
                />
                <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                  {((selectedObject as BarcodeObject).fgColor || '#000000').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Text Specific Controls */}
        {selectedObject && selectedObject.type === 'text' && (
          <div className="space-y-3.5 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Text Content & Style
            </span>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Content
              </label>
              <textarea
                rows={2}
                className="w-full text-sm border border-slate-200 rounded-lg bg-slate-50/70 p-2.5 text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-y"
                value={(selectedObject as TextObject).text}
                onChange={(e) =>
                  onUpdateObject({
                    ...selectedObject,
                    text: e.target.value,
                  })
                }
                placeholder="Type label text..."
              />
              <button
                className="mt-2 w-full py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                onClick={() => {
                  const approxCharWidth = (selectedObject as TextObject).fontSize * 0.4;
                  const newW = Math.max(
                    10,
                    Number(((selectedObject as TextObject).text.length * approxCharWidth).toFixed(1))
                  );
                  onUpdateObject({ ...selectedObject, width: newW });
                }}
              >
                Auto-Fit Text Box Width
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Font Size</label>
                <input
                  type="number"
                  min="4"
                  max="72"
                  className={inputClass}
                  value={(selectedObject as TextObject).fontSize}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      fontSize: parseInt(e.target.value) || 10,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    value={(selectedObject as TextObject).color || '#000000'}
                    onChange={(e) =>
                      onUpdateObject({
                        ...selectedObject,
                        color: e.target.value,
                      })
                    }
                  />
                  <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                    {(selectedObject as TextObject).color}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Line Specific Controls */}
        {selectedObject && selectedObject.type === 'line' && (
          <div className="space-y-3.5 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Line Style & Thickness
            </span>

            {/* Thickness (pt) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Line Thickness</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="20"
                    value={(selectedObject as LineObject).strokeWidth || 1}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0.5;
                      onUpdateObject({ ...selectedObject, strokeWidth: val });
                    }}
                    className="w-16 h-7 text-xs text-right font-mono font-bold bg-slate-50 border border-slate-200 rounded px-1.5 outline-none focus:bg-white focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400 font-sans">pt</span>
                </div>
              </div>

              {/* Quick thickness preset pills */}
              <div className="grid grid-cols-5 gap-1 mb-2.5">
                {[0.25, 0.5, 1.0, 1.5, 2.0].map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => onUpdateObject({ ...selectedObject, strokeWidth: pt })}
                    className={`py-1 text-xs rounded border transition cursor-pointer font-mono font-medium ${
                      (selectedObject as LineObject).strokeWidth === pt
                        ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pt}pt
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="0.2"
                max="8"
                step="0.2"
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                value={(selectedObject as LineObject).strokeWidth || 1}
                onChange={(e) =>
                  onUpdateObject({
                    ...selectedObject,
                    strokeWidth: parseFloat(e.target.value) || 1,
                  })
                }
              />
            </div>

            {/* Line Color */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Line Color</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                  value={(selectedObject as LineObject).strokeColor || '#000000'}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      strokeColor: e.target.value,
                    })
                  }
                />
                <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                  {(selectedObject as LineObject).strokeColor || '#000000'}
                </span>
              </div>
            </div>

            {/* Quick Orientation switch */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Line Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    (selectedObject as LineObject).orientation === 'horizontal' || selectedObject.width >= selectedObject.height
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    const length = Math.max(selectedObject.width, selectedObject.height);
                    onUpdateObject({
                      ...selectedObject,
                      orientation: 'horizontal',
                      width: length,
                      height: 1,
                    });
                  }}
                >
                  <span>— Horizontal</span>
                </button>
                <button
                  type="button"
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    (selectedObject as LineObject).orientation === 'vertical' || selectedObject.height > selectedObject.width
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    const length = Math.max(selectedObject.width, selectedObject.height);
                    onUpdateObject({
                      ...selectedObject,
                      orientation: 'vertical',
                      width: 1,
                      height: length,
                    });
                  }}
                >
                  <span>| Vertical</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shape Specific Controls */}
        {selectedObject && selectedObject.type === 'shape' && (
          <div className="space-y-3.5 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Shape & Border Style
            </span>

            {/* Border Thickness */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Border Thickness</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={(selectedObject as ShapeObject).strokeWidth || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateObject({ ...selectedObject, strokeWidth: val });
                    }}
                    className="w-16 h-7 text-xs text-right font-mono font-bold bg-slate-50 border border-slate-200 rounded px-1.5 outline-none focus:bg-white focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400 font-sans">pt</span>
                </div>
              </div>

              {/* Quick presets */}
              <div className="grid grid-cols-5 gap-1 mb-2.5">
                {[0, 0.5, 1.0, 2.0, 3.0].map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => onUpdateObject({ ...selectedObject, strokeWidth: pt })}
                    className={`py-1 text-xs rounded border transition cursor-pointer font-mono font-medium ${
                      (selectedObject as ShapeObject).strokeWidth === pt
                        ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pt === 0 ? 'None' : `${pt}pt`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Border Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    value={(selectedObject as ShapeObject).strokeColor || '#000000'}
                    onChange={(e) =>
                      onUpdateObject({
                        ...selectedObject,
                        strokeColor: e.target.value,
                      })
                    }
                  />
                  <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                    {(selectedObject as ShapeObject).strokeColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Fill Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    value={(selectedObject as ShapeObject).fillColor === 'transparent' ? '#ffffff' : (selectedObject as ShapeObject).fillColor}
                    onChange={(e) =>
                      onUpdateObject({
                        ...selectedObject,
                        fillColor: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateObject({
                        ...selectedObject,
                        fillColor: (selectedObject as ShapeObject).fillColor === 'transparent' ? '#ffffff' : 'transparent',
                      })
                    }
                    className={`text-[10px] px-1.5 py-1 rounded border font-semibold ${
                      (selectedObject as ShapeObject).fillColor === 'transparent'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {(selectedObject as ShapeObject).fillColor === 'transparent' ? 'No Fill' : 'Filled'}
                  </button>
                </div>
              </div>
            </div>

            {(selectedObject as ShapeObject).shapeType === 'roundedRectangle' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Corner Radius (mm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="20"
                  className={inputClass}
                  value={(selectedObject as ShapeObject).cornerRadius || 2}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      cornerRadius: parseFloat(e.target.value) || 2,
                    })
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Document Layout & Settings */}
        <div className="space-y-3.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Layout & Media
          </span>

          {/* Live Mini Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center">
            <LivePreview settings={settings} />
            <div className="mt-2 text-xs font-semibold text-slate-600">
              {settings.templateWidthMm} × {settings.templateHeightMm} mm ({settings.shape})
            </div>
          </div>

          {/* Label Dimensions */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">Label Dimensions</span>
              <span className="text-xs text-slate-400 font-mono">Width × Height</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                <span className="text-xs font-bold text-slate-500 w-4">W</span>
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="500"
                  value={settings.templateWidthMm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 5;
                    const shouldAutoFit = settings.autoFitPageToLabels ?? (settings.pageSizePreset === 'User Defined Size');
                    const newNeededW = Number((leftM + (cCount * val) + totalHGap + rightM).toFixed(1));
                    onUpdateSettings?.({
                      templateWidthMm: val,
                      manualTemplateSize: true,
                      ...(shouldAutoFit ? { pageWidthMm: newNeededW, autoFitPageToLabels: true } : {}),
                    });
                  }}
                  className="w-full bg-transparent text-sm text-right font-mono font-medium text-slate-800 outline-none"
                />
                <span className="text-xs text-slate-400 ml-1.5 font-sans">mm</span>
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                <span className="text-xs font-bold text-slate-500 w-4">H</span>
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="500"
                  value={settings.templateHeightMm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 5;
                    const shouldAutoFit = settings.autoFitPageToLabels ?? (settings.pageSizePreset === 'User Defined Size');
                    const newNeededH = Number((topM + (rCount * val) + totalVGap + bottomM).toFixed(1));
                    onUpdateSettings?.({
                      templateHeightMm: val,
                      manualTemplateSize: true,
                      ...(shouldAutoFit ? { pageHeightMm: newNeededH, autoFitPageToLabels: true } : {}),
                    });
                  }}
                  className="w-full bg-transparent text-sm text-right font-mono font-medium text-slate-800 outline-none"
                />
                <span className="text-xs text-slate-400 ml-1.5 font-sans">mm</span>
              </div>
            </div>

            {hasWastedSheetSpace && (
              <button
                type="button"
                onClick={() => onUpdateSettings?.({
                  pageWidthMm: neededSheetW,
                  pageHeightMm: neededSheetH,
                  pageSizePreset: 'User Defined Size',
                  autoFitPageToLabels: true,
                })}
                className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title={`Trims wasted sheet space to match label grid`}
              >
                <span>⚡ Fit Sheet to Labels ({neededSheetW} × {neededSheetH} mm)</span>
              </button>
            )}

            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={settings.autoFitPageToLabels ?? (settings.pageSizePreset === 'User Defined Size')}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (checked) {
                    onUpdateSettings?.({
                      autoFitPageToLabels: true,
                      pageWidthMm: neededSheetW,
                      pageHeightMm: neededSheetH,
                      pageSizePreset: 'User Defined Size',
                    });
                  } else {
                    onUpdateSettings?.({ autoFitPageToLabels: false });
                  }
                }}
                className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Auto-fit sheet to label area (zero wasted space)</span>
            </label>
          </div>

          {/* Orientation switch */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Orientation
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                  settings.templateWidthMm >= settings.templateHeightMm
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newW = Math.max(settings.templateWidthMm, settings.templateHeightMm);
                  const newH = Math.min(settings.templateWidthMm, settings.templateHeightMm);
                  onUpdateSettings?.({
                    orientation: 'landscape',
                    templateWidthMm: newW,
                    templateHeightMm: newH,
                    manualTemplateSize: true,
                  });
                }}
              >
                <span>Landscape (H)</span>
              </button>

              <button
                type="button"
                className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                  settings.templateWidthMm < settings.templateHeightMm
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => {
                  const newW = Math.min(settings.templateWidthMm, settings.templateHeightMm);
                  const newH = Math.max(settings.templateWidthMm, settings.templateHeightMm);
                  onUpdateSettings?.({
                    orientation: 'portrait',
                    templateWidthMm: newW,
                    templateHeightMm: newH,
                    manualTemplateSize: true,
                  });
                }}
              >
                <span>Portrait (V)</span>
              </button>
            </div>
          </div>

          {/* Shape Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Label Shape
            </label>
            <select
              className={selectClass}
              value={settings.shape}
              onChange={(e) => onUpdateSettings?.({ shape: e.target.value as ItemShape })}
            >
              <option value="roundedRectangle">Rounded Rectangle</option>
              <option value="rectangle">Standard Rectangle</option>
              <option value="ellipse">Ellipse / Oval</option>
              <option value="circle">Circle</option>
            </select>
          </div>

          <button
            type="button"
            className="w-full py-2.5 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-750 font-medium text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            onClick={() => onOpenPageSetup?.()}
          >
            <Settings2 className="w-4 h-4 text-slate-500" />
            <span>Open Page Setup Dialog...</span>
          </button>
        </div>

        {/* Production & Export Tools */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Export & Production
          </span>

          <button
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            onClick={onPrint}
          >
            <Printer className="w-4.5 h-4.5" />
            <span>Print Label Sheet (Ctrl+P)</span>
          </button>

          <button
            className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-750 font-medium text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            onClick={onOpenBatchModal}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Batch Barcode Wizard</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              className="py-2 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              onClick={onExportPng}
            >
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>Export PNG</span>
            </button>

            <button
              className="py-2 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              onClick={onExportSvg}
            >
              <Code2 className="w-4 h-4 text-emerald-600" />
              <span>Vector SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
