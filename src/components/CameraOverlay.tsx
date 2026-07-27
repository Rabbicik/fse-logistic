import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Rect, Defs, Mask, Path } from 'react-native-svg';

interface Corner {
  x: number;
  y: number;
}

interface Props {
  topLeft: Corner;
  topRight: Corner;
  bottomLeft: Corner;
  bottomRight: Corner;
  width: number;
  height: number;
  confidence: number;
}

/*
 * Nakładka detekcji dokumentu rysująca pomarańczową ramkę z narożnikami
 * Wyświetlana na podglądzie aparatu
 */
export default function CameraOverlay({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  width,
  height,
  confidence,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: confidence > 0.5 ? 1 : 0.4,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (confidence > 0.7) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.03,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [confidence]);

  const color = confidence > 0.7 ? '#FF6B35' : '#FFD93D';
  const cornerLen = 28;
  const strokeW = 3;

  const pathData = `
    M ${topLeft.x} ${topLeft.y}
    L ${topRight.x} ${topRight.y}
    L ${bottomRight.x} ${bottomRight.y}
    L ${bottomLeft.x} ${bottomLeft.y}
    Z
  `;

  const makeCorner = (cx: number, cy: number, dx1: number, dy1: number, dx2: number, dy2: number) =>
    `M ${cx + dx1 * cornerLen} ${cy + dy1 * cornerLen} L ${cx} ${cy} L ${cx + dx2 * cornerLen} ${cy + dy2 * cornerLen}`;

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Path
          d={pathData}
          fill="rgba(255, 107, 53, 0.08)"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />

        <Path
          d={makeCorner(topLeft.x, topLeft.y, 1, 0, 0, 1)}
          fill="none"
          stroke={color}
          strokeWidth={strokeW * 2}
          strokeLinecap="round"
        />
        <Path
          d={makeCorner(topRight.x, topRight.y, -1, 0, 0, 1)}
          fill="none"
          stroke={color}
          strokeWidth={strokeW * 2}
          strokeLinecap="round"
        />
        <Path
          d={makeCorner(bottomLeft.x, bottomLeft.y, 1, 0, 0, -1)}
          fill="none"
          stroke={color}
          strokeWidth={strokeW * 2}
          strokeLinecap="round"
        />
        <Path
          d={makeCorner(bottomRight.x, bottomRight.y, -1, 0, 0, -1)}
          fill="none"
          stroke={color}
          strokeWidth={strokeW * 2}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
