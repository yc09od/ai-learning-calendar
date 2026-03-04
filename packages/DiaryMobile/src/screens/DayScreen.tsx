import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Entry } from '@diary/shared/types';
import { listEntries, createEntry, updateEntry, updateMood, deleteEntry } from '../storage/entryStorage';
import { DayScreenProps } from '../types/navigation';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const MOODS = [
  '😊','😄','😁','😍','🥰','😌','😎','🤩',
  '😔','😢','😭','😤','😠','😰','😨','😱',
  '😴','🥱','🤔','🤗','😲','🥳','😏','🙄',
];

function isSameDay(ts1: number, ts2: number): boolean {
  const a = new Date(ts1);
  const b = new Date(ts2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Mood Picker ──────────────────────────────────────────────────────────────

function MoodPicker({ value, onChange }: { value: string | null; onChange: (m: string | null) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[mpStyles.btn, value ? mpStyles.btnSelected : mpStyles.btnEmpty]}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={value ? mpStyles.emojiText : mpStyles.plusText}>{value ?? '+'}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={mpStyles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={mpStyles.panel} onPress={() => {}}>
            <Text style={mpStyles.title}>选择心情</Text>
            {value && (
              <TouchableOpacity
                onPress={() => { onChange(null); setOpen(false); }}
                style={mpStyles.clearBtn}
                activeOpacity={0.7}
              >
                <Text style={mpStyles.clearText}>× 清除心情</Text>
              </TouchableOpacity>
            )}
            <View style={mpStyles.grid}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[mpStyles.emojiBtn, m === value && mpStyles.emojiBtnSelected]}
                  onPress={() => { onChange(m); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={mpStyles.emojiItem}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={mpStyles.cancelBtn} onPress={() => setOpen(false)} activeOpacity={0.7}>
              <Text style={mpStyles.cancelText}>取消</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const mpStyles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEmpty: {
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#fafafa',
  },
  btnSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  plusText: { fontSize: 18, color: '#aaa' },
  emojiText: { fontSize: 22 },
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
    marginBottom: 12,
  },
  clearBtn: { marginBottom: 10 },
  clearText: { fontSize: 13, color: '#f44336' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  emojiBtnSelected: {
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  emojiItem: { fontSize: 22 },
  cancelBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#666' },
});

// ─── Day Screen ───────────────────────────────────────────────────────────────

export default function DayScreen({ route, navigation }: DayScreenProps) {
  const { dateTimestamp } = route.params;
  const date = new Date(dateTimestamp);
  const dateLabel = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${WEEKDAYS[date.getDay()]}`;

  const [dayEntries, setDayEntries] = useState<Entry[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: dateLabel });
  }, [navigation, dateLabel]);

  useEffect(() => {
    loadDayEntries();
  }, []);

  async function loadDayEntries() {
    const all = await listEntries();
    const filtered = all
      .filter((e) => isSameDay(e.createdAt, dateTimestamp))
      .sort((a, b) => b.createdAt - a.createdAt);
    setDayEntries(filtered);
  }

  function dateStamp(): number {
    const now = new Date();
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    ).getTime();
  }

  async function handleSave() {
    if (!newContent.trim()) return;
    await createEntry(newContent.trim(), dateStamp(), newMood || undefined);
    setNewContent('');
    setNewMood(null);
    await loadDayEntries();
  }

  async function handleDelete(id: string) {
    Alert.alert('删除日记', '确定要删除这篇日记吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(id);
          await loadDayEntries();
        },
      },
    ]);
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditContent(entry.content);
    setEditMood(entry.mood ?? null);
  }

  async function handleUpdate() {
    if (!editingId || !editContent.trim()) return;
    await updateEntry(editingId, editContent.trim());
    await updateMood(editingId, editMood);
    setEditingId(null);
    setEditContent('');
    setEditMood(null);
    await loadDayEntries();
  }

  // Memoized renderItem. Deps include editing state so the editing form
  // updates in place without re-mounting all items.
  const renderItem = useCallback(({ item }: { item: Entry }) => {
    const timeStr = new Date(item.createdAt).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const isEditing = editingId === item.id;
    return (
      <View style={styles.entryCard}>
        <Text style={styles.entryTime}>{timeStr}</Text>
        {isEditing ? (
          <View>
            <TextInput
              value={editContent}
              onChangeText={setEditContent}
              multiline
              autoFocus
              style={[styles.input, styles.editInput]}
              textAlignVertical="top"
            />
            <View style={styles.rowActions}>
              <MoodPicker value={editMood} onChange={setEditMood} />
              <TouchableOpacity
                style={[styles.btn, styles.btnGreen, styles.btnSmall]}
                onPress={handleUpdate}
              >
                <Text style={styles.btnText}>保存</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnGray, styles.btnSmall]}
                onPress={() => setEditingId(null)}
              >
                <Text style={styles.btnText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.contentRow}>
              {item.mood ? <Text style={styles.moodEmoji}>{item.mood}</Text> : null}
              <Text style={styles.entryContent}>{item.content}</Text>
            </View>
            <View style={styles.rowActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnBlue, styles.btnSmall]}
                onPress={() => startEdit(item)}
              >
                <Text style={styles.btnText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnRed, styles.btnSmall]}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.btnText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, editContent, editMood]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/*
        Input area rendered outside FlatList.
        Putting inline JSX in ListHeaderComponent causes FlatList to
        re-measure the header on every keystroke → layout loop → freeze.
      */}
      <View style={styles.inputArea}>
        <TextInput
          value={newContent}
          onChangeText={setNewContent}
          placeholder="写下这一天的故事..."
          placeholderTextColor="#bbb"
          multiline
          style={styles.input}
          textAlignVertical="top"
        />
        <View style={styles.saveRow}>
          <MoodPicker value={newMood} onChange={setNewMood} />
          <TouchableOpacity style={[styles.btn, styles.btnGreen, styles.btnFlex]} onPress={handleSave}>
            <Text style={styles.btnText}>保存</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={dayEntries}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>今天还没有日记，写下第一篇吧！</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inputArea: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  editInput: { minHeight: 80, marginTop: 8 },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  btn: {
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFlex: { flex: 1 },
  btnSmall: { paddingVertical: 5, paddingHorizontal: 12 },
  btnGreen: { backgroundColor: '#4CAF50' },
  btnGray: { backgroundColor: '#9e9e9e' },
  btnBlue: { backgroundColor: '#2196F3' },
  btnRed: { backgroundColor: '#f44336' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  listContent: { paddingBottom: 40 },
  entryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  entryTime: { fontSize: 12, color: '#aaa', marginBottom: 6 },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  moodEmoji: { fontSize: 24, lineHeight: 28 },
  entryContent: { fontSize: 15, color: '#333', lineHeight: 22, flex: 1 },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
