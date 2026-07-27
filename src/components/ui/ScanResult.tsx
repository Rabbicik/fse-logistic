import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Scan, Squad, ScannedItem } from '../../types';
import { LIST_ITEMS, CATEGORIES } from '../../constants/listTemplate';
import DotId from './DotId';
import { numberToBinaryDots } from '../../services/imageAnalysis';

interface Props {
  scan: Scan;
  squad?: Squad;
  onConfirm: () => void;
  onDiscard: () => void;
}

export default function ScanResult({ scan, squad, onConfirm, onDiscard }: Props) {
  const dots = numberToBinaryDots(scan.squadId);
  const date = new Date(scan.scannedAt).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalItems = scan.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={[styles.squadBadge, { backgroundColor: squad?.color ?? '#FF6B35' }]}>
            <Ionicons name="shield" size={14} color="#fff" />
            <Text style={styles.squadName}>{squad?.name ?? `ID: ${scan.squadId}`}</Text>
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>

        <View style={styles.dotRow}>
          <Text style={styles.dotLabel}>ID zastępu:</Text>
          <DotId filled={dots} size={14} filledColor={squad?.color ?? '#FF6B35'} />
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Łącznie artykułów:</Text>
          <Text style={[styles.totalValue, { color: squad?.color ?? '#FF6B35' }]}>
            {totalItems}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((cat) => {
          const catItems = LIST_ITEMS.filter((li) => li.category === cat);
          const catScanned = catItems.map((li) =>
            scan.items.find((si) => si.itemId === li.id)
          );
          const hasAny = catScanned.some((si) => si && si.quantity > 0);

          if (!hasAny) return null;

          return (
            <View key={cat} style={styles.category}>
              <Text style={styles.categoryTitle}>{cat}</Text>
              {catItems.map((li) => {
                const scanned = scan.items.find((si) => si.itemId === li.id);
                if (!scanned || scanned.quantity === 0) return null;

                return (
                  <View key={li.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>{li.name}</Text>
                    <View style={styles.itemRight}>
                      <View style={styles.dotsPreview}>
                        {scanned.filled.map((f, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.miniDot,
                              {
                                backgroundColor: f
                                  ? squad?.color ?? '#FF6B35'
                                  : 'rgba(255,255,255,0.1)',
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.qty, { color: squad?.color ?? '#FF6B35' }]}>
                        ×{scanned.quantity}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.discardBtn} onPress={onDiscard} activeOpacity={0.8}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
          <Text style={styles.discardText}>Odrzuć</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: squad?.color ?? '#FF6B35' }]}
          onPress={onConfirm}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.confirmText}>Zapisz listę</Text>
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
  header: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  squadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  squadName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  date: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dotLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  category: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  categoryTitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  itemName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dotsPreview: {
    flexDirection: 'row',
    gap: 3,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  qty: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
  spacer: {
    height: 100,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  discardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  discardText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
