import React, { useState, useEffect, useLayoutEffect } from 'react';
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
} from 'react-native';
import { Entry } from '@diary/shared/types';
import { listEntries, createEntry, updateEntry, deleteEntry } from '../storage/entryStorage';
import { DayScreenProps } from '../types/navigation';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function isSameDay(ts1: number, ts2: number): boolean {
  const a = new Date(ts1);
  const b = new Date(ts2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DayScreen({ route, navigation }: DayScreenProps) {
  const { dateTimestamp } = route.params;
  const date = new Date(dateTimestamp);
  const dateLabel = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${WEEKDAYS[date.getDay()]}`;

  const [dayEntries, setDayEntries] = useState<Entry[]>([]);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

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
    await createEntry(newContent.trim(), dateStamp());
    setNewContent('');
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

  async function handleUpdate() {
    if (!editingId || !editContent.trim()) return;
    await updateEntry(editingId, editContent.trim());
    setEditingId(null);
    setEditContent('');
    await loadDayEntries();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={dayEntries}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
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
            <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={handleSave}>
              <Text style={styles.btnText}>保存</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>今天还没有日记，写下第一篇吧！</Text>
        }
        renderItem={({ item }) => {
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
                  <Text style={styles.entryContent}>{item.content}</Text>
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnBlue, styles.btnSmall]}
                      onPress={() => {
                        setEditingId(item.id);
                        setEditContent(item.content);
                      }}
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
        }}
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
  btn: {
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnSmall: { paddingVertical: 5, paddingHorizontal: 12, marginTop: 0 },
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
  entryContent: { fontSize: 15, color: '#333', lineHeight: 22 },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    justifyContent: 'flex-end',
  },
});
