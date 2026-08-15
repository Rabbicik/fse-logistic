/*
 * Cienka warstwa Expo nad czystym rdzeniem OMR (omrCore.ts):
 * dekoduje zdjęcie (po przycięciu przez skaner dokumentów lub z galerii),
 * normalizuje rozmiar i przekazuje do analizy. Cała logika rozpoznawania
 * żyje w omrCore.ts — dzięki temu da się ją testować w Node bez natywnych
 * modułów (patrz scripts/test_omr.mjs).
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import * as base64js from 'base64-js';
import { ScannedItem, DebugData } from '../types';
import { computeQuantity, LIST_ITEMS } from '../constants/listTemplate';
import { analyzeOmr, rgbaToGray, FiducialError } from './omrCore';

export { FiducialError } from './omrCore';

export interface AnalysisResult {
  /** 0 = nie rozpoznano — użytkownik wybiera zastęp ręcznie */
  squadId: number;
  squadDots: boolean[];
  squadConfidence: number;
  items: ScannedItem[];
  debugData?: DebugData;
}

/*
 * Szerokość analizy: ~9.5 px/mm na stronie A4. Kółko Ø4.9mm ma wtedy ~47 px
 * średnicy — wystarczający margines na rozmycie zdjęcia.
 */
const ANALYSIS_W = 2000;

async function renderNormalized(imageUri: string, rotate: boolean) {
  const context = ImageManipulator.manipulate(imageUri);
  if (rotate) context.rotate(90);
  context.resize({ width: ANALYSIS_W, height: null });
  const rendered = await context.renderAsync();
  return rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.97,
    base64: true,
  });
}

export async function analyzeListImage(imageUri: string): Promise<AnalysisResult> {
  let saved = await renderNormalized(imageUri, false);
  if (!saved.base64) throw new Error('Nie można przetworzyć obrazu z aparatu');

  // Kartka A4 jest pionowa — zdjęcie poziome obróć do pionu.
  // (Orientację góra/dół rozstrzyga sam analizator po znacznikach.)
  if (saved.width > saved.height) {
    saved = await renderNormalized(imageUri, true);
    if (!saved.base64) throw new Error('Nie można przetworzyć obrazu z aparatu');
  }

  const raw = jpeg.decode(base64js.toByteArray(saved.base64), {
    useTArray: true,
    maxMemoryUsageInMB: 192,
  });

  const gray = rgbaToGray(raw.data as Uint8Array, raw.width, raw.height);
  const core = analyzeOmr(gray); // rzuca FiducialError przy braku znaczników

  const itemById = new Map(LIST_ITEMS.map((li) => [li.id, li]));
  const items: ScannedItem[] = core.items.map((ci) => {
    const li = itemById.get(ci.itemId);
    return {
      itemId: ci.itemId,
      quantity: ci.quantity,
      totalQuantity: li ? computeQuantity(ci.quantity, li) : ci.quantity,
      filled: ci.filled,
      confidence: ci.confidence,
    };
  });

  return {
    squadId: core.squadId,
    squadDots: core.squadDots,
    squadConfidence: core.squadConfidence,
    items,
    debugData: core.debug,
  };
}

export { numberToBinaryDots, binaryDotsToNumber } from '../constants/listTemplate';
