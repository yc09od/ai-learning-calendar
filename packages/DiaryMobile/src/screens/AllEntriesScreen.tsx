import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Entry } from '@diary/shared/types';
import { listEntries } from '../storage/entryStorage';
import { AllEntriesScreenProps } from '../types/navigation';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

type ListFilter = 'recent3' | 'recent10' | 'all';

// Computed once at module load — stable reference to today
const _today = new Date();
const TODAY_YEAR = _today.getFullYear();
const TODAY_MONTH = _today.getMonth(); // 0-indexed

export default function AllEntriesScreen({ navigation }: AllEntriesScreenProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ListFilter>('all');

  // Year/month filter. null = not filtering by that dimension.
  // Default: current year + current month.
  const [filterYear, setFilterYear] = useState<number | null>(TODAY_YEAR);
  const [filterMonth, setFilterMonth] = useState<number | null>(TODAY_MONTH);

  useFocusEffect(useCallback(() => { loadEntries(); }, []));

  async function loadEntries() {
    setLoading(true);
    const data = await listEntries();
    setEntries(data);
    setLoading(false);
  }

  // ── Year / Month arrow handlers ────────────────────────────────────────────

  function prevYear() {
    const y = filterYear !== null ? filterYear : TODAY_YEAR;
    setFilterYear(y - 1);
  }
  function nextYear() {
    const y = filterYear !== null ? filterYear : TODAY_YEAR;
    setFilterYear(y + 1);
  }
  function prevMonth() {
    const m = filterMonth !== null ? filterMonth : TODAY_MONTH;
    const y = filterYear !== null ? filterYear : TODAY_YEAR;
    if (m === 0) { setFilterYear(y - 1); setFilterMonth(11); }
    else          { setFilterMonth(m - 1); if (filterYear === null) setFilterYear(y); }
  }
  function nextMonth() {
    const m = filterMonth !== null ? filterMonth : TODAY_MONTH;
    const y = filterYear !== null ? filterYear : TODAY_YEAR;
    if (m === 11) { setFilterYear(y + 1); setFilterMonth(0); }
    else          { setFilterMonth(m + 1); if (filterYear === null) setFilterYear(y); }
  }

  const isFiltering = filterYear !== null || filterMonth !== null;

  // ── Data derivation ───────────────────────────────────────────────────────

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.createdAt - a.createdAt),
    [entries]
  );

  const filteredByDate = useMemo(() => {
    if (!isFiltering) return sortedEntries;
    return sortedEntries.filter((e) => {
      const d = new Date(e.createdAt);
      if (filterYear !== null && d.getFullYear() !== filterYear) return false;
      if (filterMonth !== null && d.getMonth() !== filterMonth) return false;
      return true;
    });
  }, [sortedEntries, filterYear, filterMonth, isFiltering]);

  const displayedEntries = useMemo(() => {
    if (listFilter === 'recent3') return filteredByDate.slice(0, 3);
    if (listFilter === 'recent10') return filteredByDate.slice(0, 10);
    return filteredByDate;
  }, [filteredByDate, listFilter]);

  // ── Labels ────────────────────────────────────────────────────────────────

  const dateLabel =
    filterYear !== null && filterMonth !== null ? `${filterYear}年${filterMonth + 1}月` :
    filterYear !== null                          ? `${filterYear}年` :
    filterMonth !== null                         ? `${filterMonth + 1}月` :
    '全部';

  const sectionLabel = isFiltering ? `${dateLabel}日记` : '全部日记';

  const recentLabel =
    listFilter === 'recent3'  ? '最近 3 篇' :
    listFilter === 'recent10' ? '最近 10 篇' :
    '全部';

  // ── Render item ───────────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: Entry }) => {
    const d = new Date(item.createdAt);
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[d.getDay()]}`;
    const preview = item.content.length > 80 ? item.content.slice(0, 80) + '...' : item.content;
    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => {
          const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          navigation.navigate('Day', { dateTimestamp: date.getTime() });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.entryDateRow}>
          {item.mood ? <Text style={styles.entryMood}>{item.mood}</Text> : null}
          <Text style={styles.entryDate}>{label}</Text>
        </View>
        <Text style={styles.entryPreview}>{preview}</Text>
      </TouchableOpacity>
    );
  }, [navigation]);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <View style={styles.container}>

      {/*
        ── Year / Month filter ──────────────────────────────────────────────
        Rendered outside FlatList to avoid reference-equality layout loops.
      */}
      <View style={styles.dateFilterRow}>
        {/* Year selector */}
        <View style={styles.ymGroup}>
          <TouchableOpacity onPress={prevYear} style={styles.arrowBtn} activeOpacity={0.7}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.ymText, !isFiltering && styles.ymTextMuted]}>
            {filterYear !== null ? `${filterYear}年` : '--年'}
          </Text>
          <TouchableOpacity onPress={nextYear} style={styles.arrowBtn} activeOpacity={0.7}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Month selector */}
        <View style={styles.ymGroup}>
          <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn} activeOpacity={0.7}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.ymText, !isFiltering && styles.ymTextMuted]}>
            {filterMonth !== null ? `${filterMonth + 1}月` : '--月'}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn} activeOpacity={0.7}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Clear */}
        <TouchableOpacity
          onPress={() => { setFilterYear(null); setFilterMonth(null); }}
          style={[styles.actionBtn, styles.clearBtn]}
          activeOpacity={0.7}
        >
          <Text style={styles.clearBtnText}>清除</Text>
        </TouchableOpacity>

        {/* Current */}
        <TouchableOpacity
          onPress={() => { setFilterYear(TODAY_YEAR); setFilterMonth(TODAY_MONTH); }}
          style={[styles.actionBtn, styles.currentBtn]}
          activeOpacity={0.7}
        >
          <Text style={styles.currentBtnText}>当前</Text>
        </TouchableOpacity>
      </View>

      {/* ── Recent-N filter + count ────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {sectionLabel} · {recentLabel}（{displayedEntries.length} 篇）
        </Text>
        <View style={styles.filterRow}>
          {(['recent3', 'recent10', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, listFilter === f && styles.filterTabActive]}
              onPress={() => setListFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, listFilter === f && styles.filterTabTextActive]}>
                {f === 'recent3' ? '最近3' : f === 'recent10' ? '最近10' : '全部'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={displayedEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isFiltering ? `${dateLabel}暂无日记` : '还没有日记，从日历页开始写吧！'}
          </Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Date filter row ──────────────────────────────────────────────────────
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 6,
  },
  ymGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: { width: 24, height: 28, justifyContent: 'center', alignItems: 'center' },
  arrowText: { fontSize: 18, color: '#4CAF50', lineHeight: 22 },
  ymText: { fontSize: 14, fontWeight: '600', color: '#333', minWidth: 44, textAlign: 'center' },
  ymTextMuted: { color: '#bbb' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  clearBtn: { backgroundColor: '#fff', borderColor: '#ddd' },
  clearBtnText: { fontSize: 12, color: '#888' },
  currentBtn: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  currentBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // ── Section header ───────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#555', flexShrink: 1, marginRight: 8 },
  filterRow: { flexDirection: 'row', gap: 5 },
  filterTab: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#e0e0e0' },
  filterTabActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  filterTabText: { fontSize: 11, color: '#666' },
  filterTabTextActive: { color: '#fff', fontWeight: 'bold' },

  // ── List ─────────────────────────────────────────────────────────────────
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 40, fontSize: 14, paddingHorizontal: 16 },
  listContent: { paddingBottom: 24 },
  entryCard: { marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  entryDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  entryMood: { fontSize: 16 },
  entryDate: { fontSize: 12, color: '#888' },
  entryPreview: { fontSize: 14, color: '#333', lineHeight: 21 },
});
