import React, { useRef, useEffect, useState, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { generateSolidQrSvg } from '@/utils/qr';
import {
  WizardSettings,
  CanvasObject,
  BarcodeObject,
  TextObject,
  ShapeObject,
  LineObject,
  ImageObject,
} from '@/types/barcode-agentwarebot';
import {
  Settings2,
  Printer,
  FilePlus,
  RotateCw,
  Copy,
  Trash2,
  Grid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
} from 'lucide-react';

interface LabelCanvasProps {
  settings: WizardSettings;
  objects: CanvasObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (updated: CanvasObject) => void;
  onDeleteObject: (id: string) => void;
  zoom: number;
  showGrid: boolean;
  onMouseMoveCoords: (xMm: number, yMm: number) => void;
  onOpenPageSetup?: () => void;
  onUpdateSettings?: (newSettings: Partial<WizardSettings>) => void;
  onToggleGrid?: () => void;
  onSetZoom?: (zoom: number) => void;
  onPrint?: () => void;
  onOpenWizard?: () => void;
  onDuplicateObject?: (id: string) => void;
}

// ─── Barcode Renderer Subcomponent ──────────────────────────────────────────

const BarcodeItem: React.FC<{ object: BarcodeObject }> = ({ object }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    if (!object.value) return;

    if (object.format !== 'QR') {
      const s = svgRef.current;
      if (!s) return;
      try {
        JsBarcode(s, object.value, {
          format: object.format,
          lineColor: object.fgColor || '#000000',
          background: object.bgColor || 'transparent',
          width: object.barWidth || 1.5,
          displayValue: object.displayValue,
          fontSize: object.fontSize || 10,
          margin: 2,
        });
      } catch {
        setError(true);
      }
    }
  }, [object]);

  if (error) {
    return (
      <div className="text-[10px] text-rose-600 p-1 text-center font-mono">
        [Invalid {object.format}]
      </div>
    );
  }

  if (object.format === 'QR') {
    const qrSvg = generateSolidQrSvg(
      object.value,
      object.fgColor || '#000000',
      object.bgColor || '#ffffff',
      1
    );
    return (
      <div
        className="w-full h-full block overflow-hidden select-none"
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
    );
  }

  return <svg ref={svgRef} className="w-full h-full block objectSvgBarcode" />;
};

// ─── Main Canvas Component ──────────────────────────────────────────────────

