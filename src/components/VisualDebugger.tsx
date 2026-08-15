import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Image, useImage, Circle, Line, Rect, Paint } from '@shopify/react-native-skia';
import { DebugData } from '../types';

interface VisualDebuggerProps {
  imageUri: string;
  debugData: DebugData;
  imageWidth?: number;
  imageHeight?: number;
}

export function VisualDebugger({ imageUri, debugData, imageWidth = 1500, imageHeight = 2187 }: VisualDebuggerProps) {
  const image = useImage(imageUri);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Skalowanie z oryginalnego rozmiaru obrazu na ekran
  // Założenie: obraz skaluje się zachowując proporcje (contain)
  const scale = Math.min(screenWidth / imageWidth, screenHeight / imageHeight);
  const renderWidth = imageWidth * scale;
  const renderHeight = imageHeight * scale;
  const offsetX = (screenWidth - renderWidth) / 2;
  const offsetY = (screenHeight - renderHeight) / 2;

  // Helper do przekształcania punktów ze skanera (zależnych od ANALYSIS_W) na współrzędne ekranu
  const mapPt = (x: number, y: number) => ({
    x: offsetX + x * scale,
    y: offsetY + y * scale,
  });

  return (
    <View style={styles.container}>
      <Canvas style={{ width: screenWidth, height: screenHeight }}>
        {/* Tło - zdjęcie */}
        {image && (
          <Image
            image={image}
            x={offsetX}
            y={offsetY}
            width={renderWidth}
            height={renderHeight}
            fit="contain"
          />
        )}

        {/* Niebieskie linie - ramka dokumentu */}
        {debugData.globalAnchors.length === 4 && (
          <>
            <Line
              p1={mapPt(debugData.globalAnchors[0].x, debugData.globalAnchors[0].y)} // TL
              p2={mapPt(debugData.globalAnchors[1].x, debugData.globalAnchors[1].y)} // TR
              color="blue" strokeWidth={2}
            />
            <Line
              p1={mapPt(debugData.globalAnchors[1].x, debugData.globalAnchors[1].y)} // TR
              p2={mapPt(debugData.globalAnchors[3].x, debugData.globalAnchors[3].y)} // BR
              color="blue" strokeWidth={2}
            />
            <Line
              p1={mapPt(debugData.globalAnchors[3].x, debugData.globalAnchors[3].y)} // BR
              p2={mapPt(debugData.globalAnchors[2].x, debugData.globalAnchors[2].y)} // BL
              color="blue" strokeWidth={2}
            />
            <Line
              p1={mapPt(debugData.globalAnchors[2].x, debugData.globalAnchors[2].y)} // BL
              p2={mapPt(debugData.globalAnchors[0].x, debugData.globalAnchors[0].y)} // TL
              color="blue" strokeWidth={2}
            />
          </>
        )}

        {/* Zielone okręgi - 4 narożne kotwice globalne */}
        {debugData.globalAnchors.map((pt, i) => {
          const m = mapPt(pt.x, pt.y);
          return <Circle key={`g-anchor-${i}`} cx={m.x} cy={m.y} r={10 * scale} color="green" style="stroke" strokeWidth={3} />;
        })}

        {/* Rysowanie dla zastępu (squad) */}
        {debugData.squadCheckboxes.map((cb, i) => {
          const w = 50 * scale; 
          const m = mapPt(cb.point.x, cb.point.y);
          const yMin = offsetY + cb.bounds.yMin * scale;
          const yMax = offsetY + cb.bounds.yMax * scale;
          const rectH = yMax - yMin;
          const rectW = rectH; 
          return (
            <Rect 
              key={`sq-cb-${i}`} 
              x={m.x - rectW/2} y={yMin} 
              width={rectW} height={rectH} 
              color={cb.isMarked ? "green" : "red"} 
              style="stroke" strokeWidth={cb.isMarked ? 3 : 1} 
            />
          );
        })}

        {/* Rysowanie dla każdego wiersza produktów */}
        {debugData.rows.map((row, rIdx) => {
          const localM = mapPt(row.localAnchor.x, row.localAnchor.y);
          const lineY = offsetY + row.rowLineY * scale;

          return (
            <React.Fragment key={`row-${rIdx}`}>
              {/* Żółta cienka linia wiersza - od kotwicy lokalnej w prawo */}
              <Line 
                p1={{ x: localM.x, y: lineY }} 
                p2={{ x: offsetX + renderWidth, y: lineY }} 
                color="yellow" strokeWidth={1} 
              />
              
              {/* Fioletowa kropka - lokalna kotwica Y (item-marker) */}
              <Circle 
                cx={localM.x} cy={localM.y} 
                r={6 * scale} color="purple" 
              />

              {/* Boxy kratek w wierszu */}
              {row.checkboxes.map((cb, cIdx) => {
                const cbM = mapPt(cb.point.x, cb.point.y);
                const yMin = offsetY + cb.bounds.yMin * scale;
                const yMax = offsetY + cb.bounds.yMax * scale;
                const rectH = yMax - yMin;
                const rectW = rectH; // Kwadrat
                
                return (
                  <Rect 
                    key={`cb-${rIdx}-${cIdx}`}
                    x={cbM.x - rectW/2} y={yMin}
                    width={rectW} height={rectH}
                    color={cb.isMarked ? "green" : "red"}
                    style="stroke" strokeWidth={cb.isMarked ? 3 : 1}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
