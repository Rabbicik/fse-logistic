import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ID_DOT_COUNT } from '../../constants/listTemplate';

interface Props {
  filled: boolean[];
  size?: number;
  filledColor?: string;
  emptyColor?: string;
}

export default function DotId({
  filled,
  size = 12,
  filledColor = '#FF6B35',
  emptyColor = 'rgba(255,255,255,0.15)',
}: Props) {
  const dots = Array.from({ length: ID_DOT_COUNT }, (_, i) => filled[i] ?? false);

  return (
    <View style={styles.row}>
      {dots.map((f, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: f ? filledColor : emptyColor,
              borderWidth: f ? 0 : 1,
              borderColor: 'rgba(255,255,255,0.2)',
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {},
});
