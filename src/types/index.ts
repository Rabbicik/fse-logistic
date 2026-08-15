export interface ListItem {
  id: string;
  name: string;
  category: string;
  rowIndex: number;
  maxDots: number;
  unit: string;
  column: 1 | 2 | 3;
  colRow: number;
  dotValue: number;
}

export interface ScannedItem {
  itemId: string;
  quantity: number;
  totalQuantity: number;
  filled: boolean[];
}

export interface Scan {
  id: string;
  squadId: number;
  scannedAt: string;
  imageUri: string;
  items: ScannedItem[];
  notes?: string;
}

export interface Squad {
  id: number;
  name: string;
  color: string;
}

export interface CropPoint {
  x: number;
  y: number;
}

export interface CropRegion {
  topLeft: CropPoint;
  topRight: CropPoint;
  bottomLeft: CropPoint;
  bottomRight: CropPoint;
}

export interface DetectedDocument {
  corners: CropRegion;
  confidence: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface CheckboxDebug {
  point: Point;
  isMarked: boolean;
  lum: number;
  bg: number;
  bounds: { yMin: number; yMax: number };
}

export interface RowDebug {
  itemId: string;
  expectedY: number;
  localAnchor: Point;
  rowLineY: number;
  checkboxes: CheckboxDebug[];
}

export interface DebugData {
  globalAnchors: Point[];
  squadCheckboxes: CheckboxDebug[];
  rows: RowDebug[];
}
