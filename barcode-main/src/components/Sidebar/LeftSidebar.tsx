import React, { useState } from 'react';
import {
  CanvasObject,
  TextObject,
  BarcodeObject,
  LineObject,
  ShapeObject,
} from '@/types/barcode-agentwarebot';
import {
  Layers,
  Database,
  Tag,
  Package,
  QrCode,
  Barcode,
  Hash,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Type,
  Minus,
  Square,
  Image as ImageIcon,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';

interface LeftSidebarProps {
  objects?: CanvasObject[];
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
  onDeleteObject?: (id: string) => void;
  onDuplicateObject?: (id: string) => void;
  onReorderObject?: (id: string, direction: 'up' | 'down') => void;
  onInsertSample: (objects: CanvasObject[]) => void;
  onInsertDataSource: (type: string, name: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  objects = [],
  selectedObjectId = null,
  onSelectObject,
  onDeleteObject,
  onDuplicateObject,
  onReorderObject,
  onInsertSample,
  onInsertDataSource,
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'components' | 'dataSources'>('layers');
  const [samplesExpanded, setSamplesExpanded] = useState(true);
  const [dataSourcesExpanded, setDataSourcesExpanded] = useState(true);

  // Sample presets that can be added to the document
  const insertShippingLabel = () => {
    const objs: CanvasObject[] = [
      {
        id: `txt-carrier-${Date.now()}`,
        type: 'text',
        x: 2,
        y: 2,
        width: 14,
        height: 5,
        rotation: 0,
        zIndex: 1,
        text: 'EXPRESS POST',
        fontFamily: 'Inter',
        fontSize: 10,
        bold: true,
        italic: false,
        underline: false,
        strike: false,
        align: 'left',
        color: '#000',
      },
      {
        id: `bc-tracking-${Date.now()}`,
        type: 'barcode',
        x: 2,
        y: 8,
        width: 21,
        height: 16,
        rotation: 0,
        zIndex: 2,
        format: 'CODE128',
        value: 'TRK-9876543210',
        barWidth: 1.2,
        displayValue: true,
        fgColor: '#000',
        bgColor: '#fff',
        fontSize: 8,
      },
    ];
    onInsertSample(objs);
  };

  const insertRetailTag = () => {
    const objs: CanvasObject[] = [
      {
        id: `txt-store-${Date.now()}`,
        type: 'text',
        x: 2,
        y: 2,
        width: 14,
        height: 4,
        rotation: 0,
        zIndex: 1,
        text: 'DEPARTMENT STORE',
        fontFamily: 'Inter',
        fontSize: 8,
        bold: true,
        italic: false,
        underline: false,
        strike: false,
        align: 'center',
        color: '#000',
      },
      {
        id: `bc-upc-${Date.now()}`,
        type: 'barcode',
        x: 2,
        y: 7,
        width: 21,
        height: 18,
        rotation: 0,
        zIndex: 2,
        format: 'EAN13',
        value: '5901234123457',
        barWidth: 1.2,
        displayValue: true,
        fgColor: '#000',
        bgColor: '#fff',
        fontSize: 8,
      },
      {
        id: `txt-price-${Date.now()}`,
        type: 'text',
        x: 2,
        y: 27,
        width: 14,
        height: 6,
        rotation: 0,
        zIndex: 3,
        text: '$19.99',
        fontFamily: 'Inter',
        fontSize: 12,
        bold: true,
        italic: false,
        underline: false,
        strike: false,
        align: 'center',
        color: '#b00',
      },
    ];
    onInsertSample(objs);
  };

  const insertQRTag = () => {
    const objs: CanvasObject[] = [
      {
        id: `txt-scan-${Date.now()}`,
        type: 'text',
        x: 2,
        y: 2,
        width: 14,
        height: 4,
        rotation: 0,
        zIndex: 1,
        text: 'SCAN TO VERIFY',
        fontFamily: 'Inter',
        fontSize: 8,
        bold: true,
        italic: false,
        underline: false,
        strike: false,
        align: 'center',
        color: '#000',
      },
      {
        id: `bc-qr-${Date.now()}`,
        type: 'barcode',
        x: 4.5,
        y: 7,
        width: 16,
        height: 16,
        rotation: 0,
        zIndex: 2,
        format: 'QR',
        value: 'https://example.com/asset/A-8821',
        barWidth: 2,
        displayValue: false,
        fgColor: '#000',
        bgColor: '#fff',
        fontSize: 8,
      },
      {
        id: `txt-id-${Date.now()}`,
        type: 'text',
        x: 2,
        y: 25,
        width: 14,
        height: 4,
        rotation: 0,
        zIndex: 3,
        text: 'ID: A-8821',
        fontFamily: 'Inter',
        fontSize: 8,
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        align: 'center',
        color: '#444',
      },
    ];
    onInsertSample(objs);
  };

  // Helper for Layer item details
  const getObjectSummary = (obj: CanvasObject) => {
    switch (obj.type) {
      case 'text': {
        const tx = obj as TextObject;
        return {
          icon: <Type className="w-4 h-4 text-blue-600" />,
          title: `Text: "${tx.text || '(empty)'}"`,
          desc: `${tx.fontSize}pt • x:${tx.x.toFixed(1)} y:${tx.y.toFixed(1)} • w:${tx.width.toFixed(1)}mm`,
        };
      }
      case 'barcode': {
        const bc = obj as BarcodeObject;
        return {
          icon:
            bc.format === 'QR' ? (
              <QrCode className="w-4 h-4 text-purple-600" />
            ) : (
              <Barcode className="w-4 h-4 text-emerald-600" />
            ),
          title: `${bc.format}: "${bc.value}"`,
          desc: `x:${bc.x.toFixed(1)} y:${bc.y.toFixed(1)} • w:${bc.width.toFixed(1)} h:${bc.height.toFixed(1)}mm`,
        };
      }
      case 'line': {
        const ln = obj as LineObject;
        const isVert = ln.orientation === 'vertical' || obj.height > obj.width;
        return {
          icon: <Minus className="w-4 h-4 text-amber-600" />,
          title: isVert ? 'Vertical Divider' : 'Horizontal Divider',
          desc: `${ln.strokeWidth || 1}pt • x:${obj.x.toFixed(1)} y:${obj.y.toFixed(1)} • len:${Math.max(obj.width, obj.height).toFixed(1)}mm`,
        };
      }
      case 'shape': {
        const sh = obj as ShapeObject;
        return {
          icon: <Square className="w-4 h-4 text-indigo-600" />,
          title: `Shape: ${sh.shapeType}`,
          desc: `x:${obj.x.toFixed(1)} y:${obj.y.toFixed(1)} • w:${obj.width.toFixed(1)} h:${obj.height.toFixed(1)}mm`,
        };
      }
      case 'image': {
        return {
          icon: <ImageIcon className="w-4 h-4 text-rose-600" />,
          title: 'Image Item',
          desc: `x:${obj.x.toFixed(1)} y:${obj.y.toFixed(1)} • w:${obj.width.toFixed(1)} h:${obj.height.toFixed(1)}mm`,
        };
      }
      default: {
        const base = obj as CanvasObject;
        return {
          icon: <Layers className="w-4 h-4 text-slate-500" />,
          title: 'Canvas Object',
          desc: `Item`,
        };
      }
    }
  };

  return (
    <div className="w-76 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none text-sm">
      {/* Sidebar Header Tabs */}
      <div className="flex border-b border-slate-200 p-1.5 gap-1 bg-slate-50/60">
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'layers'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          onClick={() => setActiveTab('layers')}
          title="Layers & Objects list"
        >
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Layers</span>
          {objects.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              {objects.length}
            </span>
          )}
        </button>

        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'components'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          onClick={() => setActiveTab('components')}
          title="Predefined templates"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Templates</span>
        </button>

        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'dataSources'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          onClick={() => setActiveTab('dataSources')}
          title="Dynamic fields"
        >
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span>Fields</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Tab 1: Layers & Objects */}
        {activeTab === 'layers' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Label Objects ({objects.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Top to Bottom
              </span>
            </div>

            {objects.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-600">No Objects on Label</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Add Text, Barcode, Line, or Shapes from the top toolbar to start designing.
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {[...objects]
                  .sort((a, b) => b.zIndex - a.zIndex) // list topmost object first
                  .map((obj) => {
                    const isSelected = selectedObjectId === obj.id;
                    const summary = getObjectSummary(obj);

                    return (
                      <div
                        key={obj.id}
                        onClick={() => onSelectObject?.(obj.id)}
                        className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-white'
                          }`}
                        >
                          {summary.icon}
                        </div>

                        <div className="flex-1 min-w-0 pr-1">
                          <div
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-blue-900' : 'text-slate-800'
                            }`}
                            title={summary.title}
                          >
                            {summary.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {summary.desc}
                          </div>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 shrink-0">
                          {onReorderObject && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderObject(obj.id, 'up');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                              title="Bring Forward"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                          )}
                          {onReorderObject && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderObject(obj.id, 'down');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                              title="Send Backward"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          )}
                          {onDuplicateObject && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateObject(obj.id);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                              title="Duplicate Object"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteObject && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteObject(obj.id);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                              title="Delete Object"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                Click any layer to select & highlight it on the canvas. Use the <strong className="text-slate-700">Trash</strong> icon to remove overlapping or duplicate items.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Templates */}
        {activeTab === 'components' && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ready-to-use Presets
              </span>
              <button
                onClick={() => setSamplesExpanded(!samplesExpanded)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                {samplesExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {samplesExpanded && (
              <div className="space-y-2">
                {/* Retail Tag */}
                <div
                  onClick={insertRetailTag}
                  className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                        Retail Price Tag
                      </div>
                      <div className="text-[11px] text-slate-500">EAN-13 + Store + Price</div>
                    </div>
                  </div>
                </div>

                {/* Shipping Label */}
                <div
                  onClick={insertShippingLabel}
                  className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-600 transition-colors">
                        Shipping Label
                      </div>
                      <div className="text-[11px] text-slate-500">Express Post + Code 128</div>
                    </div>
                  </div>
                </div>

                {/* QR Code Tag */}
                <div
                  onClick={insertQRTag}
                  className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-500 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                        Asset QR Code
                      </div>
                      <div className="text-[11px] text-slate-500">Verification URL + ID</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Data Fields */}
        {activeTab === 'dataSources' && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Connected Sources
              </span>
              <button
                onClick={() => setDataSourcesExpanded(!dataSourcesExpanded)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                {dataSourcesExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {dataSourcesExpanded && (
              <div className="space-y-2">
                <div
                  onClick={() => onInsertDataSource('serial', 'Auto Serial Number')}
                  className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-purple-500 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs group-hover:text-purple-600 transition-colors">
                        Serial Counter
                      </div>
                      <div className="text-[11px] text-slate-500">Auto-increment sequence</div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => onInsertDataSource('date', 'Current Date')}
                  className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs group-hover:text-amber-600 transition-colors">
                        Date / Timestamp
                      </div>
                      <div className="text-[11px] text-slate-500">Dynamic printing date</div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => onInsertDataSource('db', 'Database Field')}
                  className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                        Database Linked Field
                      </div>
                      <div className="text-[11px] text-slate-500">CSV / Excel / SQL mapping</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pro Studio Tip Banner */}
      <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-700 leading-snug">
          <strong className="text-slate-900 font-semibold">Layers Manager:</strong> Select any item above to adjust coordinates, stroke thickness, or remove duplicate text.
        </div>
      </div>
    </div>
  );
};
