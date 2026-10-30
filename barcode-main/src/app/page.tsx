'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  WizardSettings,
  CanvasObject,
  DocumentState,
  BarcodeFormat,
  BarcodeObject,
  TextObject,
  ShapeObject,
  LineObject,
} from '@/types/barcode-agentwarebot';
import { DEFAULT_WIZARD_SETTINGS, SAMPLE_AAF_OBJECTS } from '@/data/defaults';
import { NewDocumentWizard } from '@/components/Wizard/NewDocumentWizard';
import { MainToolbar } from '@/components/Toolbar/MainToolbar';
import { FormatToolbar } from '@/components/Toolbar/FormatToolbar';
import { LeftSidebar } from '@/components/Sidebar/LeftSidebar';
import { LabelCanvas } from '@/components/Canvas/LabelCanvas';
import { RightPropertiesPanel } from '@/components/Sidebar/RightPropertiesPanel';
import { Form1View } from '@/components/FormView/Form1View';
import { PrintModal } from '@/components/Modals/PrintModal';
import { BatchModal } from '@/components/Modals/BatchModal';
import { PrinterPropertiesModal } from '@/components/Modals/PrinterPropertiesModal';
import { DocumentPropertiesModal } from '@/components/Modals/DocumentPropertiesModal';
import { PageSetupModal } from '@/components/Modals/PageSetupModal';

import {
  ScanBarcode,
  FilePlus,
  FolderOpen,
  Save,
  Printer,
  Sliders,
  Undo2,
  Redo2,
  Trash2,
  Grid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Barcode,
  QrCode,
  Type,
  Minus,
  Square,
  ArrowUp,
  ArrowDown,
  FormInput,
  Layers,
  HelpCircle,
  X,
  Plus,
  ChevronDown,
  Check,
  Sparkles,
  Download,
  Image as ImageIcon,
  FileCode,
} from 'lucide-react';

type ActiveMenu =
  | 'File'
  | 'Edit'
  | 'View'
  | 'Create'
  | 'Arrange'
  | 'Administer'
  | 'Tools'
  | 'Window'
  | 'Help'
  | null;

