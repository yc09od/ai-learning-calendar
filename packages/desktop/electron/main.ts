import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { Entry } from '@diary/shared/types';

let mainWindow: BrowserWindow | null = null;
let dbPath: string;

interface DiaryData {
  entries: Entry[];
}

function readData(): DiaryData {
  try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { entries: [] };
  }
}

function writeData(data: DiaryData): void {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  dbPath = path.join(app.getPath('userData'), 'diary.json');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('db:createEntry', async (_, content: string, createdAt?: number, mood?: string): Promise<Entry> => {
  const data = readData();
  const now = Date.now();
  const entry: Entry = {
    id: now.toString(),
    content,
    createdAt: createdAt ?? now,
    updatedAt: now,
    mood: mood || undefined,
  };
  data.entries.unshift(entry);
  writeData(data);
  return entry;
});

ipcMain.handle('db:listEntries', async (): Promise<Entry[]> => {
  const data = readData();
  return data.entries.filter((e) => !e.deletedAt);
});

ipcMain.handle('db:updateEntry', async (_, id: string, content: string): Promise<void> => {
  const data = readData();
  const entry = data.entries.find((e) => e.id === id);
  if (entry) {
    entry.content = content;
    entry.updatedAt = Date.now();
    writeData(data);
  }
});

ipcMain.handle('db:updateMood', async (_, id: string, mood: string | null): Promise<void> => {
  const data = readData();
  const entry = data.entries.find((e) => e.id === id);
  if (entry) {
    entry.mood = mood ?? undefined;
    entry.updatedAt = Date.now();
    writeData(data);
  }
});

ipcMain.handle('db:deleteEntry', async (_, id: string): Promise<void> => {
  const data = readData();
  const entry = data.entries.find((e) => e.id === id);
  if (entry) {
    entry.deletedAt = Date.now();
    writeData(data);
  }
});
