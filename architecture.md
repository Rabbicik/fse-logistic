# Architecture

## Stack technologiczny
Expo ~57, React Native 0.86, TypeScript, expo-router (file-based), AsyncStorage, expo-print, expo-sharing, react-native-document-scanner-plugin (ML Kit), jpeg-js

## Skanowanie OMR (v3)
Jedno źródło prawdy geometrii: `scripts/generate_template.js` generuje z tych samych stałych
szablony wydruku (`lista_zaopatrzenia*.html`, pozycjonowanie absolutne w mm — niezależne od fontów),
geometrię dla analizatora (`src/constants/omrGeometry.gen.ts`) oraz HTML dla expo-print
(`src/services/templateHtml.gen.ts`). Analizator (`src/services/omrCore.ts`) wykrywa 4 znaczniki
narożne, liczy homografię mm→px (usuwa perspektywę/kadrowanie), orientację rozstrzyga po paskach
taktujących, a kółka ocenia względem pozostałych w wierszu (odporność na cień/ołówek/cyfry w kółkach).
Wynik ma per-wiersz confidence; `squadId = 0` znaczy „nie rozpoznano” (użytkownik wybiera ręcznie).
Test regresyjny: `npm run test:omr` (fixtures w `scripts/fixtures/`). Diagnoza historyczna: `omr-diagnosis.md`.

## Drzewo plików
- /src/app/_layout.tsx: Root layout — Stack + TabBar, dark theme
- /src/app/lists.tsx: Zbiorcza lista zakupów, eksport PDF szablonu
- /src/app/squads.tsx: Zastępy — statystyki skanów
- /src/app/camera/result.tsx: Wynik skanowania → ScanResult (zapis/odrzucenie)
- /src/components/TabBar.tsx: Tab bar + FAB: tap = skaner dokumentów, przytrzymanie = zdjęcie z plików
- /src/components/VisualDebugger.tsx: Nakładka debug (znaczniki, wiersze, kółka) na zdjęcie skanu
- /src/components/ui/ScanResult.tsx: Podgląd wyniku, wybór zastępu, oznaczanie wierszy o niskiej pewności
- /src/components/ui/DotId.tsx: Wizualizacja 4-bitowego kodu zastępu
- /src/constants/listItems.json: KATALOG ARTYKUŁÓW (PL/FR, jednostki, dotValue) — źródło danych dla generatora i aplikacji
- /src/constants/listTemplate.ts: LIST_ITEMS/CATEGORIES z listItems.json + helpery kodu binarnego
- /src/constants/omrGeometry.gen.ts: GENEROWANE współrzędne OMR — nie edytować ręcznie
- /src/services/omrCore.ts: Czysty rdzeń OMR (fiducials → homografia → ocena względna) — testowalny w Node
- /src/services/imageAnalysis.ts: Warstwa Expo: decode/resize/rotacja → omrCore
- /src/services/pdfExport.ts: Druk/udostępnianie szablonu (templateHtml.gen.ts)
- /src/services/templateHtml.gen.ts: GENEROWANY HTML szablonu — nie edytować ręcznie
- /src/services/storage.ts: AsyncStorage wrapper (skany, zastępy)
- /scripts/generate_template.js: GENERATOR szablonu + geometrii (uruchom po każdej zmianie listy/układu, potem generate_pdf.js)
- /scripts/generate_pdf.js: HTML → PDF (puppeteer), obie wersje językowe
- /scripts/test_omr.mjs: Test regresyjny OMR na zdjęciach referencyjnych

## Przepływ zmiany szablonu
1. Edytuj `src/constants/listItems.json` (artykuły) lub `scripts/generate_template.js` (układ/geometria)
2. `npm run generate:template` → odświeża HTML + oba pliki .gen.ts
3. `node scripts/generate_pdf.js` → odświeża PDF-y w repo
4. `npm run test:omr` — fixtures wymagają regeneracji przy zmianie geometrii (patrz scripts/fixtures/)
5. Wydrukuj nowe arkusze — stare wydruki (bez znaczników narożnych) nie są wspierane

## Dług techniczny / Wrażliwe punkty
- Fixtures testowe są związane z geometrią v3 — zmiana układu wymaga ich ponownego wygenerowania
- VisualDebugger nie jest podpięty do żadnego ekranu (do użycia przy diagnozie w terenie)
