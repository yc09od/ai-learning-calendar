import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  createEntry: (content: string, createdAt?: number, mood?: string) =>
    ipcRenderer.invoke('db:createEntry', content, createdAt, mood),
  listEntries: () => ipcRenderer.invoke('db:listEntries'),
  updateEntry: (id: string, content: string) =>
    ipcRenderer.invoke('db:updateEntry', id, content),
  updateMood: (id: string, mood: string | null) =>
    ipcRenderer.invoke('db:updateMood', id, mood),
  deleteEntry: (id: string) => ipcRenderer.invoke('db:deleteEntry', id),
});
