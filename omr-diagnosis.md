# FSE Logistic — OMR Recognition Accuracy: Diagnosis & Improvement Plan

*Analysis date: 2026-08-15. Scope: `src/services/imageAnalysis.ts`, `src/constants/listTemplate.ts` (OMR_GEOMETRY v2.0), `src/services/pdfExport.ts`, `lista_zaopatrzenia.html/.pdf`, capture flow in `TabBar.tsx` (react-native-document-scanner-plugin → ML Kit).*

## Executive summary

The accuracy problem is not primarily an image-quality or thresholding problem. **The analyzer's hard-coded geometry does not match the sheet the project actually prints.** I rasterized the repo's own `lista_zaopatrzenia.pdf`, measured every bubble position optically (Hough circle detection), ported `imageAnalysis.ts` line-for-line to a test harness, drew synthetic marks at the true bubble positions, and ran the app's algorithm against it:

| Scenario | Squad ID (truth = 5) | Item accuracy | Col 1 | Col 2 | Col 3 |
|---|---|---|---|---|---|
| Current constants, **perfect flat scan** of the repo's own PDF | **2 (wrong)** | **63.2%** | 8/20 | 8/21 | 27/27 |
| Current constants, + mild perspective residual (~1.5%, typical of ML Kit crop of a photo) | 2 (wrong) | 61.8% | 8/20 | 7/21 | 27/27 |
| **Corrected (measured) constants**, perfect flat scan | **5 (correct)** | **100%** | 20/20 | 21/21 | 27/27 |
| Corrected constants, + same perspective residual | 5 (correct) | 80.9% | 11/20 | 21/21 | 23/27 |

