好主意!我来生成一份详细的技术规格文档,你可以直接发给 Claude Code 让它执行。让我直接把内容输出给你,你复制后发给 Claude Code:

---

# 日记 APP 开发规格文档 - 给 Claude Code 的指令

## 项目概述
创建一个跨平台日记应用:
- **桌面版**: Electron (Windows + Linux)  
- **移动版**: React Native (Android)
- **存储**: 纯本地 SQLite,无云同步
- **核心功能**: 语音转文字 + AI 辅助写作

## 第一阶段任务 (请 Claude Code 执行)

### 1. 初始化 Monorepo 项目

```bash
# 创建项目结构
mkdir diary-app && cd diary-app
pnpm init
mkdir -p packages/shared/src/{db,ai,types,utils}
mkdir -p packages/desktop/{electron,src/components,src/store,src/styles}
```

### 2. 配置文件

**pnpm-workspace.yaml**
```yaml
packages:
  - 'packages/*'
```

**package.json (root)**
```json
{
  "name": "diary-app",
  "private": true,
  "scripts": {
    "dev:desktop": "pnpm --filter @diary/desktop dev"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "turbo": "^1.11.0"
  }
}
```

### 3. Shared Package 代码

**packages/shared/package.json**
```json
{
  "name": "@diary/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

**packages/shared/src/types/index.ts**
```typescript
export interface Entry {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  voiceTranscription?: string;
  aiEnhanced?: string;
  mood?: string;
  deletedAt?: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface Settings {
  aiModel: 'ollama' | 'claude';
  ollamaUrl: string;
  claudeApiKey?: string;
  voiceLanguage: 'zh-CN' | 'en-US';
}
```

**packages/shared/src/db/schema.ts**
```typescript
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  voice_transcription TEXT,
  ai_enhanced TEXT,
  mood TEXT,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_entries_created ON entries(created_at DESC);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
```

**packages/shared/src/ai/ollama.ts**
```typescript
export class OllamaAI {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async enhanceDiary(content: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        prompt: `请将以下口语化的日记内容润色,使其更加流畅和有文采,保持原意:\n\n${content}`,
        stream: false,
      }),
    });
    const data = await response.json();
    return data.response;
  }

  async analyzeMood(content: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        prompt: `分析情绪,只返回一个中文词(开心/难过/平静/焦虑):\n\n${content}`,
        stream: false,
      }),
    });
    const data = await response.json();
    return data.response.trim();
  }
}
```

### 4. Desktop Package

**packages/desktop/package.json**
```json
{
  "name": "@diary/desktop",
  "version": "1.0.0",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder"
  },
  "dependencies": {
    "@diary/shared": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "better-sqlite3": "^9.2.2",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/better-sqlite3": "^7.6.8",
    "@vitejs/plugin-react": "^4.2.1",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vite-plugin-electron": "^0.28.0"
  }
}
```

**packages/desktop/electron/main.ts**
```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
import { SCHEMA } from '@diary/shared/db/schema';

let mainWindow: BrowserWindow | null = null;
let db: Database.Database;

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

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'diary.db');
  db = new Database(dbPath);
  db.exec(SCHEMA);
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();
});

// IPC handlers
ipcMain.handle('db:createEntry', async (_, content: string) => {
  const id = Date.now().toString();
  const now = Date.now();
  db.prepare(
    'INSERT INTO entries (id, content, created_at, updated_at) VALUES (?, ?, ?, ?)'
  ).run(id, content, now, now);
  return { id, content, createdAt: now, updatedAt: now };
});

ipcMain.handle('db:listEntries', async () => {
  return db.prepare(
    'SELECT * FROM entries WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 50'
  ).all();
});

ipcMain.handle('db:updateEntry', async (_, id: string, content: string) => {
  db.prepare(
    'UPDATE entries SET content = ?, updated_at = ? WHERE id = ?'
  ).run(content, Date.now(), id);
});
```

**packages/desktop/electron/preload.ts**
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  createEntry: (content: string) => ipcRenderer.invoke('db:createEntry', content),
  listEntries: () => ipcRenderer.invoke('db:listEntries'),
  updateEntry: (id: string, content: string) => 
    ipcRenderer.invoke('db:updateEntry', id, content),
});
```

**packages/desktop/src/App.tsx**
```typescript
import { useState, useEffect } from 'react';
import { Entry } from '@diary/shared/types';

declare global {
  interface Window {
    electronAPI: {
      createEntry: (content: string) => Promise<Entry>;
      listEntries: () => Promise<Entry[]>;
      updateEntry: (id: string, content: string) => Promise<void>;
    };
  }
}

function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [content, setContent] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    const data = await window.electronAPI.listEntries();
    setEntries(data);
  }

  async function handleSave() {
    await window.electronAPI.createEntry(content);
    setContent('');
    loadEntries();
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>📔 日记 APP</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下今天的故事..."
          style={{ width: '100%', height: '200px', padding: '10px', fontSize: '16px' }}
        />
        <button onClick={handleSave} style={{ marginTop: '10px', padding: '10px 20px' }}>
          保存日记
        </button>
      </div>

      <h2>最近日记</h2>
      {entries.map((entry) => (
        <div key={entry.id} style={{ 
          border: '1px solid #ddd', 
          padding: '15px', 
          marginBottom: '10px',
          borderRadius: '5px' 
        }}>
          <small>{new Date(entry.createdAt).toLocaleString('zh-CN')}</small>
          <p>{entry.content}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
```

**packages/desktop/vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';

export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: 'electron/main.ts',
    }),
  ],
});
```

## 使用说明

复制以上内容,然后在 Claude Code 中执行:

```
请按照上述规格创建 diary-app 项目,包括:
1. 创建完整的文件结构
2. 安装所有依赖 (pnpm install)
3. 运行开发服务器 (pnpm dev:desktop)
4. 确保 Electron 窗口能正常打开并创建/显示日记
```

这是第一阶段的基础版本,后续可以加入:
- AI 润色功能 (Ollama)
- 语音转文字 (whisper.cpp 或 Web Speech API)
- 更好看的 UI
- 移动端 React Native 版本

需要我详细解释任何部分吗?