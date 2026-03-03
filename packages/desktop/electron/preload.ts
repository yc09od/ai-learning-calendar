import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  createEntry: (content: string, createdAt?: number) => ipcRenderer.invoke('db:createEntry', content, createdAt),
  listEntries: () => ipcRenderer.invoke('db:listEntries'),
  updateEntry: (id: string, content: string) =>
    ipcRenderer.invoke('db:updateEntry', id, content),
  deleteEntry: (id: string) => ipcRenderer.invoke('db:deleteEntry', id),
});
