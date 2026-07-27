import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useScans } from '../hooks/useScans';
import { Squad } from '../types';
import { LIST_ITEMS } from '../constants/listTemplate';
import { SQUAD_COLORS } from '../constants/listTemplate';

interface SquadSummary {
  squad: Squad;
  scanCount: number;
  totalItems: number;
  itemTotals: { name: string; qty: number }[];
}

export default function SquadsScreen() {
  const { squads, scans, loading, updateSquads } = useScans();
  const [editingSquad, setEditingSquad] = useState<Squad | null>(null);
  const [editName, setEditName] = useState('');

  const summaries = useMemo<SquadSummary[]>(() => {
    return squads.map((sq) => {
      const squadScans = scans.filter((s) => s.squadId === sq.id);
      const totalItems = squadScans.reduce(
        (sum, s) => sum + s.items.reduce((ss, i) => ss + i.quantity, 0),
        0
      );

      const itemMap = new Map<string, number>();
      for (const scan of squadScans) {
        for (const si of scan.items) {
          itemMap.set(si.itemId, (itemMap.get(si.itemId) ?? 0) + si.quantity);
        }
      }

      const itemTotals = LIST_ITEMS.filter((li) => (itemMap.get(li.id) ?? 0) > 0)
        .map((li) => ({ name: li.name, qty: itemMap.get(li.id) ?? 0 }))
        .sort((a, b) => b.qty - a.qty);

      return { squad: sq, scanCount: squadScans.length, totalItems, itemTotals };
    });
  }, [squads, scans]);

  const openEdit = (squad: Squad) => {
    setEditingSquad(squad);
    setEditName(squad.name);
  };

  const saveEdit = async () => {
    if (!editingSquad) return;
    const updated = squads.map((sq) =>
      sq.id === editingSquad.id ? { ...sq, name: editName.trim() || sq.name } : sq
    );
    await updateSquads(updated);
    setEditingSquad(null);
  };

  const addSquad = async () => {
    const newId = Math.max(...squads.map((s) => s.id), 0) + 1;
    const color = SQUAD_COLORS[squads.length % SQUAD_COLORS.length];
    const updated = [...squads, { id: newId, name: `Zastęp ${newId}`, color }];
    await updateSquads(updated);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Zastępy</Text>
        <TouchableOpacity style={styles.addBtn} onPress={addSquad} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={summaries}
        keyExtractor={(item) => String(item.squad.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderTopColor: item.squad.color }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.colorDot, { backgroundColor: item.squad.color }]} />
              <Text style={styles.squadName}>{item.squad.name}</Text>
              <TouchableOpacity
                onPress={() => openEdit(item.squad)}
                style={styles.editBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="pencil-outline" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            <View style={styles.stats}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: item.squad.color }]}>
                  {item.scanCount}
                </Text>
                <Text style={styles.statLabel}>skanów</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: item.squad.color }]}>
                  {item.totalItems}
                </Text>
                <Text style={styles.statLabel}>artykułów</Text>
              </View>
            </View>

            {item.itemTotals.length > 0 && (
              <View style={styles.items}>
                {item.itemTotals.slice(0, 5).map((it) => (
                  <View key={it.name} style={styles.itemRow}>
                    <Text style={styles.itemName}>{it.name}</Text>
                    <Text style={[styles.itemQty, { color: item.squad.color }]}>
                      {it.qty}
                    </Text>
                  </View>
                ))}
                {item.itemTotals.length > 5 && (
                  <Text style={styles.more}>+{item.itemTotals.length - 5} więcej artykułów</Text>
                )}
              </View>
            )}

            {item.scanCount === 0 && (
              <Text style={styles.noScans}>Brak zeskanowanych list</Text>
            )}
          </View>
        )}
      />

      <Modal visible={!!editingSquad} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Zmień nazwę zastępu</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nazwa zastępu"
              placeholderTextColor="rgba(255,255,255,0.25)"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingSquad(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={saveEdit}
                activeOpacity={0.85}
              >
                <Text style={styles.saveText}>Zapisz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 18,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  squadName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  editBtn: {
    padding: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  items: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
  },
  more: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    marginTop: 2,
  },
  noScans: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingTop: 8,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalBox: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