export default function BarcodeAgentwarebotApp() {
  // ─── Documents state ──────
  const [documents, setDocuments] = useState<DocumentState[]>([
    {
      id: 'doc-aaf',
      name: 'AAF.btw',
      isDirty: false,
      settings: { ...DEFAULT_WIZARD_SETTINGS },
      objects: [...SAMPLE_AAF_OBJECTS],
      selectedObjectId: null,
    },
    {
      id: 'doc-1',
      name: 'Document1.btw',
      isDirty: true,
      settings: {
        ...DEFAULT_WIZARD_SETTINGS,
        templateWidthMm: 25.4,
        templateHeightMm: 38.1,
        shape: 'roundedRectangle',
        cornerRadiusMm: 3.0,
      },
      objects: [
        {
          id: 'doc1-bc-1',
          type: 'barcode',
          x: 2.2,
          y: 6.0,
          width: 21.0,
          height: 18.0,
          rotation: 0,
          zIndex: 1,
          format: 'CODE128',
          value: 'TT065-50-A',
          barWidth: 1.2,
          displayValue: true,
          fgColor: '#000000',
          bgColor: '#ffffff',
          fontSize: 8,
        },
      ],
      selectedObjectId: 'doc1-bc-1',
    },
  ]);

  const [activeDocId, setActiveDocId] = useState<string>('doc-1');
  const [activeSheetTab, setActiveSheetTab] = useState<'template' | 'form'>('template');
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [zoom, setZoom] = useState<number>(439); // 439% default
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Formatting state
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [fontSize, setFontSize] = useState<number>(12);
  const [bold, setBold] = useState<boolean>(false);
  const [italic, setItalic] = useState<boolean>(false);
  const [underline, setUnderline] = useState<boolean>(false);
  const [strike, setStrike] = useState<boolean>(false);
  const [color, setColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [align, setAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [lineWidth, setLineWidth] = useState<number>(1.0);

  // Modals state
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showPrinterProps, setShowPrinterProps] = useState<boolean>(false);
  const [showDocProps, setShowDocProps] = useState<boolean>(false);
  const [showPageSetup, setShowPageSetup] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Intercept Ctrl+P to open Print dialog and Ctrl+J to open Page Setup / Layout
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
        setShowPrintModal(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        e.stopPropagation();
        setShowPageSetup(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        e.stopPropagation();
        setShowWizard(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        updateCurrentDoc({ isDirty: false });
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
  }, []);

  // Active Document helper
  const currentDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  const updateCurrentDoc = (updates: Partial<DocumentState>) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === activeDocId ? { ...doc, ...updates, isDirty: true } : doc))
    );
  };

  const handleUpdateSettings = (updates: Partial<WizardSettings>) => {
    if (!currentDoc) return;
    updateCurrentDoc({
      settings: {
        ...currentDoc.settings,
        ...updates,
      },
    });
  };

  const handleDuplicateObject = (objId: string) => {
    if (!currentDoc) return;
    const orig = currentDoc.objects.find((o) => o.id === objId);
    if (!orig) return;
    const newId = `${orig.type}-${Date.now()}`;
    const duplicated: CanvasObject = {
      ...orig,
      id: newId,
      x: orig.x + 2,
      y: orig.y + 2,
      zIndex: currentDoc.objects.length + 1,
    };
    updateCurrentDoc({
      objects: [...currentDoc.objects, duplicated],
      selectedObjectId: newId,
    });
  };

  const handleReorderObject = (objId: string, direction: 'up' | 'down') => {
    if (!currentDoc) return;
    const sorted = [...currentDoc.objects].sort((a, b) => a.zIndex - b.zIndex);
    const index = sorted.findIndex((o) => o.id === objId);
    if (index === -1) return;

    if (direction === 'up' && index < sorted.length - 1) {
      // Bring forward: swap with object above
      const currZ = sorted[index].zIndex;
      const nextZ = sorted[index + 1].zIndex;
      sorted[index].zIndex = nextZ;
      sorted[index + 1].zIndex = currZ;
      updateCurrentDoc({ objects: sorted });
    } else if (direction === 'down' && index > 0) {
      // Send backward: swap with object below
      const currZ = sorted[index].zIndex;
      const prevZ = sorted[index - 1].zIndex;
      sorted[index].zIndex = prevZ;
      sorted[index - 1].zIndex = currZ;
      updateCurrentDoc({ objects: sorted });
    }
  };

  const selectedObject = currentDoc?.objects.find((o) => o.id === currentDoc.selectedObjectId) || null;

  // Sync format bar with selected object
  useEffect(() => {
    if (selectedObject && selectedObject.type === 'text') {
      const txt = selectedObject as TextObject;
      setFontFamily(txt.fontFamily);
      setFontSize(txt.fontSize);
      setBold(txt.bold);
      setItalic(txt.italic);
      setUnderline(txt.underline);
      setStrike(txt.strike);
      setColor(txt.color);
      setAlign(txt.align);
    } else if (selectedObject && (selectedObject.type === 'line' || selectedObject.type === 'shape')) {
      const strokeObj = selectedObject as LineObject | ShapeObject;
      setLineWidth(strokeObj.strokeWidth || 1.0);
      setColor(strokeObj.strokeColor || '#000000');
    }
  }, [selectedObject]);

  // Handle Wizard creation
  const handleWizardFinish = (newSettings: WizardSettings) => {
    const finalSettings = { ...newSettings };
    if (finalSettings.autoFitPageToLabels || (finalSettings.pageSizePreset === 'User Defined Size' && finalSettings.autoFitPageToLabels !== false)) {
      const r = finalSettings.itemsPerPageType === 'single' ? 1 : Math.max(1, finalSettings.rows);
      const c = finalSettings.itemsPerPageType === 'single' ? 1 : Math.max(1, finalSettings.cols);
      const left = finalSettings.hasUnusedMaterial ? (finalSettings.unusedLeftMm || 0) : 0;
      const right = finalSettings.hasUnusedMaterial ? (finalSettings.unusedRightMm || 0) : 0;
      const top = finalSettings.hasUnusedMaterial ? (finalSettings.unusedTopMm || 0) : 0;
      const bottom = finalSettings.hasUnusedMaterial ? (finalSettings.unusedBottomMm || 0) : 0;
      const totalHGap = (c - 1) * (finalSettings.horizGapMm || 0);
      const totalVGap = (r - 1) * (finalSettings.vertGapMm || 0);

      const neededW = Number((left + (c * (finalSettings.templateWidthMm || 10)) + totalHGap + right).toFixed(1));
      const neededH = Number((top + (r * (finalSettings.templateHeightMm || 10)) + totalVGap + bottom).toFixed(1));
      finalSettings.pageWidthMm = neededW;
      finalSettings.pageHeightMm = neededH;
      finalSettings.autoFitPageToLabels = true;
    }

    const newDocId = `doc-${Date.now()}`;
    const newDocName = `Document${documents.length + 1}.btw`;

    const initialObjects: CanvasObject[] = [
      {
        id: `bc-new-${Date.now()}`,
        type: 'barcode',
        x: Math.max(1, (finalSettings.templateWidthMm - 21) / 2),
        y: Math.max(2, (finalSettings.templateHeightMm - 16) / 2),
        width: Math.min(finalSettings.templateWidthMm - 4, 21),
        height: Math.min(finalSettings.templateHeightMm - 6, 16),
        rotation: 0,
        zIndex: 1,
        format: 'CODE128',
        value: '12345678',
        barWidth: 1.2,
        displayValue: true,
        fgColor: '#000000',
        bgColor: '#ffffff',
        fontSize: 8,
      },
    ];

    const newDoc: DocumentState = {
      id: newDocId,
      name: newDocName,
      isDirty: true,
      settings: finalSettings,
      objects: initialObjects,
      selectedObjectId: initialObjects[0].id,
    };

    setDocuments((prev) => [...prev, newDoc]);
    setActiveDocId(newDocId);
    setShowWizard(false);
  };

  // Object addition handlers
  const handleAddBarcode = (format: BarcodeFormat) => {
    const newId = `bc-${Date.now()}`;
    const newBarcode: BarcodeObject = {
      id: newId,
      type: 'barcode',
      x: 2.0,
      y: 5.0,
      width: Math.min(currentDoc.settings.templateWidthMm - 4, 21),
      height: Math.min(currentDoc.settings.templateHeightMm - 8, 16),
      rotation: 0,
      zIndex: currentDoc.objects.length + 1,
      format,
      value: format === 'QR' ? 'https://example.com' : 'ABC-89421',
      barWidth: 1.2,
      displayValue: format !== 'QR',
      fgColor: '#000000',
      bgColor: '#ffffff',
      fontSize: 8,
    };

    updateCurrentDoc({
      objects: [...currentDoc.objects, newBarcode],
      selectedObjectId: newId,
    });
    setActiveTool('select');
  };

  const handleAddText = () => {
    const newId = `txt-${Date.now()}`;
    const defaultW = Math.min(12, Math.max(6, currentDoc.settings.templateWidthMm * 0.45));
    const newText: TextObject = {
      id: newId,
      type: 'text',
      x: 2.0,
      y: 2.0,
      width: Number(defaultW.toFixed(1)),
      height: 4.5,
      rotation: 0,
      zIndex: currentDoc.objects.length + 1,
      text: 'Sample Text',
      fontFamily,
      fontSize,
      bold,
      italic,
      underline,
      strike,
      align,
      color,
    };

    updateCurrentDoc({
      objects: [...currentDoc.objects, newText],
      selectedObjectId: newId,
    });
    setActiveTool('select');
  };

  const handleAddShape = (shapeType: 'rectangle' | 'roundedRectangle' | 'ellipse') => {
    const newId = `shp-${Date.now()}`;
    const newShape: ShapeObject = {
      id: newId,
      type: 'shape',
      shapeType,
      x: 2.0,
      y: 2.0,
      width: Math.min(currentDoc.settings.templateWidthMm - 4, 20),
      height: Math.min(currentDoc.settings.templateHeightMm - 4, 20),
      rotation: 0,
      zIndex: currentDoc.objects.length + 1,
      fillColor: 'transparent',
      strokeColor: '#000000',
      strokeWidth: lineWidth,
      cornerRadius: 3.0,
    };

    updateCurrentDoc({
      objects: [...currentDoc.objects, newShape],
      selectedObjectId: newId,
    });
    setActiveTool('select');
  };

  const handleAddLine = () => {
    const newId = `line-${Date.now()}`;
    const newLine: LineObject = {
      id: newId,
      type: 'line',
      x: 2.0,
      y: 10.0,
      width: Math.min(currentDoc.settings.templateWidthMm - 4, 21),
      height: 1.0,
      rotation: 0,
      zIndex: currentDoc.objects.length + 1,
      strokeColor: '#000000',
      strokeWidth: lineWidth,
      orientation: 'horizontal',
    };

    updateCurrentDoc({
      objects: [...currentDoc.objects, newLine],
      selectedObjectId: newId,
    });
    setActiveTool('select');
  };

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newId = `img-${Date.now()}`;
          updateCurrentDoc({
            objects: [
              ...currentDoc.objects,
              {
                id: newId,
                type: 'image',
                x: 2.0,
                y: 2.0,
                width: 15.0,
                height: 15.0,
                rotation: 0,
                zIndex: currentDoc.objects.length + 1,
                src: event.target?.result as string,
                objectFit: 'contain',
              },
            ],
            selectedObjectId: newId,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleUpdateObject = (updated: CanvasObject) => {
    updateCurrentDoc({
      objects: currentDoc.objects.map((o) => (o.id === updated.id ? updated : o)),
    });
  };

  const handleDeleteObject = (id: string) => {
    updateCurrentDoc({
      objects: currentDoc.objects.filter((o) => o.id !== id),
      selectedObjectId: null,
    });
  };

  const handleUpdateFormat = (field: keyof TextObject, val: any) => {
    if (selectedObject && selectedObject.type === 'text') {
      handleUpdateObject({ ...selectedObject, [field]: val });
    }
  };

  const handleCloseTab = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (documents.length <= 1) return;
    const remaining = documents.filter((d) => d.id !== docId);
    setDocuments(remaining);
    if (activeDocId === docId) {
      setActiveDocId(remaining[0].id);
    }
  };

  // Download high-resolution PNG
  const handleExportPng = () => {
    const svgElem = document.querySelector('svg.objectSvgBarcode');
    if (svgElem) {
      const blob = new Blob([new XMLSerializer().serializeToString(svgElem)], { type: 'image/svg+xml' });
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width * 3;
        c.height = img.height * 3;
        const ctx = c.getContext('2d')!;
        ctx.scale(3, 3);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const a = document.createElement('a');
        a.download = `${currentDoc.name.replace(/\.btw.*/, '')}-label.png`;
        a.href = c.toDataURL('image/png');
        a.click();
      };
      img.src = url;
    } else {
      window.print();
    }
  };

  // Download vector SVG
  const handleExportSvg = () => {
    const svgElem = document.querySelector('svg.objectSvgBarcode');
    if (svgElem) {
      const blob = new Blob([new XMLSerializer().serializeToString(svgElem)], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.download = `${currentDoc.name.replace(/\.btw.*/, '')}-label.svg`;
      a.href = URL.createObjectURL(blob);
      a.click();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 text-sm text-slate-800 select-none font-sans">
      {/* ─── Modern Top Studio Navigation Bar ──────────────────────────────── */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 text-slate-200 px-4 flex items-center justify-between shrink-0 select-none z-[500]">
        {/* Left: Brand + Menus */}
        <div className="flex items-center gap-3.5">
          {/* Logo badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 shadow-md shadow-blue-500/25 p-1.5 text-white flex items-center justify-center font-bold ring-1 ring-white/10">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                Barcode Agentwarebot
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                Studio Pro
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* Menus */}
          <nav className="flex items-center gap-1" ref={menuRef}>
            {(
              ['File', 'Edit', 'View', 'Create', 'Arrange', 'Administer', 'Tools', 'Window', 'Help'] as ActiveMenu[]
            ).map((menuName) => (
              <div key={menuName!} className="relative">
                <button
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                    activeMenu === menuName
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                  onClick={() => setActiveMenu(activeMenu === menuName ? null : menuName)}
                >
                  {menuName}
                </button>

                {/* Dropdown Card */}
                {activeMenu === menuName && (
                  <div className="absolute top-full left-0 mt-1.5 min-w-[260px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 z-[600] animate-in fade-in zoom-in-95 duration-100 text-slate-200">
                    {menuName === 'File' && (
                      <div className="space-y-1">
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            setActiveMenu(null);
                            setShowWizard(true);
                          }}
                        >
                          <FilePlus className="w-4 h-4 text-blue-400 group-hover:text-white" />
                          <span>New Document Wizard...</span>
                          <kbd className="ml-auto text-xs font-mono text-slate-400 group-hover:text-blue-100 bg-slate-800 group-hover:bg-blue-700 px-2 py-0.5 rounded">
                            Ctrl+N
                          </kbd>
                        </button>

                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => setActiveMenu(null)}
                        >
                          <FolderOpen className="w-4 h-4 text-amber-400 group-hover:text-white" />
                          <span>Open Document...</span>
                          <kbd className="ml-auto text-xs font-mono text-slate-400 group-hover:text-blue-100 bg-slate-800 group-hover:bg-blue-700 px-2 py-0.5 rounded">
                            Ctrl+O
                          </kbd>
                        </button>

                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            updateCurrentDoc({ isDirty: false });
                            setActiveMenu(null);
                          }}
                        >
                          <Save className="w-4 h-4 text-emerald-400 group-hover:text-white" />
                          <span>Save Changes</span>
                          <kbd className="ml-auto text-xs font-mono text-slate-400 group-hover:text-blue-100 bg-slate-800 group-hover:bg-blue-700 px-2 py-0.5 rounded">
                            Ctrl+S
                          </kbd>
                        </button>

                        <div className="h-px bg-slate-800 my-1" />

                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            setActiveMenu(null);
                            setShowPageSetup(true);
                          }}
                        >
                          <Sliders className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          <span>Page Setup (Change Layout)...</span>
                          <kbd className="ml-auto text-xs font-mono text-slate-400 group-hover:text-blue-100 bg-slate-800 group-hover:bg-blue-700 px-2 py-0.5 rounded">
                            Ctrl+J
                          </kbd>
                        </button>

                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            setActiveMenu(null);
                            setShowPrintModal(true);
                          }}
                        >
                          <Printer className="w-4 h-4 text-purple-400 group-hover:text-white" />
                          <span>Print Label Sheet...</span>
                          <kbd className="ml-auto text-xs font-mono text-slate-400 group-hover:text-blue-100 bg-slate-800 group-hover:bg-blue-700 px-2 py-0.5 rounded">
                            Ctrl+P
                          </kbd>
                        </button>
                      </div>
                    )}

                    {menuName === 'Edit' && (
                      <div className="space-y-1">
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => setActiveMenu(null)}
                        >
                          <Undo2 className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          <span>Undo</span>
                          <kbd className="ml-auto text-xs font-mono text-slate-400 group-hover:text-blue-100 bg-slate-800 group-hover:bg-blue-700 px-2 py-0.5 rounded">
                            Ctrl+Z
                          </kbd>
                        </button>

                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => setActiveMenu(null)}
                        >
                          <Redo2 className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          <span>Redo</span>
                          <kbd className="ml-auto text-xs font-mono text-slate-400 group-hover:text-blue-100 bg-slate-800 group-hover:bg-blue-700 px-2 py-0.5 rounded">
                            Ctrl+Y
                          </kbd>
                        </button>

                        <div className="h-px bg-slate-800 my-1" />

                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-rose-600 hover:text-white text-rose-400 transition text-sm group"
                          onClick={() => {
                            if (selectedObject) handleDeleteObject(selectedObject.id);
                            setActiveMenu(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-rose-400 group-hover:text-white" />
                          <span>Delete Selection</span>
                          <kbd className="ml-auto text-xs font-mono text-rose-300 group-hover:text-white bg-slate-800 group-hover:bg-rose-700 px-2 py-0.5 rounded">
                            Del
                          </kbd>
                        </button>
                      </div>
                    )}

                    {menuName === 'View' && (
                      <div className="space-y-1">
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            setShowGrid(!showGrid);
                            setActiveMenu(null);
                          }}
                        >
                          <Grid className="w-4 h-4 text-blue-400 group-hover:text-white" />
                          <span>{showGrid ? 'Hide Gridlines' : 'Show Gridlines'}</span>
                          <kbd className="ml-auto text-xs font-mono text-slate-400 group-hover:text-blue-100 bg-slate-800 group-hover:bg-blue-700 px-2 py-0.5 rounded">
                            Ctrl+G
                          </kbd>
                        </button>

                        <div className="h-px bg-slate-800 my-1" />

                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            setZoom((z) => Math.min(z + 50, 800));
                            setActiveMenu(null);
                          }}
                        >
                          <ZoomIn className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          <span>Zoom In (+50%)</span>
                        </button>

                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            setZoom((z) => Math.max(z - 50, 50));
                            setActiveMenu(null);
                          }}
                        >
                          <ZoomOut className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          <span>Zoom Out (-50%)</span>
                        </button>

                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            setZoom(439);
                            setActiveMenu(null);
                          }}
                        >
                          <Maximize2 className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          <span>Default Studio Zoom (439%)</span>
                        </button>
                      </div>
                    )}

                    {menuName === 'Create' && (
                      <div className="space-y-1">
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            handleAddBarcode('CODE128');
                            setActiveMenu(null);
                          }}
                        >
                          <Barcode className="w-4 h-4 text-blue-400 group-hover:text-white" />
                          <span>Barcode (Code 128)</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            handleAddBarcode('QR');
                            setActiveMenu(null);
                          }}
                        >
                          <QrCode className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                          <span>2D QR Code</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            handleAddText();
                            setActiveMenu(null);
                          }}
                        >
                          <Type className="w-4 h-4 text-emerald-400 group-hover:text-white" />
                          <span>Text Object</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            handleAddLine();
                            setActiveMenu(null);
                          }}
                        >
                          <Minus className="w-4 h-4 text-purple-400 group-hover:text-white" />
                          <span>Horizontal Line</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            handleAddShape('roundedRectangle');
                            setActiveMenu(null);
                          }}
                        >
                          <Square className="w-4 h-4 text-amber-400 group-hover:text-white" />
                          <span>Rounded Rectangle</span>
                        </button>
                      </div>
                    )}

                    {menuName === 'Arrange' && (
                      <div className="space-y-1">
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            if (selectedObject) handleUpdateObject({ ...selectedObject, zIndex: 100 });
                            setActiveMenu(null);
                          }}
                        >
                          <ArrowUp className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          <span>Bring to Front</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            if (selectedObject) handleUpdateObject({ ...selectedObject, zIndex: 1 });
                            setActiveMenu(null);
                          }}
                        >
                          <ArrowDown className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          <span>Send to Back</span>
                        </button>
                      </div>
                    )}

                    {menuName === 'Administer' && (
                      <div className="space-y-1">
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            setShowPrinterProps(true);
                            setActiveMenu(null);
                          }}
                        >
                          <Printer className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          <span>Printer Driver Setup...</span>
                        </button>
                      </div>
                    )}

                    {menuName === 'Tools' && (
                      <div className="space-y-1">
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            setShowBatchModal(true);
                            setActiveMenu(null);
                          }}
                        >
                          <Layers className="w-4 h-4 text-purple-400 group-hover:text-white" />
                          <span>Batch Barcode Wizard...</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            setActiveSheetTab('form');
                            setActiveMenu(null);
                          }}
                        >
                          <FormInput className="w-4 h-4 text-emerald-400 group-hover:text-white" />
                          <span>Data Entry Form (Form 1)</span>
                        </button>
                      </div>
                    )}

                    {menuName === 'Window' && (
                      <div className="space-y-1">
                        {documents.map((d) => (
                          <button
                            key={d.id}
                            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm ${
                              activeDocId === d.id ? 'bg-blue-600/30 text-white font-semibold' : ''
                            }`}
                            onClick={() => {
                              setActiveDocId(d.id);
                              setActiveMenu(null);
                            }}
                          >
                            <span className="w-4 flex items-center justify-center">
                              {activeDocId === d.id && <Check className="w-4 h-4 text-blue-400" />}
                            </span>
                            <span>{d.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {menuName === 'Help' && (
                      <div className="space-y-1">
                        <button
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-sm group"
                          onClick={() => {
                            alert(
                              'Barcode Agentwarebot Studio\nModern high-precision barcode and thermal label designer.'
                            );
                            setActiveMenu(null);
                          }}
                        >
                          <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          <span>About Barcode Agentwarebot</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Center: Active Document Status Indicator */}
        <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 bg-slate-800/80 rounded-full border border-slate-700/80 text-xs">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              currentDoc.isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <span className="font-semibold text-slate-100">{currentDoc.name}</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {currentDoc.settings.templateWidthMm} × {currentDoc.settings.templateHeightMm}mm
          </span>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPageSetup(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Page Setup / Layout (Ctrl+J)"
          >
            <Sliders className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Page Setup</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-sm shadow-blue-500/25 transition active:scale-95"
            title="Print Label (Ctrl+P)"
          >
            <Printer className="w-4.5 h-4.5" />
            <span>Print Label</span>
          </button>
        </div>
      </header>

      {/* ─── Document Tab Strip (Modern Studio Tabs) ────────────────────────── */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-end gap-1.5 shrink-0 overflow-x-auto">
        {documents.map((d) => {
          const isActive = d.id === activeDocId;
          return (
            <div
              key={d.id}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-t-xl text-sm font-medium cursor-pointer transition-all ${
                isActive
                  ? 'bg-white text-slate-900 border-t-2 border-t-blue-600 shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              onClick={() => setActiveDocId(d.id)}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  d.isDirty ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <span>{d.name}</span>
              <button
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
                onClick={(e) => handleCloseTab(d.id, e)}
                title="Close Document"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        <button
          className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
          onClick={() => setShowWizard(true)}
          title="Create New Label Document (Ctrl+N)"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Ribbon Toolbars ─────────────────────────────────────────────── */}
      <MainToolbar
        onNew={() => setShowWizard(true)}
        onOpen={() => alert('Open document: Please select a file from local templates.')}
        onSave={() => updateCurrentDoc({ isDirty: false })}
        onPrint={() => setShowPrintModal(true)}
        onPrintPreview={() => setShowPrintModal(true)}
        onCut={() => {
          if (selectedObject) handleDeleteObject(selectedObject.id);
        }}
        onCopy={() => {}}
        onPaste={() => {}}
        onDelete={() => {
          if (selectedObject) handleDeleteObject(selectedObject.id);
        }}
        onUndo={() => {}}
        onRedo={() => {}}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onAddBarcode={handleAddBarcode}
        onAddText={handleAddText}
        onAddShape={handleAddShape}
        onAddLine={handleAddLine}
        onAddImage={handleAddImage}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(z + 50, 800))}
        onZoomOut={() => setZoom((z) => Math.max(z - 50, 50))}
        onZoom100={() => setZoom(100)}
        onZoomFit={() => setZoom(439)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
      />

      <FormatToolbar
        fontFamily={fontFamily}
        setFontFamily={(f) => {
          setFontFamily(f);
          handleUpdateFormat('fontFamily', f);
        }}
        fontSize={fontSize}
        setFontSize={(s) => {
          setFontSize(s);
          handleUpdateFormat('fontSize', s);
        }}
        bold={bold}
        setBold={(b) => {
          setBold(b);
          handleUpdateFormat('bold', b);
        }}
        italic={italic}
        setItalic={(i) => {
          setItalic(i);
          handleUpdateFormat('italic', i);
        }}
        underline={underline}
        setUnderline={(u) => {
          setUnderline(u);
          handleUpdateFormat('underline', u);
        }}
        strike={strike}
        setStrike={(s) => {
          setStrike(s);
          handleUpdateFormat('strike', s);
        }}
        color={color}
        setColor={(c) => {
          setColor(c);
          if (selectedObject && selectedObject.type === 'text') {
            handleUpdateFormat('color', c);
          } else if (selectedObject && (selectedObject.type === 'line' || selectedObject.type === 'shape')) {
            handleUpdateObject({ ...selectedObject, strokeColor: c });
          }
        }}
        bgColor={bgColor}
        setBgColor={setBgColor}
        align={align}
        setAlign={(a) => {
          setAlign(a);
          handleUpdateFormat('align', a);
        }}
        lineWidth={lineWidth}
        setLineWidth={(w) => {
          setLineWidth(w);
          if (selectedObject && (selectedObject.type === 'line' || selectedObject.type === 'shape')) {
            handleUpdateObject({ ...selectedObject, strokeWidth: w });
          }
        }}
      />

      {/* ─── Main Workspace: Left Sidebar + Canvas / Form View + Right Panel ── */}
      <div className="flex-1 flex overflow-hidden relative bg-white">
        {/* Left Sidebar: Layers, Components & Data Sources */}
        <LeftSidebar
          objects={currentDoc.objects}
          selectedObjectId={currentDoc.selectedObjectId}
          onSelectObject={(id) => updateCurrentDoc({ selectedObjectId: id })}
          onDeleteObject={handleDeleteObject}
          onDuplicateObject={handleDuplicateObject}
          onReorderObject={handleReorderObject}
          onInsertSample={(objs) => {
            updateCurrentDoc({
              objects: [...currentDoc.objects, ...objs],
              selectedObjectId: objs[0]?.id || null,
            });
          }}
          onInsertDataSource={(type, name) => {
            handleAddText();
          }}
        />

        {/* Center: Template Designer or Form 1 Data Entry */}
        {activeSheetTab === 'template' ? (
          <LabelCanvas
            settings={currentDoc.settings}
            objects={currentDoc.objects}
            selectedObjectId={currentDoc.selectedObjectId}
            onSelectObject={(id) => updateCurrentDoc({ selectedObjectId: id })}
            onUpdateObject={handleUpdateObject}
            onDeleteObject={handleDeleteObject}
            zoom={zoom}
            showGrid={showGrid}
            onMouseMoveCoords={(x, y) => setMouseCoords({ x, y })}
            onOpenPageSetup={() => setShowPageSetup(true)}
            onUpdateSettings={handleUpdateSettings}
            onToggleGrid={() => setShowGrid((g) => !g)}
            onSetZoom={(z) => setZoom(z)}
            onPrint={() => setShowPrintModal(true)}
            onOpenWizard={() => setShowWizard(true)}
            onDuplicateObject={handleDuplicateObject}
          />
        ) : (
          <Form1View
            settings={currentDoc.settings}
            objects={currentDoc.objects}
            onUpdateFieldValue={(objId, val) => {
              const target = currentDoc.objects.find((o) => o.id === objId);
              if (target) {
                if (target.type === 'barcode') handleUpdateObject({ ...target, value: val });
                if (target.type === 'text') handleUpdateObject({ ...target, text: val });
              }
            }}
            onPrint={() => setShowPrintModal(true)}
            onReturnToTemplate={() => setActiveSheetTab('template')}
          />
        )}

        {/* Right Inspector / Properties Panel */}
        <RightPropertiesPanel
          settings={currentDoc.settings}
          selectedObject={selectedObject}
          onUpdateObject={handleUpdateObject}
          onOpenBatchModal={() => setShowBatchModal(true)}
          onPrint={() => setShowPrintModal(true)}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          onOpenPageSetup={() => setShowPageSetup(true)}
          onUpdateSettings={handleUpdateSettings}
        />
      </div>

      {/* ─── Modern Bottom Status Bar ────────────────────────────────────────── */}
      <footer className="h-10 bg-white border-t border-slate-200/90 px-4 flex items-center justify-between text-xs sm:text-sm text-slate-600 shrink-0 select-none">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            className={`flex items-center gap-2 px-3.5 py-1 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
              activeSheetTab === 'template'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveSheetTab('template')}
          >
            <ScanBarcode className="w-4 h-4 text-blue-600" />
            <span>Design Studio</span>
          </button>

          <button
            className={`flex items-center gap-2 px-3.5 py-1 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
              activeSheetTab === 'form'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveSheetTab('form')}
          >
            <FormInput className="w-4 h-4 text-emerald-600" />
            <span>Form 1 (Data Entry)</span>
          </button>
        </div>

        {/* Right: Status Indicators */}
        <div className="flex items-center gap-5 text-slate-600 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span>Printer: <strong className="text-slate-800 font-semibold">{currentDoc.settings.printer}</strong></span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">Size:</span>
            <span className="text-slate-800 font-semibold">
              {currentDoc.settings.templateWidthMm.toFixed(1)} × {currentDoc.settings.templateHeightMm.toFixed(1)} mm
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 font-mono min-w-[125px]">
            <span>X: {mouseCoords.x}mm</span>
            <span className="text-slate-300">|</span>
            <span>Y: {mouseCoords.y}mm</span>
          </div>

          <div className="flex items-center gap-1 font-mono font-medium">
            <span className="text-slate-400">Zoom:</span>
            <span className="text-slate-800 font-semibold">{zoom}%</span>
          </div>
        </div>
      </footer>

      {/* ─── Modals ───────────────────────────────────────────────────────── */}
      {showWizard && (
        <NewDocumentWizard
          onFinish={handleWizardFinish}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {showPrintModal && (
        <PrintModal
          settings={currentDoc.settings}
          objects={currentDoc.objects}
          onPrinterChange={(printer) => handleUpdateSettings({ printer })}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {showBatchModal && (
        <BatchModal
          onGenerateBatch={(list) => {
            alert(`Generated ${list.length} sequential barcodes successfully!`);
          }}
          onClose={() => setShowBatchModal(false)}
        />
      )}

      {showPrinterProps && (
        <PrinterPropertiesModal
          printerName={currentDoc.settings.printer}
          onClose={() => setShowPrinterProps(false)}
        />
      )}

      {showDocProps && (
        <DocumentPropertiesModal
          printerName={currentDoc.settings.printer}
          onClose={() => setShowDocProps(false)}
        />
      )}

      {showPageSetup && (
        <PageSetupModal
          settings={currentDoc.settings}
          onSave={handleUpdateSettings}
          onClose={() => setShowPageSetup(false)}
        />
      )}
    </div>
  );
}
