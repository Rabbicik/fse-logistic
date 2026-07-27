import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import DocumentScanner from 'react-native-document-scanner-plugin';

export default function TabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const fabScale = useRef(new Animated.Value(1)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;

  // We no longer have an internal camera screen to track
  const isCameraOpen = false; 

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

    try {
      const { scannedImages, status } = await DocumentScanner.scanDocument({
        croppedImageQuality: 100,
        letUserAdjustCrop: true,
      });

      if (status === 'success' && scannedImages && scannedImages.length > 0) {
        // Send the perfectly cropped image directly to analysis result
        router.push({
          pathname: '/camera/result',
          params: { uri: scannedImages[0] },
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd kamery', 'Nie udało się uruchomić skanera dokumentów.');
    }
  }, [router, fabRotate]);

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
          style={[styles.fab, isCameraOpen && styles.fabActive]}
          onPress={handleFabPress}
          activeOpacity={0.9}
        >
          <Animated.View style={{ transform: [{ rotate: fabSpin }] }}>
            <Ionicons
              name={'camera'}
              size={28}
              color="#fff"
            />
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
  fabActive: {
    backgroundColor: '#555',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
});
