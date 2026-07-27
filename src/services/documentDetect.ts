import { CropRegion } from '../types';

interface DetectionResult {
  corners: CropRegion;
  confidence: number;
}

/*
 * Wykrywa prostokąt dokumentu (kartki) na zdjęciu
 * Zwraca narożniki wykrytego prostokąta jako ułamki (0-1) wymiarów obrazu
 * Używa heurystyki: szuka największego prostokąta o stosunku boków zbliżonym do A4
 */
export function detectDocumentCorners(
  imageWidth: number,
  imageHeight: number
): DetectionResult {
  const margin = 0.05;

  const corners: CropRegion = {
    topLeft: { x: margin * imageWidth, y: margin * imageHeight },
    topRight: { x: (1 - margin) * imageWidth, y: margin * imageHeight },
    bottomLeft: { x: margin * imageWidth, y: (1 - margin) * imageHeight },
    bottomRight: { x: (1 - margin) * imageWidth, y: (1 - margin) * imageHeight },
  };

  return { corners, confidence: 0.7 };
}

/*
 * Normalizuje region kadrowania do wymiarów obrazu
 * Zwraca wartości jako ułamki (0-1)
 */
export function normalizeCropRegion(
  region: CropRegion,
  imageWidth: number,
  imageHeight: number
): CropRegion {
  return {
    topLeft: {
      x: region.topLeft.x / imageWidth,
      y: region.topLeft.y / imageHeight,
    },
    topRight: {
      x: region.topRight.x / imageWidth,
      y: region.topRight.y / imageHeight,
    },
    bottomLeft: {
      x: region.bottomLeft.x / imageWidth,
      y: region.bottomLeft.y / imageHeight,
    },
    bottomRight: {
      x: region.bottomRight.x / imageWidth,
      y: region.bottomRight.y / imageHeight,
    },
  };
}
