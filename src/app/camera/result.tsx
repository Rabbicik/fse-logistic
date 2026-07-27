import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import { Scan } from '../../types';
import { analyzeListImage } from '../../services/imageAnalysis';
import { useScans } from '../../hooks/useScans';
import ScanResult from '../../components/ui/ScanResult';

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
    tlx: string;
    tly: string;
    trx: string;
    try_: string;
    blx: string;
    bly: string;
    brx: string;
    bry: string;
  }>();
  const router = useRouter();
  const { squads, addScan } = useScans();

  const [loading, setLoading] = useState(true);
  const [scan, setScan] = useState<Scan | null>(null);

  useEffect(() => {
    processImage();
  }, []);

  async function processImage() {
    try {
      const { uri, width: wStr, height: hStr, tlx, tly, brx, bry } = params;
      const w = parseInt(wStr ?? '1000', 10);
      const h = parseInt(hStr ?? '1333', 10);

      const originX = parseInt(tlx ?? '0', 10);
      const originY = parseInt(tly ?? '0', 10);
      const cropW = parseInt(brx ?? wStr ?? '1000', 10) - originX;
      const cropH = parseInt(bry ?? hStr ?? '1333', 10) - originY;

      const cropped = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: Math.max(0, originX),
              originY: Math.max(0, originY),
              width: Math.min(cropW, w - originX),
              height: Math.min(cropH, h - originY),
            },
          },
        ],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 }
      );

      const result = await analyzeListImage(cropped.uri);

      const newScan: Scan = {
        id: `scan_${Date.now()}`,
        squadId: result.squadId,
        scannedAt: new Date().toISOString(),
        imageUri: cropped.uri,
        items: result.items,
      };

      setScan(newScan);
    } catch (err) {
      Alert.alert(
        'Błąd analizy',
        'Nie udało się przetworzyć zdjęcia. Spróbuj ponownie.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  }

  const handleConfirm = async () => {
    if (!scan) return;
    await addScan(scan);
    router.dismissAll();
    router.replace('/lists');
  };

  const handleDiscard = () => {
    router.back();
  };

  const squad = squads.find((sq) => sq.id === scan?.squadId);

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#FF6B35" size="large" />
          <Text style={styles.loadingTitle}>Analizowanie listy...</Text>
          <Text style={styles.loadingHint}>
            Wykrywanie ID zastępu i zaznaczonych artykułów
          </Text>
        </View>
      </View>
    );
  }

  if (!scan) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wynik skanowania</Text>
      </View>
      <ScanResult
        scan={scan}
        squad={squad}
        onConfirm={handleConfirm}
        onDiscard={handleDiscard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1F',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  loading: {
    flex: 1,
    backgroundColor: '#0D0D1F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingCard: {
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
