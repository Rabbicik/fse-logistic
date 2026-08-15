import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import DocumentScanner from 'react-native-document-scanner-plugin';

export default function TabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const fabScale = useRef(new Animated.Value(1)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();

  const handleFabPress = useCallback(async () => {
    Animated.sequence([
      Animated.timing(fabRotate, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fabRotate, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();

    /*
     * Na Androidzie sprawdzamy uprawnienia do kamery.
     * react-native-document-scanner-plugin sam zarządza uprawnieniami,
     * ale wczesne sprawdzenie poprawia UX i redukuje ryzyko crash'u.
     */
    if (Platform.OS === 'android' && !permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        console.warn('[TabBar] Odmowa uprawnień do kamery na Androidzie');
        Alert.alert(
          'Brak dostępu do kamery',
          'Aby skanować listy, przyznaj dostęp do kamery w ustawieniach aplikacji.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (Platform.OS === 'web') {
      console.log('[TabBar] Symulacja skanowania na platformie Web (Brak wsparcia dla DocumentScanner)');
      Alert.alert('Symulacja PC', 'Na przeglądarce aparat nie działa w ten sam sposób. Użyj telefonu (Custom Dev Build) aby zeskanować dokument.');
      return;
    }

    try {
      console.log('[TabBar] Uruchamianie DocumentScanner.scanDocument...');
      const scanResult = await DocumentScanner.scanDocument({
        croppedImageQuality: 90,
      });

      console.log('[TabBar] Wynik DocumentScanner:', scanResult.status);

      if (
        scanResult.status === 'success' &&
        scanResult.scannedImages &&
        scanResult.scannedImages.length > 0
      ) {
        const uri = scanResult.scannedImages[0];
        console.log('[TabBar] Udało się pobrać obraz:', uri);

        if (!uri) {
          console.error('[TabBar] URI obrazu jest puste');
          Alert.alert('Błąd', 'Nie otrzymano zdjęcia ze skanera.');
          return;
        }

        router.push({
          pathname: '/camera/result',
          params: { uri },
        });
      } else {
        console.warn('[TabBar] Skanowanie anulowane lub nieudane:', scanResult);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('cancel') || message.includes('Cancel')) {
        console.log('[TabBar] Skanowanie anulowane przez użytkownika.');
        return;
      }
      console.error('[TabBar] ERROR DocumentScanner crash:', err);
      
      if (message.includes('Google Play services')) {
        Alert.alert(
          'Brak usług Google Play',
          'Skaner dokumentów wymaga aktualnych Usług Google Play (ML Kit). Funkcja ta może nie działać na emulatorach. Przetestuj na fizycznym urządzeniu z Androidem.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Błąd skanera',
        `Nie udało się uruchomić skanera. Błąd: ${message}`,
        [{ text: 'OK' }]
      );
    }
  }, [router, fabRotate, permission, requestPermission]);

  const handleListsPress = useCallback(() => {
    router.push('/lists');
  }, [router]);

  const handleSquadsPress = useCallback(() => {
    router.push('/squads');
  }, [router]);

  const fabSpin = fabRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg'],
  });

  const isLists = pathname === '/lists' || pathname === '/';
  const isSquads = pathname === '/squads';

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.bar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={handleListsPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLists ? 'list' : 'list-outline'}
            size={24}
            color={isLists ? '#FF6B35' : 'rgba(255,255,255,0.4)'}
          />
          <Text style={[styles.label, isLists && styles.labelActive]}>
            Listy
          </Text>
        </TouchableOpacity>

        <View style={styles.center} />

        <TouchableOpacity
          style={styles.tab}
          onPress={handleSquadsPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSquads ? 'shield' : 'shield-outline'}
            size={24}
            color={isSquads ? '#FF6B35' : 'rgba(255,255,255,0.4)'}
          />
          <Text style={[styles.label, isSquads && styles.labelActive]}>
            Zastępy
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.fabWrap,
          {
            bottom: insets.bottom + 18,
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFabPress}
          activeOpacity={0.9}
        >
          <Animated.View style={{ transform: [{ rotate: fabSpin }] }}>
            <Ionicons name="camera" size={28} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#161628',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  center: {
    width: 80,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: '#FF6B35',
  },
  fabWrap: {
    position: 'absolute',
    alignSelf: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#161628',
  },
});
