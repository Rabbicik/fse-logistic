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
import { Scan } from '../../types';
import { analyzeListImage } from '../../services/imageAnalysis';
import { useScans } from '../../hooks/useScans';
import ScanResult from '../../components/ui/ScanResult';

export default function ResultScreen() {
  const params = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const { squads, addScan, hasScanForSquad, activeList } = useScans();

  const [loading, setLoading] = useState(true);
  const [scan, setScan] = useState<Scan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    processImage();
  }, []);

  async function processImage() {
    try {
      const uri = Array.isArray(params.uri) ? params.uri[0] : params.uri;

      if (!uri || uri.trim() === '') {
        throw new Error('Brak URI zdjęcia w parametrach trasy');
      }

      const result = await analyzeListImage(uri);

      const newScan: Scan = {
        id: `scan_${Date.now()}`,
        squadId: result.squadId,
        scannedAt: new Date().toISOString(),
        imageUri: uri,
        items: result.items,
      };

      setScan(newScan);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ResultScreen] processImage error:', message);
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  const saveAndClose = async () => {
    if (!scan) return;
    await addScan(scan); // nadpisuje wcześniejszy skan tego zastępu
    router.dismissAll();
    router.replace('/lists');
  };

  const handleConfirm = async () => {
    if (!scan) return;
    // Jeden skan na zastęp w liście — ponowny skan zastępuje poprzedni
    if (hasScanForSquad(scan.squadId)) {
      const squadName = squads?.find((sq) => sq.id === scan.squadId)?.name ?? `ID ${scan.squadId}`;
      Alert.alert(
        'Zastęp już zeskanowany',
        `„${squadName}" jest już na liście „${activeList?.name ?? ''}". Poprzedni skan zostanie zastąpiony tym nowym.`,
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Zastąp', style: 'destructive', onPress: saveAndClose },
        ]
      );
      return;
    }
    await saveAndClose();
  };

  const handleDiscard = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/lists');
    }
  };
  const squad = squads?.find((sq) => sq.id === scan?.squadId);

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

  if (errorMsg || !scan) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.loadingTitle}>Błąd analizy</Text>
          <Text style={styles.loadingHint}>
            {errorMsg ?? 'Nie udało się przetworzyć zdjęcia.'}
          </Text>
          <View style={styles.errorBtn}>
            <Text style={styles.errorBtnText} onPress={handleDiscard}>
              Wróć i spróbuj ponownie
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wynik skanowania</Text>
      </View>
      <ScanResult
        scan={scan}
        squad={squad}
        squads={squads}
        onSelectSquad={(newSquadId) => {
          setScan((prev) => (prev ? { ...prev, squadId: newSquadId } : null));
        }}
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
    width: '100%',
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorBtn: {
    marginTop: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
