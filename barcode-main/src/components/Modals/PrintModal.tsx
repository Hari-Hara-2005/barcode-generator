'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import {
  WizardSettings,
  CanvasObject,
  BarcodeObject,
  TextObject,
  LineObject,
  ShapeObject,
  SystemPrinterInfo,
} from '@/types/barcode-agentwarebot';
import { PRINTER_LIST } from '@/data/defaults';

interface PrintModalProps {
  settings: WizardSettings;
  objects: CanvasObject[];
  onClose: () => void;
  onPrinterChange?: (printerName: string) => void;
}

// ── helpers ─────────────────────────────────────────────────────────────────

/** Generate a JsBarcode SVG string synchronously (server-side safe). */
function generateBarcodeSvg(
  value: string,
  format: string,
  displayValue: boolean,
  fgColor: string,
  width: number,  // px
  height: number  // px
): string {
  try {
    // We render into a temporary <svg> element in a detached div so JsBarcode
    // can write to it. Works fine in browser; no SSR issue because this
    // component is 'use client'.
    const container = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const JsBarcode = require('jsbarcode');

    let bcFormat = format.toUpperCase();
    if (bcFormat === 'EAN13' || bcFormat === 'EAN-13') bcFormat = 'EAN13';
    else if (bcFormat === 'EAN8' || bcFormat === 'EAN-8') bcFormat = 'EAN8';
    else if (bcFormat === 'CODE128') bcFormat = 'CODE128';
    else if (bcFormat === 'CODE39') bcFormat = 'CODE39';
    else if (bcFormat === 'ITF' || bcFormat === 'ITF14') bcFormat = 'ITF14';
    else if (bcFormat === 'UPC' || bcFormat === 'UPCA') bcFormat = 'UPC';
    else bcFormat = 'CODE128';

    JsBarcode(svg, value, {
      format: bcFormat,
      lineColor: fgColor,
      background: 'transparent',
      width: Math.max(1, width / 100),
      height: Math.max(20, height - (displayValue ? 14 : 0)),
      displayValue,
      fontSize: 10,
      margin: 2,
      flat: false,
    });

    return new XMLSerializer().serializeToString(svg);
  } catch {
    // fallback – simple placeholder
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <text x="50%" y="50%" text-anchor="middle" font-size="9" fill="${fgColor}">${value}</text>
    </svg>`;
  }
}

/** Generate a QR code as a data-URL PNG */
async function generateQrDataUrl(value: string, size: number): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const QRCode = require('qrcode');
    return await QRCode.toDataURL(value, {
      width: Math.max(60, size),
      margin: 1,
      errorCorrectionLevel: 'M',
    });
  } catch {
    return '';
  }
}

// ── LabelCell: renders one label with real barcodes ─────────────────────────

interface LabelCellProps {
  objects: CanvasObject[];
  settings: WizardSettings;
  serialOffset: number;      // how many labels before this one (for serial increment)
  enableSerial: boolean;
  serialStart: number;
  widthPx: number;
  heightPx: number;
  scale: number;             // mm → px scale for this preview
}

const LabelCell: React.FC<LabelCellProps> = ({
  objects,
  settings,
  serialOffset,
  enableSerial,
  serialStart,
  widthPx,
  heightPx,
  scale,
}) => {
  const currentSerial = serialStart + serialOffset;

  const getBorderRadius = () => {
    switch (settings.shape) {
      case 'roundedRectangle': return `${settings.cornerRadiusMm * scale}px`;
      case 'circle':
      case 'ellipse': return '50%';
      default: return '0';
    }
  };

  return (
    <div
      style={{
        width: widthPx,
        height: heightPx,
        border: '1px solid #7a9ec2',
        borderRadius: getBorderRadius(),
        backgroundColor: settings.useBackgroundColor ? settings.backgroundColor : '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {[...objects].sort((a, b) => a.zIndex - b.zIndex).map((obj) => {
        const left = obj.x * scale;
        const top = obj.y * scale;
        const w = obj.width * scale;
        const h = obj.height * scale;
        const transform = obj.rotation ? `rotate(${obj.rotation}deg)` : undefined;

        if (obj.type === 'barcode') {
          const bc = obj as BarcodeObject;
          const displayVal = enableSerial
            ? String(currentSerial)
            : bc.value;

          if (bc.format === 'QR') {
            return (
              <QrCell
                key={obj.id}
                value={displayVal}
                left={left}
                top={top}
                width={w}
                height={h}
                fgColor={bc.fgColor || '#000000'}
                bgColor={bc.bgColor || '#ffffff'}
                transform={transform}
              />
            );
          }

          // Linear barcode rendered synchronously via JsBarcode
          const svgStr = generateBarcodeSvg(displayVal, bc.format, bc.displayValue, bc.fgColor, w, h);
          return (
            <div
              key={obj.id}
              style={{
                position: 'absolute',
                left,
                top,
                width: w,
                height: h,
                transform,
                transformOrigin: 'center center',
              }}
              dangerouslySetInnerHTML={{ __html: svgStr }}
            />
          );
        }

        if (obj.type === 'text') {
          const tx = obj as TextObject;
          return (
            <div
              key={obj.id}
              style={{
                position: 'absolute',
                left,
                top,
                width: w,
                height: h,
                transform,
                transformOrigin: 'center center',
                fontSize: Math.max(6, tx.fontSize * (scale / 3.78)),
                fontFamily: tx.fontFamily,
                fontWeight: tx.bold ? 'bold' : 'normal',
                fontStyle: tx.italic ? 'italic' : 'normal',
                textDecoration: tx.underline ? 'underline' : tx.strike ? 'line-through' : 'none',
                textAlign: tx.align,
                color: tx.color,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'pre-wrap',
              }}
            >
              {tx.text}
            </div>
          );
        }

        if (obj.type === 'line') {
          const ln = obj as LineObject;
          const isVertical = ln.orientation === 'vertical' || h > w;
          const thicknessPx = Math.max(1, (ln.strokeWidth || 1) * 0.3528 * scale);
          return (
            <div
              key={obj.id}
              style={{
                position: 'absolute',
                left: isVertical ? left + (w - thicknessPx) / 2 : left,
                top: isVertical ? top : top + (h - thicknessPx) / 2,
                width: isVertical ? thicknessPx : w,
                height: isVertical ? h : thicknessPx,
                background: ln.strokeColor,
                transform,
                transformOrigin: 'center center',
              }}
            />
          );
        }

        if (obj.type === 'shape') {
          const sh = obj as ShapeObject;
          const rad = sh.shapeType === 'ellipse' ? '50%'
            : sh.shapeType === 'roundedRectangle' ? `${sh.cornerRadius * scale}px`
            : '0';
          const borderPx = Math.max(1, (sh.strokeWidth || 1) * 0.3528 * scale);
          return (
            <div
              key={obj.id}
              style={{
                position: 'absolute',
                left,
                top,
                width: w,
                height: h,
                borderRadius: rad,
                border: `${borderPx}px solid ${sh.strokeColor}`,
                backgroundColor: sh.fillColor === 'transparent' ? 'transparent' : sh.fillColor,
                transform,
                transformOrigin: 'center center',
                boxSizing: 'border-box',
              }}
            />
          );
        }

        if (obj.type === 'image') {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={obj.id}
              src={(obj as any).src}
              alt=""
              style={{
                position: 'absolute',
                left,
                top,
                width: w,
                height: h,
                objectFit: (obj as any).objectFit || 'contain',
                transform,
                transformOrigin: 'center center',
              }}
            />
          );
        }

        return null;
      })}
    </div>
  );
};

// Async Vector QR cell
const QrCell: React.FC<{
  value: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fgColor?: string;
  bgColor?: string;
  transform?: string;
}> = ({ value, left, top, width, height, fgColor = '#000000', bgColor = '#ffffff', transform }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      color: { dark: fgColor, light: bgColor },
    })
      .then((svg) => {
        if (active) {
          setSvgHtml(svg.replace('<svg ', '<svg width="100%" height="100%" style="display:block;" '));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value, fgColor, bgColor]);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        transform,
        transformOrigin: 'center center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        overflow: 'hidden',
      }}
      dangerouslySetInnerHTML={svgHtml ? { __html: svgHtml } : undefined}
    />
  );
};

// ── Main PrintModal ──────────────────────────────────────────────────────────

export const PrintModal: React.FC<PrintModalProps> = ({ settings, objects, onClose, onPrinterChange }) => {
  const [printMode, setPrintMode] = useState<'sheet' | 'single'>('sheet');
  const [copies, setCopies] = useState<number>(1);
  const [enableSerial, setEnableSerial] = useState<boolean>(false);
  const [serialStart, setSerialStart] = useState<number>(1001);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Connected PC Printers State
  const [selectedPrinter, setSelectedPrinter] = useState<string>(settings.printer);
  const [systemPrinters, setSystemPrinters] = useState<SystemPrinterInfo[]>([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState<boolean>(false);

  const fetchPCPrinters = useCallback(async () => {
    setIsLoadingPrinters(true);
    try {
      const res = await fetch('/api/printers');
      const data = await res.json();
      if (data.success && Array.isArray(data.systemPrinters)) {
        setSystemPrinters(data.systemPrinters);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingPrinters(false);
    }
  }, []);

  useEffect(() => {
    fetchPCPrinters();
  }, [fetchPCPrinters]);

  const handlePrinterSelect = (printerName: string) => {
    setSelectedPrinter(printerName);
    onPrinterChange?.(printerName);
  };

  const activeSystemPrinter = systemPrinters.find(
    (p) => p.name.toLowerCase() === selectedPrinter.toLowerCase()
  );

  const rows = settings.itemsPerPageType === 'single' ? 1 : Math.max(1, settings.rows);
  const cols = settings.itemsPerPageType === 'single' ? 1 : Math.max(1, settings.cols);
  const totalItems = printMode === 'single' ? 1 : rows * cols;

  // Preview scale: fit the page sheet into the preview box
  // Preview area is ~480px wide at most; we shrink the page proportionally
  const PREVIEW_MAX_W = 460;
  const PREVIEW_MAX_H = 300;
  const pageW = settings.pageWidthMm;
  const pageH = settings.pageHeightMm;
  const scaleToFitW = PREVIEW_MAX_W / pageW;
  const scaleToFitH = PREVIEW_MAX_H / pageH;
  const previewScale = Math.min(scaleToFitW, scaleToFitH, 2.5); // px per mm, capped

  const previewPageW = pageW * previewScale;
  const previewPageH = pageH * previewScale;
  const previewLabelW = settings.templateWidthMm * previewScale;
  const previewLabelH = settings.templateHeightMm * previewScale;
  const previewGapH = (settings.horizGapMm || 0) * previewScale;
  const previewGapV = (settings.vertGapMm || 0) * previewScale;
  const previewPadL = (settings.hasUnusedMaterial ? settings.unusedLeftMm : 0) * previewScale;
  const previewPadR = (settings.hasUnusedMaterial ? settings.unusedRightMm : 0) * previewScale;
  const previewPadT = (settings.hasUnusedMaterial ? settings.unusedTopMm : 0) * previewScale;
  const previewPadB = (settings.hasUnusedMaterial ? settings.unusedBottomMm : 0) * previewScale;

  // For "single" mode preview
  const singleScale = Math.min(
    PREVIEW_MAX_W / settings.templateWidthMm,
    PREVIEW_MAX_H / settings.templateHeightMm,
    6
  );

  // ── Print handler ──────────────────────────────────────────────────────────
  const handleSendToPrinter = useCallback(async () => {
    setIsPrinting(true);

    // Create a fresh div appended DIRECTLY to <body> so @media print can reach it
    // as a direct child (body > #barcode-agentwarebot-print-root), even though the React
    // component tree is nested inside body > div#__next.
    const existingRoot = document.getElementById('barcode-agentwarebot-print-root') || document.getElementById('bartender-print-root');
    if (existingRoot) existingRoot.remove();
    const root = document.createElement('div');
    root.id = 'barcode-agentwarebot-print-root';
    document.body.appendChild(root);

    // Inject / update the @page style
    const styleId = 'barcode-agentwarebot-print-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const printRows = printMode === 'single' ? 1 : rows;
    const printCols = printMode === 'single' ? 1 : cols;
    const printTotalItems = printMode === 'single' ? 1 : printRows * printCols;

    // Physical mm dimensions
    const pw = printMode === 'single' ? settings.templateWidthMm : settings.pageWidthMm;
    const ph = printMode === 'single' ? settings.templateHeightMm : settings.pageHeightMm;
    const lw = settings.templateWidthMm;
    const lh = settings.templateHeightMm;
    const gapH = settings.horizGapMm || 0;
    const gapV = settings.vertGapMm || 0;
    const padL = settings.hasUnusedMaterial ? settings.unusedLeftMm : 0;
    const padR = settings.hasUnusedMaterial ? settings.unusedRightMm : 0;
    const padT = settings.hasUnusedMaterial ? settings.unusedTopMm : 0;
    const padB = settings.hasUnusedMaterial ? settings.unusedBottomMm : 0;

    // Border radius for printed label shape
    const borderRad = settings.shape === 'roundedRectangle'
      ? `${settings.cornerRadiusMm}mm`
      : settings.shape === 'circle' || settings.shape === 'ellipse'
        ? '50%'
        : '0';

    const bgColor = settings.useBackgroundColor ? settings.backgroundColor : '#ffffff';

    // Pre-generate real vector SVGs for all QR codes across all printed labels!
    const qrSvgMap = new Map<string, string>();
    for (const obj of objects) {
      if (obj.type === 'barcode' && (obj as BarcodeObject).format === 'QR') {
        const bc = obj as BarcodeObject;
        for (let i = 0; i < printTotalItems; i++) {
          const displayVal = enableSerial ? String(serialStart + i) : bc.value;
          const key = `${obj.id}-${i}`;
          if (!qrSvgMap.has(key)) {
            try {
              const rawSvg = await QRCode.toString(displayVal, {
                type: 'svg',
                margin: 1,
                color: {
                  dark: bc.fgColor || '#000000',
                  light: bc.bgColor || '#ffffff',
                },
              });
              qrSvgMap.set(key, rawSvg.replace('<svg ', '<svg width="100%" height="100%" style="display:block;" '));
            } catch {
              qrSvgMap.set(key, '');
            }
          }
        }
      }
    }

    // Build SVGs / content for each object in each label
    const buildObjectHtml = (obj: CanvasObject, labelIndex: number): string => {
      const currentSerial = serialStart + labelIndex;
      const left = `${obj.x}mm`;
      const top = `${obj.y}mm`;
      const w = `${obj.width}mm`;
      const h = `${obj.height}mm`;
      const rot = obj.rotation ? `rotate(${obj.rotation}deg)` : '';
      const posStyle = `position:absolute;left:${left};top:${top};width:${w};height:${h};transform:${rot};transform-origin:center center;overflow:hidden;box-sizing:border-box;`;

      if (obj.type === 'barcode') {
        const bc = obj as BarcodeObject;
        const displayVal = enableSerial ? String(currentSerial) : bc.value;
        const wPx = obj.width * 3.78 * 2; // approx px at 96dpi
        const hPx = obj.height * 3.78 * 2;

        if (bc.format === 'QR') {
          const qrSvg = qrSvgMap.get(`${obj.id}-${labelIndex}`);
          const qrBg = bc.bgColor || '#ffffff';
          if (qrSvg) {
            return `<div style="${posStyle}background:${qrBg};display:flex;align-items:center;justify-content:center;">${qrSvg}</div>`;
          }
          return `<div style="${posStyle}background:${qrBg};border:1px solid ${bc.fgColor};display:flex;align-items:center;justify-content:center;font-size:6pt;font-family:monospace;color:${bc.fgColor};">${displayVal}</div>`;
        }

        const svgStr = generateBarcodeSvg(displayVal, bc.format, bc.displayValue, bc.fgColor, wPx, hPx);
        return `<div style="${posStyle}">${svgStr}</div>`;
      }

      if (obj.type === 'text') {
        const tx = obj as TextObject;
        const td = tx.underline ? 'underline' : tx.strike ? 'line-through' : 'none';
        return `<div style="${posStyle}font-size:${tx.fontSize}pt;font-family:${tx.fontFamily},sans-serif;font-weight:${tx.bold ? 'bold' : 'normal'};font-style:${tx.italic ? 'italic' : 'normal'};text-decoration:${td};text-align:${tx.align};color:${tx.color};display:flex;align-items:center;white-space:pre-wrap;">${tx.text}</div>`;
      }

      if (obj.type === 'line') {
        const ln = obj as LineObject;
        const isVertical = ln.orientation === 'vertical' || obj.height > obj.width;
        // Physical thickness in mm: 1 pt = 0.3528 mm
        const thicknessMm = Number(Math.max(0.08, (ln.strokeWidth || 1) * 0.3528).toFixed(2));

        let lineStyle = `position:absolute;transform:${rot};transform-origin:center center;background:${ln.strokeColor};box-sizing:border-box;`;
        if (isVertical) {
          const centeredLeft = Number((obj.x + (obj.width - thicknessMm) / 2).toFixed(2));
          lineStyle += `left:${centeredLeft}mm;top:${top};width:${thicknessMm}mm;height:${h};`;
        } else {
          const centeredTop = Number((obj.y + (obj.height - thicknessMm) / 2).toFixed(2));
          lineStyle += `left:${left};top:${centeredTop}mm;width:${w};height:${thicknessMm}mm;`;
        }
        return `<div style="${lineStyle}"></div>`;
      }

      if (obj.type === 'shape') {
        const sh = obj as ShapeObject;
        const rad = sh.shapeType === 'ellipse' ? '50%'
          : sh.shapeType === 'roundedRectangle' ? `${sh.cornerRadius}mm`
          : '0';
        const fill = sh.fillColor === 'transparent' ? 'transparent' : sh.fillColor;
        const borderMm = Number(Math.max(0.08, (sh.strokeWidth || 1) * 0.3528).toFixed(2));
        return `<div style="${posStyle}border-radius:${rad};border:${borderMm}mm solid ${sh.strokeColor};background:${fill};"></div>`;
      }

      if (obj.type === 'image') {
        return `<img src="${(obj as any).src}" alt="" style="${posStyle}object-fit:${(obj as any).objectFit || 'contain'};" />`;
      }

      return '';
    };

    // Build labels HTML
    const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);

    let labelsHtml = '';
    for (let i = 0; i < printTotalItems; i++) {
      const objectsHtml = sortedObjects.map((obj) => buildObjectHtml(obj, i)).join('');
      labelsHtml += `<div style="width:${lw}mm;height:${lh}mm;border:0.3px solid #ccc;border-radius:${borderRad};background:${bgColor};position:relative;overflow:hidden;box-sizing:border-box;flex-shrink:0;">${objectsHtml}</div>`;
    }

    // Sheet or single
    let sheetHtml = '';
    if (printMode === 'single') {
      sheetHtml = `<div style="width:${lw}mm;height:${lh}mm;">${labelsHtml}</div>`;
    } else {
      sheetHtml = `
        <div style="width:${pw}mm;height:${ph}mm;padding-left:${padL}mm;padding-right:${padR}mm;padding-top:${padT}mm;padding-bottom:${padB}mm;box-sizing:border-box;">
          <div style="display:grid;grid-template-columns:repeat(${printCols},${lw}mm);grid-template-rows:repeat(${printRows},${lh}mm);column-gap:${gapH}mm;row-gap:${gapV}mm;padding:0;">
            ${labelsHtml}
          </div>
        </div>`;
    }

    // Repeat for copies
    let allCopiesHtml = '';
    for (let c = 0; c < copies; c++) {
      allCopiesHtml += `<div style="page-break-after:${c < copies - 1 ? 'always' : 'auto'};">${sheetHtml}</div>`;
    }

    styleEl.textContent = `
      @page { size: ${pw}mm ${ph}mm; margin: 0; }
      #barcode-agentwarebot-print-root *, #bartender-print-root * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    `;

    root.innerHTML = allCopiesHtml;

    // Give browser time to paint inline QR SVGs then print
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        // Cleanup after print dialog closes
        setTimeout(() => {
          root.remove();
          setIsPrinting(false);
        }, 1000);
      }, 150);
    });
  }, [printMode, copies, enableSerial, serialStart, rows, cols, objects, settings]);

  // Intercept Escape key to close modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1200] p-4 animate-in fade-in duration-150">
      <div className="w-[700px] max-w-[95vw] max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden select-none">
        {/* Modern Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              🖨️
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Print Label Document
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Target: {selectedPrinter}
              </p>
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer font-bold text-sm"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {/* Print Configuration Card */}
          <div className="border border-slate-200/90 rounded-xl p-4 bg-white shadow-xs space-y-3.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Print Configuration
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-sm">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Print Layout Mode</label>
                <select
                  className="h-9 w-full px-3 border border-slate-200 rounded-lg text-sm bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition cursor-pointer text-slate-800"
                  value={printMode}
                  onChange={(e) => setPrintMode(e.target.value as 'sheet' | 'single')}
                >
                  <option value="sheet">
                    Full Page Grid ({rows}×{cols} = {rows * cols} labels/sheet)
                  </option>
                  <option value="single">
                    Single Label ({settings.templateWidthMm} × {settings.templateHeightMm} mm)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Number of Copies</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-9 w-full px-3 border border-slate-200 rounded-lg text-sm font-mono font-medium text-slate-800 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
              </div>
            </div>

            {/* Target Printer */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Target Printer</label>
              <div className="flex gap-2.5 items-center">
                <select
                  value={selectedPrinter}
                  onChange={(e) => handlePrinterSelect(e.target.value)}
                  className="h-9 flex-1 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition cursor-pointer"
                >
                  {systemPrinters.length > 0 && (
                    <optgroup label="🟢 Connected PC Printers">
                      {systemPrinters.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} {p.isDefault ? '(Default)' : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="🏷️ Barcode & Thermal Presets">
                    {PRINTER_LIST.filter(
                      (p) => !systemPrinters.some((sp) => sp.name.toLowerCase() === p.toLowerCase())
                    ).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <button
                  type="button"
                  onClick={fetchPCPrinters}
                  disabled={isLoadingPrinters}
                  className="h-9 px-3.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer transition flex items-center gap-1.5 text-slate-700"
                >
                  {isLoadingPrinters ? 'Scanning...' : '🔄 Scan PC'}
                </button>
              </div>

              {activeSystemPrinter ? (
                <div className="mt-2.5 text-xs bg-emerald-50 border border-emerald-200/60 rounded-xl p-2.5 text-emerald-800 flex flex-wrap gap-4 font-mono">
                  <span>Port: <strong>{activeSystemPrinter.port}</strong></span>
                  <span>Status: <strong>{activeSystemPrinter.status}</strong></span>
                  <span>Driver: <strong>{activeSystemPrinter.driver}</strong></span>
                  {activeSystemPrinter.isDefault && (
                    <span className="font-bold text-emerald-700">[Default Windows Printer]</span>
                  )}
                </div>
              ) : (
                <div className="mt-1.5 text-xs text-slate-400 italic">
                  Preset driver profile. Connect physical printer or choose a Windows printer above to print.
                </div>
              )}
            </div>

            {/* Serial Auto-Increment */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  checked={enableSerial}
                  onChange={(e) => setEnableSerial(e.target.checked)}
                />
                <span className="text-xs font-semibold">Auto-Increment Barcode Serial Numbers</span>
              </label>

              {enableSerial && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Start Serial:</span>
                  <input
                    type="number"
                    value={serialStart}
                    onChange={(e) => setSerialStart(parseInt(e.target.value) || 1)}
                    className="h-8 w-28 px-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none font-medium"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="canvas-dot-grid p-6 rounded-xl border border-slate-200/90 flex items-center justify-center min-h-[200px] max-h-[320px] overflow-auto">
            {printMode === 'sheet' ? (
              <div
                style={{
                  width: previewPageW,
                  height: previewPageH,
                  background: '#fff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  boxSizing: 'border-box',
                  paddingLeft: previewPadL,
                  paddingRight: previewPadR,
                  paddingTop: previewPadT,
                  paddingBottom: previewPadB,
                  overflow: 'hidden',
                  flexShrink: 0,
                  borderRadius: '6px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, ${previewLabelW}px)`,
                    gridTemplateRows: `repeat(${rows}, ${previewLabelH}px)`,
                    columnGap: previewGapH,
                    rowGap: previewGapV,
                    padding: 2,
                  }}
                >
                  {Array.from({ length: totalItems }).map((_, idx) => (
                    <LabelCell
                      key={idx}
                      objects={objects}
                      settings={settings}
                      serialOffset={idx}
                      enableSerial={enableSerial}
                      serialStart={serialStart}
                      widthPx={previewLabelW}
                      heightPx={previewLabelH}
                      scale={previewScale}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  flexShrink: 0,
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <LabelCell
                  objects={objects}
                  settings={settings}
                  serialOffset={0}
                  enableSerial={enableSerial}
                  serialStart={serialStart}
                  widthPx={settings.templateWidthMm * singleScale}
                  heightPx={settings.templateHeightMm * singleScale}
                  scale={singleScale}
                />
              </div>
            )}
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
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-sm shadow-blue-500/25 transition active:scale-95 flex items-center gap-2 cursor-pointer"
            onClick={handleSendToPrinter}
            disabled={isPrinting}
          >
            <span>🖨️</span>
            <span>{isPrinting ? 'Preparing Print Job…' : 'Send to Printer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
