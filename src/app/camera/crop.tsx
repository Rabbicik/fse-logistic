import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CropRegion } from '../../types';
import { detectDocumentCorners } from '../../services/documentDetect';
import CropEditor from '../../components/CropEditor';

const { width: W } = Dimensions.get('window');

export default function CropScreen() {
  const { uri, width: wStr, height: hStr } = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
  }>();
  const router = useRouter();

  const imageWidth = parseInt(wStr ?? '1000', 10);
  const imageHeight = parseInt(hStr ?? '1333', 10);

  const { corners: initial } = detectDocumentCorners(imageWidth, imageHeight);
  const [region, setRegion] = useState<CropRegion>(initial);
  const [processing, setProcessing] = useState(false);

  const handleSave = useCallback(async () => {
    if (!uri) return;
    setProcessing(true);
    try {
      router.push({
        pathname: '/camera/result',
        params: {
          uri,
          width: String(imageWidth),
          height: String(imageHeight),
          tlx: String(Math.round(region.topLeft.x)),
          tly: String(Math.round(region.topLeft.y)),
          trx: String(Math.round(region.topRight.x)),
          try_: String(Math.round(region.topRight.y)),
          blx: String(Math.round(region.bottomLeft.x)),
          bly: String(Math.round(region.bottomLeft.y)),
          brx: String(Math.round(region.bottomRight.x)),
          bry: String(Math.round(region.bottomRight.y)),
        },
      });
    } catch {
      Alert.alert('Błąd', 'Nie udało się przetworzyć zdjęcia');
    } finally {
      setProcessing(false);
    }
  }, [uri, region, imageWidth, imageHeight, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <Text style={styles.topTitle}>Dostosuj obszar</Text>
        <Text style={styles.topHint}>Przeciągnij narożniki, aby objąć całą kartkę</Text>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={false}
      >
        {uri && (
          <CropEditor
            imageUri={uri}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            initialRegion={initial}
            onRegionChange={setRegion}
          />
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.8}
          disabled={processing}
        >
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.backText}>Wróć</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, processing && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveText}>Zapisz</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1F',
  },
  topBar: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: '#0D0D1F',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  topHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 36,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0D0D1F',
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(255, 107, 53, 0.4)',
    shadowOpacity: 0,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
