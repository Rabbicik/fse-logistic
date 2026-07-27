import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCamera } from '../../hooks/useCamera';
import PermissionGate from '../../components/PermissionGate';
import CameraOverlay from '../../components/CameraOverlay';
import { detectDocumentCorners } from '../../services/documentDetect';
import { CropRegion } from '../../types';

const { width: W, height: H } = Dimensions.get('window');

export default function CameraScreen() {
  const { status, canAsk, ask } = useCamera();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [taking, setTaking] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const shutterScale = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [detectedCorners, setDetectedCorners] = useState<CropRegion | null>(null);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      const { corners, confidence: conf } = detectDocumentCorners(W, H * 0.75);
      setDetectedCorners(corners);
      setConfidence(conf);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const animateShutter = () => {
    Animated.sequence([
      Animated.timing(shutterScale, {
        toValue: 0.85,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(shutterScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
    ]).start();
  };

  const takePicture = useCallback(async () => {
    if (taking || !cameraRef.current) return;
    setTaking(true);
    animateShutter();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        skipProcessing: false,
      });

      if (photo) {
        router.push({
          pathname: '/camera/crop',
          params: {
            uri: photo.uri,
            width: String(photo.width),
            height: String(photo.height),
          },
        });
      }
    } catch (err) {
      console.error('Błąd zdjęcia:', err);
    } finally {
      setTaking(false);
    }
  }, [taking, router]);

  if (status !== 'granted') {
    return <PermissionGate canAsk={canAsk} onAsk={ask} />;
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
      />

      {detectedCorners && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}>
          <CameraOverlay
            topLeft={detectedCorners.topLeft}
            topRight={detectedCorners.topRight}
            bottomLeft={detectedCorners.bottomLeft}
            bottomRight={detectedCorners.bottomRight}
            width={W}
            height={H}
            confidence={confidence}
          />
        </Animated.View>
      )}

      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.hint}>
          <View
            style={[
              styles.hintDot,
              { backgroundColor: confidence > 0.7 ? '#6BCB77' : '#FFD93D' },
            ]}
          />
          <Text style={styles.hintText}>
            {confidence > 0.7 ? 'Karta wykryta' : 'Skieruj aparat na listę'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.iconBtn, torchOn && styles.iconBtnActive]}
          onPress={() => setTorchOn((v) => !v)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={torchOn ? 'flash' : 'flash-outline'} size={22} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <View style={styles.shutterRow}>
          <View style={styles.shutterSide} />

          <TouchableOpacity
            onPress={takePicture}
            activeOpacity={0.85}
            disabled={taking}
          >
            <Animated.View
              style={[styles.shutter, { transform: [{ scale: shutterScale }] }]}
            >
              {taking ? (
                <ActivityIndicator color="#0D0D1F" size="small" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.shutterSide} />
        </View>

        <Text style={styles.shutterHint}>Dotknij, aby zrobić zdjęcie</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(255, 211, 61, 0.3)',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hintText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 80,
    alignItems: 'center',
    gap: 12,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  shutterSide: {
    flex: 1,
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  shutterHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
});
