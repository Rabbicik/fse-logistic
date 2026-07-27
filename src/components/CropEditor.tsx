import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';
import { CropRegion } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const HANDLE_SIZE = 30;

interface Props {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  initialRegion: CropRegion;
  onRegionChange: (region: CropRegion) => void;
}

type HandleKey = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/*
 * Edytor kadrowania z 4 narożnikami do przeciągania
 * Używa Gesture API z react-native-gesture-handler (kompatybilne z Reanimated 4)
 */
export default function CropEditor({
  imageUri,
  imageWidth,
  imageHeight,
  initialRegion,
  onRegionChange,
}: Props) {
  const displayW = SCREEN_W;
  const scale = displayW / imageWidth;
  const displayH = imageHeight * scale;

  const toDisplay = (pt: { x: number; y: number }) => ({
    x: pt.x * scale,
    y: pt.y * scale,
  });

  const fromDisplay = (pt: { x: number; y: number }) => ({
    x: pt.x / scale,
    y: pt.y / scale,
  });

  const [corners, setCorners] = useState({
    topLeft: toDisplay(initialRegion.topLeft),
    topRight: toDisplay(initialRegion.topRight),
    bottomLeft: toDisplay(initialRegion.bottomLeft),
    bottomRight: toDisplay(initialRegion.bottomRight),
  });

  const updateCorner = useCallback(
    (key: HandleKey, x: number, y: number) => {
      const clampedX = Math.max(0, Math.min(displayW, x));
      const clampedY = Math.max(0, Math.min(displayH, y));
      setCorners((prev) => {
        const next = { ...prev, [key]: { x: clampedX, y: clampedY } };
        onRegionChange({
          topLeft: fromDisplay(next.topLeft),
          topRight: fromDisplay(next.topRight),
          bottomLeft: fromDisplay(next.bottomLeft),
          bottomRight: fromDisplay(next.bottomRight),
        });
        return next;
      });
    },
    [displayW, displayH, scale, onRegionChange]
  );

  const polygonPoints = `
    ${corners.topLeft.x},${corners.topLeft.y}
    ${corners.topRight.x},${corners.topRight.y}
    ${corners.bottomRight.x},${corners.bottomRight.y}
    ${corners.bottomLeft.x},${corners.bottomLeft.y}
  `;

  return (
    <View style={[styles.container, { height: displayH }]}>
      <Image
        source={{ uri: imageUri }}
        style={{ width: displayW, height: displayH }}
        resizeMode="contain"
      />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={displayW} height={displayH}>
          <Polygon
            points={polygonPoints}
            fill="rgba(255, 107, 53, 0.12)"
            stroke="#FF6B35"
            strokeWidth={2}
          />
        </Svg>
      </View>

      {(Object.keys(corners) as HandleKey[]).map((key) => (
        <DragHandle
          key={key}
          x={corners[key].x}
          y={corners[key].y}
          onDrag={(x, y) => updateCorner(key, x, y)}
        />
      ))}
    </View>
  );
}

interface DragHandleProps {
  x: number;
  y: number;
  onDrag: (x: number, y: number) => void;
}

function DragHandle({ x, y, onDrag }: DragHandleProps) {
  const offsetX = useSharedValue(x);
  const offsetY = useSharedValue(y);
  const startX = useSharedValue(x);
  const startY = useSharedValue(y);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = offsetX.value;
      startY.value = offsetY.value;
    })
    .onUpdate((e) => {
      offsetX.value = startX.value + e.translationX;
      offsetY.value = startY.value + e.translationY;
      runOnJS(onDrag)(offsetX.value, offsetY.value);
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value - HANDLE_SIZE / 2 },
      { translateY: offsetY.value - HANDLE_SIZE / 2 },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.handle, style]}>
        <View style={styles.handleInner} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  handleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});
