import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entry } from '@diary/shared/types';

const STORAGE_KEY = 'diary_entries';

async function readData(): Promise<Entry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Entry[];
  } catch {
    return [];
  }
}

async function writeData(entries: Entry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function createEntry(content: string, createdAt?: number): Promise<Entry> {
  const entries = await readData();
  const now = Date.now();
  const entry: Entry = {
    id: now.toString(),
    content,
    createdAt: createdAt ?? now,
    updatedAt: now,
  };
  entries.unshift(entry);
  await writeData(entries);
  return entry;
}

export async function listEntries(): Promise<Entry[]> {
  const entries = await readData();
  return entries.filter((e) => !e.deletedAt);
}

export async function updateEntry(id: string, content: string): Promise<void> {
  const entries = await readData();
  const entry = entries.find((e) => e.id === id);
  if (entry) {
    entry.content = content;
    entry.updatedAt = Date.now();
    await writeData(entries);
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const entries = await readData();
  const entry = entries.find((e) => e.id === id);
  if (entry) {
    entry.deletedAt = Date.now();
    await writeData(entries);
  }
}
