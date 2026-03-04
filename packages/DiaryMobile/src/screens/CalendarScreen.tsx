import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Entry } from '@diary/shared/types';
import { listEntries } from '../storage/entryStorage';
import { CalendarScreenProps } from '../types/navigation';
import { useLang } from '../LangContext';
import { type T } from '../i18n';
import { SettingsDrawer } from '../components/SettingsDrawer';

function toDateString(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type MarkedDay = { marked?: boolean; selected?: boolean; moods?: string[] };
type ListFilter = 'recent3' | 'recent10' | 'all';

interface DayInfo {
  year: number;
  month: number; // 1-indexed
  day: number;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

// ─── Month Picker Modal ────────────────────────────────────────────────────────

function MonthPickerModal({
  visible, year, month, onClose, onSelect, t,
}: {
  visible: boolean; year: number; month: number;
  onClose: () => void; onSelect: (year: number, month: number) => void;
  t: T;
}) {
  const [pickerYear, setPickerYear] = useState(year);
  useEffect(() => { if (visible) setPickerYear(year); }, [visible, year]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={pickerStyles.overlay} onPress={onClose}>
        <Pressable style={pickerStyles.panel} onPress={() => {}}>
          <Text style={pickerStyles.title}>{t.selectYearMonth}</Text>
          <View style={pickerStyles.yearRow}>
            <TouchableOpacity style={pickerStyles.yearArrow} onPress={() => setPickerYear(y => y - 1)} activeOpacity={0.7}>
              <Text style={pickerStyles.yearArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={pickerStyles.yearText}>{t.filterYearDisplay(pickerYear)}</Text>
            <TouchableOpacity style={pickerStyles.yearArrow} onPress={() => setPickerYear(y => y + 1)} activeOpacity={0.7}>
              <Text style={pickerStyles.yearArrowText}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={pickerStyles.monthGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
              const isSelected = pickerYear === year && m - 1 === month;
              return (
                <TouchableOpacity
                  key={m}
                  style={[pickerStyles.monthCell, isSelected && pickerStyles.monthCellSelected]}
                  onPress={() => { onSelect(pickerYear, m - 1); onClose(); }}
                  activeOpacity={0.7}
                >
                  <Text style={[pickerStyles.monthText, isSelected && pickerStyles.monthTextSelected]}>
                    {t.monthCellLabel(m)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={pickerStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={pickerStyles.cancelText}>{t.cancel}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Custom Calendar ──────────────────────────────────────────────────────────

const CustomCalendar = React.memo(function CustomCalendar({
  year, month, markedDates, onDayPress, onMonthChange, onHeaderPress, t,
}: {
  year: number; month: number;
  markedDates: Record<string, MarkedDay>;
  onDayPress: (day: DayInfo) => void;
  onMonthChange: (year: number, month: number) => void;
  onHeaderPress: () => void;
  t: T;
}) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  }
  function nextMonth() {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  }

  return (
    <View style={calStyles.calendar}>
      <View style={calStyles.header}>
        <TouchableOpacity style={calStyles.arrowBtn} onPress={prevMonth} activeOpacity={0.6}>
          <Text style={calStyles.arrowText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onHeaderPress} activeOpacity={0.7} style={calStyles.headerTitleBtn}>
          <Text style={calStyles.headerTitle}>{t.monthLabel(year, month)}{'  ▾'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={calStyles.arrowBtn} onPress={nextMonth} activeOpacity={0.6}>
          <Text style={calStyles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={calStyles.row}>
        {t.weekdays.map((wd, i) => (
          <View key={i} style={calStyles.cell}>
            <Text style={calStyles.weekdayLabel}>{wd}</Text>
          </View>
        ))}
      </View>

      {chunk(cells, 7).map((row, ri) => (
        <View key={ri} style={calStyles.row}>
          {row.map((day, di) => {
            if (day === null) return <View key={di} style={calStyles.cell} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const marking = markedDates[dateStr];
            const isToday = !!marking?.selected;
            const hasEntry = !!marking?.marked;
            const moods = marking?.moods ?? [];
            return (
              <TouchableOpacity
                key={di}
                style={[calStyles.cell, calStyles.dayCell, isToday && calStyles.dayCellToday]}
                onPress={() => onDayPress({ year, month: month + 1, day })}
                activeOpacity={0.7}
              >
                <Text style={[calStyles.dayText, isToday && calStyles.dayTextToday]}>{day}</Text>
                {moods.length > 0 ? (
                  <View style={calStyles.moodsRow}>
                    {moods.map((m, idx) => (
                      <Text key={idx} style={calStyles.moodEmoji}>{m}</Text>
                    ))}
                  </View>
                ) : hasEntry ? (
                  <View style={[calStyles.dot, isToday && calStyles.dotWhite]} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
});

// ─── Calendar Screen ──────────────────────────────────────────────────────────

export default function CalendarScreen({ navigation }: CalendarScreenProps) {
  const { t } = useLang();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [calListFilter, setCalListFilter] = useState<ListFilter>('all');

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setSettingsOpen(true)} style={styles.headerGear} activeOpacity={0.7}>
          <Text style={styles.headerGearText}>⚙</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useFocusEffect(useCallback(() => { loadEntries(); }, []));

  async function loadEntries() {
    setLoading(true);
    const data = await listEntries();
    setEntries(data);
    setLoading(false);
  }

  const markedDates = useMemo(() => {
    const result: Record<string, MarkedDay> = {};
    const byDate: Record<string, Entry[]> = {};
    entries.forEach((e) => {
      const key = toDateString(e.createdAt);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(e);
    });
    Object.entries(byDate).forEach(([key, dayEntries]) => {
      const sorted = [...dayEntries].sort((a, b) => b.createdAt - a.createdAt);
      const moods = sorted.filter((e) => e.mood).slice(0, 3).map((e) => e.mood!);
      result[key] = { marked: true, moods };
    });
    const todayStr = toDateString(Date.now());
    result[todayStr] = { ...(result[todayStr] ?? {}), selected: true };
    return result;
  }, [entries]);

  const monthEntries = useMemo(() => {
    return [...entries]
      .filter((e) => {
        const d = new Date(e.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [entries, currentYear, currentMonth]);

  const displayedMonthEntries = useMemo(() => {
    if (calListFilter === 'recent3') return monthEntries.slice(0, 3);
    if (calListFilter === 'recent10') return monthEntries.slice(0, 10);
    return monthEntries;
  }, [monthEntries, calListFilter]);

  const calSectionLabel =
    calListFilter === 'recent3'  ? t.recent3Label :
    calListFilter === 'recent10' ? t.recent10Label :
    t.allBtn;

  const handleDayPress = useCallback((day: DayInfo) => {
    const d = new Date(day.year, day.month - 1, day.day);
    navigation.navigate('Day', { dateTimestamp: d.getTime() });
  }, [navigation]);

  const handleMonthChange = useCallback((year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  }, []);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <CustomCalendar
          year={currentYear}
          month={currentMonth}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          onHeaderPress={() => setMonthPickerVisible(true)}
          t={t}
        />

        {/* ── Month entry filter + list ─────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {`${t.thisMonthDiary} ${calSectionLabel} (${t.countOf(displayedMonthEntries.length, monthEntries.length)})`}
          </Text>
          <View style={styles.filterRow}>
            {(['recent3', 'recent10', 'all'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, calListFilter === f && styles.filterTabActive]}
                onPress={() => setCalListFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, calListFilter === f && styles.filterTabTextActive]}>
                  {f === 'recent3' ? t.recent3Btn : f === 'recent10' ? t.recent10Btn : t.allBtn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {displayedMonthEntries.length === 0 ? (
          <Text style={styles.emptyText}>{t.noEntriesMonth}</Text>
        ) : (
          displayedMonthEntries.map((item) => {
            const d = new Date(item.createdAt);
            const label = t.dateLabel(d);
            const preview = item.content.length > 80 ? item.content.slice(0, 80) + '...' : item.content;
            return (
              <TouchableOpacity
                key={item.id}
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
          })
        )}
      </ScrollView>

      <SettingsDrawer visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MonthPickerModal
        visible={monthPickerVisible}
        year={currentYear}
        month={currentMonth}
        onClose={() => setMonthPickerVisible(false)}
        onSelect={(y, m) => { setCurrentYear(y); setCurrentMonth(m); }}
        t={t}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const calStyles = StyleSheet.create({
  calendar: { backgroundColor: '#fff', paddingHorizontal: 4, paddingBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  arrowBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8 },
  arrowText: { fontSize: 28, color: '#4CAF50', lineHeight: 34 },
  headerTitleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  row: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', margin: 2 },
  weekdayLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  dayCell: {
    borderRadius: 6, backgroundColor: '#f5f5f5',
    borderWidth: 1, borderColor: '#e0e0e0',
    justifyContent: 'flex-start', paddingTop: 6,
  },
  dayCellToday: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  dayText: { fontSize: 15, color: '#333' },
  dayTextToday: { color: '#fff', fontWeight: 'bold' },
  moodsRow: { flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'center', marginTop: 2 },
  moodEmoji: { fontSize: 10, lineHeight: 12 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#4CAF50', marginTop: 2 },
  dotWhite: { backgroundColor: '#fff' },
});

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  panel: { width: 300, backgroundColor: '#fff', borderRadius: 14, padding: 20, elevation: 12 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 16 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 20 },
  yearArrow: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8 },
  yearArrowText: { fontSize: 24, color: '#4CAF50', lineHeight: 30 },
  yearText: { fontSize: 20, fontWeight: 'bold', color: '#333', minWidth: 80, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  monthCell: { width: '22%', paddingVertical: 12, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center' },
  monthCellSelected: { backgroundColor: '#4CAF50' },
  monthText: { fontSize: 15, color: '#333' },
  monthTextSelected: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { paddingVertical: 12, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#666' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 24 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerGear: { marginRight: 4, padding: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerGearText: { fontSize: 20, color: '#fff' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#555', flexShrink: 1, marginRight: 8 },
  filterRow: { flexDirection: 'row', gap: 5 },
  filterTab: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#e0e0e0' },
  filterTabActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  filterTabText: { fontSize: 11, color: '#666' },
  filterTabTextActive: { color: '#fff', fontWeight: 'bold' },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 16, marginBottom: 8, fontSize: 13, paddingHorizontal: 16 },
  entryCard: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  entryDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  entryMood: { fontSize: 16 },
  entryDate: { fontSize: 12, color: '#888' },
  entryPreview: { fontSize: 14, color: '#333', lineHeight: 21 },
});
