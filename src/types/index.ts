export interface ListItem {
  id: string;
  name: string;
  category: string;
  rowIndex: number;
  maxDots: number;
  unit: string;
  column: 1 | 2 | 3;
  colRow: number;
}



export interface ScannedItem {
  itemId: string;
  quantity: number;
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
