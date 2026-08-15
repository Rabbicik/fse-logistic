import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { exportListTemplatePdf } from '../services/pdfExport';
import { exportListTxt, aggregateList } from '../services/listExport';
import { defaultListName } from '../services/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useScans } from '../hooks/useScans';
import { CATEGORIES } from '../constants/listTemplate';
import { numberToBinaryDots } from '../services/imageAnalysis';
import DotId from '../components/ui/DotId';

const MAX_SQUADS = 15; // 4-bitowy kod na arkuszu

export default function ListsScreen() {
  const {
    lists,
    activeList,
    squads,
    loading,
    createList,
    selectList,
    deleteList,
    removeScan,
  } = useScans();

  const [newListVisible, setNewListVisible] = useState(false);
  const [newListName, setNewListName] = useState('');

  const aggregated = useMemo(
    () => (activeList ? aggregateList(activeList) : []),
    [activeList]
  );

  const openNewList = useCallback(() => {
    setNewListName(defaultListName());
    setNewListVisible(true);
  }, []);

  const confirmNewList = useCallback(async () => {
    await createList(newListName);
    setNewListVisible(false);
  }, [createList, newListName]);

  const handleExportTxt = useCallback(async () => {
    if (!activeList) return;
    try {
      await exportListTxt(activeList, squads);
    } catch {
      Alert.alert('Błąd', 'Nie udało się wyeksportować listy do TXT');
    }
  }, [activeList, squads]);

  const handleDownloadPdf = useCallback(async () => {
    try {
      await exportListTemplatePdf();
    } catch {
      Alert.alert('Błąd', 'Nie udało się wygenerować PDF');
    }
  }, []);

  const handleDeleteList = useCallback(
    (id: string, name: string) => {
      Alert.alert('Usunąć listę?', `„${name}" zostanie trwale usunięta.`, [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: () => deleteList(id) },
      ]);
    },
    [deleteList]
  );

  const handleRemoveScan = useCallback(
    (scanId: string, squadName: string) => {
      Alert.alert('Usunąć skan?', `Skan zastępu „${squadName}" zniknie z tej listy.`, [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: () => removeScan(scanId) },
      ]);
    },
    [removeScan]
  );

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
        <View style={styles.headerLeft}>
          <Text style={styles.kicker}>Lista zakupów</Text>
          <Text style={styles.title} numberOfLines={1}>
            {activeList?.name ?? 'Brak listy'}
          </Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={openNewList} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newBtnText}>Nowa</Text>
        </TouchableOpacity>
      </View>

      {lists.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.switcher}
          contentContainerStyle={styles.switcherContent}
        >
          {lists.map((l) => {
            const isActive = l.id === activeList?.id;
            return (
              <TouchableOpacity
                key={l.id}
                onPress={() => selectList(l.id)}
                onLongPress={() => handleDeleteList(l.id, l.name)}
                style={[styles.listChip, isActive && styles.listChipActive]}
              >
                <Text style={[styles.listChipText, isActive && styles.listChipTextActive]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, !activeList && styles.actionBtnDisabled]}
          onPress={handleExportTxt}
          disabled={!activeList}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={16} color="#FF6B35" />
          <Text style={styles.actionText}>Eksport TXT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleDownloadPdf} activeOpacity={0.8}>
          <Ionicons name="document-outline" size={16} color="#FF6B35" />
          <Text style={styles.actionText}>Wzór PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {!activeList || activeList.scans.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cart-outline" size={48} color="rgba(255,255,255,0.2)" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeList ? 'Lista jest pusta' : 'Utwórz pierwszą listę'}
            </Text>
            <Text style={styles.emptyHint}>
              {activeList
                ? 'Zeskanuj kartki zastępów kółkiem z aparatem — ilości zsumują się tutaj'
                : 'Kliknij „Nowa", a potem skanuj kartki zastępów'}
            </Text>
          </View>
        ) : (
          <>
            {/* ── ZAGREGOWANE ZAKUPY ── */}
            {CATEGORIES.map((cat) => {
              const catItems = aggregated.filter((a) => a.item.category === cat);
              if (catItems.length === 0) return null;
              return (
                <View key={cat} style={styles.category}>
                  <Text style={styles.categoryTitle}>{cat}</Text>
                  {catItems.map((a) => (
                    <View key={a.item.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{a.item.name}</Text>
                      <Text style={styles.itemAmount}>{a.amount}</Text>
                    </View>
                  ))}
                </View>
              );
            })}

            {/* ── ZESKANOWANE ZASTĘPY ── */}
            <View style={styles.squadsSection}>
              <Text style={styles.categoryTitle}>
                Zeskanowane zastępy · {activeList.scans.length}/{MAX_SQUADS}
              </Text>
              {[...activeList.scans]
                .sort((a, b) => a.squadId - b.squadId)
                .map((scan) => {
                  const squad = squads.find((sq) => sq.id === scan.squadId);
                  const time = new Date(scan.scannedAt).toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const positions = scan.items.filter((i) => i.quantity > 0).length;
                  return (
                    <View key={scan.id} style={styles.squadRow}>
                      <View
                        style={[styles.squadDot, { backgroundColor: squad?.color ?? '#FF6B35' }]}
                      />
                      <Text style={styles.squadName}>{squad?.name ?? `ID ${scan.squadId}`}</Text>
                      <DotId
                        filled={numberToBinaryDots(scan.squadId)}
                        size={9}
                        filledColor={squad?.color ?? '#FF6B35'}
                      />
                      <Text style={styles.squadMeta}>
                        {time} · {positions} poz.
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveScan(scan.id, squad?.name ?? `ID ${scan.squadId}`)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.35)" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              <Text style={styles.rescanHint}>
                Ponowny skan zastępu zastępuje jego poprzednią kartkę
              </Text>
            </View>
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── MODAL: NOWA LISTA ── */}
      <Modal visible={newListVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nowa lista zakupów</Text>
            <TextInput
              style={styles.modalInput}
              value={newListName}
              onChangeText={setNewListName}
              placeholder={defaultListName()}
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setNewListVisible(false)}
              >
                <Text style={styles.modalCancelText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCreate} onPress={confirmNewList}>
                <Text style={styles.modalCreateText}>Utwórz</Text>
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
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  newBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  switcher: {
    flexGrow: 0,
    marginBottom: 4,
  },
  switcherContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  listChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  listChipActive: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderColor: '#FF6B35',
  },
  listChipText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  listChipTextActive: {
    color: '#FF6B35',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  actionBtn: {
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
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  category: {
    marginBottom: 20,
  },
  categoryTitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  itemName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    flex: 1,
  },
  itemAmount: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '700',
  },
  squadsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  squadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  squadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  squadName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  squadMeta: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
  },
  rescanHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 14,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#161628',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modalCancelText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    fontSize: 14,
  },
  modalCreate: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FF6B35',
  },
  modalCreateText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
