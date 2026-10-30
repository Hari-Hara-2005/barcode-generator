import React from 'react';
import { BarcodeFormat } from '@/types/barcode-agentwarebot';
import {
  FilePlus,
  FolderOpen,
  Save,
  Printer,
  Eye,
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  Undo2,
  Redo2,
  MousePointer,
  Barcode,
  QrCode,
  Type,
  Square,
  Minus,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
} from 'lucide-react';

interface MainToolbarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onPrint: () => void;
  onPrintPreview: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  onAddBarcode: (format: BarcodeFormat) => void;
  onAddText: () => void;
  onAddShape: (shape: 'rectangle' | 'roundedRectangle' | 'ellipse') => void;
  onAddLine: () => void;
  onAddImage: () => void;
  onRotate?: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoom100: () => void;
  onZoomFit: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  onNew,
  onOpen,
  onSave,
  onPrint,
  onPrintPreview,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onUndo,
  onRedo,
  activeTool,
  setActiveTool,
  onAddBarcode,
  onAddText,
  onAddShape,
  onAddLine,
  onAddImage,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoom100,
  onZoomFit,
  showGrid,
  onToggleGrid,
}) => {
  const btnBase =
    'h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none';
  const btnActive = 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/25 shadow-xs font-semibold';
  const divider = 'w-px h-5 bg-slate-200 mx-1 shrink-0';

  return (
    <div className="h-12 px-4 flex items-center gap-1.5 shrink-0 select-none bg-white border-b border-slate-200/80 shadow-xs overflow-x-auto text-sm">
      {/* File Actions */}
      <div className="flex items-center gap-1">
        <button className={btnBase} onClick={onNew} title="New Label (Ctrl+N)">
          <FilePlus className="w-4.5 h-4.5" />
        </button>
        <button className={btnBase} onClick={onOpen} title="Open Document (Ctrl+O)">
          <FolderOpen className="w-4.5 h-4.5" />
        </button>
        <button className={btnBase} onClick={onSave} title="Save Document (Ctrl+S)">
          <Save className="w-4.5 h-4.5" />
        </button>
        <button className={btnBase} onClick={onPrint} title="Print Label (Ctrl+P)">
          <Printer className="w-4.5 h-4.5" />
        </button>
        <button className={btnBase} onClick={onPrintPreview} title="Print Preview">
          <Eye className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className={divider} />

      {/* History & Clipboard */}
      <div className="flex items-center gap-1">
        <button className={btnBase} onClick={onUndo} title="Undo (Ctrl+Z)">
          <Undo2 className="w-4.5 h-4.5" />
        </button>
        <button className={btnBase} onClick={onRedo} title="Redo (Ctrl+Y)">
          <Redo2 className="w-4.5 h-4.5" />
        </button>
        <button className={btnBase} onClick={onCut} title="Cut">
          <Scissors className="w-4.5 h-4.5" />
        </button>
        <button className={btnBase} onClick={onCopy} title="Copy">
          <Copy className="w-4.5 h-4.5" />
        </button>
        <button className={btnBase} onClick={onPaste} title="Paste">
          <Clipboard className="w-4.5 h-4.5" />
        </button>
        <button className={btnBase} onClick={onDelete} title="Delete Selected (Del)">
          <Trash2 className="w-4.5 h-4.5 text-rose-500 hover:text-rose-600" />
        </button>
      </div>

      <div className={divider} />

      {/* Creation Tools */}
      <div className="flex items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-200/60">
        <button
          className={`${btnBase} ${activeTool === 'select' ? btnActive : ''}`}
          onClick={() => setActiveTool('select')}
          title="Pointer Selection Tool"
        >
          <MousePointer className="w-4.5 h-4.5" />
        </button>
        <button
          className={`${btnBase} ${activeTool === 'barcode' ? btnActive : ''}`}
          onClick={() => {
            setActiveTool('barcode');
            onAddBarcode('CODE128');
          }}
          title="Add 1D Barcode (Code 128)"
        >
          <Barcode className="w-4.5 h-4.5" />
        </button>
        <button
          className={`${btnBase} ${activeTool === 'qr' ? btnActive : ''}`}
          onClick={() => {
            setActiveTool('qr');
            onAddBarcode('QR');
          }}
          title="Add 2D QR Code"
        >
          <QrCode className="w-4.5 h-4.5" />
        </button>
        <button
          className={`${btnBase} ${activeTool === 'text' ? btnActive : ''}`}
          onClick={() => {
            setActiveTool('text');
            onAddText();
          }}
          title="Add Text Object"
        >
          <Type className="w-4.5 h-4.5" />
        </button>
        <button
          className={`${btnBase} ${activeTool === 'rect' ? btnActive : ''}`}
          onClick={() => {
            setActiveTool('rect');
            onAddShape('roundedRectangle');
          }}
          title="Add Rounded Rectangle"
        >
          <Square className="w-4.5 h-4.5" />
        </button>
        <button
          className={`${btnBase} ${activeTool === 'line' ? btnActive : ''}`}
          onClick={() => {
            setActiveTool('line');
            onAddLine();
          }}
          title="Add Line"
        >
          <Minus className="w-4.5 h-4.5" />
        </button>
        <button
          className={`${btnBase} ${activeTool === 'image' ? btnActive : ''}`}
          onClick={() => {
            setActiveTool('image');
            onAddImage();
          }}
          title="Insert Image / Logo"
        >
          <ImageIcon className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className={divider} />

      {/* Zoom & View Controls */}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          className={`${btnBase} ${showGrid ? 'bg-slate-100 text-blue-600 font-semibold' : ''}`}
          onClick={onToggleGrid}
          title="Toggle Canvas Grid (Ctrl+G)"
        >
          <Grid className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/60">
          <button
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition"
            onClick={onZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2.5 text-xs font-mono font-bold text-slate-800 select-none min-w-[50px] text-center">
            {zoom}%
          </span>
          <button
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition"
            onClick={onZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <button
          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 transition"
          onClick={onZoomFit}
          title="Fit to Screen (439%)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit</span>
        </button>
      </div>
    </div>
  );
};
