import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Scan, Squad } from '../../types';
import {
  LIST_ITEMS,
  CATEGORIES,
  numberToBinaryDots,
  formatTotalQuantity,
} from '../../constants/listTemplate';
import DotId from './DotId';

interface Props {
  scan: Scan;
  squad?: Squad;
  squads?: Squad[];
  onSelectSquad?: (squadId: number) => void;
  onConfirm: () => void;
  onDiscard: () => void;
}

export default function ScanResult({
  scan,
  squad,
  squads,
  onSelectSquad,
  onConfirm,
  onDiscard,
}: Props) {
  const date = new Date(scan.scannedAt).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  /* Liczba pozycji na liście — sumowanie ilości w różnych jednostkach
   * (g + szt. + L) nie ma sensu, więc liczymy odczytane pozycje. */
  const totalItems = scan.items.filter((i) => i.quantity > 0).length;
  const squadUnknown = scan.squadId === 0;

  /* Wiersz o niskiej pewności odczytu OMR — pokaż go i oznacz do weryfikacji */
  const isLowConfidence = (si?: { confidence?: number }) =>
    si?.confidence !== undefined && si.confidence < 0.55;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={[styles.squadBadge, { backgroundColor: squadUnknown ? '#64748B' : squad?.color ?? '#FF6B35' }]}>
            <Ionicons name={squadUnknown ? 'help' : 'shield'} size={14} color="#fff" />
            <Text style={styles.squadName}>
              {squadUnknown ? 'Nie rozpoznano zastępu' : squad?.name ?? `ID: ${scan.squadId}`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <DotId filled={numberToBinaryDots(scan.squadId)} size={12} filledColor={squad?.color ?? '#FF6B35'} />
            <Text style={styles.date}>{date}</Text>
          </View>
        </View>

        {squads && squads.length > 0 && onSelectSquad && (
          <View style={styles.squadSelectorSection}>
            <Text style={styles.squadSelectorLabel}>Wybierz zastęp:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.squadChips}
            >
              {squads.map((sq) => {
                const isSelected = sq.id === scan.squadId;
                return (
                  <TouchableOpacity
                    key={sq.id}
                    onPress={() => onSelectSquad(sq.id)}
                    style={[
                      styles.squadChip,
                      isSelected
                        ? { backgroundColor: sq.color, borderColor: sq.color }
                        : { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.squadChipText,
                        isSelected ? { color: '#fff', fontWeight: '800' } : { color: 'rgba(255,255,255,0.7)' },
                      ]}
                    >
                      {sq.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Pozycji na liście:</Text>
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
          const hasAny = catScanned.some((si) => si && (si.quantity > 0 || isLowConfidence(si)));

          if (!hasAny) return null;

          return (
            <View key={cat} style={styles.category}>
              <Text style={styles.categoryTitle}>{cat}</Text>
              {catItems.map((li) => {
                const scanned = scan.items.find((si) => si.itemId === li.id);
                if (!scanned || (scanned.quantity === 0 && !isLowConfidence(scanned))) return null;
                const lowConf = isLowConfidence(scanned);

                return (
                  <View key={li.id} style={styles.itemRow}>
                    {lowConf && (
                      <Ionicons
                        name="alert-circle"
                        size={15}
                        color="#F4D35E"
                        style={{ marginRight: 6 }}
                      />
                    )}
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
                        {formatTotalQuantity(li, scanned.quantity)}
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
        <TouchableOpacity style={styles.discardBtn} onPress={onDiscard}>
          <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.discardText}>Odrzuć</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            { backgroundColor: squadUnknown ? 'rgba(255,255,255,0.12)' : squad?.color ?? '#FF6B35' },
          ]}
          onPress={onConfirm}
          disabled={squadUnknown}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.confirmText}>
            {squadUnknown ? 'Najpierw wybierz zastęp' : 'Zapisz listę'}
          </Text>
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
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  squadSelectorSection: {
    gap: 6,
    marginTop: 2,
  },
  squadSelectorLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  squadChips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  squadChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  squadChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    padding: 20,
  },
  category: {
    marginBottom: 24,
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
