import React from 'react';
import { WizardSettings } from '@/types/barcode-agentwarebot';

interface LivePreviewProps {
  settings: WizardSettings;
  showNumbers?: boolean;
  highlightSingleItem?: boolean;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  settings,
  showNumbers = false,
  highlightSingleItem = false,
}) => {
  const {
    pageWidthMm,
    pageHeightMm,
    itemsPerPageType,
    rows: configuredRows,
    cols: configuredCols,
    shape,
    hasUnusedMaterial,
    unusedLeftMm,
    unusedRightMm,
    unusedTopMm,
    unusedBottomMm,
    startingCorner,
    primaryDirection,
    templateWidthMm,
    templateHeightMm,
    horizGapMm,
    vertGapMm,
    useBackgroundColor,
    backgroundColor,
    useBackgroundPicture,
    backgroundPictureUrl,
    useTemplateImage,
    templateImageUrl,
    templateImageOpacity,
    cornerRadiusMm,
  } = settings;

  const rows = itemsPerPageType === 'single' ? 1 : Math.max(1, configuredRows);
  const cols = itemsPerPageType === 'single' ? 1 : Math.max(1, configuredCols);
  const totalItems = rows * cols;

  // Calculate printing order index matrix
  const getIndexAt = (r: number, c: number): number => {
    let rowIdx = r;
    let colIdx = c;

    if (startingCorner === 'top-right' || startingCorner === 'bottom-right') {
      colIdx = cols - 1 - c;
    }
    if (startingCorner === 'bottom-left' || startingCorner === 'bottom-right') {
      rowIdx = rows - 1 - r;
    }

    if (primaryDirection === 'horizontal') {
      return rowIdx * cols + colIdx + 1;
    } else {
      return colIdx * rows + rowIdx + 1;
    }
  };

  const previewBoxWidth = 190;
  const previewBoxHeight = 230;

  const scale = Math.min(
    (previewBoxWidth - 24) / Math.max(10, pageWidthMm),
    (previewBoxHeight - 24) / Math.max(10, pageHeightMm)
  );

  const renderedPageW = Math.max(20, pageWidthMm * scale);
  const renderedPageH = Math.max(20, pageHeightMm * scale);

  const leftMarginPx = hasUnusedMaterial ? (unusedLeftMm || 0) * scale : 0;
  const rightMarginPx = hasUnusedMaterial ? (unusedRightMm || 0) * scale : 0;
  const topMarginPx = hasUnusedMaterial ? (unusedTopMm || 0) * scale : 0;
  const bottomMarginPx = hasUnusedMaterial ? (unusedBottomMm || 0) * scale : 0;

  const itemWPx = Math.max(2, (templateWidthMm || 10) * scale);
  const itemHPx = Math.max(2, (templateHeightMm || 10) * scale);
  const gapXPx = Math.max(0, (horizGapMm || 0) * scale);
  const gapYPx = Math.max(0, (vertGapMm || 0) * scale);

  const getBorderRadius = () => {
    switch (shape) {
      case 'roundedRectangle':
        const r = (cornerRadiusMm || 3) * scale;
        const maxR = Math.min(itemWPx, itemHPx) * 0.45;
        return `${Math.max(1, Math.min(r, maxR))}px`;
      case 'circle':
      case 'ellipse':
        return '50%';
      case 'rectangle':
      default:
        return '0px';
    }
  };

  const borderRadius = getBorderRadius();
  const badgeFontSize = Math.max(6, Math.min(10, itemHPx * 0.55));

  if (highlightSingleItem) {
    const singleScale = Math.min(
      (previewBoxWidth - 30) / Math.max(5, templateWidthMm),
      (previewBoxHeight - 30) / Math.max(5, templateHeightMm)
    );
    const singleW = templateWidthMm * singleScale;
    const singleH = templateHeightMm * singleScale;

    return (
      <div className="w-56 flex flex-col shrink-0 select-none">
        <span className="text-xs font-semibold text-slate-700 mb-1.5 block">Sheet Preview:</span>
        <div className="flex-1 min-h-[220px] canvas-dot-grid border border-slate-200/90 rounded-xl flex items-center justify-center p-3 shadow-inner relative overflow-hidden">
          <div
            className="ring-1 ring-slate-900/10 shadow-xl relative flex items-center justify-center overflow-hidden"
            style={{
              width: `${singleW}px`,
              height: `${singleH}px`,
              borderRadius:
                shape === 'roundedRectangle'
                  ? `${Math.min(singleW, singleH) * 0.2}px`
                  : shape === 'circle' || shape === 'ellipse'
                  ? '50%'
                  : '0px',
              backgroundColor: useBackgroundColor ? backgroundColor : '#ffffff',
              backgroundImage:
                useBackgroundPicture && backgroundPictureUrl ? `url(${backgroundPictureUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {useTemplateImage && templateImageUrl && (
              <img
                src={templateImageUrl}
                alt="Template watermark"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ opacity: (templateImageOpacity || 40) / 100 }}
              />
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 leading-normal text-right font-mono font-medium">
          <div>Page: {pageWidthMm.toFixed(1)} × {pageHeightMm.toFixed(1)} mm</div>
          <div>Label: {templateWidthMm.toFixed(1)} × {templateHeightMm.toFixed(1)} mm</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 flex flex-col shrink-0 select-none">
      <span className="text-xs font-semibold text-slate-700 mb-1.5 block">Sheet Preview:</span>
      <div className="flex-1 min-h-[220px] canvas-dot-grid border border-slate-200/90 rounded-xl flex items-center justify-center p-3 shadow-inner relative overflow-hidden">
        {/* Page Sheet Container */}
        <div
          className="bg-white ring-1 ring-slate-900/10 shadow-xl box-border flex items-start justify-start transition-all duration-150 rounded-xs"
          style={{
            width: `${renderedPageW}px`,
            height: `${renderedPageH}px`,
            paddingLeft: `${leftMarginPx}px`,
            paddingRight: `${rightMarginPx}px`,
            paddingTop: `${topMarginPx}px`,
            paddingBottom: `${bottomMarginPx}px`,
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Grid of labels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, ${itemWPx}px)`,
              gridTemplateRows: `repeat(${rows}, ${itemHPx}px)`,
              columnGap: `${gapXPx}px`,
              rowGap: `${gapYPx}px`,
              width: 'max-content',
              height: 'max-content',
              boxSizing: 'border-box',
            }}
          >
            {Array.from({ length: totalItems }).map((_, idx) => {
              const r = Math.floor(idx / cols);
              const c = idx % cols;
              const orderNum = getIndexAt(r, c);

              return (
                <div
                  key={idx}
                  style={{
                    width: `${itemWPx}px`,
                    height: `${itemHPx}px`,
                    boxSizing: 'border-box',
                    padding: 0,
                  }}
                  className="box-border flex items-center justify-center"
                >
                  <div
                    className="box-border flex items-center justify-center relative transition-all duration-150"
                    style={{
                      width: `${itemWPx}px`,
                      height: `${itemHPx}px`,
                      borderRadius,
                      backgroundColor: useBackgroundColor ? backgroundColor : '#ffffff',
                      backgroundImage:
                        useBackgroundPicture && backgroundPictureUrl
                          ? `url(${backgroundPictureUrl})`
                          : undefined,
                      backgroundSize: 'cover',
                      border: '1px solid #93c5fd',
                      boxSizing: 'border-box',
                    }}
                  >
                    {showNumbers && (
                      <span
                        className="text-[10px] font-bold text-blue-700 select-none"
                        style={{ fontSize: `${badgeFontSize}px` }}
                      >
                        {orderNum}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-500 leading-normal text-right font-mono font-medium">
        <div>Page: {pageWidthMm.toFixed(1)} × {pageHeightMm.toFixed(1)} mm</div>
        <div>Label: {templateWidthMm.toFixed(1)} × {templateHeightMm.toFixed(1)} mm</div>
      </div>
    </div>
  );
};
