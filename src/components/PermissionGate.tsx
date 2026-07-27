import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  canAsk: boolean;
  onAsk: () => void;
}

export default function PermissionGate({ canAsk, onAsk }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="camera" size={64} color="#FF6B35" />
        </View>

        <Text style={styles.title}>Dostęp do aparatu</Text>
        <Text style={styles.subtitle}>
          FSE Logistic potrzebuje dostępu do aparatu, aby skanować listy zaopatrzenia.
          Bez tego uprawnienia skanowanie nie będzie działać.
        </Text>

        {canAsk ? (
          <TouchableOpacity style={styles.button} onPress={onAsk} activeOpacity={0.85}>
            <Ionicons name="camera-outline" size={22} color="#fff" style={styles.btnIcon} />
            <Text style={styles.buttonText}>Zezwól na dostęp do aparatu</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.deniedBox}>
            <Ionicons name="warning-outline" size={20} color="#FF8B94" />
            <Text style={styles.deniedText}>
              Dostęp został odrzucony. Wejdź w Ustawienia → Aplikacje → FSE Logistic i włącz uprawnienie do aparatu.
            </Text>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => Linking.openSettings()}
              activeOpacity={0.8}
            >
              <Text style={styles.settingsBtnText}>Otwórz ustawienia</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1F',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deniedBox: {
    backgroundColor: 'rgba(255, 139, 148, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 139, 148, 0.3)',
    gap: 12,
  },
  deniedText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  settingsBtnText: {
    color: '#FF8B94',
    fontWeight: '600',
    fontSize: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#FF6B35',
    width: 24,
  },
});
