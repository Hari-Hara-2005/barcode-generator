export type ItemShape = 'rectangle' | 'roundedRectangle' | 'ellipse' | 'circle';
export type PageOrientation = 'portrait' | 'landscape' | 'portrait180' | 'landscape180';
export type StartingCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type PrimaryDirection = 'horizontal' | 'vertical';

export interface SystemPrinterInfo {
  name: string;
  isDefault: boolean;
  port: string;
  driver: string;
  status: string;
  isOnline: boolean;
  isRealPCPrinter: boolean;
}

export type BarcodeFormat =
  | 'CODE128'
  | 'CODE39'
  | 'EAN13'
  | 'EAN8'
  | 'UPC'
  | 'ITF14'
  | 'QR';

export interface PredefinedStock {
  id: string;
  category: string;
  name: string;
  pageWidth: number;   // mm
  pageHeight: number;  // mm
  rows: number;
  cols: number;
  itemWidth: number;
  itemHeight: number;
  shape: ItemShape;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  horizGap: number;
  vertGap: number;
}

export interface WizardSettings {
  startingPoint: 'blank' | 'existing';
  printer: string;
  stockType: 'custom' | 'predefined';
  predefinedCategory: string;
  predefinedStockId: string;
  
  // Items per page
  itemsPerPageType: 'single' | 'multiple';
  rows: number;
  cols: number;
  
  // Side edges
  hasUnusedMaterial: boolean;
  unusedLeftMm: number;
  unusedRightMm: number;
  unusedTopMm: number;
  unusedBottomMm: number;
  
  // Page size & orientation
  pageSizePreset: string;
  pageWidthMm: number;
  pageHeightMm: number;
  autoFitPageToLabels?: boolean;
  orientation: PageOrientation;
  mirrorImage: boolean;
  negative: boolean;
  
  // Item shape
  shape: ItemShape;
  cornerRadiusMm: number;
  
  // Template size & gap
  manualTemplateSize: boolean;
  templateWidthMm: number;
  templateHeightMm: number;
  manualGap: boolean;
  horizGapMm: number;
  vertGapMm: number;
  
  // Printing order
  startingCorner: StartingCorner;
  primaryDirection: PrimaryDirection;
  selectStartingPositionAtPrint: boolean;
  continueFromLastPosition: boolean;
  
  // Template background
  useBackgroundColor: boolean;
  backgroundColor: string;
  useBackgroundPicture: boolean;
  backgroundPictureUrl: string;
  useTemplateImage: boolean;
  templateImageUrl: string;
  templateImageOpacity: number;
}

export interface CanvasObjectBase {
  id: string;
  x: number;      // mm from top-left of label
  y: number;      // mm
  width: number;  // mm
  height: number; // mm
  rotation: number;
  zIndex: number;
}

export interface BarcodeObject extends CanvasObjectBase {
  type: 'barcode';
  format: BarcodeFormat;
  value: string;
  barWidth: number;
  displayValue: boolean;
  fgColor: string;
  bgColor: string;
  fontSize: number;
}

export interface TextObject extends CanvasObjectBase {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number; // pt
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  align: 'left' | 'center' | 'right' | 'justify';
  color: string;
  autoSerial?: boolean;
}

export interface ShapeObject extends CanvasObjectBase {
  type: 'shape';
  shapeType: 'rectangle' | 'roundedRectangle' | 'ellipse' | 'circle';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number; // pt
  cornerRadius: number; // mm
}

export interface LineObject extends CanvasObjectBase {
  type: 'line';
  strokeColor: string;
  strokeWidth: number; // pt
  orientation: 'horizontal' | 'vertical' | 'diagonal';
}

export interface ImageObject extends CanvasObjectBase {
  type: 'image';
  src: string;
  objectFit: 'contain' | 'cover' | 'fill';
}

export type CanvasObject = BarcodeObject | TextObject | ShapeObject | LineObject | ImageObject;

export interface DocumentState {
  id: string;
  name: string;
  isDirty: boolean;
  settings: WizardSettings;
  objects: CanvasObject[];
  selectedObjectId: string | null;
}

