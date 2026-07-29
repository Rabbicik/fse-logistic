import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

/*
 * Ekran pośredni kamery. Expo Router wymaga istnienia tego pliku.
 * Rzeczywiste skanowanie odbywa się przez DocumentScanner w TabBar.
 * Ten ekran tylko przekierowuje z powrotem.
 */
export default function CameraIndex() {
  const router = useRouter();

  useEffect(() => {
    router.back();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#FF6B35" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
