# Architecture

## Stack technologiczny
Expo ~57.0.7, React Native 0.86, TypeScript, expo-router (file-based), AsyncStorage, expo-print, expo-sharing

## Drzewo plików
- /src/app/_layout.tsx: Root layout — Stack Navigator + custom BottomTabs overlay, dark theme
- /src/app/index.tsx: Ekran Zastępów — lista PatrolCard, modal dodawania zastępu
- /src/app/lists.tsx: Zbiorcza lista zakupów — pogrupowana wg kategorii, przyciski PDF/Drukuj/Udostępnij
- /src/app/scan.tsx: (Dawniej Skanuj) Dodaj produkty — formularz z 9 kategoriami do ręcznego dodawania
- /src/app/patrol-detail.tsx: Szczegóły zastępu — zakładki list, edycja kropeczek, ręczne dodawanie (z wyborem jednostki)
- /src/components/BottomTabs.tsx: Własny tab bar z floating button "Dodaj"
- /src/components/FSELogo.tsx: Komponent logo FSE (fse.png)
- /src/components/ui/DotRating.tsx: 8 animowanych kropeczek — obsługuje g/szt/l
- /src/components/ui/CategorySection.tsx: Zwijana sekcja kategorii — unit-aware podsumowanie
- /src/components/ui/ProductItem.tsx: Pozycja artykułu z DotRating i unit przekazanym z kategorii
- /src/components/ui/PatrolCard.tsx: Karta zastępu z meta-danymi
- /src/components/ui/ShoppingListItem.tsx: Pozycja zbiorczej listy z formatowaniem jednostek
- /src/constants/categories.ts: 9 kategorii — każda z defaultUnit (g/szt/l) i quantityPerDot
- /src/constants/config.ts: Podstawowa konfiguracja (nazwa aplikacji itp.)
- /src/hooks/usePatrols.ts: Hook CRUD dla zastępów + list + kropeczek
- /src/services/storage.ts: AsyncStorage wrapper
- /src/services/listGenerator.ts: Agregacja wg unit (szt sumują się jako szt, g jako g)
- /src/services/pdfExport.ts: Generuje HTML→PDF przez expo-print, udostępnia przez expo-sharing
- /src/types/index.ts: UnitType ('g'|'szt'|'l'), formatQuantity(), ProductEntry (z unit), ShoppingItem
- /src/assets/fse.png: Logo FSE
- /app.json: Konfiguracja Expo — ikona FSE, dark mode, usunięte kamery



## Mapa zależności
index.tsx -> usePatrols -> StorageService -> AsyncStorage
patrol-detail.tsx -> usePatrols, CategorySection -> ProductItem -> DotRating
scan.tsx -> ImagePicker, VisionApiService -> Gemini API, usePatrols
lists.tsx -> usePatrols, ListGeneratorService -> ShoppingListItemCard
BottomTabs -> expo-router (usePathname, useRouter)

## Dług techniczny / Wrażliwe punkty
- /src/constants/config.ts: GEMINI_API_KEY jest pusty — USE_MOCK_ANALYSIS=true domyślnie
- /src/app/patrol-detail.tsx: Ręczne dodawanie produktów ma tymczasowy workaround — wymaga refaktoru
- /src/services/visionApi.ts: Mock zwraca stałe dane — do wymiany po podaniu klucza API
