import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Entry } from '@diary/shared/types';
import { listEntries } from '../storage/entryStorage';
import { CalendarScreenProps } from '../types/navigation';
import { APP_VERSION } from '../config';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function toDateString(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type MarkedDay = { marked?: boolean; selected?: boolean };
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

// ─── Settings Drawer ──────────────────────────────────────────────────────────

function SettingsDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const slideAnim = useRef(new Animated.Value(280)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 280,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setModalVisible(false);
      });
    }
  }, [visible, slideAnim]);

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={drawerStyles.overlay} onPress={onClose}>
        <Animated.View
          style={[drawerStyles.panel, { transform: [{ translateX: slideAnim }] }]}
        >
          <Pressable onPress={() => {}}>
            <View style={drawerStyles.header}>
              <Text style={drawerStyles.headerTitle}>设置</Text>
              <TouchableOpacity onPress={onClose} style={drawerStyles.closeBtn} activeOpacity={0.7}>
                <Text style={drawerStyles.closeText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={drawerStyles.menuItem}>
              <Text style={drawerStyles.menuLabel}>版本</Text>
              <Text style={drawerStyles.menuValue}>v{APP_VERSION}</Text>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Month Picker Modal ────────────────────────────────────────────────────────

function MonthPickerModal({
  visible,
  year,
  month, // 0-indexed
  onClose,
  onSelect,
}: {
  visible: boolean;
  year: number;
  month: number;
  onClose: () => void;
  onSelect: (year: number, month: number) => void;
}) {
  const [pickerYear, setPickerYear] = useState(year);

  useEffect(() => {
    if (visible) setPickerYear(year);
  }, [visible, year]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={pickerStyles.overlay} onPress={onClose}>
        <Pressable style={pickerStyles.panel} onPress={() => {}}>
          <Text style={pickerStyles.title}>选择年月</Text>

          {/* 年份切换行 */}
          <View style={pickerStyles.yearRow}>
            <TouchableOpacity
              style={pickerStyles.yearArrow}
              onPress={() => setPickerYear((y) => y - 1)}
              activeOpacity={0.7}
            >
              <Text style={pickerStyles.yearArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={pickerStyles.yearText}>{pickerYear}年</Text>
            <TouchableOpacity
              style={pickerStyles.yearArrow}
              onPress={() => setPickerYear((y) => y + 1)}
              activeOpacity={0.7}
            >
              <Text style={pickerStyles.yearArrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* 月份 3x4 网格 */}
          <View style={pickerStyles.monthGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
              const isSelected = pickerYear === year && m - 1 === month;
              return (
                <TouchableOpacity
                  key={m}
                  style={[pickerStyles.monthCell, isSelected && pickerStyles.monthCellSelected]}
                  onPress={() => {
                    onSelect(pickerYear, m - 1);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[pickerStyles.monthText, isSelected && pickerStyles.monthTextSelected]}>
                    {m}月
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={pickerStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={pickerStyles.cancelText}>取消</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Custom Calendar ──────────────────────────────────────────────────────────

const CustomCalendar = React.memo(function CustomCalendar({
  year,
  month, // 0-indexed
  markedDates,
  onDayPress,
  onMonthChange,
  onHeaderPress,
}: {
  year: number;
  month: number;
  markedDates: Record<string, MarkedDay>;
  onDayPress: (day: DayInfo) => void;
  onMonthChange: (year: number, month: number) => void;
  onHeaderPress: () => void;
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
      {/* 头部：上月 / 年月标题（可点击）/ 下月 */}
      <View style={calStyles.header}>
        <TouchableOpacity style={calStyles.arrowBtn} onPress={prevMonth} activeOpacity={0.6}>
          <Text style={calStyles.arrowText}>{'‹'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onHeaderPress} activeOpacity={0.7} style={calStyles.headerTitleBtn}>
          <Text style={calStyles.headerTitle}>
            {year}年{month + 1}月{'  ▾'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={calStyles.arrowBtn} onPress={nextMonth} activeOpacity={0.6}>
          <Text style={calStyles.arrowText}>{'›'}</Text>
        </TouchableOpacity>
      </View>

      {/* 星期标签行 */}
      <View style={calStyles.row}>
        {WEEKDAYS.map((wd) => (
          <View key={wd} style={calStyles.cell}>
            <Text style={calStyles.weekdayLabel}>{wd}</Text>
          </View>
        ))}
      </View>

      {/* 日期格子 */}
      {chunk(cells, 7).map((row, ri) => (
        <View key={ri} style={calStyles.row}>
          {row.map((day, di) => {
            if (day === null) {
              return <View key={di} style={calStyles.cell} />;
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const marking = markedDates[dateStr];
            const isToday = !!marking?.selected;
            const hasEntry = !!marking?.marked;

            return (
              <TouchableOpacity
                key={di}
                style={[
                  calStyles.cell,
                  calStyles.dayCell,
                  isToday && calStyles.dayCellToday,
                ]}
                onPress={() => onDayPress({ year, month: month + 1, day })}
                activeOpacity={0.7}
              >
                <Text style={[calStyles.dayText, isToday && calStyles.dayTextToday]}>
                  {day}
                </Text>
                {hasEntry && <View style={[calStyles.dot, isToday && calStyles.dotWhite]} />}
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
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [listFilter, setListFilter] = useState<ListFilter>('all');

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setSettingsOpen(true)}
          style={styles.headerGear}
          activeOpacity={0.7}
        >
          <Text style={styles.headerGearText}>⚙</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  async function loadEntries() {
    setLoading(true);
    const data = await listEntries();
    setEntries(data);
    setLoading(false);
  }

  const markedDates = useMemo(() => {
    const result: Record<string, MarkedDay> = {};
    entries.forEach((entry) => {
      const key = toDateString(entry.createdAt);
      result[key] = { marked: true };
    });
    const todayStr = toDateString(Date.now());
    result[todayStr] = {
      ...(result[todayStr] || {}),
      selected: true,
      marked: result[todayStr]?.marked ?? false,
    };
    return result;
  }, [entries]);

  const handleDayPress = useCallback((day: DayInfo) => {
    const d = new Date(day.year, day.month - 1, day.day);
    navigation.navigate('Day', { dateTimestamp: d.getTime() });
  }, [navigation]);

  const handleMonthChange = useCallback((year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  }, []);

  // 所有日记按时间倒序
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.createdAt - a.createdAt),
    [entries]
  );

  // 根据 filter 截取
  const displayedEntries = useMemo(() => {
    switch (listFilter) {
      case 'recent3':  return sortedEntries.slice(0, 3);
      case 'recent10': return sortedEntries.slice(0, 10);
      case 'all':      return sortedEntries;
    }
  }, [sortedEntries, listFilter]);

  const sectionLabel =
    listFilter === 'recent3'  ? '最近 3 篇' :
    listFilter === 'recent10' ? '最近 10 篇' :
    '全部日记';

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={displayedEntries}
        keyExtractor={(item) => item.id}
        style={styles.container}
        ListHeaderComponent={
          <View>
            <CustomCalendar
              year={currentYear}
              month={currentMonth}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              onHeaderPress={() => setMonthPickerVisible(true)}
            />

            {/* 列表标题 + 筛选 Tab */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {sectionLabel}（{displayedEntries.length} 篇）
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
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>还没有日记，点击日期开始写吧！</Text>
        }
        renderItem={({ item }) => {
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
              <Text style={styles.entryDate}>{label}</Text>
              <Text style={styles.entryPreview}>{preview}</Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      <SettingsDrawer visible={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <MonthPickerModal
        visible={monthPickerVisible}
        year={currentYear}
        month={currentMonth}
        onClose={() => setMonthPickerVisible(false)}
        onSelect={(y, m) => {
          setCurrentYear(y);
          setCurrentMonth(m);
        }}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const calStyles = StyleSheet.create({
  calendar: {
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  arrowBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  arrowText: {
    fontSize: 28,
    color: '#4CAF50',
    lineHeight: 34,
  },
  headerTitleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  weekdayLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  dayCell: {
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dayCellToday: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dayText: {
    fontSize: 15,
    color: '#333',
  },
  dayTextToday: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginTop: 2,
  },
  dotWhite: {
    backgroundColor: '#fff',
  },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    elevation: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 20,
  },
  yearArrow: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  yearArrowText: {
    fontSize: 24,
    color: '#4CAF50',
    lineHeight: 30,
  },
  yearText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 80,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  monthCell: {
    width: '22%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  monthCellSelected: {
    backgroundColor: '#4CAF50',
  },
  monthText: {
    fontSize: 15,
    color: '#333',
  },
  monthTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#666',
  },
});

const drawerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  panel: {
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#4CAF50',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 22,
    color: '#fff',
    lineHeight: 26,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLabel: {
    fontSize: 15,
    color: '#333',
  },
  menuValue: {
    fontSize: 13,
    color: '#888',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerGear: {
    marginRight: 4,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerGearText: {
    fontSize: 20,
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterTabActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterTabText: {
    fontSize: 12,
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  listContent: { paddingBottom: 24 },
  entryCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  entryDate: { fontSize: 12, color: '#888', marginBottom: 5 },
  entryPreview: { fontSize: 14, color: '#333', lineHeight: 21 },
});