Three conclusions fall straight out of that table. First, the geometry constants are wrong for columns 1–2 and for the squad row — even an ideal scan misreads ~37% of items and virtually always misidentifies the squad. Second, the detection logic itself (fill-ratio evaluation, row Y-sync) is fundamentally sound: with correct geometry, a flat scan reads at 100%. Third, with photos there is a second, independent problem — the pipeline has **no in-image registration** (no fiducials, no X-sync, homography left entirely to ML Kit's crop), so even corrected constants lose ~20% under a realistic perspective residual. Both must be fixed; fixing only the constants helps scans but not photos.

## Evidence: measured vs. assumed geometry

All positions in mm on the A4 page, measured from `lista_zaopatrzenia.pdf` rendered at 200 dpi. See `overlay_squad.png` and `overlay_row1.png`: green = actual bubble centers, red = where `imageAnalysis.ts` samples.

**Squad ID row** (`OMR_GEOMETRY.SQUAD`):

| | Bubble 1 | Bubble 2 | Bubble 3 | Bubble 4 | Pitch | Row Y |
|---|---|---|---|---|---|---|
| Analyzer assumes | 45.0 | 53.0 | 61.0 | 69.0 | 8.0 | 11.75 |
| PDF actually has | 39.4 | 46.7 | 53.8 | 61.2 | ~7.2 | 12.26 |
| Error | +5.6 | +6.3 | +7.2 | **+7.9** | | |

The sampling point for bit 1 lands *between* real bubbles 1 and 2, bits 2–3 land roughly on real bubbles 3–4, and bit 4 samples blank paper. The detected code is a scrambled shift of the real one — squad 5 (bubbles 1+3) reads as 2. On an all-blank read the code `detectedId > 0 ? … : 1` silently reports **Squad 1** instead of "unrecognized", so failures masquerade as scans from squad 1.

**Item bubble columns** (first bubble center per column; all five bubbles share the same offset since pitch 5.4 mm matches):

| | Col 1 | Col 2 | Col 3 |
|---|---|---|---|
| Analyzer assumes (rightMm − CB_FROM_RIGHT) | 38.2 | 102.9 | 167.6 |
| PDF actually has | 33.9 | 100.3 | 168.3 |
| Error | **+4.4 mm (~90% of bubble Ø)** | **+2.6 mm (~half Ø)** | −0.7 mm (OK) |

With a 4.9 mm bubble and a sampling disc of radius ~1.7 mm, column 1's sampling discs sit almost entirely in the gaps between bubbles, column 2's sit half-in/half-out, and column 3 happens to align — which exactly reproduces the 40% / 38% / 100% per-column accuracy in the simulation. If your field observations are "column 3 mostly works, the rest is noise, squad always wrong," this is why.

Timing marks are similarly off: the analyzer's `timingX` is 11.7 / 76.37 / 141.04 while the printed marks sit at 11.4 / 70.8 / 137.4. Column 1 works; columns 2–3 miss the mark entirely and the ±1 mm track happens to land on item-name glyphs, so row Y-sync only works by accident. Vertical geometry (ROW_START_Y 21.8 vs measured 22.8, ROW_H 7.6 vs measured ~7.57) is essentially correct.

## Root causes

**RC1 — The constants were derived from intended CSS math, not from the rendered page.** `OMR_GEOMETRY.COLS` assumes three equal 60.67 mm columns (190 mm content, 4 mm gaps). The real template uses CSS grid `grid-template-columns: 1fr 1fr 1fr`, and `1fr` behaves as `minmax(auto, 1fr)`: tracks expand to their content's min-width. Long nowrap headers/items ("PRODUKTY SYPKIE", "Przyprawa do kurczaka") force columns 2–3 wider and squeeze column 1 (measured right edges ≈ 66.3 / 132.7 / 200.8 vs assumed 70.67 / 135.34 / 200.0). The squad row start depends on the rendered width of the "ID ZASTĘPU:" label, and the assumed 8 mm bubble pitch doesn't match the CSS (5 mm bubble + 2.2 mm gap = 7.2 mm).

**RC2 — The template's geometry is not deterministic across printers.** The same CSS is rendered by three different engines: puppeteer/HeadlessChrome (`scripts/generate_pdf.js` → repo PDF), expo-print on iOS, and expo-print on Android (`pdfExport.ts`). The font stack is `-apple-system, "Segoe UI", Roboto, Arial` — a *different font on each platform* — and per RC1 the layout is font-metric-dependent. So no single set of mm constants can ever be right for all printed sheets. This is the deeper design flaw behind RC1.

**RC3 — No optical registration, which is fatal for photos.** The v2 template dropped the v1 corner anchors; `debugData.globalAnchors` is just the image corners. The analyzer dead-reckons every X coordinate from page edges, trusting ML Kit's document crop to be pixel-perfect. Real phone photos leave 1–2% perspective/crop residual (2–6 mm at page scale) that nothing corrects: there is no X-sync at all, Y-sync searches only ±3.4 mm with a fixed absolute threshold (`minLum < 140`, which fails in dim/shadowed photos where paper itself reads darker), and vertical steps are computed with the *horizontal* px-per-mm (`pxPerMm`) while nominal positions use image height — so any crop whose aspect ratio isn't exactly √2 introduces additional Y drift.

**RC4 — Secondary robustness issues that shave margin in photos.** The template prints digits *inside* every bubble, adding dark pixels to unmarked bubbles that blur smears across the sampling disc. Local background is sampled at `leftMm + 4 mm`, which lands on item-name text, biasing the reference dark. `markedCount = b + 1` takes the highest marked index, so one false positive on bubble 5 reports quantity 5 regardless of the rest. The analysis image is resized to 1600 px and re-encoded as JPEG q90 (ringing artifacts around glyphs and rings). And thresholds (0.38 fill, delta 28/36) are absolute rather than relative to the row's own unmarked bubbles, so pen ticks or partial fills are missed while shadows produce false fills.

Two housekeeping traps worth flagging while here: `scripts/generate_html.js` is a **stale v1 generator** — running it would regenerate the old square-checkbox template *and overwrite `src/constants/listTemplate.ts`*, destroying `dotValue`, `OMR_GEOMETRY` and `CATEGORY_BLOCKS`. And `architecture.md` describes a Gemini-Vision-based architecture that no longer exists.

## Improvements, in priority order

### P0-a. Immediate calibration patch (one-line-per-constant, works today for sheets printed from the repo PDF)

```ts
SQUAD: {
  ROW_Y_MM: 12.26,
  BUBBLE_RADIUS_MM: 2.5,
  COUNT: 4,
  BUBBLES_X_MM: [39.4, 46.7, 53.8, 61.2],
},
COLUMNS: {
  ROW_START_Y_MM: 22.8,
  ROW_H_MM: 7.57,
  COLS: [
    { leftMm: 10.0,  rightMm: 66.26,  timingX: 11.4 },
    { leftMm: 69.6,  rightMm: 132.72, timingX: 70.8 },
    { leftMm: 136.3, rightMm: 200.78, timingX: 137.4 },
  ],
  CB_RADIUS_MM: 2.45,
  CB_FROM_RIGHT_MM: [32.45, 27.05, 21.65, 16.25, 10.85], // unchanged — pitch was correct
},
```

Verified: with these values my harness reads a flat scan of the repo PDF at 100% with the correct squad ID. **Caveat:** this calibrates to the puppeteer-rendered PDF only. Sheets printed from the app via expo-print will differ (RC2). Treat this as a stopgap while P0-b/P0-c land. Also fix the squad fallback: `detectedId === 0` should surface as "squad not recognized" in `ScanResult` (it's already editable there), never silently become Squad 1.

### P0-b. Make the template geometry deterministic — one source of truth

Generate the sheet *from* `OMR_GEOMETRY` instead of hoping CSS flow lands where the constants say. Position every OMR-relevant element (squad bubbles, item bubbles, timing marks, category bars) with `position: absolute` at explicit mm coordinates computed from the same constants the analyzer imports; let only the cosmetic text flow. Concretely: replace `grid-template-columns: 1fr 1fr 1fr` with fixed `repeat(3, 61.33mm)` (or `minmax(0,1fr)`) as a half-measure, give `.squad-label` a fixed width, but the robust endgame is absolute positioning of the bubbles. Then delete the stale `generate_html.js` and make one generator emit both the HTML template and (if anything is derived) the TS constants, so they can never diverge again. This removes RC1 and RC2 in one move — including the iOS/Android font differences, since absolute mm boxes don't depend on font metrics.

### P0-c. Print fiducials and register with a homography — this is the photo fix

Add four high-contrast corner fiducials (e.g. 6×6 mm filled squares inset ~5 mm from the page corners, clear of ML Kit's crop line; the v1 template had these and v2 dropped them). In `analyzeListImage`, detect the four blobs (coarse search in each corner quadrant → centroid), compute the perspective transform from detected centers to their canonical mm positions, and map every sampling coordinate through it. This decouples the analyzer from ML Kit crop quality, fixes X registration, absorbs the aspect-ratio mixing in RC3, and — importantly for your requirement — makes **plain gallery photos workable**, not just the guided scanner: with a homography from fiducials you can accept any photo where the four marks are visible, then optionally keep ML Kit only as a UX aid. My simulation shows exactly why this matters: without registration, a 1.5% perspective residual costs ~20% accuracy even with perfect constants.

An alternative or complement: self-locating bubbles. The bubbles are crisp printed rings — detect them directly (per-row 1-D profile correlation, or Hough circles in the expected band) and snap sampling to detected centers. Combined with fiducials this makes the reader nearly calibration-free.

### P1. Robust mark evaluation for photos

Score bubbles *relative to their own row*: measure fill for all five bubbles, take the row's unmarked baseline (median), and mark outliers — this is the classic OMR trick that neutralizes pen type, print density of the in-bubble digits, illumination, and blur in one step, and it lets you detect ticks and partial fills, not just full fills. Sample background per row from the bubble's immediate surroundings (ring exterior) instead of once per category block at a text-covered spot, so window-light gradients and shadows are compensated where they act. Replace the absolute `minLum < 140` sync threshold with one derived from local paper luminance. Move the printed digits outside the bubbles (below/right) in the next template revision — free margin. Replace `markedCount = highest marked index` with an explicit pattern rule plus a confidence value: contiguous fills 1..k → k with high confidence; gappy patterns (e.g. only bubble 5) → low confidence, flagged for review.

### P1. Capture pipeline

Raise `ANALYSIS_W` from 1600 to ~2200 (bubble inner disc grows from ~13 px to ~18 px radius — meaningful margin, still fast) and skip the lossy JPEG re-encode (`compress: 0.9`) in favor of PNG or q≥0.95. Validate the crop before analyzing: if the cropped image's aspect deviates from 297/210 by more than ~3%, prompt the user to rescan rather than producing silent garbage. Add a gallery-import entry point next to the scanner FAB (with P0-c registration it will just work).

### P2. Product-level safety nets

Surface per-item confidence in `ScanResult` and highlight low-confidence rows for one-tap correction — the UI already supports editing, it just doesn't know which rows deserve attention. Wire `VisualDebugger` (already written, currently unused in the result flow) behind a long-press or dev toggle so field failures are diagnosable from a screenshot. Build a regression harness: a folder of reference photos (flat, angled, dim, shadowed, pen/pencil) with expected JSON, run in CI against the decoder — the Python harness from this diagnosis (`simulate.py`) shows the shape of it and can be ported to a Jest test with `jpeg-js`. Optionally print a parity/checksum mark (e.g. a fifth squad bubble = XOR of the four bits) to reject misregistered reads outright. Finally, update `architecture.md` and remove or rewrite `generate_html.js` so nobody regenerates the v1 template over the v2 constants.

## Suggested order of attack

Day one: P0-a constants patch + squad-0 handling (turns the app from ~63% to ~100% on well-printed, well-scanned sheets). Next: P0-b template determinism and P0-c fiducials + homography together, since both touch the template — reprint the sheets once, and photos (scanner or gallery) become reliable. Then P1 relative scoring and background sampling, which is what carries accuracy through bad lighting, pencil marks, and creased paper. P2 hardens it for the long term.