export const LabelCanvas: React.FC<LabelCanvasProps> = ({
  settings,
  objects,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  onDeleteObject,
  zoom,
  showGrid,
  onMouseMoveCoords,
  onOpenPageSetup,
  onUpdateSettings,
  onToggleGrid,
  onSetZoom,
  onPrint,
  onOpenWizard,
  onDuplicateObject,
}) => {
  const artboardRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState<{ xMm: number; yMm: number }>({ xMm: 0, yMm: 0 });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Right-click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetObjectId: string | null;
  } | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, objId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 270;
    const menuHeight = objId ? 230 : 340;
    const posX = Math.max(10, Math.min(e.clientX, window.innerWidth - menuWidth - 10));
    const posY = Math.max(10, Math.min(e.clientY, window.innerHeight - menuHeight - 10));

    if (objId) {
      onSelectObject(objId);
    }
    setContextMenu({ x: posX, y: posY, targetObjectId: objId });
  };

  // Dragging state
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Resizing state
  const [resizing, setResizing] = useState<{
    id: string;
    handle: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  // Rotating state
  const [rotating, setRotating] = useState<{
    id: string;
    centerX: number;
    centerY: number;
  } | null>(null);

  const basePxPerMm = 3.78;
  const pxPerMm = basePxPerMm * (zoom / 100);

  const labelWidthPx = settings.templateWidthMm * pxPerMm;
  const labelHeightPx = settings.templateHeightMm * pxPerMm;

  // Track mouse coordinates
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!artboardRef.current) return;
    const rect = artboardRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / pxPerMm;
    const relY = (e.clientY - rect.top) / pxPerMm;
    const clampedX = Number(relX.toFixed(1));
    const clampedY = Number(relY.toFixed(1));
    setCursorPos({ xMm: clampedX, yMm: clampedY });
    onMouseMoveCoords(clampedX, clampedY);

    // Handle Dragging
    if (dragging) {
      const dxMm = (e.clientX - dragging.startX) / pxPerMm;
      const dyMm = (e.clientY - dragging.startY) / pxPerMm;
      const targetObj = objects.find((o) => o.id === dragging.id);
      if (targetObj) {
        onUpdateObject({
          ...targetObj,
          x: Math.max(0, Number((dragging.origX + dxMm).toFixed(1))),
          y: Math.max(0, Number((dragging.origY + dyMm).toFixed(1))),
        });
      }
    }

    // Handle Resizing
    if (resizing) {
      const dxMm = (e.clientX - resizing.startX) / pxPerMm;
      const dyMm = (e.clientY - resizing.startY) / pxPerMm;
      const targetObj = objects.find((o) => o.id === resizing.id);
      if (targetObj) {
        let newX = resizing.origX;
        let newY = resizing.origY;
        let newW = resizing.origW;
        let newH = resizing.origH;

        if (resizing.handle.includes('e')) newW = Math.max(2, resizing.origW + dxMm);
        if (resizing.handle.includes('s')) newH = Math.max(2, resizing.origH + dyMm);
        if (resizing.handle.includes('w')) {
          const proposedW = resizing.origW - dxMm;
          if (proposedW >= 2) {
            newW = proposedW;
            newX = resizing.origX + dxMm;
          }
        }
        if (resizing.handle.includes('n')) {
          const proposedH = resizing.origH - dyMm;
          if (proposedH >= 2) {
            newH = proposedH;
            newY = resizing.origY + dyMm;
          }
        }

        onUpdateObject({
          ...targetObj,
          x: Number(newX.toFixed(1)),
          y: Number(newY.toFixed(1)),
          width: Number(newW.toFixed(1)),
          height: Number(newH.toFixed(1)),
        });
      }
    }

    // Handle Rotating
    if (rotating) {
      const dx = e.clientX - rotating.centerX;
      const dy = e.clientY - rotating.centerY;
      let angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI) + 90);
      if (angle < 0) angle += 360;
      const snapInterval = 15;
      const remainder = angle % snapInterval;
      if (remainder < 3 || remainder > snapInterval - 3) {
        angle = Math.round(angle / snapInterval) * snapInterval;
      }
      const targetObj = objects.find((o) => o.id === rotating.id);
      if (targetObj) {
        onUpdateObject({ ...targetObj, rotation: angle % 360 });
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
    setRotating(null);
  };

  // Keyboard navigation & delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (!selectedObjectId) return;
      const target = objects.find((o) => o.id === selectedObjectId);
      if (!target) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDeleteObject(selectedObjectId);
      } else if (e.key === 'ArrowUp') {
        onUpdateObject({ ...target, y: Math.max(0, target.y - 0.5) });
      } else if (e.key === 'ArrowDown') {
        onUpdateObject({ ...target, y: target.y + 0.5 });
      } else if (e.key === 'ArrowLeft') {
        onUpdateObject({ ...target, x: Math.max(0, target.x - 0.5) });
      } else if (e.key === 'ArrowRight') {
        onUpdateObject({ ...target, x: target.x + 0.5 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, objects, onUpdateObject, onDeleteObject]);

  const getArtboardBorderRadius = () => {
    switch (settings.shape) {
      case 'roundedRectangle':
        return `${settings.cornerRadiusMm * pxPerMm}px`;
      case 'circle':
      case 'ellipse':
        return '50%';
      case 'rectangle':
      default:
        return '0px';
    }
  };

  // Render modern ruler marks
  const renderHorizontalRulerMarks = () => {
    const marks = [];
    const maxMm = Math.max(120, settings.templateWidthMm + 30);
    for (let mm = 0; mm <= maxMm; mm += 2) {
      const isMajor = mm % 10 === 0;
      const isMedium = mm % 5 === 0 && !isMajor;
      const left = mm * pxPerMm;
      marks.push(
        <div
          key={`h-${mm}`}
          className="absolute bottom-0"
          style={{
            left: `${left}px`,
            width: '1px',
            height: isMajor ? '12px' : isMedium ? '8px' : '4px',
            backgroundColor: isMajor ? '#64748b' : '#cbd5e1',
          }}
        >
          {isMajor && (
            <span className="absolute -top-3.5 left-0.5 text-[10px] font-mono text-slate-500 font-semibold leading-none">
              {mm}
            </span>
          )}
        </div>
      );
    }
    return marks;
  };

  const renderVerticalRulerMarks = () => {
    const marks = [];
    const maxMm = Math.max(120, settings.templateHeightMm + 30);
    for (let mm = 0; mm <= maxMm; mm += 2) {
      const isMajor = mm % 10 === 0;
      const isMedium = mm % 5 === 0 && !isMajor;
      const top = mm * pxPerMm;
      marks.push(
        <div
          key={`v-${mm}`}
          className="absolute right-0"
          style={{
            top: `${top}px`,
            height: '1px',
            width: isMajor ? '12px' : isMedium ? '8px' : '4px',
            backgroundColor: isMajor ? '#64748b' : '#cbd5e1',
          }}
        >
          {isMajor && (
            <span className="absolute -top-1.5 right-3.5 text-[10px] font-mono text-slate-500 font-semibold leading-none">
              {mm}
            </span>
          )}
        </div>
      );
    }
    return marks;
  };

  const handleClasses: Record<string, string> = {
    nw: '-top-1.5 -left-1.5 cursor-nw-resize',
    n: '-top-1.5 left-[calc(50%-5px)] cursor-n-resize',
    ne: '-top-1.5 -right-1.5 cursor-ne-resize',
    e: 'top-[calc(50%-5px)] -right-1.5 cursor-e-resize',
    se: '-bottom-1.5 -right-1.5 cursor-se-resize',
    s: '-bottom-1.5 left-[calc(50%-5px)] cursor-s-resize',
    sw: '-bottom-1.5 -left-1.5 cursor-sw-resize',
    w: 'top-[calc(50%-5px)] -left-1.5 cursor-w-resize',
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden relative select-none canvas-dot-grid"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Modern Horizontal Ruler */}
      <div className="flex h-6 bg-white border-b border-slate-200/80 shrink-0 z-10 shadow-xs">
        <div className="w-6 h-6 bg-slate-50 border-r border-slate-200/80 shrink-0 flex items-center justify-center text-[10px] font-mono text-slate-500 font-bold">
          mm
        </div>
        <div className="flex-1 h-6 relative overflow-hidden bg-white">
          {renderHorizontalRulerMarks()}
          <div
            className="absolute top-0 bottom-0 w-px bg-blue-600 pointer-events-none transition-transform duration-75"
            style={{ left: `${Math.max(0, cursorPos.xMm) * pxPerMm}px` }}
          />
        </div>
      </div>

      {/* Center Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Modern Vertical Ruler */}
        <div className="w-6 bg-white border-r border-slate-200/80 shrink-0 relative overflow-hidden z-10 shadow-xs">
          {renderVerticalRulerMarks()}
          <div
            className="absolute left-0 right-0 h-px bg-blue-600 pointer-events-none transition-transform duration-75"
            style={{ top: `${Math.max(0, cursorPos.yMm) * pxPerMm}px` }}
          />
        </div>

        {/* Scrollable Canvas Viewport */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center relative p-16"
          onContextMenu={(e) => handleContextMenu(e, null)}
          onClick={(e) => {
            if (e.target === e.currentTarget || e.target === artboardRef.current) {
              onSelectObject(null);
            }
          }}
        >
          {/* Label Artboard */}
          <div
            ref={artboardRef}
            className="relative bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/10 rounded-lg transition-all duration-100"
            onContextMenu={(e) => handleContextMenu(e, null)}
            onDoubleClick={() => onOpenPageSetup?.()}
            title="Double-click to open Page Setup"
            style={{
              width: `${labelWidthPx}px`,
              height: `${labelHeightPx}px`,
              borderRadius: getArtboardBorderRadius(),
              backgroundColor: settings.useBackgroundColor ? settings.backgroundColor : '#ffffff',
              backgroundImage:
                settings.useBackgroundPicture && settings.backgroundPictureUrl
                  ? `url(${settings.backgroundPictureUrl})`
                  : undefined,
              backgroundSize: 'cover',
            }}
          >
            {/* Grid overlay */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none rounded-inherit"
                style={{
                  backgroundSize: '12px 12px',
                  backgroundImage:
                    'linear-gradient(to right, rgba(148, 163, 184, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.25) 1px, transparent 1px)',
                }}
              />
            )}

            {/* Template watermark image */}
            {settings.useTemplateImage && settings.templateImageUrl && (
              <img
                src={settings.templateImageUrl}
                alt="Template watermark"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ opacity: (settings.templateImageOpacity || 40) / 100 }}
              />
            )}

            {/* Canvas Objects */}
            {objects.map((obj) => {
              const isSelected = selectedObjectId === obj.id;
              const objLeftPx = obj.x * pxPerMm;
              const objTopPx = obj.y * pxPerMm;
              const objWidthPx = obj.width * pxPerMm;
              const objHeightPx = obj.height * pxPerMm;

              return (
                <div
                  key={obj.id}
                  className={`absolute cursor-move select-none ${
                    isSelected ? 'ring-2 ring-blue-500 rounded-xs' : ''
                  }`}
                  style={{
                    left: `${objLeftPx}px`,
                    top: `${objTopPx}px`,
                    width: `${objWidthPx}px`,
                    height: `${objHeightPx}px`,
                    transform: `rotate(${obj.rotation || 0}deg)`,
                    transformOrigin: 'center center',
                    zIndex: obj.zIndex,
                  }}
                  onContextMenu={(e) => handleContextMenu(e, obj.id)}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onSelectObject(obj.id);
                    setDragging({
                      id: obj.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      origX: obj.x,
                      origY: obj.y,
                    });
                  }}
                >
                  {/* Object Render by Type */}
                  {obj.type === 'barcode' && <BarcodeItem object={obj} />}

                  {obj.type === 'text' && editingTextId === obj.id ? (
                    <input
                      type="text"
                      className="w-full h-full bg-white/95 border-2 border-blue-500 rounded-md outline-none shadow-md px-1 select-text"
                      autoFocus
                      value={obj.text}
                      style={{
                        fontFamily: obj.fontFamily,
                        fontSize: `${obj.fontSize * (zoom / 100) * 1.33}px`,
                        fontWeight: obj.bold ? 'bold' : 'normal',
                        fontStyle: obj.italic ? 'italic' : 'normal',
                        textAlign: obj.align,
                        color: obj.color,
                      }}
                      onChange={(e) => onUpdateObject({ ...obj, text: e.target.value })}
                      onBlur={() => setEditingTextId(null)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          setEditingTextId(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  ) : obj.type === 'text' ? (
                    <div
                      className="w-full h-full overflow-visible break-words leading-tight"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingTextId(obj.id);
                      }}
                      title="Double-click to edit text"
                      style={{
                        fontFamily: obj.fontFamily,
                        fontSize: `${obj.fontSize * (zoom / 100) * 1.33}px`,
                        fontWeight: obj.bold ? 'bold' : 'normal',
                        fontStyle: obj.italic ? 'italic' : 'normal',
                        textDecoration: `${obj.underline ? 'underline ' : ''}${
                          obj.strike ? 'line-through' : ''
                        }`.trim() || 'none',
                        textAlign: obj.align,
                        color: obj.color,
                        cursor: isSelected ? 'text' : 'move',
                      }}
                    >
                      {obj.text}
                    </div>
                  ) : null}

                  {obj.type === 'shape' && (() => {
                    const strokePx = (obj.strokeWidth || 0) * 0.3528 * pxPerMm;
                    return (
                      <svg width="100%" height="100%" className="block">
                        {obj.shapeType === 'roundedRectangle' && (
                          <rect
                            x="1"
                            y="1"
                            width="calc(100% - 2px)"
                            height="calc(100% - 2px)"
                            rx={obj.cornerRadius * pxPerMm}
                            fill={obj.fillColor}
                            stroke={obj.strokeColor}
                            strokeWidth={strokePx}
                          />
                        )}
                        {obj.shapeType === 'rectangle' && (
                          <rect
                            x="1"
                            y="1"
                            width="calc(100% - 2px)"
                            height="calc(100% - 2px)"
                            fill={obj.fillColor}
                            stroke={obj.strokeColor}
                            strokeWidth={strokePx}
                          />
                        )}
                        {obj.shapeType === 'ellipse' && (
                          <ellipse
                            cx="50%"
                            cy="50%"
                            rx="calc(50% - 2px)"
                            ry="calc(50% - 2px)"
                            fill={obj.fillColor}
                            stroke={obj.strokeColor}
                            strokeWidth={strokePx}
                          />
                        )}
                      </svg>
                    );
                  })()}

                  {obj.type === 'line' && (() => {
                    const isVertical = obj.orientation === 'vertical' || obj.height > obj.width;
                    const strokePx = Math.max(1, (obj.strokeWidth || 1) * 0.3528 * pxPerMm);
                    return (
                      <svg width="100%" height="100%" className="block overflow-visible">
                        {isVertical ? (
                          <line
                            x1="50%"
                            y1="0"
                            x2="50%"
                            y2="100%"
                            stroke={obj.strokeColor}
                            strokeWidth={strokePx}
                          />
                        ) : (
                          <line
                            x1="0"
                            y1="50%"
                            x2="100%"
                            y2="50%"
                            stroke={obj.strokeColor}
                            strokeWidth={strokePx}
                          />
                        )}
                      </svg>
                    );
                  })()}

                  {obj.type === 'image' && (
                    <img
                      src={obj.src}
                      alt="Label graphic"
                      className="w-full h-full block"
                      style={{ objectFit: obj.objectFit }}
                    />
                  )}

                  {/* 8 Resize Handles & Rotate Handle when selected */}
                  {isSelected && (
                    <>
                      {/* Rotate Handle */}
                      <div className="absolute -top-4 left-1/2 w-px h-3 bg-blue-500 z-[101] pointer-events-none" />
                      <div
                        className="absolute -top-6 left-[calc(50%-6px)] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-md z-[102] cursor-grab flex items-center justify-center transition-transform hover:scale-125"
                        title={`Drag to Rotate (Current: ${obj.rotation || 0}°)`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const el = e.currentTarget.parentElement;
                          if (el) {
                            const rect = el.getBoundingClientRect();
                            setRotating({
                              id: obj.id,
                              centerX: rect.left + rect.width / 2,
                              centerY: rect.top + rect.height / 2,
                            });
                          }
                        }}
                      />

                      {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((h) => (
                        <div
                          key={h}
                          className={`absolute w-2.5 h-2.5 bg-white border-2 border-blue-600 rounded-xs shadow-xs z-[100] transition-transform hover:scale-125 ${handleClasses[h]}`}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setResizing({
                              id: obj.id,
                              handle: h,
                              startX: e.clientX,
                              startY: e.clientY,
                              origX: obj.x,
                              origY: obj.y,
                              origW: obj.width,
                              origH: obj.height,
                            });
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Modern Floating Canvas HUD Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xl text-sm z-20">
            <button
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              onClick={() => onSetZoom?.(Math.max(zoom - 50, 50))}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-slate-800 text-sm px-2 min-w-[50px] text-center">
              {zoom}%
            </span>
            <button
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              onClick={() => onSetZoom?.(Math.min(zoom + 50, 800))}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              onClick={() => onSetZoom?.(439)}
              title="Reset Zoom to 439%"
            >
              Fit
            </button>
            <button
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                showGrid ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
              onClick={onToggleGrid}
              title="Toggle Grid (Ctrl+G)"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Modern Right-Click Context Menu ─── */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[1500] bg-transparent"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            className="fixed z-[1501] w-72 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 select-none animate-in fade-in zoom-in-95 duration-100 text-sm"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            {!contextMenu.targetObjectId ? (
              // ─── Canvas / Screen Right-Click Menu ───
              <div className="space-y-1">
                <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Label Studio Options
                </div>

                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition cursor-pointer text-sm"
                  onClick={() => {
                    setContextMenu(null);
                    onOpenPageSetup?.();
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings2 className="w-4.5 h-4.5 text-blue-600" />
                    <span>Change Layout (Page Setup)</span>
                  </div>
                  <kbd className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    Ctrl+J
                  </kbd>
                </button>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 my-1 space-y-1.5">
                  <div className="text-xs font-bold text-slate-500 uppercase">Quick Size (mm)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                      <span className="text-xs font-bold text-slate-400">W</span>
                      <input
                        type="number"
                        className="w-full bg-transparent text-sm text-right font-mono outline-none font-medium text-slate-800"
                        value={settings.templateWidthMm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 5;
                          onUpdateSettings?.({ templateWidthMm: val, manualTemplateSize: true });
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                      <span className="text-xs font-bold text-slate-400">H</span>
                      <input
                        type="number"
                        className="w-full bg-transparent text-sm text-right font-mono outline-none font-medium text-slate-800"
                        value={settings.templateHeightMm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 5;
                          onUpdateSettings?.({ templateHeightMm: val, manualTemplateSize: true });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer text-sm"
                  onClick={() => {
                    setContextMenu(null);
                    onToggleGrid?.();
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Grid className="w-4.5 h-4.5 text-slate-500" />
                    <span>{showGrid ? 'Hide Gridlines' : 'Show Gridlines'}</span>
                  </div>
                  <kbd className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    Ctrl+G
                  </kbd>
                </button>

                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer text-sm"
                  onClick={() => {
                    setContextMenu(null);
                    onSetZoom?.(439);
                  }}
                >
                  <Maximize2 className="w-4.5 h-4.5 text-slate-500" />
                  <span>Reset Zoom (439%)</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-600 hover:text-white transition cursor-pointer group text-sm"
                  onClick={() => {
                    setContextMenu(null);
                    onPrint?.();
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-4.5 h-4.5 text-blue-600 group-hover:text-white" />
                    <span className="font-semibold">Print Label...</span>
                  </div>
                  <kbd className="text-xs font-mono text-slate-400 group-hover:text-blue-100 bg-slate-100 group-hover:bg-blue-700 px-1.5 py-0.5 rounded-md">
                    Ctrl+P
                  </kbd>
                </button>
              </div>
            ) : (
              // ─── Object Right-Click Menu ───
              <div className="space-y-1">
                <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Element Actions
                </div>

                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer text-sm"
                  onClick={() => {
                    const target = objects.find((o) => o.id === contextMenu.targetObjectId);
                    if (target) {
                      onUpdateObject({ ...target, rotation: (((target.rotation || 0) + 90) % 360) });
                    }
                    setContextMenu(null);
                  }}
                >
                  <RotateCw className="w-4.5 h-4.5 text-blue-600" />
                  <span>Rotate 90° Clockwise</span>
                </button>

                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer text-sm"
                  onClick={() => {
                    if (contextMenu.targetObjectId) {
                      onDuplicateObject?.(contextMenu.targetObjectId);
                    }
                    setContextMenu(null);
                  }}
                >
                  <Copy className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Duplicate Element</span>
                </button>

                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition cursor-pointer text-sm font-medium"
                  onClick={() => {
                    if (contextMenu.targetObjectId) {
                      onDeleteObject(contextMenu.targetObjectId);
                    }
                    setContextMenu(null);
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4.5 h-4.5 text-rose-500" />
                    <span>Delete Element</span>
                  </div>
                  <kbd className="text-xs font-mono text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded-md">
                    Del
                  </kbd>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer text-sm"
                  onClick={() => {
                    setContextMenu(null);
                    onOpenPageSetup?.();
                  }}
                >
                  <Sliders className="w-4.5 h-4.5 text-slate-500" />
                  <span>Document Layout...</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
