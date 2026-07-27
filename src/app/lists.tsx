import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { exportListTemplatePdf } from '../services/pdfExport';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useScans } from '../hooks/useScans';
import { Scan, Squad } from '../types';
import { LIST_ITEMS } from '../constants/listTemplate';
import { numberToBinaryDots } from '../services/imageAnalysis';
import DotId from '../components/ui/DotId';

interface ScanCardProps {
  scan: Scan;
  squad?: Squad;
}

function ScanCard({ scan, squad }: ScanCardProps) {
  const dots = numberToBinaryDots(scan.squadId);
  const date = new Date(scan.scannedAt).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const totalItems = scan.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <View style={[styles.card, { borderLeftColor: squad?.color ?? '#FF6B35' }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardDate}>{date}</Text>
          <DotId filled={dots} size={10} filledColor={squad?.color ?? '#FF6B35'} />
        </View>
        <View style={[styles.badge, { backgroundColor: squad?.color ?? '#FF6B35' }]}>
          <Text style={styles.badgeText}>{totalItems} szt.</Text>
        </View>
      </View>

      <View style={styles.cardItems}>
        {scan.items
          .filter((i) => i.quantity > 0)
          .slice(0, 4)
          .map((si) => {
            const item = LIST_ITEMS.find((li) => li.id === si.itemId);
            return (
              <View key={si.itemId} style={styles.chipRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{item?.name ?? si.itemId}</Text>
                  <Text style={[styles.chipQty, { color: squad?.color ?? '#FF6B35' }]}>
                    ×{si.quantity}
                  </Text>
                </View>
              </View>
            );
          })}
        {scan.items.filter((i) => i.quantity > 0).length > 4 && (
          <Text style={styles.more}>
            +{scan.items.filter((i) => i.quantity > 0).length - 4} więcej
          </Text>
        )}
      </View>
    </View>
  );
}

interface GroupedScan {
  squad: Squad | undefined;
  squadId: number;
  scans: Scan[];
}

export default function ListsScreen() {
  const { scans, squads, loading } = useScans();

  const handleDownloadPdf = useCallback(async () => {
    try {
      await exportListTemplatePdf();
    } catch {
      Alert.alert('Błąd', 'Nie udało się wygenerować PDF');
    }
  }, []);

  const grouped = useMemo<GroupedScan[]>(() => {
    const map = new Map<number, Scan[]>();
    for (const scan of scans) {
      const arr = map.get(scan.squadId) ?? [];
      arr.push(scan);
      map.set(scan.squadId, arr);
    }
    return Array.from(map.entries()).map(([squadId, s]) => ({
      squadId,
      squad: squads.find((sq) => sq.id === squadId),
      scans: s,
    }));
  }, [scans, squads]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  if (scans.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Listy</Text>
          <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPdf} activeOpacity={0.8}>
            <Ionicons name="document-outline" size={18} color="#FF6B35" />
            <Text style={styles.pdfBtnText}>Pobierz wzór</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={48} color="rgba(255,255,255,0.2)" />
          </View>
          <Text style={styles.emptyTitle}>Brak zeskanowanych list</Text>
          <Text style={styles.emptyHint}>
            Kliknij kółko z aparatem na dole, aby zeskanować pierwszą listę
          </Text>
          <View style={styles.arrow}>
            <Ionicons name="arrow-down" size={24} color="rgba(255,107,53,0.5)" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Listy</Text>
          <Text style={styles.subtitle}>{scans.length} skanów</Text>
        </View>
        <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPdf} activeOpacity={0.8}>
          <Ionicons name="document-outline" size={18} color="#FF6B35" />
          <Text style={styles.pdfBtnText}>Wzór PDF</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={grouped}
        keyExtractor={(item) => String(item.squadId)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <View
                style={[
                  styles.groupDot,
                  { backgroundColor: item.squad?.color ?? '#FF6B35' },
                ]}
              />
              <Text style={styles.groupName}>
                {item.squad?.name ?? `ID ${item.squadId}`}
              </Text>
              <Text style={styles.groupCount}>{item.scans.length}</Text>
            </View>

            {item.scans.map((scan) => (
              <ScanCard key={scan.id} scan={scan} squad={item.squad} />
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1F',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D1F',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
  },
  pdfBtnText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  group: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  groupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  groupName: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupCount: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLeft: {
    gap: 6,
  },
  cardDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  cardItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  chipQty: {
    fontSize: 13,
    fontWeight: '700',
  },
  more: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    alignSelf: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 20,
  },
  arrow: {
    marginTop: 8,
  },
});
